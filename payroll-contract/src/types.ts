// Shared types for zkSalaria payroll system
// Used by: contract, API, UI

// Payment types (matches PayrollCommons.compact)
export enum PaymentType {
  SALARY = 0,
  ADVANCE = 1,
  BONUS = 2
}

// Payment record structure (matches PayrollCommons.compact PaymentRecord)
// NOTE: All numeric types use bigint to match Compact runtime expectations
export interface PaymentRecord {
  timestamp: bigint;  // Uint<32> in Compact
  amount: bigint;     // Uint<64> in Compact
  company_id: Uint8Array; // Bytes<32> in Compact
  payment_type: bigint;   // Uint<8> in Compact (0=salary, 1=advance, 2=bonus)
}

// Private state structure for payroll system
// NOTE: Balances are now encrypted on public ledger (bank contract pattern)
// Only payment history remains in private state (for ZKML training)
export interface PayrollPrivateState {
  readonly employeePaymentHistory: Map<string, PaymentRecord[]>;
}

// Company data
export interface CompanyData {
  companyId: string;
  companyName: string;
  registeredAt: number;
}

// Employee data
export interface EmployeeData {
  employeeId: string;
  companyId: string;
  registeredAt: number;
}

// Balance info (for API responses)
export interface BalanceInfo {
  balance: bigint;
  lastUpdated: number;
}

// Payment history info (for API responses)
export interface PaymentHistoryInfo {
  payments: PaymentRecord[];
  totalPayments: number;
  averageAmount: bigint;
  lastPaymentDate: number;
}

// Credit score threshold (for ZKML)
export interface CreditScoreThreshold {
  threshold: number;
  description: string;
}

export const CREDIT_THRESHOLDS: Record<string, CreditScoreThreshold> = {
  EXCELLENT: { threshold: 750, description: 'Excellent credit' },
  GOOD: { threshold: 680, description: 'Good credit' },
  FAIR: { threshold: 600, description: 'Fair credit' },
  POOR: { threshold: 500, description: 'Poor credit' }
};

// Transaction status
export enum TransactionStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  FAILED = 'failed'
}

// Circuit names (for API calls)
export enum CircuitName {
  REGISTER_COMPANY = 'register_company',
  ADD_EMPLOYEE = 'add_employee',
  DEPOSIT_COMPANY_FUNDS = 'deposit_company_funds',
  WITHDRAW_EMPLOYEE_SALARY = 'withdraw_employee_salary',
  PAY_EMPLOYEE = 'pay_employee',
  UPDATE_TIMESTAMP = 'update_timestamp',
  MINT_TOKENS = 'mint_tokens'
}
