# Example 1: What Actually Happened

## The Goal
Prove: "Average of 3 payments > $5000" WITHOUT revealing the exact payment amounts

## The Data
- Payment 1: $5000
- Payment 2: $5200
- Payment 3: $5100
- Average: $5100
- Threshold: $5000
- **Result: TRUE** (average $5100 > $5000)

## The Journey (All the Attempts & Fixes)

### Attempt 1: EZKL CLI Version ❌ FAILED
**File:** `generate_proof.py` (DEPRECATED)

**Approach:** Call EZKL CLI commands via subprocess
- `ezkl gen-settings`
- `ezkl calibrate-settings`
- etc.

**Problems:**
1. CLI version (23.0.3) had serialization bugs
2. Error: "failed to ser/deser model: invalid value: integer `3040489518`"
3. Incompatibility between CLI version and compiled circuit format

**Result:** Abandoned this approach

---

### Attempt 2: EZKL Python API ✅ SUCCESS
**File:** `generate_proof_python.py` (WORKING)

**Approach:** Use EZKL Python bindings directly
```python
import ezkl
res = ezkl.gen_settings(...)
res = ezkl.calibrate_settings(...)
# etc.
```

**Fixes Required:**
1. **Made main() async** - `get_srs()` requires async/await
2. **Fixed calibrate_settings** - Wrong parameter names/order
3. **Handled gen_witness** - Returns dict, not bool (had to write witness.json manually)
4. **Avoided division** - EZKL doesn't support division, so instead of `average > threshold`, we check `total > threshold * 3` (mathematically equivalent)

**Result:** IT WORKED! Generated valid ZK proof

---

## The Proof Workflow (7 Steps)

EZKL converts your PyTorch model → ZK circuit → Proof:

1. **gen-settings** - Create EZKL configuration
2. **calibrate-settings** - Optimize for your specific model/data
3. **compile-circuit** - Convert ONNX model to ZK circuit
4. **get-srs** - Download cryptographic parameters (Structured Reference String)
5. **setup** - Generate proving key (pk.key) and verification key (vk.key)
6. **gen-witness** - Create witness from your private inputs
7. **prove** - Generate the actual ZK proof

Then: **verify** - Check if proof is valid (verifier doesn't see private inputs!)

---

## What Files Matter

### ✅ KEEP THESE (Working files)
- **generate_proof_python.py** - The working script (Python API)
- **proof.json** - THE PROOF (17KB) - This is what you'd send to a verifier
- **vk.key** - Verification key (65KB) - Verifier needs this
- **pk.key** - Proving key (132MB) - Only prover needs this
- **input.json** - Your private input data
- **network.onnx** - The model (converted to ONNX format)
- **settings.json** - EZKL configuration
- **witness.json** - Intermediate computation data
- **model.compiled** - Compiled ZK circuit

### ❌ DELETE THESE (Old/deprecated)
- **generate_proof.py** - Deprecated CLI version (doesn't work)
- **simple_model.onnx** - Old model from failed attempt
- **simple_model.onnx.data** - Old model data from failed attempt
- **network.onnx.data** - Empty file (not needed)

---

## What The Proof Actually Proves

**The Statement:**
"I have 3 payment amounts, and their average is greater than $5000"

**What The Verifier Knows:**
- ✅ The computation ran correctly
- ✅ The result is TRUE (average > $5000)
- ✅ The prover used the correct model
- ✅ The math checks out cryptographically

**What The Verifier DOESN'T Know:**
- ❌ Payment 1: $5000
- ❌ Payment 2: $5200
- ❌ Payment 3: $5100
- ❌ Exact average: $5100

**The verifier ONLY sees:**
- The proof (proof.json - 17KB)
- The verification key (vk.key - 65KB)
- The public output: "1.0" (meaning TRUE)

---

## How To Run It

```bash
cd /Users/norman/Development/midnight/zkSalaria/zkml/examples/01-simple-threshold
python generate_proof_python.py
```

It will:
1. Create the ONNX model
2. Generate all the EZKL artifacts
3. Create the proof
4. Verify the proof
5. Print a success message

**Time:** ~30-60 seconds

---

## Key Concepts Learned

1. **ZK Proofs hide inputs, not outputs** - The result is public, the inputs are private
2. **EZKL converts ML models to ZK circuits** - Your PyTorch/ONNX model becomes a proof system
3. **Proving is expensive, verification is cheap** - 132MB proving key, but only 17KB proof
4. **Arithmetic constraints matter** - No division in ZK circuits, must restructure math
5. **Python API > CLI** - More stable, better error handling

---

## What's Next

This example had NO machine learning - it was just arithmetic.

**Example 2** will add ACTUAL ML:
- Train a linear regression model on historical payroll data
- The model LEARNS patterns
- Generate proofs for the model's predictions
- Same privacy: predictions without revealing input features

But first, let's clean up this directory!
