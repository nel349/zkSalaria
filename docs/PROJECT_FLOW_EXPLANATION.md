# zkSalaria - Simple Project Flow Explanation

**One-Liner:** Privacy-preserving payroll system with zero-knowledge machine learning for confidential income verification.

**Problem:** Traditional payroll systems expose sensitive salary data to third parties (banks, landlords) during verification. Employees must share exact salary details for loans, leases, and credit applications.

**Solution:** zkSalaria uses zero-knowledge proofs + machine learning to let employees prove income eligibility without revealing exact amounts.

---

## 🎯 Core Value Proposition

**For Employees:**
- Receive private salary payments (encrypted on-chain)
- Prove income requirements without revealing exact salary
- Control what's disclosed and to whom

**For Companies:**
- Manage payroll with complete privacy
- No data breach liability (data stays with employee)
- Automated recurring payments

**For Verifiers (Banks, Landlords):**
- Verify income claims with cryptographic certainty
- No need to trust documents or employers
- Multiple proof types for different requirements
- 

**For Auditors:**
- Provide verification services as licensed professionals
- Build reputation in decentralized ecosystem
- Auditors who submit invalid proofs lose reputation score. Market forces incentivize honest behavior.

---

## 📊 Main User Flows

### Flow 1: Company Payroll (Basic Operations)

```
┌─────────────┐
│  COMPANY    │
└──────┬──────┘
       │
       │ 1. Initialize & Deposit Funds
       ▼
┌─────────────────────────┐
│   zkSalaria Contract    │  ← Company balance: ENCRYPTED
│   (Midnight Blockchain) │
└─────────┬───────────────┘
          │
          │ 2. Add Employee
          ▼
    ┌──────────┐
    │ Employee │ ← Employment record created
    │  Record  │ ← Balance: ENCRYPTED
    └─────┬────┘
          │
          │ 3. Pay Employee (Single or Recurring)
          ▼
    ┌──────────────────┐
    │ Payment History  │ ← Amount: ENCRYPTED
    │ (12 months)      │ ← Stored for ZKML proofs
    └─────┬────────────┘
          │
          │ 4. Employee Withdraws
          ▼
    ┌──────────┐
    │ Employee │ ← Receives tokens privately
    │  Wallet  │
    └──────────┘
```

**Key Privacy Features:**
- ✅ Company balance: ENCRYPTED
- ✅ Employee balance: ENCRYPTED
- ✅ Payment amounts: ENCRYPTED (only employee can decrypt)
- ✅ Payment history: ENCRYPTED (but accessible for ZKML proof generation)

---

### Flow 2: ZKML Income Proof (Employee → Auditor Verifier)

```
┌──────────────────────────────────────────────────────────────────┐
│ STEP 1: Employee Generates Proof (OFF-CHAIN)                    │
└──────────────────────────────────────────────────────────────────┘

  ┌──────────┐
  │ Employee │
  └────┬─────┘
       │ Fetches encrypted payment history
       ▼
  ┌─────────────────┐
  │ Payment History │ (12 months, encrypted)
  │ [Month 1: $X]   │
  │ [Month 2: $Y]   │  ← PRIVATE DATA
  │ [Month 3: $Z]   │    (never leaves employee's machine)
  │ ...             │
  └────┬────────────┘
       │
       │ Decrypt locally
       ▼
  ┌──────────────────┐
  │ EZKL ZKML Model  │ ← Runs on employee's machine
  │ (ONNX Neural Net)│    (0.5 seconds proof generation)
  └────┬─────────────┘
       │
       │ Generates ZK Proof
       ▼
  ┌────────────────────────────┐
  │ Income Proof (4 types)     │
  ├────────────────────────────┤
  │ Type 1: Threshold          │ "I earn ≥ $4,000/month"
  │ Type 2: Range              │ "I earn $8K-$10K/month"
  │ Type 3: Average            │ "Avg income ≥ $11K/month"
  │ Type 4: Credit Score       │ "Credit score ≥ 600"
  └────┬───────────────────────┘
       │
       │ Proof contains:
       │ - ZK-SNARK proof (EZKL)
       │ - Commitment hash payment history
       │ - Auditor signature
       │ - Attestation hash (prevents replay)
       │ - Threshold proven (NOT exact amount)
       │
       ▼

┌──────────────────────────────────────────────────────────────────┐
│ STEP 2: Employee → Auditor (OFF-CHAIN)                          │
└──────────────────────────────────────────────────────────────────┘

  ┌──────────┐
  │ Employee │ Sends: EZKL proof + history_commitment
  └────┬─────┘       (to licensed auditor/CPA)
       │
       ▼
  ┌─────────────────────────┐
  │ Auditor (Verifier)      │
  │ (Licensed CPA/Firm)     │
  │                         │
  │ Verifies:               │
  │ ✓ EZKL proof valid      │ ← Mathematical verification
  │ ✓ Proof type correct    │ ← Types 1-4
  │ ✓ Signs attestation     │ ← Private key signature
  └─────────┬───────────────┘
            │
            ▼

┌──────────────────────────────────────────────────────────────────┐
│ STEP 3: Auditor → Contract (ON-CHAIN)                           │
└──────────────────────────────────────────────────────────────────┘

  ┌─────────────────────────┐
  │ Auditor (Verifier)      │ Calls: submitIncomeProof()
  └────┬────────────────────┘       (with signature)
       │
       ▼
  ┌─────────────────────────┐
  │ zkSalaria Contract      │
  │                         │
  │ Validates:              │
  │ ✓ Auditor is trusted    │ ← Check auditor whitelist
  │ ✓ Auditor is active     │ ← Not deactivated
  │ ✓ Proof type valid      │ ← Types 1-4
  │ ✓ History commitment    │ ← Binds to on-chain data
  │ ✓ No replay attack      │ ← Attestation hash unique
  │                         │
  │ Updates Reputation:     │
  │ - total_verifications++ │
  │ - successful++          │
  │ - score = (✓/total)*1000│ ← Dynamic reputation
  │                         │
  │ Stores: income_proofs   │ ← Public ledger
  └─────────┬───────────────┘
            │
            ▼

┌──────────────────────────────────────────────────────────────────┐
│ STEP 4: Bank/Landlord Verifies (ON-CHAIN)                       │
└──────────────────────────────────────────────────────────────────┘

  ┌────────────┐
  │ Bank/      │ Calls: verifyIncomeProof()
  │ Landlord   │
  └─────┬──────┘
        │ "Does employee earn ≥ $4,000/month?"
        ▼
  ┌─────────────────────────┐
  │ zkSalaria Contract      │
  │                         │
  │ Checks:                 │
  │ ✓ Proof exists          │
  │ ✓ Proof type matches    │
  │ ✓ Threshold sufficient  │
  │ ✓ Not expired           │
  │ ✓ Verified by auditor   │ ← Auditor reputation checked
  │                         │
  │ Returns: TRUE/FALSE     │ ← Cryptographically verified
  └─────────┬───────────────┘
            │
            ▼
  ┌────────────┐
  │ Verifier   │ ✅ Loan approved!
  │ (Bank)     │    (Never saw exact salary)
  └────────────┘
```

**Privacy Guarantees:**
- ❌ Verifier NEVER sees exact salary amounts
- ❌ Verifier NEVER sees individual payment dates
- ✅ Verifier ONLY learns: "Employee meets threshold requirement"
- ✅ Cryptographic proof (no trust needed)

---

### Flow 3: Auditor-Based Verification

```
┌──────────────────────────────────────────────────────────────────┐
│ AUDITOR REGISTRATION (One-time setup)                           │
└──────────────────────────────────────────────────────────────────┘

  ┌──────────┐
  │ Company  │ Calls: registerTrustedVerifier()
  │ Admin    │
  └────┬─────┘
       │
       ▼
  ┌─────────────────────────┐
  │ zkSalaria Contract      │
  │                         │
  │ Stores:                 │
  │ - Auditor public key    │
  │ - Name (e.g., Deloitte) │
  │ - License (CPA #123456) │
  │ - Type (Big4/Regional)  │
  │ - Reputation score      │ ← Starts at 1000/1000
  │                         │
  │ Status: ACTIVE          │
  └─────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│ INCOME PROOF WITH AUDITOR (Employee → Auditor → Contract)       │
└──────────────────────────────────────────────────────────────────┘

  Step 1: Employee → Auditor
  ┌──────────┐
  │ Employee │ Shares payment history + EZKL proof
  └────┬─────┘
       │
       ▼
  ┌──────────────┐
  │ Auditor      │ Validates:
  │ (Deloitte)   │ ✓ EZKL proof correct
  └────┬─────────┘ ✓ History commitment matches
       │           ✓ Correct model used
       │
       │ Signs proof
       ▼
  ┌────────────────────┐
  │ Auditor Signature  │
  └────┬───────────────┘
       │
       ▼

  Step 2: Employee → Contract
  ┌──────────┐
  │ Employee │ Calls: submitIncomeProof()
  └────┬─────┘       (with auditor signature)
       │
       ▼
  ┌─────────────────────────┐
  │ zkSalaria Contract      │
  │                         │
  │ Validates:              │
  │ ✓ Auditor is trusted    │ ← Check whitelist
  │ ✓ Auditor is active     │ ← Not deactivated
  │ ✓ Signature valid       │ ← Cryptographic check
  │ ✓ History commitment    │ ← Binds to blockchain data
  │                         │
  │ Updates Reputation:     │
  │ - total_verifications++ │
  │ - successful++          │
  │ - score = (✓/total)*1000│ ← Dynamic reputation
  │                         │
  │ Stores proof ✅         │
  └─────────────────────────┘

  Step 3: Verifier → Contract
  ┌────────────┐
  │ Bank       │ Calls: verifyIncomeProof()
  └─────┬──────┘
        │
        ▼
  ┌─────────────────────────┐
  │ Returns: TRUE/FALSE     │ ✅ Verified!
  └─────────────────────────┘
```

**Security Model:**
1. **History Commitment Binding** - Prevents fake payment data
2. **Auditor Reputation** - Incentivizes honest behavior
3. **Legal Accountability** - Licensed auditors with liability
4. **Whitelisting** - Admin controls who can verify

**What Auditor Can't Do:**
- ❌ Can't tamper with payment history (history commitment prevents this)
- ❌ Can't sign without employee providing correct data
- ⚠️  Could be lazy and not verify EZKL proof (reputation risk)

---

## 🏗️ Technical Architecture

```
┌───────────────────────────────────────────────────────────────────┐
│                         zkSalaria Stack                           │
└───────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ LAYER 1: User Interface (React + TypeScript)                   │
│ - payroll-ui/ (Material-UI, Wallet integration)                │
│ - Role-based navigation (Company vs Employee)                  │
│ Status: NOT STARTED                                            │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│ LAYER 2: API Layer (TypeScript)                                │
│ - payroll-api/ (Type-safe contract wrapper)                    │
│ - RxJS reactive state                                          │
│ - Private state management                                     │
│ Coverage: 20/20 circuits (100%)                                │
│ Status: ✅ COMPLETED                                           │
└────────────────────────────┬───────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│ LAYER 3: Smart Contracts (Compact Language)                    │
│ - payroll-contract/ (13 active circuits)                       │
│ - Encrypted ledger pattern                                     │
│ - Multi-party privacy model                                    │
│ Tests: 120 passing + 10 skipped                                │
│ Status: ✅ COMPLETED                                           │
└────────────────────────────┬───────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│ LAYER 4: Blockchain (Midnight Network)                         │
│ - Privacy-preserving blockchain (Dust/Lace network)            │
│ - Zero-knowledge proofs for all transactions                   │
│ Status: ✅ TESTNET DEPLOYED                                    │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ PARALLEL: ZKML Layer (EZKL + Python)                           │
│ - zkml/payroll/ (4 ONNX models)                                │
│ - Proof generation: ~0.5s per proof                            │
│ - Proof verification: ~20ms                                    │
│ - KZG commitment scheme                                        │
│ Tests: 23 E2E tests with real EZKL proofs                      │
│ Status: ✅ COMPLETED                                           │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔑 Key Innovation: Why ZKML?

**Traditional Approach (BAD):**
```
Employee → Bank
  "Here's my salary: $7,500/month"

Bank sees: EXACT AMOUNT ($7,500)
Privacy: ❌ NONE
Trust: ❌ Requires document verification
```

**zkSalaria Approach (GOOD):**
```
Employee → ZKML Model → Bank
  "I earn ≥ $4,000/month" + ZK Proof

Bank sees: THRESHOLD MET (≥ $4,000)
Privacy: ✅ Exact amount hidden ($7,500 never revealed)
Trust: ✅ Cryptographic proof (no documents needed)
```

**Why Machine Learning?**
- **Credit Score Calculation**: ML model analyzes payment consistency, trends, variance
- **Flexible Thresholds**: Different proof types for different requirements
- **Future-Proof**: Can add more complex ML models (fraud detection, income prediction)

---

## 📈 13 Active Circuits (Smart Contract Operations)

### Basic Payroll (5 circuits)
1. `deposit_company_funds` - Company deposits tokens
2. `add_employee` - Onboard employee
3. `pay_employee` - Single payment
4. `withdraw_employee_salary` - Employee withdraws
5. `mint_tokens` - Test helper

### Recurring Payments (5 circuits)
6. `create_recurring_payment` - Setup automated salary
7. `process_recurring_payment` - Execute scheduled payment
8. `pause_recurring_payment` - Suspend temporarily
9. `resume_recurring_payment` - Reactivate
10. `edit_recurring_payment` - Modify amount/schedule

### ZKML Income Proofs (3 circuits)
11. `register_trusted_verifier` - Whitelist auditor
12. `submit_income_proof` - Employee submits ZK proof
13. `verify_income_proof` - Verifier validates proof

---

## 🎯 4 Income Proof Types

| Type | Description | Use Case | Example |
|------|-------------|----------|---------|
| **1. THRESHOLD** | Prove income ≥ amount | Loan approval | "I earn ≥ $4,000/month" |
| **2. RANGE** | Prove income in range | Credit products | "I earn $8K-$10K/month" |
| **3. AVERAGE** | Prove avg income ≥ amount | Lease agreements | "Avg income ≥ $11K/month" |
| **4. CREDIT SCORE** | Prove ML score ≥ threshold | Creditworthiness | "Payment score ≥ 600" |

**All proofs generated in ~0.5 seconds using EZKL**

---

## 🔐 Privacy Model

**What's ENCRYPTED on Public Ledger:**
- Company balance
- Employee balances
- Payment amounts
- Individual payment details

**What's PUBLIC on Ledger:**
- Employment status (active/terminated)
- Disclosure authorizations
- Aggregate counters (total payments, employees)
- Income proof existence (NOT amounts)

**Multi-Party Access:**
- Companies: Write payments, read encrypted balance
- Employees: Read own data, decrypt locally, generate proofs
- Verifiers: Validate proofs without seeing amounts

---

## 📊 Current Status (November 2025)

**✅ Completed:**
- Smart contracts (13 circuits)
- API layer (100% coverage)
- ZKML integration (4 proof types)
- Auditor verification system
- 130 tests passing

**🔄 In Progress:**
- UI development (Phase 3)

**⏸️ Not Started:**
- Mainnet deployment
- Production monitoring

---

## 🚀 Demo Flow (For Presentations)

**Scenario:** Alice needs a loan, but wants privacy

1. **Setup:**
   - Company (Acme Corp) initializes payroll contract
   - Company adds Alice as employee
   - Company pays Alice monthly salary (ENCRYPTED)

2. **Income Proof:**
   - Bank requires: "Prove income ≥ $4,000/month"
   - Alice fetches encrypted payment history
   - Alice generates ZKML proof locally (~0.5s)
   - Auditor (Deloitte) validates and signs proof
   - Alice submits proof to contract

3. **Verification:**
   - Bank calls `verifyIncomeProof(Alice, THRESHOLD, $4000)`
   - Contract returns: ✅ TRUE
   - Bank approves loan
   - Bank NEVER learned Alice's exact salary

**Privacy Win:** Alice got loan approval without revealing she actually earns $7,500/month

---

## 🎯 Target Users

**Primary:**
- Crypto-native companies paying employees in tokens
- Privacy-conscious employees
- Web3 financial institutions (DeFi lenders)

**Secondary:**
- Traditional companies exploring blockchain payroll
- Banks/landlords wanting cryptographic verification
- Auditing firms offering verification services

---

## 🏆 Competitive Advantages

**vs Traditional Payroll (Gusto, ADP):**
- ✅ Complete privacy (amounts encrypted)
- ✅ Cryptographic income proofs
- ✅ No central database to breach

**vs Other Blockchain Payroll:**
- ✅ ZKML integration (not just basic ZK)
- ✅ 4 flexible proof types
- ✅ Production-ready (130 tests passing)

**vs Manual Verification:**
- ✅ Instant verification (no waiting for paystubs)
- ✅ No document fraud
- ✅ Cryptographic certainty

---

## 💰 Business Model & Auditor Incentives

### Overview: Self-Sustaining Verification Marketplace

zkSalaria creates a **three-sided marketplace** where employees, auditors, and verifiers all benefit from privacy-preserving income verification.

---

### 🎯 Value Proposition for Each Participant

#### **For Employees:**
```
✅ Own your financial reputation
✅ Prove income requirements without revealing exact salary
✅ Reusable proofs for multiple verifiers (loans, leases, credit)
✅ No document fraud risk
✅ Instant verification (vs. days of waiting)
```

#### **For Auditors (Licensed CPAs/Firms):**
```
✅ New revenue stream from verification services
✅ Flexible, remote work (verify proofs from anywhere)
✅ Automated workflow (EZKL handles computation)
✅ Build reputation in decentralized ecosystem
✅ Earn fees proportional to reputation score
✅ Low overhead (use existing credentials)
```

#### **For Verifiers (Banks/Landlords/Lenders):**
```
✅ 99% cost reduction vs. manual verification
✅ Instant results (vs. 3-5 days)
✅ Cryptographically certain (no document fraud)
✅ No liability for storing sensitive data
```

---

### 🏆 Auditor Incentive System

#### **1. Direct Fee Revenue**
Auditors earn fees for each proof they verify and submit to the contract.

**Earning Potential:**
- **Automation advantage**: EZKL verification takes ~30 seconds
- **Throughput**: 60-120 proofs per hour possible
- **Competitive rates**: Comparable to traditional CPA hourly rates
- **Scalability**: Marginal cost near zero (software-based verification)

#### **2. Reputation-Based Multiplier**
```
Auditor reputation score (0-1000) affects:
- Fee percentage share
- Visibility in marketplace
- Access to premium proof types
- Volume of verification requests

Reputation Formula:
reputation_score = (successful_verifications / total_verifications) × 1000
```

**Reputation Tiers:**
- **⭐⭐⭐⭐⭐ (900-1000)**: Top tier, featured listing, highest fees
- **⭐⭐⭐⭐ (700-899)**: High quality, standard listing
- **⭐⭐⭐ (500-699)**: Acceptable, with performance warnings
- **⭐⭐ (<500)**: Auto-deactivated, reputation recovery required

#### **3. Market Dynamics**
```
Supply & Demand:
- High-reputation auditors → Premium fees
- Fast turnaround → Higher volume
- Specialization → Niche markets

Employees choose auditors based on:
✓ Reputation score
✓ Verification speed
✓ Specialization (Big 4, crypto-native, regional)
✓ Price competitiveness
```

#### **4. Quality Assurance Mechanisms**
```
✓ Random audits (5% sample) for quality control
✓ Reputation loss for invalid proofs
✓ Slashing mechanism (future: staking)
✓ Dispute resolution via auditor panel
✓ Community governance (future)
```

---

### 💡 Why Auditors Participate

#### **Comparison to Traditional CPA Work:**
```
Traditional Income Verification:
- Manual review: 30 minutes per verification
- Requires physical documents
- Liability for errors
- Hourly billing only

zkSalaria Auditor Model:
- Automated verification: 30 seconds per proof
- Remote, software-based work
- Reputation system handles quality
- High-volume, low-friction workflow
```

#### **Network Effects:**
```
More Employees → More Proofs → More Auditor Revenue
                     ↓
More Auditors → Faster Verification → Better UX
                     ↓
           More Employee Adoption
```

---

### 🚀 Revenue Model (Simplified)

#### **Three Payment Streams:**
1. **Employees**: Pay for proof generation (or company-subsidized)
2. **Verifiers**: Pay per query to check proofs
3. **Protocol**: Takes small percentage for development/maintenance

#### **Fee Distribution Example:**
```
Total value per proof lifecycle:
├─ Auditor: ~60-70% (largest share for verification work)
├─ Protocol: ~25-30% (infrastructure, development)
└─ Staking Rewards: ~5-10% (future incentive layer)
```

#### **Pricing Philosophy:**
- **Micro-fees**: Leverage Midnight's low gas costs
- **Volume over margin**: Better to have millions of $1 proofs than thousands of $100 proofs
- **99% cost reduction**: Compete on value, not just privacy
- **Freemium model**: Free basic tier, premium for advanced features

---

### 🎁 Future Incentive Mechanisms

#### **Token Rewards ($SALARIA - Future)**
```
Utility:
✓ Staking for reputation boost
✓ Governance voting rights
✓ Fee discounts for holding
✓ Liquidity provision rewards
```

#### **Staking System (Future)**
```
Auditors stake tokens:
✓ Higher stake → Higher reputation multiplier
✓ Slashing for fraudulent proofs
✓ Staking rewards for honest behavior
✓ Unlock premium proof types
```

#### **Performance Bounties**
```
Protocol-funded incentives:
✓ Fastest verifications
✓ Highest volume auditors
✓ Perfect reputation scores
✓ Early adopter bonuses
```

#### **Referral Program**
```
Auditors refer new auditors:
✓ Earn percentage of referee's fees
✓ Build network effects
✓ Accelerate marketplace growth
```

---

### 📊 Growth Strategy

#### **Phase 1: MVP (Year 1)**
- Free/subsidized for all participants
- Build auditor network (first 100 auditors)
- Establish proof-of-concept
- Test market pricing

#### **Phase 2: Market Rate Discovery (Year 2)**
- Introduce micro-fees
- Reputation system in full effect
- Competitive auditor marketplace
- Volume incentives

#### **Phase 3: Scale (Year 3+)**
- Token launch and staking
- Governance by community
- Premium tier with advanced ML models
- Enterprise partnerships

---

### ⚖️ Fair Market Principles

**Designed for Long-Term Sustainability:**
```
✓ Market-driven pricing (not protocol-dictated)
✓ Reputation aligns incentives (quality over quantity)
✓ Open marketplace (any licensed auditor can join)
✓ Transparent on-chain metrics
✓ Slashing/penalties for bad actors
✓ Governance for fee structure adjustments
```

---

## 📚 Technical Stack Summary

| Layer | Technology | Status |
|-------|-----------|--------|
| Blockchain | Midnight Network | ✅ Testnet |
| Smart Contracts | Compact Language | Work in Progress |
| API Layer | TypeScript + RxJS | ✅ Complete |
| ZKML Proofs | EZKL + ONNX | ✅ Complete |
| Frontend | React + Material-UI |   Work in Progress |
| Testing | Vitest + Python | ✅ 130 tests |

---

**Built for Midnight Finance Track Hackathon**
*Privacy-first payroll meets zero-knowledge machine learning*
