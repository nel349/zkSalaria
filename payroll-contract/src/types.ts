// Shared types for zkSalaria payroll system
// Used by: contract, API, UI

// Payment types (matches PayrollCommons.compact)
export enum PaymentType {
  SALARY = 0,
  ADVANCE = 1,
  BONUS = 2
}

// Employment status (matches PayrollCommons.compact)
export enum EmploymentStatus {
  INACTIVE = 0,
  ACTIVE = 1,
  TERMINATED = 2,
  ON_LEAVE = 3
}

// Recurring payment status (matches PayrollCommons.compact)
export enum RecurringPaymentStatus {
  ACTIVE = 0,
  PAUSED = 1,
  CANCELLED = 2
}

// Permission types for selective disclosure (matches PayrollCommons.compact)
export enum PermissionType {
  INCOME_RANGE = 0,
  EMPLOYMENT = 1,
  CREDIT_SCORE = 2,
  AUDIT = 3
}

// Payment record structure (matches PayrollCommons.compact PaymentRecord)
// NOTE: All numeric types use bigint to match Compact runtime expectations
// NOTE: Amounts are ENCRYPTED for privacy - employee decrypts locally for ZKML
export interface PaymentRecord {
  timestamp: bigint;  // Uint<32> in Compact
  encrypted_amount: Uint8Array;  // Bytes<32> in Compact (encrypted with employee key)
  company_id: Uint8Array; // Bytes<32> in Compact
  payment_type: bigint;   // Uint<8> in Compact (0=salary, 1=advance, 2=bonus)
}

// Recurring payment structure (matches PayrollCommons.compact RecurringPayment)
export interface RecurringPayment {
  recurring_payment_id: Uint8Array;  // Bytes<32> - Unique payment schedule ID
  company_id: Uint8Array;            // Bytes<32> - Which company
  employee_id: Uint8Array;           // Bytes<32> - Which employee
  encrypted_amount: Uint8Array;      // Bytes<32> - Encrypted payment amount (with employee key)
  frequency: bigint;                 // Uint<8> - 0=weekly, 1=bi-weekly, 2=monthly
  start_date: bigint;                // Uint<32> - Unix timestamp when payments begin
  end_date: bigint;                  // Uint<32> - Unix timestamp when payments end (0 = never)
  next_payment_date: bigint;         // Uint<32> - Next scheduled payment timestamp
  status: bigint;                    // Uint<8> - 0=active, 1=paused, 2=cancelled
  created_at: bigint;                // Uint<32> - Creation timestamp
  last_updated: bigint;              // Uint<32> - Last modification timestamp
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
  MINT_TOKENS = 'mint_tokens',
  // Employment verification circuits
  GRANT_INCOME_DISCLOSURE = 'grant_income_disclosure',
  GRANT_EMPLOYMENT_DISCLOSURE = 'grant_employment_disclosure',
  GRANT_AUDIT_DISCLOSURE = 'grant_audit_disclosure',
  REVOKE_DISCLOSURE = 'revoke_disclosure',
  UPDATE_EMPLOYMENT_STATUS = 'update_employment_status',
  VERIFY_EMPLOYMENT = 'verify_employment'
}
