import { describe, test, expect, beforeEach } from 'vitest';
import { PayrollMultiPartyTestSetup } from './payroll-setup-multi.js';

describe('zkSalaria ZKML Integration Tests', () => {
  let payroll: PayrollMultiPartyTestSetup;
  const companyId = 'COMP001';
  const companyName = 'Acme Corp';

  // Sample ZKML attestation data (from zkml-verifier service)
  const VERIFIER_PUBKEY = 'a0cb1aac7c3e2b15fb8c59bcf3d6e0c9c0e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1';
  const EMPLOYEE_ID = 'EMP001';
  const THRESHOLD = 5000n;
  const TXIDS = [
    '0xTX001_2024_01'.padEnd(64, '0'),
    '0xTX002_2024_02'.padEnd(64, '0'),
    '0xTX003_2024_03'.padEnd(64, '0'),
    '0xTX004_2024_04'.padEnd(64, '0')
  ];
  const MERKLE_ROOT = '0xMERKLE_ROOT_PAYMENT_HISTORY_Q1_2024'.padEnd(64, '0');
  const ATTESTATION_HASH = 'ec8a4ef5e5b0e8c6c7f8e9f0e1e2e3e4e5e6e7e8e9e0e1e2e3e4e5e6e7e8e9e0';

  beforeEach(() => {
    payroll = new PayrollMultiPartyTestSetup(companyId, companyName);
    console.log('\n🔄 ZKML payroll contract initialized\n');
  });

  describe('Register Trusted Verifier', () => {
    test('should register a trusted verifier', () => {
      console.log('\n📋 Test: Register Trusted Verifier\n');

      // Register verifier
      payroll.registerTrustedVerifier(VERIFIER_PUBKEY);

      // Verify verifier is trusted
      expect(payroll.isTrustedVerifier(VERIFIER_PUBKEY)).toBe(true);

      console.log('✅ Verifier successfully registered and trusted');
    });

    test('should fail to register same verifier twice', () => {
      console.log('\n📋 Test: Duplicate Verifier Registration\n');

      // Register verifier first time
      payroll.registerTrustedVerifier(VERIFIER_PUBKEY);

      // Attempting to register again should throw
      expect(() => {
        payroll.registerTrustedVerifier(VERIFIER_PUBKEY);
      }).toThrow(/already registered/i);

      console.log('✅ Correctly rejected duplicate verifier registration');
    });
  });

  describe('Verify Attestation', () => {
    beforeEach(() => {
      // Register verifier before each test
      payroll.registerTrustedVerifier(VERIFIER_PUBKEY);
    });

    test('should verify attestation and store it', () => {
      console.log('\n📋 Test: Verify Attestation\n');

      const timestamp = BigInt(Math.floor(Date.now() / 1000));

      // Verify attestation
      payroll.verifyAttestation(
        EMPLOYEE_ID,
        THRESHOLD,
        TXIDS,
        MERKLE_ROOT,
        timestamp,
        ATTESTATION_HASH,
        VERIFIER_PUBKEY
      );

      // Check attestation was stored
      const attestation = payroll.getVerifiedAttestation(EMPLOYEE_ID);
      expect(attestation).not.toBeNull();
      expect(attestation.threshold).toBe(THRESHOLD);

      // Check attestation hash was marked as used
      expect(payroll.isAttestationUsed(ATTESTATION_HASH)).toBe(true);

      console.log('✅ Attestation verified and stored successfully');
    });

    test('should fail with untrusted verifier', () => {
      console.log('\n📋 Test: Untrusted Verifier\n');

      const untrustedVerifier = 'bad1bad1bad1bad1bad1bad1bad1bad1bad1bad1bad1bad1bad1bad1bad1bad1';
      const timestamp = BigInt(Math.floor(Date.now() / 1000));

      // Should throw when verifier is not trusted
      expect(() => {
        payroll.verifyAttestation(
          EMPLOYEE_ID,
          THRESHOLD,
          TXIDS,
          MERKLE_ROOT,
          timestamp,
          ATTESTATION_HASH,
          untrustedVerifier
        );
      }).toThrow(/not trusted/i);

      console.log('✅ Correctly rejected untrusted verifier');
    });

    test('should prevent replay attacks', () => {
      console.log('\n📋 Test: Replay Attack Prevention\n');

      const timestamp = BigInt(Math.floor(Date.now() / 1000));

      // Verify attestation first time
      payroll.verifyAttestation(
        EMPLOYEE_ID,
        THRESHOLD,
        TXIDS,
        MERKLE_ROOT,
        timestamp,
        ATTESTATION_HASH,
        VERIFIER_PUBKEY
      );

      // Try to use same attestation again - should fail
      expect(() => {
        payroll.verifyAttestation(
          EMPLOYEE_ID,
          THRESHOLD,
          TXIDS,
          MERKLE_ROOT,
          timestamp,
          ATTESTATION_HASH,
          VERIFIER_PUBKEY
        );
      }).toThrow(/already used|replay/i);

      console.log('✅ Successfully prevented replay attack');
    });

    test('should reject expired attestations (older than 1 hour)', () => {
      console.log('\n📋 Test: Expired Attestation\n');

      // Create attestation with timestamp from 2 hours ago
      const twoHoursAgo = BigInt(Math.floor(Date.now() / 1000) - 7200);

      expect(() => {
        payroll.verifyAttestation(
          EMPLOYEE_ID,
          THRESHOLD,
          TXIDS,
          MERKLE_ROOT,
          twoHoursAgo,
          ATTESTATION_HASH,
          VERIFIER_PUBKEY
        );
      }).toThrow(/expired|older than 1 hour/i);

      console.log('✅ Correctly rejected expired attestation');
    });

    test('should reject future timestamps', () => {
      console.log('\n📋 Test: Future Timestamp\n');

      // Create attestation with timestamp from 1 hour in future
      const oneHourFuture = BigInt(Math.floor(Date.now() / 1000) + 3600);

      expect(() => {
        payroll.verifyAttestation(
          EMPLOYEE_ID,
          THRESHOLD,
          TXIDS,
          MERKLE_ROOT,
          oneHourFuture,
          ATTESTATION_HASH,
          VERIFIER_PUBKEY
        );
      }).toThrow(/future/i);

      console.log('✅ Correctly rejected future timestamp');
    });
  });

  describe('Prove Eligibility', () => {
    beforeEach(() => {
      // Setup: Register verifier and verify attestation
      payroll.registerTrustedVerifier(VERIFIER_PUBKEY);

      const timestamp = BigInt(Math.floor(Date.now() / 1000));
      payroll.verifyAttestation(
        EMPLOYEE_ID,
        THRESHOLD,
        TXIDS,
        MERKLE_ROOT,
        timestamp,
        ATTESTATION_HASH,
        VERIFIER_PUBKEY
      );
    });

    test('should prove eligibility when threshold is met', () => {
      console.log('\n📋 Test: Prove Eligibility - Threshold Met\n');

      // Employee's verified threshold is 5000, requiring min 4000 - should pass
      const isEligible = payroll.proveEligibility(EMPLOYEE_ID, 4000n);

      expect(isEligible).toBe(true);
      console.log('✅ Employee proven eligible (threshold met)');
    });

    test('should prove eligibility when threshold equals requirement', () => {
      console.log('\n📋 Test: Prove Eligibility - Threshold Equals\n');

      // Employee's verified threshold is 5000, requiring exactly 5000 - should pass
      const isEligible = payroll.proveEligibility(EMPLOYEE_ID, 5000n);

      expect(isEligible).toBe(true);
      console.log('✅ Employee proven eligible (threshold equals requirement)');
    });

    test('should fail when threshold is not met', () => {
      console.log('\n📋 Test: Prove Eligibility - Threshold Not Met\n');

      // Employee's verified threshold is 5000, requiring 6000 - should fail
      const isEligible = payroll.proveEligibility(EMPLOYEE_ID, 6000n);

      expect(isEligible).toBe(false);
      console.log('✅ Correctly rejected eligibility (threshold not met)');
    });

    test('should fail when no verified attestation exists', () => {
      console.log('\n📋 Test: Prove Eligibility - No Attestation\n');

      // Try to prove eligibility for employee without verified attestation
      const unverifiedEmployee = 'EMP002';
      const isEligible = payroll.proveEligibility(unverifiedEmployee, 4000n);

      expect(isEligible).toBe(false);
      console.log('✅ Correctly rejected eligibility (no verified attestation)');
    });

    test('should fail when attestation expires (older than 24 hours)', () => {
      console.log('\n📋 Test: Prove Eligibility - Attestation Expired\n');

      // Fast-forward time by 25 hours
      const currentTime = BigInt(Math.floor(Date.now() / 1000));
      const futureTime = currentTime + 90000n; // 25 hours later
      payroll.updateTimestamp(futureTime);

      // Try to prove eligibility with old attestation
      const isEligible = payroll.proveEligibility(EMPLOYEE_ID, 4000n);

      expect(isEligible).toBe(false);
      console.log('✅ Correctly rejected expired attestation (older than 24 hours)');
    });
  });

  describe('Complete ZKML Flow', () => {
    test('should complete full ZKML verification and eligibility flow', () => {
      console.log('\n📋 Test: Complete ZKML Flow\n');

      // Step 1: Register trusted verifier
      console.log('  Step 1: Registering trusted verifier...');
      payroll.registerTrustedVerifier(VERIFIER_PUBKEY);
      expect(payroll.isTrustedVerifier(VERIFIER_PUBKEY)).toBe(true);

      // Step 2: Verify attestation
      console.log('  Step 2: Verifying ZKML attestation...');
      const timestamp = BigInt(Math.floor(Date.now() / 1000));
      payroll.verifyAttestation(
        EMPLOYEE_ID,
        THRESHOLD,
        TXIDS,
        MERKLE_ROOT,
        timestamp,
        ATTESTATION_HASH,
        VERIFIER_PUBKEY
      );

      const attestation = payroll.getVerifiedAttestation(EMPLOYEE_ID);
      expect(attestation).not.toBeNull();
      expect(attestation.threshold).toBe(THRESHOLD);
      expect(payroll.isAttestationUsed(ATTESTATION_HASH)).toBe(true);

      // Step 3: Prove eligibility
      console.log('  Step 3: Proving eligibility...');
      const isEligible = payroll.proveEligibility(EMPLOYEE_ID, 4000n);
      expect(isEligible).toBe(true);

      console.log('\n✅ Complete ZKML flow succeeded!');
      console.log('  ✓ Verifier registered and trusted');
      console.log('  ✓ Attestation verified and stored');
      console.log('  ✓ Replay protection active');
      console.log('  ✓ Eligibility proven');
    });

    test('should handle multiple employees with different thresholds', () => {
      console.log('\n📋 Test: Multiple Employees\n');

      // Register verifier
      payroll.registerTrustedVerifier(VERIFIER_PUBKEY);

      const timestamp = BigInt(Math.floor(Date.now() / 1000));

      // Employee 1: High earner (threshold: $7000)
      const emp1Id = 'EMP001';
      const emp1Threshold = 7000n;
      const emp1AttestationHash = 'aaa1aaa1aaa1aaa1aaa1aaa1aaa1aaa1aaa1aaa1aaa1aaa1aaa1aaa1aaa1aaa1';

      payroll.verifyAttestation(
        emp1Id,
        emp1Threshold,
        TXIDS,
        MERKLE_ROOT,
        timestamp,
        emp1AttestationHash,
        VERIFIER_PUBKEY
      );

      // Employee 2: Lower earner (threshold: $4000)
      const emp2Id = 'EMP002';
      const emp2Threshold = 4000n;
      const emp2AttestationHash = 'bbb2bbb2bbb2bbb2bbb2bbb2bbb2bbb2bbb2bbb2bbb2bbb2bbb2bbb2bbb2bbb2';

      payroll.verifyAttestation(
        emp2Id,
        emp2Threshold,
        TXIDS,
        MERKLE_ROOT,
        timestamp,
        emp2AttestationHash,
        VERIFIER_PUBKEY
      );

      // Both should prove eligibility for $3000 threshold
      expect(payroll.proveEligibility(emp1Id, 3000n)).toBe(true);
      expect(payroll.proveEligibility(emp2Id, 3000n)).toBe(true);

      // Only Employee 1 should prove eligibility for $6000 threshold
      expect(payroll.proveEligibility(emp1Id, 6000n)).toBe(true);
      expect(payroll.proveEligibility(emp2Id, 6000n)).toBe(false);

      console.log('✅ Multiple employees handled correctly with different thresholds');
    });
  });
});
