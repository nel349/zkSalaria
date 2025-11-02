// Example usage of calendar utilities for recurring payments
// This demonstrates how to use the API layer to calculate payment dates

import {
  calculateNextPaymentDate,
  getStandardCalendarConfig,
  validateCalendarConfig,
  toUnixTimestamp,
  describePaymentSchedule
} from './calendar.js';
import { RecurringPaymentFrequency } from '../types.js';

// =============================================================================
// Example 1: Monthly Payment (always 1st of month)
// =============================================================================

function exampleMonthlyPayment() {
  console.log('\n📅 Example 1: Monthly Payment (1st of month)\n');

  const currentDate = new Date('2025-01-15T12:00:00Z'); // Jan 15
  const frequency = RecurringPaymentFrequency.MONTHLY;

  // Get standard config for monthly
  const config = getStandardCalendarConfig(frequency);
  console.log('Config:', config);
  // { paymentDayOfMonth1: 1n, paymentDayOfMonth2: 0n, paymentDayOfWeek: 0n }

  // Validate config
  const validation = validateCalendarConfig(
    frequency,
    config.paymentDayOfMonth1,
    config.paymentDayOfMonth2,
    config.paymentDayOfWeek
  );
  console.log('Valid:', validation.valid); // true

  // Calculate next payment date
  const nextPayment = calculateNextPaymentDate(currentDate, frequency);
  console.log('Next payment:', nextPayment.toISOString()); // 2025-02-01T00:00:00.000Z

  // Convert to Unix timestamp for contract
  const timestamp = toUnixTimestamp(nextPayment);
  console.log('Unix timestamp:', timestamp); // 1738368000n

  // Get human-readable description
  const description = describePaymentSchedule(frequency);
  console.log('Schedule:', description); // "Monthly on the 1st"
}

// =============================================================================
// Example 2: Biweekly Payment (1st and 15th)
// =============================================================================

function exampleBiweeklyPayment() {
  console.log('\n📅 Example 2: Biweekly Payment (1st and 15th)\n');

  const currentDate = new Date('2025-01-10T12:00:00Z'); // Jan 10
  const frequency = RecurringPaymentFrequency.BIWEEKLY;

  const config = getStandardCalendarConfig(frequency);
  console.log('Config:', config);
  // { paymentDayOfMonth1: 1n, paymentDayOfMonth2: 15n, paymentDayOfWeek: 0n }

  const nextPayment = calculateNextPaymentDate(currentDate, frequency);
  console.log('Next payment:', nextPayment.toISOString()); // 2025-01-15T00:00:00.000Z

  const timestamp = toUnixTimestamp(nextPayment);
  console.log('Unix timestamp:', timestamp);

  const description = describePaymentSchedule(frequency);
  console.log('Schedule:', description); // "Semi-monthly on the 1st and 15th"
}

// =============================================================================
// Example 3: Weekly Payment (every Friday)
// =============================================================================

function exampleWeeklyPayment() {
  console.log('\n📅 Example 3: Weekly Payment (every Friday)\n');

  const currentDate = new Date('2025-01-13T12:00:00Z'); // Monday Jan 13
  const frequency = RecurringPaymentFrequency.WEEKLY;
  const dayOfWeek = 5; // Friday

  const config = getStandardCalendarConfig(frequency, dayOfWeek);
  console.log('Config:', config);
  // { paymentDayOfMonth1: 0n, paymentDayOfMonth2: 0n, paymentDayOfWeek: 5n }

  const nextPayment = calculateNextPaymentDate(currentDate, frequency, dayOfWeek);
  console.log('Next payment:', nextPayment.toISOString()); // 2025-01-17T00:00:00.000Z (Friday)

  const timestamp = toUnixTimestamp(nextPayment);
  console.log('Unix timestamp:', timestamp);

  const description = describePaymentSchedule(frequency, dayOfWeek);
  console.log('Schedule:', description); // "Weekly every Friday"
}

// =============================================================================
// Example 4: Complete Workflow - Create Recurring Payment
// =============================================================================

function exampleCreateRecurringPayment() {
  console.log('\n📅 Example 4: Complete Workflow - Create Recurring Payment\n');

  // Employee wants to be paid every Friday
  const frequency = RecurringPaymentFrequency.WEEKLY;
  const dayOfWeek = 5; // Friday
  const startDate = new Date('2025-01-15T00:00:00Z'); // Start on Jan 15
  const amount = 500000n; // $5,000.00 (assuming 2 decimal places)

  // Step 1: Get standard config
  const config = getStandardCalendarConfig(frequency, dayOfWeek);

  // Step 2: Validate config
  const validation = validateCalendarConfig(
    frequency,
    config.paymentDayOfMonth1,
    config.paymentDayOfMonth2,
    config.paymentDayOfWeek
  );

  if (!validation.valid) {
    throw new Error(`Invalid config: ${validation.error}`);
  }

  // Step 3: Calculate first payment date
  const firstPayment = calculateNextPaymentDate(startDate, frequency, dayOfWeek);
  console.log('First payment:', firstPayment.toISOString()); // 2025-01-17T00:00:00.000Z (Friday)

  // Step 4: Convert to contract parameters
  const params = {
    amount,
    frequency,
    startDate: toUnixTimestamp(startDate),
    endDate: 0n, // Never expires
    nextPaymentDate: toUnixTimestamp(firstPayment),
    paymentDayOfMonth1: config.paymentDayOfMonth1,
    paymentDayOfMonth2: config.paymentDayOfMonth2,
    paymentDayOfWeek: config.paymentDayOfWeek
  };

  console.log('Contract parameters:', params);
  // Now pass these to contract.impureCircuits.create_recurring_payment()
}

// =============================================================================
// Example 5: Resume Payment - Recalculate Next Date
// =============================================================================

function exampleResumePayment() {
  console.log('\n📅 Example 5: Resume Payment - Recalculate Next Date\n');

  // Payment was paused on Jan 5, now resuming on Jan 20
  const currentDate = new Date('2025-01-20T12:00:00Z');

  // Original config: biweekly (1st and 15th)
  const frequency = RecurringPaymentFrequency.BIWEEKLY;

  // Recalculate next payment from current date
  const nextPayment = calculateNextPaymentDate(currentDate, frequency);
  console.log('Next payment after resume:', nextPayment.toISOString()); // 2025-02-01T00:00:00.000Z

  const timestamp = toUnixTimestamp(nextPayment);
  console.log('Pass to resume_recurring_payment:', timestamp);
  // Now pass to contract.impureCircuits.resume_recurring_payment()
}

// =============================================================================
// Run all examples
// =============================================================================

if (require.main === module) {
  exampleMonthlyPayment();
  exampleBiweeklyPayment();
  exampleWeeklyPayment();
  exampleCreateRecurringPayment();
  exampleResumePayment();
}
