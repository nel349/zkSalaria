import { PayrollAPI, type PayrollProviders, type CompanyInfo, type EmployeeInfo } from '@zksalaria/payroll-api';
import { listCompanies, getCurrentCompany } from '../utils/CompaniesLocalState';
import { listEmployers } from '../utils/EmployerContractsLocalState';
import pino from 'pino';

export type UserRole = 'new' | 'company' | 'employee' | 'both' | 'auditor';

export interface RoleDetectionResult {
  role: UserRole;
  isCompany: boolean;
  isEmployee: boolean;
  isAuditor?: boolean;
  companyData?: CompanyInfo;
  employeeData?: EmployeeInfo;
  auditorPubkey?: string;
}

// Create pino logger for role detection
const logger = pino({
  name: 'roleDetection',
  level: 'info',
  browser: {
    asObject: false,
  },
});

/**
 * Detect user role by querying the Payroll smart contract
 *
 * Strategy:
 * 1. Check localStorage for stored contract address
 * 2. If found, connect to contract and query role
 * 3. If not found, treat as new user (no contract deployed/added yet)
 *
 * @param providers - Payroll API providers
 * @param walletAddress - User's wallet address
 * @returns Role detection result
 */
export const detectUserRole = async (
  providers: PayrollProviders,
  walletAddress: string
): Promise<RoleDetectionResult> => {
  console.log(`[RoleDetection] Detecting role for address: ${walletAddress}`);

  // Add timeout to prevent hanging forever
  const timeoutMs = 30000; // 30 seconds
  const timeout = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error(`Role detection timed out after ${timeoutMs}ms`)), timeoutMs);
  });

  return Promise.race([detectUserRoleInternal(providers, walletAddress), timeout]);
};

const detectUserRoleInternal = async (
  providers: PayrollProviders,
  walletAddress: string
): Promise<RoleDetectionResult> => {

  try {
    // PRIORITY 1: Check for auditor role first (explicit role markers)
    // Auditors have localStorage markers but shouldn't be confused with company owners
    const auditorApplicationId = localStorage.getItem('auditorApplicationId');
    const auditorPubkey = localStorage.getItem('auditorPubkey');
    const auditorApplicationStatus = localStorage.getItem('auditorApplicationStatus');

    if (auditorApplicationId || auditorPubkey || auditorApplicationStatus) {
      console.log('[RoleDetection] Auditor detected - found auditor localStorage markers:', {
        applicationId: auditorApplicationId,
        pubkey: auditorPubkey ? `${auditorPubkey.slice(0, 8)}...` : null,
        status: auditorApplicationStatus,
      });
      return {
        role: 'auditor',
        isCompany: false,
        isEmployee: false,
        isAuditor: true,
        auditorPubkey: auditorPubkey || undefined,
      };
    }

    // PRIORITY 2: Check for company/employee roles
    // Get all companies and employers from local storage
    const companies = listCompanies();
    const employers = listEmployers(walletAddress);

    console.log('[RoleDetection] LocalStorage check:', {
      companiesCount: companies.length,
      employersCount: employers.length,
      companies: companies,
      employers: employers,
      rawLocalStorage: localStorage.getItem('payroll-ui.companies'),
    });

    if (companies.length === 0 && employers.length === 0) {
      console.log('[RoleDetection] No companies or employers found - treating as new user');
      return {
        role: 'new',
        isCompany: false,
        isEmployee: false,
      };
    }

    console.log(`[RoleDetection] Found ${companies.length} companies and ${employers.length} employers, checking roles...`);

    // Check role across ALL companies (user might be company admin in one, employee in another)
    let isCompanyInAny = false;
    let isEmployeeInAny = false;
    let lastCompanyData: CompanyInfo | null = null;
    let lastEmployeeData: EmployeeInfo | null = null;

    // Check all company contracts
    for (const company of companies) {
      try {
        console.log(`[RoleDetection] Checking company contract: ${company.contractAddress}`);
        console.log(`[RoleDetection] Company wallet address: ${company.walletAddress}`);
        console.log(`[RoleDetection] Current wallet address: ${walletAddress}`);

        console.log('[RoleDetection] Calling PayrollAPI.connect...');
        let api;
        try {
          api = await PayrollAPI.connect(
            providers,
            company.contractAddress,
            walletAddress,
            logger
          );
          console.log('[RoleDetection] PayrollAPI.connect succeeded');
        } catch (connectErr) {
          console.log('❌❌❌ [RoleDetection] PayrollAPI.connect FAILED ❌❌❌');
          console.log('Error:', connectErr);
          console.log('Error message:', connectErr instanceof Error ? connectErr.message : String(connectErr));

          // Check if this is a version mismatch error
          const errorMsg = connectErr instanceof Error ? connectErr.message : String(connectErr);
          if (errorMsg.includes('mismatched verifier keys') || errorMsg.includes('are undefined')) {
            console.log('⚠️ [RoleDetection] Contract version mismatch - treating as company owner');
            // This is an old contract version, but the user deployed it, so they're the owner
            isCompanyInAny = true;
            lastCompanyData = {
              companyId: company.walletAddress,
              exists: true,
              companyName: company.name,
            };
            // Don't throw - continue to next contract
            continue;
          }

          throw connectErr; // Re-throw other errors
        }

        console.log('[RoleDetection] API connected, calling getCompanyInfo and getEmployeeInfo...');

        const [companyData, employeeData] = await Promise.all([
          api.getCompanyInfo(walletAddress).catch((err) => {
            console.error('[RoleDetection] getCompanyInfo error:', err);
            return null;
          }),
          api.getEmployeeInfo(walletAddress).catch((err) => {
            console.error('[RoleDetection] getEmployeeInfo error:', err);
            return null;
          }),
        ]);

        console.log('[RoleDetection] Results:', {
          companyData,
          employeeData,
          companyExists: companyData?.exists,
          employeeExists: employeeData?.exists,
        });

        if (companyData?.exists) {
          isCompanyInAny = true;
          lastCompanyData = companyData;
        }
        if (employeeData?.exists) {
          isEmployeeInAny = true;
          lastEmployeeData = employeeData;
        }
      } catch (err) {
        console.log(`🔴🔴🔴 [RoleDetection] Failed to check contract ${company.contractAddress} 🔴🔴🔴`);
        console.log('Outer catch - Error:', err);
        console.log('Outer catch - Error message:', err instanceof Error ? err.message : String(err));
        console.log('Outer catch - Error stack:', err instanceof Error ? err.stack : 'no stack');
        // Continue checking other contracts
      }
    }

    // Check all employer contracts (where user is employee)
    for (const employer of employers) {
      try {
        console.log(`[RoleDetection] Checking employer contract: ${employer.contractAddress}`);
        const api = await PayrollAPI.connect(
          providers,
          employer.contractAddress,
          walletAddress,
          logger
        );

        const employeeData = await api.getEmployeeInfo(walletAddress).catch(() => null);

        if (employeeData?.exists) {
          isEmployeeInAny = true;
          lastEmployeeData = employeeData;
        }
      } catch (err) {
        console.error(`[RoleDetection] Failed to check employer contract ${employer.contractAddress}:`, err);
        console.error('[RoleDetection] Employer check error details:', {
          message: err instanceof Error ? err.message : String(err),
          stack: err instanceof Error ? err.stack : undefined,
          fullError: err,
        });
        // Continue checking other contracts
      }
    }

    let role: UserRole;
    if (isCompanyInAny && isEmployeeInAny) {
      role = 'both';
    } else if (isCompanyInAny) {
      role = 'company';
    } else if (isEmployeeInAny) {
      role = 'employee';
    } else {
      // Companies exist but user has no role in any - treat as new
      role = 'new';
    }

    console.log(`[RoleDetection] Role detected: ${role} (company: ${isCompanyInAny}, employee: ${isEmployeeInAny})`);

    return {
      role,
      isCompany: isCompanyInAny,
      isEmployee: isEmployeeInAny,
      companyData: lastCompanyData ?? undefined,
      employeeData: lastEmployeeData ?? undefined,
    };
  } catch (error) {
    console.log('💥💥💥 [RoleDetection] Error detecting role 💥💥💥');
    console.log('Final catch - Error:', error);
    console.log('Final catch - Error message:', error instanceof Error ? error.message : String(error));
    console.log('Final catch - Error stack:', error instanceof Error ? error.stack : 'no stack');
    // On error, treat as new user
    return {
      role: 'new',
      isCompany: false,
      isEmployee: false,
    };
  }
};
