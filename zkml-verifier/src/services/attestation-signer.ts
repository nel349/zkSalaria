/**
 * Attestation Signer
 *
 * Creates Midnight-style hash commitments for verified proofs
 */

import { createHash } from 'crypto';
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
   * Compute public key using string concatenation
   * (Matches E2E test pattern exactly)
   * public_key = hash(domain_separator + secret)
   */
  private computePublicKey(): string {
    const pubkey = createHash('sha256')
      .update('zksalaria:verifier:pk:' + this.secretKey)
      .digest('hex');
    return pubkey;
  }

  /**
   * Create attestation for verified proof
   */
  async createAttestation(publicInputs: ProofPublicInputs): Promise<Attestation> {
    const timestamp = Math.floor(Date.now() / 1000);

    // Create hash commitment
    const attestation_hash = this.computeCommitment(
      publicInputs.employee_id,
      publicInputs.threshold,
      publicInputs.history_commitment,
      timestamp
    );

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

  /**
   * Compute attestation commitment using string concatenation pattern
   * (Matches E2E test pattern exactly - proven to work with contract)
   * commitment = hash(hash(data) + secret)
   */
  private computeCommitment(
    employeeId: string,
    threshold: number,
    historyCommitment: string,
    timestamp: number
  ): string {
    // Step 1: Hash the data using string concatenation
    // Format: employeeId + threshold + historyCommitment + timestamp
    const data = `${employeeId}${threshold}${historyCommitment}${timestamp}`;
    const dataHash = createHash('sha256').update(data).digest('hex');

    // Step 2: Commit with secret (plain string, matches test pattern)
    const attestationHash = createHash('sha256')
      .update(dataHash + this.secretKey)
      .digest('hex');

    return attestationHash;
  }
}
