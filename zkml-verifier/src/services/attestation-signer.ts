/**
 * Attestation Signer
 *
 * Creates Midnight-style hash commitments for verified proofs
 */

import { createHash } from 'crypto';
import { computeVerifierPubkeyFromString, computeAttestationHash } from '@zksalaria/payroll-contract';
import type { ProofPublicInputs, Attestation } from '../types.js';

export class AttestationSigner {
  private secretKey: string;
  private publicKey: string;

  constructor(secretKey: string) {
    // Store secret as plain string (matches E2E test pattern)
    this.secretKey = secretKey;
    this.publicKey = this.computePublicKey();
  }

  /**
   * Get the verifier's public key
   */
  getPublicKey(): string {
    return this.publicKey;
  }

  /**
   * Get the verifier's secret key
   *
   * SECURITY: For internal use ONLY. NEVER expose this to clients or API responses.
   * The secret key is used to create attestation commitments and must remain private.
   */
  getSecretKey(): string {
    return this.secretKey;
  }

  /**
   * Compute public key using the same method as the contract witness
   * Uses computeVerifierPubkeyFromString from payroll-contract package
   * This ensures the derived public key matches what the circuit computes
   */
  private computePublicKey(): string {
    // Use the contract's public key derivation function
    // This matches what verifier_public_key(verifier_secret_key()) computes in the circuit
    return computeVerifierPubkeyFromString(this.secretKey);
  }

  /**
   * Convert wallet address to employee_id bytes using SHA-256 hash
   * This MUST match the PayrollAPI's walletAddressToEmployeeId() function
   */
  private async walletAddressToEmployeeId(walletAddress: string): Promise<Uint8Array> {
    const hash = createHash('sha256');
    hash.update(walletAddress);
    return new Uint8Array(hash.digest());
  }

  /**
   * Create attestation for verified proof
   * Uses the contract's computeAttestationHash to ensure binary compatibility
   */
  async createAttestation(publicInputs: ProofPublicInputs): Promise<Attestation> {
    const timestamp = Math.floor(Date.now() / 1000);

    // Convert employee_id from wallet address to Bytes<32> using SHA-256 hash
    // This MUST match how PayrollAPI converts addresses: walletAddressToEmployeeId()
    const employeeIdBytes = await this.walletAddressToEmployeeId(publicInputs.employee_id);

    // Convert history_commitment from hex string to Bytes<32>
    const historyCommitmentHex = publicInputs.history_commitment.startsWith('0x')
      ? publicInputs.history_commitment.slice(2)
      : publicInputs.history_commitment;
    const historyCommitmentBytes = Buffer.from(historyCommitmentHex, 'hex');

    // DEBUG: Log all values used to compute attestation hash
    console.log('[AttestationSigner] Computing attestation hash with:');
    console.log('  employee_id_bytes:', Buffer.from(employeeIdBytes).toString('hex'));
    console.log('  proof_type:', publicInputs.proof_type);
    console.log('  threshold_min:', Math.floor(publicInputs.threshold));
    console.log('  threshold_max:', Math.floor(publicInputs.threshold_max || 0));
    console.log('  history_commitment:', Buffer.from(historyCommitmentBytes).toString('hex'));
    console.log('  timestamp:', timestamp);

    // Compute attestation hash using the contract's function
    // This ensures perfect binary compatibility with the circuit
    const attestationHashBytes = computeAttestationHash({
      employee_id: new Uint8Array(employeeIdBytes),
      proof_type: BigInt(publicInputs.proof_type),
      threshold_min: BigInt(Math.floor(publicInputs.threshold)),
      threshold_max: BigInt(Math.floor(publicInputs.threshold_max || 0)),
      history_commitment: new Uint8Array(historyCommitmentBytes),
      timestamp: BigInt(timestamp)
    });

    const attestation_hash = '0x' + Buffer.from(attestationHashBytes).toString('hex');
    console.log('[AttestationSigner] Computed attestation_hash:', attestation_hash);

    return {
      employee_id: publicInputs.employee_id,
      threshold: publicInputs.threshold.toString(),
      txids: publicInputs.txids,
      history_commitment: publicInputs.history_commitment,
      timestamp: timestamp,
      attestation_hash: attestation_hash,
      // verifier_secret is NEVER exposed - it stays on the server for security
      verifier_pubkey: this.publicKey
    };
  }
}
