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

**Step 5: Add Selective Disclosure Circuits (Using Bank.compact's Shared Key Pattern)**

**Overview**: Adopt bank.compact's `TransferAuthorization` pattern with shared encryption keys for selective disclosure

**Add Ledger State**:
- [ ] Add struct `DisclosureAuthorization` (similar to bank's `TransferAuthorization`):
  ```compact
  struct DisclosureAuthorization {
    grantor_id: Bytes<32>,              // Employee/company granting access
    grantee_id: Bytes<32>,              // Lender/landlord/auditor receiving access
    shared_encryption_key: Bytes<32>,   // Key stored on ledger for both parties
    threshold: Uint<64>,                // For range checks (e.g., "income >= $5k")
    created_at: Uint<32>,
    last_updated: Uint<32>,
    permission_type: Uint<8>,           // 0=INCOME_RANGE, 1=EMPLOYMENT, 2=CREDIT_SCORE, 3=AUDIT
    expires_at: Uint<32>                // 0=never expires, >0=expiration timestamp
  }
  ```
- [ ] Add `export ledger disclosure_authorizations: Map<Bytes<32>, DisclosureAuthorization>`
- [ ] Add `export ledger shared_payment_history: Map<Bytes<32>, Bytes<32>>`  // disclosure_id -> shared_encrypted_history

**Implement Grant Circuits**:
- [ ] `grant_income_disclosure(employee_id, lender_id, min_threshold, expires_in)`:
  - Generate shared key: `hash([employee_id, lender_id, "income"])`
  - Create DisclosureAuthorization with shared key stored on ledger
  - Re-encrypt payment history with shared key
  - Store in shared_payment_history map
  - Employee grants lender permission to verify income range

- [ ] `grant_employment_disclosure(employee_id, verifier_id, company_id, expires_in)`:
  - Generate shared key: `hash([employee_id, verifier_id, "employment"])`
  - Create authorization for employment verification
  - Verifier can prove: employee works at company (YES/NO), duration, without salary

- [ ] `grant_audit_disclosure(company_id, auditor_id, audit_type, expires_in)`:
  - Generate shared key: `hash([company_id, auditor_id, "audit"])`
  - For pay equity audits / compliance checks
  - Auditor can verify aggregate metrics without individual salaries

**Implement Verify Circuits**:
- [ ] `verify_income_threshold(disclosure_id) -> Boolean`:
  - Verifier reads DisclosureAuthorization from ledger
  - Gets shared_encryption_key from authorization
  - Decrypts shared_payment_history using shared key
  - Calculates average income from payment history
  - Returns: income >= threshold (YES/NO), not exact amount
  - Checks expiration: `current_timestamp <= expires_at`

- [ ] `verify_employment(disclosure_id) -> Boolean`:
  - Reads authorization and shared key from ledger
  - Verifies employee registered at company
  - Returns: employed (YES/NO), duration (>6 months), without salary info

- [ ] `revoke_disclosure(grantor_id, disclosure_id)`:
  - Allows employee/company to revoke permission early
  - Deletes authorization from ledger
  - Clears shared_payment_history entry

**Test Scenarios**:
- [ ] Test: Employee grants lender income disclosure, lender verifies threshold
- [ ] Test: Authorization expires after time limit
- [ ] Test: Employee revokes disclosure before expiration
- [ ] Test: Mock landlord verifies employment without seeing salary
- [ ] Test: Mock auditor verifies pay equity using company disclosure

**Key Benefits of This Pattern** (from bank.compact):
- ✅ Shared key stored on PUBLIC ledger (privacy via obscurity of disclosure_id)
- ✅ Both parties can independently access without coordination
- ✅ Automatic expiration via timestamp checks
- ✅ Revocable by grantor at any time
- ✅ Threshold checks reveal YES/NO, not exact values
- ✅ Multi-party safe (no witness isolation issues)

**Important Notes**:
- ❌ **NO WITNESSES NEEDED**: Keys computed on-demand from participant IDs, not stored in witnesses
- ❌ **NO PIN NEEDED**: Authentication happens at API layer (company/employee login), not contract layer
- ✅ **Shared keys on LEDGER**: Following bank.compact pattern - keys stored in DisclosureAuthorization struct on public ledger
- ✅ **Wallet signature sufficient**: Midnight wallet proves identity, contract derives keys from participant_id

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
**Goal:** Create payroll-api following bank-api patterns

**Structure (following @midnight-bank/bank-api):**
- [ ] Create payroll-api package structure:
  - package.json (dependencies: @midnight-ntwrk SDKs, rxjs, pino)
  - tsconfig.json
  - src/index.ts (main exports)
  - src/common-types.ts (type definitions)
  - src/payroll-api.ts (main API class)
  - src/utils/index.ts (helper functions)
  - src/test/commons.ts (test setup with Docker)
  - src/test/payroll-api.test.ts (integration tests)

**Types to Define (src/common-types.ts):**
- [ ] `PayrollContract` type (Contract with payrollWitnesses)
- [ ] `PayrollProviders` type (MidnightProviders for circuits)
- [ ] `DeployedPayrollContract` type (FoundContract)
- [ ] `PayrollDerivedState` interface (reactive state with company/employee data)
- [ ] `PayrollCircuitKeys` type (union of circuit names)
- [ ] `AccountId` type alias
- [ ] `UserAction` interface (for transaction tracking)
- [ ] `emptyPayrollState` factory function

**Main API Class (src/payroll-api.ts):**
- [ ] `PayrollAPI` class with private constructor
- [ ] Static `deploy()` method:
  - Uses `deployContract()` from @midnight-ntwrk/midnight-js-contracts
  - Retry logic with backoff (like bank-api)
  - Returns ContractAddress
- [ ] Static `connect()` method:
  - Uses `findDeployedContract()` for existing contracts
  - Per-user private state handling
  - Returns DeployedPayrollAPI instance
- [ ] RxJS state$ observable:
  - Combines ledger state (public data provider)
  - Combines private state (private state provider)
  - Combines user actions (local subject)
  - Uses combineLatest + scan for reactive updates
- [ ] Company operations:
  - `registerCompany(companyId, companyName): Promise<void>`
  - `depositCompanyFunds(companyId, amount): Promise<void>`
  - `getCompanyBalance(companyId, pin): Promise<bigint>`
- [ ] Employee operations:
  - `addEmployee(companyId, employeeId): Promise<void>`
  - `withdrawEmployeeSalary(employeeId, amount): Promise<void>`
  - `getEmployeeBalance(employeeId, pin): Promise<bigint>`
- [ ] Payment operations:
  - `payEmployee(companyId, employeeId, amount): Promise<void>`
  - `getEmployeePaymentHistory(employeeId): Promise<PaymentRecord[]>`

**Utilities (src/utils/index.ts):**
- [ ] `formatBalance(balance: bigint): string` - Convert to decimal
- [ ] `parseAmount(amount: string): bigint` - Convert from decimal
- [ ] `pad(s: string, n: number): Uint8Array` - String padding
- [ ] `randomBytes(size: number): Uint8Array` - Secure random

**Test Setup (src/test/commons.ts):**
- [ ] `TestEnvironment` class:
  - Docker Compose setup (indexer, node, proof-server)
  - Wallet creation with test seed
  - Provider initialization (publicDataProvider, privateStateProvider, proofProvider)
- [ ] `TestWallet` wrapper class
- [ ] In-memory private state provider (for testing)
- [ ] Test configuration management

**Integration Tests (src/test/payroll-api.test.ts):**
- [ ] Test: Deploy payroll contract
- [ ] Test: Register company via API
- [ ] Test: Deposit company funds via API
- [ ] Test: Add employee via API
- [ ] Test: Pay employee salary via API (encrypted balance transfer)
- [ ] Test: Withdraw employee salary via API
- [ ] Test: Get encrypted balances via API
- [ ] Test: Get payment history via API (for ZKML)
- [ ] Test: Multi-company workflow
- [ ] Test: Error handling (insufficient funds, etc.)

**Docker Setup:**
- [ ] Create docker-compose.yml or use standalone.yml
- [ ] Configure midnight-node service
- [ ] Configure midnight-indexer service
- [ ] Configure midnight-proof-server service
- [ ] Health checks and wait strategies

**Dependencies to Add:**
- [ ] @midnight-ntwrk/midnight-js-types
- [ ] @midnight-ntwrk/midnight-js-contracts
- [ ] @midnight-ntwrk/midnight-js-indexer-public-data-provider
- [ ] @midnight-ntwrk/midnight-js-http-client-proof-provider
- [ ] @midnight-ntwrk/midnight-js-network-id
- [ ] @midnight-ntwrk/midnight-js-node-zk-config-provider
- [ ] @midnight-ntwrk/wallet
- [ ] @midnight-ntwrk/wallet-api
- [ ] rxjs (reactive streams)
- [ ] pino (logging)
- [ ] testcontainers (for integration tests)

**Notes:**
- Follow bank-api patterns exactly (proven working implementation)
- Use RxJS for reactive state management (not simple context updates)
- Integrate with full Midnight SDK (not test-only implementation)
- Support both local testing (Docker) and deployed contracts
- Encrypted balances require proper provider setup

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

**Phase:** Phase 0 - Privacy & Architecture Fixes (COMPLETED ✅)
**Current Task:** Ready to move to Phase 1 - API Integration
**Completed:**
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
  - All 31 tests passing (22 basic + 9 multi-party)
  - Verified separate private states per participant
  - Verified encrypted balance transfers work correctly
  - Verified payment history isolation per employee

**Next Steps:**
1. **Phase 1: API Integration** (NOT STARTED - see detailed checklist in Phase 1 section)
   - Create payroll-api package following @midnight-bank/bank-api patterns
   - Implement PayrollAPI class with RxJS reactive state management
   - Set up Midnight SDK providers (wallet, indexer, proof)
   - Create Docker test environment with midnight-node, indexer, proof-server
   - Write integration tests for encrypted balance operations
   - Test end-to-end: deploy → register → deposit → pay → withdraw
2. Test private payroll with local deployment
3. Verify balances are encrypted (not readable on blockchain explorer)
4. Add selective disclosure circuits (Step 5 - documented but not implemented)

**Blockers:**
- Batch payments blocked by Compact loop constraints (deferred to Phase 2)

**Timeline:**
- ✅ Phase 0 completed in 2 sessions
- On track for 3-week hackathon timeline
- Priority: API integration and local deployment testing

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
