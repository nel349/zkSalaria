import { type MidnightProviders } from '@midnight-ntwrk/midnight-js-types';
import { type FoundContract } from '@midnight-ntwrk/midnight-js-contracts';
import {
  type PayrollPrivateState,
  type Contract,
  type payrollWitnesses,
} from '@zksalaria/payroll-contract';

export type AccountId = string;

export type PayrollContract = Contract<PayrollPrivateState, typeof payrollWitnesses>;

// Auto-derive circuit keys from contract (bank-api pattern)
export type PayrollCircuitKeys = Exclude<keyof PayrollContract['impureCircuits'], number | symbol>;

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
  balance?: bigint; // Encrypted balance - requires decryption
};

export type EmployeeInfo = {
  employeeId: string;
  exists: boolean;
  balance?: bigint; // Encrypted balance - requires decryption
  paymentHistoryCount?: number;
};
