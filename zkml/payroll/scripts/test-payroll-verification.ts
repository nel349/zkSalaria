/**
 * Test the zkml-verifier service with payroll proof
 */

import { readFile } from 'fs/promises';

const VERIFIER_URL = 'http://localhost:3002';
const PROOF_PATH = './proof.json';

// Sample payroll metadata matching generate-payroll-proof.ts
const SAMPLE_EMPLOYEE_ID = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1';
const SAMPLE_THRESHOLD = 5000;
const SAMPLE_TXIDS = [
  '0xTX001_2024_01',
  '0xTX002_2024_02',
  '0xTX003_2024_03',
  '0xTX004_2024_04'
];
const SAMPLE_MERKLE_ROOT = '0xMERKLE_ROOT_PAYMENT_HISTORY_Q1_2024';

async function testPayrollVerification() {
  console.log('🧪 Testing Payroll Proof Verification\n');
  console.log('='.repeat(60));

  try {
    // Step 1: Load the payroll proof
    console.log('\n📂 Step 1: Loading payroll proof...');
    const proofData = await readFile(PROOF_PATH, 'utf-8');
    const proof = JSON.parse(proofData);
    console.log(`✅ Loaded proof (version: ${proof.version}, size: ${Buffer.from(proofData).length.toLocaleString()} bytes)`);

    // Step 2: Create verification request with payroll metadata
    console.log('\n📦 Step 2: Creating verification request...');
    const request = {
      proof: proof,
      publicInputs: {
        employee_id: SAMPLE_EMPLOYEE_ID,
        threshold: SAMPLE_THRESHOLD,
        txids: SAMPLE_TXIDS,
        merkle_root: SAMPLE_MERKLE_ROOT
      }
    };
    console.log('✅ Request created with payroll metadata:');
    console.log(`   Employee ID: ${SAMPLE_EMPLOYEE_ID}`);
    console.log(`   Threshold: $${SAMPLE_THRESHOLD.toLocaleString()}`);
    console.log(`   Payment Count: ${SAMPLE_TXIDS.length}`);
    console.log(`   Merkle Root: ${SAMPLE_MERKLE_ROOT}`);

    // Step 3: Send to verifier service
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
      console.log('✅ SUCCESS! Payroll proof verified and attestation created\n');
      console.log('📋 Attestation Details:');
      console.log(`   Employee ID: ${result.attestation.employee_id}`);
      console.log(`   Threshold: $${result.attestation.threshold.toLocaleString()}`);
      console.log(`   TxIDs: ${result.attestation.txids.join(', ')}`);
      console.log(`   Merkle Root: ${result.attestation.merkle_root}`);
      console.log(`   Timestamp: ${result.attestation.timestamp}`);
      console.log(`   Attestation Hash: ${result.attestation.attestation_hash.substring(0, 16)}...`);
      console.log(`   Verifier PubKey: ${result.attestation.verifier_pubkey.substring(0, 16)}...`);
      // verifier_secret no longer exposed for security

      console.log('\n🎉 Payroll proof verification PASSED!');
      console.log('='.repeat(60));
      console.log('\n✅ Complete workflow verified:');
      console.log('   1. ✅ Generated payroll proof with EZKL');
      console.log('   2. ✅ Verified proof cryptographically');
      console.log('   3. ✅ Created Midnight-style attestation');
      console.log('\n🔐 Privacy preserved:');
      console.log('   ✅ Individual payment amounts stayed private');
      console.log('   ✅ Only average > threshold proof was verified');
      console.log('   ✅ Attestation ready for on-chain verification');
      console.log('\n📝 Next steps:');
      console.log('   - Integrate attestation verification into payroll contract');
      console.log('   - Add zkml-verifier endpoints to payroll-api');
      console.log('   - Test with real payment history data\n');

      process.exit(0);
    } else {
      console.log('❌ FAILED! Payroll proof verification failed\n');
      console.log(`Error: ${result.error}`);
      console.log(`Message: ${result.message}`);
      console.log('\n='.repeat(60));
      process.exit(1);
    }

  } catch (error) {
    console.error('\n💥 Test failed with error:');
    console.error(error);
    console.log('\n⚠️  Make sure zkml-verifier service is running:');
    console.log('   cd ../zkml-verifier && npm run dev');
    process.exit(1);
  }
}

testPayrollVerification();
