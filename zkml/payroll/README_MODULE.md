# @zksalaria/zkml-payroll

**TypeScript module for generating and verifying zero-knowledge income proofs using EZKL.**

## Overview

This module provides a clean TypeScript API for:
- Generating ZK proofs of income without revealing exact amounts
- Verifying proofs cryptographically
- Supporting 4 different proof types for various use cases

## Architecture

```
zkml/payroll/
├── src/                          # TypeScript source code
│   ├── index.ts                  # Main exports
│   ├── types.ts                  # Type definitions
│   ├── proof-generator.ts        # Proof generation logic
│   ├── proof-verifier.ts         # Proof verification logic
│   └── models.ts                 # Model management utilities
│
├── test/
│   └── e2e.test.ts              # Real end-to-end tests
│
├── generated/                    # Pre-generated ONNX models & keys
│   ├── income_above_threshold/
│   ├── income_range/
│   ├── average_income/
│   └── credit_score/
│
├── dist/                         # Compiled JavaScript
│
└── kzg.srs                       # 4MB trusted setup file
```

## Installation

```bash
cd zkml/payroll
npm install
npm run build
```

## Usage

### Generate a Proof

```typescript
import { ProofType, generateIncomeProof } from '@zksalaria/zkml-payroll';

// Employee's 12 months of payment data
const payments = [5000, 5100, 5200, 5300, 5400, 5500, 5600, 5700, 5800, 5900, 6000, 6100];

// Generate proof that average income > $4,500
const result = await generateIncomeProof(
  ProofType.INCOME_ABOVE_THRESHOLD,
  payments,
  4500  // threshold
);

if (result.success && result.proof) {
  console.log('Proof generated:', result.proof.proofJson);
}
```

### Verify a Proof

```typescript
import { verifyIncomeProof } from '@zksalaria/zkml-payroll';

const verifyResult = await verifyIncomeProof(proof);

if (verifyResult.success && verifyResult.verified) {
  console.log('Proof is valid!');
}
```

### Proof Types

| Type | Description | Inputs |
|------|-------------|--------|
| `INCOME_ABOVE_THRESHOLD` | Prove income > threshold | 12 payments + min threshold |
| `INCOME_RANGE` | Prove income within range | 12 payments + min + max |
| `AVERAGE_INCOME` | Prove average >= threshold | 12 payments + min threshold |
| `CREDIT_SCORE` | Prove ML credit score >= threshold | 12 payments + min threshold |

## Testing

### Run Real End-to-End Tests

```bash
npm test
```

This will:
1. Generate 5 fresh ZK proofs from scratch
2. Verify each proof cryptographically
3. Validate results match expectations
4. Complete in ~3 seconds

Example output:
```
================================================================================
REAL END-TO-END TESTS: ZKML Income Proofs
================================================================================

📊 Results: 5/5 tests passed

1. ✅ PASS - Junior Dev - Above Threshold
2. ✅ PASS - Mid-Level - In Range
3. ✅ PASS - Senior - Average Income
4. ✅ PASS - Freelancer - Credit Score
5. ✅ PASS - High Earner - All Proof Types

⏱️  Total Duration: 2.81s

🎉 ALL TESTS PASSED!
```

## API Reference

### `generateIncomeProof(proofType, payments, thresholdMin, thresholdMax?)`

Generate a zero-knowledge proof.

**Parameters:**
- `proofType: ProofType` - Type of proof to generate
- `payments: number[]` - Exactly 12 monthly payment amounts
- `thresholdMin: number` - Minimum threshold value
- `thresholdMax?: number` - Maximum threshold (only for INCOME_RANGE)

**Returns:** `Promise<ProofGenerationResult>`

### `verifyIncomeProof(proof)`

Verify a zero-knowledge proof.

**Parameters:**
- `proof: ProofOutput` - The proof to verify

**Returns:** `Promise<ProofVerificationResult>`

### `ModelManager.validateModels()`

Check if all required ONNX models and keys exist.

**Returns:** `{ valid: boolean; missing: string[] }`

### `calculateCreditScore(payments)`

Calculate expected credit score for given payments (for testing).

**Parameters:**
- `payments: number[]` - 12 monthly payments

**Returns:** `number` - Credit score (300-800 range)

## Model Files

The ONNX models (`.onnx` files) and cryptographic keys are **pre-generated** and checked into the repository:

- `*.onnx` - Neural network models (5-21KB each)
- `*_pk.key` - Proving keys (138MB each) - for employees
- `*_vk.key` - Verification keys (65KB each) - for verifiers
- `*_settings.json` - EZKL configuration
- `*.compiled` - Compiled ZK circuits

### Regenerating Models (One-Time Setup)

Only needed if changing the model logic:

```bash
cd models
uv run generate-all-proof-models.py
cd ../scripts
npx tsx setup-all-models.ts
```

## Integration with zkSalaria

This module is designed to integrate with:

1. **zkml-verifier service** - Off-chain proof verification
2. **payroll smart contract** - On-chain attestation storage
3. **payroll-api** - Proof generation endpoints for employees

Example integration:

```typescript
// In employee proof generation service
import { generateIncomeProof, ProofType } from '@zksalaria/zkml-payroll';

async function createIncomeProof(employeePayments: number[], threshold: number) {
  const result = await generateIncomeProof(
    ProofType.INCOME_ABOVE_THRESHOLD,
    employeePayments,
    threshold
  );

  if (result.success && result.proof) {
    // Send to zkml-verifier for attestation
    const attestation = await submitToVerifier(result.proof);

    // Submit attestation to smart contract
    await contract.submit_income_proof(attestation);
  }
}
```

## Performance

| Operation | Time |
|-----------|------|
| Proof Generation | ~0.5s per proof |
| Proof Verification | ~0.02s per proof |
| Model Loading | < 0.1s (cached) |

## Privacy Guarantees

✅ Individual payment amounts **never leave the employee's machine**
✅ Only the ZK proof is shared (proves threshold without revealing values)
✅ Cryptographically verified - impossible to fake
✅ No trusted party needed for proof generation

## License

MIT
