/**
 * Comprehensive ZKML Integration Tests
 *
 * This test suite verifies the complete ZKML income proof system:
 * 1. Contract circuits (submit_income_proof, verify_income_proof)
 * 2. Real proof generation with EZKL
 * 3. All 4 proof types (INCOME_ABOVE_THRESHOLD, INCOME_RANGE, AVERAGE_INCOME, CREDIT_SCORE)
 * 4. End-to-end flow with @zksalaria/zkml-payroll module
 */

import { describe, test, expect, beforeEach } from 'vitest';
import { PayrollMultiPartyTestSetup } from './payroll-setup-multi.js';
import {
  ProofType,
  generateIncomeProof,
  verifyIncomeProof,
  ModelManager,
  calculateCreditScore,
  calculateAverageIncome
} from '../../../zkml/payroll/src/index';

describe('zkSalaria Comprehensive ZKML Integration', () => {
  let payroll: PayrollMultiPartyTestSetup;
  const companyId = 'COMP001';
  const companyName = 'Acme Corp';
  const VERIFIER_PUBKEY = 'a0cb1aac7c3e2b15fb8c59bcf3d6e0c9c0e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1';

  beforeEach(() => {
    payroll = new PayrollMultiPartyTestSetup(companyId, companyName);
    console.log('\n🔄 ZKML payroll contract initialized\n');
  });

  // ========================================
  // PART 1: Contract Circuit Unit Tests
  // ========================================
  describe('Contract Circuit Tests', () => {
    describe('Register Trusted Verifier', () => {
      test('should register a trusted verifier', () => {
        console.log('\n📋 Test: Register Trusted Verifier\n');

        payroll.registerTrustedVerifier(VERIFIER_PUBKEY);
        expect(payroll.isTrustedVerifier(VERIFIER_PUBKEY)).toBe(true);

        console.log('✅ Verifier successfully registered and trusted');
      });

      test('should fail to register same verifier twice', () => {
        console.log('\n📋 Test: Duplicate Verifier Registration\n');

        payroll.registerTrustedVerifier(VERIFIER_PUBKEY);
        expect(payroll.isTrustedVerifier(VERIFIER_PUBKEY)).toBe(true);

        // Try to register again - should not throw, but verifier map size should stay the same
        const ledgerBefore = payroll.getLedgerState();
        const sizeBefore = ledgerBefore.trusted_verifiers.size();

        payroll.registerTrustedVerifier(VERIFIER_PUBKEY); // Attempt duplicate registration

        const ledgerAfter = payroll.getLedgerState();
        const sizeAfter = ledgerAfter.trusted_verifiers.size();

        // Size should be the same (duplicate was rejected)
        expect(sizeAfter).toBe(sizeBefore);

        console.log('✅ Correctly rejected duplicate verifier registration');
      });
    });

    describe('Submit Income Proof', () => {
      const EMPLOYEE_ID = 'EMP001';
      const THRESHOLD_MIN = 5000n;
      const THRESHOLD_MAX = 10000n;
      const TXIDS = Array(12).fill(0).map((_, i) => `0xTX00${i + 1}`.padEnd(64, '0'));
      const ATTESTATION_HASH = 'ec8a4ef5e5b0e8c6c7f8e9f0e1e2e3e4e5e6e7e8e9e0e1e2e3e4e5e6e7e8e9e0';
      let HISTORY_COMMITMENT: string;

      beforeEach(() => {
        payroll.registerTrustedVerifier(VERIFIER_PUBKEY);

        // Setup: Add employee and create payment history (required for history_commitment verification)
        payroll.addEmployee(EMPLOYEE_ID);
        payroll.depositCompanyFunds(200000n);

        // Create payment history (12 payments to fill the rolling window)
        for (let i = 0; i < 12; i++) {
          payroll.payEmployee(EMPLOYEE_ID, 5000n + BigInt(i * 100), 0); // SALARY payments
        }

        // Compute history commitment from actual payment history
        HISTORY_COMMITMENT = payroll.computeHistoryCommitment(EMPLOYEE_ID);
      });

      test('should submit INCOME_ABOVE_THRESHOLD proof (type 1)', () => {
        console.log('\n📋 Test: Submit INCOME_ABOVE_THRESHOLD Proof\n');

        const timestamp = BigInt(payroll.getCurrentTimestamp());
        const expiresIn = 2592000; // 30 days

        payroll.submitIncomeProof(
          EMPLOYEE_ID,
          1, // INCOME_ABOVE_THRESHOLD
          THRESHOLD_MIN,
          0n, // threshold_max not used for type 1
          TXIDS,
          HISTORY_COMMITMENT,
          ATTESTATION_HASH,
          VERIFIER_PUBKEY,
          timestamp,
          expiresIn
        );

        const proof = payroll.getIncomeProof(EMPLOYEE_ID);
        expect(proof).not.toBeNull();
        expect(proof.proof_type).toBe(1n);
        expect(proof.threshold_min).toBe(THRESHOLD_MIN);

        console.log('✅ INCOME_ABOVE_THRESHOLD proof submitted successfully');
      });

      test('should submit INCOME_RANGE proof (type 2)', () => {
        console.log('\n📋 Test: Submit INCOME_RANGE Proof\n');

        const timestamp = BigInt(payroll.getCurrentTimestamp());
        const expiresIn = 2592000;

        payroll.submitIncomeProof(
          EMPLOYEE_ID,
          2, // INCOME_RANGE
          THRESHOLD_MIN,
          THRESHOLD_MAX,
          TXIDS,
          HISTORY_COMMITMENT,
          ATTESTATION_HASH,
          VERIFIER_PUBKEY,
          timestamp,
          expiresIn
        );

        const proof = payroll.getIncomeProof(EMPLOYEE_ID);
        expect(proof).not.toBeNull();
        expect(proof.proof_type).toBe(2n);
        expect(proof.threshold_min).toBe(THRESHOLD_MIN);
        expect(proof.threshold_max).toBe(THRESHOLD_MAX);

        console.log('✅ INCOME_RANGE proof submitted successfully');
      });

      test('should submit AVERAGE_INCOME proof (type 3)', () => {
        console.log('\n📋 Test: Submit AVERAGE_INCOME Proof\n');

        const timestamp = BigInt(payroll.getCurrentTimestamp());
        const expiresIn = 2592000;

        payroll.submitIncomeProof(
          EMPLOYEE_ID,
          3, // AVERAGE_INCOME
          THRESHOLD_MIN,
          0n,
          TXIDS,
          HISTORY_COMMITMENT,
          ATTESTATION_HASH + '1', // Different hash
          VERIFIER_PUBKEY,
          timestamp,
          expiresIn
        );

        const proof = payroll.getIncomeProof(EMPLOYEE_ID);
        expect(proof).not.toBeNull();
        expect(proof.proof_type).toBe(3n);

        console.log('✅ AVERAGE_INCOME proof submitted successfully');
      });

      test('should submit CREDIT_SCORE proof (type 4)', () => {
        console.log('\n📋 Test: Submit CREDIT_SCORE Proof\n');

        const timestamp = BigInt(payroll.getCurrentTimestamp());
        const expiresIn = 2592000;
        const creditScoreThreshold = 650n;

        payroll.submitIncomeProof(
          EMPLOYEE_ID,
          4, // CREDIT_SCORE
          creditScoreThreshold,
          0n,
          TXIDS,
          HISTORY_COMMITMENT,
          ATTESTATION_HASH + '2', // Different hash
          VERIFIER_PUBKEY,
          timestamp,
          expiresIn
        );

        const proof = payroll.getIncomeProof(EMPLOYEE_ID);
        expect(proof).not.toBeNull();
        expect(proof.proof_type).toBe(4n);
        expect(proof.threshold_min).toBe(creditScoreThreshold);

        console.log('✅ CREDIT_SCORE proof submitted successfully');
      });

      test('should fail with invalid proof type', () => {
        console.log('\n📋 Test: Invalid Proof Type\n');

        const timestamp = BigInt(payroll.getCurrentTimestamp());

        payroll.submitIncomeProof(
          EMPLOYEE_ID,
          5, // Invalid type
          THRESHOLD_MIN,
          0n,
          TXIDS,
          HISTORY_COMMITMENT,
          ATTESTATION_HASH,
          VERIFIER_PUBKEY,
          timestamp,
          2592000
        );

        // Proof should not be added (invalid proof type)
        const proof = payroll.getIncomeProof(EMPLOYEE_ID);
        expect(proof).toBeNull();

        console.log('✅ Correctly rejected invalid proof type');
      });

      test('should fail with untrusted verifier', () => {
        console.log('\n📋 Test: Untrusted Verifier\n');

        const untrustedVerifier = 'bad1bad1bad1bad1bad1bad1bad1bad1bad1bad1bad1bad1bad1bad1bad1bad1';
        const timestamp = BigInt(payroll.getCurrentTimestamp());

        payroll.submitIncomeProof(
          EMPLOYEE_ID,
          1,
          THRESHOLD_MIN,
          0n,
          TXIDS,
          HISTORY_COMMITMENT,
          ATTESTATION_HASH,
          untrustedVerifier,
          timestamp,
          2592000
        );

        // Proof should not be added (untrusted verifier)
        const proof = payroll.getIncomeProof(EMPLOYEE_ID);
        expect(proof).toBeNull();

        console.log('✅ Correctly rejected untrusted verifier');
      });

      test('should prevent replay attacks', () => {
        console.log('\n📋 Test: Replay Attack Prevention\n');

        const timestamp = BigInt(payroll.getCurrentTimestamp());

        payroll.submitIncomeProof(
          EMPLOYEE_ID,
          1,
          THRESHOLD_MIN,
          0n,
          TXIDS,
          HISTORY_COMMITMENT,
          ATTESTATION_HASH,
          VERIFIER_PUBKEY,
          timestamp,
          2592000
        );

        // Attestation should be marked as used
        expect(payroll.isAttestationUsed(ATTESTATION_HASH)).toBe(true);

        payroll.submitIncomeProof(
          'EMP002', // Different employee
          1,
          THRESHOLD_MIN,
          0n,
          TXIDS,
          HISTORY_COMMITMENT,
          ATTESTATION_HASH, // Same attestation hash
          VERIFIER_PUBKEY,
          timestamp,
          2592000
        );

        // Second proof should not be added (replay attack prevented)
        const proof = payroll.getIncomeProof('EMP002');
        expect(proof).toBeNull();

        console.log('✅ Successfully prevented replay attack');
      });

      test('should fail INCOME_RANGE proof when threshold_max <= threshold_min', () => {
        console.log('\n📋 Test: Invalid INCOME_RANGE Thresholds\n');

        const timestamp = BigInt(payroll.getCurrentTimestamp());

        payroll.submitIncomeProof(
          EMPLOYEE_ID,
          2, // INCOME_RANGE
          THRESHOLD_MIN,
          THRESHOLD_MIN, // threshold_max == threshold_min (invalid)
          TXIDS,
          HISTORY_COMMITMENT,
          ATTESTATION_HASH,
          VERIFIER_PUBKEY,
          timestamp,
          2592000
        );

        // Proof should not be added (invalid thresholds)
        const proof = payroll.getIncomeProof(EMPLOYEE_ID);
        expect(proof).toBeNull();

        console.log('✅ Correctly rejected invalid INCOME_RANGE thresholds');
      });
    });

    describe('Verify Income Proof', () => {
      const EMPLOYEE_ID = 'EMP001';
      const THRESHOLD_MIN = 5000n;
      const THRESHOLD_MAX = 10000n;
      const TXIDS = Array(12).fill(0).map((_, i) => `0xTX00${i + 1}`.padEnd(64, '0'));
      let HISTORY_COMMITMENT: string;

      beforeEach(() => {
        payroll.registerTrustedVerifier(VERIFIER_PUBKEY);

        // Setup: Add employee and create payment history (required for history_commitment verification)
        payroll.addEmployee(EMPLOYEE_ID);
        payroll.depositCompanyFunds(200000n);

        // Create payment history (12 payments to fill the rolling window)
        for (let i = 0; i < 12; i++) {
          payroll.payEmployee(EMPLOYEE_ID, 5000n + BigInt(i * 100), 0); // SALARY payments
        }

        // Compute history commitment from actual payment history
        HISTORY_COMMITMENT = payroll.computeHistoryCommitment(EMPLOYEE_ID);
      });

      test('should verify INCOME_ABOVE_THRESHOLD when threshold is met', () => {
        console.log('\n📋 Test: Verify INCOME_ABOVE_THRESHOLD - Met\n');

        const timestamp = BigInt(payroll.getCurrentTimestamp());

        payroll.submitIncomeProof(
          EMPLOYEE_ID,
          1,
          THRESHOLD_MIN, // Employee proved $5000
          0n,
          TXIDS,
          HISTORY_COMMITMENT,
          'hash001',
          VERIFIER_PUBKEY,
          timestamp,
          2592000
        );

        // Requiring $4000 (less than proven $5000) should pass
        const isValid = payroll.verifyIncomeProof(EMPLOYEE_ID, 1, 4000n);
        expect(isValid).toBe(true);

        console.log('✅ INCOME_ABOVE_THRESHOLD verification passed (threshold met)');
      });

      test('should fail INCOME_ABOVE_THRESHOLD when threshold is not met', () => {
        console.log('\n📋 Test: Verify INCOME_ABOVE_THRESHOLD - Not Met\n');

        const timestamp = BigInt(payroll.getCurrentTimestamp());

        payroll.submitIncomeProof(
          EMPLOYEE_ID,
          1,
          THRESHOLD_MIN, // Employee proved $5000
          0n,
          TXIDS,
          HISTORY_COMMITMENT,
          'hash002',
          VERIFIER_PUBKEY,
          timestamp,
          2592000
        );

        // Requiring $6000 (more than proven $5000) should fail
        const result = payroll.verifyIncomeProof(EMPLOYEE_ID, 1, 6000n);
        expect(result).toBe(false);

        console.log('✅ Correctly rejected insufficient threshold');
      });

      test('should verify INCOME_RANGE when in range', () => {
        console.log('\n📋 Test: Verify INCOME_RANGE - In Range\n');

        const timestamp = BigInt(payroll.getCurrentTimestamp());

        payroll.submitIncomeProof(
          EMPLOYEE_ID,
          2,
          THRESHOLD_MIN, // $5000
          THRESHOLD_MAX, // $10000
          TXIDS,
          HISTORY_COMMITMENT,
          'hash003',
          VERIFIER_PUBKEY,
          timestamp,
          2592000
        );

        // Requiring $7000 (within $5000-$10000 range) should pass
        const isValid = payroll.verifyIncomeProof(EMPLOYEE_ID, 2, 7000n);
        expect(isValid).toBe(true);

        console.log('✅ INCOME_RANGE verification passed (in range)');
      });

      test('should fail INCOME_RANGE when out of range', () => {
        console.log('\n📋 Test: Verify INCOME_RANGE - Out of Range\n');

        const timestamp = BigInt(payroll.getCurrentTimestamp());

        payroll.submitIncomeProof(
          EMPLOYEE_ID,
          2,
          THRESHOLD_MIN, // $5000
          THRESHOLD_MAX, // $10000
          TXIDS,
          HISTORY_COMMITMENT,
          'hash004',
          VERIFIER_PUBKEY,
          timestamp,
          2592000
        );

        // Requiring $12000 (above $10000 max) should fail
        const result = payroll.verifyIncomeProof(EMPLOYEE_ID, 2, 12000n);
        expect(result).toBe(false);

        console.log('✅ Correctly rejected out-of-range requirement');
      });

      test('should verify AVERAGE_INCOME proof', () => {
        console.log('\n📋 Test: Verify AVERAGE_INCOME\n');

        const timestamp = BigInt(payroll.getCurrentTimestamp());

        payroll.submitIncomeProof(
          EMPLOYEE_ID,
          3,
          THRESHOLD_MIN,
          0n,
          TXIDS,
          HISTORY_COMMITMENT,
          'hash005',
          VERIFIER_PUBKEY,
          timestamp,
          2592000
        );

        const isValid = payroll.verifyIncomeProof(EMPLOYEE_ID, 3, 4000n);
        expect(isValid).toBe(true);

        console.log('✅ AVERAGE_INCOME verification passed');
      });

      test('should verify CREDIT_SCORE proof', () => {
        console.log('\n📋 Test: Verify CREDIT_SCORE\n');

        const timestamp = BigInt(payroll.getCurrentTimestamp());

        payroll.submitIncomeProof(
          EMPLOYEE_ID,
          4,
          700n, // Credit score 700
          0n,
          TXIDS,
          HISTORY_COMMITMENT,
          'hash006',
          VERIFIER_PUBKEY,
          timestamp,
          2592000
        );

        const isValid = payroll.verifyIncomeProof(EMPLOYEE_ID, 4, 650n);
        expect(isValid).toBe(true);

        console.log('✅ CREDIT_SCORE verification passed');
      });

      test('should fail when proof type mismatch', () => {
        console.log('\n📋 Test: Proof Type Mismatch\n');

        const timestamp = BigInt(payroll.getCurrentTimestamp());

        // Submit type 1 proof
        payroll.submitIncomeProof(
          EMPLOYEE_ID,
          1,
          THRESHOLD_MIN,
          0n,
          TXIDS,
          HISTORY_COMMITMENT,
          'hash007',
          VERIFIER_PUBKEY,
          timestamp,
          2592000
        );

        // Try to verify as type 2
        const result = payroll.verifyIncomeProof(EMPLOYEE_ID, 2, 5000n);
        expect(result).toBe(false);

        console.log('✅ Correctly rejected proof type mismatch');
      });

      test('should fail when proof expired', () => {
        console.log('\n📋 Test: Expired Proof\n');

        const timestamp = BigInt(payroll.getCurrentTimestamp());
        const shortExpiry = 1; // 1 second

        payroll.submitIncomeProof(
          EMPLOYEE_ID,
          1,
          THRESHOLD_MIN,
          0n,
          TXIDS,
          HISTORY_COMMITMENT,
          'hash008',
          VERIFIER_PUBKEY,
          timestamp,
          shortExpiry
        );

        // Fast-forward time by 2 seconds
        payroll.updateTimestamp(Number(timestamp) + 2);

        const result = payroll.verifyIncomeProof(EMPLOYEE_ID, 1, 4000n);
        expect(result).toBe(false);

        console.log('✅ Correctly rejected expired proof');
      });
    });
  });

  // ========================================
  // PART 2: End-to-End Tests with Real Proofs
  // ========================================
  describe('End-to-End Tests with Real ZKML Proofs', () => {
    beforeEach(() => {
      // Validate ONNX models exist before running e2e tests
      const validation = ModelManager.validateModels();
      if (!validation.valid) {
        console.error('❌ Missing model files:', validation.missing);
        throw new Error('ONNX models not found. Run: cd ../zkml/payroll && npm run setup');
      }
    });

    test('should complete full flow: generate proof → submit → verify (INCOME_ABOVE_THRESHOLD)', async () => {
      console.log('\n🚀 E2E Test: INCOME_ABOVE_THRESHOLD with Real Proof\n');
      console.log('='.repeat(70));

      // Step 1: Generate real EZKL proof
      console.log('\n📊 STEP 1: Generating real EZKL proof...');
      const payments = [5000, 5100, 5200, 5300, 5400, 5500, 5600, 5700, 5800, 5900, 6000, 6100];
      const threshold = 4500;

      const avgIncome = calculateAverageIncome(payments);
      console.log(`  Payments: [${payments.slice(0, 3).join(', ')}, ..., ${payments.slice(-2).join(', ')}]`);
      console.log(`  Average Income: $${avgIncome.toLocaleString()}`);
      console.log(`  Threshold: $${threshold.toLocaleString()}`);

      const proofResult = await generateIncomeProof(
        ProofType.INCOME_ABOVE_THRESHOLD,
        payments,
        threshold
      );

      expect(proofResult.success).toBe(true);
      expect(proofResult.proof).not.toBeUndefined();
      console.log(`✅ Proof generated in ${(proofResult.duration / 1000).toFixed(2)}s`);

      // Step 2: Verify proof with EZKL
      console.log('\n🔍 STEP 2: Verifying proof with EZKL...');
      const verifyResult = await verifyIncomeProof(proofResult.proof!);

      expect(verifyResult.success).toBe(true);
      expect(verifyResult.verified).toBe(true);
      console.log(`✅ Proof verified in ${(verifyResult.duration / 1000).toFixed(2)}s`);

      // Step 3: Submit to smart contract
      console.log('\n📝 STEP 3: Submitting proof to smart contract...');
      payroll.registerTrustedVerifier(VERIFIER_PUBKEY);

      const employeeId = 'EMP_REAL_001';

      // Setup: Add employee and create payment history (required for history_commitment verification)
      payroll.addEmployee(employeeId);
      payroll.depositCompanyFunds(200000n);
      for (let i = 0; i < 12; i++) {
        payroll.payEmployee(employeeId, BigInt(payments[i]), 0); // Use actual payment amounts from proof
      }

      const txids = Array(12).fill(0).map((_, i) => `0xTX_REAL_${i + 1}`.padEnd(64, '0'));
      const historyCommitment = payroll.computeHistoryCommitment(employeeId); // Compute actual hash
      const attestationHash = 'real_attestation_hash_001'.padEnd(64, '0');
      const timestamp = BigInt(payroll.getCurrentTimestamp());

      payroll.submitIncomeProof(
        employeeId,
        ProofType.INCOME_ABOVE_THRESHOLD,
        BigInt(threshold),
        0n,
        txids,
        historyCommitment,
        attestationHash,
        VERIFIER_PUBKEY,
        timestamp,
        2592000
      );

      const proof = payroll.getIncomeProof(employeeId);
      expect(proof).not.toBeNull();
      console.log('✅ Proof submitted to contract');

      // Step 4: Verify with contract
      console.log('\n🎯 STEP 4: Verifying with contract...');
      const isValid = payroll.verifyIncomeProof(employeeId, ProofType.INCOME_ABOVE_THRESHOLD, 4000n);
      expect(isValid).toBe(true);
      console.log('✅ Contract verification passed');

      console.log('\n' + '='.repeat(70));
      console.log('🎉 INCOME_ABOVE_THRESHOLD E2E TEST PASSED!\n');
    }, 60000);

    test('should complete full flow: generate proof → submit → verify (INCOME_RANGE)', async () => {
      console.log('\n🚀 E2E Test: INCOME_RANGE with Real Proof\n');
      console.log('='.repeat(70));

      const payments = [7000, 7200, 7400, 7600, 7800, 8000, 8200, 8400, 8600, 8800, 9000, 9200];
      const thresholdMin = 7000;
      const thresholdMax = 9500;

      console.log('\n📊 Generating INCOME_RANGE proof...');
      const proofResult = await generateIncomeProof(
        ProofType.INCOME_RANGE,
        payments,
        thresholdMin,
        thresholdMax
      );

      expect(proofResult.success).toBe(true);
      console.log(`✅ Proof generated in ${(proofResult.duration / 1000).toFixed(2)}s`);

      const verifyResult = await verifyIncomeProof(proofResult.proof!);
      expect(verifyResult.verified).toBe(true);
      console.log(`✅ Proof verified in ${(verifyResult.duration / 1000).toFixed(2)}s`);

      payroll.registerTrustedVerifier(VERIFIER_PUBKEY);
      const employeeId = 'EMP_REAL_002';

      // Setup: Add employee and create payment history
      payroll.addEmployee(employeeId);
      payroll.depositCompanyFunds(300000n);
      for (let i = 0; i < 12; i++) {
        payroll.payEmployee(employeeId, BigInt(payments[i]), 0);
      }

      const timestamp = BigInt(payroll.getCurrentTimestamp());

      const historyCommitmentEmp2 = payroll.computeHistoryCommitment(employeeId); // Compute actual hash

      payroll.submitIncomeProof(
        employeeId,
        ProofType.INCOME_RANGE,
        BigInt(thresholdMin),
        BigInt(thresholdMax),
        Array(12).fill('0x').map((_, i) => `${_}TX${i}`.padEnd(64, '0')),
        historyCommitmentEmp2,
        'attestation_002'.padEnd(64, '0'),
        VERIFIER_PUBKEY,
        timestamp,
        2592000
      );

      const isValid = payroll.verifyIncomeProof(employeeId, ProofType.INCOME_RANGE, 8000n);
      expect(isValid).toBe(true);

      console.log('\n🎉 INCOME_RANGE E2E TEST PASSED!\n');
    }, 60000);

    test('should complete full flow: generate proof → submit → verify (AVERAGE_INCOME)', async () => {
      console.log('\n🚀 E2E Test: AVERAGE_INCOME with Real Proof\n');
      console.log('='.repeat(70));

      const payments = [12000, 12500, 13000, 13500, 14000, 14500, 15000, 15500, 16000, 16500, 17000, 17500];
      const threshold = 12000;

      console.log('\n📊 Generating AVERAGE_INCOME proof...');
      const avgIncome = calculateAverageIncome(payments);
      console.log(`  Average Income: $${avgIncome.toLocaleString()}`);

      const proofResult = await generateIncomeProof(
        ProofType.AVERAGE_INCOME,
        payments,
        threshold
      );

      expect(proofResult.success).toBe(true);
      console.log(`✅ Proof generated in ${(proofResult.duration / 1000).toFixed(2)}s`);

      const verifyResult = await verifyIncomeProof(proofResult.proof!);
      expect(verifyResult.verified).toBe(true);
      console.log(`✅ Proof verified in ${(verifyResult.duration / 1000).toFixed(2)}s`);

      payroll.registerTrustedVerifier(VERIFIER_PUBKEY);
      const employeeId = 'EMP_REAL_003';

      // Setup: Add employee and create payment history
      payroll.addEmployee(employeeId);
      payroll.depositCompanyFunds(500000n);
      for (let i = 0; i < 12; i++) {
        payroll.payEmployee(employeeId, BigInt(payments[i]), 0);
      }

      const timestamp = BigInt(payroll.getCurrentTimestamp());
      const historyCommitmentEmp3 = payroll.computeHistoryCommitment(employeeId); // Compute actual hash

      payroll.submitIncomeProof(
        employeeId,
        ProofType.AVERAGE_INCOME,
        BigInt(threshold),
        0n,
        Array(12).fill('0x').map((_, i) => `${_}TX${i}`.padEnd(64, '0')),
        historyCommitmentEmp3,
        'attestation_003'.padEnd(64, '0'),
        VERIFIER_PUBKEY,
        timestamp,
        2592000
      );

      const isValid = payroll.verifyIncomeProof(employeeId, ProofType.AVERAGE_INCOME, 11000n);
      expect(isValid).toBe(true);

      console.log('\n🎉 AVERAGE_INCOME E2E TEST PASSED!\n');
    }, 60000);

    test('should complete full flow: generate proof → submit → verify (CREDIT_SCORE)', async () => {
      console.log('\n🚀 E2E Test: CREDIT_SCORE with Real Proof\n');
      console.log('='.repeat(70));

      const payments = [8000, 6000, 10000, 7000, 9000, 8500, 7500, 8000, 9500, 8000, 8500, 9000];
      const threshold = 600;

      console.log('\n📊 Generating CREDIT_SCORE proof...');
      const creditScore = calculateCreditScore(payments);
      console.log(`  Expected Credit Score: ${creditScore.toFixed(0)}`);

      const proofResult = await generateIncomeProof(
        ProofType.CREDIT_SCORE,
        payments,
        threshold
      );

      expect(proofResult.success).toBe(true);
      console.log(`✅ Proof generated in ${(proofResult.duration / 1000).toFixed(2)}s`);

      const verifyResult = await verifyIncomeProof(proofResult.proof!);
      expect(verifyResult.verified).toBe(true);
      console.log(`✅ Proof verified in ${(verifyResult.duration / 1000).toFixed(2)}s`);

      payroll.registerTrustedVerifier(VERIFIER_PUBKEY);
      const employeeId = 'EMP_REAL_004';

      // Setup: Add employee and create payment history
      payroll.addEmployee(employeeId);
      payroll.depositCompanyFunds(250000n);
      for (let i = 0; i < 12; i++) {
        payroll.payEmployee(employeeId, BigInt(payments[i]), 0);
      }

      const timestamp = BigInt(payroll.getCurrentTimestamp());
      const historyCommitmentEmp4 = payroll.computeHistoryCommitment(employeeId); // Compute actual hash

      payroll.submitIncomeProof(
        employeeId,
        ProofType.CREDIT_SCORE,
        BigInt(Math.floor(creditScore)),
        0n,
        Array(12).fill('0x').map((_, i) => `${_}TX${i}`.padEnd(64, '0')),
        historyCommitmentEmp4,
        'attestation_004'.padEnd(64, '0'),
        VERIFIER_PUBKEY,
        timestamp,
        2592000
      );

      const isValid = payroll.verifyIncomeProof(employeeId, ProofType.CREDIT_SCORE, 600n);
      expect(isValid).toBe(true);

      console.log('\n🎉 CREDIT_SCORE E2E TEST PASSED!\n');
    }, 60000);

    test('should handle complete multi-employee scenario with different proof types', async () => {
      console.log('\n🚀 E2E Test: Multi-Employee Scenario\n');
      console.log('='.repeat(70));

      payroll.registerTrustedVerifier(VERIFIER_PUBKEY);

      // Employee 1: Junior dev with INCOME_ABOVE_THRESHOLD
      console.log('\n👤 Employee 1: Junior Developer (INCOME_ABOVE_THRESHOLD)');
      const emp1Payments = [5000, 5100, 5200, 5300, 5400, 5500, 5600, 5700, 5800, 5900, 6000, 6100];

      // Setup EMP_JUNIOR with payment history
      payroll.addEmployee('EMP_JUNIOR');
      payroll.depositCompanyFunds(300000n);
      for (let i = 0; i < 12; i++) {
        payroll.payEmployee('EMP_JUNIOR', BigInt(emp1Payments[i]), 0);
      }

      const emp1Proof = await generateIncomeProof(ProofType.INCOME_ABOVE_THRESHOLD, emp1Payments, 4500);
      expect(emp1Proof.success).toBe(true);

      const historyCommitmentJunior = payroll.computeHistoryCommitment('EMP_JUNIOR');

      payroll.submitIncomeProof(
        'EMP_JUNIOR',
        ProofType.INCOME_ABOVE_THRESHOLD,
        4500n,
        0n,
        Array(12).fill('0x').map((_, i) => `${_}J${i}`.padEnd(64, '0')),
        historyCommitmentJunior,
        'att_junior'.padEnd(64, '0'),
        VERIFIER_PUBKEY,
        BigInt(payroll.getCurrentTimestamp()),
        2592000
      );

      // Employee 2: Mid-level with INCOME_RANGE
      console.log('👤 Employee 2: Mid-Level (INCOME_RANGE)');
      const emp2Payments = [7000, 7200, 7400, 7600, 7800, 8000, 8200, 8400, 8600, 8800, 9000, 9200];

      // Setup EMP_MID with payment history
      payroll.addEmployee('EMP_MID');
      for (let i = 0; i < 12; i++) {
        payroll.payEmployee('EMP_MID', BigInt(emp2Payments[i]), 0);
      }

      const emp2Proof = await generateIncomeProof(ProofType.INCOME_RANGE, emp2Payments, 7000, 9500);
      expect(emp2Proof.success).toBe(true);

      const historyCommitmentMid = payroll.computeHistoryCommitment('EMP_MID');

      payroll.submitIncomeProof(
        'EMP_MID',
        ProofType.INCOME_RANGE,
        7000n,
        9500n,
        Array(12).fill('0x').map((_, i) => `${_}M${i}`.padEnd(64, '0')),
        historyCommitmentMid,
        'att_mid'.padEnd(64, '0'),
        VERIFIER_PUBKEY,
        BigInt(payroll.getCurrentTimestamp()),
        2592000
      );

      // Verify both employees
      const emp1Valid = payroll.verifyIncomeProof('EMP_JUNIOR', ProofType.INCOME_ABOVE_THRESHOLD, 4000n);
      const emp2Valid = payroll.verifyIncomeProof('EMP_MID', ProofType.INCOME_RANGE, 8000n);

      expect(emp1Valid).toBe(true);
      expect(emp2Valid).toBe(true);

      console.log('\n✅ Both employees verified successfully');
      console.log('🎉 MULTI-EMPLOYEE E2E TEST PASSED!\n');
    }, 120000);
  });
});
