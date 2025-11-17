# Bulletproof Integration for Trustless Verification

## Overview

This document describes the **Bulletproof + EZKL hybrid proof system** that achieves **partial trustlessness** for zkSalaria's income verification.

**Key Innovation:** Use Compact's elliptic curve operations (`ecAdd`, `ecMul`, `hashToCurve`) to verify Bulletproof range proofs **on-chain**, eliminating the need to trust verifiers for threshold claims.

---

## Problem: The Oracle Problem for ZK Proofs

### Current Architecture (Trusted Verifier)

```
┌─────────────────────────────────────────────────┐
│ Off-Chain: EZKL Proof Generation               │
├─────────────────────────────────────────────────┤
│ Employee generates EZKL proof:                  │
│   Input (private): [7500, 7500, 7200, ...]     │
│   Output: avg_income >= threshold ✓             │
│   Proof: proof.json (Groth16 SNARK)            │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│ Off-Chain: Trusted Verifier                    │
├─────────────────────────────────────────────────┤
│ Verifier runs ezkl.verify(proof.json)          │
│ Verifier signs attestation: "proof valid ✓"    │
│                                                 │
│ ⚠️  CENTRALIZATION POINT                        │
│ Problem: Must trust verifier won't lie!        │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│ On-Chain: Midnight Contract                    │
├─────────────────────────────────────────────────┤
│ Contract trusts verifier's signature           │
│ Stores income proof as verified                │
│                                                 │
│ ⚠️  Cannot verify EZKL proof on-chain           │
│ (Midnight lacks pairing operations)            │
└─────────────────────────────────────────────────┘
```

**Attack Vector:** Malicious verifier can sign false attestations claiming threshold is met when it's not.

---

## Solution: Hybrid EZKL + Bulletproof System

### New Architecture (Partially Trustless)

```
┌─────────────────────────────────────────────────┐
│ Off-Chain: EZKL Proof (ZKML Verification)      │
├─────────────────────────────────────────────────┤
│ 1. Employee runs EZKL proof:                    │
│    - Proves: ML model executed correctly        │
│    - Proves: avg_income = f(payment_amounts)    │
│    - Output: avg_income value                   │
│                                                 │
│ 2. Verifier validates EZKL proof off-chain     │
│    - Still requires trust (no pairings on-chain)│
│    - But: Only verifies ZKML correctness        │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│ Off-Chain: Bulletproof Generation (NEW!)       │
├─────────────────────────────────────────────────┤
│ 3. Verifier generates Bulletproof:              │
│    - Commitment: C = g^avg_income · h^r         │
│    - Range proof: avg_income >= threshold       │
│    - Proof size: ~1-2KB (logarithmic)           │
│    - Only uses G1 operations (no pairings!)     │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│ On-Chain: Midnight Contract (TRUSTLESS!)       │
├─────────────────────────────────────────────────┤
│ 4. Contract verifies Bulletproof:               │
│    ✅ Uses ecAdd, ecMul (native Compact ops)    │
│    ✅ Cryptographically proves threshold claim  │
│    ✅ NO TRUST REQUIRED for threshold!          │
│                                                 │
│ 5. Contract verifies history commitment:        │
│    ✅ Binds proof to on-chain payment data      │
│                                                 │
│ Result: HYBRID VERIFICATION                     │
│ - ZKML correctness: Still trusted              │
│ - Threshold claim: NOW TRUSTLESS! ✓            │
└─────────────────────────────────────────────────┘
```

---

## Implementation Details

### File Structure

```
zkSalaria/
├── payroll-commons/
│   └── BulletproofVerifier.compact          # NEW: Bulletproof verification logic
│
├── payroll-contract/
│   └── src/
│       └── payroll.compact
│           ├── submit_income_proof()         # Old: Trusted verifier
│           └── submit_income_proof_bulletproof()  # NEW: Hybrid verification
│
└── zkml-verifier/
    └── src/
        ├── bulletproof/                      # TODO: Rust Bulletproof generator
        │   ├── generator.rs
        │   └── binding.rs
        └── routes/
            └── verify.ts                     # TODO: Add Bulletproof endpoints
```

### Core Components

#### 1. BulletproofVerifier.compact

**Location:** `payroll-commons/BulletproofVerifier.compact`

**Exports:**
- `BulletproofData` - Struct containing proof elements
- `verify_bulletproof_range()` - Main verification circuit
- `verify_bulletproof_commitment()` - Binds proof to attestation
- `pedersen_commit()` - Creates commitments (for testing)

**Key Function:**
```compact
export pure circuit verify_bulletproof_range(
  data: BulletproofData
): Boolean {
  // 1. Generate Fiat-Shamir challenges
  const challenges = generate_challenge_scalars(...);

  // 2. Get generators
  const G = ecMulGenerator(one_field);
  const H = hashToCurve<Bytes<32>>(pad(32, "bulletproof:H:"));

  // 3. Compute LHS = C + Σ(x_i² · L_i + x_i⁻² · R_i)
  var lhs = data.commitment;
  for (i = 0; i < 6; i++) {
    lhs = ecAdd(lhs, ecMul(data.proof_L[i], x_i_sq));
    lhs = ecAdd(lhs, ecMul(data.proof_R[i], x_i_inv_sq));
  }

  // 4. Compute RHS = a·G + b·H
  const rhs = ecAdd(ecMul(G, a), ecMul(H, b));

  // 5. Check equation
  return curve_points_equal(lhs, rhs);
}
```

**Cryptographic Primitives Used:**
- ✅ `ecAdd(p1, p2)` - Elliptic curve point addition
- ✅ `ecMul(point, scalar)` - Scalar multiplication
- ✅ `ecMulGenerator(scalar)` - Multiply base generator
- ✅ `hashToCurve<T>(value)` - Hash-to-curve for generators
- ✅ `transientHash<T>(value)` - Field element hashing
- ✅ `persistentHash<T>(value)` - SHA-256 hashing

**What's NOT Available (hence no recursive proofs):**
- ❌ Pairing operations `e(g1, g2)`
- ❌ SNARK verification circuits
- ❌ Signature verification (ECDSA, EdDSA)

#### 2. submit_income_proof_bulletproof()

**Location:** `payroll-contract/src/payroll.compact` (lines 1329-1473)

**Architecture:**
```compact
export circuit submit_income_proof_bulletproof(
  // Standard fields
  employee_id: Bytes<32>,
  proof_type: Uint<8>,
  threshold_min: Uint<64>,
  threshold_max: Uint<64>,
  history_commitment: Bytes<32>,
  timestamp: Uint<32>,
  attestation_hash: Bytes<32>,
  txids: Vector<12, Bytes<32>>,
  expires_in: Uint<32>,

  // NEW: Bulletproof data
  bulletproof_data: BP_BulletproofData
): Boolean {

  // PART 1: TRUSTLESS VERIFICATION ✓
  const range_valid = BP_verify_bulletproof_range(bulletproof_data);
  const bound = BP_verify_bulletproof_commitment(...);

  // PART 2: STANDARD VALIDATION
  // (proof type, replay protection, timestamp, etc.)

  // PART 3: HISTORY COMMITMENT
  // Verify payment history matches on-chain data

  // Store verified proof
  return true;
}
```

**Security Properties:**

| Verification Step | Trust Required | Cryptographic Security |
|-------------------|----------------|------------------------|
| **Bulletproof range proof** | ❌ None | ✅ Discrete log hardness |
| **History commitment** | ❌ None | ✅ SHA-256 collision resistance |
| **EZKL ZKML proof** | ⚠️ Trusted verifier | ⚠️ Must trust off-chain verification |
| **Attestation binding** | ❌ None | ✅ Hash binding |

**Key Improvement:** Even if a malicious verifier submits an invalid EZKL proof, they **cannot** fake the Bulletproof range proof. The threshold verification is cryptographically enforced on-chain!

---

## Comparison: Before vs. After

### Security Model

| Aspect | Trusted Verifier | Hybrid Bulletproof |
|--------|------------------|-------------------|
| **ZKML Verification** | Trust verifier | Trust verifier (same) |
| **Threshold Verification** | Trust verifier | **Cryptographically proven** ✅ |
| **History Binding** | SHA-256 hash | SHA-256 hash (same) |
| **Attack Vector** | Verifier can lie | **Cannot forge Bulletproof** |
| **Decentralization** | Centralized | **Partially decentralized** |
| **Gas Cost** | Low (~50K gas) | Higher (~200-300K gas estimate) |

### Trust Assumptions

**Before:**
```
Trust Assumptions:
1. Verifier runs ezkl.verify() correctly
2. Verifier signs honest attestations
3. Verifier doesn't collude with employees

Attack: Malicious verifier signs "income >= $100K"
        when actual income is $50K
```

**After:**
```
Trust Assumptions:
1. Verifier runs ezkl.verify() correctly (ZKML only)

Attack: Malicious verifier can still fake ZKML computation,
        BUT cannot fake threshold passing!

Bulletproof verification equation would fail:
  LHS ≠ RHS → proof rejected on-chain ✓
```

---

## Next Steps: Implementation Roadmap

### Phase 1: Rust Bulletproof Generator (3-5 days)

**File:** `zkml-verifier/src/bulletproof/generator.rs`

```rust
use bulletproofs::{BulletproofGens, PedersenGens, RangeProof};
use curve25519_dalek::scalar::Scalar;

pub fn generate_income_range_proof(
    income: u64,
    threshold: u64,
    blinding: Scalar,
) -> Result<BulletproofProof, Error> {
    let pc_gens = PedersenGens::default();
    let bp_gens = BulletproofGens::new(64, 1);

    // Prove: (income - threshold) ∈ [0, 2^64)
    let shifted_value = income - threshold;

    let (proof, commitment) = RangeProof::prove_single(
        &bp_gens,
        &pc_gens,
        &mut transcript,
        shifted_value,
        &blinding,
        64, // bits
    )?;

    Ok(BulletproofProof {
        commitment,
        proof_L: extract_L_points(&proof),
        proof_R: extract_R_points(&proof),
        proof_a: extract_a_scalar(&proof),
        proof_b: extract_b_scalar(&proof),
    })
}
```

**Dependencies:**
```toml
[dependencies]
bulletproofs = "4.0"
curve25519-dalek = "4.0"
merlin = "3.0"  # For Fiat-Shamir transcripts
```

### Phase 2: API Integration (2-3 days)

**File:** `zkml-verifier/src/routes/verify.ts`

Add new endpoint:
```typescript
fastify.post<{
  Body: GenerateBulletproofRequest
}>('/generate-bulletproof', async (request, reply) => {
  const { income, threshold, attestation_hash, history_commitment } = request.body;

  // 1. Generate Bulletproof
  const proof = await bulletproofGenerator.generate({
    value: income,
    min_threshold: threshold
  });

  // 2. Bind to attestation
  const binding_commitment = bindToAttestation(
    proof.commitment,
    attestation_hash,
    history_commitment
  );

  // 3. Return proof data
  return {
    success: true,
    bulletproof: {
      commitment: serializeCurvePoint(binding_commitment),
      proof_L: proof.L.map(serializeCurvePoint),
      proof_R: proof.R.map(serializeCurvePoint),
      proof_a: serializeScalar(proof.a),
      proof_b: serializeScalar(proof.b)
    }
  };
});
```

### Phase 3: End-to-End Flow (1-2 days)

**Modified Verification Flow:**

```typescript
// 1. Employee generates EZKL proof (unchanged)
const ezklProof = await generateIncomeProof(payments, threshold);

// 2. Verifier validates EZKL + generates Bulletproof
const response = await fetch('http://localhost:3002/api/zkml/verify-and-bulletproof', {
  method: 'POST',
  body: JSON.stringify({
    ezkl_proof: ezklProof.proof,
    public_inputs: ezklProof.publicInputs
  })
});

const { attestation, bulletproof } = await response.json();

// 3. Submit to contract with Bulletproof
const success = await payrollAPI.submitIncomeProofBulletproof(
  employeeId,
  proofType,
  thresholdMin,
  thresholdMax,
  historyCommitment,
  timestamp,
  attestation.attestation_hash,
  txids,
  expiresIn,
  bulletproof  // NEW: Bulletproof data
);
```

### Phase 4: Testing (2-3 days)

**Test Cases:**

1. **Valid Bulletproof:**
   - Generate proof with income = $8000, threshold = $7000
   - ✅ Proof should verify on-chain

2. **Invalid Threshold:**
   - Generate proof with income = $6000, threshold = $7000
   - ❌ Proof should fail verification

3. **Commitment Binding:**
   - Generate valid Bulletproof
   - Modify attestation_hash
   - ❌ Binding verification should fail

4. **Replay Attack:**
   - Submit same Bulletproof twice
   - ❌ Second submission should fail (attestation_hash already used)

5. **History Mismatch:**
   - Generate proof with correct income
   - Modify payment history on-chain
   - ❌ History commitment check should fail

---

## Benefits & Trade-offs

### ✅ Benefits

1. **Partial Trustlessness:**
   - Threshold verification is cryptographically enforced
   - Cannot forge range proofs without breaking discrete log

2. **Uses Existing Infrastructure:**
   - Leverages Compact's elliptic curve operations
   - No need for pairings or SNARK verification
   - Works with current Midnight capabilities

3. **Economic Efficiency:**
   - Smaller proofs than STARKs (~1-2KB vs. 100-200KB)
   - Logarithmic proof size in range size
   - No trusted setup needed

4. **Incremental Deployment:**
   - Can deploy alongside existing `submit_income_proof`
   - Gradual migration path
   - Backward compatible

### ⚠️ Trade-offs

1. **Still Requires Trust for ZKML:**
   - EZKL verification happens off-chain
   - Verifier could fake ML computation
   - BUT: Cannot fake threshold passing!

2. **Higher Gas Costs:**
   - Bulletproof verification requires 6+ curve operations
   - Estimated 3-5x gas cost vs. trusted verifier
   - Linear verification time (vs. constant for Groth16)

3. **Implementation Complexity:**
   - Need Rust Bulletproof generator
   - Coordinate curve operations between Rust and Compact
   - More code to maintain

4. **Not Fully Trustless:**
   - Still need verifier for ZKML correctness
   - Ideal solution would verify EZKL on-chain (requires pairings)

---

## Future: Path to Full Trustlessness

### Option 1: Wait for Midnight v2 Pairing Support

If Midnight adds pairing operations to Compact:

```compact
// Future: Verify EZKL proofs on-chain directly!
export circuit verify_groth16_proof(
  proof_a: G1Point,
  proof_b: G2Point,
  proof_c: G1Point,
  vk: VerificationKey,
  public_inputs: Vector<10, Field>
): Boolean {
  // Pairing check: e(A, B) == e(α, β) · e(L, γ) · e(C, δ)
  const lhs = pairing(proof_a, proof_b);
  const rhs = pairing(vk.alpha, vk.beta) *
              pairing(compute_L(public_inputs, vk.ic), vk.gamma) *
              pairing(proof_c, vk.delta);

  return lhs == rhs;
}
```

**Benefits:**
- ✅ Fully trustless (no verifier needed!)
- ✅ Constant-time verification
- ✅ Smaller proofs than Bulletproofs

### Option 2: Switch to STARKs

Use proof systems that only need hash functions:

```compact
// STARKs only need hashing (already available!)
export circuit verify_stark_proof(
  proof: STARKProof,
  public_inputs: Bytes<256>
): Boolean {
  // FRI protocol verification using persistentHash
  for (layer in proof.fri_layers) {
    const commitment = persistentHash(layer);
    assert(verify_merkle_path(commitment, ...));
  }

  return verify_low_degree_test(proof);
}
```

**Benefits:**
- ✅ Only uses hash functions (available in Compact!)
- ✅ Post-quantum secure
- ✅ No trusted setup
- ❌ Very large proofs (100-200KB)

---

## Conclusion

The **Bulletproof + EZKL hybrid system** achieves **partial trustlessness** by:

1. ✅ Verifying threshold claims on-chain (trustless!)
2. ✅ Binding proofs to on-chain payment data
3. ⚠️ Still trusting verifier for ZKML correctness

This is a **significant security improvement** over the fully trusted verifier model, and can be implemented **today** using Midnight's existing cryptographic primitives.

**Next Steps:**
1. Implement Rust Bulletproof generator (zkml-verifier)
2. Add API endpoints for Bulletproof generation
3. Create end-to-end integration tests
4. Deploy to testnet and measure gas costs
5. Document migration path from trusted verifier

---

## References

- **Bulletproofs Paper:** https://eprint.iacr.org/2017/1066.pdf
- **Compact Standard Library:** https://github.com/midnightntwrk/midnight-docs/blob/main/compact/compact-std-library/exports.md
- **EZKL Documentation:** https://docs.ezkl.xyz/
- **Pedersen Commitments:** https://crypto.stanford.edu/cs355/19sp/lec5.pdf
