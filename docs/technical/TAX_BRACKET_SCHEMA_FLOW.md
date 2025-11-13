# 📊 Tax Bracket Proof Flow - Type 5

**Project:** zkSalaria - ZKML-Powered Private Payroll System
**Feature:** Tax Bracket Income Verification (Type 5)
**Purpose:** Prove income falls within specific tax bracket for government assistance programs

## Overview

Tax Bracket Proof allows employees to prove their annual income falls within a specific US federal tax bracket without revealing exact salary amounts. This is crucial for qualifying for:

- **Housing Assistance** (Section 8, low-income housing)
- **Student Loan Forgiveness** (income-driven repayment plans)
- **Tax Credits** (EITC, Child Tax Credit)
- **Healthcare Programs** (Medicaid, subsidized ACA plans)
- **Utility Assistance** (LIHEAP)
- **Food Assistance** (SNAP eligibility)

## US Federal Tax Brackets (2024, Single Filer)

```
Bracket 1 (10%):   $0 - $11,600
Bracket 2 (12%):   $11,601 - $47,150
Bracket 3 (22%):   $47,151 - $100,525
Bracket 4 (24%):   $100,526 - $191,950
Bracket 5 (32%):   $191,951 - $243,725
Bracket 6 (35%):   $243,726 - $609,350
Bracket 7 (37%):   $609,351+
```

## Proof Type 5: TAX_BRACKET_PROOF

**What it proves:**
- Annual income falls within specified tax bracket range [min, max]
- Qualifies for programs requiring income ≤ threshold
- WITHOUT revealing exact salary amount

**Example:**
- Employee earns $35,000/year (actual amount private)
- Generates proof: "Income within 12% bracket ($11,601 - $47,150)"
- Program requires: Income ≤ $50,000/year
- Result: ✅ Qualifies (because $47,150 < $50,000)

---

## 📊 Complete Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                          PHASE 1: SETUP (ONE-TIME)                                   │
└─────────────────────────────────────────────────────────────────────────────────────┘

    Company Admin                    Smart Contract
         │                                 │
         │  1. Register Verifier           │
         │  registerTrustedVerifier()      │
         │  - verifierPubkey               │
         │────────────────────────────────>│
         │                                 │
         │  ✅ Verifier whitelisted        │
         │<────────────────────────────────│
         │                                 │


┌─────────────────────────────────────────────────────────────────────────────────────┐
│                   PHASE 2: PROOF GENERATION (EMPLOYEE FLOW)                          │
└─────────────────────────────────────────────────────────────────────────────────────┘

    Employee                    ZKML Verifier Service              Smart Contract
       │                                │                               │
       │ 2. Request tax bracket proof   │                               │
       │    POST /api/zkml/generate-proof                               │
       │    - employeeId                │                               │
       │    - proofType: 5              │                               │
       │    - thresholdMin: 1.1601 (norm)│◄──────────────────────────────┼── Employee selects
       │    - thresholdMax: 4.7150 (norm)│                               │   tax bracket
       │    - payments: [0.29,0.29,...]  │                               │   (12% bracket)
       │    - txids: [...]              │                               │
       │    - historyCommitment         │                               │
       │    - contract_address          │                               │
       │───────────────────────────────>│                               │
       │                                │                               │
       │                                │ 3. Generate ZKML Proof        │
       │                                │    (using EZKL)               │
       │                                │    - Proves: annualized       │
       │                                │      6mo income is within     │
       │                                │      [11601, 47150]           │
       │                                │    - Returns: proof.json      │
       │                                │                               │
       │                                │ 4. Create Attestation         │
       │                                │    (CRITICAL STEP)            │
       │                                │                               │
       │                                │    // Denormalize thresholds  │
       │                                │    denormalizedMin = 11601    │
       │                                │    denormalizedMax = 47150    │
       │                                │                               │
       │                                │    attestation = {            │
       │                                │      employee_id,             │
       │                                │      proof_type: 5,           │
       │                                │      threshold_min: 11601,◄───┼── Tax bracket BOUND
       │                                │      threshold_max: 47150,    │   (denormalized)
       │                                │      txids: [...],            │
       │                                │      history_commitment,      │
       │                                │      timestamp                │
       │                                │    }                          │
       │                                │                               │
       │                                │    attestation_hash =         │
       │                                │      persistentHash(attestation)│
       │                                │                               │
       │                                │ 5. Submit to Blockchain       │
       │                                │    (Verifier does this!)      │
       │                                │                               │
       │                                │    // Update timestamp first! │
       │                                │    await update_timestamp()   │
       │                                │                               │
       │                                │    api.submitIncomeProof(     │
       │                                │      employeeId,              │
       │                                │      proofType: 5n,           │
       │                                │      thresholdMin: "11601",   │
       │                                │      thresholdMax: "47150",   │
       │                                │      txids,                   │
       │                                │      historyCommitment,       │
       │                                │      attestation_hash,        │
       │                                │      timestamp,               │
       │                                │      expiresIn: 30 days       │
       │                                │    )                          │
       │                                │───────────────────────────────>│
       │                                │                               │
       │                                │                               │ 6. Contract Validation
       │                                │                               │    (8 checks + bracket)
       │                                │                               │
       │                                │                               │ ✓ 1. Attestation hash
       │                                │                               │ ✓ 2. Proof type = 5
       │                                │                               │ ✓ 3. Verifier trusted
       │                                │                               │ ✓ 4. No replay attack
       │                                │                               │ ✓ 5. Timestamp fresh
       │                                │                               │ ✓ 6. Range validation
       │                                │                               │      (max > min)
       │                                │                               │ ✓ 7. Employee exists
       │                                │                               │ ✓ 8. History commitment
       │                                │                               │ ✓ 9. Bracket valid
       │                                │                               │      (within US tax
       │                                │                               │       brackets)
       │                                │                               │
       │                                │                               │ 7. Store proof on ledger
       │                                │                               │
       │                                │                               │    income_proofs[empId] = {
       │                                │                               │      proof_type: 5,
       │                                │                               │      threshold_min: 1.1601,
       │                                │                               │      threshold_max: 4.7150,
       │                                │                               │      attestation_hash,
       │                                │                               │      submitted_at,
       │                                │                               │      expires_at
       │                                │                               │    }
       │                                │                               │
       │                                │  ✅ Success                   │
       │                                │<───────────────────────────────│
       │                                │                               │
       │ 8. Return success response     │                               │
       │    {                           │                               │
       │      success: true,            │                               │
       │      attestation: {            │                               │
       │        attestation_hash,       │                               │
       │        timestamp               │                               │
       │      },                        │                               │
       │      bracket: "12% ($11,601-$47,150)"                          │
       │    }                           │                               │
       │<───────────────────────────────│                               │
       │                                │                               │
       │ 9. Share proof with program    │                               │
       │    (program verifies via       │                               │
       │     public contract read)      │                               │
       │                                │                               │


┌─────────────────────────────────────────────────────────────────────────────────────┐
│                   PHASE 3: VERIFICATION (PROGRAM/AGENCY FLOW)                        │
└─────────────────────────────────────────────────────────────────────────────────────┘

    Program Agent                Smart Contract (Public Read)
         │                                 │
         │ 10. Access proof URL            │
         │     /verify/{employeeId}/{hash} │
         │                                 │
         │ 11. Fetch proof from contract   │
         │     getIncomeProof(employeeId)  │
         │────────────────────────────────>│
         │                                 │
         │                                 │ 12. Return proof details
         │                                 │     - Bracket: 12%
         │                                 │     - Range: $11,601-$47,150
         │                                 │     - Submitted: Nov 12, 2025
         │                                 │     - Expires: Dec 12, 2025
         │                                 │
         │ 📊 Proof Details                │
         │<────────────────────────────────│
         │                                 │
         │ 13. [OPTIONAL] LLM Analysis     │
         │     "Does this qualify for      │
         │      housing assistance         │
         │      (requires ≤$50k)?"         │
         │                                 │
         │     LLM: "Yes! 12% bracket      │
         │     maxes at $47,150, which     │
         │     is below $50k threshold."   │
         │                                 │
         │ 14. [MANUAL] Verify requirements│
         │     verifyIncomeProof(          │
         │       employeeId,               │
         │       requiredProofType: 5,     │
         │       requiredThreshold: 50000  │
         │     )                           │
         │────────────────────────────────>│
         │                                 │
         │                                 │ 15. Verify conditions
         │                                 │     ✓ Proof exists
         │                                 │     ✓ Proof type = 5
         │                                 │     ✓ Bracket max ≤ required
         │                                 │       ($47,150 ≤ $50,000)
         │                                 │     ✓ Not expired
         │                                 │
         │ ✅ Verification result:         │
         │    "Employee qualifies"         │
         │    (bracket ≤ $50k threshold)   │
         │<────────────────────────────────│
         │                                 │
         │ 16. Approve program eligibility │
         │     (based on verified proof)   │
         │                                 │
```

---

## 🔒 Security Analysis

### Tax Bracket Validation

```compact
// Type 5: TAX_BRACKET_PROOF validation
if (proof_type == 5) {
  // 1. Validate bracket range is valid
  if (threshold_max <= threshold_min) {
    return false; // Invalid bracket
  }

  // 2. Validate bracket falls within US federal brackets
  // Must be one of the 7 official brackets
  const valid_brackets = [
    [0, 11600],           // 10%
    [11601, 47150],       // 12%
    [47151, 100525],      // 22%
    [100526, 191950],     // 24%
    [191951, 243725],     // 32%
    [243726, 609350],     // 35%
    [609351, 999999999]   // 37%
  ];

  // Check if submitted bracket matches official bracket
  bool bracket_valid = false;
  for (auto bracket : valid_brackets) {
    if (threshold_min >= bracket[0] && threshold_max <= bracket[1]) {
      bracket_valid = true;
      break;
    }
  }

  if (!bracket_valid) {
    return false; // Not a valid US tax bracket
  }
}
```

### Security Guarantees

1. **Bracket Authenticity**: Only official US federal tax brackets accepted
2. **Threshold Binding**: Cryptographically bound via attestation hash
3. **No Salary Disclosure**: Only reveals bracket range, not exact amount
4. **Verifier Trust**: Witness pattern ensures proof came from trusted verifier
5. **Freshness**: Timestamp validation (within 1 hour)
6. **No Replay**: Attestation hash stored to prevent reuse
7. **History Integrity**: Payment history commitment prevents fake data
8. **Expiration**: Proofs expire after 30 days (configurable)

---

## 📦 Data Structures

### Tax Bracket Proof (Type 5)

```compact
// Same structure as other income proofs
struct PC_IncomeProof {
  employee_id: Bytes<32>,
  proof_type: Uint<8>,              // = 5 for TAX_BRACKET
  threshold_min: Uint<64>,          // Bracket minimum (e.g., 11601)
  threshold_max: Uint<64>,          // Bracket maximum (e.g., 47150)
  txids: Vector<12, Bytes<32>>,
  history_commitment: Bytes<32>,
  attestation_hash: Bytes<32>,
  verifier_pubkey: Bytes<32>,
  submitted_at: Uint<32>,
  expires_at: Uint<32>
}
```

### Tax Bracket Metadata (UI/API Only)

```typescript
interface TaxBracketInfo {
  bracket_number: number;          // 1-7
  rate: string;                    // "12%"
  min_income: number;              // 11601
  max_income: number;              // 47150
  annual_tax_approx: number;       // Approximate tax for mid-range
  common_programs: string[];       // ["Housing Assistance", "EITC"]
}

// US Federal Tax Brackets (2024)
const TAX_BRACKETS: TaxBracketInfo[] = [
  {
    bracket_number: 1,
    rate: "10%",
    min_income: 0,
    max_income: 11600,
    annual_tax_approx: 1160,
    common_programs: ["Medicaid", "SNAP", "LIHEAP"]
  },
  {
    bracket_number: 2,
    rate: "12%",
    min_income: 11601,
    max_income: 47150,
    annual_tax_approx: 5658,
    common_programs: ["Section 8", "Student Loan Forgiveness", "EITC"]
  },
  // ... brackets 3-7
];
```

---

## 🎯 Use Cases

### 1. Housing Assistance (Section 8)

**Requirement**: Annual income ≤ 80% of Area Median Income (e.g., ≤ $50,000 in Seattle)

**Solution**:
- Employee generates TAX_BRACKET_PROOF for 12% bracket ($11,601 - $47,150)
- Housing authority verifies: $47,150 < $50,000 ✅ Qualifies
- Employee's actual salary ($35,000) remains private

### 2. Student Loan Forgiveness (IDR Plans)

**Requirement**: Discretionary income ≤ threshold for income-driven repayment

**Solution**:
- Employee proves income within 12% or 22% bracket
- Department of Education verifies bracket ≤ forgiveness cap
- Approves reduced monthly payment without seeing exact salary

### 3. Earned Income Tax Credit (EITC)

**Requirement**: Income within specific range ($0 - $63,398 for married with 3+ kids)

**Solution**:
- Employee proves bracket (10%, 12%, or 22%)
- IRS verifies bracket falls within EITC range
- Approves credit without manual income verification

### 4. Healthcare Subsidies (ACA/Medicaid)

**Requirement**: Income 100%-400% of Federal Poverty Level (varies by state)

**Solution**:
- Employee proves tax bracket matches subsidy range
- State healthcare exchange verifies eligibility
- Grants subsidy without full tax return disclosure

---

## 🤖 Optional: LLM-Enhanced Flow

See [LLM_INTEGRATION.md](./LLM_INTEGRATION.md) for details on using Qwen 3 for:
- Natural language proof requests
- Automatic bracket selection
- Eligibility analysis
- Plain-language explanations

**Example with LLM:**
```
User: "I need to prove I'm low-income for housing assistance"

LLM: "Housing assistance typically requires income ≤ 80% of Area Median Income.
      For your area, that's approximately $50,000/year. I recommend generating
      a proof for the 12% tax bracket ($11,601-$47,150), which demonstrates
      eligibility without revealing your exact salary."

→ Auto-generates TAX_BRACKET_PROOF with correct thresholds
```

---

## 🔄 Comparison with Existing Proof Types

| Proof Type | What It Proves | Reveals | Use Case |
|------------|----------------|---------|----------|
| Type 1: INCOME_ABOVE | Income ≥ X | Minimum only | Loan approval, credit cards |
| Type 2: INCOME_RANGE | X ≤ Income ≤ Y | Range | Credit products, tiered pricing |
| Type 3: AVERAGE_INCOME | 6-month avg ≥ X | Average only | Lease approval, stable income |
| Type 4: CREDIT_SCORE | Payment consistency | Score (0-850) | Creditworthiness |
| **Type 5: TAX_BRACKET** | **Income within bracket [X, Y]** | **Bracket range** | **Government programs, tax credits** |

**Key Advantage of Type 5:**
- Aligns with how government programs define eligibility (tax brackets)
- More relatable than arbitrary thresholds ("I'm in the 12% bracket")
- Standardized ranges everyone understands
- Reduces stigma (bracket vs. "low income")

---

## 📊 ZKML Model Requirements

### Input Format (Normalized)

```python
# For 12% bracket ($11,601 - $47,150 annual)
threshold_min = 11601 / 10000 = 1.1601  # Normalized
threshold_max = 47150 / 10000 = 4.7150  # Normalized

# 6 monthly payments (normalized to per-month)
payments = [0.29, 0.29, 0.29, 0.29, 0.29, 0.29]  # $2,900/mo normalized

# Model checks:
annualized = sum(payments) * 2 * 10000  # = $34,800/year
if 11601 <= annualized <= 47150:
    return True  # Within 12% bracket ✓
```

### EZKL Circuit

```python
# tax_bracket_proof.py
def tax_bracket_circuit(
    payments: list[float],      # 6 months normalized
    threshold_min: float,       # Bracket min normalized
    threshold_max: float        # Bracket max normalized
) -> bool:
    # Sum 6 months
    six_month_total = sum(payments)

    # Annualize (multiply by 2)
    annualized = six_month_total * 2

    # Denormalize (multiply by 10000)
    annual_income = annualized * 10000

    # Check if within bracket
    threshold_min_denorm = threshold_min * 10000
    threshold_max_denorm = threshold_max * 10000

    in_bracket = (annual_income >= threshold_min_denorm and
                  annual_income <= threshold_max_denorm)

    return in_bracket
```

---

## 🚀 Implementation Checklist

### Backend (Smart Contract)
- [ ] Add Type 5 validation to `submit_income_proof` circuit
- [ ] Implement tax bracket validation (7 official brackets)
- [ ] Update `verify_income_proof` to handle Type 5 range comparison
- [ ] Add bracket metadata to contract state (optional)

### ZKML (Proof Generation)
- [ ] Create `tax_bracket_proof.py` EZKL model
- [ ] Generate proof artifacts (vk.key, settings.json)
- [ ] Test with all 7 tax brackets
- [ ] Integrate with zkml-verifier service

### API (PayrollAPI)
- [ ] Add `generateTaxBracketProof()` method
- [ ] Add tax bracket constants (7 brackets)
- [ ] Update proof type enum to include Type 5
- [ ] Add helper: `getBracketFromIncome(income)`

### UI (React Frontend)
- [ ] Add "Tax Bracket" proof type to GenerateProofModal
- [ ] Add bracket selector dropdown (7 options)
- [ ] Show bracket range and rate percentage
- [ ] Add "Programs you may qualify for" hints
- [ ] Update VerifyProofPage to display bracket info
- [ ] Add bracket badge/chip to ProofVerificationCard

### Optional: LLM Integration
- [ ] See [LLM_INTEGRATION.md](./LLM_INTEGRATION.md)
- [ ] Integrate web-llm with Qwen 3
- [ ] Create LLM prompt templates
- [ ] Add natural language input UI
- [ ] Implement eligibility analysis

---

## 📚 References

- **IRS Tax Brackets**: https://www.irs.gov/filing/federal-income-tax-rates-and-brackets
- **HUD Income Limits**: https://www.huduser.gov/portal/datasets/il.html
- **EITC Eligibility**: https://www.irs.gov/credits-deductions/individuals/earned-income-tax-credit
- **Student Loan IDR**: https://studentaid.gov/manage-loans/repayment/plans/income-driven
- **ACA Subsidies**: https://www.healthcare.gov/income-and-household-information/

---

## 🔐 Privacy Guarantees

**What Remains Private:**
- ✅ Exact salary amount
- ✅ Individual monthly payments
- ✅ Company name (via employee_id hash)
- ✅ Transaction details (txids hashed)

**What Is Revealed:**
- ❌ Tax bracket range (e.g., $11,601 - $47,150)
- ❌ Bracket number (e.g., 2nd bracket, 12%)
- ❌ Proof submission date
- ❌ Expiration date

**Trade-off:** Revealing bracket range is necessary for program eligibility but still protects exact income. For example, knowing someone is in the 12% bracket only narrows their income to a $35,000+ range, not a specific amount.

---

**Last Updated**: November 13, 2025
**Version**: 1.0
**Status**: 🚧 Design Phase - Implementation Pending
