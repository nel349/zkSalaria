# ZKML Model Generation - Correct Workflow

This directory contains the ZKML model generation system for zkSalaria income proofs.

## Current System (6-Payment Models)

### Active Generator Files

1. **`generate_calibration_data.py`** - Generate calibration data
   - Creates calibration files for all 4 models
   - Uses $15K max payment values (covers $1K-$15K/month range)
   - Outputs to `calibration/` directory
   ```bash
   python3 generate_calibration_data.py
   ```

2. **`generate_all_models.py`** - Generate all ONNX models
   - Creates all 4 ZKML models (income_above_threshold, income_range, average_income, first_time_loan)
   - Uses 6-payment history per model
   - Uses EZKL Python API v22.2.4
   - Reads calibration from `calibration/` directory
   ```bash
   python3 generate_all_models.py
   ```

3. **`generate_proof.py`** - Proof generation bridge
   - Called by TypeScript to generate proofs
   - Uses EZKL Python API for witness + proof generation
   - Called internally by `src/proof-generator.ts`

### Initial Setup Workflow

```bash
# Step 1: Generate calibration data (run once or when ranges change)
python3 generate_calibration_data.py

# Step 2: Generate all models with EZKL setup
python3 generate_all_models.py

# Step 3: Test proof generation (TypeScript)
npm test
```

## Developer Workflows

### How to Modify an Existing Model

When you need to change the logic of an existing model (e.g., change the consistency calculation in first_time_loan):

1. **Update the model class** in `generate_all_models.py`
   ```python
   # Example: Modify FirstTimeLoanModel.forward()
   class FirstTimeLoanModel(nn.Module):
       def forward(self, p1, p2, p3, p4, p5, p6, threshold):
           # Your new logic here
           ...
   ```

2. **Check if calibration needs adjustment**
   - If you added new operations (division, large multiplications), you may need to adjust calibration
   - Edit `generate_calibration_data.py` if threshold ranges changed

3. **Run the full regeneration workflow**
   ```bash
   # Step 1: Regenerate calibration (if needed)
   python3 generate_calibration_data.py

   # Step 2: Regenerate the models
   python3 generate_all_models.py

   # Step 3: Update TypeScript tests if behavior changed
   # Edit test/e2e.test.ts if needed

   # Step 4: Rebuild TypeScript
   npm run build

   # Step 5: Run tests to verify
   npm test
   ```

4. **Common gotchas**
   - ⚠️ Division operations create large intermediate values (overflow risk)
   - ⚠️ Increasing ranges requires recalibration and may fail if too large
   - ⚠️ ONNX export may not support all PyTorch operations

### How to Add a New Model

When you need to add a completely new proof type (e.g., "prove employment duration"):

1. **Define the model class** in `generate_all_models.py`
   ```python
   class EmploymentDurationModel(nn.Module):
       """
       Proves: Employee has been employed for at least N months
       Inputs: 6 payments + duration_threshold
       Output: 1.0 if employed >= threshold, 0.0 otherwise
       """
       def forward(self, p1, p2, p3, p4, p5, p6, threshold):
           # Count non-zero payments
           has_payment = (p1 > 0).float() + (p2 > 0).float() + ...
           return (has_payment >= threshold).float()
   ```

2. **Add calibration for the new model** in `generate_calibration_data.py`
   ```python
   # In the models dictionary (around line 98)
   models = {
       "income_above_threshold": 1,
       "income_range": 2,
       "average_income": 1,
       "first_time_loan": 1,
       "employment_duration": 1,  # NEW MODEL
   }

   # In create_calibration_file() function (around line 76)
   elif model_name == "employment_duration":
       calibration_data["input_data"].append([6.0])  # max 6 months
   ```

3. **Add model generation** in `generate_all_models.py` main()
   ```python
   # Model 5: Employment Duration
   print("\n[5/5] Employment Duration")
   os.makedirs("generated/employment_duration", exist_ok=True)
   os.chdir("generated/employment_duration")

   model = EmploymentDurationModel()
   model.eval()
   payments = [torch.tensor([[p]], dtype=torch.float32) for p in [5000.0, 5100.0, 5200.0, 4900.0, 5000.0, 4800.0]]
   threshold = torch.tensor([[6.0]], dtype=torch.float32)

   torch.onnx.export(model, tuple(payments + [threshold]), "employment_duration.onnx", ...)

   with open("employment_duration_input.json", "w") as f:
       json.dump({"input_shapes": [[1]] * 7, "input_data": [[5000.0], [5100.0], ..., [6.0]]}, f, indent=2)

   run_ezkl_workflow("employment_duration", 7)
   os.chdir("../..")
   ```

4. **Add TypeScript enum** in `src/types.ts`
   ```typescript
   export enum ProofType {
     INCOME_ABOVE_THRESHOLD = 'income_above_threshold',
     INCOME_RANGE = 'income_range',
     AVERAGE_INCOME = 'average_income',
     FIRST_TIME_LOAN_ELIGIBILITY = 'first_time_loan',
     EMPLOYMENT_DURATION = 'employment_duration',  // NEW
   }
   ```

5. **Update proof generator** in `src/proof-generator.ts`
   - Add mapping in `MODEL_CONFIG` object
   - Add input validation for the new proof type

6. **Add tests** in `test/e2e.test.ts`
   ```typescript
   {
     name: 'Employee - Employment Duration',
     proofType: ProofType.EMPLOYMENT_DURATION,
     payments: [5000, 5100, 5200, 4900, 5000, 4800],
     thresholdMin: 6,
     expectedPass: true,
     description: 'Employee with 6 payments proves 6+ months employment'
   }
   ```

7. **Run the full workflow**
   ```bash
   # Generate calibration
   python3 generate_calibration_data.py

   # Generate all models (including new one)
   python3 generate_all_models.py

   # Rebuild TypeScript
   npm run build

   # Test
   npm test
   ```

### What Scripts to Run and When

| Scenario | Scripts to Run | Order |
|----------|---------------|-------|
| **First time setup** | 1. `python3 generate_calibration_data.py`<br>2. `python3 generate_all_models.py`<br>3. `npm install`<br>4. `npm run build`<br>5. `npm test` | Sequential |
| **Modified model logic** | 1. Edit model in `generate_all_models.py`<br>2. `python3 generate_all_models.py`<br>3. `npm run build`<br>4. `npm test` | Sequential |
| **Changed calibration ranges** | 1. Edit `generate_calibration_data.py`<br>2. `python3 generate_calibration_data.py`<br>3. `python3 generate_all_models.py`<br>4. `npm run build`<br>5. `npm test` | Sequential |
| **Added new model** | 1. Edit both Python files<br>2. `python3 generate_calibration_data.py`<br>3. `python3 generate_all_models.py`<br>4. Edit TypeScript files<br>5. `npm run build`<br>6. `npm test` | Sequential |
| **TypeScript only changes** | 1. `npm run build`<br>2. `npm test` | Sequential |
| **After git pull** | 1. `npm install` (if package.json changed)<br>2. `npm run build`<br>3. `npm test` | Sequential |

## Model Specifications

### 1. Income Above Threshold
- **Inputs**: 6 payments + threshold
- **Output**: 1.0 if total > threshold, 0.0 otherwise
- **Use case**: "Prove I earn at least $X per 6 months"
- **Supported range**: $1K-$15K/month

### 2. Income Range
- **Inputs**: 6 payments + min_threshold + max_threshold
- **Output**: 1.0 if min <= total <= max, 0.0 otherwise
- **Use case**: "Prove I earn between $X and $Y per 6 months"
- **Supported range**: $1K-$15K/month

### 3. Average Income
- **Inputs**: 6 payments + threshold
- **Output**: 1.0 if average >= threshold, 0.0 otherwise
- **Use case**: "Prove my average income is at least $X/month"
- **Supported range**: ~$1K-$5K/month (division overflow limitation)

### 4. First Time Loan Eligibility
- **Inputs**: 6 payments + consistency_threshold
- **Output**: Average salary if consistent, 0 otherwise
- **Use case**: "Prove my income is consistent (range ratio < 25%)"
- **Supported range**: $1K-$10K/month

## Directory Structure

```
payroll/
├── generate_calibration_data.py    # 1. Generate calibration
├── generate_all_models.py          # 2. Generate models
├── generate_proof.py               # 3. Proof bridge (called by TS)
├── calibration/                    # Calibration data (gitignored)
│   ├── calibration_income_above_threshold.json
│   ├── calibration_income_range.json
│   ├── calibration_average_income.json
│   └── calibration_first_time_loan.json
├── generated/                      # Generated models (gitignored)
│   ├── income_above_threshold/
│   ├── income_range/
│   ├── average_income/
│   └── first_time_loan/
└── archive/                        # Old/obsolete files
    └── old_12payment_models/
        ├── generate_first_time_loan_model.py
        └── generate_simple_consistency_model.py
```

## Range Limitations

### Why are ranges limited?

EZKL uses fixed-point arithmetic in ZK circuits. The calibration process determines the range of values the circuit can handle. Wider ranges require larger circuits and slower proofs.

### Current Supported Ranges

- **Most models**: $1,000 - $15,000/month (covers ~95% of real-world use cases)
- **Average Income**: $1,000 - $5,000/month (division overflow limitation)

### Expanding Ranges

To support higher salaries, update `generate_calibration_data.py`:

```python
# Change max_payments value (line 64)
max_payments = [30000.0] * 6  # For $30K/month support
```

⚠️ **Warning**: Higher max values = larger circuits = slower proofs

## Archived Files

The `archive/old_12payment_models/` directory contains obsolete generators for a previous 12-payment system. These are kept for reference but should not be used.

## Troubleshooting

### Calibration fails with "could not find suitable parameters"
- Reduce the max payment value in `generate_calibration_data.py`
- Current working value: $15K/month

### "Decomposition error: integer too large"
- Payment value exceeds calibrated range
- Use smaller test values or regenerate with higher calibration

### Tests fail with division overflow
- Known limitation in average_income model
- Keep test values under $5K/month for this model
