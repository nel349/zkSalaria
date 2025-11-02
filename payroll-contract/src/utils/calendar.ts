// Calendar date calculation utilities for recurring payments
// API layer handles all date math - contract only validates and stores configuration

import { RecurringPaymentFrequency } from '../types.js';

/**
 * Standard payroll calendar patterns (no edge cases):
 * - MONTHLY: Always 1st of month
 * - BIWEEKLY: 1st and 15th of month (semi-monthly)
 * - WEEKLY: Specific day of week (e.g., every Friday)
 */

// ============================================================================
// VALIDATION
// ============================================================================

/**
 * Validates calendar configuration for a given frequency
 * Enforces safe, standard payroll patterns
 */
export function validateCalendarConfig(
  frequency: bigint,
  paymentDayOfMonth1: bigint,
  paymentDayOfMonth2: bigint,
  paymentDayOfWeek: bigint
): { valid: boolean; error?: string } {
  if (frequency === RecurringPaymentFrequency.MONTHLY) {
    // MONTHLY: Must be 1st of month
    if (paymentDayOfMonth1 !== 1n) {
      return {
        valid: false,
        error: 'Monthly payments must be on the 1st of the month'
      };
    }
    if (paymentDayOfMonth2 !== 0n) {
      return {
        valid: false,
        error: 'Monthly payments only use payment_day_of_month_1'
      };
    }
    if (paymentDayOfWeek !== 0n) {
      return {
        valid: false,
        error: 'Monthly payments do not use payment_day_of_week'
      };
    }
  } else if (frequency === RecurringPaymentFrequency.BIWEEKLY) {
    // BIWEEKLY: Must be 1st and 15th
    if (paymentDayOfMonth1 !== 1n) {
      return {
        valid: false,
        error: 'Biweekly payments must use 1st as first payment day'
      };
    }
    if (paymentDayOfMonth2 !== 15n) {
      return {
        valid: false,
        error: 'Biweekly payments must use 15th as second payment day'
      };
    }
    if (paymentDayOfWeek !== 0n) {
      return {
        valid: false,
        error: 'Biweekly payments do not use payment_day_of_week'
      };
    }
  } else if (frequency === RecurringPaymentFrequency.WEEKLY) {
    // WEEKLY: Day of week 0-6 (0=Sunday, 6=Saturday)
    if (paymentDayOfWeek > 6n) {
      return {
        valid: false,
        error: 'Weekly payment day must be 0-6 (0=Sunday, 6=Saturday)'
      };
    }
    if (paymentDayOfMonth1 !== 0n) {
      return {
        valid: false,
        error: 'Weekly payments do not use payment_day_of_month_1'
      };
    }
    if (paymentDayOfMonth2 !== 0n) {
      return {
        valid: false,
        error: 'Weekly payments do not use payment_day_of_month_2'
      };
    }
  } else {
    return {
      valid: false,
      error: `Unknown frequency: ${frequency}`
    };
  }

  return { valid: true };
}

// ============================================================================
// CALENDAR CALCULATIONS
// ============================================================================

/**
 * Calculate next payment date for MONTHLY frequency (always 1st of month)
 *
 * @param currentDate Current date/time
 * @returns Next occurrence of 1st of month after currentDate
 *
 * @example
 * calculateNextMonthlyPayment(new Date('2025-01-15'))
 * // Returns: 2025-02-01 (next 1st after Jan 15)
 *
 * calculateNextMonthlyPayment(new Date('2025-02-01'))
 * // Returns: 2025-03-01 (1st is today, so next month)
 */
export function calculateNextMonthlyPayment(currentDate: Date): Date {
  const next = new Date(currentDate);

  // Set to 1st of current month at UTC midnight
  next.setUTCDate(1);
  next.setUTCHours(0, 0, 0, 0);

  // If 1st hasn't arrived yet this month, use it
  // Otherwise go to next month
  if (next > currentDate) {
    return next;
  }

  // 1st already passed (or is today), go to next month (UTC)
  next.setUTCMonth(next.getUTCMonth() + 1);
  return next;
}

/**
 * Calculate next payment date for BIWEEKLY frequency (1st and 15th)
 *
 * @param currentDate Current date/time
 * @returns Next occurrence of 1st or 15th after currentDate
 *
 * @example
 * calculateNextBiweeklyPayment(new Date('2025-01-10'))
 * // Returns: 2025-01-15 (next 15th)
 *
 * calculateNextBiweeklyPayment(new Date('2025-01-20'))
 * // Returns: 2025-02-01 (both passed, go to next month's 1st)
 */
export function calculateNextBiweeklyPayment(currentDate: Date): Date {
  const current = new Date(currentDate);

  // Create date for 1st of current month at UTC midnight
  const first = new Date(current);
  first.setUTCDate(1);
  first.setUTCHours(0, 0, 0, 0);

  // If 1st is in the future, return it
  if (first > currentDate) {
    return first;
  }

  // Create date for 15th of current month at UTC midnight
  const fifteenth = new Date(current);
  fifteenth.setUTCDate(15);
  fifteenth.setUTCHours(0, 0, 0, 0);

  // If 15th is in the future, return it
  if (fifteenth > currentDate) {
    return fifteenth;
  }

  // Both 1st and 15th have passed (or are today), go to 1st of next month
  const nextFirst = new Date(current);
  nextFirst.setUTCMonth(nextFirst.getUTCMonth() + 1);
  nextFirst.setUTCDate(1);
  nextFirst.setUTCHours(0, 0, 0, 0);

  return nextFirst;
}

/**
 * Calculate next payment date for WEEKLY frequency (specific day of week)
 *
 * @param currentDate Current date/time
 * @param dayOfWeek 0-6 (0=Sunday, 1=Monday, ..., 6=Saturday)
 * @returns Next occurrence of the specified day of week
 *
 * @example
 * calculateNextWeeklyPayment(new Date('2025-01-13'), 5)
 * // Returns: 2025-01-17 (next Friday)
 *
 * calculateNextWeeklyPayment(new Date('2025-01-17'), 5)
 * // Returns: 2025-01-24 (Friday is today, so next week)
 */
export function calculateNextWeeklyPayment(
  currentDate: Date,
  dayOfWeek: number // 0-6
): Date {
  const next = new Date(currentDate);
  next.setUTCHours(0, 0, 0, 0); // UTC midnight

  const currentDay = next.getUTCDay();
  let daysUntilNext = (dayOfWeek - currentDay + 7) % 7;

  // If it's the same day, go to next week
  if (daysUntilNext === 0) {
    daysUntilNext = 7;
  }

  next.setUTCDate(next.getUTCDate() + daysUntilNext);
  return next;
}

/**
 * Master function: Calculate next payment date based on frequency
 *
 * @param currentDate Current date/time
 * @param frequency RecurringPaymentFrequency (WEEKLY, BIWEEKLY, MONTHLY)
 * @param dayOfWeek For WEEKLY: 0-6 (0=Sunday)
 * @returns Next payment date as Date object
 *
 * @throws Error if frequency is invalid or configuration doesn't match frequency
 */
export function calculateNextPaymentDate(
  currentDate: Date,
  frequency: bigint,
  dayOfWeek: number = 5 // Default to Friday for weekly
): Date {
  if (frequency === RecurringPaymentFrequency.MONTHLY) {
    return calculateNextMonthlyPayment(currentDate);
  } else if (frequency === RecurringPaymentFrequency.BIWEEKLY) {
    return calculateNextBiweeklyPayment(currentDate);
  } else if (frequency === RecurringPaymentFrequency.WEEKLY) {
    return calculateNextWeeklyPayment(currentDate, dayOfWeek);
  } else {
    throw new Error(`Invalid frequency: ${frequency}`);
  }
}

// ============================================================================
// CONVERSION UTILITIES
// ============================================================================

/**
 * Convert JavaScript Date to Unix timestamp (seconds since epoch)
 * Contract expects Uint<32> timestamps in seconds
 */
export function toUnixTimestamp(date: Date): bigint {
  return BigInt(Math.floor(date.getTime() / 1000));
}

/**
 * Convert Unix timestamp (seconds) to JavaScript Date
 */
export function fromUnixTimestamp(timestamp: bigint): Date {
  return new Date(Number(timestamp) * 1000);
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get calendar configuration for contract based on frequency
 * Returns the standard config values for each frequency type
 */
export function getStandardCalendarConfig(
  frequency: bigint,
  dayOfWeek: number = 5 // Default to Friday for weekly
): {
  paymentDayOfMonth1: bigint;
  paymentDayOfMonth2: bigint;
  paymentDayOfWeek: bigint;
} {
  if (frequency === RecurringPaymentFrequency.MONTHLY) {
    return {
      paymentDayOfMonth1: 1n,  // Always 1st
      paymentDayOfMonth2: 0n,  // Unused
      paymentDayOfWeek: 0n     // Unused
    };
  } else if (frequency === RecurringPaymentFrequency.BIWEEKLY) {
    return {
      paymentDayOfMonth1: 1n,   // 1st
      paymentDayOfMonth2: 15n,  // 15th
      paymentDayOfWeek: 0n      // Unused
    };
  } else if (frequency === RecurringPaymentFrequency.WEEKLY) {
    return {
      paymentDayOfMonth1: 0n,               // Unused
      paymentDayOfMonth2: 0n,               // Unused
      paymentDayOfWeek: BigInt(dayOfWeek)   // 0-6
    };
  } else {
    throw new Error(`Invalid frequency: ${frequency}`);
  }
}

/**
 * Format day of week as human-readable string
 */
export function formatDayOfWeek(dayOfWeek: number): string {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[dayOfWeek] || 'Invalid';
}

/**
 * Get human-readable description of payment schedule
 */
export function describePaymentSchedule(
  frequency: bigint,
  dayOfWeek?: number
): string {
  if (frequency === RecurringPaymentFrequency.MONTHLY) {
    return 'Monthly on the 1st';
  } else if (frequency === RecurringPaymentFrequency.BIWEEKLY) {
    return 'Semi-monthly on the 1st and 15th';
  } else if (frequency === RecurringPaymentFrequency.WEEKLY && dayOfWeek !== undefined) {
    return `Weekly every ${formatDayOfWeek(dayOfWeek)}`;
  } else {
    return 'Unknown schedule';
  }
}
