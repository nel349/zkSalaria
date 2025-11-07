/**
 * Utility functions for payroll API
 * Following bank-api patterns
 */

export const randomBytes = (size: number): Uint8Array => {
  const out = new Uint8Array(size);
  // Prefer Web Crypto in browsers
  const webCrypto: any = (globalThis as any)?.crypto;
  if (webCrypto && typeof webCrypto.getRandomValues === 'function') {
    webCrypto.getRandomValues(out);
    return out;
  }
  // Fallback (non-cryptographic) for non-browser contexts where node:crypto is unavailable in bundlers
  for (let i = 0; i < size; i++) {
    out[i] = Math.floor(Math.random() * 256);
  }
  return out;
};

export const pad = (s: string, n: number): Uint8Array => {
  const encoder = new TextEncoder();
  const utf8Bytes = encoder.encode(s);
  if (n < utf8Bytes.length) {
    throw new Error(`The padded length n must be at least ${utf8Bytes.length}`);
  }
  const paddedArray = new Uint8Array(n);
  paddedArray.set(utf8Bytes);
  return paddedArray;
};

// Format balance as decimal string (amount is in smallest units)
export const formatBalance = (balance: bigint): string => {
  return (Number(balance) / 100).toFixed(2);
};

// Parse amount from decimal string to smallest units
export const parseAmount = (amount: string): bigint => {
  return BigInt(Math.floor(parseFloat(amount) * 100));
};

// Convert string to Bytes<32> for contract calls
export const stringToBytes32 = (str: string): Uint8Array => {
  const bytes = new Uint8Array(32);
  const encoder = new TextEncoder();
  const encoded = encoder.encode(str);
  bytes.set(encoded.slice(0, Math.min(encoded.length, 32)));
  return bytes;
};

/**
 * Hash a wallet address (shield address) to a 32-byte employee ID
 * Uses SHA-256 to convert long wallet addresses to contract-compatible IDs
 * This ensures each wallet has a unique employee ID
 */
export const walletAddressToEmployeeId = async (walletAddress: string): Promise<Uint8Array> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(walletAddress);

  // Check if we're in a browser environment
  if (typeof globalThis.crypto !== 'undefined' && globalThis.crypto.subtle) {
    // Browser environment (or Node.js 20+ with crypto.subtle)
    const hashBuffer = await globalThis.crypto.subtle.digest('SHA-256', data);
    return new Uint8Array(hashBuffer);
  } else {
    // Node.js environment (fallback to node:crypto)
    const crypto = await import('crypto');
    const hash = crypto.createHash('sha256');
    hash.update(data);
    return new Uint8Array(hash.digest());
  }
};

// Convert string to Bytes<64> for contract calls (e.g., company names)
export const stringToBytes64 = (str: string): Uint8Array => {
  const bytes = new Uint8Array(64);
  const encoder = new TextEncoder();
  const encoded = encoder.encode(str);
  bytes.set(encoded.slice(0, Math.min(encoded.length, 64)));
  return bytes;
};

// Normalize user/company/employee ID to 32 bytes max
export const normalizeId = (id: string): string => {
  const encoder = new TextEncoder();
  const encoded = encoder.encode(id);
  if (encoded.length <= 32) {
    return id;
  }
  // Truncate to 32 bytes and decode back to string
  const truncated = encoded.slice(0, 32);
  return new TextDecoder().decode(truncated);
};

// Convert Bytes<32> to string (remove null padding)
export const bytes32ToString = (bytes: Uint8Array): string => {
  const decoder = new TextDecoder();
  let end = bytes.length;
  for (let i = 0; i < bytes.length; i++) {
    if (bytes[i] === 0) {
      end = i;
      break;
    }
  }
  return decoder.decode(bytes.slice(0, end));
};

// Convert Bytes<64> to string (remove null padding)
export const bytes64ToString = (bytes: Uint8Array): string => {
  const decoder = new TextDecoder();
  let end = bytes.length;
  for (let i = 0; i < bytes.length; i++) {
    if (bytes[i] === 0) {
      end = i;
      break;
    }
  }
  return decoder.decode(bytes.slice(0, end));
};

// Convert hex string to Bytes<32> (for recurring payment IDs, etc.)
export const hexToBytes32 = (hex: string): Uint8Array => {
  const bytes = new Uint8Array(32);
  // Remove '0x' prefix if present
  const cleanHex = hex.startsWith('0x') ? hex.slice(2) : hex;

  for (let i = 0; i < Math.min(32, cleanHex.length / 2); i++) {
    bytes[i] = parseInt(cleanHex.substr(i * 2, 2), 16);
  }
  return bytes;
};

// Convert Bytes<32> to hex string
export const bytes32ToHex = (bytes: Uint8Array): string => {
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
};

// Payment status labels
export const getPaymentStatusLabel = (status: bigint): string => {
  switch (status) {
    case 0n: return 'PENDING';
    case 1n: return 'COMPLETED';
    case 2n: return 'FAILED';
    case 3n: return 'CANCELLED';
    default: return 'UNKNOWN';
  }
};

// Recurring payment status labels
export const getRecurringPaymentStatusLabel = (status: bigint): string => {
  switch (status) {
    case 0n: return 'ACTIVE';
    case 1n: return 'PAUSED';
    case 2n: return 'CANCELLED';
    default: return 'UNKNOWN';
  }
};

// Recurring payment frequency labels
export const getRecurringPaymentFrequencyLabel = (frequency: bigint): string => {
  switch (frequency) {
    case 0n: return 'WEEKLY';
    case 1n: return 'BIWEEKLY';
    case 2n: return 'MONTHLY';
    default: return 'UNKNOWN';
  }
};
