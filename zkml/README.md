# zkSalaria ZKML Integration

**Zero-Knowledge Machine Learning for Privacy-Preserving Payroll**

## 🎯 What We're Building

Employees can **prove properties about their income** (e.g., "My average salary > $5000/month") to lenders/landlords **without revealing exact payment amounts**.

## 📚 Learning Path (Build While Learning)

We'll build 3 examples, each teaching a new ZKML concept:

### Example 1: Simple Arithmetic Proof (No ML)
**Goal:** Understand ZK proofs before adding ML complexity
**Proves:** "X > Y" without revealing X
**Tools:** EZKL with simple computation graph
**Time:** 30 minutes
**Location:** `examples/01-simple-threshold/`

### Example 2: Linear Regression Proof (Basic ML)
**Goal:** Add ML layer to ZK proofs
**Proves:** "Predicted value > threshold"
**Tools:** EZKL + scikit-learn linear model
**Time:** 1 hour
**Location:** `examples/02-linear-model/`

### Example 3: Income Prediction (Actual Payroll)
**Goal:** Apply ZKML to zkSalaria payment history
**Proves:** "My predicted annual income > $60k"
**Tools:** EZKL + XGBoost + real payment data
**Time:** 2 hours
**Location:** `examples/03-income-prediction/`

## 🔧 Prerequisites

### Install EZKL

```bash
# Install Rust (if not already installed)
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Install EZKL
cargo install ezkl

# Verify installation
ezkl --version
```

### Install Python Dependencies

```bash
cd zkml
python3 -m venv venv
source venv/bin/activate
pip install torch onnx onnxruntime scikit-learn xgboost numpy pandas
```

## 🚀 Quick Start

### Step 1: Run Simple Threshold Example

```bash
cd examples/01-simple-threshold
python generate_proof.py
```

This will:
1. Create a simple computation: `score = payments_sum / 3`
2. Export to ONNX format
3. Generate ZK proof with EZKL
4. Verify the proof

**Output:**
```
✅ Proof generated: proof.json
✅ Proof verified successfully!
🎉 Proved: score > 5000 (without revealing exact score)
```

### Step 2: Run Linear Model Example

```bash
cd examples/02-linear-model
python train_and_prove.py
```

This adds ML:
1. Train simple linear regression on synthetic payroll data
2. Export model to ONNX
3. Generate proof: "Predicted income > threshold"
4. Verify

### Step 3: Run Income Prediction (Real Use Case)

```bash
cd examples/03-income-prediction
python income_predictor.py
```

This is the actual zkSalaria feature:
1. Load payment history from JSON
2. Train XGBoost credit scoring model
3. Generate proof: "Credit score > 680"
4. Prepare for on-chain submission

## 🧠 ZKML Concepts Explained

### What Happens in Each Stage?

**1. Model Training (OFF-CHAIN - Private)**
```python
# Employee's computer
model = train_xgboost(payment_history)
model.save("model.onnx")
```

**2. Proof Generation (OFF-CHAIN - Private)**
```python
# Employee's computer
proof = ezkl.prove(
    model="model.onnx",
    input_data=payment_history,
    threshold=680
)
# proof.json contains: "I ran this model correctly AND score > 680"
```

**3. Proof Verification (ON-CHAIN - Public)**
```compact
// Smart contract
circuit verify_income_proof(proof: Bytes, model_hash: Bytes<32>) {
  // Verify proof is valid
  assert(ezkl.verify(proof, model_hash));
  // Store result (YES/NO), not exact score
}
```

### Key Insights

**❌ What ZK Proofs DON'T Reveal:**
- Exact payment amounts ($5000, $5200, $5100)
- Exact credit score (720)
- Individual transactions

**✅ What ZK Proofs DO Prove:**
- Model ran correctly (no cheating)
- Score meets threshold (> 680)
- Inputs came from blockchain (txids valid)

## 📂 Directory Structure

```
zkml/
├── README.md                          # This file
├── requirements.txt                   # Python dependencies
├── examples/
│   ├── 01-simple-threshold/          # No ML, just ZK arithmetic
│   │   ├── generate_proof.py
│   │   └── README.md
│   ├── 02-linear-model/              # Basic ML + ZK
│   │   ├── train_and_prove.py
│   │   └── README.md
│   └── 03-income-prediction/         # Full zkSalaria integration
│       ├── income_predictor.py
│       ├── credit_scorer.py
│       └── README.md
├── models/                            # Trained models (ONNX)
│   ├── income_predictor.onnx
│   └── credit_scorer.onnx
└── proofs/                            # Generated proofs
    └── example_proof.json
```

## 🔗 Integration with Compact Contracts

Once we generate proofs off-chain, we submit them to the contract:

**Off-chain (Python):**
```python
# Generate proof
proof = generate_income_proof(
    payment_history=[5000, 5200, 5100],
    threshold=5000
)
# proof = { "proof": "0x...", "model_hash": "0x..." }
```

**On-chain (Compact):**
```compact
export circuit submit_income_proof(
    proof: Bytes<1024>,
    model_hash: Bytes<32>,
    threshold: Uint<64>
): Void {
    // Verify ZK proof
    let is_valid = verify_ezkl_proof(proof, model_hash);
    assert(is_valid, "Invalid ZKML proof");

    // Store result (encrypted, like balances)
    let employee_id = context.sender();
    ledger.income_proofs[employee_id] = IncomeProof {
        proof_hash: hash(proof),
        threshold: threshold,
        verified: true,
        timestamp: context.timestamp()
    };
}
```

## 📖 Next Steps

1. **Start with Example 1** - Understand ZK proofs without ML complexity
2. **Move to Example 2** - Add ML layer with simple linear model
3. **Complete Example 3** - Full income prediction for zkSalaria
4. **Integrate with Contracts** - Add Compact circuits for on-chain verification
5. **Add to API Layer** - Expose ZKML functionality via PayrollAPI

## 🎓 Resources

- [EZKL Documentation](https://docs.ezkl.xyz/)
- [ONNX Format](https://onnx.ai/)
- [XGBoost](https://xgboost.readthedocs.io/)
- [Zero-Knowledge Proofs Explained](https://z.cash/technology/zksnarks/)

## 🚨 Important Notes

- **Privacy:** ML model runs locally on employee's device, not on server
- **Verification:** Smart contract only verifies proofs, doesn't run ML
- **Encryption:** Like encrypted balances, proof results are encrypted
- **Authorization:** Uses existing `grant_income_disclosure()` circuit
