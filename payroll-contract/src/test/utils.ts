/**
 * Test utility functions for payroll contract
 * These utilities are used for testing the contract
 */

// Pad a string to specified byte length
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

// Convert string to Bytes<32> for contract calls
export const stringToBytes32 = (str: string): Uint8Array => {
  const bytes = new Uint8Array(32);
  const encoder = new TextEncoder();
  const encoded = encoder.encode(str);
  bytes.set(encoded.slice(0, Math.min(encoded.length, 32)));
  return bytes;
};

// Convert string to Bytes<64> for contract calls
export const stringToBytes64 = (str: string): Uint8Array => {
  const bytes = new Uint8Array(64);
  const encoder = new TextEncoder();
  const encoded = encoder.encode(str);
  bytes.set(encoded.slice(0, Math.min(encoded.length, 64)));
  return bytes;
};

// Convert hex string to Bytes<32>
export const hexToBytes32 = (hex: string): Uint8Array => {
  const bytes = new Uint8Array(32);
  for (let i = 0; i < Math.min(hex.length, 64); i += 2) {
    bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
  }
  return bytes;
};

// Compare two Uint8Array byte arrays
export const compareBytes = (a: Uint8Array, b: Uint8Array): boolean => {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
};

// Generate random bytes (non-cryptographic for testing)
export const randomBytes = (size: number): Uint8Array => {
  const out = new Uint8Array(size);
  for (let i = 0; i < size; i++) {
    out[i] = Math.floor(Math.random() * 256);
  }
  return out;
};
