import { describe, test, expect, beforeAll, afterAll } from 'vitest';
import { PayrollAPI, emptyPayrollState, utils, type PayrollProviders } from '../index.js';
import pino from 'pino';
import { firstValueFrom, filter } from 'rxjs';
import WebSocket from 'ws';
import { TestEnvironment, TestProviders } from './commons.js';
import path from 'node:path';
import fs from 'node:fs';
import { currentDir } from './config.js';

describe('PayrollAPI', () => {
  test('should have correct initial empty state', () => {
    expect(emptyPayrollState.totalCompanies).toBe(0n);
    expect(emptyPayrollState.totalEmployees).toBe(0n);
    expect(emptyPayrollState.totalPayments).toBe(0n);
    expect(emptyPayrollState.totalSupply).toBe(0n);
    expect(emptyPayrollState.currentTimestamp).toBe(0);
  });

  // Minimal smoke: basic exports
  test('should export core types', () => {
    expect(PayrollAPI).toBeDefined();
    expect(emptyPayrollState).toBeDefined();
    expect(utils).toBeDefined();
  });

  describe('Utils', () => {
    test('should format balance correctly', () => {
      expect(utils.formatBalance(10000n)).toBe('100.00');
      expect(utils.formatBalance(2550n)).toBe('25.50');
      expect(utils.formatBalance(0n)).toBe('0.00');
    });

    test('should parse amounts correctly', () => {
      expect(utils.parseAmount('100.00')).toBe(10000n);
      expect(utils.parseAmount('25.50')).toBe(2550n);
      expect(utils.parseAmount('0.01')).toBe(1n);
    });

    test('should handle pad function', () => {
      const result = utils.pad('test', 10);
      expect(result.length).toBe(10);
      expect(result[0]).toBe(116); // 't' in ASCII
    });

    test('should generate random bytes', () => {
      const bytes1 = utils.randomBytes(32);
      const bytes2 = utils.randomBytes(32);

      expect(bytes1.length).toBe(32);
      expect(bytes2.length).toBe(32);
      expect(bytes1).not.toEqual(bytes2); // Should be different
    });

    test('should handle stringToBytes32', () => {
      const result = utils.stringToBytes32('company-acme');
      expect(result.length).toBe(32);
    });

    test('should handle stringToBytes64', () => {
      const result = utils.stringToBytes64('ACME Corporation');
      expect(result.length).toBe(64);
    });

    test('should normalize IDs', () => {
      const shortId = 'test';
      expect(utils.normalizeId(shortId)).toBe(shortId);

      const longId = 'a'.repeat(50);
      const normalized = utils.normalizeId(longId);
      expect(normalized.length).toBeLessThanOrEqual(32);
    });
  });

  describe('Integration', () => {
    let testEnvironment: TestEnvironment;
    let providers: PayrollProviders;
    const logFile = path.resolve(currentDir, '..', 'logs', 'tests', `${new Date().toISOString()}.log`);
    fs.mkdirSync(path.dirname(logFile), { recursive: true });
    const logger = pino(
      { level: process.env.LOG_LEVEL ?? 'info' },
      // Write synchronously to a file so logs always persist
      pino.destination({ dest: logFile, sync: true }),
    );

    beforeAll(async () => {
      // Ensure WebSocket global is set for indexer WS
      globalThis.WebSocket = WebSocket as unknown as typeof globalThis.WebSocket;
      testEnvironment = new TestEnvironment(logger);
      const testConfiguration = await testEnvironment.start();
      const wallet = await testEnvironment.getWallet1();
      providers = await new TestProviders().configurePayrollProviders(wallet, testConfiguration.dappConfig);
    }, 10 * 60_000);

    afterAll(async () => {
      await testEnvironment.shutdown();
    });

    test('should run full lifecycle: deploy, mint, register company, add employee, deposit, pay, withdraw', async () => {
      const companyId = `lifecycle-company-${Date.now()}`;
      const companyName = 'ACME Corp';
      const employeeId = `lifecycle-employee-${Date.now()}`;

      logger.info('Deploying Payroll contract for lifecycle test…');
      const contractAddress = await PayrollAPI.deploy(providers, logger);

      // Connect API instances
      logger.info('Connecting company API instance…');
      const companyAPI = await PayrollAPI.connect(providers, contractAddress, companyId, logger);

      logger.info('Connecting employee API instance…');
      const employeeAPI = await PayrollAPI.connect(providers, contractAddress, employeeId, logger);

      // Mint tokens
      logger.info('Minting tokens…');
      await companyAPI.mintTokens('1000000.00');
      let state = await firstValueFrom(companyAPI.state$);
      expect(state.totalSupply).toBeGreaterThan(0n);

      // Register company
      logger.info('Registering company…');
      await companyAPI.registerCompany(companyId, companyName);
      state = await firstValueFrom(companyAPI.state$);
      expect(state.totalCompanies).toBe(1n);

      const companyInfo = await companyAPI.getCompanyInfo(companyId);
      expect(companyInfo.exists).toBe(true);

      // Deposit company funds
      logger.info('Depositing company funds…');
      await companyAPI.depositCompanyFunds(companyId, '50000.00');

      // Add employee
      logger.info('Adding employee…');
      await companyAPI.addEmployee(companyId, employeeId);
      state = await firstValueFrom(companyAPI.state$);
      expect(state.totalEmployees).toBe(1n);

      const employeeInfo = await employeeAPI.getEmployeeInfo(employeeId);
      expect(employeeInfo.exists).toBe(true);

      // Pay employee
      logger.info('Paying employee…');
      await companyAPI.payEmployee(companyId, employeeId, '5000.00');
      state = await firstValueFrom(companyAPI.state$);
      expect(state.totalPayments).toBe(1n);

      // Check payment history
      logger.info('Checking payment history…');
      const paymentHistory = await employeeAPI.getEmployeePaymentHistory(employeeId);
      expect(paymentHistory.length).toBeGreaterThan(0);

      const updatedEmployeeInfo = await employeeAPI.getEmployeeInfo(employeeId);
      expect(updatedEmployeeInfo.paymentHistoryCount).toBe(1);

      // Withdraw employee salary
      logger.info('Withdrawing employee salary…');
      await employeeAPI.withdrawEmployeeSalary(employeeId, '2500.00');

      logger.info('✅ Full lifecycle test completed successfully');
    }, 5 * 60_000); // 5 minute timeout

    test('should update timestamp', async () => {
      logger.info('Deploying contract for timestamp test…');
      const contractAddress = await PayrollAPI.deploy(providers, logger);
      const api = await PayrollAPI.connect(providers, contractAddress, 'timestamp-test', logger);

      const newTimestamp = Math.floor(Date.now() / 1000);
      await api.updateTimestamp(newTimestamp);

      const state = await firstValueFrom(api.state$);
      expect(state.currentTimestamp).toBe(newTimestamp);
    }, 2 * 60_000);

    test('should handle multiple companies and employees', async () => {
      logger.info('Deploying contract for multi-company test…');
      const contractAddress = await PayrollAPI.deploy(providers, logger);
      const api = await PayrollAPI.connect(providers, contractAddress, 'multi-test', logger);

      // Mint tokens (1 tx)
      await api.mintTokens('1000000.00');

      // Register 2 companies (2 tx)
      await api.registerCompany('company-1', 'Company One');
      await api.registerCompany('company-2', 'Company Two');

      let state = await firstValueFrom(api.state$);
      expect(state.totalCompanies).toBe(2n);

      // Add 2 employees (2 tx) - reduced from 3
      await api.addEmployee('company-1', 'employee-1');
      await api.addEmployee('company-2', 'employee-2');

      state = await firstValueFrom(api.state$);
      expect(state.totalEmployees).toBe(2n);

      // Deposit for companies (2 tx)
      await api.depositCompanyFunds('company-1', '10000.00');
      await api.depositCompanyFunds('company-2', '10000.00');

      // Pay employees (2 tx) - reduced from 3
      await api.payEmployee('company-1', 'employee-1', '1000.00');
      await api.payEmployee('company-2', 'employee-2', '2000.00');

      state = await firstValueFrom(api.state$);
      expect(state.totalPayments).toBe(2n);

      logger.info('✅ Multi-company test completed successfully');
    }, 5 * 60_000); // 5 minutes - 10 transactions * ~24s each = ~240s
  });
});
