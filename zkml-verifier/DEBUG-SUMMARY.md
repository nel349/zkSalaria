# Attestation Hash Debugging Summary

## Changes Made

### 1. Fixed `employee_id` Encoding in AttestationSigner
**File**: `zkml-verifier/src/services/attestation-signer.ts`

**Problem**: Was using UTF-8 string encoding instead of SHA-256 hash
```typescript
// BEFORE (WRONG):
const employeeIdBytes = Buffer.alloc(32);
employeeIdBytes.write(publicInputs.employee_id, 0, 'utf8');

// AFTER (CORRECT):
const employeeIdBytes = await this.walletAddressToEmployeeId(publicInputs.employee_id);
// Uses SHA-256 hash matching PayrollAPI's walletAddressToEmployeeId()
```

### 2. Added Debug Logs to AttestationSigner
**File**: `zkml-verifier/src/services/attestation-signer.ts:76-97`

Logs all values used to compute attestation hash:
- `employee_id_bytes` (hex)
- `proof_type`
- `threshold_min`
- `threshold_max`
- `history_commitment` (hex)
- `timestamp`
- Computed `attestation_hash`

### 3. Added Debug Logs to PayrollAPI
**File**: `payroll-api/src/payroll-api.ts:1095-1107`

Logs all bytes being sent to circuit:
- `employee_id_bytes` (hex)
- `proof_type`
- `threshold_min`
- `threshold_max`
- `history_commitment_bytes` (hex)
- `timestamp`
- `attestation_hash_bytes` (hex)
- `txids_count`
- `expires_in`

## Next Steps

1. **Restart Both Services**:
   ```bash
   # Terminal 1: Restart zkml-verifier
   cd zkml-verifier && npm run dev

   # Terminal 2: Restart payroll-ui (which includes PayrollAPI)
   cd payroll-ui && npm run dev
   ```

2. **Generate a Proof**: Try generating an income proof from the UI

3. **Compare Debug Logs**: The logs will show:
   - What the AttestationSigner computed
   - What the PayrollAPI sent to the contract

   These values MUST match exactly for the circuit validation to pass.

## Circuit Validation Steps

The `submit_income_proof` circuit performs these validations in order:

1. **Attestation Hash Validation** (Line 1117): Reconstructs attestation from params and verifies hash matches
2. **Proof Type Validation** (Line 1132): Checks proof_type is 1-4
3. **Verifier Trust Check** (Line 1137): Verifies verifier public key is trusted
4. **Replay Attack Prevention** (Line 1142): Checks attestation_hash hasn't been used
5. **Timestamp Freshness** (Line 1150-1154): Checks timestamp is within 1 hour and not future
6. **Range Validation** (Line 1160): For type 2, checks threshold_max > threshold_min
7. **Employee Exists** (Line 1169): Checks employee has payment history
8. **History Commitment Match** (Line 1176): Verifies history_commitment matches on-chain data

If ANY of these fail, the proof server returns 400 Bad Request.

## Expected Debug Output

### From AttestationSigner (zkml-verifier logs):
```
[AttestationSigner] Computing attestation hash with:
  employee_id_bytes: 24aa4733f0c90e9acc564376acbfa8a5656ec19a5ec04040feb14076761751af
  proof_type: 1
  threshold_min: 30000
  threshold_max: 0
  history_commitment: 228a177c48741bbcff88566d3d2f93661827ce7dbcbeaf50e4a130fed29fd3b7
  timestamp: 1763012637
[AttestationSigner] Computed attestation_hash: 0x5961a69f2ef6c4c3d54d9e2f77232fabe28f91838c380f1861f7812223ea5e5f
```

### From PayrollAPI (payroll-ui logs):
```
CIRCUIT_DEBUG_PARAMS: {
  employee_id_bytes: "24aa4733f0c90e9acc564376acbfa8a5656ec19a5ec04040feb14076761751af",
  proof_type: "1",
  threshold_min: "30000",
  threshold_max: "0",
  history_commitment_bytes: "228a177c48741bbcff88566d3d2f93661827ce7dbcbeaf50e4a130fed29fd3b7",
  timestamp: "1763012637",
  attestation_hash_bytes: "5961a69f2ef6c4c3d54d9e2f77232fabe28f91838c380f1861f7812223ea5e5f",
  ...
}
```

**CRITICAL**: All these values must match exactly (ignoring "0x" prefix differences).

## Test Script

You can also run the standalone test to verify attestation hash computation:
```bash
cd zkml-verifier
npx tsx test-attestation.ts
```

This will show you what the AttestationSigner computes without needing to generate a full proof.
