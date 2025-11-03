/**
 * Test the zkml-verifier service end-to-end
 */

import { readFile } from 'fs/promises';

const VERIFIER_URL = 'http://localhost:3002';
const PROOF_PATH = '../zkml/examples/01-simple-threshold/proof.json';

async function testVerifier() {
  console.log('🧪 Testing zkml-verifier service\n');
  console.log('='.repeat(60));

  try {
    // Step 1: Load the proof
    console.log('\n📂 Step 1: Loading proof from Example 1...');
    const proofData = await readFile(PROOF_PATH, 'utf-8');
    const proof = JSON.parse(proofData);
    console.log(`✅ Loaded proof (version: ${proof.version})`);

    // Step 2: Create request with proof + public inputs
    console.log('\n📦 Step 2: Creating verification request...');
    const request = {
      proof: proof,
      publicInputs: {
        employee_id: '0x1234567890abcdef',
        threshold: 5000,
        txids: ['0xTX001', '0xTX002', '0xTX003'],
        merkle_root: '0xMERKLEROOT123456'
      }
    };
    console.log('✅ Request created with public inputs');

    // Step 3: Send to verifier
    console.log('\n🔐 Step 3: Sending to verifier service...');
    console.log(`   URL: ${VERIFIER_URL}/api/zkml/verify-proof`);

    const response = await fetch(`${VERIFIER_URL}/api/zkml/verify-proof`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(request)
    });

    const result = await response.json();

    // Step 4: Check result
    console.log('\n📊 Step 4: Verification result\n');
    console.log('='.repeat(60));

    if (result.success) {
      console.log('✅ SUCCESS! Proof verified and attestation created\n');
      console.log('📋 Attestation Details:');
      console.log(`   Employee ID: ${result.attestation.employee_id}`);
      console.log(`   Threshold: ${result.attestation.threshold}`);
      console.log(`   TxIDs: ${result.attestation.txids.join(', ')}`);
      console.log(`   Merkle Root: ${result.attestation.merkle_root}`);
      console.log(`   Timestamp: ${result.attestation.timestamp}`);
      console.log(`   Attestation Hash: ${result.attestation.attestation_hash.substring(0, 16)}...`);
      console.log(`   Verifier PubKey: ${result.attestation.verifier_pubkey.substring(0, 16)}...`);
      console.log(`   Verifier Secret: ${result.attestation.verifier_secret.substring(0, 16)}...`);

      console.log('\n🎉 End-to-end test PASSED!');
      console.log('='.repeat(60));
      console.log('\n✅ The complete workflow works:');
      console.log('   1. ✅ TypeScript generated EZKL proof');
      console.log('   2. ✅ Verifier service verified proof');
      console.log('   3. ✅ Attestation created (Midnight-style hash commitment)');
      console.log('\n📝 Next steps:');
      console.log('   - Create payroll-specific proof generator');
      console.log('   - Add attestation verification to Midnight contract');
      console.log('   - Test with real payroll data\n');

      process.exit(0);
    } else {
      console.log('❌ FAILED! Proof verification failed\n');
      console.log(`Error: ${result.error}`);
      console.log(`Message: ${result.message}`);
      console.log('\n='.repeat(60));
      process.exit(1);
    }

  } catch (error) {
    console.error('\n💥 Test failed with error:');
    console.error(error);
    process.exit(1);
  }
}

testVerifier();
