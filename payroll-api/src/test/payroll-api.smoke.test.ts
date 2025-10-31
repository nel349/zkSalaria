/**
 * Smoke Tests - Fast health checks (no blockchain required)
 * Run with: npm run test:smoke
 * Should complete in under 1 second
 */

import { describe, test, expect } from 'vitest';
import { PayrollAPI, emptyPayrollState, utils } from '../index.js';

describe('PayrollAPI Smoke Tests', () => {
  test('should export PayrollAPI class', () => {
    expect(PayrollAPI).toBeDefined();
    expect(typeof PayrollAPI).toBe('function');
    expect(PayrollAPI.name).toBe('PayrollAPI');
  });

  test('should export emptyPayrollState with correct structure', () => {
    expect(emptyPayrollState).toBeDefined();
    expect(emptyPayrollState.totalCompanies).toBe(0n);
    expect(emptyPayrollState.totalEmployees).toBe(0n);
    expect(emptyPayrollState.totalPayments).toBe(0n);
    expect(emptyPayrollState.totalSupply).toBe(0n);
    expect(emptyPayrollState.currentTimestamp).toBe(0);
    expect(emptyPayrollState.lastTransaction).toBeUndefined();
  });

  test('should export utils module', () => {
    expect(utils).toBeDefined();
    expect(utils.formatBalance).toBeDefined();
    expect(utils.parseAmount).toBeDefined();
    expect(utils.stringToBytes32).toBeDefined();
    expect(utils.stringToBytes64).toBeDefined();
    expect(utils.normalizeId).toBeDefined();
    expect(utils.randomBytes).toBeDefined();
    expect(utils.pad).toBeDefined();
  });

  describe('Utils - formatBalance', () => {
    test('should format zero balance', () => {
      expect(utils.formatBalance(0n)).toBe('0.00');
    });

    test('should format whole numbers', () => {
      expect(utils.formatBalance(10000n)).toBe('100.00');
      expect(utils.formatBalance(100n)).toBe('1.00');
    });

    test('should format decimals', () => {
      expect(utils.formatBalance(2550n)).toBe('25.50');
      expect(utils.formatBalance(1n)).toBe('0.01');
      expect(utils.formatBalance(99n)).toBe('0.99');
    });

    test('should handle large amounts', () => {
      expect(utils.formatBalance(100000000n)).toBe('1000000.00');
    });
  });

  describe('Utils - parseAmount', () => {
    test('should parse zero', () => {
      expect(utils.parseAmount('0')).toBe(0n);
      expect(utils.parseAmount('0.00')).toBe(0n);
    });

    test('should parse whole numbers', () => {
      expect(utils.parseAmount('100')).toBe(10000n);
      expect(utils.parseAmount('1')).toBe(100n);
    });

    test('should parse decimals', () => {
      expect(utils.parseAmount('25.50')).toBe(2550n);
      expect(utils.parseAmount('0.01')).toBe(1n);
      expect(utils.parseAmount('99.99')).toBe(9999n);
    });

    test('should round down partial cents', () => {
      expect(utils.parseAmount('1.005')).toBe(100n);
      expect(utils.parseAmount('1.009')).toBe(100n);
    });
  });

  describe('Utils - stringToBytes32', () => {
    test('should convert short strings', () => {
      const result = utils.stringToBytes32('test');
      expect(result).toBeInstanceOf(Uint8Array);
      expect(result.length).toBe(32);
      expect(result[0]).toBe(116); // 't'
      expect(result[1]).toBe(101); // 'e'
      expect(result[2]).toBe(115); // 's'
      expect(result[3]).toBe(116); // 't'
    });

    test('should handle empty string', () => {
      const result = utils.stringToBytes32('');
      expect(result.length).toBe(32);
      expect(result[0]).toBe(0);
    });

    test('should truncate long strings to 32 bytes', () => {
      const longString = 'a'.repeat(50);
      const result = utils.stringToBytes32(longString);
      expect(result.length).toBe(32);
    });
  });

  describe('Utils - stringToBytes64', () => {
    test('should convert strings to 64 bytes', () => {
      const result = utils.stringToBytes64('ACME Corporation');
      expect(result).toBeInstanceOf(Uint8Array);
      expect(result.length).toBe(64);
    });

    test('should handle empty string', () => {
      const result = utils.stringToBytes64('');
      expect(result.length).toBe(64);
      expect(result[0]).toBe(0);
    });

    test('should truncate long strings to 64 bytes', () => {
      const longString = 'a'.repeat(100);
      const result = utils.stringToBytes64(longString);
      expect(result.length).toBe(64);
    });
  });

  describe('Utils - normalizeId', () => {
    test('should return short IDs unchanged', () => {
      expect(utils.normalizeId('test')).toBe('test');
      expect(utils.normalizeId('company-1')).toBe('company-1');
    });

    test('should truncate IDs longer than 32 bytes', () => {
      const longId = 'a'.repeat(50);
      const normalized = utils.normalizeId(longId);
      expect(normalized.length).toBeLessThanOrEqual(32);
    });

    test('should handle empty string', () => {
      expect(utils.normalizeId('')).toBe('');
    });
  });

  describe('Utils - randomBytes', () => {
    test('should generate correct length', () => {
      expect(utils.randomBytes(16).length).toBe(16);
      expect(utils.randomBytes(32).length).toBe(32);
      expect(utils.randomBytes(64).length).toBe(64);
    });

    test('should generate different values', () => {
      const bytes1 = utils.randomBytes(32);
      const bytes2 = utils.randomBytes(32);
      expect(bytes1).not.toEqual(bytes2);
    });

    test('should return Uint8Array', () => {
      expect(utils.randomBytes(32)).toBeInstanceOf(Uint8Array);
    });
  });

  describe('Utils - pad', () => {
    test('should pad short strings', () => {
      const result = utils.pad('test', 10);
      expect(result.length).toBe(10);
      expect(result[0]).toBe(116); // 't'
    });

    test('should handle exact length', () => {
      const result = utils.pad('test', 4);
      expect(result.length).toBe(4);
    });

    test('should throw on insufficient length', () => {
      expect(() => utils.pad('test', 2)).toThrow();
    });
  });

  describe('Static Methods', () => {
    test('should have deploy static method', () => {
      expect(typeof PayrollAPI.deploy).toBe('function');
    });

    test('should have connect static method', () => {
      expect(typeof PayrollAPI.connect).toBe('function');
    });
  });
});
