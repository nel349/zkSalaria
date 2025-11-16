import { describe, test, expect, beforeAll } from 'vitest';
import pino from 'pino';
import path from 'node:path';
import fs from 'node:fs';
import { currentDir } from './config.js';

/**
 * E2E Tests for ZKML Proof Generation via Verifier Service
 *
 * Tests the /api/zkml/generate-proof endpoint which:
 * 1. Generates real ZKML proofs using EZKL
 * 2. Creates attestations for the proofs
 * 3. Supports all 4 proof types
 */

// Verifier service configuration
const VERIFIER_SERVICE_URL = 'http://localhost:3002';

// Type definitions for API responses
interface GenerateProofResponse {
  success: boolean;
  proof_json?: string;
  attestation?: {
    employee_id: string;
    threshold: number | string;
    timestamp: number;
    attestation_hash: string;
    verifier_pubkey: string;
  };
  error?: string;
  message?: string;
  duration?: number;
}

interface HealthResponse {
  status: string;
  service: string;
  timestamp: number;
  verifier_pubkey: string;
  ezkl_available: boolean;
}

interface TestCase {
  name: string;
  proof_type: number;
  payments: number[];
  threshold_min: number;
  threshold_max?: number;
  expectedSuccess: boolean;
  skip?: boolean;
  skipReason?: string;
}

// NORMALIZATION: All models use input_scale: 14 requiring division by 10000
// The verifier service API expects NORMALIZED values ($5000 → 0.5)
const NORMALIZATION_FACTOR = 10000;

const TEST_CASES: TestCase[] = [
  {
    name: 'Type 1: INCOME_ABOVE_THRESHOLD',
    proof_type: 1,
    payments: [5000, 5100, 5200, 5300, 5400, 5500].map(p => p / NORMALIZATION_FACTOR),
    threshold_min: 4500 / NORMALIZATION_FACTOR,
    expectedSuccess: true
  },
  {
    name: 'Type 2: INCOME_RANGE',
    proof_type: 2,
    payments: [7000, 7200, 7400, 7600, 7800, 8000].map(p => p / NORMALIZATION_FACTOR),
    threshold_min: 40000 / NORMALIZATION_FACTOR,  // 6-month minimum: 40K
    threshold_max: 50000 / NORMALIZATION_FACTOR,  // 6-month maximum: 50K (sum is 45K)
    expectedSuccess: true
  },
  {
    name: 'Type 3: AVERAGE_INCOME',
    proof_type: 3,
    payments: [12000, 12500, 13000, 13500, 14000, 14500].map(p => p / NORMALIZATION_FACTOR),
    threshold_min: 12000 / NORMALIZATION_FACTOR,
    expectedSuccess: true,
    skip: false  // Re-enabled: Fixed overflow by using input_scale:14 with normalization
  },
  {
    name: 'Type 4: FIRST_TIME_LOAN_ELIGIBILITY',
    proof_type: 4,
    payments: [8000, 8200, 8100, 8300, 8400, 8500].map(p => p / NORMALIZATION_FACTOR),
    threshold_min: 0.25,  // 25% range threshold (already a ratio, no normalization needed)
    expectedSuccess: true
  }
];

describe('ZKML Proof Generation E2E Tests', () => {
  const logFile = path.resolve(currentDir, '..', 'logs', 'tests', `zkml-proof-generation-${new Date().toISOString()}.log`);
  fs.mkdirSync(path.dirname(logFile), { recursive: true });
  const logger = pino(
    { level: process.env.LOG_LEVEL ?? 'info' },
    pino.destination({ dest: logFile, sync: true }),
  );

  beforeAll(async () => {
    logger.info('Checking if ZKML verifier service is running...');
    try {
      const healthCheck = await fetch(`${VERIFIER_SERVICE_URL}/health`);
      if (!healthCheck.ok) {
        throw new Error('Service not healthy');
      }
      const health = await healthCheck.json() as HealthResponse;
      logger.info(`✅ ZKML verifier service is running: ${health.service}`);
    } catch (error) {
      logger.error(`❌ ZKML verifier service is not running at ${VERIFIER_SERVICE_URL}`);
      logger.error('   Please start it with: cd zkml-verifier && npm run dev');
      throw new Error(`ZKML verifier service is not available: ${error}`);
    }
  });

  test('should generate proof for Type 1: INCOME_ABOVE_THRESHOLD', async () => {
    const testCase = TEST_CASES[0];
    logger.info(`Testing ${testCase.name}...`);

    const request = {
      proof_type: testCase.proof_type,
      payments: testCase.payments,
      threshold_min: testCase.threshold_min,
      threshold_max: testCase.threshold_max,
      employee_id: `0xTEST_EMPLOYEE_${testCase.proof_type}`,
      txids: testCase.payments.map((_, i) => `0xTX${String(i).padStart(3, '0')}`),
      history_commitment: `0xTEST_HISTORY_COMMITMENT_${testCase.proof_type}`
    };

    const startTime = Date.now();
    const response = await fetch(`${VERIFIER_SERVICE_URL}/api/zkml/generate-proof`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request)
    });

    expect(response.ok).toBe(true);

    const result = await response.json() as GenerateProofResponse;
    const duration = Date.now() - startTime;

    logger.info(`  Proof generated in ${(duration / 1000).toFixed(2)}s`);

    // Validate response structure
    expect(result.success).toBe(true);
    expect(result.attestation).toBeDefined();
    expect(result.proof_json).toBeDefined();

    // Validate attestation
    expect(result.attestation!.employee_id).toBe(request.employee_id);
    expect(Number(result.attestation!.threshold)).toBe(testCase.threshold_min);
    expect(result.attestation!.timestamp).toBeDefined();
    expect(result.attestation!.attestation_hash).toBeDefined();
    expect(result.attestation!.verifier_pubkey).toBeDefined();

    // Validate proof_json is non-empty
    expect(result.proof_json!.length).toBeGreaterThan(1000); // ZKML proofs are large

    logger.info(`  ✅ ${testCase.name} proof validated`);
    logger.info(`     Attestation Hash: ${result.attestation!.attestation_hash.substring(0, 16)}...`);
    logger.info(`     Proof Size: ${(result.proof_json!.length / 1024).toFixed(1)} KB`);
  }, 30_000); // 30s timeout for proof generation

  test('should generate proof for Type 2: INCOME_RANGE', async () => {
    const testCase = TEST_CASES[1];
    logger.info(`Testing ${testCase.name}...`);

    const request = {
      proof_type: testCase.proof_type,
      payments: testCase.payments,
      threshold_min: testCase.threshold_min,
      threshold_max: testCase.threshold_max,
      employee_id: `0xTEST_EMPLOYEE_${testCase.proof_type}`,
      txids: testCase.payments.map((_, i) => `0xTX${String(i).padStart(3, '0')}`),
      history_commitment: `0xTEST_HISTORY_COMMITMENT_${testCase.proof_type}`
    };

    const response = await fetch(`${VERIFIER_SERVICE_URL}/api/zkml/generate-proof`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request)
    });

    expect(response.ok).toBe(true);

    const result = await response.json() as GenerateProofResponse;

    expect(result.success).toBe(true);
    expect(result.attestation).toBeDefined();
    expect(result.proof_json).toBeDefined();
    expect(result.attestation!.employee_id).toBe(request.employee_id);
    expect(Number(result.attestation!.threshold)).toBe(testCase.threshold_min);

    logger.info(`  ✅ ${testCase.name} proof validated`);
  }, 30_000);

  test('should generate proof for Type 3: AVERAGE_INCOME', async () => {
    const testCase = TEST_CASES[2];
    logger.info(`Testing ${testCase.name}...`);

    const request = {
      proof_type: testCase.proof_type,
      payments: testCase.payments,
      threshold_min: testCase.threshold_min,
      threshold_max: testCase.threshold_max,
      employee_id: `0xTEST_EMPLOYEE_${testCase.proof_type}`,
      txids: testCase.payments.map((_, i) => `0xTX${String(i).padStart(3, '0')}`),
      history_commitment: `0xTEST_HISTORY_COMMITMENT_${testCase.proof_type}`
    };

    const response = await fetch(`${VERIFIER_SERVICE_URL}/api/zkml/generate-proof`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request)
    });

    expect(response.ok).toBe(true);

    const result = await response.json() as GenerateProofResponse;

    expect(result.success).toBe(true);
    expect(result.attestation).toBeDefined();
    expect(result.proof_json).toBeDefined();
    expect(result.attestation!.employee_id).toBe(request.employee_id);
    expect(Number(result.attestation!.threshold)).toBe(testCase.threshold_min);

    logger.info(`  ✅ ${testCase.name} proof validated`);
  }, 30_000);

  test('should generate proof for Type 4: FIRST_TIME_LOAN_ELIGIBILITY', async () => {
    const testCase = TEST_CASES[3];
    logger.info(`Testing ${testCase.name}...`);

    const request = {
      proof_type: testCase.proof_type,
      payments: testCase.payments,
      threshold_min: testCase.threshold_min,
      threshold_max: testCase.threshold_max,
      employee_id: `0xTEST_EMPLOYEE_${testCase.proof_type}`,
      txids: testCase.payments.map((_, i) => `0xTX${String(i).padStart(3, '0')}`),
      history_commitment: `0xTEST_HISTORY_COMMITMENT_${testCase.proof_type}`
    };

    const response = await fetch(`${VERIFIER_SERVICE_URL}/api/zkml/generate-proof`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request)
    });

    expect(response.ok).toBe(true);

    const result = await response.json() as GenerateProofResponse;

    expect(result.success).toBe(true);
    expect(result.attestation).toBeDefined();
    expect(result.proof_json).toBeDefined();
    expect(result.attestation!.employee_id).toBe(request.employee_id);
    expect(Number(result.attestation!.threshold)).toBe(testCase.threshold_min);

    logger.info(`  ✅ ${testCase.name} proof validated`);
  }, 30_000);

  test('should reject request with invalid payment count', async () => {
    logger.info('Testing rejection with invalid payment count...');

    const request = {
      proof_type: 1,
      payments: [5000, 5100, 5200], // Only 3 payments instead of 6
      threshold_min: 4500,
      employee_id: '0xTEST_INVALID',
      txids: ['0xTX001', '0xTX002', '0xTX003'],
      history_commitment: '0xTEST_INVALID_COMMITMENT'
    };

    const response = await fetch(`${VERIFIER_SERVICE_URL}/api/zkml/generate-proof`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request)
    });

    expect(response.ok).toBe(false);
    expect(response.status).toBe(400);

    const result = await response.json() as GenerateProofResponse;
    expect(result.success).toBe(false);
    expect(result.error).toBe('Bad Request');
    expect(result.message).toContain('6');

    logger.info('  ✅ Invalid payment count properly rejected');
  });

  test('should reject request with missing fields', async () => {
    logger.info('Testing rejection with missing fields...');

    const request = {
      proof_type: 1,
      payments: [5000, 5100, 5200, 5300, 5400, 5500],
      // Missing threshold_min, employee_id, txids, history_commitment
    };

    const response = await fetch(`${VERIFIER_SERVICE_URL}/api/zkml/generate-proof`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request)
    });

    expect(response.ok).toBe(false);
    expect(response.status).toBe(400);

    const result = await response.json() as GenerateProofResponse;
    expect(result.success).toBe(false);
    expect(result.error).toBe('Bad Request');

    logger.info('  ✅ Missing fields properly rejected');
  });

  test('should validate all proof types sequentially with delay', async () => {
    // Filter out skipped test cases
    const activeTestCases = TEST_CASES.filter(tc => !tc.skip);
    logger.info(`Running ${activeTestCases.length} proof types sequentially (${TEST_CASES.length - activeTestCases.length} skipped)...`);

    const results: { type: string; passed: boolean; duration: number }[] = [];

    for (const testCase of activeTestCases) {
      const request = {
        proof_type: testCase.proof_type,
        payments: testCase.payments,
        threshold_min: testCase.threshold_min,
        threshold_max: testCase.threshold_max,
        employee_id: `0xSEQ_TEST_${testCase.proof_type}`,
        txids: testCase.payments.map((_, i) => `0xTX${String(i).padStart(3, '0')}`),
        history_commitment: `0xSEQ_COMMITMENT_${testCase.proof_type}`
      };

      const startTime = Date.now();
      try {
        const response = await fetch(`${VERIFIER_SERVICE_URL}/api/zkml/generate-proof`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(request)
        });

        const result = await response.json() as GenerateProofResponse;
        const duration = Date.now() - startTime;

        if (result.success && result.attestation && result.proof_json) {
          results.push({ type: testCase.name, passed: true, duration });
          logger.info(`  ✅ ${testCase.name}: ${(duration / 1000).toFixed(2)}s`);
        } else {
          results.push({ type: testCase.name, passed: false, duration });
          logger.error(`  ❌ ${testCase.name}: Failed`);
        }
      } catch (error) {
        const duration = Date.now() - startTime;
        results.push({ type: testCase.name, passed: false, duration });
        logger.error(`  ❌ ${testCase.name}: Error - ${error}`);
      }

      // Delay between tests to avoid overwhelming the service
      if (testCase !== activeTestCases[activeTestCases.length - 1]) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    // Validate all tests passed
    const passedCount = results.filter(r => r.passed).length;
    expect(passedCount).toBe(activeTestCases.length);

    logger.info(`✅ All ${activeTestCases.length} proof types validated successfully`);
    logger.info(`   Total duration: ${(results.reduce((sum, r) => sum + r.duration, 0) / 1000).toFixed(2)}s`);
  }, 120_000); // 2 minutes for all 4 proof types

  /**
   * E2E Test: Tax Bracket Proof (Type 5)
   * Minimal test covering both success and failure cases
   */
  test('should generate Tax Bracket proof (Type 5) - 12% bracket and validate rejection for out-of-bracket income', async () => {
    logger.info('\n🏛️  Tax Bracket Proof E2E Test (Type 5)');
    logger.info('========================================\n');

    // Test Case 1: Valid 12% bracket ($11,601 - $47,150)
    // 6 months × $2,900/month = $17,400 → annualized = $34,800 (falls in 12% bracket)
    const paymentsRaw = [2900, 2900, 2900, 2900, 2900, 2900];
    const thresholdMinRaw = 11601;  // 12% bracket min (ANNUAL)
    const thresholdMaxRaw = 47150;  // 12% bracket max (ANNUAL)

    const validCase = {
      name: '12% Tax Bracket ($34,800/year)',
      proof_type: 5,
      payments: paymentsRaw.map(p => p / NORMALIZATION_FACTOR),  // NORMALIZE payments
      threshold_min: thresholdMinRaw / NORMALIZATION_FACTOR,      // NORMALIZE thresholds
      threshold_max: thresholdMaxRaw / NORMALIZATION_FACTOR,
      expectedSuccess: true,
    };

    logger.info(`Test 1: ${validCase.name}`);
    logger.info(`  Income: 6mo × $${paymentsRaw[0]} = $${paymentsRaw.reduce((a, b) => a + b, 0)}`);
    logger.info(`  Annualized: $${paymentsRaw.reduce((a, b) => a + b, 0) * 2}`);
    logger.info(`  Bracket: $${thresholdMinRaw.toLocaleString()} - $${thresholdMaxRaw.toLocaleString()}`);

    const response1 = await fetch(`${VERIFIER_SERVICE_URL}/api/zkml/generate-proof`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        proof_type: validCase.proof_type,
        payments: validCase.payments,  // Normalized
        threshold_min: validCase.threshold_min,  // Normalized
        threshold_max: validCase.threshold_max,  // Normalized
        employee_id: 'TAX_BRACKET_TEST_001',
        txids: Array(12).fill('0x0000000000000000000000000000000000000000000000000000000000000001'),
        history_commitment: '0x' + '1'.repeat(64),
        contract_address: 'ct1test' + '0'.repeat(56),
      }),
    });

    const result1: GenerateProofResponse = await response1.json() as GenerateProofResponse;

    logger.info(`  Result: ${result1.success ? '✅ PASS' : '❌ FAIL'}`);
    if (!result1.success) {
      logger.error(`  Error: ${result1.error || result1.message}`);
    }
    expect(result1.success).toBe(true);
    expect(result1.proof_json).toBeTruthy();
    expect(result1.attestation).toBeTruthy();
    expect(result1.attestation?.threshold).toBe('11601'); // Min threshold (denormalized)
    logger.info(`  Proof generated in ${(result1.duration! / 1000).toFixed(2)}s\n`);

    // Test Case 2: Invalid - Income too low for 22% bracket
    // Same income ($34,800) but trying to prove 22% bracket ($47,151 - $100,525)
    const invalidMinRaw = 47151;
    const invalidMaxRaw = 100525;

    const invalidCase = {
      name: '22% Tax Bracket (income too low)',
      proof_type: 5,
      payments: paymentsRaw.map(p => p / NORMALIZATION_FACTOR),  // NORMALIZE payments
      threshold_min: invalidMinRaw / NORMALIZATION_FACTOR,        // NORMALIZE thresholds
      threshold_max: invalidMaxRaw / NORMALIZATION_FACTOR,
      expectedSuccess: false,
    };

    logger.info(`Test 2: ${invalidCase.name}`);
    logger.info(`  Income: $${paymentsRaw.reduce((a, b) => a + b, 0) * 2} (annualized)`);
    logger.info(`  Bracket: $${invalidMinRaw.toLocaleString()} - $${invalidMaxRaw.toLocaleString()}`);
    logger.info(`  Expected: FAIL (income $34,800 < bracket min $47,151)`);

    const response2 = await fetch(`${VERIFIER_SERVICE_URL}/api/zkml/generate-proof`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        proof_type: invalidCase.proof_type,
        payments: invalidCase.payments,  // Normalized
        threshold_min: invalidCase.threshold_min,  // Normalized
        threshold_max: invalidCase.threshold_max,  // Normalized
        employee_id: 'TAX_BRACKET_TEST_002',
        txids: Array(12).fill('0x0000000000000000000000000000000000000000000000000000000000000002'),
        history_commitment: '0x' + '2'.repeat(64),
        contract_address: 'ct1test' + '0'.repeat(56),
      }),
    });

    const result2: GenerateProofResponse = await response2.json() as GenerateProofResponse;

    logger.info(`  Result: ${!result2.success ? '✅ PASS (correctly rejected)' : '❌ FAIL (should have been rejected)'}`);
    expect(result2.success).toBe(false);
    expect(result2.error || result2.message).toBeTruthy();
    logger.info(`  ${result2.error || result2.message}\n`);

    logger.info('✅ Tax Bracket E2E Test Complete');
    logger.info('   - Valid 12% bracket: PASS');
    logger.info('   - Out-of-bracket rejection: PASS');
  }, 120_000); // 2 minutes timeout
});
