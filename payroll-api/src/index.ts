// Main API exports - following bank-api pattern
export {
  PayrollAPI,
  type DeployedPayrollAPI,
  type PayrollDerivedState,
  type PayrollProviders,
  type PayrollCircuitKeys,
  type AccountId,
  type UserAction,
  type PayrollTransaction,
  emptyPayrollState,
  type CompanyInfo,
  type EmployeeInfo,
} from './payroll-api';

// Re-export useful contract types
export {
  type PayrollPrivateState,
  type PaymentRecord,
  createPayrollPrivateState,
  payrollWitnesses,
} from '@zksalaria/payroll-contract';

// Re-export common types
export {
  type PayrollContract,
  type DeployedPayrollContract,
  type DetailedPayrollTransaction,
} from './common-types.js';

// Re-export utilities
export * as utils from './utils/index.js';

// Default export
export { PayrollAPI as default } from './payroll-api';
