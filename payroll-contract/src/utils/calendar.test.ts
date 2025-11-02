import { describe, test, expect } from 'vitest';
import {
  calculateNextMonthlyPayment,
  calculateNextBiweeklyPayment,
  calculateNextWeeklyPayment,
  calculateNextPaymentDate,
  validateCalendarConfig,
  getStandardCalendarConfig,
  toUnixTimestamp,
  fromUnixTimestamp,
  formatDayOfWeek,
  describePaymentSchedule
} from './calendar.js';
import { RecurringPaymentFrequency } from '../types.js';

describe('Calendar Utilities', () => {
  describe('Monthly Payments (1st of month)', () => {
    test('should calculate next 1st when in middle of month', () => {
      const current = new Date('2025-01-15T12:00:00Z');
      const next = calculateNextMonthlyPayment(current);

      expect(next.getUTCDate()).toBe(1);
      expect(next.getUTCMonth()).toBe(1); // February (0-indexed)
      expect(next.getUTCFullYear()).toBe(2025);
    });

    test('should calculate next 1st when current is the 1st', () => {
      const current = new Date('2025-02-01T00:00:00Z');
      const next = calculateNextMonthlyPayment(current);

      expect(next.getUTCDate()).toBe(1);
      expect(next.getUTCMonth()).toBe(2); // March (0-indexed)
      expect(next.getUTCFullYear()).toBe(2025);
    });

    test('should calculate next 1st at end of month', () => {
      const current = new Date('2025-01-31T23:59:59Z');
      const next = calculateNextMonthlyPayment(current);

      expect(next.getUTCDate()).toBe(1);
      expect(next.getUTCMonth()).toBe(1); // February
      expect(next.getUTCFullYear()).toBe(2025);
    });

    test('should handle February correctly', () => {
      // Non-leap year
      const current = new Date('2025-02-28T12:00:00Z');
      const next = calculateNextMonthlyPayment(current);

      expect(next.getUTCDate()).toBe(1);
      expect(next.getUTCMonth()).toBe(2); // March
      expect(next.getUTCFullYear()).toBe(2025);
    });

    test('should handle leap year February', () => {
      const current = new Date('2024-02-29T12:00:00Z');
      const next = calculateNextMonthlyPayment(current);

      expect(next.getUTCDate()).toBe(1);
      expect(next.getUTCMonth()).toBe(2); // March
      expect(next.getUTCFullYear()).toBe(2024);
    });

    test('should handle year boundary', () => {
      const current = new Date('2025-12-15T12:00:00Z');
      const next = calculateNextMonthlyPayment(current);

      expect(next.getUTCDate()).toBe(1);
      expect(next.getUTCMonth()).toBe(0); // January
      expect(next.getUTCFullYear()).toBe(2026);
    });
  });

  describe('Biweekly Payments (1st and 15th)', () => {
    test('should calculate 15th when current is before 15th', () => {
      const current = new Date('2025-01-10T12:00:00Z');
      const next = calculateNextBiweeklyPayment(current);

      expect(next.getUTCDate()).toBe(15);
      expect(next.getUTCMonth()).toBe(0); // January
    });

    test('should calculate next month 1st when current is after 15th', () => {
      const current = new Date('2025-01-20T12:00:00Z');
      const next = calculateNextBiweeklyPayment(current);

      expect(next.getUTCDate()).toBe(1);
      expect(next.getUTCMonth()).toBe(1); // February
    });

    test('should calculate 15th when current is exactly 1st at midnight', () => {
      const current = new Date('2025-01-01T00:00:00Z');
      const next = calculateNextBiweeklyPayment(current);

      // When it's exactly midnight on 1st, next payment is the 15th
      console.log('Current:', current, 'Next:', next);
      expect(next.getUTCDate()).toBe(15);
      expect(next.getUTCMonth()).toBe(0); // January (same month)
    });

    test('should calculate next 1st when current is exactly 15th', () => {
      const current = new Date('2025-01-15T00:00:00Z');
      const next = calculateNextBiweeklyPayment(current);

      expect(next.getUTCDate()).toBe(1);
      expect(next.getUTCMonth()).toBe(1); // February
    });

    test('should handle February correctly (28 days)', () => {
      // After 15th in February (non-leap)
      const current = new Date('2025-02-20T12:00:00Z');
      const next = calculateNextBiweeklyPayment(current);

      expect(next.getUTCDate()).toBe(1);
      expect(next.getUTCMonth()).toBe(2); // March
    });

    test('should handle year boundary', () => {
      const current = new Date('2025-12-20T12:00:00Z');
      const next = calculateNextBiweeklyPayment(current);

      expect(next.getUTCDate()).toBe(1);
      expect(next.getUTCMonth()).toBe(0); // January
      expect(next.getUTCFullYear()).toBe(2026);
    });
  });

  describe('Weekly Payments (day of week)', () => {
    test('should calculate next Friday when current is Monday', () => {
      const current = new Date('2025-01-13T12:00:00Z'); // Monday
      const next = calculateNextWeeklyPayment(current, 5); // Friday

      expect(next.getUTCDay()).toBe(5); // Friday
      expect(next.getUTCDate()).toBe(17);
    });

    test('should calculate next week when current is the target day', () => {
      const current = new Date('2025-01-17T12:00:00Z'); // Friday
      const next = calculateNextWeeklyPayment(current, 5); // Friday

      expect(next.getUTCDay()).toBe(5); // Friday
      expect(next.getUTCDate()).toBe(24); // Next Friday
    });

    test('should handle Sunday (day 0)', () => {
      const current = new Date('2025-01-13T12:00:00Z'); // Monday
      const next = calculateNextWeeklyPayment(current, 0); // Sunday

      expect(next.getUTCDay()).toBe(0); // Sunday
      expect(next.getUTCDate()).toBe(19);
    });

    test('should handle Saturday (day 6)', () => {
      const current = new Date('2025-01-13T12:00:00Z'); // Monday
      const next = calculateNextWeeklyPayment(current, 6); // Saturday

      expect(next.getUTCDay()).toBe(6); // Saturday
      expect(next.getUTCDate()).toBe(18);
    });

    test('should handle month boundary', () => {
      const current = new Date('2025-01-30T12:00:00Z'); // Thursday
      const next = calculateNextWeeklyPayment(current, 5); // Friday

      expect(next.getUTCDay()).toBe(5); // Friday
      expect(next.getUTCDate()).toBe(31); // Jan 31 is Friday
    });

    test('should handle year boundary', () => {
      const current = new Date('2025-12-29T12:00:00Z'); // Monday
      const next = calculateNextWeeklyPayment(current, 5); // Friday

      expect(next.getUTCDay()).toBe(5); // Friday
      expect(next.getUTCDate()).toBe(2); // Jan 2, 2026
      expect(next.getUTCFullYear()).toBe(2026);
    });
  });

  describe('Master calculateNextPaymentDate', () => {
    test('should handle MONTHLY frequency', () => {
      const current = new Date('2025-01-15T12:00:00Z');
      const next = calculateNextPaymentDate(current, RecurringPaymentFrequency.MONTHLY);

      expect(next.getUTCDate()).toBe(1);
      expect(next.getUTCMonth()).toBe(1); // February
    });

    test('should handle BIWEEKLY frequency', () => {
      const current = new Date('2025-01-10T12:00:00Z');
      const next = calculateNextPaymentDate(current, RecurringPaymentFrequency.BIWEEKLY);

      expect(next.getUTCDate()).toBe(15);
    });

    test('should handle WEEKLY frequency with default (Friday)', () => {
      const current = new Date('2025-01-13T12:00:00Z'); // Monday
      const next = calculateNextPaymentDate(current, RecurringPaymentFrequency.WEEKLY);

      expect(next.getUTCDay()).toBe(5); // Friday (default)
    });

    test('should handle WEEKLY frequency with custom day', () => {
      const current = new Date('2025-01-13T12:00:00Z'); // Monday
      const next = calculateNextPaymentDate(current, RecurringPaymentFrequency.WEEKLY, 2); // Tuesday

      expect(next.getUTCDay()).toBe(2); // Tuesday
    });

    test('should throw error for invalid frequency', () => {
      const current = new Date('2025-01-15T12:00:00Z');
      expect(() => {
        calculateNextPaymentDate(current, 99n);
      }).toThrow('Invalid frequency: 99');
    });
  });

  describe('Validation', () => {
    test('should validate MONTHLY config (1st only)', () => {
      const result = validateCalendarConfig(
        RecurringPaymentFrequency.MONTHLY,
        1n, // paymentDayOfMonth1 = 1st
        0n, // paymentDayOfMonth2 = unused
        0n  // paymentDayOfWeek = unused
      );

      expect(result.valid).toBe(true);
    });

    test('should reject MONTHLY config with wrong day', () => {
      const result = validateCalendarConfig(
        RecurringPaymentFrequency.MONTHLY,
        15n, // Not the 1st!
        0n,
        0n
      );

      expect(result.valid).toBe(false);
      expect(result.error).toContain('1st of the month');
    });

    test('should validate BIWEEKLY config (1st and 15th)', () => {
      const result = validateCalendarConfig(
        RecurringPaymentFrequency.BIWEEKLY,
        1n,  // 1st
        15n, // 15th
        0n   // unused
      );

      expect(result.valid).toBe(true);
    });

    test('should reject BIWEEKLY with wrong days', () => {
      const result = validateCalendarConfig(
        RecurringPaymentFrequency.BIWEEKLY,
        5n,  // Not 1st!
        20n, // Not 15th!
        0n
      );

      expect(result.valid).toBe(false);
    });

    test('should validate WEEKLY config', () => {
      const result = validateCalendarConfig(
        RecurringPaymentFrequency.WEEKLY,
        0n, // unused
        0n, // unused
        5n  // Friday
      );

      expect(result.valid).toBe(true);
    });

    test('should reject WEEKLY with invalid day of week', () => {
      const result = validateCalendarConfig(
        RecurringPaymentFrequency.WEEKLY,
        0n,
        0n,
        7n  // Invalid! Only 0-6
      );

      expect(result.valid).toBe(false);
      expect(result.error).toContain('0-6');
    });
  });

  describe('Standard Config Helper', () => {
    test('should return config for MONTHLY', () => {
      const config = getStandardCalendarConfig(RecurringPaymentFrequency.MONTHLY);

      expect(config.paymentDayOfMonth1).toBe(1n);
      expect(config.paymentDayOfMonth2).toBe(0n);
      expect(config.paymentDayOfWeek).toBe(0n);
    });

    test('should return config for BIWEEKLY', () => {
      const config = getStandardCalendarConfig(RecurringPaymentFrequency.BIWEEKLY);

      expect(config.paymentDayOfMonth1).toBe(1n);
      expect(config.paymentDayOfMonth2).toBe(15n);
      expect(config.paymentDayOfWeek).toBe(0n);
    });

    test('should return config for WEEKLY with default Friday', () => {
      const config = getStandardCalendarConfig(RecurringPaymentFrequency.WEEKLY);

      expect(config.paymentDayOfMonth1).toBe(0n);
      expect(config.paymentDayOfMonth2).toBe(0n);
      expect(config.paymentDayOfWeek).toBe(5n); // Friday
    });

    test('should return config for WEEKLY with custom day', () => {
      const config = getStandardCalendarConfig(RecurringPaymentFrequency.WEEKLY, 2); // Tuesday

      expect(config.paymentDayOfWeek).toBe(2n);
    });
  });

  describe('Unix Timestamp Conversion', () => {
    test('should convert Date to Unix timestamp', () => {
      const date = new Date('2025-01-15T12:00:00Z');
      const timestamp = toUnixTimestamp(date);

      expect(timestamp).toBe(1736942400n);
    });

    test('should convert Unix timestamp to Date', () => {
      const timestamp = 1736942400n; // 2025-01-15T12:00:00Z
      const date = fromUnixTimestamp(timestamp);

      expect(date.toISOString()).toBe('2025-01-15T12:00:00.000Z');
    });

    test('should round-trip correctly', () => {
      const original = new Date('2025-01-15T12:00:00Z');
      const timestamp = toUnixTimestamp(original);
      const restored = fromUnixTimestamp(timestamp);

      expect(restored.getTime()).toBe(original.getTime());
    });
  });

  describe('Human-Readable Formatting', () => {
    test('should format day of week', () => {
      expect(formatDayOfWeek(0)).toBe('Sunday');
      expect(formatDayOfWeek(1)).toBe('Monday');
      expect(formatDayOfWeek(5)).toBe('Friday');
      expect(formatDayOfWeek(6)).toBe('Saturday');
    });

    test('should describe MONTHLY schedule', () => {
      const desc = describePaymentSchedule(RecurringPaymentFrequency.MONTHLY);
      expect(desc).toBe('Monthly on the 1st');
    });

    test('should describe BIWEEKLY schedule', () => {
      const desc = describePaymentSchedule(RecurringPaymentFrequency.BIWEEKLY);
      expect(desc).toBe('Semi-monthly on the 1st and 15th');
    });

    test('should describe WEEKLY schedule', () => {
      const desc = describePaymentSchedule(RecurringPaymentFrequency.WEEKLY, 5);
      expect(desc).toBe('Weekly every Friday');
    });
  });

  describe('Real-World Scenarios', () => {
    test('should handle typical monthly payroll cycle', () => {
      // Company pays on 1st, employee checks on Jan 25
      const current = new Date('2025-01-25T12:00:00Z');
      const next = calculateNextMonthlyPayment(current);

      expect(next.getUTCDate()).toBe(1);
      expect(next.getUTCMonth()).toBe(1); // February
    });

    test('should handle biweekly payroll (1st and 15th)', () => {
      // Current: Jan 5, next should be Jan 15
      let current = new Date('2025-01-05T12:00:00Z');
      let next = calculateNextBiweeklyPayment(current);
      expect(next.getUTCDate()).toBe(15);

      // Current: Jan 12, next should be Jan 15
      current = new Date('2025-01-12T12:00:00Z');
      next = calculateNextBiweeklyPayment(current);
      expect(next.getUTCDate()).toBe(15);

      // Current: Jan 18, next should be Feb 1
      current = new Date('2025-01-18T12:00:00Z');
      next = calculateNextBiweeklyPayment(current);
      expect(next.getUTCDate()).toBe(1);
      expect(next.getUTCMonth()).toBe(1); // February
    });

    test('should handle weekly Friday payroll', () => {
      // Current: Monday Jan 13, next Friday is Jan 17
      const current = new Date('2025-01-13T12:00:00Z');
      const next = calculateNextWeeklyPayment(current, 5);

      expect(next.getUTCDay()).toBe(5); // Friday
      expect(next.getUTCDate()).toBe(17);
    });

    test('should never return February 30th or 31st', () => {
      // This is impossible with our "1st only" rule
      const jan31 = new Date('2025-01-31T12:00:00Z');
      const next = calculateNextMonthlyPayment(jan31);

      expect(next.getUTCDate()).toBe(1); // Feb 1, never Feb 30/31
      expect(next.getUTCMonth()).toBe(1); // February
    });
  });
});
