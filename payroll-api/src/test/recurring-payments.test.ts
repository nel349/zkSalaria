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

  test('Methods 1-3: create, pause, and resume recurring payment', async () => {
    const companyId = `recurring-full-test-${Date.now()}`;
    const companyName = 'Recurring Test Corp';
    const employeeId = `emp-recurring-${Date.now()}`;

    logger.info('=== COMBINED TEST: Methods 1, 2, 3 ===');

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

    logger.info('✅✅✅ ALL THREE METHODS PASSED! ✅✅✅');
  }, 5 * 60_000);
});
