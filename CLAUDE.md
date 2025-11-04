# zkSalaria Development Notes

**Project:** zkSalaria - ZKML-Powered Private Payroll System
**Track:** Finance - Midnight Hackathon
**Description:** Privacy-preserving payroll system with ZK-ML income verification

## Development Workflow
1. **After any contract modifications, always run `npm run compile` to check for errors**
2. **Fix compilation errors before proceeding to next steps**
3. **Test circuits individually before building full API layer**
4. **Use incremental development: contract → test → api → test → ui**

## Current Project Structure
```
zkSalaria/
├── payroll-contract/     # Main payroll smart contract (payroll.compact)
├── payroll-commons/      # Shared types and utilities
├── payroll-api/          # TypeScript API layer
├── payroll-ui/           # React frontend (in progress)
├── zkml/                 # ZKML proof generation
│   └── payroll/          # Income proof models (EZKL)
├── zkml-verifier/        # ZKML verification service
├── docs/                 # Documentation
│   ├── technical/        # TODO.md and technical specs
│   └── ux/              # UI wireframes
└── CLAUDE.md             # This file
```

## Core Payroll Operations (13 Active Circuits)

### Basic Operations (5 circuits)
1. **deposit_company_funds** - Company deposits tokens for payroll
2. **add_employee** - Onboard employee with employment record
3. **pay_employee** - Single payment with encrypted amount + history
4. **withdraw_employee_salary** - Employee withdraws earned salary
5. **mint_tokens** - Test helper for token creation

### Recurring Payment System (5 circuits)
6. **create_recurring_payment** - Setup automated salary (weekly/bi-weekly/monthly)
7. **process_recurring_payment** - Execute scheduled payment
8. **pause_recurring_payment** - Temporarily suspend
9. **resume_recurring_payment** - Reactivate paused payment
10. **edit_recurring_payment** - Modify amount/schedule

### ZKML Income Proof System (3 circuits)
11. **register_trusted_verifier** - Whitelist ZKML verifier
12. **submit_income_proof** - Employee submits ZK proof of income (4 proof types)
13. **verify_income_proof** - Verifier validates proof meets requirements

### Disclosure & Verification Circuits (NOT YET IN API)
- **grant_income_disclosure** - Grant income range disclosure
- **grant_employment_disclosure** - Grant employment status disclosure
- **grant_audit_disclosure** - Grant audit access
- **revoke_disclosure** - Revoke disclosure authorization
- **update_employment_status** - Company updates employee status
- **verify_employment** - Multi-party employment verification
- **update_timestamp** - Test helper for time-based operations

## ZKML Income Proof Types

**Type 1: INCOME_ABOVE_THRESHOLD**
- Use case: "Prove I earn at least $4,000/month"
- Requirement: Minimum income for loan approval

**Type 2: INCOME_RANGE**
- Use case: "Prove I earn between $8,000 and $10,000/month"
- Requirement: Income bracket for credit products

**Type 3: AVERAGE_INCOME**
- Use case: "Prove my average income is at least $11,000/month"
- Requirement: Stable income history for lease

**Type 4: CREDIT_SCORE**
- Use case: "Prove my payment consistency score is at least 600"
- Requirement: Creditworthiness without revealing amounts

## Key Patterns from Battleship (/Users/norman/Development/midnight/midnight-seabattle)
- **Witnesses**: Provide private data to circuits
- **Hash Commitments**: Prevent cheating/data tampering
- **Private State**: Store secrets locally, never on blockchain
- **ZK Proofs**: Validate without revealing sensitive data

## Contract Modularization Pattern (from Seabattle)
- **Separate Commons Module**: Create shared types, structs, and utility functions in separate .compact file
- **Import Commons**: Use `import ModuleName;` to access shared functionality
- **Keep Contracts Focused**: Each contract should handle specific domain logic
- **Export Shared Types**: Use `export` keyword for types/functions needed by other contracts

## Privacy Model (Bank.compact Pattern)

**PUBLIC LEDGER (shared by all participants):**
- Encrypted company balance (hash encrypted)
- Encrypted employee balances (hash encrypted)
- Payment history per employee (encrypted amounts - for ZKML)
- Employment records (status tracking)
- Disclosure authorizations (selective sharing)
- Aggregate counters only (total_payments, total_employees)

**PRIVACY GUARANTEES:**
- Current balances: ENCRYPTED (nobody can see exact amounts)
- Payment history amounts: ENCRYPTED (employee decrypts locally for ZKML)
- Company can write, employee/verifiers can read (multi-party safe)

## Compilation Issues to Watch
- Import all required functions (public_key, etc.)
- Use correct Compact compiler syntax: `compact compile src/file.compact ./target`
- Check for unbound identifiers before building API layer
- Counter types get default initialization (don't initialize in constructor)

## Current Status (Nov 2025)

**Active Circuits:** 13 circuits
**Test Count:** 120 passing + 10 skipped = 130 total tests
- 44 calendar utility tests
- 61 multi-party payroll tests
- 23 ZKML integration tests (E2E with real EZKL proofs)
- 10 batch payment tests (skipped - testnet performance)

**API Coverage:** 55% (11/20 circuits have API methods)
- Missing: Disclosure management, employment verification, ZKML proofs

**Compilation:** ✅ Successful (~13 circuits)
**TypeScript:** ✅ All type checks passing

## Known Limitations

**Testnet Performance:**
- Batch payments commented out (proof server crashes)
- 10 batch tests skipped
- Will re-enable for mainnet with better infrastructure

**API Integration Gaps:**
- Disclosure management API not implemented
- Employment verification API not implemented
- ZKML income proof API not implemented (circuits exist, but no API methods)

## Reference Documentation
- **Compact Language Reference**: `@CompactDocs/` directory
- **Battleship Examples**: `/Users/norman/Development/midnight/midnight-seabattle/`
- **GameCommons.compact**: Has utility functions like `public_key()`
- **Domain Separation**: Use padding like `pad(32, "midnight:bank:pk:")` for unique contexts
- **Technical Roadmap**: [docs/technical/TODO.md](docs/technical/TODO.md)

## Quick Fixes for Common Errors
- **"unbound identifier public_key"**: Define as pure circuit with domain separation
- **"invalid context for Counter"**: Don't initialize Counter in constructor, use default
- **Import errors**: Check CompactStandardLibrary imports vs custom functions

## Next Steps

**Critical - API Integration Completion:**
1. Implement missing disclosure/verification API methods (9 methods)
2. Implement ZKML income proof API methods (3 methods)
3. Add E2E API tests for all missing circuits

**Immediate (Week 1):**
1. Complete API integration (blocking for UI)
2. UI development (Phase 3)
3. Demo preparation
4. Documentation cleanup

**Short-term (Week 2-3):**
1. Testnet deployment
2. End-to-end testing
3. Video demo recording
4. Pitch deck finalization
