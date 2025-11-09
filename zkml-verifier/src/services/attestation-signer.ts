/**
 * Attestation Signer
 *
 * Creates Midnight-style hash commitments for verified proofs
 */

import { createHash } from 'crypto';
import type { ProofPublicInputs, Attestation } from '../types.js';

export class AttestationSigner {
  private secretKey: Buffer;
  private publicKey: string;

  constructor(secretKeyHex: string) {
    // Remove '0x' prefix if present
    const cleanHex = secretKeyHex.replace(/^0x/, '');
    this.secretKey = Buffer.from(cleanHex, 'hex');

    if (this.secretKey.length !== 32) {
      throw new Error('Secret key must be 32 bytes (64 hex characters)');
    }

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
    return this.secretKey.toString('hex');
  }

  /**
   * Compute public key using Midnight's pattern
   * public_key = hash(domain_separator + secret)
   */
  private computePublicKey(): string {
    // Domain separator (32 bytes)
    const domainSeparator = Buffer.alloc(32);
    domainSeparator.write('zksalaria:verifier:pk:', 0, 'utf8');

    // Hash: domain_separator + secret
    const hash = createHash('sha256');
    hash.update(domainSeparator);
    hash.update(this.secretKey);

    return hash.digest('hex');
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
      publicInputs.txids,
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
   * Compute attestation commitment using Midnight's pattern
   * commitment = hash(hash(data) + secret)
   */
  private computeCommitment(
    employeeId: string,
    threshold: number,
    txids: string[],
    historyCommitment: string,
    timestamp: number
  ): string {
    // Step 1: Hash the data
    const dataHash = createHash('sha256');

    // Add employee ID
    const employeeIdBuf = Buffer.from(employeeId.replace(/^0x/, ''), 'hex');
    dataHash.update(employeeIdBuf);

    // Add threshold (8 bytes, little-endian)
    const thresholdBuf = Buffer.alloc(8);
    thresholdBuf.writeBigUInt64LE(BigInt(threshold));
    dataHash.update(thresholdBuf);

    // Add each txid
    txids.forEach(tx => {
      const txBuf = Buffer.from(tx.replace(/^0x/, ''), 'hex');
      dataHash.update(txBuf);
    });

    // Add history commitment
    const commitmentBuf = Buffer.from(historyCommitment.replace(/^0x/, ''), 'hex');
    dataHash.update(commitmentBuf);

    // Add timestamp (8 bytes, little-endian)
    const timestampBuf = Buffer.alloc(8);
    timestampBuf.writeBigUInt64LE(BigInt(timestamp));
    dataHash.update(timestampBuf);

    const dataDigest = dataHash.digest();

    // Step 2: Commit with secret (Midnight's persistentCommit pattern)
    const commitHash = createHash('sha256');
    commitHash.update(dataDigest);
    commitHash.update(this.secretKey);

    return commitHash.digest('hex');
  }
}
