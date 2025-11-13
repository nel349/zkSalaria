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
// Verifier secret key for ZKML attestation signing (Midnight authentication pattern)
//
// IMPORTANT: The verifierSecretKey parameter is OPTIONAL:
// - Regular participants (companies, employees): Call without arguments - uses default test value
// - Verifier participant: Call with loadVerifierSecretFromEnv() to use real secret from environment
export const createPayrollPrivateState = (verifierSecretKey?: Uint8Array): PayrollPrivateState => ({
  employeePaymentHistory: new Map(),
  // Default to test value if not provided (for non-verifier participants)
  verifierSecretKey: verifierSecretKey || stringToBytes32('test-verifier-secret-12345')
});

// Payroll witness functions
// NOTE: Payment history is stored on public ledger so company can update when paying employee
// verifier_secret_key: Used by ZKML verifier to prove ownership (Midnight pattern)
export const payrollWitnesses = {
  verifier_secret_key: ({ privateState }: WitnessContext<Ledger, PayrollPrivateState>): [PayrollPrivateState, Uint8Array] => {
    console.log('[payrollWitnesses.verifier_secret_key] Witness called, returning secret:', {
      secretLength: privateState.verifierSecretKey.length,
      secretHex: Buffer.from(privateState.verifierSecretKey).toString('hex').substring(0, 16) + '...'
    });
    return [privateState, privateState.verifierSecretKey];
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

/**
 * Load verifier secret key from environment variable
 * This should be called by the zkml-verifier service at startup
 *
 * @param envVarName - Name of environment variable (default: 'VERIFIER_SECRET_KEY')
 * @returns Uint8Array secret key for use in private state
 */
export function loadVerifierSecretFromEnv(envVarName: string = 'VERIFIER_SECRET_KEY'): Uint8Array {
  const secret = process.env[envVarName];
  if (!secret) {
    throw new Error(`${envVarName} environment variable not set`);
  }
  return stringToBytes32(secret);
}

// Export attestation utilities
export { computeAttestationHash, hashToHex, computeVerifierPubkey, computeVerifierPubkeyFromString } from './utils/attestation-hash.js';

export default {
  Contract,
  ledger,
  pureCircuits,
  payrollWitnesses,
  createPayrollPrivateState,
  loadVerifierSecretFromEnv,
  generateCompanyId,
  generateEmployeeId,
  stringToBytes32
};
