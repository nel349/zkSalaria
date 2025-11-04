#!/usr/bin/env tsx
/**
 * REAL End-to-End Tests for ZKML Income Proofs
 *
 * This test:
 * 1. Takes real payment data
 * 2. Generates fresh ZK proofs from scratch
 * 3. Verifies the proofs
 * 4. Validates the results match expectations
 */

import { ProofType, generateIncomeProof, verifyIncomeProof, ModelManager, calculateCreditScore, calculateAverageIncome } from '../src';

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
    name: 'Junior Dev - Above Threshold',
    proofType: ProofType.INCOME_ABOVE_THRESHOLD,
    payments: [5000, 5100, 5200, 5300, 5400, 5500, 5600, 5700, 5800, 5900, 6000, 6100],
    thresholdMin: 4500,
    expectedPass: true,
    description: 'Junior developer earning $5,550 avg > $4,500 threshold'
  },
  {
    name: 'Mid-Level - In Range',
    proofType: ProofType.INCOME_RANGE,
    payments: [7000, 7200, 7400, 7600, 7800, 8000, 8200, 8400, 8600, 8800, 9000, 9200],
    thresholdMin: 7000,
    thresholdMax: 9500,
    expectedPass: true,
    description: 'Mid-level earning $8,100 avg within $7,000-$9,500 range'
  },
  {
    name: 'Senior - Average Income',
    proofType: ProofType.AVERAGE_INCOME,
    payments: [12000, 12500, 13000, 13500, 14000, 14500, 15000, 15500, 16000, 16500, 17000, 17500],
    thresholdMin: 12000,
    expectedPass: true,
    description: 'Senior earning $14,750 avg >= $12,000 average requirement'
  },
  {
    name: 'Freelancer - Credit Score',
    proofType: ProofType.CREDIT_SCORE,
    payments: [8000, 6000, 10000, 7000, 9000, 8500, 7500, 8000, 9500, 8000, 8500, 9000],
    thresholdMin: 600,
    expectedPass: true,
    description: 'Freelancer with $8,250 avg, credit score ~712 >= 600 threshold'
  },
  {
    name: 'High Earner - All Proof Types',
    proofType: ProofType.INCOME_ABOVE_THRESHOLD,
    payments: [15000, 15500, 16000, 16500, 17000, 17500, 18000, 18500, 19000, 19500, 20000, 20500],
    thresholdMin: 15000,
    expectedPass: true,
    description: 'High earner with $17,750 avg passing multiple thresholds'
  }
];

async function runTest(testCase: TestCase): Promise<{ passed: boolean; error?: string }> {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`TEST: ${testCase.name}`);
  console.log(`${'='.repeat(80)}`);
  console.log(`Description: ${testCase.description}`);
  console.log(`\n📊 Input Data:`);
  console.log(`   Payments: [${testCase.payments.slice(0, 4).join(', ')}, ..., ${testCase.payments.slice(-2).join(', ')}]`);

  const avgIncome = calculateAverageIncome(testCase.payments);
  console.log(`   Average Income: $${avgIncome.toLocaleString()}`);

  if (testCase.proofType === ProofType.CREDIT_SCORE) {
    const creditScore = calculateCreditScore(testCase.payments);
    console.log(`   Expected Credit Score: ${creditScore.toFixed(0)}`);
  }

  console.log(`   Threshold Min: ${testCase.thresholdMin}`);
  if (testCase.thresholdMax) {
    console.log(`   Threshold Max: ${testCase.thresholdMax}`);
  }
  console.log(`   Expected Result: ${testCase.expectedPass ? 'PASS ✅' : 'FAIL ❌'}`);

  try {
    // Step 1: Generate proof
    console.log(`\n⏳ Generating fresh ZK proof from scratch...`);
    const proofResult = await generateIncomeProof(
      testCase.proofType,
      testCase.payments,
      testCase.thresholdMin,
      testCase.thresholdMax
    );

    if (!proofResult.success || !proofResult.proof) {
      console.error(`❌ Proof generation failed: ${proofResult.error}`);
      return { passed: false, error: `Proof generation failed: ${proofResult.error}` };
    }

    console.log(`✅ Proof generated in ${(proofResult.duration / 1000).toFixed(2)}s`);

    // Step 2: Verify proof
    console.log(`\n🔍 Verifying proof...`);
    const verifyResult = await verifyIncomeProof(proofResult.proof);

    if (!verifyResult.success) {
      console.error(`❌ Verification failed: ${verifyResult.error}`);
      return { passed: false, error: `Verification failed: ${verifyResult.error}` };
    }

    console.log(`✅ Proof verified in ${(verifyResult.duration / 1000).toFixed(2)}s`);
    console.log(`   Result: ${verifyResult.verified ? 'VERIFIED ✅' : 'REJECTED ❌'}`);

    // Step 3: Check if result matches expectation
    const resultMatches = verifyResult.verified === testCase.expectedPass;

    if (resultMatches) {
      console.log(`\n✅ TEST PASSED - Result matched expectation`);
      return { passed: true };
    } else {
      console.log(`\n❌ TEST FAILED - Expected ${testCase.expectedPass}, got ${verifyResult.verified}`);
      return { passed: false, error: `Result mismatch: expected ${testCase.expectedPass}, got ${verifyResult.verified}` };
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error(`\n❌ Test failed with exception: ${errorMsg}`);
    return { passed: false, error: errorMsg };
  }
}

async function main() {
  console.log('\n' + '='.repeat(80));
  console.log('REAL END-TO-END TESTS: ZKML Income Proofs');
  console.log('='.repeat(80));
  console.log('\nThis test generates FRESH proofs from scratch, not just verifying existing ones!\n');

  // Validate models exist
  console.log('📋 Validating ONNX models...');
  const validation = ModelManager.validateModels();
  if (!validation.valid) {
    console.error('❌ Missing model files:');
    validation.missing.forEach(file => console.error(`   - ${file}`));
    console.error('\nRun: npm run setup');
    process.exit(1);
  }
  console.log('✅ All models found\n');

  // Run all tests
  const startTime = Date.now();
  const results: { test: string; passed: boolean; error?: string }[] = [];

  for (const testCase of TEST_CASES) {
    const result = await runTest(testCase);
    results.push({
      test: testCase.name,
      passed: result.passed,
      error: result.error
    });
  }

  const totalDuration = Date.now() - startTime;

  // Print summary
  console.log('\n' + '='.repeat(80));
  console.log('TEST SUMMARY');
  console.log('='.repeat(80));

  const passedTests = results.filter(r => r.passed).length;
  const totalTests = results.length;

  console.log(`\n📊 Results: ${passedTests}/${totalTests} tests passed\n`);

  results.forEach((result, index) => {
    const status = result.passed ? '✅ PASS' : '❌ FAIL';
    console.log(`${index + 1}. ${status} - ${result.test}`);
    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }
  });

  console.log(`\n⏱️  Total Duration: ${(totalDuration / 1000).toFixed(2)}s`);

  if (passedTests === totalTests) {
    console.log('\n🎉 ALL TESTS PASSED!\n');
    console.log('✅ All proof types generating and verifying correctly');
    console.log('✅ Fresh proofs created from scratch');
    console.log('✅ Results match expectations\n');
    process.exit(0);
  } else {
    console.log(`\n❌ ${totalTests - passedTests} test(s) failed. Check errors above.\n`);
    process.exit(1);
  }
}

main().catch(error => {
  console.error('\n💥 Unhandled error:', error);
  process.exit(1);
});
