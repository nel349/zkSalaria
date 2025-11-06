import { PayrollAPI, type PayrollProviders, type CompanyInfo, type EmployeeInfo } from '@zksalaria/payroll-api';
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
    // Check for stored contract address
    const storedContractAddress = localStorage.getItem('payroll_contract_address');

    if (!storedContractAddress) {
      console.log('[RoleDetection] No contract address found - treating as new user');
      return {
        role: 'new',
        isCompany: false,
        isEmployee: false,
      };
    }

    console.log(`[RoleDetection] Found contract address: ${storedContractAddress}`);

    // Connect to the stored contract
    const api = await PayrollAPI.connect(
      providers,
      storedContractAddress,
      walletAddress,
      logger
    );

    // Query both company and employee data
    const [companyData, employeeData] = await Promise.all([
      api.getCompanyInfo(walletAddress).catch(() => null),
      api.getEmployeeInfo(walletAddress).catch(() => null),
    ]);

    const isCompany = companyData?.exists ?? false;
    const isEmployee = employeeData?.exists ?? false;

    let role: UserRole;
    if (isCompany && isEmployee) {
      role = 'both';
    } else if (isCompany) {
      role = 'company';
    } else if (isEmployee) {
      role = 'employee';
    } else {
      // Contract exists but user has no role in it - treat as new
      role = 'new';
    }

    console.log(`[RoleDetection] Role detected: ${role} (company: ${isCompany}, employee: ${isEmployee})`);

    return {
      role,
      isCompany,
      isEmployee,
      companyData: companyData ?? undefined,
      employeeData: employeeData ?? undefined,
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
