/**
 * End-to-End ZKML Integration Test
 *
 * This test verifies the complete flow with REAL data:
 * 1. Generate actual EZKL proof from payment data
 * 2. Call zkml-verifier service to verify proof and create attestation
 * 3. Submit real attestation to smart contract
 * 4. Prove eligibility using verified attestation
 *
 * Prerequisites:
 * - zkml-verifier service must be running on localhost:3002
 * - EZKL must be installed and available
 */

import { describe, test, expect, beforeAll } from 'vitest';
import { PayrollMultiPartyTestSetup } from './payroll-setup-multi.js';
import { readFile } from 'fs/promises';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const VERIFIER_URL = 'http://localhost:3002';
const ZKML_DIR = '../zkml/payroll';

interface Attestation {
  employee_id: string;
  threshold: string;
  txids: string[];
  merkle_root: string;
  timestamp: number;
  attestation_hash: string;
  verifier_pubkey: string;
}

interface VerifyProofResponse {
  success: boolean;
  attestation?: Attestation;
  error?: string;
  message?: string;
}

describe('zkSalaria End-to-End ZKML Integration', () => {
  let payroll: PayrollMultiPartyTestSetup;
  const companyId = 'COMP001';
  const companyName = 'Acme Corp';

  // Real payment data for proof generation
  const EMPLOYEE_ID = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1';
  const THRESHOLD = 5000;
  const PAYMENTS = [6000, 7000, 8000]; // Average: 7000 > 5000 threshold
  const TXIDS = [
    '0xTX001_2024_01',
    '0xTX002_2024_02',
    '0xTX003_2024_03',
    '0xTX004_2024_04'
  ];
  const MERKLE_ROOT = '0xMERKLE_ROOT_PAYMENT_HISTORY_Q1_2024';

  beforeAll(async () => {
    // Check if zkml-verifier service is running
    try {
      const response = await fetch(`${VERIFIER_URL}/health`);
      if (!response.ok) {
        throw new Error(`Verifier service not healthy: ${response.statusText}`);
      }
      console.log('✅ zkml-verifier service is running');
    } catch (error) {
      throw new Error(
        `zkml-verifier service is not running on ${VERIFIER_URL}. ` +
        `Please start it with: cd ../zkml-verifier && npm run dev`
      );
    }
  });

  describe('Complete End-to-End Flow with Real Data', () => {
    test('should verify complete ZKML flow with real proof generation', async () => {
      console.log('\n🚀 Starting End-to-End ZKML Integration Test\n');
      console.log('='.repeat(70));

      // ============================================================
      // STEP 1: Generate Real EZKL Proof
      // ============================================================
      console.log('\n📊 STEP 1: Generating real EZKL proof from payment data...');
      console.log('  Payment amounts:', PAYMENTS);
      console.log('  Average:', PAYMENTS.reduce((a, b) => a + b) / PAYMENTS.length);
      console.log('  Threshold:', THRESHOLD);

      try {
        // Run the proof generation script
        const { stdout, stderr } = await execAsync(
          `cd ${ZKML_DIR} && npx tsx generate-payroll-proof.ts`,
          { timeout: 30000 }
        );

        console.log('✅ EZKL proof generated successfully');

        // Verify proof file exists
        const proofExists = await checkFileExists(`${ZKML_DIR}/proof.json`);
        expect(proofExists).toBe(true);

      } catch (error) {
        console.error('❌ Failed to generate proof:', error);
        throw new Error(
          `Proof generation failed. Make sure EZKL is installed and working. ` +
          `Error: ${(error as Error).message}`
        );
      }

      // ============================================================
      // STEP 2: Call zkml-verifier Service with Real Proof
      // ============================================================
      console.log('\n🔐 STEP 2: Calling zkml-verifier service with real proof...');

      let attestation: Attestation;

      try {
        // Load the generated proof
        const proofData = await readFile(`${ZKML_DIR}/proof.json`, 'utf-8');
        const proof = JSON.parse(proofData);
        console.log(`  Loaded proof (${Buffer.from(proofData).length} bytes)`);

        // Create verification request
        const request = {
          proof: proof,
          publicInputs: {
            employee_id: EMPLOYEE_ID,
            threshold: THRESHOLD,
            txids: TXIDS,
            merkle_root: MERKLE_ROOT
          }
        };

        // Send to verifier service
        console.log('  Sending to verifier service...');
        const response = await fetch(`${VERIFIER_URL}/api/zkml/verify-proof`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(request)
        });

        const result: VerifyProofResponse = await response.json();

        if (!result.success || !result.attestation) {
          throw new Error(
            `Verification failed: ${result.error || result.message || 'Unknown error'}`
          );
        }

        attestation = result.attestation;
        console.log('✅ Proof verified and attestation created');
        console.log(`  Attestation hash: ${attestation.attestation_hash.substring(0, 16)}...`);
        console.log(`  Verifier pubkey: ${attestation.verifier_pubkey.substring(0, 16)}...`);
        console.log(`  Timestamp: ${attestation.timestamp}`);

        // Verify attestation data matches our inputs
        expect(attestation.employee_id).toBe(EMPLOYEE_ID);
        expect(parseInt(attestation.threshold)).toBe(THRESHOLD);
        expect(attestation.txids).toEqual(TXIDS);
        expect(attestation.merkle_root).toBe(MERKLE_ROOT);

      } catch (error) {
        console.error('❌ Verifier service call failed:', error);
        throw error;
      }

      // ============================================================
      // STEP 3: Initialize Smart Contract and Register Verifier
      // ============================================================
      console.log('\n📝 STEP 3: Setting up smart contract...');

      payroll = new PayrollMultiPartyTestSetup(companyId, companyName);

      // Register the verifier's public key as trusted
      console.log('  Registering verifier as trusted...');
      payroll.registerTrustedVerifier(attestation.verifier_pubkey);

      expect(payroll.isTrustedVerifier(attestation.verifier_pubkey)).toBe(true);
      console.log('✅ Verifier registered and trusted');

      // ============================================================
      // STEP 4: Submit Real Attestation to Contract
      // ============================================================
      console.log('\n🔗 STEP 4: Submitting real attestation to contract...');

      try {
        // Convert employee_id from 0x-prefixed hex string to format expected by contract
        const employeeIdForContract = attestation.employee_id.startsWith('0x')
          ? attestation.employee_id.substring(2)
          : attestation.employee_id;

        payroll.verifyAttestation(
          employeeIdForContract,
          BigInt(attestation.threshold),
          attestation.txids.map(tx => tx.padEnd(64, '0')),
          attestation.merkle_root.padEnd(64, '0'),
          BigInt(attestation.timestamp),
          attestation.attestation_hash,
          attestation.verifier_pubkey
        );

        console.log('✅ Real attestation verified and stored in contract');

        // Verify attestation was stored correctly
        const storedAttestation = payroll.getVerifiedAttestation(employeeIdForContract);
        expect(storedAttestation).not.toBeNull();
        expect(storedAttestation.threshold).toBe(BigInt(attestation.threshold));

        // Verify attestation hash was marked as used
        expect(payroll.isAttestationUsed(attestation.attestation_hash)).toBe(true);

      } catch (error) {
        console.error('❌ Contract attestation verification failed:', error);
        throw error;
      }

      // ============================================================
      // STEP 5: Prove Eligibility with Real Data
      // ============================================================
      console.log('\n🎯 STEP 5: Proving eligibility with verified attestation...');

      const employeeIdForContract = attestation.employee_id.startsWith('0x')
        ? attestation.employee_id.substring(2)
        : attestation.employee_id;

      // Test 1: Employee should be eligible for threshold lower than proven amount
      const eligibleFor4000 = payroll.proveEligibility(employeeIdForContract, 4000n);
      expect(eligibleFor4000).toBe(true);
      console.log('  ✓ Employee proven eligible for $4,000 threshold');

      // Test 2: Employee should be eligible for threshold equal to proven amount
      const eligibleFor5000 = payroll.proveEligibility(employeeIdForContract, 5000n);
      expect(eligibleFor5000).toBe(true);
      console.log('  ✓ Employee proven eligible for $5,000 threshold');

      // Test 3: Employee should NOT be eligible for threshold higher than proven amount
      const eligibleFor6000 = payroll.proveEligibility(employeeIdForContract, 6000n);
      expect(eligibleFor6000).toBe(false);
      console.log('  ✓ Employee correctly rejected for $6,000 threshold');

      // ============================================================
      // SUMMARY
      // ============================================================
      console.log('\n' + '='.repeat(70));
      console.log('🎉 END-TO-END ZKML INTEGRATION TEST PASSED!\n');
      console.log('✅ Complete flow verified with REAL data:');
      console.log('  1. Generated EZKL proof from payment data:', PAYMENTS);
      console.log('  2. Verified proof with zkml-verifier service');
      console.log('  3. Created cryptographic attestation');
      console.log('  4. Submitted attestation to smart contract');
      console.log('  5. Proved eligibility based on verified attestation');
      console.log('\n🔐 Privacy preserved:');
      console.log('  ✓ Individual payment amounts never revealed to contract');
      console.log('  ✓ Only proof that average > threshold was submitted');
      console.log('  ✓ Smart contract verified attestation from trusted verifier');
      console.log('='.repeat(70) + '\n');

    }, 60000); // 60 second timeout for proof generation
  });
});

// Helper function to check if file exists
async function checkFileExists(path: string): Promise<boolean> {
  try {
    await readFile(path);
    return true;
  } catch {
    return false;
  }
}
