/**
 * Payroll Proof Generator
 *
 * Generates a ZK proof that an employee's average salary meets a threshold
 * without revealing individual payment amounts.
 *
 * Sample Data (Phase 1): Uses hardcoded payment data for testing
 * Future (Phase 2): Will fetch real payment history from blockchain
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { readFile } from 'fs/promises';

const execAsync = promisify(exec);

const EZKL_PATH = '/Users/norman/.ezkl/ezkl';
const MODEL_PATH = 'payroll-model.onnx';
const INPUT_PATH = 'payroll-input.json';
const SETTINGS_PATH = 'settings.json';
const COMPILED_MODEL_PATH = 'payroll-model.compiled';
const PK_PATH = 'pk.key';
const VK_PATH = 'vk.key';
const WITNESS_PATH = 'witness.json';
const PROOF_PATH = 'proof.json';

// Sample payroll metadata (Phase 1 - hardcoded)
const SAMPLE_EMPLOYEE_ID = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1';
const SAMPLE_THRESHOLD = 5000;
const SAMPLE_TXIDS = [
  '0xTX001_2024_01',
  '0xTX002_2024_02',
  '0xTX003_2024_03',
  '0xTX004_2024_04'
];
const SAMPLE_MERKLE_ROOT = '0xMERKLE_ROOT_PAYMENT_HISTORY_Q1_2024';

interface StepResult {
  step: string;
  success: boolean;
  output?: string;
  error?: string;
  duration: number;
}

async function runCommand(description: string, command: string): Promise<StepResult> {
  const startTime = Date.now();
  console.log(`\n${'='.repeat(60)}`);
  console.log(`📋 ${description}`);
  console.log(`${'='.repeat(60)}`);
  console.log(`Command: ${command}\n`);

  try {
    const { stdout, stderr } = await execAsync(command, {
      timeout: 300000, // 5 minutes
      maxBuffer: 10 * 1024 * 1024 // 10MB
    });

    const duration = Date.now() - startTime;

    if (stderr && !stderr.includes('[I]')) {
      console.log('⚠️  stderr:', stderr);
    }

    console.log('✅ Success!');
    console.log(`⏱️  Duration: ${(duration / 1000).toFixed(2)}s`);

    return {
      step: description,
      success: true,
      output: stdout,
      duration
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : String(error);

    console.error('❌ Failed!');
    console.error('Error:', errorMessage);
    console.log(`⏱️  Duration: ${(duration / 1000).toFixed(2)}s`);

    return {
      step: description,
      success: false,
      error: errorMessage,
      duration
    };
  }
}

async function main() {
  console.log('\n🏦 zkSalaria Payroll Proof Generator');
  console.log('='.repeat(60));
  console.log('\n💼 Employee Information (Sample Data - Phase 1):');
  console.log(`   Employee ID: ${SAMPLE_EMPLOYEE_ID}`);
  console.log(`   Threshold: $${SAMPLE_THRESHOLD}`);
  console.log(`   Payment Count: ${SAMPLE_TXIDS.length}`);
  console.log(`   Merkle Root: ${SAMPLE_MERKLE_ROOT}`);

  // Read input data to show what we're proving
  try {
    const inputData = await readFile(INPUT_PATH, 'utf-8');
    const input = JSON.parse(inputData);

    // Input format: [payment1], [payment2], [payment3], [threshold]
    const payment1 = input.input_data[0][0];
    const payment2 = input.input_data[1][0];
    const payment3 = input.input_data[2][0];
    const threshold = input.input_data[3][0];

    const payments = [payment1, payment2, payment3];
    const total = payment1 + payment2 + payment3;
    const average = total / 3;

    console.log(`\n💰 Payment History (PRIVATE - stays local):`);
    payments.forEach((amount: number, i: number) => {
      console.log(`   Payment ${i + 1}: $${amount.toLocaleString()}`);
    });
    console.log(`   Total: $${total.toLocaleString()}`);
    console.log(`   Average: $${average.toLocaleString()}`);
    console.log(`   Threshold: $${threshold.toLocaleString()}`);
    console.log(`   Proving: Average ($${average.toLocaleString()}) > Threshold ($${threshold.toLocaleString()}) ${average > threshold ? '✅' : '❌'}`);
  } catch (e) {
    console.log(`\n⚠️  Could not read input data for preview`);
  }

  const results: StepResult[] = [];
  const totalStartTime = Date.now();

  // Step 1: Generate settings
  results.push(await runCommand(
    'Step 1: Generate Settings',
    `${EZKL_PATH} gen-settings -M ${MODEL_PATH} --settings-path ${SETTINGS_PATH}`
  ));
  if (!results[results.length - 1].success) {
    console.error('\n❌ Failed at Step 1. Aborting.');
    process.exit(1);
  }

  // Step 2: Calibrate settings
  results.push(await runCommand(
    'Step 2: Calibrate Settings',
    `${EZKL_PATH} calibrate-settings -M ${MODEL_PATH} -D ${INPUT_PATH} --settings-path ${SETTINGS_PATH}`
  ));
  if (!results[results.length - 1].success) {
    console.error('\n❌ Failed at Step 2. Aborting.');
    process.exit(1);
  }

  // Step 3: Compile circuit
  results.push(await runCommand(
    'Step 3: Compile Circuit',
    `${EZKL_PATH} compile-circuit -M ${MODEL_PATH} --compiled-circuit ${COMPILED_MODEL_PATH} --settings-path ${SETTINGS_PATH}`
  ));
  if (!results[results.length - 1].success) {
    console.error('\n❌ Failed at Step 3. Aborting.');
    process.exit(1);
  }

  // Step 4: Setup (generate keys)
  results.push(await runCommand(
    'Step 4: Setup Keys',
    `${EZKL_PATH} setup --compiled-circuit ${COMPILED_MODEL_PATH} --vk-path ${VK_PATH} --pk-path ${PK_PATH}`
  ));
  if (!results[results.length - 1].success) {
    console.error('\n❌ Failed at Step 4. Aborting.');
    process.exit(1);
  }

  // Step 5: Generate witness
  results.push(await runCommand(
    'Step 5: Generate Witness',
    `${EZKL_PATH} gen-witness -M ${COMPILED_MODEL_PATH} -D ${INPUT_PATH} --output ${WITNESS_PATH}`
  ));
  if (!results[results.length - 1].success) {
    console.error('\n❌ Failed at Step 5. Aborting.');
    process.exit(1);
  }

  // Step 6: Generate proof
  results.push(await runCommand(
    'Step 6: Generate Proof',
    `${EZKL_PATH} prove --witness ${WITNESS_PATH} --compiled-circuit ${COMPILED_MODEL_PATH} --pk-path ${PK_PATH} --proof-path ${PROOF_PATH}`
  ));
  if (!results[results.length - 1].success) {
    console.error('\n❌ Failed at Step 6. Aborting.');
    process.exit(1);
  }

  // Step 7: Verify proof (local sanity check)
  results.push(await runCommand(
    'Step 7: Verify Proof (Local)',
    `${EZKL_PATH} verify --proof-path ${PROOF_PATH} --settings-path ${SETTINGS_PATH} --vk-path ${VK_PATH}`
  ));

  const totalDuration = Date.now() - totalStartTime;

  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 SUMMARY');
  console.log('='.repeat(60));

  results.forEach((result, index) => {
    const status = result.success ? '✅' : '❌';
    const duration = (result.duration / 1000).toFixed(2);
    console.log(`${status} Step ${index + 1}: ${result.step} (${duration}s)`);
  });

  console.log('='.repeat(60));
  console.log(`⏱️  Total Duration: ${(totalDuration / 1000).toFixed(2)}s`);

  const allSuccess = results.every(r => r.success);

  if (allSuccess) {
    console.log('\n✅ Payroll proof generated successfully!');
    console.log('\n📁 Generated files:');
    console.log(`   - ${PROOF_PATH} (ZK proof - safe to share)`);
    console.log(`   - ${VK_PATH} (Verification key)`);
    console.log(`   - ${PK_PATH} (Proving key - keep private)`);

    // Read and display proof info
    try {
      const proofData = await readFile(PROOF_PATH, 'utf-8');
      const proof = JSON.parse(proofData);
      console.log('\n📦 Proof Details:');
      console.log(`   - Version: ${proof.version || 'N/A'}`);
      console.log(`   - Size: ${Buffer.from(JSON.stringify(proof)).length.toLocaleString()} bytes`);
      console.log(`   - Public Output: ${proof.pretty_public_inputs?.rescaled_outputs?.[0]?.[0] || 'N/A'}`);
    } catch (e) {
      console.log('   (Could not read proof details)');
    }

    console.log('\n📤 Next Steps:');
    console.log('   1. Submit proof to zkml-verifier service');
    console.log('   2. Receive attestation from verifier');
    console.log('   3. Use attestation to prove eligibility on-chain');
    console.log('\n🔐 Privacy Guarantee:');
    console.log('   ✅ Individual payment amounts NEVER leave your machine');
    console.log('   ✅ Only the proof of average > threshold is shared');
    console.log('   ✅ Cryptographically verified without revealing private data\n');

  } else {
    console.log('\n❌ Proof generation failed. Check errors above.');
    process.exit(1);
  }
}

main().catch(error => {
  console.error('\n💥 Unhandled error:', error);
  process.exit(1);
});
