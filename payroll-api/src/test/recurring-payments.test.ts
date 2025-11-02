import { describe, test, expect, beforeAll, afterAll } from 'vitest';
import { PayrollAPI, RecurringPaymentFrequency, RecurringPaymentStatus, utils } from '../index.js';
import pino from 'pino';
import WebSocket from 'ws';
import { TestEnvironment, TestProviders } from './commons.js';
import path from 'node:path';
import fs from 'node:fs';
import { currentDir } from './config.js';

describe('Recurring Payments API - Phase 1.6.1', () => {
  let testEnvironment: TestEnvironment;
  let providers: any;
  const logFile = path.resolve(currentDir, '..', 'logs', 'tests', `recurring-${new Date().toISOString()}.log`);
  fs.mkdirSync(path.dirname(logFile), { recursive: true });
  const logger = pino(
    { level: process.env.LOG_LEVEL ?? 'info' },
    pino.destination({ dest: logFile, sync: true }),
  );

  beforeAll(async () => {
    globalThis.WebSocket = WebSocket as unknown as typeof globalThis.WebSocket;
    testEnvironment = new TestEnvironment(logger);
    const testConfiguration = await testEnvironment.start();
    const wallet = await testEnvironment.getWallet1();
    providers = await new TestProviders().configurePayrollProviders(wallet, testConfiguration.dappConfig);
  }, 10 * 60_000);

  afterAll(async () => {
    await testEnvironment.shutdown();
  });

  test('Methods 1-7: complete recurring payment lifecycle', async () => {
    const companyId = `recurring-full-test-${Date.now()}`;
    const companyName = 'Recurring Test Corp';
    const employeeId = `emp-recurring-${Date.now()}`;

    logger.info('=== COMBINED TEST: Methods 1-7 ===');

    // Setup
    logger.info('Deploying contract...');
    const contractAddress = await PayrollAPI.deploy(providers, companyId, companyName, logger);
    const api = await PayrollAPI.connect(providers, contractAddress, companyId, logger);

    logger.info('Adding employee...');
    await api.addEmployee(companyId, employeeId);

    logger.info('Depositing company funds...');
    await api.depositCompanyFunds(companyId, '100000.00');

    // METHOD 1: Create recurring payment
    logger.info('METHOD 1: Creating weekly recurring payment...');
    const startDate = new Date();
    startDate.setDate(startDate.getDate() + 1);

    await api.createRecurringPayment(
      companyId,
      employeeId,
      '2000.00',
      RecurringPaymentFrequency.WEEKLY,
      startDate,
      null,
      5 // Friday
    );

    let recurringPayment = await api.getRecurringPaymentByEmployee(employeeId);
    expect(recurringPayment).not.toBeNull();
    expect(recurringPayment!.status).toBe(RecurringPaymentStatus.ACTIVE);
    expect(recurringPayment!.frequency).toBe(RecurringPaymentFrequency.WEEKLY);
    expect(recurringPayment!.payment_day_of_week).toBe(5n);
    logger.info('✅ Method 1 PASSED: createRecurringPayment()');

    // Get recurring payment ID (convert Bytes<32> to hex string for passing to API)
    const recurringPaymentId = utils.bytes32ToHex(recurringPayment!.recurring_payment_id);
    logger.info(`Recurring payment ID (hex): ${recurringPaymentId.substring(0, 40)}...`);

    // METHOD 2: Pause
    logger.info('METHOD 2: Pausing recurring payment...');
    await api.pauseRecurringPayment(recurringPaymentId);

    recurringPayment = await api.getRecurringPaymentByEmployee(employeeId);
    expect(recurringPayment!.status).toBe(RecurringPaymentStatus.PAUSED);
    logger.info('✅ Method 2 PASSED: pauseRecurringPayment()');

    // METHOD 3: Resume
    logger.info('METHOD 3: Resuming recurring payment...');
    await api.resumeRecurringPayment(recurringPaymentId);

    recurringPayment = await api.getRecurringPaymentByEmployee(employeeId);
    expect(recurringPayment!.status).toBe(RecurringPaymentStatus.ACTIVE);
    logger.info('✅ Method 3 PASSED: resumeRecurringPayment()');

    // METHOD 6: Get recurring payment by ID
    logger.info('METHOD 6: Querying recurring payment by ID...');
    const paymentById = await api.getRecurringPayment(recurringPaymentId);
    expect(paymentById).not.toBeNull();
    expect(paymentById!.status).toBe(RecurringPaymentStatus.ACTIVE);
    expect(paymentById!.encrypted_amount).toEqual(recurringPayment!.encrypted_amount);
    logger.info('✅ Method 6 PASSED: getRecurringPayment()');

    // METHOD 7: Get recurring payment by employee (already used throughout, explicit verification)
    logger.info('METHOD 7: Querying recurring payment by employee...');
    const paymentByEmployee = await api.getRecurringPaymentByEmployee(employeeId);
    expect(paymentByEmployee).not.toBeNull();
    expect(paymentByEmployee!.employee_id).toEqual(utils.stringToBytes32(employeeId));
    logger.info('✅ Method 7 PASSED: getRecurringPaymentByEmployee()');

    // METHOD 4: Edit recurring payment amount
    logger.info('METHOD 4: Editing recurring payment amount...');
    const originalEncryptedAmount = recurringPayment!.encrypted_amount;
    const newAmount = '3000.00';
    await api.editRecurringPayment(recurringPaymentId, newAmount);

    recurringPayment = await api.getRecurringPaymentByEmployee(employeeId);
    // Encrypted amount should have changed
    expect(recurringPayment!.encrypted_amount).not.toEqual(originalEncryptedAmount);
    logger.info('✅ Method 4 PASSED: editRecurringPayment()');

    // METHOD 5: Process recurring payment
    logger.info('METHOD 5: Processing recurring payment...');

    // Update timestamp to future to make payment due
    const futureTimestamp = Math.floor(Date.now() / 1000) + (8 * 24 * 60 * 60); // 8 days in future
    await api.updateTimestamp(futureTimestamp);

    // Get payment history before processing
    const paymentHistoryBefore = await api.getEmployeePaymentHistory(employeeId);
    const paymentCountBefore = paymentHistoryBefore.filter((p: any) => p.timestamp > 0).length;
    logger.info(`Payment history count before: ${paymentCountBefore}`);

    // Get current next_payment_date before processing
    const nextPaymentBefore = Number(recurringPayment!.next_payment_date);

    // Process the recurring payment
    await api.processRecurringPayment(recurringPaymentId);

    // Verify payment was added to history
    const paymentHistoryAfter = await api.getEmployeePaymentHistory(employeeId);
    const paymentCountAfter = paymentHistoryAfter.filter((p: any) => p.timestamp > 0).length;
    expect(paymentCountAfter).toBe(paymentCountBefore + 1);
    logger.info(`Payment history count after: ${paymentCountAfter} (increased by 1)`);

    // Verify next payment date was updated (should be 7 days later for weekly)
    recurringPayment = await api.getRecurringPaymentByEmployee(employeeId);

    // Find the new payment record
    const newPayment = paymentHistoryAfter.find((p: any) =>
      p.timestamp > 0 && !paymentHistoryBefore.some((old: any) =>
        old.timestamp === p.timestamp
      )
    );
    expect(newPayment).toBeDefined();
    logger.info(`New payment record found with timestamp: ${newPayment!.timestamp}`);

    // Verify the payment has encrypted amount (should match recurring payment's encrypted amount)
    expect(newPayment!.encrypted_amount).toBeDefined();
    expect(newPayment!.encrypted_amount).toEqual(recurringPayment!.encrypted_amount);
    logger.info('Payment encrypted_amount matches recurring payment encrypted_amount');

    // Verify next payment date was properly updated
    const nextPaymentAfter = Number(recurringPayment!.next_payment_date);
    expect(nextPaymentAfter).toBeGreaterThan(nextPaymentBefore);
    const daysDifference = (nextPaymentAfter - nextPaymentBefore) / (24 * 60 * 60);
    expect(daysDifference).toBeGreaterThanOrEqual(6); // At least 6 days (accounting for rounding)
    expect(daysDifference).toBeLessThanOrEqual(8); // At most 8 days
    logger.info(`Next payment date updated: ${nextPaymentBefore} -> ${nextPaymentAfter} (${daysDifference.toFixed(1)} days)`);

    // Verify employee info updated
    const employeeInfoAfter = await api.getEmployeeInfo(employeeId);
    expect(employeeInfoAfter.paymentHistoryCount).toBe(paymentCountAfter);

    logger.info('✅ Method 5 PASSED: processRecurringPayment()');

    logger.info('✅✅✅ ALL SEVEN METHODS PASSED! ✅✅✅');
  }, 5 * 60_000);
});
