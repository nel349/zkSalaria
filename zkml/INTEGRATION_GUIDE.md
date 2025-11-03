# ZKML Integration Guide - Connecting Example 1 to zkSalaria

## Overview

This guide explains how the ZKML proof you just generated (Example 1) integrates into the real zkSalaria system.

---

## Current zkSalaria Architecture (What We Have)

### 1. Compact Contract (`payroll.compact`)

**Current State:**
```compact
// PUBLIC LEDGER STATE
export ledger employee_payment_history: Map<Bytes<32>, Vector<12, PC_PaymentRecord>>;
export ledger encrypted_employee_balances: Map<Bytes<32>, Bytes<32>>;
export ledger value_decryption_map: Map<Bytes<32>, Uint<64>>;
```

**What it stores:**
- ✅ Payment history (up to 12 payments per employee)
- ✅ Encrypted balances
- ✅ Decryption mappings

**What it does:**
- ✅ Process payments (`pay_employee`)
- ✅ Track employment records
- ✅ Handle recurring payments

**What it DOESN'T do yet:**
- ❌ Verify ZKML proofs
- ❌ Store credit approvals
- ❌ Store ML model metadata

---

### 2. PayrollAPI (`payroll-api.ts`)

**Current State:**
```typescript
interface DeployedPayrollAPI {
  // Payment operations
  payEmployee(companyId, employeeId, amount): Promise<void>
  getEmployeePaymentHistory(employeeId): Promise<PaymentRecord[]>

  // Employee operations
  addEmployee(companyId, employeeId): Promise<void>
  withdrawEmployeeSalary(employeeId, amount): Promise<void>
}
```

**What it does:**
- ✅ Wrap Compact contract calls
- ✅ Manage private state
- ✅ Handle transactions

**What it DOESN'T do yet:**
- ❌ Generate ZKML proofs
- ❌ Submit proofs to contract
- ❌ Fetch payment data for ML

---

## Where ZKML Fits In (The Integration)

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     zkSalaria Stack                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐         ┌──────────────────────┐         │
│  │   Frontend   │────────▶│   PayrollAPI (NEW)   │         │
│  │   (Employee) │         │   + ZKML Module      │         │
│  └──────────────┘         └──────────────────────┘         │
│                                     │                        │
│                                     ▼                        │
│              ┌─────────────────────────────────┐            │
│              │  EZKL Proof Generation          │            │
│              │  (runs locally on employee      │            │
│              │   computer - Example 1)         │            │
│              └─────────────────────────────────┘            │
│                                     │                        │
│                                     ▼                        │
│              ┌─────────────────────────────────┐            │
│              │  Compact Contract (ENHANCED)    │            │
│              │  + verify_credit_proof circuit  │            │
│              └─────────────────────────────────┘            │
│                                     │                        │
│                                     ▼                        │
│              ┌─────────────────────────────────┐            │
│              │  Midnight Blockchain            │            │
│              │  - Payment history              │            │
│              │  - Credit approvals             │            │
│              └─────────────────────────────────┘            │
└─────────────────────────────────────────────────────────────┘
```

---

## Connecting Example 1 to zkSalaria

### What Example 1 Proved

**Your Example 1 proof:**
```python
# Private inputs
payments = [5000, 5200, 5100]
threshold = 5000

# Generated proof
proof.json (17KB)

# What it proved
"average of 3 payments > $5000" ✓
```

**In real zkSalaria, this becomes:**
```python
# Private inputs (from Midnight blockchain)
payment_amounts = employee.get_decrypted_payment_history()  # [7500, 7500, 7200, 7800, 7500, 7500]
txids = employee.get_transaction_ids()  # [0xTX001, 0xTX002, ...]

# ML model computation
credit_score = xgboost_model.predict(payment_amounts)  # 745

# Generate ZKML proof
proof = ezkl.prove(
    witness={
        'payment_amounts': payment_amounts,
        'txids': txids,
        'private_key': employee.private_key
    },
    model='credit_model.onnx',
    pk_path='pk.key'
)

# What it proves
"My credit score > 680" ✓
"Based on REAL blockchain payments" ✓
```

---

## Integration Flow (Step by Step)

### Phase 1: Data Layer (Already Built!)

**Current State ✅:**
```compact
// payroll.compact (line 42-45)
export ledger employee_payment_history: Map<Bytes<32>, Vector<12, PC_PaymentRecord>>;

struct PaymentRecord {
  amount: Uint<64>,
  timestamp: Uint<32>,
  payment_id: Bytes<32>
}
```

**What this gives us:**
- ✅ On-chain payment history
- ✅ Verifiable transaction IDs
- ✅ Cryptographically secured

**This is the DATA SOURCE for ZKML proofs!**

---

### Phase 2: ZKML Module (Need to Build)

**New TypeScript Module: `payroll-api/src/zkml/`**

```
zkml/
├── proof-generator.ts       # Generate EZKL proofs
├── model-loader.ts          # Load ML models
├── data-transformer.ts      # Convert PaymentRecords → ML inputs
└── types.ts                 # ZKML types
```

**Example: `proof-generator.ts`**
```typescript
import * as ezkl from 'ezkl';
import type { PaymentRecord } from '@zksalaria/payroll-contract';

export class ZKMLProofGenerator {
  constructor(
    private modelPath: string,
    private pkPath: string,
    private settingsPath: string
  ) {}

  async generateCreditProof(
    payments: PaymentRecord[],
    threshold: number,
    employeePrivateKey: Uint8Array
  ): Promise<ZKMLProof> {
    // Step 1: Extract payment amounts (YOUR EXAMPLE 1 DID THIS)
    const amounts = payments.map(p => Number(p.amount));

    // Step 2: Get transaction IDs for binding to blockchain
    const txids = payments.map(p => p.payment_id);

    // Step 3: Create Merkle root (binds txids together)
    const merkleRoot = this.computeMerkleRoot(txids);

    // Step 4: Prepare witness (SAME AS EXAMPLE 1)
    const witness = {
      input_data: amounts,
      private_key: employeePrivateKey,
      txids: txids
    };

    // Step 5: Generate proof (SAME AS EXAMPLE 1)
    const proof = await ezkl.prove({
      witness: JSON.stringify(witness),
      model: this.modelPath,
      pk_path: this.pkPath,
      proof_path: 'proof.json',
      settings: this.settingsPath
    });

    // Step 6: Return proof with public inputs
    return {
      proof: proof.proof,
      publicInputs: {
        txids,
        merkleRoot,
        threshold,
        modelHash: await this.getModelHash()
      }
    };
  }

  private computeMerkleRoot(txids: string[]): string {
    // Compute Merkle root from transaction IDs
    // This binds the proof to specific blockchain transactions
    // (Implementation details...)
  }
}
```

---

### Phase 3: Enhanced API Layer

**Update `payroll-api.ts`:**

```typescript
export interface DeployedPayrollAPI {
  // ... existing methods ...

  // NEW: ZKML methods
  generateCreditProof(
    employeeId: string,
    threshold: number
  ): Promise<ZKMLProof>;

  submitCreditProof(
    proof: ZKMLProof
  ): Promise<boolean>;

  getCreditApproval(
    employeeId: string
  ): Promise<CreditApproval | null>;
}

export class PayrollAPI implements DeployedPayrollAPI {
  private zkmlGenerator?: ZKMLProofGenerator;

  // NEW: Initialize ZKML module
  async initializeZKML(modelPath: string, pkPath: string) {
    this.zkmlGenerator = new ZKMLProofGenerator(
      modelPath,
      pkPath,
      'settings.json'
    );
  }

  // NEW: Generate credit proof
  async generateCreditProof(
    employeeId: string,
    threshold: number
  ): Promise<ZKMLProof> {
    // Step 1: Fetch payment history from blockchain
    const payments = await this.getEmployeePaymentHistory(employeeId);

    // Step 2: Get employee's private key (from wallet)
    const privateKey = this.getEmployeePrivateKey(employeeId);

    // Step 3: Generate ZKML proof (YOUR EXAMPLE 1!)
    const proof = await this.zkmlGenerator.generateCreditProof(
      payments,
      threshold,
      privateKey
    );

    return proof;
  }

  // NEW: Submit proof to contract
  async submitCreditProof(proof: ZKMLProof): Promise<boolean> {
    // Call enhanced contract's verify_credit_proof circuit
    const tx = await this.deployedContract.contract.callTx.verify_credit_proof(
      proof.proof,
      proof.publicInputs.txids,
      proof.publicInputs.merkleRoot,
      proof.publicInputs.threshold,
      proof.publicInputs.modelHash
    );

    await tx.wait();
    return true;
  }
}
```

---

### Phase 4: Enhanced Compact Contract

**Add to `payroll.compact`:**

```compact
// NEW: Model registry (stores approved ML models)
export ledger credit_models: Map<Bytes<32>, ModelMetadata>;

// NEW: Credit approvals (stores verified proofs)
export ledger credit_approvals: Map<Bytes<32>, CreditApproval>;

struct ModelMetadata {
  model_hash: Bytes<32>,
  verification_key: Bytes<512>,
  name: Bytes<64>,
  published_timestamp: Uint<32>
}

struct CreditApproval {
  employee_id: Bytes<32>,
  threshold: Uint<64>,
  txids_merkle_root: Bytes<32>,
  timestamp: Uint<32>,
  expires_at: Uint<32>
}

// NEW: Verify credit proof circuit
export circuit verify_credit_proof(
  proof: Bytes<512>,
  employee_id: Bytes<32>,
  txids: Vector<6, Bytes<32>>,
  merkle_root: Bytes<32>,
  threshold: Uint<64>,
  model_hash: Bytes<32>
): Boolean {

  // STEP 1: Verify transactions exist on blockchain
  // This ensures proof used REAL payment data
  const payment_history = employee_payment_history.lookup(disclose(employee_id));
  assert(payment_history.exists, "No payment history");

  for txid in txids {
    // Verify each txid is in employee's payment history
    const found = false;
    for record in payment_history.data {
      if (record.payment_id == txid) {
        found = true;
      }
    }
    assert(found, "Transaction not in history");
  }

  // STEP 2: Verify Merkle root
  // This ensures txids form a consistent set
  const computed_root = compute_merkle_root(txids);
  assert(computed_root == merkle_root, "Merkle mismatch");

  // STEP 3: Verify ZK proof
  // This proves ML model was executed correctly
  const model = credit_models.lookup(disclose(model_hash));
  assert(model.exists, "Model not registered");

  const proof_valid = midnight_verify_zkproof(
    proof,
    [txids, merkle_root, threshold, model_hash],
    model.data.verification_key
  );

  assert(proof_valid, "Invalid proof");

  // STEP 4: Store approval
  const approval = CreditApproval {
    employee_id: employee_id,
    threshold: threshold,
    txids_merkle_root: merkle_root,
    timestamp: current_timestamp,
    expires_at: current_timestamp + 2592000u32  // 30 days
  };

  credit_approvals.insert(
    disclose(employee_id),
    disclose(approval)
  );

  return true;
}

// Helper: Compute Merkle root from transaction IDs
pure circuit compute_merkle_root(txids: Vector<6, Bytes<32>>): Bytes<32> {
  // Simple Merkle tree implementation
  // Hash pairs of txids until we get single root
  // (Implementation details...)
}
```

---

## End-to-End Flow (Alice Gets a Loan)

### Step 1: Alice Works and Gets Paid (Already Built!)

```typescript
// Company pays Alice (uses existing payroll-api)
await payrollAPI.payEmployee(
  'company-123',
  'alice-456',
  '7500'
);

// This stores payment in:
// - employee_payment_history on blockchain
// - Creates payment_id (transaction ID)
// - Encrypted balance updated
```

**Result:**
```compact
employee_payment_history['alice-456'] = [
  { amount: 7500, timestamp: 1730000000, payment_id: 0xTX001 },
  { amount: 7500, timestamp: 1727408000, payment_id: 0xTX002 },
  { amount: 7200, timestamp: 1724816000, payment_id: 0xTX003 },
  // ... more payments
]
```

---

### Step 2: Alice Generates Credit Proof (NEW - Example 1!)

```typescript
// Frontend: Alice clicks "Apply for Loan"
const proof = await payrollAPI.generateCreditProof(
  'alice-456',
  680  // Loan requires credit score > 680
);

// This runs LOCALLY on Alice's computer:
// 1. Fetches payment history from blockchain
// 2. Decrypts amounts with her private key
// 3. Runs EZKL proof generation (YOUR EXAMPLE 1)
// 4. Returns proof + public inputs
```

**What happens locally (same as Example 1):**
```
Alice's computer:
1. Fetch payments → [7500, 7500, 7200, 7800, 7500, 7500]
2. Run XGBoost model → credit_score = 745
3. Generate ZK proof → proof.json (17KB)
4. Proof proves: "745 > 680" ✓
```

---

### Step 3: Alice Submits Proof (NEW)

```typescript
// Frontend: Submit proof to blockchain
const success = await payrollAPI.submitCreditProof(proof);

// This calls verify_credit_proof circuit
// Contract verifies:
// ✓ Transactions exist on blockchain
// ✓ Merkle root matches
// ✓ ZK proof is valid
// ✓ Stores credit approval
```

---

### Step 4: Lender Verifies (NEW)

```typescript
// Lender checks Alice's credit approval
const approval = await payrollAPI.getCreditApproval('alice-456');

console.log(approval);
// {
//   employee_id: 'alice-456',
//   threshold: 680,
//   timestamp: 1730000000,
//   expires_at: 1732592000
// }

// Lender knows:
// ✓ Alice proved credit score > 680
// ✓ Based on real blockchain payments
// ✓ Cryptographically verified
// ✓ Approval still valid (not expired)

// Lender DOESN'T know:
// ❌ Alice's exact credit score (could be 681 or 850)
// ❌ Alice's salary amounts
// ❌ Any specific financial details

// APPROVE LOAN!
```

---

## What Needs to Be Built (Implementation Checklist)

### ✅ Already Have
- [x] Payment history storage (payroll.compact line 42-45)
- [x] Payment processing (pay_employee circuit)
- [x] API layer structure (payroll-api.ts)
- [x] Example 1 proof generation (works!)

### ❌ Need to Build

#### 1. ZKML Module (`payroll-api/src/zkml/`)
- [ ] `proof-generator.ts` - Generate EZKL proofs
- [ ] `model-loader.ts` - Load ML models
- [ ] `data-transformer.ts` - PaymentRecord → ML format
- [ ] `merkle.ts` - Merkle tree computation
- [ ] `types.ts` - ZKML TypeScript types

#### 2. Enhanced API Methods (`payroll-api.ts`)
- [ ] `initializeZKML()` - Load models
- [ ] `generateCreditProof()` - Create proofs
- [ ] `submitCreditProof()` - Submit to blockchain
- [ ] `getCreditApproval()` - Query approvals

#### 3. Enhanced Contract (`payroll.compact`)
- [ ] `credit_models` ledger
- [ ] `credit_approvals` ledger
- [ ] `verify_credit_proof()` circuit
- [ ] `compute_merkle_root()` helper
- [ ] `register_model()` circuit (for admins)

#### 4. ML Models (ZKML artifacts)
- [ ] Train XGBoost credit scoring model
- [ ] Export to ONNX
- [ ] Compile with EZKL
- [ ] Generate verification keys
- [ ] Publish model hash on-chain

---

## Next Steps (Learning Path)

### Immediate (Example 2)
Move to linear regression example to understand:
- How ML models train on data
- How trained weights get exported
- How ONNX models work

### Short-term (Example 3)
Build XGBoost credit scoring:
- Train on real payroll patterns
- Export to ZKML circuit
- Generate proofs with actual ML

### Medium-term (Integration)
Connect ZKML to zkSalaria:
- Build ZKML module
- Add API methods
- Enhance contract

### Long-term (Production)
- Model governance (upgrades)
- Performance optimization
- Multi-model support

---

## Key Takeaways

**Example 1 taught you:**
- How to generate ZK proofs with EZKL
- How proofs hide private data
- How verification works

**Real zkSalaria adds:**
- Binding to blockchain transactions (Merkle proofs)
- Smart contract verification
- ML model integrity (verification keys)
- Complete trust chain

**The core concept is the same:**
```
Example 1:  Private inputs → Computation → ZK Proof → Verification
zkSalaria:  Blockchain data → ML Model → ZK Proof → Smart Contract
```

**Both prove statements without revealing private data!**

---

Ready to move to Example 2 (add actual ML)?
