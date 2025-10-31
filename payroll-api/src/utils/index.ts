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
