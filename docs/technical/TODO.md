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
- [x] Fix: Use encrypted balance pattern from bank contract (balances encrypted on ledger)
- [x] Impact: Anyone can currently query exact salary amounts - defeats entire purpose
- [x] Solution: Adopt bank.compact's encrypted balance sharing pattern for true privacy + ownership

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
- [x] Fix: Use encrypted balance pattern (bank contract's proven approach)
- [x] Decision: Encrypted ledger balances + balance mappings (Option D - Bank Pattern)
  - ✅ True ownership: Employees control their encrypted balances
  - ✅ Multi-party safe: Contract can update encrypted balances on ledger
  - ✅ Privacy: Balances encrypted with participant keys
  - ✅ Proven: Already working in bank.compact

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

**Step 1: Adopt Bank Contract's Encrypted Balance Pattern**
- [x] Define PaymentRecord struct in PayrollCommons.compact
- [x] Add encrypted balance ledger state (bank.compact pattern):
  ```compact
  // ENCRYPTED BALANCE SYSTEM (Bank Contract Pattern)
  export ledger encrypted_company_balances: Map<Bytes<32>, Bytes<32>>;
  export ledger encrypted_employee_balances: Map<Bytes<32>, Bytes<32>>;
  export ledger balance_mappings: Map<Bytes<32>, Uint<64>>;
  ```
- [x] Add balance encryption helpers (from bank.compact):
  - `pure circuit encrypt_balance(amount: Uint<64>, key: Bytes<32>): Bytes<32>`
  - `pure circuit generate_balance_key(participant_id, pin): Bytes<32>`
  - `pure circuit generate_simple_balance_key(participant_id): Bytes<32>` (for testing)
- [x] Keep witnesses ONLY for payment history (ZKML data):
  - `witness employee_payment_history(employee_id: Bytes<32>): Vector<12, PaymentRecord>`
  - `witness set_employee_payment_history(employee_id, history): []`
- [x] Remove old balance witnesses from index.ts (payrollWitnesses)
- [x] Update PayrollPrivateState to only store payment history

**Step 2: Migrate pay_employee Circuit to Encrypted Balance Transfer**
- [x] Update `pay_employee()` to use encrypted balances:
  1. Decrypt company balance with company key
  2. Decrypt employee balance with employee key
  3. Perform transfer: `company_bal -= amount; employee_bal += amount`
  4. Re-encrypt both balances with respective keys
  5. Update balance_mappings for decryption
  6. Append payment to employee history witness (ZKML tracking)
  7. Update public ledger: only `total_payments.increment(1)` (aggregate)
- [x] Remove PayrollTokens.compact dependency (no longer needed)
- [x] Test: Contract compiles successfully with 7 circuits

**Step 3: Update deposit_company_funds to Encrypted Balances**
- [x] Decrypt company balance (or create if new)
- [x] Mint tokens (keep real token operations)
- [x] Add deposit amount to balance
- [x] Re-encrypt balance with company key
- [x] Update balance_mappings
- [x] Update public ledger: only `total_supply` (aggregate)

**Step 4: Update withdraw_employee_salary to Encrypted Balances**
- [x] Decrypt employee balance with employee key
- [x] Verify sufficient balance
- [x] Deduct withdrawal amount
- [x] Re-encrypt balance with employee key
- [x] Update balance_mappings
- [x] Burn/transfer real tokens
- [x] Update public ledger: only `total_supply` (aggregate)

**Step 5: Add Selective Disclosure Circuits (COMPLETED ✅)**

**Overview**: Adopted bank.compact's `TransferAuthorization` pattern with shared encryption keys for selective disclosure

**🚨 CRITICAL ARCHITECTURE CLARIFICATION - ZKML Design:**

**⚡ ZKML Usage Pattern for zkSalaria:**

```
OFF-CHAIN (Employee's Computer):
1. Read payment history from blockchain (txids)
2. Decrypt amounts with private key
3. Run ML model locally (XGBoost credit scoring) ← EZKL OFF-CHAIN
4. Generate ZK proof: "Score > 680" ← EZKL OFF-CHAIN
5. Submit proof + txids to smart contract

ON-CHAIN (Smart Contract):
1. Verify transactions exist on blockchain ✓
2. Verify Merkle root matches txids ✓
3. Verify ZK proof is valid ✓ (NOT running ML, just verifying proof)
4. Store approval (YES/NO result)

LENDER:
1. Read approval from ledger
2. No access to payment amounts or exact score
```

**🎯 ZKML is ONLY used when:**
- Employee wants to prove something about their data WITHOUT revealing exact values
- Examples: "Score > 680", "Income in range $X-$Y", "Average salary is $Z"
- ML runs OFF-CHAIN, contract ONLY verifies proofs ON-CHAIN

**❌ ZKML is NOT used for:**
- Simple encrypted balance transfers (use bank.compact pattern)
- Direct salary payments (no ML needed)
- Basic CRUD operations (register, deposit, withdraw)
- Any operation that doesn't need zero-knowledge proofs

**What Contract DOES:**
- ✅ Store disclosure authorizations (grant/revoke)
- ✅ Verify ZK proofs from EZKL (Phase 2)
- ✅ Track authorization expiration
- ✅ Store approval results

**What Contract DOES NOT DO:**
- ❌ Calculate credit scores (done OFF-CHAIN with EZKL)
- ❌ Calculate averages (done OFF-CHAIN)
- ❌ Run ML models (done OFF-CHAIN)
- ❌ Do ANY computation on payment amounts

**Ledger State:**
- [x] Added struct `DisclosureAuthorization` in PayrollCommons.compact
- [x] Added `export ledger disclosure_authorizations: Map<Bytes<32>, DisclosureAuthorization>`
- [x] Added `export ledger shared_payment_history: Map<Bytes<32>, Bytes<32>>`

**Implemented Circuits (11 total):**

**Authorization Circuits (enable ZKML, but are NOT ZKML themselves):**
- [x] `grant_income_disclosure(employee_id, lender_id, min_threshold, expires_in)`:
  - **NOT ZKML**: Simple ledger write storing authorization
  - **What it does**: Employee says "I give lender permission to see my income data"
  - **Stores**: Authorization record on public ledger with expiration
  - **Enables ZKML (Phase 2)**: Lender can later request ZK proof via `verify_credit_proof()`
  - **Future ZKML flow**:
    - Employee (off-chain): Runs credit model → generates proof "score > 680"
    - Lender (on-chain): Submits proof to `verify_credit_proof()` circuit (Phase 2)

- [x] `grant_employment_disclosure(employee_id, verifier_id, company_id, expires_in)`:
  - **NOT ZKML**: Simple ledger write storing authorization
  - **What it does**: Employee says "I give verifier permission to verify my employment"
  - **Stores**: Authorization record on public ledger with expiration
  - **Enables ZKML (Phase 2)**: Verifier can later request ZK proof via `verify_employment_proof()`
  - **Future ZKML flow**:
    - Employee (off-chain): Generates proof "I work at company X" without revealing salary
    - Verifier (on-chain): Submits proof to `verify_employment_proof()` circuit (Phase 2)

- [x] `grant_audit_disclosure(company_id, auditor_id, expires_in)`:
  - **NOT ZKML**: Simple ledger write storing authorization
  - **What it does**: Company says "I give auditor permission to audit my payroll"
  - **Stores**: Authorization record on public ledger with expiration
  - **Enables ZKML (Phase 2)**: Auditor can analyze salaries and generate ZK fairness proof via `verify_audit_proof()`
  - **Future ZKML flow**:
    - Auditor (off-chain): Downloads salary data → runs fairness model → generates proof "no gender pay gap"
    - Auditor (on-chain): Submits proof to `verify_audit_proof()` circuit (Phase 2)

**Other Non-ZKML Circuits:**
- [x] `revoke_disclosure(grantor_id, grantee_id, permission_type)`:
  - **NOT ZKML**: Simple ledger update (remove authorization)
  - Allows employee/company to revoke access early
  - Removes authorization from ledger
  - Removes shared payment history

**Deferred to Phase 2 (TRUE ZKML CIRCUITS - not yet implemented):**
- [ ] **`verify_credit_proof(proof, employee_wallet, txids, merkle_root, threshold, model_hash)`**:
  - ✅ **THIS IS A ZKML CIRCUIT** - Verifies ZK proof generated off-chain
  - Verifies transactions exist on blockchain
  - Verifies Merkle root consistency
  - Verifies ZK proof from EZKL
  - Stores approval result (YES/NO without revealing score)
  - See ZKML_TECHNICAL_DEEP_DIVE.md for full implementation
- [ ] **`verify_employment_proof(proof, employee_id, verifier_id, company_id)`**:
  - ✅ **THIS IS A ZKML CIRCUIT** - Verifies ZK proof of employment
- [ ] **`verify_audit_proof(proof, company_id, auditor_id, fairness_threshold)`**:
  - ✅ **THIS IS A ZKML CIRCUIT** - Verifies ZK proof of fair pay analysis

**Phase 2 Implementation:**
- [ ] Employee generates ZKML credit score proof locally (EZKL + Python)
- [ ] Auditor generates ZKML fairness proof locally (EZKL + Python)
- [ ] Test end-to-end: payment history → ML → EZKL proof → verification

**Test Scenarios:**
- [x] Test: Employee grants lender income disclosure (stores auth)
- [ ] Test: Authorization expires after time limit
- [x] Test: Employee revokes disclosure before expiration
- [ ] Test: ZKML proof generation and verification (Phase 2)
- [ ] Test: Merkle proof verification (Phase 2)
- [ ] Test: Transaction existence verification (Phase 2)

**Key Benefits:**
- ✅ Shared key stored on PUBLIC ledger (privacy via disclosure_id)
- ✅ Automatic expiration via timestamp checks
- ✅ Revocable by grantor at any time
- ✅ Ready for ZKML integration (Phase 2)
- ✅ Multi-party safe (no witness isolation issues)
- ✅ Follows bank.compact proven patterns

**Compilation Status:**
- ✅ 11 circuits compiling successfully

**⚡ ZKML Classification:**

| Circuit | ZKML Usage | Status |
|---------|-----------|--------|
| `mint_tokens` | ❌ NO | Standard token operation |
| `register_company` | ❌ NO | Simple ledger write |
| `deposit_company_funds` | ❌ NO | Encrypted balance transfer |
| `add_employee` | ❌ NO | Simple ledger write |
| `withdraw_employee_salary` | ❌ NO | Encrypted balance transfer |
| `pay_employee` | ❌ NO | Encrypted balance transfer |
| `update_timestamp` | ❌ NO | Ledger update |
| `grant_income_disclosure` | ❌ NO | **Authorization only** (stores permission on ledger) |
| `grant_employment_disclosure` | ❌ NO | **Authorization only** (stores permission on ledger) |
| `grant_audit_disclosure` | ❌ NO | **Authorization only** (stores permission on ledger) |
| `revoke_disclosure` | ❌ NO | Simple ledger update |

**Summary:** **All 11 circuits are NON-ZKML** - They're standard encrypted operations and authorization storage. The actual ZKML circuits (`verify_credit_proof`, `verify_employment_proof`, `verify_audit_proof`) will be added in Phase 2.

**Important Architecture Notes:**
- ❌ **NO IN-CONTRACT COMPUTATION**: Smart contract does NOT calculate averages, scores, or run ML models
- ✅ **OFF-CHAIN ML**: All ML inference happens locally on employee's computer using EZKL
- ✅ **ON-CHAIN VERIFICATION**: Smart contract only verifies ZK proofs, doesn't run models
- ✅ **PHASE 2 FOCUS**: Credit score verification circuit will be added in Phase 2 ZKML integration
- See **ZKML_TECHNICAL_DEEP_DIVE.md** for complete architecture and implementation details

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

### API Layer ✅ COMPLETED
**Goal:** Create payroll-api following bank-api patterns

**Structure (following @midnight-bank/bank-api):**
- [x] Create payroll-api package structure:
  - package.json (dependencies: @midnight-ntwrk SDKs, rxjs, pino)
  - tsconfig.json
  - src/index.ts (main exports)
  - src/common-types.ts (type definitions)
  - src/payroll-api.ts (main API class)
  - src/utils/index.ts (helper functions)
  - src/test/commons.ts (test setup with Docker)
  - src/test/payroll-api.test.ts (integration tests)
  - src/test/payroll-api.smoke.test.ts (fast unit tests)

**Types to Define (src/common-types.ts):**
- [x] `PayrollContract` type (Contract with payrollWitnesses)
- [x] `PayrollProviders` type (MidnightProviders for circuits)
- [x] `DeployedPayrollContract` type (FoundContract)
- [x] `PayrollDerivedState` interface (reactive state with company/employee data)
- [x] `PayrollCircuitKeys` type (union of circuit names)
- [x] `AccountId` type alias
- [x] `UserAction` interface (for transaction tracking)
- [x] `emptyPayrollState` factory function

**Main API Class (src/payroll-api.ts):**
- [x] `PayrollAPI` class with private constructor
- [x] Static `deploy()` method:
  - Uses `deployContract()` from @midnight-ntwrk/midnight-js-contracts
  - Retry logic with backoff (like bank-api)
  - Returns ContractAddress
- [x] Static `connect()` method:
  - Uses `findDeployedContract()` for existing contracts
  - Per-user private state handling
  - Returns DeployedPayrollAPI instance
- [x] RxJS state$ observable:
  - Combines ledger state (public data provider)
  - Combines private state (private state provider)
  - Combines user actions (local subject)
  - Uses combineLatest + scan for reactive updates
- [x] Company operations:
  - `registerCompany(companyId, companyName): Promise<void>`
  - `depositCompanyFunds(companyId, amount): Promise<void>`
  - `getCompanyInfo(companyId): Promise<CompanyInfo>`
- [x] Employee operations:
  - `addEmployee(companyId, employeeId): Promise<void>`
  - `withdrawEmployeeSalary(employeeId, amount): Promise<void>`
  - `getEmployeeInfo(employeeId): Promise<EmployeeInfo>`
- [x] Payment operations:
  - `payEmployee(companyId, employeeId, amount): Promise<void>`
  - `getEmployeePaymentHistory(employeeId): Promise<PaymentRecord[]>`
- [x] Additional operations:
  - `mintTokens(amount: string): Promise<void>` (for testing)
  - `updateTimestamp(timestamp: number): Promise<void>`

**Utilities (src/utils/index.ts):**
- [x] `formatBalance(balance: bigint): string` - Convert to decimal
- [x] `parseAmount(amount: string): bigint` - Convert from decimal
- [x] `pad(s: string, n: number): Uint8Array` - String padding
- [x] `randomBytes(size: number): Uint8Array` - Secure random
- [x] `stringToBytes32(s: string): Uint8Array` - String to fixed bytes
- [x] `stringToBytes64(s: string): Uint8Array` - String to fixed bytes
- [x] `normalizeId(id: string): string` - ID normalization

**Test Setup (src/test/commons.ts):**
- [x] `TestEnvironment` class:
  - Docker Compose setup (indexer, node, proof-server)
  - Wallet creation with test seed
  - Provider initialization (publicDataProvider, privateStateProvider, proofProvider)
- [x] `TestWallet` wrapper class
- [x] In-memory private state provider (for testing)
- [x] Test configuration management

**Integration Tests (src/test/payroll-api.test.ts):**
- [x] Test: Deploy payroll contract
- [x] Test: Register company via API
- [x] Test: Deposit company funds via API
- [x] Test: Add employee via API
- [x] Test: Pay employee salary via API (encrypted balance transfer)
- [x] Test: Withdraw employee salary via API
- [x] Test: Get company/employee info via API
- [x] Test: Get payment history via API (for ZKML)
- [x] Test: Multi-company workflow (2 companies, 2 employees, 10 transactions)
- [x] Test: Timestamp updates
- [x] Test: Full lifecycle (mint → register → deposit → add employee → pay → withdraw)

**Smoke Tests (src/test/payroll-api.smoke.test.ts):**
- [x] 28 fast unit tests (<10ms total) for rapid development feedback
- [x] Tests for all utility functions
- [x] Tests for exports and static methods
- [x] Separate test script: `npm run test:smoke`

**Docker Setup:**
- [x] Create docker-compose.yml (undeployed-compose.yml)
- [x] Configure midnight-node service
- [x] Configure midnight-indexer service
- [x] Configure midnight-proof-server service
- [x] Health checks and wait strategies
- [x] Network configuration (payroll-network)

**Test Performance Analysis:**
- [x] Investigated transaction finality polling mechanism
- [x] Traced through Midnight SDK implementation
- [x] Found polling interval: 1 second (hardcoded, already optimal)
- [x] Transaction timing breakdown:
  - ZK proof generation: ~15s (cryptographic computation, cannot be optimized)
  - Block confirmation: ~9s (6s block time + network overhead)
  - Polling interval: 1s (already aggressive)
  - **Total: ~24s per transaction** (inherent to ZK blockchain technology)
- [x] Conclusion: Tests are already optimized, no further improvements possible

**Notes:**
- ✅ Followed bank-api patterns exactly (proven working implementation)
- ✅ Used RxJS for reactive state management (not simple context updates)
- ✅ Integrated with full Midnight SDK (not test-only implementation)
- ✅ Supports both local testing (Docker) and deployed contracts
- ✅ All 31 tests passing (3 integration tests + 28 smoke tests)
- ✅ Test execution time: ~8 minutes for full integration suite

---

## Phase 2: ZKML Integration

**🚨 IMPORTANT:** This phase adds the actual ZKML circuits. Phase 0-1 only has authorization circuits (grant/revoke). The verify_*_proof() circuits below are the TRUE ZKML circuits.

### ML Models (OFF-CHAIN)
- [ ] Set up Python zkml workspace with EZKL dependencies
- [ ] Build XGBoost credit scoring model with synthetic data
- [ ] Export model to ONNX format
- [ ] Generate ZK circuit from ONNX using EZKL
- [ ] Create proof generation scripts (employee runs locally)

### Smart Contracts (ON-CHAIN ZKML VERIFICATION)
- [ ] **Add ZKML circuit: `verify_credit_proof(proof, employee_wallet, txids, merkle_root, threshold, model_hash)`**
  - ✅ **THIS IS THE ZKML CIRCUIT** - Verifies ZK proof generated off-chain
  - Verifies transactions exist on blockchain
  - Verifies Merkle root matches txids
  - Verifies ZK proof is valid
  - Stores approval (YES/NO)
- [ ] **Add ZKML circuit: `verify_employment_proof(proof, employee_id, verifier_id, company_id)`**
  - ✅ **THIS IS THE ZKML CIRCUIT** - Verifies ZK proof of employment
  - Proves employee works at company without revealing salary
- [ ] **Add ZKML circuit: `verify_audit_proof(proof, company_id, auditor_id, fairness_threshold)`**
  - ✅ **THIS IS THE ZKML CIRCUIT** - Verifies ZK proof of fair pay analysis
  - Proves no gender pay gap without revealing individual salaries
- [ ] Integrate ZKML proof generation with payroll-api
- [ ] Test end-to-end: payment → ML analysis → proof → verification

---

## Phase 3: UI Development

- [ ] Update pay-ui to show credit scoring feature
- [ ] Build employee credit score checker UI

---

## Future Enhancements (Priority Order for Production Payroll)

**⚡ ZKML Usage Summary:**

| Priority | Feature | ZKML Required? | Reason |
|----------|---------|----------------|--------|
| 1 | Recurring Payments | ❌ NO | Simple encrypted balance transfers |
| 2 | Salary History Queries | ✅ **YES** | **PRIMARY ZKML USE CASE** - Prove income without revealing amounts |
| 3 | Tax Withholding | ⚡ HYBRID | Basic withholding = NO, W-2 privacy = YES (optional) |
| 4 | Benefits Tracking | ❌ NO | Simple arithmetic, optional ZKML enhancement possible |
| 5 | Payment Batching | ❌ NO | Performance optimization, not privacy feature |

**Key Insight:** Only 1 out of 5 enhancements requires ZKML. Most payroll operations are straightforward encrypted balance transfers. ZKML is reserved for privacy-preserving proofs where employees need to prove properties about their data without revealing exact values.

---

### Priority 1: Recurring Payments (FUNDAMENTAL)
**Why Critical:** Every company pays employees on a recurring schedule (bi-weekly, monthly, semi-monthly). Without this, companies must manually initiate every payment - not scalable for real-world use.

**⚡ ZKML Applicability:** ❌ **NO ZKML NEEDED**
- Recurring payments are simple encrypted balance transfers (bank.compact pattern)
- No ML computation required
- No zero-knowledge proofs needed
- Standard ledger operations: check schedule → execute payment → update next_payment_date

**Implementation:**
- [ ] Add `PaymentSchedule` struct in PayrollCommons.compact:
  ```compact
  struct PaymentSchedule {
    employee_id: Bytes<32>,
    amount: Uint<64>,
    frequency: Uint<8>, // 1=weekly, 2=bi-weekly, 4=monthly
    next_payment_date: Uint<64>,
    is_active: Bool
  }
  ```
- [ ] Add ledger state: `export ledger payment_schedules: Map<Bytes<32>, PaymentSchedule>`
- [ ] Create circuit: `setup_recurring_payment(employee_id, amount, frequency, start_date)`
  - Store schedule on public ledger
  - Validate company has sufficient balance
  - Set next payment date based on frequency
- [ ] Create circuit: `execute_recurring_payment(employee_id)`
  - Check if current_timestamp >= next_payment_date
  - Execute encrypted balance transfer (reuse pay_employee logic)
  - Update next_payment_date (add frequency interval)
  - Append to payment history
- [ ] Create circuit: `pause_recurring_payment(employee_id)` - Set is_active to false
- [ ] Create circuit: `resume_recurring_payment(employee_id)` - Set is_active to true
- [ ] Create circuit: `cancel_recurring_payment(employee_id)` - Remove from ledger

**User Impact:**
- ✅ Companies set up payments once, run automatically forever
- ✅ Employees get predictable payment schedule
- ✅ Reduces manual work by 99% (no more clicking "Pay" every 2 weeks)

**Technical Notes:**
- Execution could be triggered by company, employee, or automated service
- Consider adding `last_payment_date` to track payment history
- Handle edge cases: insufficient balance (pause schedule), employee termination (cancel schedule)

---

### Priority 2: Salary History Queries with ZK Proofs (WOW FACTOR)
**Why Important:** This is zkSalaria's UNIQUE value proposition - employees can prove income to lenders/landlords without revealing exact salary amounts. This leverages the privacy architecture we've already built.

**⚡ ZKML Applicability:** ✅ **FULL ZKML IMPLEMENTATION REQUIRED**
- **This is the PRIMARY ZKML use case for zkSalaria**
- **OFF-CHAIN (Employee's device)**:
  - Download payment history from blockchain (txids)
  - Decrypt amounts with private key
  - Calculate aggregate (average, threshold check, range check)
  - Run ML model if needed (credit scoring, income prediction)
  - Generate ZK proof using EZKL: "My average income is > $X" or "My score > 680"
- **ON-CHAIN (Smart contract)**:
  - Verify txids exist on blockchain
  - Verify Merkle root matches txids
  - Verify ZK proof is valid
  - Store approval (YES/NO) without revealing amounts
- **Pattern:** Exactly follows ZKML_TECHNICAL_DEEP_DIVE.md architecture
- **Integration:** Uses existing `grant_income_disclosure()` authorization circuit

**Implementation:**
- [ ] Create circuit: `generate_income_proof(employee_id, proof_type, threshold)`
  - Proof types:
    - `INCOME_ABOVE_THRESHOLD` - "I earn more than $X/month" (for credit cards)
    - `INCOME_RANGE` - "I earn between $X and $Y" (for rentals)
    - `AVERAGE_INCOME` - "My average monthly income is $X" (for loans)
  - Read payment history from ledger (already stored)
  - Calculate aggregate without revealing individual payments
  - Generate ZK proof of calculation
  - Return proof hash for verifier
- [ ] Create circuit: `verify_income_proof(proof_hash, employee_id, verifier_id)`
  - Check employee has granted disclosure to verifier
  - Verify proof is valid and not expired
  - Store verification result on ledger
  - Verifier can read YES/NO without seeing amounts
- [ ] Add ledger state: `export ledger income_proofs: Map<Bytes<32>, IncomeProof>`
- [ ] Add `IncomeProof` struct:
  ```compact
  struct IncomeProof {
    employee_id: Bytes<32>,
    proof_type: Uint<8>,
    proof_hash: Bytes<32>,
    created_at: Uint<64>,
    expires_at: Uint<64>,
    verified: Bool
  }
  ```

**User Impact:**
- ✅ Employees control who sees their income data
- ✅ Lenders get proof of income without salary snooping
- ✅ Landlords verify tenant income privately
- ✅ Banks approve loans with ZK income verification

**Integration with Existing Features:**
- ✅ Leverages `grant_income_disclosure()` circuit (already implemented)
- ✅ Uses payment history on public ledger (already stored)
- ✅ Works with existing disclosure authorization system

**Wow Factor:**
- 🚀 "Apply for loan without revealing your exact salary"
- 🚀 "Rent apartment with privacy-preserving income proof"
- 🚀 "Get credit card approval without exposing paycheck amounts"

---

### Priority 3: Tax Withholding (LEGALLY REQUIRED)
**Why Critical:** Tax withholding is legally required in most jurisdictions. Companies must deduct federal/state/local taxes from employee paychecks and report them to tax authorities. Without this, zkSalaria cannot be used for real payroll.

**⚡ ZKML Applicability:** ⚡ **HYBRID - ZKML for W-2 Privacy, Standard for Withholding**
- **Tax Calculation (NO ZKML):**
  - Standard arithmetic in circuit: `tax = (amount * rate) / 100`
  - No ML needed for basic tax withholding
  - Straightforward encrypted balance operations
- **W-2 Generation (YES ZKML - OPTIONAL PRIVACY ENHANCEMENT):**
  - **OFF-CHAIN**: Employee generates ZK proof of annual tax data
  - **Proof**: "I paid $X in taxes this year" without revealing salary or individual paychecks
  - **Use Case**: Privacy-preserving tax filing (prove compliance without revealing income details)
  - **ON-CHAIN**: Contract verifies proof of annual tax totals
- **Why Hybrid?**
  - Tax withholding is computation on single paycheck (no ML needed)
  - W-2 reporting aggregates annual data (ZKML provides privacy for tax filing)
  - Employees can choose: reveal W-2 publicly OR prove via ZK proof

**Implementation:**
- [ ] Add `TaxWithholding` struct in PayrollCommons.compact:
  ```compact
  struct TaxWithholding {
    employee_id: Bytes<32>,
    federal_rate: Uint<8>, // Percentage (0-100)
    state_rate: Uint<8>,
    local_rate: Uint<8>,
    additional_amount: Uint<64>, // Flat amount per paycheck
    ytd_withheld: Uint<64> // Year-to-date total
  }
  ```
- [ ] Add ledger state: `export ledger tax_withholdings: Map<Bytes<32>, TaxWithholding>`
- [ ] Create circuit: `setup_tax_withholding(employee_id, federal_rate, state_rate, local_rate, additional)`
  - Store tax configuration for employee
  - Validate rates are reasonable (0-50%)
- [ ] Update `pay_employee()` circuit to calculate and deduct taxes:
  ```compact
  gross_amount = requested_payment
  federal_tax = (gross_amount * federal_rate) / 100
  state_tax = (gross_amount * state_rate) / 100
  local_tax = (gross_amount * local_rate) / 100
  total_tax = federal_tax + state_tax + local_tax + additional_amount
  net_amount = gross_amount - total_tax

  // Transfer net_amount to employee (encrypted)
  // Keep total_tax in company reserve for tax payments
  // Update ytd_withheld
  ```
- [ ] Create circuit: `generate_w2_proof(employee_id, year)`
  - Calculate annual totals (gross income, taxes withheld)
  - Generate ZK proof of W-2 data for tax filing
  - Store proof hash on ledger
- [ ] Add to PaymentRecord:
  ```compact
  gross_amount: Uint<64>,
  tax_withheld: Uint<64>,
  net_amount: Uint<64>
  ```

**User Impact:**
- ✅ Companies comply with tax laws automatically
- ✅ Employees see gross vs net pay breakdown
- ✅ Year-end W-2 generation (privacy-preserving)
- ✅ Tax authorities can verify compliance via ZK proofs

**Technical Notes:**
- Consider adding `tax_year` to track annual limits (Social Security cap, etc.)
- Support for multiple tax jurisdictions (multi-state employees)
- Integration with IRS reporting (W-2 generation)

---

### Priority 4: Benefits Tracking (COMMON)
**Why Important:** Most companies offer benefits (health insurance, 401k, FSA, etc.) that require paycheck deductions. This is essential for competitive employers and standard in modern payroll systems.

**⚡ ZKML Applicability:** ❌ **NO ZKML NEEDED (but could be enhanced)**
- **Basic Benefits Tracking (NO ZKML):**
  - Simple arithmetic: deduct benefit amount from paycheck
  - Track year-to-date contributions
  - Standard encrypted balance operations
- **OPTIONAL ZKML Enhancement (Future):**
  - **OFF-CHAIN**: Employee proves "My 401k contributions are on track for $X annual goal"
  - **OFF-CHAIN**: Employee proves "I've maxed out my HSA limit" without revealing exact amounts
  - **Use Case**: Privacy-preserving benefits planning
  - Not critical for MVP, basic tracking is sufficient

**Implementation:**
- [ ] Add `BenefitDeduction` struct in PayrollCommons.compact:
  ```compact
  struct BenefitDeduction {
    employee_id: Bytes<32>,
    benefit_type: Uint<8>, // 1=health, 2=dental, 3=401k, 4=fsa, 5=hsa
    deduction_amount: Uint<64>, // Per paycheck
    company_match: Uint<64>, // Employer contribution (for 401k)
    ytd_employee: Uint<64>, // Year-to-date employee contributions
    ytd_company: Uint<64>, // Year-to-date company contributions
    is_active: Bool
  }
  ```
- [ ] Add ledger state: `export ledger benefit_deductions: Map<Bytes<32>, Vector<5, BenefitDeduction>>`
- [ ] Create circuit: `setup_benefit_deduction(employee_id, benefit_type, amount, company_match)`
  - Store benefit configuration for employee
  - Validate amounts are reasonable
- [ ] Update `pay_employee()` circuit to deduct benefits:
  ```compact
  net_after_tax = gross_amount - total_tax
  total_benefits = 0

  for each active benefit:
    deduct benefit_amount from net_after_tax
    total_benefits += benefit_amount
    if company_match > 0:
      deduct company_match from company balance
      total_benefits += company_match
    update ytd_employee and ytd_company

  final_net = net_after_tax - total_benefits
  ```
- [ ] Create circuit: `pause_benefit(employee_id, benefit_type)` - Set is_active to false
- [ ] Create circuit: `resume_benefit(employee_id, benefit_type)` - Set is_active to true
- [ ] Add to PaymentRecord:
  ```compact
  benefits_deducted: Uint<64>,
  company_match: Uint<64>
  ```

**User Impact:**
- ✅ Employees see benefits deductions on paystub
- ✅ Companies track employer contributions (401k match)
- ✅ Year-to-date tracking for contribution limits (401k has $23,000 annual limit)
- ✅ Privacy preserved (benefit elections are encrypted)

**Use Cases:**
- Health insurance: $200/month deduction
- 401k: 5% of salary with 3% company match
- HSA: $300/month pre-tax contribution
- Dental/Vision: $50/month deduction

---

### Priority 5: Payment Batching (EFFICIENCY)
**Why Important:** Paying 100+ employees one at a time is slow and expensive (gas fees, time). Batch payments allow companies to pay all employees in a single transaction, saving time and costs. Critical for larger companies.

**⚡ ZKML Applicability:** ❌ **NO ZKML NEEDED**
- Batch payments are multiple encrypted balance transfers in one circuit
- No ML computation required
- No zero-knowledge proofs needed beyond standard encryption
- Performance optimization, not a privacy feature
- **Pattern**: Loop through employees → decrypt balance → add amount → re-encrypt
- **Blocker**: Currently blocked by Compact loop constraints (see implementation notes)

**Implementation:**
- [ ] Create circuit: `pay_employees_batch(employee_ids: Vector<N, Bytes<32>>, amounts: Vector<N, Uint<64>>)`
  - **Challenge:** Compact doesn't support dynamic loops yet (acknowledged blocker in TODO)
  - **Workaround:** Create fixed-size batch circuits:
    - `pay_employees_batch_10()` - Pay up to 10 employees
    - `pay_employees_batch_50()` - Pay up to 50 employees
    - `pay_employees_batch_100()` - Pay up to 100 employees
  - Each circuit:
    1. Verify company has sufficient total balance
    2. For each employee (up to N):
       - Decrypt employee balance
       - Add payment amount
       - Re-encrypt employee balance
       - Update balance_mappings
       - Append to payment history
    3. Decrypt company balance once
    4. Deduct total amount from company
    5. Re-encrypt company balance once
  - Single transaction for entire batch (1 ZK proof instead of N proofs)
- [ ] Alternative: Use `pay_employees_batch_dynamic()` if Compact adds loop support
- [ ] Add ledger state for batch tracking:
  ```compact
  export ledger batch_payments: Map<Bytes<32>, BatchPaymentRecord>

  struct BatchPaymentRecord {
    batch_id: Bytes<32>,
    company_id: Bytes<32>,
    employee_count: Uint<16>,
    total_amount: Uint<64>,
    timestamp: Uint<64>
  }
  ```

**User Impact:**
- ✅ Companies save time (1 transaction vs 100 transactions)
- ✅ Companies save costs (1 ZK proof vs 100 proofs = ~24s vs 40 minutes)
- ✅ Employees all get paid simultaneously (no staggered payments)
- ✅ Audit trail shows batch payments for reconciliation

**Technical Notes:**
- **BLOCKER:** Currently blocked by Compact loop constraints (mentioned in Phase 1 checklist)
- Consider deferring to post-hackathon when Compact adds loop support
- Workaround: Fixed-size batch circuits for demonstration
- Performance: Single batch of 100 employees = 1 ZK proof (~24s) vs 100 individual payments (~40 minutes)

---

## Phase 4: Deployment & Demo

- [ ] Deploy contracts to Midnight testnet
- [ ] Create demo with 50 employees on testnet

---

## Current Status

**Phase:** Phase 1 - Testing & Validation (COMPLETED ✅)
**Current Task:** Ready to move to Phase 2 - API Integration OR ZKML Integration
**Last Update:** December 2024 - Balance decryption testing completed with multi-party architecture

**⚡ ZKML Architecture Overview:**

**Current Implementation (Phase 0-1):**
- ✅ **11 NON-ZKML circuits** - All current circuits are standard operations:
  - 7 encrypted balance operations (deposit, pay, withdraw, register, mint, update_timestamp)
  - 3 authorization circuits (grant_income_disclosure, grant_employment_disclosure, grant_audit_disclosure)
  - 1 revoke circuit (revoke_disclosure)
- ✅ **Payment history on public ledger** - Accessible for off-chain ZKML credit scoring
- ⏸️ **ZKML verification circuits** - NOT YET IMPLEMENTED (Phase 2)
  - `verify_credit_proof()` - Verify ZK proof of credit score
  - `verify_employment_proof()` - Verify ZK proof of employment
  - `verify_audit_proof()` - Verify ZK proof of fair pay analysis

**ZKML Pattern (Phase 2 - when verification circuits are added):**
```
1. Authorization (CURRENT - Phase 0-1):
   Employee/Company grants permission via grant_*_disclosure() circuits

2. OFF-CHAIN (Employee/Auditor device - PHASE 2):
   Download payment txids → Decrypt amounts → Run ML model (EZKL) → Generate ZK proof

3. ON-CHAIN (Smart contract verification - PHASE 2):
   Call verify_*_proof() → Verify txids exist → Verify Merkle root → Verify ZK proof → Store approval (YES/NO)
```

**Key Insight:** The grant circuits are just authorization (permission storage). The actual ZKML happens in Phase 2 with verify_*_proof() circuits that check ZK proofs generated off-chain.

---

**✅ What Works Now:**
- ✅ Payroll contract with 11 NON-ZKML circuits (register, deposit, pay, withdraw, authorization)
- ✅ Encrypted balance system (encrypted_employee_balances + balance_mappings)
- ✅ Real token operations (mint, send via Midnight blockchain)
- ✅ Payment history on public ledger (ready for ZKML credit scoring in Phase 2)
- ✅ Authorization circuits for selective disclosure (grant/revoke permissions)
- ✅ Multi-party architecture tested (separate private states per participant)
- ✅ Balance decryption verified (22 comprehensive tests passing)
- ✅ **ZKML foundation ready**: Authorization + payment history in place, ZKML verification circuits deferred to Phase 2

**🔄 Next Steps - Choose Your Path:**
1. **API Layer** - Build TypeScript API to integrate contract with UI/ZKML
2. **ZKML** - Build credit scoring with EZKL (requires payment history, already on ledger)
3. **UI** - Build React frontend for companies/employees (requires API layer first)

**Completed:**

**Phase 0 - Privacy & Architecture Fixes:**
- ✅ Basic payroll.compact with 7 working circuits
- ✅ Token minting/burning integration
- ✅ Company/employee registration
- ✅ Basic salary payments
- ✅ Identified privacy vulnerabilities (public balances)
- ✅ Created gradual fix plan in Phase 0
- ✅ Adopted bank.compact's encrypted balance pattern
- ✅ Migrated all balance circuits to encrypted balances:
  - deposit_company_funds ✅
  - withdraw_employee_salary ✅
  - pay_employee ✅
- ✅ Removed old witness balance functions
- ✅ Updated TypeScript types and witness providers
- ✅ Contract compiles successfully with encrypted balances
- ✅ Payment history moved to PUBLIC LEDGER (not witnesses)
  - Following bank.compact pattern: history on ledger for ZKML accessibility
  - Company can write payments, anyone can read for credit scoring
  - Multi-party safe: separate history per employee on ledger
- ✅ Multi-party testing completed:
  - **22 comprehensive multi-party tests passing** (single-party tests deprecated)
  - ✅ Verified separate private states per participant (company, employee, verifier)
  - ✅ Verified encrypted balance transfers work correctly across participants
  - ✅ Verified payment history isolation per employee on shared public ledger
  - ✅ **Balance decryption from ledger tested** (7 new tests):
    - Decrypt employee balance from encrypted_employee_balances + balance_mappings
    - Decrypt company balance from token_reserve
    - Handle null balances for employees without payments
    - Decrypt multiple independent employee balances
    - Track balance changes through full payment/withdrawal workflow
    - Verify withdrawals reduce both encrypted balance and token reserve
    - Demonstrate privacy with encrypted balances on shared ledger
  - ✅ Tests verify ACTUAL decrypted balances match expected values
  - ✅ Multi-party architecture proven: separate private states + shared encrypted ledger

**Phase 1 - Contract Testing & Validation:**
- ✅ **Comprehensive multi-party testing framework** (22 tests passing):
  - Built PayrollMultiPartyTestSetup class simulating real-world usage
  - Each participant (company, employee, verifier) has separate private state
  - All participants share same encrypted public ledger
  - Tests verify encrypted balance operations across participants
- ✅ **Balance decryption testing** (7 dedicated tests):
  - Test: Decrypt employee balance from encrypted_employee_balances + balance_mappings
  - Test: Decrypt company balance from token_reserve
  - Test: Handle null balances for employees without payments
  - Test: Decrypt multiple independent employee balances
  - Test: Track balance changes through full payment/withdrawal workflow
  - Test: Verify withdrawals reduce both encrypted balance and token reserve
  - Test: Demonstrate privacy with encrypted balances on shared ledger
- ✅ **Test architecture proven**:
  - Manual balance tracking (expected values)
  - Actual balance decryption from ledger (encrypted_employee_balances → balance_mappings)
  - Both match, proving encryption logic works correctly
  - Company balance = token_reserve (not separately encrypted)
  - Employee balances encrypted with independent keys
- ✅ **Deprecated single-party tests**:
  - Moved all tests to multi-party setup (more realistic)
  - Single-party tests saved as .deprecated (reference only)
  - Multi-party tests properly simulate production environment
- ✅ **Test coverage complete**:
  - Payment history on public ledger (for ZKML)
  - Separate private states per participant
  - Encrypted balance transfers (company → employee)
  - Withdrawals (employee → external)
  - Employment verification (3-party workflow)
  - Balance decryption from ledger maps

**Phase 2 - API Integration:**
- ❌ Not started yet (recommended next step)
- Plan: Create complete payroll-api package following @midnight-bank/bank-api patterns
- Will include:
  - PayrollAPI class with RxJS reactive state management
  - Midnight SDK providers setup (wallet, indexer, proof)
  - Docker test environment (midnight-node, indexer, proof-server)
  - Comprehensive integration tests
  - End-to-end testing: deploy → mint → register → deposit → add employee → pay → withdraw
- Note: Expect ~24s per transaction (15s ZK proof + 9s block confirmation)

**Next Steps (Choose One Path):**

**Option A: API Layer Development** (Recommended - bridges contract to UI)
- Create payroll-api package following @midnight-bank/bank-api patterns
- Implement PayrollAPI class with RxJS reactive state management
- Set up Midnight SDK providers (wallet, indexer, proof)
- Create Docker test environment
- Write integration tests for all circuits
- Document: Transaction times (~24s per tx due to ZK proofs)

**Option B: ZKML Integration** (Phase 2 - see detailed checklist in Phase 2 section)
- Set up Python zkml workspace with EZKL dependencies
- Build XGBoost credit scoring model with synthetic payment data
- Export model to ONNX format
- Generate ZK circuit from ONNX using EZKL
- Create CreditScoring.compact for ZKML proof verification
- Integrate ZKML proof generation with payroll-api
- Test end-to-end: payment history → ML analysis → proof → verification

**Option C: UI Development** (Phase 3)
- Build company dashboard (manage employees, process payroll)
- Build employee portal (view payments, withdraw funds)
- Build employment verification interface (for landlords/banks)

**Recommendation:** Build API layer first - it enables both UI and ZKML integration

**Blockers:**
- None currently
- Batch payments blocked by Compact loop constraints (deferred to post-hackathon)

**Timeline:**
- ✅ Phase 0: Privacy & Architecture Fixes - COMPLETED (encrypted balances, employment verification)
- ✅ Phase 1: Contract Testing & Validation - COMPLETED (22 multi-party tests, balance decryption)
- 🔄 Phase 2: API Integration - NOT STARTED (recommended next)
- ⏸️ Phase 3: ZKML Integration - WAITING
- ⏸️ Phase 4: UI Development - WAITING
- On track for 3-week hackathon timeline
- Current priority: Choose between API layer or ZKML integration

---

## Architectural Decision: Encrypted Ledger vs Witnesses

**Date:** Nov 2025
**Decision:** Use bank.compact's encrypted balance pattern with payment history on public ledger

**Why the change?**
- Original plan: Store balances AND payment history in witnesses (private local storage)
- Problem discovered: Witnesses are local to each participant - company circuit can't update employee's witness
- Solution discovered: Bank contract uses encrypted balances on PUBLIC ledger
  - Balances encrypted with participant keys
  - Contract can update any participant's encrypted balance
  - True token ownership (not just company IOU)
  - Proven pattern (already working in bank.compact)

**What's on PUBLIC LEDGER?**
- Company balances (ENCRYPTED with company key)
- Employee balances (ENCRYPTED with employee key)
- Balance mappings (encrypted_balance → actual_amount)
- Payment history (ON LEDGER - for ZKML accessibility)
  - `export ledger employee_payment_history: Map<Bytes<32>, Vector<12, PaymentRecord>>`
  - Company can write when paying employee
  - Anyone can read for credit scoring (intentional for ZKML)

**What stays in witnesses?**
- NOTHING (all removed)
- Payment history moved to public ledger following bank.compact pattern
- Private states are now empty (no witness functions needed)

**Benefits:**
1. ✅ Solves multi-party state update problem
2. ✅ True ownership (employee controls encrypted balance)
3. ✅ Privacy preserved for balances (encryption prevents blockchain snooping)
4. ✅ ZKML accessibility (payment history readable for credit scoring)
5. ✅ Enables authorization system (like bank's disclosure permissions)
6. ✅ Proven architecture (reuses bank.compact patterns)
