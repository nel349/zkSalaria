import { PayrollAPI, type PayrollProviders, type CompanyInfo, type EmployeeInfo } from '@zksalaria/payroll-api';
import { listCompanies, getCurrentCompany } from '../utils/CompaniesLocalState';
import pino from 'pino';

export type UserRole = 'new' | 'company' | 'employee' | 'both';

export interface RoleDetectionResult {
  role: UserRole;
  isCompany: boolean;
  isEmployee: boolean;
  companyData?: CompanyInfo;
  employeeData?: EmployeeInfo;
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

  try {
    // Get all companies from new storage
    const companies = listCompanies();

    if (companies.length === 0) {
      console.log('[RoleDetection] No companies found - treating as new user');
      return {
        role: 'new',
        isCompany: false,
        isEmployee: false,
      };
    }

    console.log(`[RoleDetection] Found ${companies.length} companies, checking roles...`);

    // Check role across ALL companies (user might be company admin in one, employee in another)
    let isCompanyInAny = false;
    let isEmployeeInAny = false;
    let lastCompanyData: CompanyInfo | null = null;
    let lastEmployeeData: EmployeeInfo | null = null;

    for (const company of companies) {
      try {
        console.log(`[RoleDetection] Checking contract: ${company.contractAddress}`);
        const api = await PayrollAPI.connect(
          providers,
          company.contractAddress,
          walletAddress,
          logger
        );

        const [companyData, employeeData] = await Promise.all([
          api.getCompanyInfo(walletAddress).catch(() => null),
          api.getEmployeeInfo(walletAddress).catch(() => null),
        ]);

        if (companyData?.exists) {
          isCompanyInAny = true;
          lastCompanyData = companyData;
        }
        if (employeeData?.exists) {
          isEmployeeInAny = true;
          lastEmployeeData = employeeData;
        }
      } catch (err) {
        console.warn(`[RoleDetection] Failed to check contract ${company.contractAddress}:`, err);
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
    console.error('[RoleDetection] Error detecting role:', error);
    // On error, treat as new user
    return {
      role: 'new',
      isCompany: false,
      isEmployee: false,
    };
  }
};
