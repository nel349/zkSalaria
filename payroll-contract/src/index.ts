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
// NOTE: Only payment history stored privately (for ZKML)
// Balances are now encrypted on public ledger
export const createPayrollPrivateState = (): PayrollPrivateState => ({
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
  }

  // NOTE: Balance witnesses removed - balances now stored as encrypted values on public ledger
  // Only payment history (for ZKML) remains in witness (private local storage)
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
