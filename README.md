# zkSalaria - ZKML-Powered Private Payroll System

![zkSalaria](payroll-ui/public/assets/midnight-logo-white.svg)

A privacy-preserving payroll system built on [Midnight](https://midnight.network) combining zero-knowledge proofs with machine learning for confidential salary management and income verification.

**Hackathon Track:** Finance
**Innovation:** First payroll system integrating ZKML for private income proofs

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Compile contracts
npm run compile

# Run tests
npm test

# Start UI (local network)
npm run payroll-ui:local
```

Open http://localhost:5173 in Chrome with [Lace Wallet](https://docs.midnight.network/develop/tutorial/using/chrome-ext) set to "Undeployed" network.

## 💼 What is zkSalaria?

zkSalaria enables companies to run payroll with complete privacy while allowing employees to prove income eligibility without revealing exact salaries. Using zero-knowledge machine learning (ZKML), employees can generate verifiable proofs for:

- Loan applications ("I earn at least $4,000/month")
- Credit products ("My income is between $8,000-$10,000")
- Lease agreements ("My average income is $11,000/month")
- Credit scores ("My payment consistency score is 600+")

All without exposing actual payment amounts to third parties.

## ✨ Core Features

### Privacy-Preserving Payroll
- **Encrypted Balances**: Company and employee balances fully encrypted on-chain
- **Private Payments**: Payment amounts hidden from everyone except recipient
- **Recurring Payroll**: Automated salary payments (weekly/bi-weekly/monthly)
- **Payment History**: Encrypted transaction records for ZKML proof generation

### ZKML Income Verification
- **4 Proof Types**: Threshold, range, average, credit score
- **Real EZKL Integration**: Production-ready ZK-ML proofs (not mocked)
- **Trusted Verifiers**: Whitelist-based verification system
- **Selective Disclosure**: Prove income eligibility without revealing amounts

### Advanced Operations
- **Recurring Payment Management**: Create, pause, resume, edit schedules
- **Multi-Party Privacy**: Company writes, employee/verifiers read encrypted data
- **Disclosure Controls**: Grant/revoke income and employment disclosures
- **Employment Verification**: Multi-party employment status confirmation

## 🏗️ Architecture

```
zkSalaria/
├── payroll-contract/     # Compact smart contract (13 circuits)
├── payroll-commons/      # Shared types and utilities
├── payroll-api/          # TypeScript API layer
├── payroll-ui/           # React frontend with Material-UI
├── zkml/                 # ZKML proof generation (EZKL)
│   └── payroll/          # Income proof models
├── zkml-verifier/        # ZKML verification service
└── docs/                 # Technical specs and wireframes
```

### Smart Contract (`payroll-contract/`)
- **13 active circuits** including deposit, payments, recurring payroll, ZKML proofs
- **Encrypted ledger** pattern (all balances and amounts encrypted)
- **Multi-party privacy** model supporting companies, employees, verifiers
- **130 passing tests** (120 active + 10 skipped for testnet performance)

### API Layer (`payroll-api/`)
- **TypeScript API** with type-safe contract integration
- **RxJS reactive state** for real-time updates
- **Private state management** for encrypted local storage
- **55% coverage** (11/20 circuits - disclosure/verification APIs pending)

### Frontend (`payroll-ui/`)
- **React + Material-UI** with dark/light theme support
- **Wallet integration** with Midnight Lace
- **Role-based navigation** (Company vs Employee flows)
- **Real-time balance updates** via reactive observables

### ZKML Layer (`zkml/` + `zkml-verifier/`)
- **EZKL proof generation** for 4 income proof types
- **End-to-end ZK-ML pipeline** from payment history to verified proofs
- **Verifier service** with REST API for proof validation
- **23 E2E tests** with real EZKL proofs (not mocked)

## 🔐 Privacy Model

**What's Encrypted:**
- Company balance (hash encrypted)
- Employee balances (hash encrypted)
- Payment amounts (encrypted in history)
- All financial details remain private

**What's Public:**
- Employment records (status only)
- Disclosure authorizations (selective sharing)
- Aggregate counters (total payments, employees)
- ZKML proof existence (not amounts)

**Multi-Party Access:**
- Companies can deposit funds and pay employees
- Employees can withdraw and generate income proofs
- Verifiers can validate proofs without seeing amounts

## 📊 13 Active Circuits

### Basic Operations (5)
1. `deposit_company_funds` - Fund payroll account
2. `add_employee` - Onboard with employment record
3. `pay_employee` - Single payment with encrypted amount
4. `withdraw_employee_salary` - Employee withdrawal
5. `mint_tokens` - Test token creation

### Recurring Payroll (5)
6. `create_recurring_payment` - Setup automated salary
7. `process_recurring_payment` - Execute scheduled payment
8. `pause_recurring_payment` - Suspend temporarily
9. `resume_recurring_payment` - Reactivate payment
10. `edit_recurring_payment` - Modify amount/schedule

### ZKML Income Proofs (3)
11. `register_trusted_verifier` - Whitelist verifier
12. `submit_income_proof` - Employee submits ZK proof
13. `verify_income_proof` - Verifier validates proof

## 🧪 Testing

```bash
# Run all tests (130 tests)
npm test

# Run contract tests only
cd payroll-contract && npm test

# Run API tests
cd payroll-api && npm test

# Run ZKML tests (requires Python env)
cd zkml/payroll && python test_proof_generation.py
```

**Test Coverage:**
- 44 calendar utility tests
- 61 multi-party payroll tests
- 23 ZKML integration tests (E2E with real EZKL)
- 10 batch payment tests (skipped - testnet performance)

## 🛠️ Development

```bash
# Development mode with hot reload
npm run dev:local

# Compile contracts after changes
npm run compile

# Type checking
npm run typecheck

# Build all packages
npm run build
```

## 📋 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run compile` | Compile Compact contracts |
| `npm run payroll-ui:local` | Start UI on local network |
| `npm run payroll-ui:testnet` | Start UI on testnet |
| `npm run dev:local` | Development with hot reload |
| `npm run test` | Run all tests |
| `npm run typecheck` | Type check all packages |
| `npm run build` | Build all packages |

## 🔧 Configuration

Network configs in `payroll-ui/public/`:
- `config.local.json` - Local development
- `config.testnet.json` - Midnight testnet

## 🎯 Use Cases

### For Companies
- Manage payroll with complete privacy
- Automate recurring salary payments
- Verify employment without revealing salaries
- Maintain encrypted payment history

### For Employees
- Receive private salary payments
- Generate income proofs for third parties
- Prove eligibility without disclosing amounts
- Control disclosure authorizations

### For Verifiers (Banks, Landlords, etc.)
- Verify income claims with cryptographic certainty
- Receive proofs without accessing raw data
- Validate eligibility requirements privately
- Trust mathematical proofs over documents

## 🚧 Current Status (Nov 2025)

**Completed:**
- ✅ 13 circuits fully implemented and tested
- ✅ 130 tests passing (120 active + 10 skipped)
- ✅ ZKML integration with real EZKL proofs
- ✅ Encrypted payment history system
- ✅ API layer (55% coverage - 11/20 circuits)
- ✅ UI foundation with role detection

**In Progress:**
- 🔄 Disclosure/verification API methods (9 circuits)
- 🔄 ZKML income proof API methods (3 circuits)
- 🔄 UI implementation (Phase 3)

**Known Limitations:**
- Batch payments disabled on testnet (proof server crashes)
- Disclosure management API pending
- ZKML proof API pending (circuits exist, no API wrapper yet)

## 📚 Learn More

- [Midnight Documentation](https://docs.midnight.network)
- [Compact Language Guide](https://docs.midnight.network/learn/compact)
- [EZKL Documentation](https://docs.ezkl.xyz)
- [Zero-Knowledge Proofs](https://en.wikipedia.org/wiki/Zero-knowledge_proof)
- [zkSalaria Technical Roadmap](docs/technical/TODO.md)

## 🤝 Contributing

Contributions welcome! This is a hackathon project demonstrating privacy-preserving payroll with ZKML.

## 📄 License

Apache License 2.0 - see [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Midnight Network](https://midnight.network) for privacy-preserving blockchain infrastructure
- [Input Output Global](https://iohk.io) for the Midnight ecosystem
- [EZKL](https://ezkl.xyz) for zero-knowledge machine learning framework
- The ZK cryptography community for advancing privacy technology

---

**Built for Midnight Finance Track Hackathon**
*Privacy-first payroll meets zero-knowledge machine learning*
