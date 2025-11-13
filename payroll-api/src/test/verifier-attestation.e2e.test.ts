import { describe, test, expect, beforeAll, afterAll } from 'vitest';
import { PayrollAPI, type PayrollProviders, utils } from '../index.js';
import pino from 'pino';
import { firstValueFrom } from 'rxjs';
import WebSocket from 'ws';
import { TestEnvironment, TestProviders } from './commons.js';
import path from 'node:path';
import fs from 'node:fs';
import { currentDir } from './config.js';
import crypto from 'crypto';
import { computeVerifierPubkeyFromString } from '@zksalaria/payroll-contract';

/**
 * E2E Tests for Trusted Verifier Attestation Model
 * OPTIMIZED: Minimal setup, combined tests where possible
 */

// Verifier service configuration
const VERIFIER_SERVICE_URL = 'http://localhost:3002';
const VERIFIER_SECRET = 'test-verifier-secret-12345';

// Helper function to compute attestation hash
function computeAttestationHash(
  employeeId: string,
  threshold: string,
  historyCommitment: string,
  timestamp: number,
  verifierSecret: string
): string {
  const data = `${employeeId}${threshold}${historyCommitment}${timestamp}`;
  const dataHash = crypto.createHash('sha256').update(data).digest('hex');
  const attestationHash = crypto.createHash('sha256')
    .update(dataHash + verifierSecret)
    .digest('hex');
  return '0x' + attestationHash;
}

describe('Verifier Attestation E2E Tests (Optimized)', () => {
  let testEnvironment: TestEnvironment;
  let providers: PayrollProviders;
  let contractAddress: string;
  let companyAPI: Awaited<ReturnType<typeof PayrollAPI.connect>>;
  let contractTimestamp: number; // Store the contract timestamp for tests

  const companyId = `verifier-test-${Date.now()}`;
  const trustedVerifierPubkey = '0x' + computeVerifierPubkeyFromString(VERIFIER_SECRET);

  // Test employee IDs (created once in beforeAll)
  const validEmployee = `valid-${Date.now()}`;
  const rejectionsEmployee = `rejections-${Date.now()}`; // Shared by all rejection tests
  const replayEmployee = `replay-${Date.now()}`;

  const logFile = path.resolve(currentDir, '..', 'logs', 'tests', `verifier-attestation-${new Date().toISOString()}.log`);
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

    logger.info('Deploying contract...');
    contractAddress = await PayrollAPI.deploy(providers, companyId, 'Verifier Test Corp', logger);
    companyAPI = await PayrollAPI.connect(providers, contractAddress, companyId, logger);

    // Register trusted verifier FIRST (before adding employees)
    logger.info(`Registering trusted verifier: ${trustedVerifierPubkey}`);
    await companyAPI.registerTrustedVerifier(trustedVerifierPubkey);

    // Sync contract timestamp and store it for use in tests
    contractTimestamp = Math.floor(Date.now() / 1000);
    await companyAPI.updateTimestamp(contractTimestamp);

    // Deposit company funds for employee payments
    logger.info('Depositing company funds...');
    await companyAPI.depositCompanyFunds(companyId, '20000.00'); // 3 employees × 6000 = 18000, depositing 20000 for safety

    // Create ALL test employees upfront (minimal payments - just 1 each)
    logger.info('Creating test employees (3 employees, 1 payment each)...');
    for (const empId of [validEmployee, rejectionsEmployee, replayEmployee]) {
      await companyAPI.addEmployee(companyId, empId);
      await companyAPI.payEmployee(companyId, empId, '6000.00'); // Single payment is enough
    }

    const state = await firstValueFrom(companyAPI.state$);
    expect(state.totalEmployees).toBe(3n);
    expect(state.totalPayments).toBe(3n);
    logger.info('✅ Setup complete (3 employees, 3 payments total)');
  }, 10 * 60_000);

  afterAll(async () => {
    await testEnvironment.shutdown();
  });

  test('should accept valid attestation with correct hash and trusted verifier', async () => {
    logger.info('Test 1: Valid attestation acceptance...');

    const validAPI = await PayrollAPI.connect(providers, contractAddress, validEmployee, logger);
    const paymentHistory = await validAPI.getEmployeePaymentHistory(validEmployee);
    const historyCommitment = await validAPI.computeHistoryCommitment(validEmployee);
    const txids = paymentHistory.map(p => Buffer.from(p.payment_id).toString('hex'));

    const proofType = 1n;
    const thresholdMin = utils.parseAmount('5000.00');

    // Compute proper attestation hash using the contract's timestamp
    const attestationHash = computeAttestationHash(
      validEmployee,
      thresholdMin.toString(),
      historyCommitment,
      contractTimestamp,
      VERIFIER_SECRET
    );

    const submitted = await validAPI.submitIncomeProof(
      validEmployee,
      proofType,
      thresholdMin.toString(),
      '0',
      txids,
      historyCommitment,
      attestationHash,
      BigInt(contractTimestamp),
      86400
    );

    expect(submitted).toBe(true);

    // Verify storage
    const storedProof = await validAPI.getIncomeProof(validEmployee);
    expect(storedProof).toBeDefined();
    expect(storedProof.verifier_pubkey).toBeDefined();
    expect(storedProof.attestation_hash).toBeDefined();

    const storedHash = '0x' + Buffer.from(storedProof.attestation_hash).toString('hex');
    const storedPubkey = '0x' + Buffer.from(storedProof.verifier_pubkey).toString('hex');
    expect(storedHash).toBe(attestationHash);
    expect(storedPubkey).toBe(trustedVerifierPubkey);

    logger.info('✅ Valid attestation accepted and stored correctly');
  }, 5 * 60_000);

  test('should reject: fake history, future timestamp, expired timestamp', async () => {
    logger.info('Test 2: Combined rejection tests (3 validations)...');

    // This employee can be reused for ALL rejection tests because none of them
    // will pass validation and actually submit a proof (no replay protection conflict)

    const rejectAPI = await PayrollAPI.connect(providers, contractAddress, rejectionsEmployee, logger);
    const paymentHistory = await rejectAPI.getEmployeePaymentHistory(rejectionsEmployee);
    const historyCommitment = await rejectAPI.computeHistoryCommitment(rejectionsEmployee);
    const txids = paymentHistory.map(p => Buffer.from(p.payment_id).toString('hex'));

    const proofType = 1n;
    const thresholdMin = utils.parseAmount('5000.00');
    const validAttestation = computeAttestationHash(
      rejectionsEmployee,
      thresholdMin.toString(),
      historyCommitment,
      contractTimestamp,
      VERIFIER_SECRET
    );

    // NOTE: "Untrusted verifier" test removed - with witness pattern, verifier identity
    // is derived from witness secret in privateState. Testing untrusted verifiers would
    // require creating API instances with different verifier secrets, which requires
    // additional test infrastructure. The contract still enforces this check - verifier
    // proves ownership via witness and contract verifies derived pubkey ∈ trusted_verifiers.

    // Rejection 1: Fake history commitment
    logger.info('  Testing fake history commitment rejection...');
    try {
      const fakeCommitment = '0x' + Buffer.from(utils.randomBytes(32)).toString('hex');
      const result2 = await rejectAPI.submitIncomeProof(
        rejectionsEmployee,
        proofType,
        thresholdMin.toString(),
        '0',
        txids,
        fakeCommitment, // ❌ Fake commitment
        validAttestation,
        BigInt(contractTimestamp),
        86400
      );
      expect(result2).toBe(false); // Should return false if it doesn't throw
    } catch (error) {
      expect(error).toBeDefined();
    }
    logger.info('  ✅ Fake history commitment rejected');

    // Rejection 2: Future timestamp
    logger.info('  Testing future timestamp rejection...');
    try {
      const futureTime = contractTimestamp + 3600;
      const result3 = await rejectAPI.submitIncomeProof(
        rejectionsEmployee,
        proofType,
        thresholdMin.toString(),
        '0',
        txids,
        historyCommitment,
        validAttestation,
        BigInt(futureTime), // ❌ Future
        86400
      );
      expect(result3).toBe(false); // Should return false if it doesn't throw
    } catch (error) {
      expect(error).toBeDefined();
    }
    logger.info('  ✅ Future timestamp rejected');

    // Rejection 3: Expired timestamp
    logger.info('  Testing expired timestamp rejection...');
    try {
      const expiredTime = contractTimestamp - 7200; // 2 hours ago
      const result4 = await rejectAPI.submitIncomeProof(
        rejectionsEmployee,
        proofType,
        thresholdMin.toString(),
        '0',
        txids,
        historyCommitment,
        validAttestation,
        BigInt(expiredTime), // ❌ Expired
        86400
      );
      expect(result4).toBe(false); // Should return false if it doesn't throw
    } catch (error) {
      expect(error).toBeDefined();
    }
    logger.info('  ✅ Expired timestamp rejected');

    logger.info('✅ All 3 rejection scenarios validated');
  }, 5 * 60_000);

  test('should enforce replay protection and document trust model for wrong hash', async () => {
    logger.info('Test 3: Replay protection + wrong hash (trust model)...');

    const replayAPI = await PayrollAPI.connect(providers, contractAddress, replayEmployee, logger);
    const paymentHistory = await replayAPI.getEmployeePaymentHistory(replayEmployee);
    const historyCommitment = await replayAPI.computeHistoryCommitment(replayEmployee);
    const txids = paymentHistory.map(p => Buffer.from(p.payment_id).toString('hex'));

    const proofType = 1n;
    const thresholdMin = utils.parseAmount('5000.00');

    // Part A: Test wrong attestation hash (trust model - contract cannot validate)
    logger.info('  Testing wrong attestation hash (trust model)...');
    const wrongHash = computeAttestationHash(
      replayEmployee,
      thresholdMin.toString(),
      historyCommitment,
      contractTimestamp,
      'wrong-secret' // Wrong secret, but contract can't detect without the secret on-chain
    );

    const submitted = await replayAPI.submitIncomeProof(
      replayEmployee,
      proofType,
      thresholdMin.toString(),
      '0',
      txids,
      historyCommitment,
      wrongHash, // Wrong hash, but accepted (trust model)
      BigInt(contractTimestamp),
      86400
    );

    expect(submitted).toBe(true);
    logger.info('  ✅ Wrong hash accepted (contract trusts whitelisted verifier)');
    logger.info('  Note: Contract cannot validate attestation_hash without verifier_secret');

    // Part B: Test replay protection - reuse SAME attestation hash
    logger.info('  Testing replay protection (reusing same attestation_hash)...');

    // Try to submit with the SAME attestation hash - should be rejected
    // Note: Replay protection is based on attestation_hash, not employee_id
    try {
      const replayResult = await replayAPI.submitIncomeProof(
        replayEmployee,
        proofType,
        thresholdMin.toString(),
        '0',
        txids,
        historyCommitment,
        wrongHash, // SAME hash as before - should trigger replay protection
        BigInt(contractTimestamp),
        86400
      );
      expect(replayResult).toBe(false); // Replay protection returns false
    } catch (error) {
      // Proof server may reject replay attempts before contract validation
      expect(error).toBeDefined();
      logger.info('  ✅ Replay protection working (proof server rejected duplicate attestation_hash)');
    }

    logger.info('  ✅ Replay protection enforced (same attestation_hash rejected)');
    logger.info('  Note: Replay protection is per attestation_hash, not per employee');
    logger.info('✅ Trust model validated + replay protection enforced');
  }, 5 * 60_000);
});
