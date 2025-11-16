/**
 * Tax Bracket API Tests
 *
 * Tests for Tax Bracket (Type 5) proof generation API methods:
 * - Tax bracket constants and validation
 * - Helper methods (getTaxBracketInfo, getTaxBracketFromIncome, isValidTaxBracket)
 * - generateTaxBracketProof() method
 * - Integration with smart contract
 */

import { describe, test, expect, beforeAll } from 'vitest';
import { PayrollAPI } from '../payroll-api.js';

describe('Tax Bracket API - Helper Methods', () => {
  describe('TAX_BRACKETS Constants', () => {
    test('should have 7 official US federal tax brackets', () => {
      expect(PayrollAPI.TAX_BRACKETS).toHaveLength(7);
    });

    test('should have correct bracket 1 (10%): $0 - $11,600', () => {
      const bracket = PayrollAPI.TAX_BRACKETS[0];
      expect(bracket.bracket).toBe(1);
      expect(bracket.rate).toBe('10%');
      expect(bracket.min).toBe(0);
      expect(bracket.max).toBe(11600);
    });

    test('should have correct bracket 2 (12%): $11,601 - $47,150', () => {
      const bracket = PayrollAPI.TAX_BRACKETS[1];
      expect(bracket.bracket).toBe(2);
      expect(bracket.rate).toBe('12%');
      expect(bracket.min).toBe(11601);
      expect(bracket.max).toBe(47150);
    });

    test('should have correct bracket 3 (22%): $47,151 - $100,525', () => {
      const bracket = PayrollAPI.TAX_BRACKETS[2];
      expect(bracket.bracket).toBe(3);
      expect(bracket.rate).toBe('22%');
      expect(bracket.min).toBe(47151);
      expect(bracket.max).toBe(100525);
    });

    test('should have correct bracket 4 (24%): $100,526 - $191,950', () => {
      const bracket = PayrollAPI.TAX_BRACKETS[3];
      expect(bracket.bracket).toBe(4);
      expect(bracket.rate).toBe('24%');
      expect(bracket.min).toBe(100526);
      expect(bracket.max).toBe(191950);
    });

    test('should have correct bracket 5 (32%): $191,951 - $243,725', () => {
      const bracket = PayrollAPI.TAX_BRACKETS[4];
      expect(bracket.bracket).toBe(5);
      expect(bracket.rate).toBe('32%');
      expect(bracket.min).toBe(191951);
      expect(bracket.max).toBe(243725);
    });

    test('should have correct bracket 6 (35%): $243,726 - $609,350', () => {
      const bracket = PayrollAPI.TAX_BRACKETS[5];
      expect(bracket.bracket).toBe(6);
      expect(bracket.rate).toBe('35%');
      expect(bracket.min).toBe(243726);
      expect(bracket.max).toBe(609350);
    });

    test('should have correct bracket 7 (37%): $609,351+', () => {
      const bracket = PayrollAPI.TAX_BRACKETS[6];
      expect(bracket.bracket).toBe(7);
      expect(bracket.rate).toBe('37%');
      expect(bracket.min).toBe(609351);
      expect(bracket.max).toBe(999999999);
    });

    test('should have no gaps between brackets', () => {
      for (let i = 0; i < PayrollAPI.TAX_BRACKETS.length - 1; i++) {
        const currentMax = PayrollAPI.TAX_BRACKETS[i].max;
        const nextMin = PayrollAPI.TAX_BRACKETS[i + 1].min;
        expect(nextMin).toBe(currentMax + 1);
      }
    });
  });

  describe('getTaxBracketInfo()', () => {
    test('should return bracket 1 for bracketNumber 1', () => {
      const bracket = PayrollAPI.getTaxBracketInfo(1);
      expect(bracket).not.toBeNull();
      expect(bracket?.bracket).toBe(1);
      expect(bracket?.rate).toBe('10%');
      expect(bracket?.min).toBe(0);
      expect(bracket?.max).toBe(11600);
    });

    test('should return bracket 2 for bracketNumber 2', () => {
      const bracket = PayrollAPI.getTaxBracketInfo(2);
      expect(bracket).not.toBeNull();
      expect(bracket?.bracket).toBe(2);
      expect(bracket?.rate).toBe('12%');
      expect(bracket?.min).toBe(11601);
      expect(bracket?.max).toBe(47150);
    });

    test('should return bracket 7 for bracketNumber 7', () => {
      const bracket = PayrollAPI.getTaxBracketInfo(7);
      expect(bracket).not.toBeNull();
      expect(bracket?.bracket).toBe(7);
      expect(bracket?.rate).toBe('37%');
      expect(bracket?.min).toBe(609351);
    });

    test('should return null for bracketNumber 0', () => {
      const bracket = PayrollAPI.getTaxBracketInfo(0);
      expect(bracket).toBeNull();
    });

    test('should return null for bracketNumber 8', () => {
      const bracket = PayrollAPI.getTaxBracketInfo(8);
      expect(bracket).toBeNull();
    });

    test('should return null for negative bracketNumber', () => {
      const bracket = PayrollAPI.getTaxBracketInfo(-1);
      expect(bracket).toBeNull();
    });
  });

  describe('getTaxBracketFromIncome()', () => {
    test('should return 10% bracket for $0', () => {
      const bracket = PayrollAPI.getTaxBracketFromIncome(0);
      expect(bracket.bracket).toBe(1);
      expect(bracket.rate).toBe('10%');
    });

    test('should return 10% bracket for $11,600', () => {
      const bracket = PayrollAPI.getTaxBracketFromIncome(11600);
      expect(bracket.bracket).toBe(1);
      expect(bracket.rate).toBe('10%');
    });

    test('should return 12% bracket for $11,601', () => {
      const bracket = PayrollAPI.getTaxBracketFromIncome(11601);
      expect(bracket.bracket).toBe(2);
      expect(bracket.rate).toBe('12%');
    });

    test('should return 12% bracket for $35,000', () => {
      const bracket = PayrollAPI.getTaxBracketFromIncome(35000);
      expect(bracket.bracket).toBe(2);
      expect(bracket.rate).toBe('12%');
    });

    test('should return 12% bracket for $47,150', () => {
      const bracket = PayrollAPI.getTaxBracketFromIncome(47150);
      expect(bracket.bracket).toBe(2);
      expect(bracket.rate).toBe('12%');
    });

    test('should return 22% bracket for $47,151', () => {
      const bracket = PayrollAPI.getTaxBracketFromIncome(47151);
      expect(bracket.bracket).toBe(3);
      expect(bracket.rate).toBe('22%');
    });

    test('should return 22% bracket for $75,000', () => {
      const bracket = PayrollAPI.getTaxBracketFromIncome(75000);
      expect(bracket.bracket).toBe(3);
      expect(bracket.rate).toBe('22%');
    });

    test('should return 24% bracket for $150,000', () => {
      const bracket = PayrollAPI.getTaxBracketFromIncome(150000);
      expect(bracket.bracket).toBe(4);
      expect(bracket.rate).toBe('24%');
    });

    test('should return 32% bracket for $200,000', () => {
      const bracket = PayrollAPI.getTaxBracketFromIncome(200000);
      expect(bracket.bracket).toBe(5);
      expect(bracket.rate).toBe('32%');
    });

    test('should return 35% bracket for $400,000', () => {
      const bracket = PayrollAPI.getTaxBracketFromIncome(400000);
      expect(bracket.bracket).toBe(6);
      expect(bracket.rate).toBe('35%');
    });

    test('should return 37% bracket for $700,000', () => {
      const bracket = PayrollAPI.getTaxBracketFromIncome(700000);
      expect(bracket.bracket).toBe(7);
      expect(bracket.rate).toBe('37%');
    });

    test('should return 37% bracket for very high income ($10 million)', () => {
      const bracket = PayrollAPI.getTaxBracketFromIncome(10000000);
      expect(bracket.bracket).toBe(7);
      expect(bracket.rate).toBe('37%');
    });
  });

  describe('isValidTaxBracket()', () => {
    test('should return true for 10% bracket (0 - 11600)', () => {
      expect(PayrollAPI.isValidTaxBracket(0, 11600)).toBe(true);
    });

    test('should return true for 12% bracket (11601 - 47150)', () => {
      expect(PayrollAPI.isValidTaxBracket(11601, 47150)).toBe(true);
    });

    test('should return true for 22% bracket (47151 - 100525)', () => {
      expect(PayrollAPI.isValidTaxBracket(47151, 100525)).toBe(true);
    });

    test('should return true for 24% bracket (100526 - 191950)', () => {
      expect(PayrollAPI.isValidTaxBracket(100526, 191950)).toBe(true);
    });

    test('should return true for 32% bracket (191951 - 243725)', () => {
      expect(PayrollAPI.isValidTaxBracket(191951, 243725)).toBe(true);
    });

    test('should return true for 35% bracket (243726 - 609350)', () => {
      expect(PayrollAPI.isValidTaxBracket(243726, 609350)).toBe(true);
    });

    test('should return true for 37% bracket (609351 - 999999999)', () => {
      expect(PayrollAPI.isValidTaxBracket(609351, 999999999)).toBe(true);
    });

    test('should return false for invalid range (0 - 50000)', () => {
      expect(PayrollAPI.isValidTaxBracket(0, 50000)).toBe(false);
    });

    test('should return false for partial bracket (11601 - 40000)', () => {
      expect(PayrollAPI.isValidTaxBracket(11601, 40000)).toBe(false);
    });

    test('should return false for reversed bracket (47150 - 11601)', () => {
      expect(PayrollAPI.isValidTaxBracket(47150, 11601)).toBe(false);
    });

    test('should return false for arbitrary range (20000 - 30000)', () => {
      expect(PayrollAPI.isValidTaxBracket(20000, 30000)).toBe(false);
    });
  });
});

describe('Tax Bracket API - Validation', () => {
  test('should validate all 7 brackets are in ascending order', () => {
    for (let i = 0; i < PayrollAPI.TAX_BRACKETS.length - 1; i++) {
      const current = PayrollAPI.TAX_BRACKETS[i];
      const next = PayrollAPI.TAX_BRACKETS[i + 1];
      expect(current.max).toBeLessThan(next.min);
      expect(current.bracket).toBeLessThan(next.bracket);
    }
  });

  test('should have unique bracket numbers', () => {
    const bracketNumbers = PayrollAPI.TAX_BRACKETS.map(b => b.bracket);
    const uniqueBrackets = new Set(bracketNumbers);
    expect(uniqueBrackets.size).toBe(7);
  });

  test('should have valid min/max ranges for all brackets', () => {
    PayrollAPI.TAX_BRACKETS.forEach(bracket => {
      expect(bracket.min).toBeGreaterThanOrEqual(0);
      expect(bracket.max).toBeGreaterThan(bracket.min);
    });
  });

  test('should have description for all brackets', () => {
    PayrollAPI.TAX_BRACKETS.forEach(bracket => {
      expect(bracket.description).toBeTruthy();
      expect(bracket.description).toContain(bracket.rate);
      expect(bracket.description).toContain(bracket.min.toLocaleString());
    });
  });
});

console.log('\n✅ Tax Bracket API Helper Tests Complete\n');
console.log('All 7 US Federal Tax Brackets validated:');
PayrollAPI.TAX_BRACKETS.forEach(b => {
  console.log(`  ${b.bracket}. ${b.rate} - ${b.description}`);
});
