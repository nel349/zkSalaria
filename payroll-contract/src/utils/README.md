# Calendar Utilities for Recurring Payments

API-layer calendar date calculation utilities for zkSalaria recurring payment system.

## Overview

This module provides calendar date calculation functions that **simplify** the smart contract by moving complex date math to the API layer where JavaScript `Date` objects are available.

### Why API-Layer?

1. **Simplicity**: Compact doesn't support native date/calendar functions
2. **Flexibility**: Easy to add new calendar patterns (holidays, custom schedules)
3. **No Edge Cases**: Using only 1st, 15th, and day-of-week eliminates February 30th issues
4. **Future-Proof**: When Midnight adds native date support, easy to migrate
5. **Standard Practice**: Matches how real payroll systems work

## Standard Payroll Patterns

We enforce these **safe, standard** payroll patterns (no edge cases):

### Monthly: Always 1st of Month
```typescript
// MONTHLY: Always pay on the 1st
// ✅ Works in every month (including February)
// ✅ No edge cases for 28, 29, 30, or 31 days
payment_day_of_month_1 = 1n
payment_day_of_month_2 = 0n  // unused
payment_day_of_week = 0n      // unused
```

### Biweekly: 1st and 15th
```typescript
// BIWEEKLY: Pay on 1st and 15th (semi-monthly)
// ✅ Both dates exist in every month
// ✅ Common business practice
payment_day_of_month_1 = 1n   // 1st
payment_day_of_month_2 = 15n  // 15th
payment_day_of_week = 0n       // unused
```

### Weekly: Any Day of Week
```typescript
// WEEKLY: Pay every Friday (or any day)
// ✅ No month boundary issues
// ✅ Very common for contractors/hourly workers
payment_day_of_month_1 = 0n  // unused
payment_day_of_month_2 = 0n  // unused
payment_day_of_week = 5n      // Friday (0=Sunday, 6=Saturday)
```

## API Functions

### Core Functions

```typescript
// Calculate next payment date based on frequency
calculateNextPaymentDate(
  currentDate: Date,
  frequency: bigint,
  dayOfWeek?: number
): Date

// Get standard config for a frequency
getStandardCalendarConfig(
  frequency: bigint,
  dayOfWeek?: number
): {
  paymentDayOfMonth1: bigint;
  paymentDayOfMonth2: bigint;
  paymentDayOfWeek: bigint;
}

// Validate calendar configuration
validateCalendarConfig(
  frequency: bigint,
  paymentDayOfMonth1: bigint,
  paymentDayOfMonth2: bigint,
  paymentDayOfWeek: bigint
): { valid: boolean; error?: string }

// Convert to/from Unix timestamps
toUnixTimestamp(date: Date): bigint
fromUnixTimestamp(timestamp: bigint): Date

// Human-readable descriptions
describePaymentSchedule(frequency: bigint, dayOfWeek?: number): string
formatDayOfWeek(dayOfWeek: number): string
```

## Usage Examples

### Example 1: Create Monthly Recurring Payment

```typescript
import {
  calculateNextPaymentDate,
  getStandardCalendarConfig,
  validateCalendarConfig,
  toUnixTimestamp,
  RecurringPaymentFrequency
} from '@zksalaria/payroll-contract';

// Setup
const frequency = RecurringPaymentFrequency.MONTHLY;
const startDate = new Date('2025-01-15T00:00:00Z');
const amount = 500000n; // $5,000.00

// Get standard config
const config = getStandardCalendarConfig(frequency);
// { paymentDayOfMonth1: 1n, paymentDayOfMonth2: 0n, paymentDayOfWeek: 0n }

// Validate
const validation = validateCalendarConfig(
  frequency,
  config.paymentDayOfMonth1,
  config.paymentDayOfMonth2,
  config.paymentDayOfWeek
);
if (!validation.valid) throw new Error(validation.error);

// Calculate first payment date
const nextPayment = calculateNextPaymentDate(startDate, frequency);
// Returns: 2025-02-01T00:00:00.000Z (next 1st after Jan 15)

// Convert to contract parameters
const params = {
  amount,
  frequency,
  startDate: toUnixTimestamp(startDate),
  endDate: 0n, // Never expires
  nextPaymentDate: toUnixTimestamp(nextPayment),
  paymentDayOfMonth1: config.paymentDayOfMonth1,
  paymentDayOfMonth2: config.paymentDayOfMonth2,
  paymentDayOfWeek: config.paymentDayOfWeek
};

// Call contract
await contract.impureCircuits.create_recurring_payment(
  ctx,
  employeeIdBytes,
  params.amount,
  params.frequency,
  params.startDate,
  params.endDate,
  params.nextPaymentDate,
  params.paymentDayOfMonth1,
  params.paymentDayOfMonth2,
  params.paymentDayOfWeek
);
```

### Example 2: Resume Paused Payment

```typescript
// Payment was paused, now resuming
const currentDate = new Date('2025-01-20T12:00:00Z');
const frequency = RecurringPaymentFrequency.BIWEEKLY; // 1st and 15th

// Recalculate next payment from current date
const nextPayment = calculateNextPaymentDate(currentDate, frequency);
// Returns: 2025-02-01T00:00:00.000Z (next 1st after Jan 20)

const timestamp = toUnixTimestamp(nextPayment);

// Call contract
await contract.impureCircuits.resume_recurring_payment(
  ctx,
  recurringPaymentId,
  timestamp
);
```

### Example 3: Weekly Friday Payroll

```typescript
const frequency = RecurringPaymentFrequency.WEEKLY;
const dayOfWeek = 5; // Friday
const startDate = new Date('2025-01-13T00:00:00Z'); // Monday

const config = getStandardCalendarConfig(frequency, dayOfWeek);
// { paymentDayOfMonth1: 0n, paymentDayOfMonth2: 0n, paymentDayOfWeek: 5n }

const nextPayment = calculateNextPaymentDate(startDate, frequency, dayOfWeek);
// Returns: 2025-01-17T00:00:00.000Z (next Friday)

const description = describePaymentSchedule(frequency, dayOfWeek);
// "Weekly every Friday"
```

## No February Edge Cases!

Because we only use **1st** for monthly and **1st and 15th** for biweekly:

```typescript
// January 31 → Next monthly payment
const jan31 = new Date('2025-01-31T12:00:00Z');
const next = calculateNextMonthlyPayment(jan31);
// Returns: 2025-02-01T00:00:00.000Z ✅

// February 28 (non-leap year) → Next monthly payment
const feb28 = new Date('2025-02-28T12:00:00Z');
const next2 = calculateNextMonthlyPayment(feb28);
// Returns: 2025-03-01T00:00:00.000Z ✅

// Never returns Feb 30 or Feb 31 - impossible!
```

## Testing

All calendar functions have comprehensive tests covering:
- ✅ Monthly payments (1st of month)
- ✅ Biweekly payments (1st and 15th)
- ✅ Weekly payments (any day of week)
- ✅ Month boundaries (Jan 31 → Feb 1)
- ✅ Year boundaries (Dec 31 → Jan 1)
- ✅ February handling (28/29 days)
- ✅ Leap years
- ✅ Timezone handling (UTC)
- ✅ Edge cases (payment date exactly at midnight)

Run tests:
```bash
npm test src/utils/calendar.test.ts
```

## Architecture Benefits

✅ **Simple Contract**: No complex date math in ZK circuits
✅ **No Edge Cases**: Using only 1st, 15th, day-of-week eliminates February issues
✅ **Flexible**: Easy to add new patterns (holidays, custom schedules)
✅ **Maintainable**: Date logic in TypeScript, not Compact
✅ **Future-Proof**: When Midnight adds native date support, easy to migrate
✅ **Testable**: Can unit test calendar logic separately from contract
✅ **Realistic**: Matches actual payroll patterns used by real companies
✅ **Global**: Uses UTC to avoid timezone issues

## Future Enhancements

When building the full API layer, consider adding:

1. **Holiday Handling**: Skip payments on holidays, move to next business day
2. **Custom Schedules**: "Last Friday of month", "Every other Monday", etc.
3. **Multiple Timezones**: Convert UTC to local time for display
4. **Payment History**: Track all past payment dates
5. **Dry Run**: Preview next N payment dates before creating
6. **End Date Handling**: Auto-cancel when end_date reached

## See Also

- `calendar.ts` - Implementation
- `calendar.test.ts` - Comprehensive tests
- `calendar-example.ts` - Usage examples
- `API_CALENDAR_MIGRATION.md` - Migration guide from old approach
