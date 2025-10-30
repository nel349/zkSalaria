import { WitnessContext } from '@midnight-ntwrk/compact-runtime';
import type { Contract as ContractType, Witnesses } from './managed/payroll/contract/index.cjs';
import * as ContractModule from './managed/payroll/contract/index.cjs';
import type { PaymentRecord, PayrollPrivateState } from './types';

type Ledger = ContractModule.Ledger;

// Re-export contract types and functions
export * from './managed/payroll/contract/index.cjs';
export const ledger = ContractModule.ledger;
export const pureCircuits = ContractModule.pureCircuits;
export const { Contract } = ContractModule;
export type Contract<T, W extends Witnesses<T> = Witnesses<T>> = ContractType<T, W>;

// Re-export shared types
export * from './types';

// Create initial private state for payroll
export const createPayrollPrivateState = (): PayrollPrivateState => ({
  companyBalances: new Map(),
  employeeBalances: new Map(),
  employeePaymentHistory: new Map()
});

// Payroll witness functions
export const payrollWitnesses = {
  // Witness: Get employee payment history (for ZKML)
  employee_payment_history: (
    { privateState }: WitnessContext<Ledger, PayrollPrivateState>,
    employeeId: Uint8Array
  ): [PayrollPrivateState, any] => {
    const employeeIdStr = Buffer.from(employeeId).toString('hex');
    const history = privateState.employeePaymentHistory.get(employeeIdStr);

    // If no history exists, return what was previously stored or let the setter handle initialization
    if (!history) {
      // Return an empty vector - the circuit should have set this via set_employee_payment_history first
      return [privateState, []];
    }

    // Return the history as-is (it should already be in the correct format from the setter)
    return [privateState, history];
  },

  // Witness: Set employee payment history
  set_employee_payment_history: (
    { privateState }: WitnessContext<Ledger, PayrollPrivateState>,
    employeeId: Uint8Array,
    history: PaymentRecord[]
  ): [PayrollPrivateState, []] => {
    const employeeIdStr = Buffer.from(employeeId).toString('hex');
    const updatedHistory = new Map(privateState.employeePaymentHistory);
    updatedHistory.set(employeeIdStr, history);

    return [{
      ...privateState,
      employeePaymentHistory: updatedHistory
    }, []];
  },

  // Witness: Get employee balance
  employee_balance: (
    { privateState }: WitnessContext<Ledger, PayrollPrivateState>,
    employeeId: Uint8Array
  ): [PayrollPrivateState, bigint] => {
    const employeeIdStr = Buffer.from(employeeId).toString('hex');
    const balance = privateState.employeeBalances.get(employeeIdStr) || 0n;
    return [privateState, balance];
  },

  // Witness: Set employee balance
  set_employee_balance: (
    { privateState }: WitnessContext<Ledger, PayrollPrivateState>,
    employeeId: Uint8Array,
    balance: bigint
  ): [PayrollPrivateState, []] => {
    const employeeIdStr = Buffer.from(employeeId).toString('hex');
    const updatedBalances = new Map(privateState.employeeBalances);
    updatedBalances.set(employeeIdStr, balance);

    return [{
      ...privateState,
      employeeBalances: updatedBalances
    }, []];
  },

  // Witness: Get company balance
  company_balance: (
    { privateState }: WitnessContext<Ledger, PayrollPrivateState>,
    companyId: Uint8Array
  ): [PayrollPrivateState, bigint] => {
    const companyIdStr = Buffer.from(companyId).toString('hex');
    const balance = privateState.companyBalances.get(companyIdStr) || 0n;
    return [privateState, balance];
  },

  // Witness: Set company balance
  set_company_balance: (
    { privateState }: WitnessContext<Ledger, PayrollPrivateState>,
    companyId: Uint8Array,
    balance: bigint
  ): [PayrollPrivateState, []] => {
    const companyIdStr = Buffer.from(companyId).toString('hex');
    const updatedBalances = new Map(privateState.companyBalances);
    updatedBalances.set(companyIdStr, balance);

    return [{
      ...privateState,
      companyBalances: updatedBalances
    }, []];
  }
};

// Utility functions
export function generateCompanyId(): string {
  return 'COMP' + Math.random().toString(36).substring(2, 11).toUpperCase();
}

export function generateEmployeeId(): string {
  return 'EMP' + Math.random().toString(36).substring(2, 11).toUpperCase();
}

export function stringToBytes32(str: string): Uint8Array {
  const bytes = new Uint8Array(32);
  const encoded = new TextEncoder().encode(str);
  bytes.set(encoded.slice(0, Math.min(encoded.length, 32)));
  return bytes;
}

export default {
  Contract,
  ledger,
  pureCircuits,
  payrollWitnesses,
  createPayrollPrivateState,
  generateCompanyId,
  generateEmployeeId,
  stringToBytes32
};
