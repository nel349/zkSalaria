/**
 * PayrollAPI Integration Tests
 * Tests all 7 implemented circuits with Docker Compose test environment
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PayrollAPI, type DeployedPayrollAPI, type PayrollDerivedState } from '../payroll-api';
import { TestEnvironment, createTestLogger, waitForDeployment } from './commons';
import { type ContractAddress } from '@midnight-ntwrk/compact-runtime';
import { firstValueFrom } from 'rxjs';

describe('PayrollAPI Integration Tests', () => {
  let testEnv: TestEnvironment;
  let contractAddress: ContractAddress;
  let companyAPI: DeployedPayrollAPI;
  let employeeAPI: DeployedPayrollAPI;
  const logger = createTestLogger();

  beforeAll(async () => {
    // Start test environment (Docker Compose)
    testEnv = new TestEnvironment();
    await testEnv.start();

    // Deploy payroll contract
    const providers = testEnv.getProviders();
    contractAddress = await PayrollAPI.deploy(providers, logger);

    // Wait for deployment to be indexed
    await waitForDeployment(providers, contractAddress);

    // Connect company API instance
    companyAPI = await PayrollAPI.connect(
      providers,
      contractAddress,
      'company-acme',
      logger,
    );

    // Connect employee API instance
    employeeAPI = await PayrollAPI.connect(
      providers,
      contractAddress,
      'employee-alice',
      logger,
    );
  }, 60000); // 60s timeout for deployment

  afterAll(async () => {
    // Clean up test environment
    await testEnv.stop();
  });

  describe('System Operations', () => {
    it('should mint tokens successfully', async () => {
      await companyAPI.mintTokens('1000000.00');

      const state = await firstValueFrom(companyAPI.state$);
      expect(state.totalSupply).toBeGreaterThan(0n);
    });

    it('should update timestamp', async () => {
      const newTimestamp = Math.floor(Date.now() / 1000);
      await companyAPI.updateTimestamp(newTimestamp);

      const state = await firstValueFrom(companyAPI.state$);
      expect(state.currentTimestamp).toBe(newTimestamp);
    });
  });

  describe('Company Operations', () => {
    const companyId = 'company-acme';
    const companyName = 'ACME Corporation';

    it('should register company successfully', async () => {
      await companyAPI.registerCompany(companyId, companyName);

      const info = await companyAPI.getCompanyInfo(companyId);
      expect(info.exists).toBe(true);
      expect(info.companyId).toBe(companyId);

      const state = await firstValueFrom(companyAPI.state$);
      expect(state.totalCompanies).toBe(1n);
      expect(state.lastTransaction?.type).toBe('register_company');
    });

    it('should deposit company funds', async () => {
      const depositAmount = '50000.00';
      await companyAPI.depositCompanyFunds(companyId, depositAmount);

      const state = await firstValueFrom(companyAPI.state$);
      expect(state.lastTransaction?.type).toBe('deposit');
      expect(state.lastTransaction?.amount).toBe(5000000n); // 50000.00 * 100
    });

    it('should get company info for non-existent company', async () => {
      const info = await companyAPI.getCompanyInfo('company-nonexistent');
      expect(info.exists).toBe(false);
    });
  });

  describe('Employee Operations', () => {
    const companyId = 'company-acme';
    const employeeId = 'employee-alice';

    it('should add employee successfully', async () => {
      await companyAPI.addEmployee(companyId, employeeId);

      const info = await employeeAPI.getEmployeeInfo(employeeId);
      expect(info.exists).toBe(true);
      expect(info.employeeId).toBe(employeeId);

      const state = await firstValueFrom(companyAPI.state$);
      expect(state.totalEmployees).toBe(1n);
      expect(state.lastTransaction?.type).toBe('add_employee');
    });

    it('should get employee info for non-existent employee', async () => {
      const info = await employeeAPI.getEmployeeInfo('employee-nonexistent');
      expect(info.exists).toBe(false);
    });
  });

  describe('Payment Operations', () => {
    const companyId = 'company-acme';
    const employeeId = 'employee-alice';
    const paymentAmount = '5000.00';

    it('should pay employee salary', async () => {
      await companyAPI.payEmployee(companyId, employeeId, paymentAmount);

      const state = await firstValueFrom(companyAPI.state$);
      expect(state.totalPayments).toBe(1n);
      expect(state.lastTransaction?.type).toBe('pay_salary');
      expect(state.lastTransaction?.amount).toBe(500000n); // 5000.00 * 100
    });

    it('should get employee payment history', async () => {
      const history = await employeeAPI.getEmployeePaymentHistory(employeeId);
      expect(history.length).toBeGreaterThan(0);
      expect(history[0].amount).toBeGreaterThan(0n);
    });

    it('should return empty history for employee with no payments', async () => {
      const history = await employeeAPI.getEmployeePaymentHistory('employee-bob');
      expect(history).toEqual([]);
    });

    it('should track payment count in employee info', async () => {
      const info = await employeeAPI.getEmployeeInfo(employeeId);
      expect(info.paymentHistoryCount).toBe(1);
    });
  });

  describe('Withdrawal Operations', () => {
    const employeeId = 'employee-alice';
    const withdrawAmount = '2500.00';

    it('should allow employee to withdraw salary', async () => {
      await employeeAPI.withdrawEmployeeSalary(employeeId, withdrawAmount);

      const state = await firstValueFrom(employeeAPI.state$);
      expect(state.lastTransaction?.type).toBe('withdraw');
      expect(state.lastTransaction?.amount).toBe(250000n); // 2500.00 * 100
    });
  });

  describe('Reactive State Management', () => {
    it('should emit state updates via Observable', async () => {
      const statePromise = firstValueFrom(companyAPI.state$);
      const state = await statePromise;

      expect(state).toBeDefined();
      expect(state.totalCompanies).toBeGreaterThanOrEqual(0n);
      expect(state.totalEmployees).toBeGreaterThanOrEqual(0n);
      expect(state.totalPayments).toBeGreaterThanOrEqual(0n);
      expect(state.totalSupply).toBeGreaterThanOrEqual(0n);
    });

    it('should track last transaction in state', async () => {
      await companyAPI.mintTokens('1000.00');

      const state = await firstValueFrom(companyAPI.state$);
      expect(state.lastTransaction).toBeDefined();
      expect(state.lastTransaction?.type).toBe('mint_tokens');
    });
  });

  describe('Multi-Company Scenario', () => {
    const company2Id = 'company-globex';
    const company2Name = 'Globex Corporation';
    const employee2Id = 'employee-bob';

    it('should handle multiple companies', async () => {
      // Register second company
      await companyAPI.registerCompany(company2Id, company2Name);

      const state = await firstValueFrom(companyAPI.state$);
      expect(state.totalCompanies).toBeGreaterThanOrEqual(2n);
    });

    it('should add employee to second company', async () => {
      await companyAPI.addEmployee(company2Id, employee2Id);

      const state = await firstValueFrom(companyAPI.state$);
      expect(state.totalEmployees).toBeGreaterThanOrEqual(2n);
    });

    it('should pay employee from second company', async () => {
      await companyAPI.payEmployee(company2Id, employee2Id, '3000.00');

      const state = await firstValueFrom(companyAPI.state$);
      expect(state.totalPayments).toBeGreaterThanOrEqual(2n);
    });
  });
});
