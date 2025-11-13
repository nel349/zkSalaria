/**
 * Test script to debug attestation hash computation
 */

import { createHash } from 'crypto';
import { computeVerifierPubkeyFromString, computeAttestationHash } from '@zksalaria/payroll-contract';

// Test values from the error log
const employeeId = 'mn_shield-addr_undeployed1ykhufwetshq2ukrmkreu5nnpfpnlwny5pqneh5d7snr8jtlqndsqxqr9u5x50zvt9adxg4t26x5fntq3srr9zjwpz3490lnttfz49tmnsst3ld7h';
const proofType = 1;
const thresholdMin = 30000;
const thresholdMax = 0;
const historyCommitment = '0x228a177c48741bbcff88566d3d2f93661827ce7dbcbeaf50e4a130fed29fd3b7';
const timestamp = Math.floor(Date.now() / 1000);

const verifierSecret = process.env.VERIFIER_SECRET_KEY || 'cea7f2f583a968169bcbf3cdac958160db7de83643d9c94c346e37779d6232b3';

console.log('='.repeat(80));
console.log('ATTESTATION HASH DEBUGGING');
console.log('='.repeat(80));
console.log();

// Step 1: Compute employee_id bytes (SHA-256 hash of wallet address)
console.log('Step 1: Convert employee_id to Bytes<32>');
console.log('-'.repeat(80));
console.log('employee_id (wallet address):', employeeId);
const employeeIdHash = createHash('sha256').update(employeeId).digest();
const employeeIdBytes = new Uint8Array(employeeIdHash);
console.log('employee_id bytes (SHA-256):', Buffer.from(employeeIdBytes).toString('hex'));
console.log();

// Step 2: Convert history_commitment
console.log('Step 2: Convert history_commitment to Bytes<32>');
console.log('-'.repeat(80));
console.log('history_commitment (input):', historyCommitment);
const historyCommitmentHex = historyCommitment.startsWith('0x')
  ? historyCommitment.slice(2)
  : historyCommitment;
const historyCommitmentBytes = Buffer.from(historyCommitmentHex, 'hex');
console.log('history_commitment bytes:', Buffer.from(historyCommitmentBytes).toString('hex'));
console.log();

// Step 3: Compute attestation hash
console.log('Step 3: Compute attestation hash');
console.log('-'.repeat(80));
console.log('Attestation struct:');
console.log('  employee_id:', Buffer.from(employeeIdBytes).toString('hex'));
console.log('  proof_type:', proofType);
console.log('  threshold_min:', thresholdMin);
console.log('  threshold_max:', thresholdMax);
console.log('  history_commitment:', Buffer.from(historyCommitmentBytes).toString('hex'));
console.log('  timestamp:', timestamp);
console.log();

const attestationHashBytes = computeAttestationHash({
  employee_id: employeeIdBytes,
  proof_type: BigInt(proofType),
  threshold_min: BigInt(thresholdMin),
  threshold_max: BigInt(thresholdMax),
  history_commitment: new Uint8Array(historyCommitmentBytes),
  timestamp: BigInt(timestamp)
});

const attestationHash = '0x' + Buffer.from(attestationHashBytes).toString('hex');
console.log('Computed attestation_hash:', attestationHash);
console.log();

// Step 4: Compute verifier public key
console.log('Step 4: Compute verifier public key');
console.log('-'.repeat(80));
console.log('verifier_secret_key:', verifierSecret);
const verifierPubkey = computeVerifierPubkeyFromString(verifierSecret);
console.log('verifier_pubkey:', verifierPubkey);
console.log();

// Step 5: Show what would be sent to contract
console.log('Step 5: Contract call parameters');
console.log('-'.repeat(80));
console.log('submit_income_proof(');
console.log('  employee_id:', Buffer.from(employeeIdBytes).toString('hex'));
console.log('  proof_type:', proofType);
console.log('  threshold_min:', thresholdMin);
console.log('  threshold_max:', thresholdMax);
console.log('  history_commitment:', Buffer.from(historyCommitmentBytes).toString('hex'));
console.log('  timestamp:', timestamp);
console.log('  attestation_hash:', attestationHash);
console.log('  verifier_pubkey (from witness):', verifierPubkey);
console.log(')');
console.log();

console.log('='.repeat(80));
console.log('SUMMARY');
console.log('='.repeat(80));
console.log('✓ Verifier public key matches registered key:', verifierPubkey === 'c295987e7a422db413a9ed80e164ab9d365a2c8c8b20930d4aafda09ec31bff6');
console.log('✓ All byte conversions complete');
console.log('✓ Attestation hash computed');
console.log();
console.log('Next: Compare these values with what the circuit receives');
