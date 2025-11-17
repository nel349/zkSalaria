# IPA-Based Trustless ZKML Verification

**Date:** November 17, 2025
**Status:** RECOMMENDED PATH FORWARD
**Priority:** HIGH - Eliminates trusted verifier

## Executive Summary

**CRITICAL FINDING:** EZKL supports IPA (Inner Product Arguments) as an alternative to KZG commitments. IPA verification requires ONLY elliptic curve operations (no pairings), which ARE available in Compact's standard library. This enables **fully trustless on-chain verification** of ZKML proofs, eliminating the need for a trusted verifier.

### Trust Model Comparison

| Approach | Trust Required | Verification Location | Limitations |
|----------|---------------|----------------------|-------------|
| **Current (Trusted Verifier)** | Full trust in verifier | Off-chain service | Verifier can lie about proof validity |
| **Bulletproof Hybrid** | Partial trust | Partial on-chain | Verifier can commit wrong values to Bulletproof |
| **IPA (Recommended)** | **ZERO TRUST** | **Fully on-chain** | **None - fully trustless!** |

## Technical Background

### What is IPA?

**Inner Product Argument (IPA)** is a polynomial commitment scheme that:
- Requires NO trusted setup (unlike KZG)
- Uses ONLY elliptic curve operations (unlike KZG which needs pairings)
- Has logarithmic proof size: O(log n) where n is polynomial degree
- Requires linear verifier time: O(n) but can be amortized

### Why IPA Works in Compact

Compact provides these elliptic curve primitives:
```compact
ecAdd(p1: CurvePoint, p2: CurvePoint): CurvePoint
ecMul(p: CurvePoint, s: Field): CurvePoint
ecMulGenerator(s: Field): CurvePoint
hashToCurve<T>(data: T): CurvePoint
```

These are **exactly** what IPA verification needs! No pairings required.

## IPA Verification Algorithm

### Proof Structure

An IPA proof for opening polynomial P(x) at point z consists of:

```compact
export struct IPAProof {
  // Cross-term curve points from recursive compression (log₂(degree) rounds)
  L: Vector<k, CurvePoint>,  // Left cross-terms
  R: Vector<k, CurvePoint>,  // Right cross-terms

  // Final scalar after compression
  final_scalar: Bytes<32>,   // Field element

  // Evaluation point and claimed value
  z: Bytes<32>,              // Point where polynomial is evaluated
  v: Bytes<32>               // Claimed P(z) = v
}
```

For EZKL proofs over 64-bit range, k = log₂(64) = 6 rounds.

### Verification Equation

The verifier computes:

```
Q = Σ(j=1 to k) [u_j²]·L_j + P + Σ(j=1 to k) [u_j^(-2)]·R_j
```

Where:
- `u_j` are Fiat-Shamir challenges derived from transcript
- `P` is the polynomial commitment (from proof)
- `L_j, R_j` are cross-terms provided by prover

Then checks: `Q == [final_scalar]·G`

### Compact Implementation Outline

```compact
export pure circuit verify_ipa_opening(
  commitment: CurvePoint,
  proof: IPAProof
): Boolean {

  // Step 1: Generate Fiat-Shamir challenges
  const challenges = generate_ipa_challenges(
    commitment,
    proof.L,
    proof.R,
    proof.z
  );

  // Step 2: Compute Q = Σ[u_j²]L_j + P + Σ[u_j^(-2)]R_j
  // (Loop unrolled for k=6 rounds)

  const u_0 = challenges[0];
  const u_0_sq = field_multiply(u_0, u_0);
  const u_0_inv_sq = field_inverse(u_0_sq);
  const L_term_0 = ecMul(proof.L[0], u_0_sq);
  const R_term_0 = ecMul(proof.R[0], u_0_inv_sq);
  const Q_0 = ecAdd(ecAdd(commitment, L_term_0), R_term_0);

  // ... unroll iterations 1-5 ...

  const Q = Q_5;  // Final accumulated value

  // Step 3: Verify Q == [final_scalar]·G
  const G = ecMulGenerator(transientHash<Uint<8>>(1 as Uint<8>));
  const expected = ecMul(G, bytes_to_field(proof.final_scalar));

  return curve_points_equal(Q, expected);
}
```

## Implementation Roadmap

### Phase 1: EZKL IPA Configuration (2-4 hours)

**File:** `zkml/payroll/generate_all_models.py`

**Changes:**
```python
def run_ezkl_workflow(name, num_inputs):
    """Run complete EZKL workflow for a model"""
    print(f"   → gen-settings...")
    py_run_args = ezkl.PyRunArgs()
    py_run_args.input_visibility = "private"
    py_run_args.output_visibility = "public"
    py_run_args.param_visibility = "fixed"
    py_run_args.input_scale = 14
    py_run_args.commitment = "ipa"  # <-- ADD THIS LINE!

    ezkl.gen_settings(...)

    # Also update get_srs call:
    ezkl.get_srs(settings_path, srs_path, commitment="ipa")  # <-- ADD commitment
```

**Testing:**
```bash
cd zkml/payroll
uv run python generate_all_models.py
# Verify settings.json now shows "commitment":"IPA"
```

### Phase 2: IPA Verifier Circuit (1-2 days)

**File:** `payroll-commons/IPAVerifier.compact` (NEW)

**Key Components:**
1. `IPAProof` struct definition
2. `verify_ipa_opening()` - Main verification circuit
3. `generate_ipa_challenges()` - Fiat-Shamir challenge generation
4. Helper functions (similar to BulletproofVerifier.compact)

**Reference:** Use existing `BulletproofVerifier.compact` as template - the structure is nearly identical!

### Phase 3: Halo2 Proof Parsing (1-2 days)

**Challenge:** EZKL generates Halo2 proofs, which are complex serialized structures.

**Options:**
1. **Parse Halo2 proof in TypeScript, extract IPA components**
   - Use EZKL's proof structure to locate IPA data
   - Convert to simple struct for Compact
   - Pass to contract

2. **Use EZKL's verify API to get IPA components**
   - Modify EZKL bindings to expose IPA proof elements
   - More robust but requires EZKL fork

**Recommended:** Start with Option 1 (parsing in TypeScript)

**File:** `zkml-verifier/src/services/halo2-parser.ts` (NEW)

```typescript
export interface IPAProofData {
  commitment: CurvePoint;
  L: CurvePoint[];  // 6 elements for 64-bit
  R: CurvePoint[];  // 6 elements for 64-bit
  final_scalar: Uint8Array;
  z: Uint8Array;
  v: Uint8Array;
}

export function parseHalo2IPAProof(proof: Buffer): IPAProofData {
  // Parse serialized Halo2 proof
  // Extract IPA commitment opening proof components
  // Return structured data for Compact
}
```

### Phase 4: Contract Integration (1 day)

**File:** `payroll-contract/src/payroll.compact`

**Changes:**
```compact
import "../../payroll-commons/IPAVerifier" prefix IPA_;

export circuit submit_income_proof_trustless(
  employee_id: Bytes<32>,
  proof_type: Uint<8>,
  ezkl_proof: IPA_IPAProof,  // Full IPA proof structure
  public_inputs: Vector<10, Bytes<32>>,  // ZKML public outputs
  history_commitment: Bytes<32>,
  timestamp: Uint<32>,
  expires_in: Uint<32>
): Boolean {

  // 1. Verify IPA opening (fully on-chain, trustless!)
  const ipa_valid = IPA_verify_ipa_opening(
    ezkl_proof.commitment,
    ezkl_proof
  );

  // 2. Verify public inputs match claimed values
  const inputs_match = verify_public_inputs(
    ezkl_proof.v,  // Polynomial evaluation
    public_inputs,
    proof_type
  );

  // 3. Bind to payment history
  const history_bound = verify_history_commitment(
    history_commitment,
    employee_id
  );

  // 4. All checks must pass
  const valid = ipa_valid && inputs_match && history_bound;

  // 5. If valid, update income proof registry
  if (valid) {
    // ... same as before ...
  }

  return valid;
}
```

### Phase 5: API Integration (1 day)

**File:** `zkml-verifier/src/services/verifier.ts`

**Changes:**
```typescript
import { parseHalo2IPAProof } from './halo2-parser.js';

async function verifyAndCreateAttestation(...) {
  // 1. Generate EZKL proof with IPA (already done via settings)
  const proof = await generateEZKLProof(...);

  // 2. Parse IPA components from Halo2 proof
  const ipaData = parseHalo2IPAProof(proof.proof);

  // 3. NO VERIFIER SIGNATURE NEEDED! Proof is self-verifying on-chain

  // 4. Return IPA proof data for contract submission
  return {
    ipa_proof: ipaData,
    public_inputs: proof.instances,
    timestamp: Date.now()
  };
}
```

### Phase 6: End-to-End Testing (1 day)

**Test Scenarios:**
1. Generate IPA-based EZKL proof for income threshold
2. Parse IPA proof components
3. Submit to contract
4. Verify on-chain validation succeeds
5. Attempt invalid proof - verify rejection

**Test Files:**
- `zkml-verifier/tests/ipa-integration.test.ts`
- `payroll-api/tests/trustless-verification.test.ts`

## Benefits of IPA Approach

### Security Benefits
✅ **Zero Trust:** No reliance on off-chain verifier
✅ **On-Chain Verification:** All validation happens in Compact circuit
✅ **Cryptographic Security:** Same security as EZKL proof itself
✅ **Tamper-Proof:** Cannot fake or manipulate proof components

### Implementation Benefits
✅ **Reuse Existing Structure:** BulletproofVerifier.compact serves as template
✅ **No External Dependencies:** All cryptography in Compact
✅ **Deterministic:** Same proof always produces same result
✅ **Auditable:** Verification logic visible in contract code

### User Experience Benefits
✅ **Simpler Flow:** No verifier service needed
✅ **Lower Latency:** Direct proof submission to contract
✅ **Cost Effective:** One transaction instead of two (proof + attestation)
✅ **Decentralized:** No centralized service to trust or maintain

## Challenges and Mitigations

### Challenge 1: Proof Parsing Complexity
**Issue:** Halo2 proofs have complex serialization format
**Mitigation:**
- Start with simple test cases
- Use EZKL's own deserialization code as reference
- Build robust parser with extensive testing

### Challenge 2: Verifier Computation Cost
**Issue:** IPA verification is O(n), not O(1) like KZG
**Mitigation:**
- For 64-bit polynomials, n is small (64 operations)
- Compact circuits are optimized for efficiency
- Gas costs in Midnight may differ from Ethereum

### Challenge 3: Proof Size
**Issue:** IPA proofs are O(log n), larger than KZG's O(1)
**Mitigation:**
- For 64-bit: 6 curve points (L_j, R_j) = ~384 bytes
- Still reasonable for blockchain submission
- Trade-off for trustlessness is worthwhile

## Comparison: IPA vs Bulletproof Hybrid

| Aspect | IPA (Recommended) | Bulletproof Hybrid |
|--------|------------------|-------------------|
| **Trust Model** | Fully trustless | Partial trust (verifier can cheat) |
| **Verification** | Full ZKML proof on-chain | Only threshold on-chain |
| **Security** | Cryptographic guarantee | Relies on verifier honesty |
| **Complexity** | Moderate (proof parsing) | Low (simple range proof) |
| **Integration** | Replace verifier entirely | Keep verifier + add Bulletproof |

**Recommendation:** Implement IPA approach. It provides complete trustlessness and aligns with the project's vision of decentralized privacy.

## Next Steps

### Immediate (This Session)
1. ✅ Investigate IPA support in EZKL (CONFIRMED!)
2. ⏳ Modify generate_all_models.py to use IPA
3. ⏳ Regenerate test models with IPA commitment

### Short-term (Next 2-3 days)
1. Implement IPAVerifier.compact circuit
2. Build Halo2 proof parser in TypeScript
3. Test IPA verification with simple polynomial

### Medium-term (Next week)
1. Integrate IPA verifier into payroll.compact
2. Update zkml-verifier service to work with IPA
3. End-to-end testing with real ZKML models
4. Performance benchmarking

### Documentation Needed
1. IPA verification specification
2. Halo2 proof parsing guide
3. Migration guide from KZG to IPA
4. Security analysis and audit trail

## References

### EZKL Documentation
- PyRunArgs commitment parameter: `py_run_args.commitment = "ipa"`
- get_srs function: `ezkl.get_srs(..., commitment="ipa")`
- PyCommitments enum: `PyCommitments.IPA`

### IPA Specification
- Halo2 Book: https://zcash.github.io/halo2/background/pc-ipa.html
- Vitalik's Halo overview: https://vitalik.ca/general/2021/11/05/halo.html
- Inner Product Arguments: https://dankradfeist.de/ethereum/2021/07/27/inner-product-arguments.html

### Implementation References
- Halo2 IPA implementation: zcash/halo2 on GitHub
- Bulletproof verification (similar structure): payroll-commons/BulletproofVerifier.compact
- Compact stdlib: ecAdd, ecMul, hashToCurve primitives

## Conclusion

**IPA-based verification is the correct path forward.** It achieves the original goal of trustless, decentralized ZKML verification on Midnight's blockchain without requiring any off-chain trust assumptions.

The implementation is feasible, builds on existing work (BulletproofVerifier.compact), and provides the strongest security guarantees possible.

**Estimated total implementation time:** 5-7 days for full production-ready solution.
