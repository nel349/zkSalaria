import { createHash } from 'crypto';

/**
 * Compute attestation hash for IncomeProofAttestation struct
 * This matches Compact's persistentHash<IncomeProofAttestation> behavior
 *
 * IMPORTANT: This must match the Compact serialization format exactly
 */
export function computeAttestationHash(attestation: {
  employee_id: Uint8Array;
  proof_type: bigint;
  threshold_min: bigint;
  threshold_max: bigint;
  history_commitment: Uint8Array;
  timestamp: bigint;
}): Uint8Array {
  // Serialize the attestation struct in the same order as Compact
  const buffer = Buffer.alloc(32 + 1 + 8 + 8 + 32 + 4);

  let offset = 0;

  // employee_id: Bytes<32>
  Buffer.from(attestation.employee_id).copy(buffer, offset);
  offset += 32;

  // proof_type: Uint<8>
  buffer.writeUInt8(Number(attestation.proof_type), offset);
  offset += 1;

  // threshold_min: Uint<64> (little-endian)
  buffer.writeBigUInt64LE(attestation.threshold_min, offset);
  offset += 8;

  // threshold_max: Uint<64> (little-endian)
  buffer.writeBigUInt64LE(attestation.threshold_max, offset);
  offset += 8;

  // history_commitment: Bytes<32>
  Buffer.from(attestation.history_commitment).copy(buffer, offset);
  offset += 32;

  // timestamp: Uint<32> (little-endian)
  buffer.writeUInt32LE(Number(attestation.timestamp), offset);

  // Compute SHA-256 hash (Compact uses SHA-256 for persistentHash)
  const hash = createHash('sha256').update(buffer).digest();

  return new Uint8Array(hash);
}

/**
 * Convert Uint8Array to hex string for display/logging
 */
export function hashToHex(hash: Uint8Array): string {
  return Buffer.from(hash).toString('hex');
}

/**
 * Compute verifier public key from secret key
 * This matches the contract's verifier_public_key circuit:
 *
 * pure circuit verifier_public_key(secret_key: Bytes<32>): Bytes<32> {
 *   return persistentHash<Vector<2, Bytes<32>>>([
 *     pad(32, "zksalaria:verifier:pk:"),
 *     secret_key
 *   ]);
 * }
 *
 * @param secretKey - 32-byte secret key (use stringToBytes32() to convert from string)
 * @returns 32-byte public key
 */
export function computeVerifierPubkey(secretKey: Uint8Array): Uint8Array {
  // Serialize Vector<2, Bytes<32>> format
  const buffer = Buffer.alloc(64); // 2 × 32 bytes

  // Element 1: pad(32, "zksalaria:verifier:pk:")
  const domainSeparation = Buffer.alloc(32);
  domainSeparation.write('zksalaria:verifier:pk:', 0, 'utf8');
  domainSeparation.copy(buffer, 0);

  // Element 2: secret_key
  Buffer.from(secretKey).copy(buffer, 32);

  // Compute SHA-256 hash (Compact uses SHA-256 for persistentHash)
  const hash = createHash('sha256').update(buffer).digest();

  return new Uint8Array(hash);
}

/**
 * Compute verifier public key from string secret (convenience wrapper)
 * @param secret - String secret (will be converted to Bytes<32>)
 * @returns 32-byte public key as hex string (without '0x' prefix)
 */
export function computeVerifierPubkeyFromString(secret: string): string {
  // Convert string to Bytes<32> (matching stringToBytes32 from contract)
  const bytes = Buffer.alloc(32);
  bytes.write(secret, 0, Math.min(secret.length, 32), 'utf8');

  const pubkey = computeVerifierPubkey(new Uint8Array(bytes));
  return Buffer.from(pubkey).toString('hex');
}
