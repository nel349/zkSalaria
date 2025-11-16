import { describe, test, expect, beforeAll, afterAll } from 'vitest';
import { PayrollAPI, type PayrollProviders, type DeployedPayrollAPI } from '../index.js';
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
 * E2E tests for Tax Bracket (Type 5) ZKML Proofs
 * Tests full integration with Midnight testnet
 *
 * Pattern: Deploy contract, make 6 payments in beforeAll, then test Tax Bracket proofs
 */

// Verifier configuration (must match what API uses)
const VERIFIER_SECRET = 'test-verifier-secret-12345'; // Default from createPayrollPrivateState
const VERIFIER_SERVICE_URL = 'http://localhost:3002';

describe('Tax Bracket ZKML API - E2E Tests', () => {
  let testEnvironment: TestEnvironment;
  let providers: PayrollProviders;
  let contractAddress: string;
  let companyAPI: DeployedPayrollAPI;
  let employeeAPI: DeployedPayrollAPI;
  const companyId = `tax-bracket-company-${Date.now()}`;
  const employeeId = `employee-${Date.now()}`;

  const logFile = path.resolve(currentDir, '..', 'logs', 'tests', `tax-bracket-zkml-${new Date().toISOString()}.log`);
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

    // Deploy contract
    logger.info('Deploying contract for Tax Bracket ZKML test…');
    contractAddress = await PayrollAPI.deploy(providers, companyId, 'Tax Bracket Test Corp', logger);
    companyAPI = await PayrollAPI.connect(providers, contractAddress, companyId, logger);
    employeeAPI = await PayrollAPI.connect(providers, contractAddress, employeeId, logger);

    // Setup: Add employee and establish 6 months of payment history
    // Using $2,900/month × 6 months = $17,400 → annualized = $34,800/year (falls in 12% bracket: $11,601-$47,150)
    logger.info('Setting up employee with 6 months of payment history…');
    await companyAPI.addEmployee(companyId, employeeId);
    await companyAPI.depositCompanyFunds(companyId, '20000.00');
    await companyAPI.payEmployee(companyId, employeeId, '2900.00'); // Month 1
    await companyAPI.payEmployee(companyId, employeeId, '2900.00'); // Month 2
    await companyAPI.payEmployee(companyId, employeeId, '2900.00'); // Month 3
    await companyAPI.payEmployee(companyId, employeeId, '2900.00'); // Month 4
    await companyAPI.payEmployee(companyId, employeeId, '2900.00'); // Month 5
    await companyAPI.payEmployee(companyId, employeeId, '2900.00'); // Month 6

    const paymentHistory = await employeeAPI.getEmployeePaymentHistoryDecrypted(employeeId);
    expect(paymentHistory.length).toBe(6);
    logger.info(`✅ Payment history established: 6 payments of $2,900 = $17,400 total (annualized: $34,800)`);

    // Register trusted verifier
    const verifierPubkey = '0x' + computeVerifierPubkeyFromString(VERIFIER_SECRET);
    logger.info(`Registering trusted ZKML verifier: ${verifierPubkey}…`);
    const registered = await companyAPI.registerTrustedVerifier(verifierPubkey);
    expect(registered).toBe(true);
    logger.info('✅ Trusted verifier registered');

    // Sync contract timestamp with real time
    const currentTime = Math.floor(Date.now() / 1000);
    await companyAPI.updateTimestamp(currentTime);
  }, 10 * 60_000);

  afterAll(async () => {
    await testEnvironment.shutdown();
  });

  test('should generate valid Tax Bracket proof for 12% bracket ($34,800/year)', async () => {
    logger.info('\n🏛️  Testing Tax Bracket Proof - 12% Bracket ($11,601 - $47,150)');

    // Get payment history
    const paymentHistory = await employeeAPI.getEmployeePaymentHistoryDecrypted(employeeId);
    expect(paymentHistory.length).toBe(6);

    const sixMonthTotal = paymentHistory.reduce((sum, p) => sum + Number(p.decrypted_amount) / 100, 0);
    const annualizedIncome = sixMonthTotal * 2;
    logger.info(`  6-month total: $${sixMonthTotal.toLocaleString()}`);
    logger.info(`  Annualized: $${annualizedIncome.toLocaleString()}`);

    // Prepare data for verifier service
    const payments = paymentHistory.slice(0, 6).map(p => Number(p.decrypted_amount) / 100 / 10000); // Normalize
    const txids = paymentHistory.slice(0, 6).map(p => Buffer.from(p.payment_id).toString('hex'));
    const historyCommitment = await employeeAPI.computeHistoryCommitment(employeeId);

    // Tax Bracket: 12% bracket ($11,601 - $47,150 annual)
    const proofType = 5; // TAX_BRACKET
    const thresholdMin = 11601; // 12% bracket min (ANNUAL)
    const thresholdMax = 47150; // 12% bracket max (ANNUAL)

    logger.info(`  Testing bracket: 12% ($${thresholdMin.toLocaleString()} - $${thresholdMax.toLocaleString()})`);

    // Call verifier service to generate and submit proof
    const verifierResponse = await fetch(`${VERIFIER_SERVICE_URL}/api/zkml/generate-proof`, {
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
        contract_address: contractAddress
      })
    });

    if (!verifierResponse.ok) {
      const errorBody = await verifierResponse.json();
      logger.error('Verifier request failed:', undefined, {
        status: verifierResponse.status,
        error: errorBody
      });
      // Log to stdout as well for test visibility
      console.error('\n❌ Verifier request failed:');
      console.error('  Status:', verifierResponse.status);
      console.error('  Error:', JSON.stringify(errorBody, null, 2));
    }
    expect(verifierResponse.ok).toBe(true);
    const verifierResult = await verifierResponse.json() as GenerateProofResponse;
    expect(verifierResult.success).toBe(true);
    expect(verifierResult.attestation).toBeDefined();
    logger.info('✅ Verifier service generated proof and submitted to blockchain');

    // Get and verify stored proof
    logger.info('Retrieving submitted income proof…');
    const incomeProof = await employeeAPI.getIncomeProof(employeeId);
    expect(incomeProof).toBeDefined();
    expect(incomeProof.proof_type).toBe(BigInt(proofType));
    expect(incomeProof.threshold_min).toBe(BigInt(thresholdMin));
    expect(incomeProof.threshold_max).toBe(BigInt(thresholdMax));
    logger.info('✅ Tax bracket proof retrieved successfully');

    // Verify the proof meets requirements
    logger.info('Verifying tax bracket proof…');
    const verified = await companyAPI.verifyIncomeProof(employeeId, BigInt(proofType), thresholdMin.toString());
    expect(verified).toBe(true);
    logger.info('✅ Tax bracket proof verification successful');
  }, 5 * 60_000);

  test('should reject Tax Bracket proof for wrong bracket (22%)', async () => {
    logger.info('\n🏛️  Testing Tax Bracket Proof Rejection - 22% Bracket (should fail)');

    // Get payment history (same as previous test: $34,800/year)
    const paymentHistory = await employeeAPI.getEmployeePaymentHistoryDecrypted(employeeId);
    const payments = paymentHistory.slice(0, 6).map(p => Number(p.decrypted_amount) / 100 / 10000);
    const txids = paymentHistory.slice(0, 6).map(p => Buffer.from(p.payment_id).toString('hex'));
    const historyCommitment = await employeeAPI.computeHistoryCommitment(employeeId);

    // Try to prove income is in 22% bracket ($47,151 - $100,525)
    // This should FAIL because annualized income is $34,800, which is below $47,151
    const proofType = 5;
    const thresholdMin = 47151; // 22% bracket min
    const thresholdMax = 100525; // 22% bracket max

    logger.info(`  Attempting to prove 22% bracket ($${thresholdMin.toLocaleString()} - $${thresholdMax.toLocaleString()})`);
    logger.info(`  Expected: FAIL (income $34,800 < bracket min $47,151)`);

    // Call verifier service - should return success: false
    const verifierResponse = await fetch(`${VERIFIER_SERVICE_URL}/api/zkml/generate-proof`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        proof_type: proofType,
        payments: payments,
        threshold_min: thresholdMin / 10000,
        threshold_max: thresholdMax / 10000,
        employee_id: `${employeeId}-invalid`, // Different employee_id to avoid overwriting valid proof
        txids: txids,
        history_commitment: historyCommitment,
        contract_address: contractAddress
      })
    });

    expect(verifierResponse.ok).toBe(true); // HTTP 200 even for threshold failures
    const verifierResult = await verifierResponse.json() as GenerateProofResponse;
    expect(verifierResult.success).toBe(false); // Proof generation should fail
    expect(verifierResult.error || verifierResult.message).toBeTruthy();
    logger.info(`✅ Proof correctly rejected: ${verifierResult.error || verifierResult.message}`);
  }, 5 * 60_000);
});

console.log('\n✅ Tax Bracket ZKML E2E Tests Complete\n');
