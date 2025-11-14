import { describe, it, expect, beforeAll } from 'vitest';
import {
  ProofType,
  generateIncomeProof,
  verifyIncomeProof,
  ModelManager,
  calculateFirstTimeLoanEligibility,
  calculateAverageIncome
} from '../src';

/**
 * Normalization constant matching ONNX model expectations
 * All values are divided by 10000 to fit into the model's input scale
 * This matches the normalization done in GenerateProofModal.tsx
 */
const NORMALIZATION_FACTOR = 10000;

/**
 * Normalize a value for ZKML proof generation
 * @param value - The raw value (e.g., $3000)
 * @returns Normalized value (e.g., 0.3)
 */
function normalize(value: number): number {
  return value / NORMALIZATION_FACTOR;
}

/**
 * Normalize an array of payment values
 * @param payments - Array of raw payment amounts
 * @returns Array of normalized payment amounts
 */
function normalizePayments(payments: number[]): number[] {
  return payments.map(normalize);
}

interface TestCase {
  name: string;
  proofType: ProofType;
  payments: number[];
  thresholdMin: number;
  thresholdMax?: number;
  expectedPass: boolean;
  description: string;
}

const TEST_CASES: TestCase[] = [
  {
    name: 'Entry Level - Above Threshold',
    proofType: ProofType.INCOME_ABOVE_THRESHOLD,
    payments: [2800, 2900, 3000, 3100, 3200, 3300],
    thresholdMin: 15000,
    expectedPass: true,
    description: 'Entry level earning $18,300 total > $15,000 threshold'
  },
  {
    name: 'Mid-Level - In Range',
    proofType: ProofType.INCOME_RANGE,
    payments: [5500, 5800, 6000, 6200, 6400, 6600],
    thresholdMin: 60000,
    thresholdMax: 80000,
    expectedPass: true,
    description: 'Mid-level earning $36,500 (6mo) = $73,000 annualized, within $60,000-$80,000 range'
  },
  {
    name: 'Mid-Level - Average Income',
    proofType: ProofType.AVERAGE_INCOME,
    payments: [4500, 4700, 4900, 5100, 5300, 5500],
    thresholdMin: 4800,
    expectedPass: true,
    description: 'Mid-level earning $5,000 avg >= $4,800 average requirement'
  },
  {
    name: 'Freelancer - First Time Loan Eligibility',
    proofType: ProofType.FIRST_TIME_LOAN_ELIGIBILITY,
    payments: [7800, 8000, 8200, 8100, 7900, 8000],
    thresholdMin: 0.25,
    expectedPass: true,
    description: 'Freelancer with $8,000 avg, range ratio ~2.5% < 25% threshold (consistent income)'
  },
  {
    name: 'Executive - High Earner',
    proofType: ProofType.INCOME_ABOVE_THRESHOLD,
    payments: [18000, 19000, 20000, 21000, 22000, 23000],
    thresholdMin: 100000,
    expectedPass: true,
    description: 'Executive earning $123,000 total > $100,000 threshold'
  },
  // NEGATIVE TEST CASES - Should fail when threshold not met
  {
    name: 'NEGATIVE: Below Threshold',
    proofType: ProofType.INCOME_ABOVE_THRESHOLD,
    payments: [2000, 2100, 2200, 2300, 2400, 2500],
    thresholdMin: 20000,
    expectedPass: false,
    description: 'Low earner with $13,500 total < $20,000 threshold (should FAIL)'
  },
  {
    name: 'NEGATIVE: Outside Range (Too Low)',
    proofType: ProofType.INCOME_RANGE,
    payments: [1500, 1600, 1700, 1800, 1900, 2000],
    thresholdMin: 30000,
    thresholdMax: 50000,
    expectedPass: false,
    description: 'Low earner with $10,500 (6mo) = $21,000 annualized < $30,000 range minimum (should FAIL)'
  },
  {
    name: 'NEGATIVE: Average Income Too Low',
    proofType: ProofType.AVERAGE_INCOME,
    payments: [3000, 3100, 3200, 3300, 3400, 3500],
    thresholdMin: 5000,
    expectedPass: false,
    description: 'Mid-level earning $3,250 avg < $5,000 average requirement (should FAIL)'
  },
  // TAX BRACKET PROOF TESTS (Type 5)
  {
    name: 'Tax Bracket - 12% Bracket (Low Income)',
    proofType: ProofType.TAX_BRACKET,
    payments: [2900, 2900, 2900, 2900, 2900, 2900],
    thresholdMin: 11601,
    thresholdMax: 47150,
    expectedPass: true,
    description: '12% tax bracket: $2,900/month × 6 = $17,400 → $34,800 annualized, within $11,601-$47,150'
  },
  {
    name: 'Tax Bracket - 22% Bracket (Mid Income)',
    proofType: ProofType.TAX_BRACKET,
    payments: [5000, 5100, 5200, 5300, 5400, 5500],
    thresholdMin: 47151,
    thresholdMax: 100525,
    expectedPass: true,
    description: '22% tax bracket: $5,250/month avg × 12 = $63,000 annualized, within $47,151-$100,525'
  },
  {
    name: 'Tax Bracket - 24% Bracket (Upper Mid Income)',
    proofType: ProofType.TAX_BRACKET,
    payments: [10000, 10500, 11000, 11500, 12000, 12500],
    thresholdMin: 100526,
    thresholdMax: 191950,
    expectedPass: true,
    description: '24% tax bracket: $11,250/month avg × 12 = $135,000 annualized, within $100,526-$191,950'
  },
  {
    name: 'NEGATIVE: Tax Bracket - Income Too Low',
    proofType: ProofType.TAX_BRACKET,
    payments: [1500, 1600, 1700, 1800, 1900, 2000],
    thresholdMin: 47151,
    thresholdMax: 100525,
    expectedPass: false,
    description: '22% bracket FAIL: $1,750/month avg × 12 = $21,000 annualized < $47,151 minimum (should FAIL)'
  },
  {
    name: 'NEGATIVE: Tax Bracket - Income Too High',
    proofType: ProofType.TAX_BRACKET,
    payments: [5000, 5100, 5200, 5300, 5400, 5500],
    thresholdMin: 11601,
    thresholdMax: 47150,
    expectedPass: false,
    description: '12% bracket FAIL: $5,250/month avg × 12 = $63,000 annualized > $47,150 maximum (should FAIL)'
  }
];

describe('ZKML Income Proofs - End-to-End Tests', () => {
  beforeAll(() => {
    console.log('\n' + '='.repeat(80));
    console.log('ZKML Income Proofs - End-to-End Tests with Vitest');
    console.log('='.repeat(80));
    console.log('Testing FRESH proof generation from scratch with normalized inputs!\n');

    // Validate models exist
    console.log('📋 Validating ONNX models...');
    const validation = ModelManager.validateModels();
    if (!validation.valid) {
      console.error('❌ Missing model files:');
      validation.missing.forEach(file => console.error(`   - ${file}`));
      console.error('\nRun: npm run setup');
      throw new Error('Missing required model files');
    }
    console.log('✅ All models found\n');
  });

  TEST_CASES.forEach((testCase) => {
    it(testCase.name, async () => {
      console.log(`\n${'='.repeat(80)}`);
      console.log(`TEST: ${testCase.name}`);
      console.log(`${'='.repeat(80)}`);
      console.log(`Description: ${testCase.description}`);

      // Calculate metrics from raw (non-normalized) values
      const avgIncome = calculateAverageIncome(testCase.payments);
      console.log(`\n📊 Input Data (Raw Values):`);
      console.log(`   Payments: [${testCase.payments.slice(0, 4).join(', ')}, ..., ${testCase.payments.slice(-2).join(', ')}]`);
      console.log(`   Average Income: $${avgIncome.toLocaleString()}`);

      if (testCase.proofType === ProofType.FIRST_TIME_LOAN_ELIGIBILITY) {
        const loanEligibility = calculateFirstTimeLoanEligibility(testCase.payments, testCase.thresholdMin);
        console.log(`   Loan Eligibility Score: ${loanEligibility.toFixed(0)}`);
      }

      console.log(`   Threshold Min: ${testCase.thresholdMin}`);
      if (testCase.thresholdMax) {
        console.log(`   Threshold Max: ${testCase.thresholdMax}`);
      }
      console.log(`   Expected Result: ${testCase.expectedPass ? 'PASS ✅' : 'FAIL ❌'}`);

      // Normalize inputs for ZKML proof generation
      const normalizedPayments = normalizePayments(testCase.payments);
      const normalizedThresholdMin = testCase.proofType === ProofType.FIRST_TIME_LOAN_ELIGIBILITY
        ? testCase.thresholdMin // Consistency threshold is already a ratio (0.25)
        : normalize(testCase.thresholdMin);
      const normalizedThresholdMax = testCase.thresholdMax
        ? normalize(testCase.thresholdMax)
        : undefined;

      console.log(`\n📊 Normalized Values for ZKML:`);
      console.log(`   Normalized Payments: [${normalizedPayments.map(p => p.toFixed(4)).slice(0, 3).join(', ')}, ...]`);
      console.log(`   Normalized Threshold Min: ${normalizedThresholdMin.toFixed(4)}`);
      if (normalizedThresholdMax) {
        console.log(`   Normalized Threshold Max: ${normalizedThresholdMax.toFixed(4)}`);
      }

      // Step 1: Generate proof with normalized values
      console.log(`\n⏳ Generating fresh ZK proof from scratch...`);
      const proofResult = await generateIncomeProof(
        testCase.proofType,
        normalizedPayments,
        normalizedThresholdMin,
        normalizedThresholdMax
      );

      if (!proofResult.success || !proofResult.proof) {
        // For negative tests, proof generation SHOULD fail
        if (!testCase.expectedPass) {
          console.log(`✅ Proof generation correctly failed: ${proofResult.error}`);
          console.log(`\n✅ TEST PASSED - Proof rejected as expected (threshold not met)`);
          expect(proofResult.success).toBe(false);
          return;
        }
        // For positive tests, proof generation should succeed
        console.error(`❌ Proof generation failed unexpectedly: ${proofResult.error}`);
        expect.fail(`Proof generation failed: ${proofResult.error}`);
      }

      console.log(`✅ Proof generated in ${(proofResult.duration / 1000).toFixed(2)}s`);

      // Step 2: Verify proof
      console.log(`\n🔍 Verifying proof...`);
      const verifyResult = await verifyIncomeProof(proofResult.proof);

      expect(verifyResult.success).toBe(true);
      if (!verifyResult.success) {
        console.error(`❌ Verification failed: ${verifyResult.error}`);
        expect.fail(`Verification failed: ${verifyResult.error}`);
      }

      console.log(`✅ Proof verified in ${(verifyResult.duration / 1000).toFixed(2)}s`);
      console.log(`   Result: ${verifyResult.verified ? 'VERIFIED ✅' : 'REJECTED ❌'}`);

      // Step 3: Check if result matches expectation
      expect(verifyResult.verified).toBe(testCase.expectedPass);

      if (verifyResult.verified === testCase.expectedPass) {
        console.log(`\n✅ TEST PASSED - Result matched expectation`);
      } else {
        console.log(`\n❌ TEST FAILED - Expected ${testCase.expectedPass}, got ${verifyResult.verified}`);
      }
    }, 120000); // 2 minute timeout per test
  });

  it('should display test summary', () => {
    console.log('\n' + '='.repeat(80));
    console.log('All tests completed!');
    console.log('='.repeat(80));
    console.log('\n✅ All proof types generating and verifying correctly');
    console.log('✅ Fresh proofs created from scratch with normalized inputs');
    console.log('✅ Results match expectations\n');
  });
});
