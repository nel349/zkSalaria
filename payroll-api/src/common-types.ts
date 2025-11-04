import { type MidnightProviders } from '@midnight-ntwrk/midnight-js-types';
import { type FoundContract } from '@midnight-ntwrk/midnight-js-contracts';
import {
  type PayrollPrivateState,
  type Contract,
} from '@zksalaria/payroll-contract';

export type AccountId = string;

export type PayrollContract = Contract<PayrollPrivateState>;

// Circuit result types for Boolean-returning circuits
export interface CircuitResults<T, R> {
  private: {
    input: any;
    output: any;
    result: R;
    newCoins: any[];
    nextPrivateState: T;
    nextZswapLocalState: any;
    privateTranscriptOutputs: any[];
    unprovenTx: any;
  };
  public: {
    blockHash: string;
    blockHeight: number;
    nextContractState: any;
    partitionedTranscript: any[];
    publicTranscript: any[];
    status: string;
    tx: any;
    txHash: string;
    txId: string;
  };
}

// Explicit circuit call types (workaround for empty witnesses type inference issue)
export interface PayrollCircuitCalls {
  mint_tokens(amount: bigint): Promise<void>;
  deposit_company_funds(amount: bigint): Promise<void>;
  add_employee(employeeId: Uint8Array): Promise<void>;
  withdraw_employee_salary(employeeId: Uint8Array, amount: bigint): Promise<void>;
  pay_employee(employeeId: Uint8Array, salaryAmount: bigint): Promise<void>;
  grant_income_disclosure(employeeId: Uint8Array, lenderId: Uint8Array, minThreshold: bigint, expiresIn: bigint): Promise<void>;
  grant_employment_disclosure(employeeId: Uint8Array, verifierId: Uint8Array, expiresIn: bigint): Promise<void>;
  grant_audit_disclosure(companyId: Uint8Array, auditorId: Uint8Array, expiresIn: bigint): Promise<void>;
  revoke_disclosure(grantorId: Uint8Array, granteeId: Uint8Array, permissionType: bigint): Promise<void>;
  update_employment_status(employeeId: Uint8Array, newStatus: bigint): Promise<void>;
  verify_employment(employeeId: Uint8Array, verifierId: Uint8Array): Promise<Uint8Array>;
  create_recurring_payment(
    employeeId: Uint8Array,
    amount: bigint,
    frequency: bigint,
    startDate: bigint,
    endDate: bigint,
    nextPaymentDate: bigint,
    paymentDayOfMonth1: bigint,
    paymentDayOfMonth2: bigint,
    paymentDayOfWeek: bigint
  ): Promise<void>;
  pause_recurring_payment(recurringPaymentId: Uint8Array): Promise<void>;
  resume_recurring_payment(recurringPaymentId: Uint8Array, nextPaymentDate: bigint): Promise<void>;
  edit_recurring_payment(recurringPaymentId: Uint8Array, newAmount: bigint): Promise<void>;
  process_recurring_payment(recurringPaymentId: Uint8Array): Promise<void>;
  register_trusted_verifier(verifierPubkey: Uint8Array): Promise<CircuitResults<PayrollPrivateState, boolean>>;
  submit_income_proof(
    employeeId: Uint8Array,
    proofType: bigint,
    thresholdMin: bigint,
    thresholdMax: bigint,
    txids: Uint8Array[],
    merkleRoot: Uint8Array,
    attestationHash: Uint8Array,
    verifierPubkey: Uint8Array,
    timestamp: bigint,
    expiresIn: bigint
  ): Promise<CircuitResults<PayrollPrivateState, boolean>>;
  verify_income_proof(employeeId: Uint8Array, requiredProofType: bigint, requiredThreshold: bigint): Promise<CircuitResults<PayrollPrivateState, boolean>>;
  update_timestamp(newTimestamp: bigint): Promise<void>;
}

// Auto-derive circuit keys from contract (bank-api pattern)
export type PayrollCircuitKeys =
  | 'deposit_company_funds'
  | 'add_employee'
  | 'pay_employee'
  | 'withdraw_employee_salary'
  | 'mint_tokens'
  | 'update_timestamp'
  | 'create_recurring_payment'
  | 'pause_recurring_payment'
  | 'resume_recurring_payment'
  | 'edit_recurring_payment'
  | 'process_recurring_payment'
  | 'batch_pay_employees'
  | 'grant_income_disclosure'
  | 'grant_employment_disclosure'
  | 'grant_audit_disclosure'
  | 'revoke_disclosure'
  | 'update_employment_status'
  | 'verify_employment'
  | 'register_trusted_verifier'
  | 'submit_income_proof'
  | 'verify_income_proof';

export type PayrollProviders = MidnightProviders<PayrollCircuitKeys, AccountId, PayrollPrivateState>;

export type DeployedPayrollContract = FoundContract<PayrollContract>;

export type PayrollTransaction = {
  type: 'register_company' | 'add_employee' | 'deposit' | 'withdraw' | 'pay_salary' | 'mint_tokens';
  amount?: bigint;
  timestamp: Date;
  companyId?: string;
  employeeId?: string;
  companyName?: string;
};

export type DetailedPayrollTransaction = {
  readonly type: 'register_company' | 'add_employee' | 'deposit' | 'withdraw' | 'pay_salary' | 'mint_tokens';
  readonly amount?: bigint;
  readonly timestamp: Date;
  readonly companyId?: string;
  readonly employeeId?: string;
  readonly companyName?: string;
  readonly txHash?: string;
  readonly blockHeight?: bigint;
};

export type UserAction = {
  transaction: PayrollTransaction | undefined;
  cancelledTransaction: PayrollTransaction | undefined;
};

export type PayrollDerivedState = {
  readonly totalCompanies: bigint;
  readonly totalEmployees: bigint;
  readonly totalPayments: bigint;
  readonly totalSupply: bigint;
  readonly currentTimestamp: number;
  readonly lastTransaction?: PayrollTransaction;
  readonly lastCancelledTransaction?: PayrollTransaction;
};

export const emptyPayrollState: PayrollDerivedState = {
  totalCompanies: 0n,
  totalEmployees: 0n,
  totalPayments: 0n,
  totalSupply: 0n,
  currentTimestamp: 0,
  lastTransaction: undefined,
  lastCancelledTransaction: undefined,
};

export type CompanyInfo = {
  companyId: string;
  exists: boolean;
  companyName?: string; // Only present if exists=true
  balance?: bigint; // Encrypted balance - requires decryption
};

export type EmployeeInfo = {
  employeeId: string;
  exists: boolean;
  balance?: bigint; // Encrypted balance - requires decryption
  paymentHistoryCount?: number;
};
