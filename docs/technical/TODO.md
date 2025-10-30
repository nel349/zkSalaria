# zkSalaria Implementation Todo List

**Project:** zkSalaria - ZKML-Powered Private Payroll
**Track:** Finance - Midnight Hackathon
**Timeline:** 3 weeks (Nov 2025)

---

## Phase 0: Contract Privacy & Architecture Fixes

**CRITICAL:** Current payroll.compact has privacy vulnerabilities that must be fixed before production.

### Privacy Issues to Fix

**Problem 1: Public Balances Leak Privacy**
- [x] Current: `company_balances` and `employee_balances` are public Maps on ledger
- [ ] Fix: Move balances to witnesses (private, local storage only)
- [ ] Impact: Anyone can currently query exact salary amounts - defeats entire purpose

**Problem 2: Missing Payment History for Credit Scoring**
- [ ] Current: No payment history tracking
- [ ] Fix: Add witness for payment history: `witness employee_payment_history(employee_id) -> Vector<12, PaymentRecord>`
- [ ] Impact: ML credit scoring needs 6+ months of payment data (consistency, variance, tenure)
- [ ] Required data per payment:
  - Date/timestamp
  - Amount
  - Company ID (for verification)
  - Payment type (salary, advance, bonus)

**Problem 3: Token Flow Architecture**
- [x] Current: Minting tokens to contract's `ownPublicKey()`
- [ ] Fix: Implement proper token custody model:
  - Option A: Mint to employee wallet addresses (real Midnight transfers)
  - Option B: Escrow pattern (company deposits tokens to contract, contract distributes)
  - Option C: Hybrid (witnesses track internal balances, withdrawals transfer real tokens)
- [ ] Decision: Choose custody model based on Midnight capabilities

**Problem 4: Contract Structure Needs Separation**
- [x] Current: Monolithic payroll.compact (registration + payments + tokens)
- [ ] Fix: Split into focused contracts per architecture doc:
  - [ ] `PayrollRegistry.compact` - Company/employee identity only (hashes on ledger)
  - [ ] `PrivatePayroll.compact` - Salary transfers with witnesses
  - [ ] `PayrollTokens.compact` - Keep as helper module (already done)
  - [ ] Later: `CreditScoring.compact`, `FairPayAnalysis.compact`

**Problem 5: Missing Selective Disclosure Circuits**
- [ ] Add circuit: `prove_employment(employee_id, company_id) -> ZK proof` (for landlords)
- [ ] Add circuit: `prove_income_range(employee_id, min, max) -> ZK proof` (for lenders)
- [ ] Add circuit: `prove_payment_consistency(employee_id, threshold) -> ZK proof` (for credit)
- [ ] These enable employees to share proofs WITHOUT revealing exact amounts

### Implementation Order (Gradual)

**Step 1: Add Witnesses for Private Data**
- [ ] Define PaymentRecord struct in PayrollCommons.compact:
  ```compact
  struct PaymentRecord {
    timestamp: Uint<32>;
    amount: Uint<64>;
    company_id: Bytes<32>;
    payment_type: Uint<8>; // 0=salary, 1=advance, 2=bonus
  }
  ```
- [ ] Add witnesses to payroll.compact:
  - `witness employee_payment_history(employee_id: Bytes<32>): Vector<12, PaymentRecord>`
  - `witness employee_balance(employee_id: Bytes<32>): Uint<64>`
  - `witness company_balance(company_id: Bytes<32>): Uint<64>`
  - `witness set_employee_payment_history(employee_id, history): []`
  - `witness set_employee_balance(employee_id, balance): []`
  - `witness set_company_balance(company_id, balance): []`

**Step 2: Migrate pay_employee Circuit to Use Witnesses**
- [ ] Update `pay_employee()` to:
  1. Read balances from witnesses (not ledger)
  2. Perform transfer calculation
  3. Update witnesses with new balances
  4. Append payment to employee history witness
  5. Only update public ledger: `total_payments.increment(1)` (aggregate only)
- [ ] Remove public balance Maps from ledger state
- [ ] Test: Verify balances are NOT queryable from blockchain explorer

**Step 3: Update deposit_company_funds to Use Witnesses**
- [ ] Read company balance from witness
- [ ] Mint tokens (keep real token operations)
- [ ] Update witness with new balance
- [ ] Do NOT update public ledger balance

**Step 4: Update withdraw_employee_salary to Use Witnesses**
- [ ] Read employee balance from witness
- [ ] Burn tokens / transfer real tokens
- [ ] Update witness with new balance
- [ ] Do NOT update public ledger balance

**Step 5: Add Selective Disclosure Circuits**
- [ ] Implement `prove_employment()` - Proves employment without revealing salary
- [ ] Implement `prove_income_range()` - Proves income within range without exact amount
- [ ] Implement `prove_payment_consistency()` - Proves regular payments without amounts
- [ ] Test with external verifier (mock landlord/lender)

**Step 6: Split Contracts (If Time Permits)**
- [ ] Extract PayrollRegistry.compact (registration only)
- [ ] Create PrivatePayroll.compact (payments with witnesses)
- [ ] Update imports and test integration
- [ ] Note: Can defer to post-hackathon if pressed for time

---

## Phase 1: Core Payroll Infrastructure

### Smart Contracts - Current Status
- [x] Read and understand existing pay.compact contract structure
- [x] Create minimal payroll.compact that compiles (needs privacy fixes - see Phase 0)
- [x] Add company registration circuit
- [x] Add employee registration circuit
- [x] Add single salary payment circuit (needs witness migration - see Phase 0)
- [x] Integrate real Midnight token operations (mint/burn)
- [x] Run npm run compile - 7 circuits compiling successfully
- [ ] Create PayrollCommons.compact with zkSalaria-specific types (PaymentRecord struct)
- [ ] Add batch payment processing for multiple employees (blocked by Compact loop constraints)
- [ ] Complete Phase 0 privacy fixes before proceeding

### API Layer
- [ ] Update pay-api to work with new payroll contracts
- [ ] Test private payroll with local deployment

---

## Phase 2: ZKML Integration

### ML Models
- [ ] Set up Python zkml workspace with EZKL dependencies
- [ ] Build XGBoost credit scoring model with synthetic data
- [ ] Export model to ONNX format
- [ ] Generate ZK circuit from ONNX using EZKL

### Smart Contracts
- [ ] Create CreditScoring.compact for ZKML proof verification
- [ ] Integrate ZKML proof generation with payroll-api
- [ ] Test end-to-end: payment → ML analysis → proof → verification

---

## Phase 3: UI Development

- [ ] Update pay-ui to show credit scoring feature
- [ ] Build employee credit score checker UI

---

## Phase 4: Deployment & Demo

- [ ] Deploy contracts to Midnight testnet
- [ ] Create demo with 50 employees on testnet

---

## Current Status

**Phase:** Phase 0 - Privacy & Architecture Fixes (CRITICAL)
**Current Task:** Document privacy issues and create gradual implementation plan
**Completed:**
- ✅ Basic payroll.compact with 7 working circuits
- ✅ Token minting/burning integration
- ✅ Company/employee registration
- ✅ Basic salary payments
- ✅ Identified privacy vulnerabilities (public balances)
- ✅ Created gradual fix plan in Phase 0

**Next Steps:**
1. Create PayrollCommons.compact with PaymentRecord struct
2. Add witnesses to payroll.compact for private balances
3. Migrate pay_employee circuit to use witnesses
4. Test that balances are NOT visible on blockchain explorer

**Blockers:**
- Batch payments blocked by Compact loop constraints (need to research pattern)
- Token custody model decision needed (Option A/B/C in Phase 0)

**Timeline Risk:**
- Privacy fixes add 2-3 days to Phase 1
- Still achievable within 3-week hackathon timeline
- Priority: Working privacy > all features
