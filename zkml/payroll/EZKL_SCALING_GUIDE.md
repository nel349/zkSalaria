# EZKL Scaling and Calibration Guide

## Problem: Division Overflow in AVERAGE_INCOME Model

### Initial Error
```
[tensor] decomposition error: integer 3334963201 is too large to be represented
by base 16384 and n 2
RuntimeError: Failed to generate witness: [graph] [halo2] General synthesis error
```

### What Was Happening

The AVERAGE_INCOME model performs division: `avg = total / 6.0`, which was causing overflow in EZKL's fixed-point arithmetic system.

## Root Cause: EZKL's Fixed-Point Arithmetic

### How EZKL Represents Numbers

EZKL uses **fixed-point arithmetic** instead of floating-point to represent numbers in zero-knowledge circuits. Numbers are stored as integers and scaled by a power of 2:

```
actual_value = stored_integer / 2^scale
```

The `input_scale` parameter determines this scaling factor.

### Maximum Representable Values

With EZKL's default configuration:
- **Base**: 16384 (2^14)
- **Legs**: 2
- **Maximum representable value**: `16384^2 = 268,435,456`

Any intermediate calculation exceeding this limit causes overflow.

## Why Our Model Failed Initially

### Original Calibration (FAILED)

**Calibration values**: 2000.0
**Result**: `input_scale: 13` (2^13 = 8192)

#### Calculation Breakdown:

1. **Input scaling**:
   - Input: 1000
   - Scaled: 1000 × 8192 = **8,192,000**

2. **Sum of 6 payments** (1000-1500 each):
   - Total: ~7500
   - Scaled: 7500 × 8192 = **61,440,000**

3. **Division by 6.0**:
   - Division in fixed-point requires intermediate values
   - Intermediate calculation: ~**3,334,963,201**
   - **OVERFLOW!** (exceeds 268,435,456 limit)

### Why the Overflow Happens in Division

Division in fixed-point arithmetic is complex:

```python
# Conceptually, division works like:
# (a / scale) / (b / scale) = (a / b) * (scale / scale)

# But EZKL needs to maintain precision:
# result = (a * scale) / b

# For our case:
# (61,440,000 * 8192) / 6 ≈ 3,334,963,201  <-- OVERFLOW!
```

The multiplication by scale before division creates values that exceed the 268M limit.

## Solution: Normalize Calibration Data

### Updated Calibration (SUCCESS)

**Calibration values**: 1.0
**Result**: `input_scale: ~7` (2^7 = 128)

#### Calculation Breakdown:

1. **Normalized inputs** (0.1-0.15):
   - Input: 0.1 (representing 1000)
   - Scaled: 0.1 × 128 = **12.8**

2. **Sum of 6 normalized payments**:
   - Total: ~0.75 (representing 7500)
   - Scaled: 0.75 × 128 = **96**

3. **Division by 6.0**:
   - Intermediate: (96 × 128) / 6 = **2,048**
   - **Success!** (well within 268M limit)

## Implementation Strategy

### 1. Calibration File Changes

**File**: `calibration/calibration_average_income.json`

```json
{
  "input_data": [
    [1.0],  // Changed from [2000.0]
    [1.0],
    [1.0],
    [1.0],
    [1.0],
    [1.0],
    [1.0]
  ]
}
```

**Impact**: EZKL automatically determines optimal `input_scale` based on calibration data range.

### 2. Test Code Changes

**File**: `payroll-contract/src/test/payroll-zkml-comprehensive.test.ts`

```typescript
// Actual payment amounts for contract (stored as-is)
const actualPayments = [1000, 1100, 1200, 1300, 1400, 1500];
const actualThreshold = 1200;

// Normalize for EZKL (divide by 10000 to get 0-1 range)
const normalizedPayments = actualPayments.map(p => p / 10000);
const normalizedThreshold = actualThreshold / 10000;

// Generate proof with normalized values
const proofResult = await generateIncomeProof(
  ProofType.AVERAGE_INCOME,
  normalizedPayments,  // [0.1, 0.11, 0.12, 0.13, 0.14, 0.15]
  normalizedThreshold  // 0.12
);

// Contract uses actual values
payroll.payEmployee(employeeId, BigInt(actualPayments[i]), 0);
payroll.submitIncomeProof(employeeId, ProofType.AVERAGE_INCOME, BigInt(actualThreshold), ...);
```

### Why This Two-Tier Approach?

1. **EZKL/ZKML Layer**: Needs normalized values (0-1) to prevent overflow
2. **Smart Contract Layer**: Uses actual dollar amounts for business logic
3. **Proof Semantics**: The proof verifies the *relationship* (average ≥ threshold), not absolute values

The normalization is transparent to the verification logic because both payments and threshold are scaled by the same factor:

```
(1000 + 1100 + ... + 1500) / 6 ≥ 1200
is equivalent to:
(0.1 + 0.11 + ... + 0.15) / 6 ≥ 0.12
```

## Comparison with EZKL Examples

### EZKL's `1l_div` Example

**File**: `ezkl/examples/onnx/1l_div/gen.py`

```python
class Circuit(nn.Module):
    def forward(self, x):
        return x / 10

# Input: 0.05301234
# Settings: input_scale: 7
```

**Key Observation**: EZKL's division examples use fractional values (0-1 range), not large integers.

## Best Practices for EZKL Models with Division

### 1. Normalize Calibration Data

**Rule**: Calibration values should be in the 0-1 or 0-10 range for models with division.

```python
# Bad - causes overflow
max_payments = [15000.0] * 6  # input_scale: 13+

# Good - prevents overflow
max_payments = [1.0] * 6      # input_scale: ~7
```

### 2. Scale Relationships Matter, Not Absolute Values

For proofs about relationships (>, <, ≥, ≤), absolute values don't matter:

```
Prove: average_income ≥ threshold

Both scale by factor F:
(payments * F) / 6 ≥ (threshold * F)  ✓ Equivalent
```

### 3. Monitor Input Scale

After calibration, check the generated settings:

```bash
cat generated/average_income/average_income_settings.json | jq '.run_args.input_scale'
```

- `input_scale ≤ 7`: Safe for division
- `input_scale = 10-12`: May work for simple operations
- `input_scale ≥ 13`: High risk of overflow with division

### 4. Test with Witness Generation First

Before running expensive proof generation:

```python
import ezkl

# Quick test - just generate witness
result = ezkl.gen_witness(
    "test_input.json",
    "model.compiled",
    "test_witness.json"
)
```

If witness generation fails with overflow, proof generation will also fail.

## Mathematical Explanation

### Why Division Requires Higher Precision

In fixed-point division `a / b`:

1. **Scale up numerator**: `a_scaled = a * 2^scale`
2. **Perform division**: `result = a_scaled / b`
3. **Maintain precision**: Requires `a_scaled` to fit in representable range

For `input_scale: 13`:
- Sum of payments: 7500 → 61,440,000 (scaled)
- Multiply for division: 61,440,000 × 8192 = **Overflow!**

For `input_scale: 7`:
- Sum of payments: 0.75 → 96 (scaled)
- Multiply for division: 96 × 128 = 12,288 ✓

### The Scaling Formula

```
max_intermediate = sum(payments) * 2^input_scale * 2^input_scale
max_representable = 16384^2 = 268,435,456

For safety:
max_intermediate < max_representable
sum(payments) * 2^(2 * input_scale) < 268,435,456
```

With `sum(payments) = 7500`:
- `input_scale = 13`: 7500 × 2^26 ≈ **503 billion** ❌
- `input_scale = 7`: 0.75 × 2^14 ≈ **12,288** ✓

## Summary

| Aspect | Before (Failed) | After (Success) |
|--------|----------------|-----------------|
| Calibration | 2000.0 | 1.0 |
| Input Scale | 13 (2^13 = 8192) | ~7 (2^7 = 128) |
| Input Values | 1000-1500 | 0.1-0.15 |
| Scaled Sum | 61,440,000 | 96 |
| Max Intermediate | 3.3 billion | 12,288 |
| Result | **Overflow** | **Success** |

## References

- EZKL Division Example: `/ezkl/examples/onnx/1l_div/`
- EZKL Settings Docs: `input_scale` controls fixed-point precision
- Halo2 Constraints: Base 16384, Legs 2 → Max value 268,435,456
