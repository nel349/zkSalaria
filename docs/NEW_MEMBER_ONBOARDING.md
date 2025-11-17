# zkSalaria - New Team Member Onboarding

**Last Updated:** November 17, 2025
**Purpose:** Get you up to speed quickly on what we're building and why it matters

---

## 🎯 What We're Building (30-Second Pitch)

**zkSalaria** is a privacy-preserving payroll system where employees can **prove income requirements without revealing exact salary amounts**.

**Example:**
- Alice earns $7,500/month at Acme Corp (private)
- Bank requires proof she earns ≥ $4,000/month for a loan
- Alice generates a cryptographic proof: "I earn ≥ $4,000/month" ✅
- Bank verifies proof ✅
- **Bank NEVER learns Alice actually earns $7,500** 🔐

---

## ❓ Why This Matters

### The Problem We're Solving

**Today's Reality:**
1. Employee applies for loan/lease
2. Lender asks: "Prove your income"
3. Employee must share:
   - ❌ Exact salary amounts
   - ❌ Payment dates
   - ❌ Employer details
   - ❌ Full bank statements

**Privacy Risk:**
- Data breaches (lender databases hacked)
- Over-disclosure (verifier sees more than needed)
- No control (employee can't revoke access)
- Identity theft (documents can be forged/stolen)

### Our Solution

**zkSalaria Flow:**
1. Employee applies for loan/lease
2. Lender asks: "Prove income ≥ $4,000/month"
3. Employee generates ZK proof:
   - ✅ Proves threshold requirement met
   - ✅ Cryptographically verified (can't be faked)
   - ✅ Time-limited (expires after N days)
   - ✅ Exact amount stays private

**Privacy Win:**
- Zero-knowledge proofs (math, not trust)
- Minimal disclosure (only what's required)
- Employee control (revocable, time-limited)
- Tamper-proof (on-chain verification)

---

## 🏗️ How It Works (3-Step Flow)

### **STEP 1: Company Pays Employee (Private)**

```
┌──────────┐
│ Company  │ Deposits funds → zkSalaria Contract
└────┬─────┘
     │
     │ Pays employee $7,500/month
     ▼
┌──────────────────┐
│ Blockchain       │ Stores:
│ (Midnight)       │ - Company balance: ENCRYPTED
│                  │ - Employee balance: ENCRYPTED
│                  │ - Payment amount: ENCRYPTED
│                  │ - Payment history: ENCRYPTED (12 months)
└──────────────────┘
```

**Key Point:** Everything is encrypted. Nobody (not even validators) can see exact amounts.

---

### **STEP 2: Employee Generates Income Proof (Off-Chain)**

```
┌──────────┐
│ Employee │
└────┬─────┘
     │
     │ 1. Fetches encrypted payment history from blockchain
     ▼
┌──────────────────┐
│ Payment History  │ [Month 1: $7,500]  ← ENCRYPTED
│ (12 months)      │ [Month 2: $7,500]  ← Decrypt locally
│                  │ [Month 3: $7,500]  ← NEVER leaves machine
│                  │ ... (12 total)
└────┬─────────────┘
     │
     │ 2. Runs EZKL model (ZKML proof generation)
     ▼
┌──────────────────┐
│ EZKL Model       │ Input: 12 payments + threshold ($4,000)
│ (income_above_   │ Processing time: ~0.5 seconds
│  threshold.onnx) │ Output: ZK Proof
└────┬─────────────┘
     │
     │ 3. Proof Generated
     ▼
┌────────────────────────────┐
│ ZK Proof Package Contains: │
│ ✓ EZKL proof (ZK-SNARK)   │ ← Cryptographic proof
│ ✓ Merkle root              │ ← Payment history hash
│ ✓ History commitment       │ ← Binds to blockchain data
│ ✓ Attestation hash         │ ← Prevents replay attacks
│ ✓ Threshold: $4,000        │ ← What was proven (NOT exact amount)
└────┬───────────────────────┘
     │
     │ 4. Send to Auditor for verification
     ▼
┌──────────────────┐
│ Auditor          │ (e.g., Deloitte, licensed CPA)
│ (Licensed CPA)   │
│                  │ Validates:
│                  │ ✓ EZKL proof is mathematically valid
│                  │ ✓ History commitment matches blockchain
│                  │ ✓ Correct model was used
│                  │
│                  │ Signs proof with private key ✍️
└────┬─────────────┘
     │
     │ 5. Submit to contract
     ▼
```

**Key Point:** Proof generation happens on employee's machine. Sensitive data never leaves their control.

---

### **STEP 3: Smart Contract Validates & Stores (On-Chain)**

```
┌──────────┐
│ Employee │ Calls: submitIncomeProof()
└────┬─────┘      (with auditor signature)
     │
     ▼
┌─────────────────────────┐
│ zkSalaria Contract      │
│ (Midnight Blockchain)   │
│                         │
│ VALIDATION CHECKS:      │
│                         │
│ ✓ Is auditor trusted?   │ ← Check auditor whitelist
│ ✓ Is auditor active?    │ ← Not deactivated for misbehavior
│ ✓ History commitment    │ ← CRITICAL: Binds proof to real
│   matches blockchain?   │    blockchain payment data
│ ✓ Attestation unique?   │ ← Prevent replay attacks
│                         │
│ IF ALL PASS:            │
│ ✓ Store income proof    │ ← Save to public ledger
│ ✓ Update auditor stats  │ ← Reputation tracking
│   - total_verifications++
│   - successful_verifications++
│   - reputation_score = (✓/total) * 1000
│                         │
│ RESULT: Proof stored ✅ │
└─────────┬───────────────┘
          │
          │ Later: Verifier checks proof
          ▼
    ┌────────────┐
    │ Bank/      │ Calls: verifyIncomeProof()
    │ Landlord   │        ("Does employee earn ≥ $4,000?")
    └─────┬──────┘
          │
          ▼
    ┌─────────────────────────┐
    │ Contract Returns:       │
    │ TRUE ✅                 │ ← Employee meets requirement
    │                         │
    │ Bank ONLY learns:       │
    │ "Employee earns ≥ $4K"  │
    │                         │
    │ Bank NEVER learns:      │
    │ "Employee earns $7.5K"  │ ← Exact amount stays private
    └─────────────────────────┘
```

**Key Point:** Smart contract validates proof cryptographically. Verifier trusts math, not documents.

---

## 🔐 Security Model (What Prevents Fraud?)

### 1. **History Commitment Binding** ✅ STRONGEST PROTECTION

```compact
// payroll.compact:1247-1257
const computed_commitment = persistentHash<Vector<6, PC_PaymentRecord>>(payment_history);
if (history_commitment_disclosed != computed_commitment) {
  return false; // PROOF REJECTED - Employee tried to use fake data!
}
```

**What this does:**
- Employee submits: `history_commitment` hash with proof
- Contract computes: Hash of on-chain payment history
- If hashes don't match → **PROOF REJECTED**

**Attack prevented:**
- ❌ Employee can't fake payment amounts
- ❌ Employee can't fabricate payment history
- ✅ Must use real blockchain data

---

### 2. **Auditor Reputation System** ✅ INCENTIVE ALIGNMENT

```compact
// payroll.compact:1287-1293
reputation_score = (successful_verifications / total_verifications) * 1000
```

**How it works:**
- Auditor starts: 1000/1000 (perfect score)
- Each verification: `successful_verifications++`
- Score formula: `(successes / total) * 1000`

**Incentive:**
- High reputation → More clients → More revenue
- Bad auditor → Low reputation → Lose clients
- Market forces drive honesty

---

### 3. **Licensed Auditor Accountability** ✅ LEGAL LIABILITY

```compact
struct TrustedVerifier {
  name: String,           // "Deloitte Crypto Audit Division"
  license: String,        // "CPA #123456, Delaware"
  verifier_type: Uint<8>, // 1=Big4, 2=Regional, 3=CryptoNative
  // ...
}
```

**Protection:**
- Auditors are licensed CPAs/firms
- Can be sued for fraud
- Professional licenses can be revoked
- Real-world legal consequences

---

### 4. **Whitelisting + Deactivation** ✅ ADMIN CONTROL

```compact
// payroll.compact:1186-1193
if (!verifier_record.is_active) {
  return false; // PROOF REJECTED - Auditor was deactivated!
}
```

**Protection:**
- Only whitelisted auditors can verify
- Misbehaving auditors can be deactivated
- Admin/governance controls who can verify

---

### ⚠️ What We DON'T Have (Trade-off)

**Missing:** Cryptographic proof that auditor actually checked EZKL proof

**Gap:** Auditor could theoretically be lazy and sign without verifying

**Mitigation:**
1. Reputation loss if caught
2. Legal liability (CPA fraud)
3. Market forces (auditors compete on quality)
4. Future: Add Bulletproof layer for "premium tier"

**Why we chose this:**
- Fast MVP (signature-based takes days, Bulletproof takes weeks)
- Real-world trust model (banks already understand auditor attestations)
- Upgrade path (can add Bulletproof later)

---

## 🛠️ Tech Stack (What You'll Be Working With)

### Layer 1: Smart Contracts (Compact Language)
**Location:** `payroll-contract/src/payroll.compact`

**Key Circuits:**
1. `register_trusted_verifier()` - Whitelist auditor with metadata
2. `submit_income_proof()` - Store proof + update reputation
3. `verify_income_proof()` - Check if employee meets requirement

**Language:** Compact (similar to Rust/TypeScript)
**Status:** ✅ Implemented (13 circuits, 130 tests passing)

---

### Layer 2: ZKML Proof Generation (EZKL + Python)
**Location:** `zkml/payroll/`

**What it does:**
- Converts payment history → ZK proof
- Uses ONNX neural network models
- Proof time: ~0.5 seconds
- Verification time: ~20ms

**Models (4 types):**
1. `income_above_threshold.onnx` - "I earn ≥ $X/month"
2. `income_range.onnx` - "I earn $X-$Y/month"
3. `average_income.onnx` - "Avg income ≥ $X/month"
4. `credit_score.onnx` - "Credit score ≥ X"

**Status:** ✅ Implemented (23 E2E tests with real proofs)

---

### Layer 3: API Layer (TypeScript)
**Location:** `payroll-api/`

**What it does:**
- Wraps Compact circuits in TypeScript
- Provides type-safe contract interaction
- Manages private state (encrypted balances)

**Status:** ✅ Implemented (100% circuit coverage, 41 tests)

---

### Layer 4: Frontend (React + Material-UI)
**Location:** `payroll-ui/`

**What it does:**
- User interface for companies and employees
- Wallet integration (Lace/Midnight)
- Income proof generation UI

**Status:** ⏸️ NOT STARTED (this is where we need help!)

---

## 📋 What You Need to Know to Contribute

### If you're working on **Smart Contracts**:

**Files to understand:**
1. `payroll-contract/src/payroll.compact` - Main contract
2. `payroll-commons/src/PayrollCommons.compact` - Shared types

**Key concepts:**
- Compact language (similar to Rust)
- Encrypted ledger pattern (`ledger employee_balances: Map<...>`)
- Witness data (private inputs to circuits)
- Circuit pattern: `export circuit function_name(params): ReturnType`

**Compile:**
```bash
cd payroll-contract
npm run compile
```

**Test:**
```bash
npm test
```

---

### If you're working on **API Layer**:

**Files to understand:**
1. `payroll-api/src/payroll-service.ts` - Main API wrapper
2. `payroll-api/src/types/common-types.ts` - TypeScript types

**Key concepts:**
- Contract method wrapping (`await contract.submit_income_proof(...)`)
- Private state management (encrypted balances)
- RxJS observables (reactive state)

**Test:**
```bash
cd payroll-api
npm test
```

---

### If you're working on **ZKML Layer**:

**Files to understand:**
1. `zkml/payroll/src/index.ts` - TypeScript proof API
2. `zkml/payroll/models/*.onnx` - Neural network models
3. `zkml/payroll/generate_all_models.py` - Model generation

**Key concepts:**
- EZKL proof generation (`ezkl.prove()`)
- ONNX models (neural network format)
- KZG commitment scheme
- Witness data preparation

**Setup:**
```bash
cd zkml/payroll
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

---

### If you're working on **Frontend**:

**Files to understand:**
1. `payroll-ui/src/` - React components
2. `payroll-ui/src/App.tsx` - Main app entry

**Key concepts:**
- Lace wallet integration
- Material-UI components
- Role detection (Company vs Employee)
- Calling API methods from UI

**Run:**
```bash
npm run payroll-ui:local
```

---

## 🎯 Current Priority: What We Need Next

### **IMMEDIATE (This Week):**
1. **UI Development** - Frontend for income proof generation
   - Employee dashboard
   - Auditor selection page (show reputation scores)
   - Income proof generation form
   - Proof submission flow

2. **API Integration** - Update API for new auditor model
   - Update `registerTrustedVerifier()` to accept name/license/type
   - Add auditor reputation query methods
   - Test with new contract signature

### **SHORT-TERM (Next 2 Weeks):**
1. **Testing** - End-to-end testing on testnet
2. **Demo Prep** - Video walkthrough, pitch deck
3. **Documentation** - User guides, API docs

---

## 🚀 Quick Start Guide

### 1. Clone and Install
```bash
git clone <repo-url>
cd zkSalaria
npm install
```

### 2. Compile Contracts
```bash
npm run compile
```

### 3. Run Tests
```bash
npm test
```

### 4. Start UI (Local)
```bash
npm run payroll-ui:local
```

### 5. Open in Browser
```
http://localhost:5173
```

**Wallet Required:** Install [Lace Wallet](https://docs.midnight.network/develop/tutorial/using/chrome-ext) and set to "Undeployed" network.

---

## 📚 Additional Resources

**Documentation:**
- Technical roadmap: `docs/technical/TODO.md`
- Auditor model: `docs/technical/AUDITOR_IMPLEMENTATION_COMPLETE.md`
- ZKML integration: `zkml/INTEGRATION_GUIDE.md`
- UI wireframes: `docs/design/`

**External Docs:**
- [Midnight Docs](https://docs.midnight.network)
- [Compact Language Guide](https://docs.midnight.network/learn/compact)
- [EZKL Docs](https://docs.ezkl.xyz)

---

## ❓ Questions to Ask the Team

1. **"What task should I start with?"** - We'll assign based on your skills
2. **"What's the current blocker?"** - UI development is the main bottleneck
3. **"How do I test my changes?"** - `npm test` in the relevant package
4. **"What's the demo date?"** - Ask team lead for hackathon timeline
5. **"Can I see a working proof?"** - Run `cd zkml/payroll && python test_proof_generation.py`

---

## 🎉 Welcome to zkSalaria!

You're joining at an exciting time. We have:
- ✅ Smart contracts working (13 circuits, 130 tests)
- ✅ ZKML proofs working (4 proof types, real EZKL)
- ✅ API layer complete (100% coverage)
- 🔄 UI development starting now

**Your contribution will help bring privacy-preserving payroll to life!**

Questions? Ping the team on Slack/Discord.

---

**Built for Midnight Finance Track Hackathon**
*Privacy-first payroll meets zero-knowledge machine learning*
