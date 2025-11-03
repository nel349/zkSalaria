/**
 * Generate EZKL Proof using TypeScript
 *
 * This script generates a ZK proof for the simple threshold example
 * using the EZKL CLI directly from TypeScript.
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { readFile } from 'fs/promises';
import path from 'path';

const execAsync = promisify(exec);

const EZKL_PATH = '/Users/norman/.ezkl/ezkl';
const MODEL_PATH = 'network.onnx';
const INPUT_PATH = 'input.json';
const SETTINGS_PATH = 'settings.json';
const COMPILED_MODEL_PATH = 'network.compiled';
const PK_PATH = 'pk.key';
const VK_PATH = 'vk.key';
const WITNESS_PATH = 'witness.json';
const PROOF_PATH = 'proof.json';

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
      timeout: 300000, // 5 minutes timeout
      maxBuffer: 10 * 1024 * 1024 // 10MB buffer
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
  console.log('\n🚀 Starting EZKL Proof Generation (TypeScript)');
  console.log('='.repeat(60));

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

  // Step 4: Setup (generate proving and verification keys)
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

  // Step 7: Verify proof (sanity check)
  results.push(await runCommand(
    'Step 7: Verify Proof (Sanity Check)',
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
    console.log('\n✅ Proof generation completed successfully!');
    console.log('\n📁 Generated files:');
    console.log(`   - ${SETTINGS_PATH}`);
    console.log(`   - ${COMPILED_MODEL_PATH}`);
    console.log(`   - ${PK_PATH}`);
    console.log(`   - ${VK_PATH}`);
    console.log(`   - ${WITNESS_PATH}`);
    console.log(`   - ${PROOF_PATH}`);

    // Read and display proof info
    try {
      const proofData = await readFile(PROOF_PATH, 'utf-8');
      const proof = JSON.parse(proofData);
      console.log('\n📦 Proof Info:');
      console.log(`   - Version: ${proof.version || 'N/A'}`);
      console.log(`   - Transcript Type: ${proof.transcript_type || 'N/A'}`);
      console.log(`   - Instances: ${proof.instances?.length || 0}`);
      console.log(`   - Proof size: ${Buffer.from(JSON.stringify(proof)).length} bytes`);
    } catch (e) {
      console.log('   (Could not read proof details)');
    }

    console.log('\n🎉 Ready to test with verifier service!');
  } else {
    console.log('\n❌ Proof generation failed. Check errors above.');
    process.exit(1);
  }
}

main().catch(error => {
  console.error('\n💥 Unhandled error:', error);
  process.exit(1);
});
