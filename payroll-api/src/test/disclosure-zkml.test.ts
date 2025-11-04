import { describe, test, expect, beforeAll, afterAll } from 'vitest';
import { PayrollAPI, type PayrollProviders, utils, PermissionType } from '../index.js';
import pino from 'pino';
import { firstValueFrom } from 'rxjs';
import WebSocket from 'ws';
import { TestEnvironment, TestProviders } from './commons.js';
import path from 'node:path';
import fs from 'node:fs';
import { currentDir } from './config.js';

/**
 * E2E tests for Disclosure Management & ZKML Income Proofs
 * Tests full integration with Midnight testnet
 * Consolidated to minimize testnet load while maintaining full coverage
 */
describe('Disclosure & ZKML API - E2E Tests', () => {
  let testEnvironment: TestEnvironment;
  let providers: PayrollProviders;
  const logFile = path.resolve(currentDir, '..', 'logs', 'tests', `disclosure-zkml-${new Date().toISOString()}.log`);
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

  describe('Disclosure Management', () => {
    test('should grant and revoke all disclosure types (income, employment, audit)', async () => {
      const companyId = `disclosure-all-${Date.now()}`;
      const employeeId = `employee-${Date.now()}`;
      const lenderId = `lender-${Date.now()}`;
      const verifierId = `verifier-${Date.now()}`;
      const auditorId = `auditor-${Date.now()}`;

      logger.info('Deploying contract for comprehensive disclosure test…');
      const contractAddress = await PayrollAPI.deploy(providers, companyId, 'Disclosure Test Corp', logger);
      const companyAPI = await PayrollAPI.connect(providers, contractAddress, companyId, logger);

      // Setup: Add employee and establish payment history
      logger.info('Setting up employee with payment history…');
      await companyAPI.addEmployee(companyId, employeeId);
      await companyAPI.depositCompanyFunds(companyId, '10000.00');
      await companyAPI.payEmployee(companyId, employeeId, '5000.00');

      let state = await firstValueFrom(companyAPI.state$);
      expect(state.totalEmployees).toBe(1n);
      expect(state.totalPayments).toBe(1n);

      // Test 1: Income Disclosure
      logger.info('Testing income disclosure (grant + revoke)…');
      await companyAPI.grantIncomeDisclosure(employeeId, lenderId, '4000.00', 86400);
      logger.info('✅ Income disclosure granted');
      await companyAPI.revokeDisclosure(employeeId, lenderId, PermissionType.INCOME_RANGE);
      logger.info('✅ Income disclosure revoked');

      // Test 2: Employment Disclosure
      logger.info('Testing employment disclosure (grant + revoke)…');
      await companyAPI.grantEmploymentDisclosure(employeeId, verifierId, 172800);
      logger.info('✅ Employment disclosure granted');
      await companyAPI.revokeDisclosure(employeeId, verifierId, PermissionType.EMPLOYMENT);
      logger.info('✅ Employment disclosure revoked');

      // Test 3: Audit Disclosure
      logger.info('Testing audit disclosure (grant + revoke)…');
      await companyAPI.grantAuditDisclosure(auditorId, 604800);
      logger.info('✅ Audit disclosure granted');
      await companyAPI.revokeDisclosure(companyId, auditorId, PermissionType.AUDIT);
      logger.info('✅ Audit disclosure revoked');

      logger.info('✅ All disclosure types tested successfully');
    }, 7 * 60_000);
  });

  describe('Employment Verification', () => {
    test('should handle multiple employment status transitions', async () => {
      const companyId = `status-transitions-${Date.now()}`;
      const employeeId = `employee-${Date.now()}`;
      const verifierId = `verifier-${Date.now()}`;

      logger.info('Deploying contract for status transition test…');
      const contractAddress = await PayrollAPI.deploy(providers, companyId, 'Status Test Corp', logger);
      const companyAPI = await PayrollAPI.connect(providers, contractAddress, companyId, logger);

      // Add employee (starts as PENDING = 0)
      await companyAPI.addEmployee(companyId, employeeId);
      const state = await firstValueFrom(companyAPI.state$);
      expect(state.totalEmployees).toBe(1n);

      // Grant employment disclosure to verifier (required before verification)
      logger.info('Granting employment disclosure to verifier…');
      await companyAPI.grantEmploymentDisclosure(employeeId, verifierId, 86400); // 1 day expiry

      // Test employment status transitions: PENDING -> ACTIVE -> ON_LEAVE -> ACTIVE -> TERMINATED
      logger.info('Transitioning: PENDING (0) -> ACTIVE (1)…');
      await companyAPI.updateEmploymentStatus(employeeId, 1n);

      // Wait for transaction to be mined
      await new Promise(resolve => setTimeout(resolve, 5000));

      let isEmployed = await companyAPI.verifyEmployment(employeeId, verifierId);
      expect(isEmployed).toBe(true);
      logger.info('✅ Status verified as ACTIVE');

      logger.info('Transitioning: ACTIVE (1) -> ON_LEAVE (2)…');
      await companyAPI.updateEmploymentStatus(employeeId, 2n);
      isEmployed = await companyAPI.verifyEmployment(employeeId, verifierId);
      expect(isEmployed).toBe(true); // ON_LEAVE still counts as employed
      logger.info('✅ Status verified as ON_LEAVE (still employed)');

      logger.info('Transitioning: ON_LEAVE (2) -> ACTIVE (1)…');
      await companyAPI.updateEmploymentStatus(employeeId, 1n);
      isEmployed = await companyAPI.verifyEmployment(employeeId, verifierId);
      expect(isEmployed).toBe(true);
      logger.info('✅ Status verified as ACTIVE');

      logger.info('Transitioning: ACTIVE (1) -> TERMINATED (3)…');
      await companyAPI.updateEmploymentStatus(employeeId, 3n);
      isEmployed = await companyAPI.verifyEmployment(employeeId, verifierId);
      expect(isEmployed).toBe(false); // TERMINATED = not employed
      logger.info('✅ Status verified as TERMINATED (not employed)');

      logger.info('✅ All employment status transitions completed and verified');
    }, 5 * 60_000);
  });

  describe('ZKML Income Proofs', () => {
    test('should register verifier, submit proof, and verify requirements', async () => {
      const companyId = `zkml-company-${Date.now()}`;
      const employeeId = `employee-${Date.now()}`;
      const verifierPubkey = `0x${Buffer.from(utils.randomBytes(32)).toString('hex')}`;

      logger.info('Deploying contract for ZKML proof test…');
      const contractAddress = await PayrollAPI.deploy(providers, companyId, 'ZKML Test Corp', logger);
      const companyAPI = await PayrollAPI.connect(providers, contractAddress, companyId, logger);
      const employeeAPI = await PayrollAPI.connect(providers, contractAddress, employeeId, logger);

      // Setup: Add employee and establish payment history
      logger.info('Setting up employee with payment history…');
      await companyAPI.addEmployee(companyId, employeeId);
      await companyAPI.depositCompanyFunds(companyId, '20000.00');
      await companyAPI.payEmployee(companyId, employeeId, '5000.00');
      await companyAPI.payEmployee(companyId, employeeId, '5000.00');
      await companyAPI.payEmployee(companyId, employeeId, '5000.00');

      const paymentHistory = await employeeAPI.getEmployeePaymentHistory(employeeId);
      expect(paymentHistory.length).toBeGreaterThanOrEqual(3);

      // Register trusted verifier
      logger.info('Registering trusted ZKML verifier…');
      const registered = await companyAPI.registerTrustedVerifier(verifierPubkey);
      expect(registered).toBe(true);
      logger.info('✅ Trusted verifier registered successfully');

      // Sync contract timestamp with real time to avoid "timestamp in future" errors
      const currentTime = Math.floor(Date.now() / 1000);
      await companyAPI.updateTimestamp(currentTime);

      // Submit income proof (INCOME_RANGE type = 2)
      logger.info('Submitting ZKML income proof…');
      const proofType = 2n; // INCOME_RANGE (must be 1-4)
      const thresholdMin = utils.parseAmount('8000.00');
      const thresholdMax = utils.parseAmount('12000.00');

      const txids = paymentHistory.slice(0, 3).map(p => Buffer.from(p.payment_id).toString('hex'));
      const merkleRoot = '0x' + Buffer.from(utils.randomBytes(32)).toString('hex');
      const attestationHash = '0x' + Buffer.from(utils.randomBytes(32)).toString('hex');
      const timestamp = BigInt(currentTime);

      const submitted = await employeeAPI.submitIncomeProof(
        employeeId,
        proofType,
        thresholdMin.toString(),
        thresholdMax.toString(),
        txids,
        merkleRoot,
        attestationHash,
        verifierPubkey,
        timestamp,
        86400
      );
      expect(submitted).toBe(true);
      logger.info('✅ ZKML income proof submitted successfully');

      // Get and verify stored proof
      logger.info('Retrieving submitted income proof…');
      const incomeProof = await employeeAPI.getIncomeProof(employeeId);
      expect(incomeProof).toBeDefined();
      expect(incomeProof.employee_id).toBeDefined();
      expect(incomeProof.proof_type).toBe(proofType);
      logger.info('✅ Income proof retrieved successfully');

      // Verify the proof meets requirements
      logger.info('Verifying income proof meets requirements…');
      const verified = await companyAPI.verifyIncomeProof(employeeId, proofType, thresholdMin.toString());
      expect(verified).toBe(true);
      logger.info('✅ Income proof verification successful');
    }, 7 * 60_000);

    test('should handle all ZKML proof types (1-4)', async () => {
      const companyId = `proof-types-${Date.now()}`;
      const employeeId = `employee-${Date.now()}`;
      const verifierPubkey = `0x${Buffer.from(utils.randomBytes(32)).toString('hex')}`;

      logger.info('Deploying contract for multiple proof types test…');
      const contractAddress = await PayrollAPI.deploy(providers, companyId, 'Proof Types Corp', logger);
      const companyAPI = await PayrollAPI.connect(providers, contractAddress, companyId, logger);
      const employeeAPI = await PayrollAPI.connect(providers, contractAddress, employeeId, logger);

      // Setup
      await companyAPI.addEmployee(companyId, employeeId);
      await companyAPI.depositCompanyFunds(companyId, '30000.00');

      // Build payment history for different proof types
      for (let i = 0; i < 6; i++) {
        await companyAPI.payEmployee(companyId, employeeId, '5000.00');
      }

      const paymentHistory = await employeeAPI.getEmployeePaymentHistory(employeeId);
      expect(paymentHistory.length).toBeGreaterThanOrEqual(6);

      await companyAPI.registerTrustedVerifier(verifierPubkey);

      // Sync contract timestamp with real time to avoid "timestamp in future" errors
      const currentTime = Math.floor(Date.now() / 1000);
      await companyAPI.updateTimestamp(currentTime);

      // Test all 4 proof types (1=ABOVE_THRESHOLD, 2=RANGE, 3=AVERAGE, 4=CREDIT_SCORE)
      const proofTypes = [
        { type: 1n, name: 'INCOME_ABOVE_THRESHOLD', thresholdMin: '4000.00', thresholdMax: '0' },
        { type: 2n, name: 'INCOME_RANGE', thresholdMin: '8000.00', thresholdMax: '12000.00' },
        { type: 3n, name: 'AVERAGE_INCOME', thresholdMin: '4500.00', thresholdMax: '0' },
        { type: 4n, name: 'CREDIT_SCORE', thresholdMin: '600', thresholdMax: '0' },
      ];

      for (const proofTypeInfo of proofTypes) {
        logger.info(`Testing proof type: ${proofTypeInfo.name}…`);

        const txids = paymentHistory.slice(0, 3).map(p => Buffer.from(p.payment_id).toString('hex'));
        const merkleRoot = '0x' + Buffer.from(utils.randomBytes(32)).toString('hex');
        const attestationHash = '0x' + Buffer.from(utils.randomBytes(32)).toString('hex');
        const timestamp = BigInt(Math.floor(Date.now() / 1000));

        // Submit proof
        const submitted = await employeeAPI.submitIncomeProof(
          employeeId,
          proofTypeInfo.type,
          proofTypeInfo.thresholdMin,
          proofTypeInfo.thresholdMax,
          txids,
          merkleRoot,
          attestationHash,
          verifierPubkey,
          timestamp,
          86400
        );
        expect(submitted).toBe(true);

        // Verify proof was stored correctly
        const storedProof = await employeeAPI.getIncomeProof(employeeId);
        expect(storedProof).toBeDefined();
        expect(storedProof.proof_type).toBe(proofTypeInfo.type);
        expect(storedProof.employee_id).toBeDefined();

        // Verify proof meets requirements
        const verified = await companyAPI.verifyIncomeProof(
          employeeId,
          proofTypeInfo.type,
          proofTypeInfo.thresholdMin
        );
        expect(verified).toBe(true);

        logger.info(`✅ ${proofTypeInfo.name} proof submitted, stored, and verified successfully`);
      }

      logger.info('✅ All proof types tested successfully');
    }, 10 * 60_000);
  });
});
