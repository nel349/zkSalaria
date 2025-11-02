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
  type RecurringPayment,
  createPayrollPrivateState,
  payrollWitnesses,
  // Payment constants
  PaymentType,
  PaymentStatus,
  RecurringPaymentStatus,
  RecurringPaymentFrequency,
  EmploymentStatus,
  PermissionType,
  // Additional shared types
  type CompanyData,
  type EmployeeData,
  type BalanceInfo,
  type PaymentHistoryInfo,
  type CreditScoreThreshold,
  CREDIT_THRESHOLDS,
  TransactionStatus,
  CircuitName,
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
