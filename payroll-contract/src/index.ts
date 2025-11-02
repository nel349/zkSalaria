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

// Re-export calendar utilities for API layer
export * from './utils/calendar';

// Create initial private state for payroll
// NOTE: Payment history now stored on public ledger (not witnesses) following bank.compact pattern
// Balances are encrypted on public ledger
// Private state is now empty - all data on ledger
export const createPayrollPrivateState = (): PayrollPrivateState => ({
  employeePaymentHistory: new Map()
});

// Payroll witness functions
// NOTE: All witness functions removed - following bank.compact pattern
// Payment history is stored on public ledger so company can update when paying employee
export const payrollWitnesses = {
  // No witnesses needed - all data on ledger (encrypted balances + payment history)
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
