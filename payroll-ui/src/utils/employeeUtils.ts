/**
 * Hash a wallet address to a 32-byte employee ID
 * Uses SHA-256 to match the on-chain employee ID format
 * This is the same hashing used by the API layer
 */
export const walletAddressToEmployeeIdHex = async (walletAddress: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(walletAddress);

  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = new Uint8Array(hashBuffer);

  // Convert to hex string
  return Array.from(hashArray)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
};
