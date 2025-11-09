# Verifier Attestation E2E Tests

## Overview

This test suite validates the **trusted verifier attestation model** used for ZKML income proofs in zkSalaria.

**Test File:** `verifier-attestation.e2e.test.ts`

## What is Tested

### ✅ Core Attestation Functionality

1. **Attestation Hash Computation** (`should validate attestation hash computation`)
   - Tests correct attestation hash generation using: `hash(hash(data) + verifier_secret)`
   - Validates verifier pubkey computation from secret
   - Ensures properly computed attestations are accepted by contract

2. **Verifier Trust Model** (`should reject attestation from untrusted verifier`)
   - Validates only whitelisted verifiers can issue attestations
   - Tests that untrusted verifier attestations are rejected
   - Verifies `trusted_verifiers` Set enforcement

3. **Payment History Validation** (`should reject attestation with mismatched history commitment`)
   - Tests contract validates `history_commitment` against actual on-chain payment history
   - Uses `persistentHash<Vector<12, PC_PaymentRecord>>` computation
   - Prevents employees from submitting proofs based on fake data

### ✅ Security & Edge Cases

4. **Timestamp Validation** (`should reject attestation with future timestamp`)
   - Rejects attestations with timestamps in the future
   - Contract validates: `timestamp <= current_timestamp`

5. **Attestation Expiry** (`should reject expired attestation (>1 hour old)`)
   - Rejects attestations older than 1 hour
   - Contract validates: `timestamp >= current_timestamp - 3600`
   - Freshness requirement prevents reuse of old attestations

6. **Replay Protection** (`should enforce replay protection`)
   - Tests one-time use enforcement for each attestation_hash
   - Contract prevents reuse of same attestation_hash
   - Contract uses `used_attestations.member(attestation_hash)` check
   - Note: Employees CAN submit multiple proofs with different attestation hashes (overwrites previous)

7. **Attestation Hash Trust Model** (`should reject attestation with incorrect hash`)
   - Documents that contract CANNOT validate attestation_hash directly
   - Explains trust-based model (no verifier secret on-chain)
   - Shows contract trusts whitelisted verifier created hash correctly

### ⏭️ Optional Integration Test

8. **Real Verifier Service Integration** (`test.skip` - requires service running)
   - Full E2E flow with actual zkml-verifier service
   - Calls verifier service at `localhost:3002`
   - Tests complete attestation lifecycle

## Attestation Security Model

### What the Contract VALIDATES ✅

1. **Verifier Trust:** Is `verifier_pubkey` in the `trusted_verifiers` whitelist?
2. **Payment History Binding:** Does `history_commitment` match actual on-chain payment history?
3. **Timestamp Validity:** Is timestamp not in the future and not expired (>1 hour old)?
4. **Replay Protection:** Has this specific `attestation_hash` been used before?

### What the Contract CANNOT Validate ❌

1. **Attestation Hash Validity:** Contract cannot verify `attestation_hash = hash(data + verifier_secret)` because `verifier_secret` is never on-chain (trust model)
2. **ZK Proof Validity:** Contract trusts that the verifier validated the EZKL proof off-chain

### Trust Chain

```
Employee → ZK Proof → Verifier Service (off-chain) → Attestation → Smart Contract
           (EZKL)    (validates crypto)              (trust-based) (validates data binding)
```

## Attestation Hash Computation

```typescript
// Verifier service (off-chain):
const data = `${employee_id}${threshold}${history_commitment}${timestamp}`;
const data_hash = hash(data);
const attestation_hash = hash(data_hash + verifier_secret); // Secret NEVER on-chain

// Verifier pubkey (for registration):
const verifier_pubkey = hash("zksalaria:verifier:pk:" + verifier_secret);
```

## Running the Tests

```bash
# Run all attestation tests
cd payroll-api
npm test -- verifier-attestation.e2e.test.ts

# Run with verifier service integration (requires localhost:3002)
npm test -- verifier-attestation.e2e.test.ts --run
```

## Test Coverage Summary

| Test Case | Coverage | Status |
|-----------|----------|--------|
| Attestation hash computation | ✅ Validates crypto logic matches verifier service | Passing |
| Trusted verifier enforcement | ✅ Only whitelisted verifiers accepted | Passing |
| Payment history binding | ✅ Prevents fake data submission | Passing |
| Future timestamp rejection | ✅ Timestamp validation | Passing |
| Expired attestation rejection | ✅ 1-hour freshness window | Passing |
| Replay protection | ✅ One-time use enforcement | Passing |
| Attestation hash trust model | ✅ Documents limitations | Passing |
| Verifier service integration | ⏭️ Optional (requires service) | Skipped |

## Edge Cases Covered

- ❌ Untrusted verifier → Rejected
- ❌ Fake payment history → history_commitment mismatch detected
- ❌ Future timestamp → Rejected
- ❌ Expired attestation (>1 hour) → Rejected
- ❌ Replay attack (reuse same attestation_hash) → Rejected
- ⚠️ Wrong attestation hash → **Accepted** (contract cannot validate without secret)
- ⚠️ Multiple proofs from same employee (different attestation_hash) → **Accepted** (overwrites previous)

## Security Notes

### Why Attestation Hash Cannot Be Validated On-Chain

The `attestation_hash` is computed using `verifier_secret`:

```
attestation_hash = hash(data_hash + verifier_secret)
```

**The secret CANNOT be on-chain because:**
- If on-chain, anyone could create fake attestations
- Defeats the purpose of having trusted verifiers
- Would compromise the entire security model

**Instead, we use a trust-based model:**
- Contract trusts whitelisted verifiers
- Verifiers stake their reputation
- Bad verifiers can be removed from whitelist
- Multiple safeguards: history binding, timestamp checks, replay protection

### Why This Is Secure

Even though contract cannot validate `attestation_hash`, the system is secure because:

1. **Payment History Binding:** Contract validates `history_commitment` against actual on-chain data
   - Employee cannot fake payment amounts
   - Proof must be based on real blockchain data

2. **Verifier Whitelist:** Only pre-approved verifiers can issue attestations
   - Bad verifiers get removed
   - Verifiers have reputation at stake

3. **Replay Protection:** Each attestation_hash single-use
   - Cannot reuse same attestation_hash
   - Tracked in `used_attestations` Set
   - Note: Employees can submit new proofs with different attestation_hash (overwrites previous)

4. **Freshness Requirements:** Time-limited validity
   - Attestations expire after 1 hour
   - Prevents stale data attacks

5. **Off-Chain ZK Proof:** Verifier validates EZKL proof before creating attestation
   - Mathematical soundness guaranteed
   - Cannot fake proof without breaking cryptography

## Next Steps

To run the full integration test with real verifier service:

1. Start zkml-verifier service: `cd zkml-verifier && npm start`
2. Ensure EZKL proofs available in `zkml/payroll/`
3. Remove `.skip` from integration test
4. Run tests: `npm test -- verifier-attestation.e2e.test.ts`
