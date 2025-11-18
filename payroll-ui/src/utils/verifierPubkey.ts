/**
 * Compute verifier public key from wallet's coin public key
 * This matches the contract's verifier_public_key circuit:
 *
 * pure circuit verifier_public_key(secret_key: Bytes<32>): Bytes<32> {
 *   return persistentHash<Vector<2, Bytes<32>>>([
 *     pad(32, "zksalaria:verifier:pk:"),
 *     secret_key
 *   ]);
 * }
 *
 * @param coinPublicKey - Wallet's coin public key (Bech32 encoded string)
 * @returns 32-byte public key as 64-character hex string (without '0x' prefix)
 */
export async function computeVerifierPubkey(coinPublicKey: string): Promise<string> {
  // Convert coinPublicKey to Bytes<32>
  const encoder = new TextEncoder();
  const coinBytes = encoder.encode(coinPublicKey);

  // Hash to get exactly 32 bytes
  const coinHashBuffer = await crypto.subtle.digest('SHA-256', coinBytes);
  const secretKey = new Uint8Array(coinHashBuffer);

  // Create 64-byte buffer for Vector<2, Bytes<32>>
  const buffer = new Uint8Array(64);

  // Element 1: pad(32, "zksalaria:verifier:pk:")
  const domainSeparation = encoder.encode('zksalaria:verifier:pk:');
  buffer.set(domainSeparation.slice(0, 32), 0);

  // Element 2: secret_key (derived from coinPublicKey)
  buffer.set(secretKey, 32);

  // Compute SHA-256 hash (Compact uses SHA-256 for persistentHash)
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const pubkeyBytes = new Uint8Array(hashBuffer);

  // Convert to hex string
  const auditorPubkey = Array.from(pubkeyBytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

  return auditorPubkey;
}
