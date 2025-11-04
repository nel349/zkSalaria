# zkSalaria ZKML Income Proofs

This directory contains ZKML (Zero-Knowledge Machine Learning) proof generation for salary history verification in the zkSalaria system.

## Directory Structure

```
zkml/payroll/
├── README.md                         # This file - documentation
├── kzg.srs                           # Shared KZG trusted setup (4MB) - used by all proofs
│
├── models/                           # 🔧 Source files - model generation scripts
│   ├── generate-all-proof-models.py  # Generate ONNX models for all 4 proof types
│   ├── realistic-test-data.ts        # Generate realistic 15-month payroll data
│   └── setup-all-proof-models.py     # Automate EZKL setup for all models
│
├── scripts/                          # 🚀 Utility scripts
│   ├── generate-payroll-proof.ts     # Original proof generator (legacy)
│   └── test-payroll-verification.ts  # Test proof verification
│
├── income_above_threshold/           # ✅ Proof Type 1: Income > Threshold
│   ├── income_above_threshold.onnx           # Neural network model (5KB)
│   ├── income_above_threshold.onnx.data      # Model weights (empty)
│   ├── income_above_threshold_input.json     # Sample input data
│   ├── income_above_threshold_settings.json  # EZKL configuration
│   ├── income_above_threshold.compiled       # Compiled ZK circuit (2KB)
│   ├── income_above_threshold_vk.key         # Verification key (67KB)
│   ├── income_above_threshold_pk.key         # Proving key (138MB)
│   ├── income_above_threshold_witness.json   # Witness data
│   └── income_above_threshold_proof.json     # Sample ZK proof (17KB)
│
├── income_range/                     # ✅ Proof Type 2: Min <= Income <= Max
│   └── ... (same structure as above)
│
├── average_income/                   # ✅ Proof Type 3: Average Income >= Threshold
│   └── ... (same structure as above)
│
├── credit_score/                     # ⏳ Proof Type 4: ML Credit Score >= Threshold
│   ├── credit_score.onnx             # Neural network model (21KB)
│   ├── credit_score.onnx.data        # Model weights (empty)
│   ├── credit_score_input.json       # Sample input data
│   └── credit_score_settings.json    # EZKL configuration (partially complete)
│   # Note: Setup incomplete - calibration failed, needs simpler model
│
├── legacy/                           # 📦 Old files from original simple example
│   ├── payroll-model.onnx            # Original simple model
│   ├── pk.key, vk.key                # Original keys
│   └── ... (other legacy files)
│
└── logs/                             # 📋 Build and setup logs
    └── setup.log                     # Last EZKL setup run
```

## Proof Types Implemented

### ✅ 1. INCOME_ABOVE_THRESHOLD
**Purpose**: Prove average monthly income exceeds a threshold
**Input**: 12 monthly payments + threshold
**Output**: TRUE if avg(payments) > threshold
**Status**: SETUP COMPLETE

### ✅ 2. INCOME_RANGE
**Purpose**: Prove income is within a specific range
**Input**: 12 monthly payments + min threshold + max threshold
**Output**: TRUE if min <= avg(payments) <= max
**Status**: SETUP COMPLETE

### ✅ 3. AVERAGE_INCOME
**Purpose**: Prove average income meets minimum requirement
**Input**: 12 monthly payments + threshold
**Output**: TRUE if avg(payments) >= threshold
**Status**: SETUP COMPLETE

### ⏳ 4. CREDIT_SCORE (IN PROGRESS)
**Purpose**: Prove ML-computed credit score exceeds threshold
**Input**: 12 monthly payments + threshold
**Output**: TRUE if credit_score(payments) >= threshold
**Status**: MODEL GENERATED, SETUP PENDING

**Credit Score Formula**:
- Consistency score (40%): Low standard deviation is good
- Average payment (30%): Higher is better
- Payment regularity (30%): All 12 payments present is good
- Range: 300-850 (FICO-like scoring)

## File Types Explained

### 📁 What Each File Does

| File Type | Purpose | Who Needs It | Size | Can Delete? |
|-----------|---------|--------------|------|-------------|
| `*.onnx` | Neural network model definition | Employee (prover) | 5-21KB | ❌ Keep |
| `*.onnx.data` | Model weights (usually empty) | Employee (prover) | 0B | ✅ Yes (auto-generated) |
| `*_input.json` | Sample test input data | Developer | ~200B | ✅ Yes (example only) |
| `*_settings.json` | EZKL configuration | Employee + Verifier | 1-2KB | ❌ Keep |
| `*.compiled` | Compiled ZK circuit | Employee (prover) | 2KB | ❌ Keep |
| `*_vk.key` | **Verification Key** | Verifier (lender/landlord) | 67KB | ❌ Keep for verifier |
| `*_pk.key` | **Proving Key** | Employee (prover) | 138MB | ❌ Keep for employee |
| `*_witness.json` | Witness data | Employee (prover) | 2KB | ✅ Yes (temp file) |
| `*_proof.json` | Generated ZK proof | Employee → Verifier | 17KB | ✅ Yes (example only) |
| `kzg.srs` | KZG trusted setup | Everyone | 4MB | ❌ Keep (shared) |

### 🔑 Key Files (Most Important)

**For Employees (Proof Generation)**:
- `*.onnx` - The neural network model
- `*.compiled` - The compiled ZK circuit
- `*_pk.key` - The proving key (LARGE file, 138MB)
- `kzg.srs` - Shared trusted setup

**For Lenders/Verifiers (Proof Verification)**:
- `*_vk.key` - The verification key (small, 67KB)
- `*_settings.json` - EZKL configuration

**For Smart Contract**:
- Uses verification keys to validate attestations from trusted verifiers

### 🗂️ Directory Guide

**ROOT LEVEL** (zkml/payroll/):
- `README.md` - This documentation
- `kzg.srs` - Shared by ALL proof types (don't duplicate)
- All subdirectories contain organized proof type files

**models/** - Source code for generating models:
- `generate-all-proof-models.py` - Run this to create all ONNX models
- `realistic-test-data.ts` - Generate realistic 15-month test data
- `setup-all-proof-models.py` - Automate EZKL setup for all models

**scripts/** - Utility scripts:
- `generate-payroll-proof.ts` - Legacy proof generator
- `test-payroll-verification.ts` - Test verification flow

**income_above_threshold/**, **income_range/**, **average_income/** - Complete proof systems:
- Each directory is SELF-CONTAINED with all files needed for that proof type
- Can deploy each directory independently

**credit_score/** - Incomplete (calibration failed):
- Has model files but missing keys/proofs
- Needs simpler neural network architecture

**legacy/** - Old files from original example:
- Safe to delete or keep for reference
- Not used by current system

**logs/** - Build logs:
- Safe to delete anytime
- Regenerated on next setup run

## Usage

### Generate All ONNX Models
```bash
cd models
uv run generate-all-proof-models.py
```

### Run EZKL Setup for All Models
```bash
cd models
uv run setup-all-proof-models.py
```

This will:
1. Generate settings for each model
2. Calibrate settings with input data
3. Compile circuits
4. Generate proving and verification keys
5. Create sample proofs
6. Verify proofs

**Estimated time**: 10-20 minutes for all 4 models

### Generate Individual Proof (TypeScript)
```typescript
import { generateIncomeProof } from './generate-income-proof';

const payments = [6000, 6200, 6100, 6300, 6500, 6400, 6600, 6700, 6800, 6900, 7000, 7100];
const threshold = 5000;

const proof = await generateIncomeProof({
  proofType: 'INCOME_ABOVE_THRESHOLD',
  payments,
  threshold
});

// Submit proof to smart contract
await contract.submit_income_proof(proof);
```

## Smart Contract Integration

### PayrollCommons.compact
```compact
// Proof type constants
export pure circuit PROOF_TYPE_INCOME_ABOVE_THRESHOLD(): Uint<8> { return 1 as Uint<8>; }
export pure circuit PROOF_TYPE_INCOME_RANGE(): Uint<8> { return 2 as Uint<8>; }
export pure circuit PROOF_TYPE_AVERAGE_INCOME(): Uint<8> { return 3 as Uint<8>; }
export pure circuit PROOF_TYPE_CREDIT_SCORE(): Uint<8> { return 4 as Uint<8>; }

// Income Proof struct
export struct IncomeProof {
  employee_id: Bytes<32>;
  proof_type: Uint<8>;
  threshold_min: Uint<64>;
  threshold_max: Uint<64>;
  txids: Vector<12, Bytes<32>>;
  merkle_root: Bytes<32>;
  attestation_hash: Bytes<32>;
  verifier_pubkey: Bytes<32>;
  submitted_at: Uint<32>;
  expires_at: Uint<32>;
}
```

### payroll.compact Circuits
```compact
// Submit income proof to ledger
export circuit submit_income_proof(
  employee_id: Bytes<32>,
  proof_type: Uint<8>,
  threshold_min: Uint<64>,
  threshold_max: Uint<64>,
  txids: Vector<12, Bytes<32>>,
  merkle_root: Bytes<32>,
  attestation_hash: Bytes<32>,
  verifier_pubkey: Bytes<32>,
  timestamp: Uint<64>,
  expires_in: Uint<32>
): []

// Verify employee has valid proof
export circuit verify_income_proof(
  employee_id: Bytes<32>,
  required_proof_type: Uint<8>,
  required_threshold: Uint<64>
): []
```

## Realistic Test Data

Four employee profiles with 15 months of payment history:

1. **Alice Chen (Junior Dev)**: $4,998 avg, 20 payments, $78,820 total
2. **Bob Martinez (Mid-Level)**: $7,559 avg, 20 payments, $122,643 total
3. **Carol Zhang (Senior)**: $13,556 avg, 21 payments, $233,704 total
4. **David Kim (Freelancer)**: $4,183 avg, 22 payments, $80,384 total (high variance)

Generate test data:
```bash
npx tsx models/realistic-test-data.ts
```

## EZKL Version

All proofs use **EZKL v23.0.3** for consistency.

Binary location: `/Users/norman/.ezkl/ezkl`

## Next Steps

1. ⏳ Fix CREDIT_SCORE model calibration issue
2. ⏳ Create end-to-end tests for all 4 proof types with realistic data
3. ⏳ Update zkml-verifier to support multiple proof types
4. ⏳ Create proof generation UI for employees

## Performance Metrics

### Proof Generation Time
- **INCOME_ABOVE_THRESHOLD**: ~30-60 seconds
- **INCOME_RANGE**: ~30-60 seconds
- **AVERAGE_INCOME**: ~30-60 seconds
- **CREDIT_SCORE**: TBD (more complex model)

### Proof Size
- All proofs: ~17-20KB

### Verification Time
- All proofs: ~10-50ms

## Technical Details

### Why ZKML?

Traditional income verification requires revealing exact salary amounts to lenders/landlords. ZKML allows employees to prove income thresholds or ranges WITHOUT revealing exact figures.

**Example**:
```
Employee: "I earn more than $5000/month"
Lender: *Verifies ZK proof* ✅ "Approved!"
Lender never learns: Exact salary, payment dates, or employer identity
```

### Trust Model

The smart contract trusts a designated **zkml-verifier service** to validate EZKL proofs off-chain. The verifier signs attestations that are verified on-chain.

This is a pragmatic approach since:
1. Full on-chain ZK verification of EZKL proofs is not yet supported in Compact
2. The verifier service can be run by multiple trusted parties (decentralization)
3. Attestations are cryptographically signed and cannot be forged

### Security Considerations

- **Replay Protection**: Attestation hashes are marked as "used" in the contract
- **Freshness Check**: Proofs must be generated within 1 hour of submission
- **Trusted Verifiers**: Only pre-approved verifiers can sign attestations
- **Expiration**: Proofs can have expiration dates for time-limited verification

## Troubleshooting

### "EZKL not found"
```bash
cargo install --git https://github.com/zkonduit/ezkl --tag v23.0.3 ezkl
```

### "Calibration failed"
This typically indicates the model is too complex for EZKL's current calibration. Try simplifying the neural network architecture.

### "Proof verification failed"
Ensure the zkml-verifier service is:
1. Running on the correct port (default: 3002)
2. Using the correct verification keys
3. Configured with matching EZKL version (v23.0.3)
