# API-Layer Calendar Date Calculation - Migration Guide

## Summary of Changes

We've successfully refactored the recurring payment system to use **API-layer calendar date calculations** instead of contract-based date math.

### What Changed

#### Contract Layer (Compact)
- ✅ Added calendar configuration fields to `RecurringPayment`:
  - `payment_day_of_month_1: Uint<8>` - For monthly/biweekly
  - `payment_day_of_month_2: Uint<8>` - For biweekly (2nd day)
  - `payment_day_of_week: Uint<8>` - For weekly (0-6, Sunday=0)

- ✅ Removed complex `calculate_next_payment_date_from_anchor()` function

- ✅ Updated `create_recurring_payment()` signature:
```compact
export circuit create_recurring_payment(
  employee_id: Bytes<32>,
  amount: Uint<64>,
  frequency: Uint<8>,
  start_date: Uint<32>,
  end_date: Uint<32>,
  next_payment_date: Uint<32>,         // NEW: API-calculated
  payment_day_of_month_1: Uint<8>,     // NEW
  payment_day_of_month_2: Uint<8>,     // NEW
  payment_day_of_week: Uint<8>         // NEW
): []
```

- ✅ Updated `resume_recurring_payment()` signature:
```compact
export circuit resume_recurring_payment(
  recurring_payment_id: Bytes<32>,
  next_payment_date: Uint<32>  // NEW: API-calculated
): []
```

#### TypeScript Types
- ✅ Updated `RecurringPayment` interface with new fields

#### Test Helpers
- ✅ Updated `createRecurringPayment()` method
- ✅ Updated `resumeRecurringPayment()` method

## How to Update Tests

### Old Test Code (Before)
```typescript
const currentTimestamp = payroll.getLedgerState().current_timestamp;
const startDate = currentTimestamp + 10n;
const frequency = RecurringPaymentFrequency.WEEKLY;
const amount = 500000n;

// Old: Contract calculated next_payment_date internally
payroll.createRecurringPayment(companyId, 'EMP001', amount, frequency, startDate, 0n);

// Old: Contract calculated next_payment_date on resume
payroll.resumeRecurringPayment(companyId, 'EMP001');
```

### New Test Code (After)
```typescript
const currentTimestamp = payroll.getLedgerState().current_timestamp;
const startDate = currentTimestamp + 10n;
const frequency = RecurringPaymentFrequency.WEEKLY;
const amount = 500000n;

// NEW: Calculate next_payment_date manually (simulating API logic)
const nextPaymentDate = startDate + 604800n; // 7 days after start for weekly

// NEW: Provide calendar config
const paymentDayOfWeek = 5n; // Friday (for weekly)
const paymentDayOfMonth1 = 0n; // Unused for weekly
const paymentDayOfMonth2 = 0n; // Unused for weekly

payroll.createRecurringPayment(
  companyId,
  'EMP001',
  amount,
  frequency,
  startDate,
  0n,                    // endDate
  nextPaymentDate,       // NEW
  paymentDayOfMonth1,    // NEW
  paymentDayOfMonth2,    // NEW
  paymentDayOfWeek       // NEW
);

// NEW: Calculate next date when resuming
const currentTime = payroll.getLedgerState().current_timestamp;
const resumeNextPayment = currentTime + 604800n; // Simplified for tests

payroll.resumeRecurringPayment(companyId, 'EMP001', resumeNextPayment); // NEW parameter
```

## Calendar Config Examples

### Monthly Payments (e.g., every 1st of month)
```typescript
const frequency = RecurringPaymentFrequency.MONTHLY; // 2
const paymentDayOfMonth1 = 1n;  // Pay on 1st
const paymentDayOfMonth2 = 0n;  // Unused
const paymentDayOfWeek = 0n;    // Unused

// API would calculate: "Next 1st after start_date"
const nextPaymentDate = calculateNextFirstOfMonth(startDate);
```

### Biweekly Payments (e.g., 1st and 15th)
```typescript
const frequency = RecurringPaymentFrequency.BIWEEKLY; // 1
const paymentDayOfMonth1 = 1n;   // 1st
const paymentDayOfMonth2 = 15n;  // 15th
const paymentDayOfWeek = 0n;     // Unused

// API would calculate: "Next 1st or 15th after start_date"
const nextPaymentDate = calculateNextBiweeklyDate(startDate, 1, 15);
```

### Weekly Payments (e.g., every Friday)
```typescript
const frequency = RecurringPaymentFrequency.WEEKLY; // 0
const paymentDayOfMonth1 = 0n;  // Unused
const paymentDayOfMonth2 = 0n;  // Unused
const paymentDayOfWeek = 5n;    // Friday

// API would calculate: "Next Friday after start_date"
const nextPaymentDate = calculateNextDayOfWeek(startDate, 5);
```

## Future API Implementation

When building the API layer, implement these helper functions:

```typescript
// api/utils/calendar.ts

export function calculateNextMonthlyPayment(
  currentDate: Date,
  dayOfMonth: number // 1-31
): Date {
  const next = new Date(currentDate);
  next.setDate(dayOfMonth);

  if (next <= currentDate) {
    next.setMonth(next.getMonth() + 1);
  }

  // Handle month boundaries (Feb 30 → Feb 28/29)
  if (next.getDate() !== dayOfMonth) {
    // Day doesn't exist in this month, use last day
    next.setDate(0); // Go to last day of previous month
  }

  return next;
}

export function calculateNextBiweeklyPayment(
  currentDate: Date,
  day1: number, // e.g., 1
  day2: number  // e.g., 15
): Date {
  const option1 = new Date(currentDate);
  option1.setDate(day1);

  const option2 = new Date(currentDate);
  option2.setDate(day2);

  // Find nearest future date
  if (option1 > currentDate) return option1;
  if (option2 > currentDate) return option2;

  // Both passed, go to next month's day1
  option1.setMonth(option1.getMonth() + 1);
  return option1;
}

export function calculateNextWeeklyPayment(
  currentDate: Date,
  dayOfWeek: number // 0-6 (0=Sunday)
): Date {
  const next = new Date(currentDate);
  const currentDay = next.getDay();
  const daysUntilNext = (dayOfWeek - currentDay + 7) % 7 || 7;

  next.setDate(next.getDate() + daysUntilNext);
  return next;
}

// Convert to Unix timestamp for contract
export function toUnixTimestamp(date: Date): number {
  return Math.floor(date.getTime() / 1000);
}
```

## Testing Strategy

For now, tests use simplified date calculations (e.g., `startDate + 604800n` for weekly).

When the API is built, tests should:
1. Call API helper functions to calculate dates
2. Pass those dates to contract
3. Verify contract accepts and stores them correctly

## Benefits of This Architecture

✅ **Simple Contract**: No complex date math in ZK circuits
✅ **Flexible**: Easy to add new calendar patterns (e.g., "last Friday of month")
✅ **Maintainable**: Date logic in TypeScript, not Compact
✅ **Future-Proof**: When Midnight adds native date support, easy to migrate
✅ **Testable**: Can unit test calendar logic separately from contract
✅ **Realistic**: Supports actual payroll patterns (1st of month, every Friday, etc.)

## Next Steps

1. ✅ Contract refactored (DONE)
2. ⏳ Update all tests to pass new parameters (IN PROGRESS)
3. 🔜 Build API layer with calendar calculation functions
4. 🔜 Add timezone support in API
5. 🔜 Handle edge cases (leap years, month boundaries, holidays)
