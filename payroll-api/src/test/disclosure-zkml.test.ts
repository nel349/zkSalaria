import { describe, test, expect, beforeAll, afterAll } from 'vitest';
import { PayrollAPI, type PayrollProviders, utils, PermissionType } from '../index.js';
import { EmploymentStatus, PaymentType } from '@zksalaria/payroll-contract';
import pino from 'pino';
import { firstValueFrom } from 'rxjs';
import WebSocket from 'ws';
import { TestEnvironment, TestProviders } from './commons.js';
import path from 'node:path';
import fs from 'node:fs';
import { currentDir } from './config.js';
import { computeVerifierPubkeyFromString } from '@zksalaria/payroll-contract';
import type { GenerateProofResponse } from './zkml-types.js';

/**
 * E2E tests for Disclosure Management & ZKML Income Proofs
 * Tests full integration with Midnight testnet
 * Consolidated to minimize testnet load while maintaining full coverage
 *
 * ZKML VERIFIER AUTHENTICATION MODEL (Midnight Witness Pattern):
 *
 * Phase 1 - Registration (Company):
 *   - Company computes verifier PUBLIC KEY from secret: pubkey = persistentHash([domain, secret])
 *   - Company calls registerTrustedVerifier(pubkey) to whitelist the verifier
 *   - No secret is shared or stored on-chain
 *
 * Phase 2 - Proof Submission (Verifier/Employee):
 *   - Verifier has secret in their privateState (witness)
 *   - When calling submitIncomeProof(), the contract:
 *     a) Derives pubkey from witness: derived_pubkey = verifier_public_key(verifier_secret_key())
 *     b) Checks derived_pubkey ∈ trusted_verifiers set
 *     c) Only accepts proof if verifier can prove ownership via witness
 *
 * This is a ZERO-KNOWLEDGE proof of verifier identity - the verifier proves they
 * know the secret without revealing it, and the contract verifies against the
 * registered public key.
 */

// Verifier configuration (must match what API uses)
const VERIFIER_SECRET = 'test-verifier-secret-12345'; // Default from createPayrollPrivateState

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
      await companyAPI.payEmployee(companyId, employeeId, '5000.00'); // Uses default SALARY

      let state = await firstValueFrom(companyAPI.state$);
      expect(state.totalEmployees).toBe(1n);
      expect(state.totalPayments).toBe(1n);

      // Verify payment type defaults to SALARY
      const employeeAPI = await PayrollAPI.connect(providers, contractAddress, employeeId, logger);
      const paymentHistory = await employeeAPI.getEmployeePaymentHistory(employeeId);
      expect(paymentHistory.length).toBeGreaterThanOrEqual(1);
      expect(paymentHistory[0].payment_type).toBe(PaymentType.SALARY);
      logger.info('✅ Payment type verified as SALARY (default)');

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

      // Add employee (starts as ACTIVE = 1)
      await companyAPI.addEmployee(companyId, employeeId);
      const state = await firstValueFrom(companyAPI.state$);
      expect(state.totalEmployees).toBe(1n);

      // Grant employment disclosure to verifier (required before verification)
      logger.info('Granting employment disclosure to verifier…');
      await companyAPI.grantEmploymentDisclosure(employeeId, verifierId, 86400); // 1 day expiry

      // Test employment status transitions: Employee starts as ACTIVE when added
      // Then: ACTIVE -> ON_LEAVE -> ACTIVE -> TERMINATED
      logger.info(`Employee starts as ACTIVE (${EmploymentStatus.ACTIVE}) - verifying initial status…`);

      // Wait for transaction to be mined
      await new Promise(resolve => setTimeout(resolve, 5000));

      let isEmployed = await companyAPI.verifyEmployment(employeeId, verifierId);
      expect(isEmployed).toBe(true);
      logger.info('✅ Initial status verified as ACTIVE');

      logger.info(`Transitioning: ACTIVE (${EmploymentStatus.ACTIVE}) -> ON_LEAVE (${EmploymentStatus.ON_LEAVE})…`);
      await companyAPI.updateEmploymentStatus(employeeId, EmploymentStatus.ON_LEAVE);
      isEmployed = await companyAPI.verifyEmployment(employeeId, verifierId);
      expect(isEmployed).toBe(true); // ON_LEAVE still counts as employed
      logger.info('✅ Status verified as ON_LEAVE (still employed)');

      logger.info(`Transitioning: ON_LEAVE (${EmploymentStatus.ON_LEAVE}) -> ACTIVE (${EmploymentStatus.ACTIVE})…`);
      await companyAPI.updateEmploymentStatus(employeeId, EmploymentStatus.ACTIVE);
      isEmployed = await companyAPI.verifyEmployment(employeeId, verifierId);
      expect(isEmployed).toBe(true);
      logger.info('✅ Status verified as ACTIVE');

      logger.info(`Transitioning: ACTIVE (${EmploymentStatus.ACTIVE}) -> TERMINATED (${EmploymentStatus.TERMINATED})…`);
      await companyAPI.updateEmploymentStatus(employeeId, EmploymentStatus.TERMINATED);
      isEmployed = await companyAPI.verifyEmployment(employeeId, verifierId);
      expect(isEmployed).toBe(false); // TERMINATED = not employed
      logger.info('✅ Status verified as TERMINATED (not employed)');

      logger.info('✅ All employment status transitions completed and verified');
    }, 5 * 60_000);
  });

  describe('ZKML Income Proofs', () => {
    test('should register verifier, generate proof via verifier service, and verify requirements', async () => {
      const companyId = `zkml-company-${Date.now()}`;
      const employeeId = `employee-${Date.now()}`;

      // Compute verifier pubkey from test secret (matches what witness will derive)
      const verifierPubkey = '0x' + computeVerifierPubkeyFromString(VERIFIER_SECRET);

      logger.info('Deploying contract for ZKML proof test…');
      const contractAddress = await PayrollAPI.deploy(providers, companyId, 'ZKML Test Corp', logger);
      const companyAPI = await PayrollAPI.connect(providers, contractAddress, companyId, logger);
      const employeeAPI = await PayrollAPI.connect(providers, contractAddress, employeeId, logger);

      // Setup: Add employee and establish payment history (6 months for ZKML)
      logger.info('Setting up employee with 6 months of payment history…');
      await companyAPI.addEmployee(companyId, employeeId);
      await companyAPI.depositCompanyFunds(companyId, '60000.00');
      await companyAPI.payEmployee(companyId, employeeId, '10000.00'); // Month 1
      await companyAPI.payEmployee(companyId, employeeId, '10000.00'); // Month 2
      await companyAPI.payEmployee(companyId, employeeId, '10000.00'); // Month 3
      await companyAPI.payEmployee(companyId, employeeId, '10000.00'); // Month 4
      await companyAPI.payEmployee(companyId, employeeId, '10000.00'); // Month 5
      await companyAPI.payEmployee(companyId, employeeId, '10000.00'); // Month 6

      const paymentHistory = await employeeAPI.getEmployeePaymentHistoryDecrypted(employeeId);
      expect(paymentHistory.length).toBe(6);

      // Register trusted verifier (company registers verifier's PUBLIC key)
      logger.info(`Registering trusted ZKML verifier: ${verifierPubkey}…`);
      const registered = await companyAPI.registerTrustedVerifier(verifierPubkey);
      expect(registered).toBe(true);
      logger.info('✅ Trusted verifier registered (public key only, no secret)');

      // Sync contract timestamp with real time to avoid "timestamp in future" errors
      const currentTime = Math.floor(Date.now() / 1000);
      await companyAPI.updateTimestamp(currentTime);

      // Call the zkml-verifier service to generate proof and submit to blockchain
      logger.info('Calling zkml-verifier service to generate and submit proof…');
      const proofType = 2; // INCOME_RANGE (must be 1-4)
      const thresholdMin = 80000; // $80k yearly (6 months @ $10k = $60k → annualized = $120k/year, within $80k-$120k)
      const thresholdMax = 120000; // $120k yearly (INCOME_RANGE checks if annualized 6-month total is within this range)

      // Normalize payments for ZKML (convert cents→dollars, then normalize by 10000)
      const payments = paymentHistory.slice(0, 6).map(p => Number(p.decrypted_amount) / 100 / 10000);
      const txids = paymentHistory.slice(0, 6).map(p => Buffer.from(p.payment_id).toString('hex'));
      const historyCommitment = await employeeAPI.computeHistoryCommitment(employeeId);

      // Call verifier service's /api/zkml/generate-proof endpoint
      // This will: 1) Generate ZKML proof, 2) Create attestation, 3) Submit to blockchain
      const verifierResponse = await fetch('http://localhost:3002/api/zkml/generate-proof', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          proof_type: proofType,
          payments: payments,
          threshold_min: thresholdMin / 10000, // Normalized
          threshold_max: thresholdMax / 10000, // Normalized
          employee_id: employeeId,
          txids: txids,
          history_commitment: historyCommitment,
          contract_address: contractAddress // Pass contract address to verifier
        })
      });

      if (!verifierResponse.ok) {
        const errorBody = await verifierResponse.json();
        logger.error('Verifier request failed:', undefined, {
          status: verifierResponse.status,
          error: errorBody
        });
      }
      expect(verifierResponse.ok).toBe(true);
      const verifierResult = await verifierResponse.json() as GenerateProofResponse;
      expect(verifierResult.success).toBe(true);
      expect(verifierResult.attestation).toBeDefined();
      logger.info('✅ Verifier service generated proof, created attestation, and submitted to blockchain');

      // Get and verify stored proof
      logger.info('Retrieving submitted income proof…');
      const incomeProof = await employeeAPI.getIncomeProof(employeeId);
      expect(incomeProof).toBeDefined();
      expect(incomeProof.employee_id).toBeDefined();
      expect(incomeProof.proof_type).toBe(BigInt(proofType));
      logger.info('✅ Income proof retrieved successfully');

      // Verify the proof meets requirements
      logger.info('Verifying income proof meets requirements…');
      const verified = await companyAPI.verifyIncomeProof(employeeId, BigInt(proofType), thresholdMin.toString());
      expect(verified).toBe(true);
      logger.info('✅ Income proof verification successful');
    }, 15 * 60_000); // 15 minutes: blockchain setup + 6 payments + ZKML proof + verification

    test('should handle all ZKML proof types (1-4) via verifier service', async () => {
      const companyId = `proof-types-${Date.now()}`;
      const employeeId = `employee-${Date.now()}`;

      // Compute verifier pubkey from test secret (matches what witness will derive)
      const verifierPubkey = '0x' + computeVerifierPubkeyFromString(VERIFIER_SECRET);

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

      const paymentHistory = await employeeAPI.getEmployeePaymentHistoryDecrypted(employeeId);
      expect(paymentHistory.length).toBeGreaterThanOrEqual(6);

      // Register trusted verifier (company provides public key only)
      logger.info(`Registering trusted verifier: ${verifierPubkey}…`);
      await companyAPI.registerTrustedVerifier(verifierPubkey);
      logger.info('✅ Trusted verifier registered');

      // Sync contract timestamp with real time to avoid "timestamp in future" errors
      const currentTime = Math.floor(Date.now() / 1000);
      await companyAPI.updateTimestamp(currentTime);

      // Prepare data for verifier service
      const payments = paymentHistory.slice(0, 6).map(p => Number(p.decrypted_amount) / 100 / 10000); // Normalized (cents→dollars→normalized)
      const txids = paymentHistory.slice(0, 6).map(p => Buffer.from(p.payment_id).toString('hex'));
      const historyCommitment = await employeeAPI.computeHistoryCommitment(employeeId);

      // Test all 4 proof types (1=ABOVE_THRESHOLD, 2=RANGE, 3=AVERAGE, 4=CREDIT_SCORE)
      const proofTypes = [
        { type: 1, name: 'INCOME_ABOVE_THRESHOLD', thresholdMin: 4000, thresholdMax: 0 },
        { type: 2, name: 'INCOME_RANGE', thresholdMin: 80000, thresholdMax: 120000 }, // Yearly range $80k-$120k
        { type: 3, name: 'AVERAGE_INCOME', thresholdMin: 4500, thresholdMax: 0 },
        { type: 4, name: 'CREDIT_SCORE', thresholdMin: 600, thresholdMax: 0 },
      ];

      for (const proofTypeInfo of proofTypes) {
        logger.info(`Testing proof type: ${proofTypeInfo.name}…`);

        // Call verifier service to generate proof and submit to blockchain
        const verifierResponse = await fetch('http://localhost:3002/api/zkml/generate-proof', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            proof_type: proofTypeInfo.type,
            payments: payments,
            threshold_min: proofTypeInfo.thresholdMin / 10000, // Normalized
            threshold_max: proofTypeInfo.thresholdMax / 10000, // Normalized
            employee_id: employeeId,
            txids: txids,
            history_commitment: historyCommitment,
            contract_address: contractAddress // Pass contract address to verifier
          })
        });

        expect(verifierResponse.ok).toBe(true);
        const verifierResult = await verifierResponse.json() as GenerateProofResponse;
        expect(verifierResult.success).toBe(true);
        expect(verifierResult.attestation).toBeDefined();

        // Verify proof was stored correctly
        const storedProof = await employeeAPI.getIncomeProof(employeeId);
        expect(storedProof).toBeDefined();
        expect(storedProof.proof_type).toBe(BigInt(proofTypeInfo.type));
        expect(storedProof.employee_id).toBeDefined();

        // Verify proof meets requirements
        const verified = await companyAPI.verifyIncomeProof(
          employeeId,
          BigInt(proofTypeInfo.type),
          proofTypeInfo.thresholdMin.toString()
        );
        expect(verified).toBe(true);

        logger.info(`✅ ${proofTypeInfo.name} proof generated via verifier, submitted to blockchain, and verified successfully`);
      }

      logger.info('✅ All proof types tested successfully via verifier service');
    }, 10 * 100_000);
  });
});
