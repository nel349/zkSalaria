# Example 1: Simple Threshold Proof (No ML)

**Goal:** Understand ZK proofs before adding ML complexity

## What We're Proving

```
Employee has 3 payments: [$5000, $5200, $5100]
Average = $5100

Prove: "My average income > $5000"
WITHOUT revealing: The exact amounts or the exact average
```

## The Magic of Zero-Knowledge

**Normal computation:**
```python
payments = [5000, 5200, 5100]
average = sum(payments) / 3  # = 5100
print(f"Average is {average}")  # Reveals 5100 ❌
```

**Zero-Knowledge computation:**
```python
payments = [5000, 5200, 5100]
proof = generate_zk_proof(
    computation="average > 5000",
    private_inputs=payments
)
# proof reveals: TRUE ✅
# proof hides: exact payments and exact average ✅
```

## How EZKL Works

```
Step 1: Create Computation Graph (ONNX)
┌─────────────────────────────────────┐
│  Input: [payment1, payment2, payment3]  │
│         ↓                           │
│  sum = payment1 + payment2 + payment3   │
│         ↓                           │
│  average = sum / 3                  │
│         ↓                           │
│  result = (average > threshold)     │
│         ↓                           │
│  Output: True/False                 │
└─────────────────────────────────────┘

Step 2: Convert to ZK Circuit (EZKL)
ONNX graph → ZK arithmetic circuit

Step 3: Generate Proof
Private inputs: [5000, 5200, 5100]
Public inputs: threshold = 5000
Proof: "I computed this correctly AND result = TRUE"

Step 4: Verify Proof
Verifier checks: Proof valid? YES ✅
Verifier learns: Result = TRUE
Verifier DOESN'T learn: Exact payments
```

## Files in This Example

- `generate_proof.py` - Main script
- `simple_model.onnx` - Computation graph (auto-generated)
- `input.json` - Private payment data (auto-generated)
- `proof.json` - ZK proof (auto-generated)
- `settings.json` - EZKL config (auto-generated)

## Run the Example

### Prerequisites

```bash
# Install EZKL (one-time setup)
cargo install ezkl

# Install Python dependencies
pip install torch onnx numpy
```

### Generate and Verify Proof

```bash
cd zkml/examples/01-simple-threshold
python generate_proof.py
```

**Expected Output:**
```
🔧 Step 1: Creating simple computation graph...
   Inputs: 3 payments
   Computation: average = sum(payments) / 3
   Output: is_above_threshold = (average > 5000)

✅ ONNX model saved: simple_model.onnx

🔧 Step 2: Preparing input data...
   Private inputs: [5000.0, 5200.0, 5100.0]
   Threshold: 5000.0

✅ Input data saved: input.json

🔧 Step 3: Generating ZK proof with EZKL...
   (This may take 30-60 seconds)

✅ Proof generated: proof.json

🔧 Step 4: Verifying proof...

✅ Proof verified successfully!

🎉 SUCCESS!
   Proved: average > 5000 = TRUE
   Without revealing: exact payments or exact average

📊 Proof size: ~2.5 KB
⏱️  Verification time: ~10ms
```

## Understanding the Code

### 1. Create Computation Graph (ONNX)

```python
import torch
import torch.nn as nn

class SimpleThresholdModel(nn.Module):
    def forward(self, payment1, payment2, payment3, threshold):
        # Sum the payments
        total = payment1 + payment2 + payment3
        # Calculate average
        average = total / 3.0
        # Check if above threshold
        is_above = (average > threshold).float()
        return is_above

model = SimpleThresholdModel()
torch.onnx.export(model, (...), "simple_model.onnx")
```

### 2. Prepare Private Inputs

```python
{
    "input_data": {
        "payment1": [5000.0],
        "payment2": [5200.0],
        "payment3": [5100.0],
        "threshold": [5000.0]
    }
}
```

### 3. Generate Proof with EZKL

```bash
# EZKL commands (automated in script)
ezkl gen-settings
ezkl calibrate-settings
ezkl compile-circuit
ezkl setup
ezkl gen-witness
ezkl prove
```

### 4. Verify Proof

```bash
ezkl verify
# Returns: Proof verified ✅
```

## Key Concepts

### What the Proof Proves

- ✅ The computation ran correctly (no cheating)
- ✅ The result is TRUE (average > 5000)
- ✅ The prover knows the private inputs

### What the Proof Hides

- ❌ Exact payment amounts (5000, 5200, 5100)
- ❌ Exact average (5100)
- ❌ Anything except TRUE/FALSE

### Why This Matters for zkSalaria

**Traditional verification:**
```
Employee: "I earn more than $5000/month"
Lender: "Show me your paystubs"
Employee: 😞 "Here's every payment... $5000, $5200, $5100"
Lender: 👀 "Now I know your exact salary"
```

**ZK verification:**
```
Employee: "I earn more than $5000/month. Here's a proof."
Lender: *Verifies proof* ✅
Lender: 😊 "Approved! I trust the proof."
Employee: 🎉 "You never saw my exact salary!"
```

## Next Steps

Once you understand this example:

1. **Example 2:** Add ML layer (linear regression)
2. **Example 3:** Full income prediction with XGBoost
3. **Integrate:** Add Compact circuits for on-chain verification
