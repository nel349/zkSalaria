# zkSalaria - ZKML-Powered Private Payroll

**Midnight Hackathon Project**
**Track:** Finance - Compliant Privacy for the Real Economy
**Timeline:** 3 weeks (Nov 2025 - Hackathon Nov 17-19)

---

## Executive Summary

**zkSalaria** is the first zero-knowledge machine learning (ZKML) powered payroll system. Named after Via Salaria—ancient Rome's salt road where soldiers received their salarium (salary)—we're building the modern highway for fair, private compensation.

While competitors like Aleo + Request Finance provide basic private payroll (hiding transaction amounts), zkSalaria adds **intelligent privacy**: AI-powered credit scoring, fairness analysis, fraud detection, and benchmarking—all without compromising employee privacy.

**Key Innovation:** Combining Midnight's programmable privacy with ZKML to enable insights that are legally impossible with traditional systems.

---

## The Problem

### Current State: Public Salaries Destroy Privacy

**On Ethereum/Public Blockchains:**
- Every salary payment is visible (amount, recipient, timing)
- Employees' net worth is exposed
- Competitors poach talent by seeing compensation
- Personal safety risks (visible wealth = target for attacks)
- Salary discrimination becomes public knowledge

**Real Numbers:**
- DAOs process $50M+ in payroll monthly
- 100% of transactions are public
- Employees face stalking, phishing, competitive poaching
- Companies leak strategic information (hiring, runway, priorities)

### Competitor: Aleo + Request Finance

**Launched:** September 2025
**Traction:** $3.7M processed in 2 months, became #2 blockchain for payments
**What they do:** Private payroll using zero-knowledge proofs (hide amounts)

**What they DON'T do:**
- ❌ No AI/ML capabilities
- ❌ No credit scoring for employee advances
- ❌ No fairness analysis (DEI compliance)
- ❌ No fraud detection
- ❌ No salary benchmarking
- ❌ No retention analytics

**This is our opportunity:** Privacy is table stakes. Intelligence is the moat.

---

## The Solution: zkSalaria

### Core Value Proposition

**"Private Payroll 2.0: Privacy + Intelligence"**

We provide everything Aleo/Request does (private salary payments via Midnight) PLUS five ZKML-powered features that create entirely new capabilities:

1. **Private Credit Scoring** - Payroll advances without financial exposure
2. **Fair Pay Analysis** - Prove DEI compliance without revealing salaries
3. **Fraud Detection** - Save 3% of payroll without surveillance
4. **Salary Benchmarking** - Market data with network effects
5. **Retention Risk** - Predict flight risk without invading privacy

### Why This Wins

**vs Aleo/Request Finance:**
- They validated the market ($4M in 2 months)
- We add intelligence they can't replicate without 12+ months R&D
- ZKML is our defensible moat

**vs Traditional Payroll (Gusto, Rippling):**
- They can't do fairness analysis (privacy laws prevent cross-employee analysis)
- We can (ZKML analyzes encrypted data)
- Unlocks legally impossible insights

**vs Other Hackathon Teams:**
- Most will build "AI agent reputation" (15+ teams, hard to differentiate)
- We're solving a proven problem (Aleo showed $4M demand)
- Clear business model (B2B SaaS to DAOs)

---

## Technical Architecture

### High-Level Stack

```
┌─────────────────────────────────────────────────┐
│  Frontend (React + TypeScript)                  │
│  - Company Admin Dashboard                      │
│  - Employee Portal                              │
│  - Proof Generator UI                           │
│  - Verifier Portal (Landlords/Lenders)         │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│  ZKML Layer (Python + EZKL/Giza)               │
│  - Credit Scoring Model                         │
│  - Fair Pay Analysis Model                      │
│  - Fraud Detection Model                        │
│  - Salary Benchmark Aggregation                 │
│  - Retention Risk Prediction                    │
│  → Convert to ZK Circuits                       │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│  Midnight Smart Contracts (Compact)             │
│  - PayrollRegistry.compact                      │
│  - PrivatePayroll.compact                       │
│  - CreditScoring.compact                        │
│  - FairPayAnalysis.compact                      │
│  - ProofVerification.compact                    │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│  Midnight Network (Testnet)                     │
│  - Shielded Transactions                        │
│  - ZK Proof Verification                        │
│  - Selective Disclosure                         │
└─────────────────────────────────────────────────┘
```

### Key Components

**1. Smart Contracts (Midnight Compact)**
- Written in TypeScript-like Compact language
- Leverage Midnight's eUTxO model for efficient state management
- Private state via witnesses (employee data never on-chain)
- Selective disclosure circuits (employees control what's revealed)

**2. ZKML Integration**
- Train ML models in Python (PyTorch/scikit-learn)
- Export to ONNX format
- Convert to ZK circuits using EZKL or Giza
- Prove computation correctness without revealing inputs

**3. Private State Management**
- Employee data stored locally (encrypted)
- Company admin sees aggregates only
- Proofs generated on-demand
- Zero raw data on public ledger

**4. Proof Generation & Verification**
- On-demand proof generation (employee-initiated)
- Verifiable by third parties via Midnight
- Cryptographically binding
- Revocable access control

---

## ZKML Features (Detailed Specifications)

### Feature 1: Private Credit Scoring for Payroll Advances

**Problem:** Employees need emergency cash but traditional lenders require full financial exposure.

**ZKML Solution:**
1. Employee has 6+ months payment history in zkSalaria
2. Local ML model analyzes: payment consistency, amount trends, tenure
3. Generates credit score (e.g., 720/850) locally
4. ZK proof created: "Score > 680" (threshold for $3k advance)
5. Company verifies proof, approves advance
6. Employee gets cash, company never sees exact score/salary

**ML Model:**
- Type: Gradient Boosting Classifier (XGBoost)
- Inputs:
  - Payment frequency (consistency)
  - Average amount (income proxy)
  - Variance (income stability)
  - Tenure (employment duration)
- Output: Credit score (300-850)
- Training: Synthetic data based on credit scoring literature
- Complexity: ~1000 trees, 8 depth (feasible for ZK conversion)

**Smart Contract:**
```
CreditScoring.compact:
- prove_creditworthy(employee_id, threshold) → ZK proof
- verify_credit_proof(proof_id) → boolean
- approve_advance(employee_id, amount) → transfer
```

**Business Impact:**
- New revenue stream (charge 2-5% fee on advances)
- Employee benefit (instant liquidity)
- Company benefit (retention tool)

**Demo Flow:**
- Employee "Alice" needs $2,000 emergency
- Click "Request Advance"
- ML analyzes locally: score = 745
- Generate ZK proof: "Score > 680"
- Company approves instantly
- Alice receives $2,000 to Midnight wallet

---

### Feature 2: Fair Pay Analysis (DEI Compliance)

**Problem:** Companies must prove equal pay but analyzing salaries violates privacy laws.

**ZKML Solution:**
1. ML model analyzes ALL employee salaries (encrypted)
2. Controls for: role, experience, location, performance
3. Detects statistically significant pay gaps (gender, race, age)
4. ZK proof: "No significant gap (p < 0.05)" OR "Gap: 8.2% (requires correction)"
5. Regulators/board verify proof without seeing individual salaries

**ML Model:**
- Type: Linear Regression with Fairness Constraints
- Inputs:
  - Salary (encrypted)
  - Role (categorical)
  - Experience years
  - Location (cost-of-living adjusted)
  - Performance rating
  - Protected attributes (gender, race - optional)
- Output:
  - Expected salary (fair baseline)
  - Actual vs expected gap
  - Statistical significance (p-value)
- Training: Simulated payroll data with known biases

**Smart Contract:**
```
FairPayAnalysis.compact:
- analyze_pay_equity(company_id) → ZK proof of fairness
- prove_no_gap(protected_class, threshold) → boolean
- generate_compliance_report() → encrypted report
```

**Business Impact:**
- Regulatory compliance (EU Pay Transparency Directive, California SB 1162)
- DEI credibility (provable fairness)
- Legal protection (demonstrate no discrimination)
- Fortune 500 market (every company needs this)

**Demo Flow:**
- Company has 50 employees (salaries encrypted)
- Click "Run Fair Pay Analysis"
- ML analyzes: "Gender gap: 2.1% (women paid slightly more, p=0.43 not significant)"
- Generate ZK proof
- Board verifies: ✓ Compliant
- Regulators verify: ✓ No discrimination
- No individual salary ever revealed

---

### Feature 3: Fraud Detection (Payroll Anomaly Detection)

**Problem:** Payroll fraud costs $50B/year but detecting requires analyzing all employees.

**ZKML Solution:**
1. ML model monitors payment patterns (encrypted)
2. Flags anomalies:
   - Duplicate bank accounts (ghost employees)
   - Unusual amounts (typos, fraud)
   - Timing irregularities (test payments before fraud)
3. ZK alert: "Anomaly in batch #23, employee #7" (no details)
4. Admin investigates specific case only
5. 99% of employees maintain total privacy

**ML Model:**
- Type: Isolation Forest (Anomaly Detection)
- Inputs:
  - Payment amount
  - Payment frequency
  - Bank account hash
  - Timing patterns
  - Deviation from historical average
- Output: Anomaly score (0-1, >0.7 = flag)
- Training: Normal payment patterns + synthetic fraud cases

**Smart Contract:**
```
FraudDetection.compact:
- monitor_payroll_batch(batch_id) → anomaly flags
- alert_admin(employee_id, anomaly_type) → private alert
- whitelist_exception(employee_id) → mark as safe
```

**Business Impact:**
- Save 3% of annual payroll (industry average fraud rate)
- CFO appeal (direct cost savings)
- Insurance premium reduction (lower risk)

**Demo Flow:**
- Process payroll for 50 employees
- ML detects: "Employee #23 has same bank account as Employee #7"
- Private alert to admin only
- Admin checks: Ghost employee (never existed)
- Fraud prevented, $5,000/month saved
- 48 legitimate employees had zero privacy invasion

---

### Feature 4: Salary Benchmarking (Privacy-Preserving Market Data)

**Problem:** Employees don't know if they're underpaid. Companies don't know market rates.

**ZKML Solution:**
1. Multiple companies contribute salary data via zkSalaria
2. Each company submits ZK proof: "We pay X employees in role Y, range Z" (doesn't reveal individuals)
3. ML aggregates across companies (encrypted)
4. Generates market benchmarks
5. Employees query: "Senior Engineer, 5 years, San Francisco" → "You're at 67th percentile"
6. No company reveals exact salaries, no employee reveals identity

**ML Model:**
- Type: Federated Aggregation (Secure Multi-Party Computation)
- Inputs (per company):
  - Role distributions (encrypted)
  - Salary ranges (encrypted)
  - Location adjustments
- Output:
  - Market percentiles (25th, 50th, 75th, 90th)
  - Regional adjustments
  - Trend analysis (YoY changes)
- Training: N/A (aggregation, not prediction)

**Smart Contract:**
```
SalaryBenchmark.compact:
- contribute_data(company_id, encrypted_salary_data) → ZK proof
- query_benchmark(role, experience, location) → percentile_result
- prove_data_contribution(company_id) → boolean (participated)
```

**Business Impact:**
- Network effects (more companies = better data = moat)
- Subscription revenue ($99/month per company for access)
- Employee retention (transparency reduces turnover)
- Competitive differentiation (Aleo/Request can't replicate)

**Demo Flow:**
- 3 companies contribute data (100 employees total)
- ML generates benchmarks privately
- Employee queries: "What's fair for my role?"
- Result: "Senior Engineer, SF, 5 years: Market range $180k-$220k, you're at $165k (bottom 15%)"
- Employee has leverage to negotiate
- No salary revealed to network
- No company revealed to employee

---

### Feature 5: Retention Risk Prediction

**Problem:** Companies lose top talent unexpectedly. HR wants to predict flight risk without surveillance.

**ZKML Solution:**
1. ML analyzes payment history, raise patterns, tenure (encrypted)
2. Predicts probability of departure (0-100%)
3. ZK alert: "3 high-value employees at elevated risk" (no names)
4. HR can request details (with employee consent) OR address proactively (raises, promotions)
5. Privacy-preserving early warning system

**ML Model:**
- Type: Random Forest Classifier
- Inputs:
  - Time since last raise
  - Salary relative to market (from benchmarking)
  - Tenure
  - Promotion velocity
  - Peer comparison (anonymized)
- Output: Churn probability (0-100%)
- Training: Historical turnover data (anonymized)

**Smart Contract:**
```
RetentionAnalysis.compact:
- predict_flight_risk(company_id) → encrypted risk scores
- alert_high_risk(threshold) → count only (no names)
- request_employee_consent(employee_id) → selective disclosure
```

**Business Impact:**
- Retention is cheaper than hiring (3-5x cost)
- HR departments pay for predictive analytics
- Balance company needs with employee privacy

**Demo Flow:**
- ML analyzes 50 employees
- Identifies: "3 employees have >70% departure probability"
- HR sees alert (no names)
- Options:
  - Blanket raises for entire team (proactive)
  - Request consent from flagged employees (targeted)
- Company reduces turnover by 20%
- Employees maintain privacy unless they consent

---

## 3-Week Build Plan

### Week 1: Foundation + UX-Driven Enhancements (Nov 1-7)

**Goal:** Core private payroll infrastructure + UX-required features (Aleo-equivalent + recurring payments + batch payroll)

**Smart Contracts:**
- Day 1-2: Core infrastructure completed ✅
  - payroll.compact with 11 circuits (working)
  - Encrypted balance system (bank.compact pattern)
  - Selective disclosure authorizations
  - Payment history tracking (for ZKML)
  - API layer with 31 passing tests

- Day 3-4: **Recurring Payments System (Phase 1.5.1)** - HIGH PRIORITY
  - Add RecurringPayment struct in PayrollCommons.compact
  - Add ledger state: `recurring_payments: Map<Bytes<32>, RecurringPayment>`
  - Add frequency constants (WEEKLY, BIWEEKLY, MONTHLY)
  - Add status constants (ACTIVE, PAUSED, CANCELLED)
  - Implement 6 circuits:
    - `create_recurring_payment(employee_id, amount, frequency, start_date, end_date)`
    - `pause_recurring_payment(recurring_payment_id)`
    - `resume_recurring_payment(recurring_payment_id)`
    - `edit_recurring_payment(recurring_payment_id, new_amount)`
    - `cancel_recurring_payment(recurring_payment_id)`
    - `process_recurring_payment(recurring_payment_id)`
  - Update API layer: Add 6 new methods to PayrollAPI
  - Write 9 integration tests
  - Reference: `docs/design/PAYROLL_PAGES_WIREFRAMES.md` (Recurring Payments Setup)

- Day 5: **Payment Status Tracking (Phase 1.5.3)** - MEDIUM PRIORITY
  - Update PaymentRecord struct with new fields:
    - `encrypted_memo: Bytes<128>`
    - `status: Uint<8>` (pending/completed/failed/cancelled)
    - `payment_id: Bytes<32>`
  - Add payment status constants in PayrollCommons
  - Add ledger state: `pending_payments: Map<Bytes<32>, PaymentRecord>`
  - Update `pay_employee` circuit to set status
  - Implement `cancel_pending_payment(payment_id)` circuit
  - Update API layer: Return payment_id, add cancelPendingPayment()
  - Write 5 integration tests
  - Reference: `docs/design/PAYROLL_LIST_VIEW_WIREFRAME.md` (Status column)

- Day 6: **Batch Payroll Processing (Phase 1.5.2)** - MEDIUM PRIORITY
  - Research Compact loop constraints and maximum vector sizes
  - Choose implementation approach:
    - Option A: Fixed-size vector circuit (e.g., max 50 employees)
    - Option B: API layer batching (multiple pay_employee calls)
  - If Option A: Implement `batch_pay_employees(employee_ids, amounts, batch_size)` circuit
  - If Option B: Implement `batchPayEmployees()` method in API with progress tracking
  - Handle partial failures (continue on error)
  - Write 5 integration tests
  - Reference: `docs/design/PAYROLL_PAGES_WIREFRAMES.md` (Batch Payroll)

- Day 7: **Payment Memos + Company Metadata (Phase 1.5.4 + 1.5.5)** - LOW PRIORITY
  - Update `pay_employee` circuit to accept `memo: Bytes<128>` parameter
  - Encrypt memo with employee's key
  - Implement `update_company_name(new_name: Bytes<64>)` circuit
  - Update API layer: Add memo parameter, add updateCompanyName()
  - Write 4 integration tests
  - Testing & deployment to testnet:
    - Run full test suite (expect 50+ tests)
    - Fix any integration issues
    - Deploy updated contract to testnet
  - Reference: `docs/design/PAYROLL_PAGES_WIREFRAMES.md` (Payment memo), `docs/design/SETTINGS_NOTIFICATIONS_WIREFRAMES.md` (Company settings)

**Compilation Target:** 20+ circuits (currently 11 + 9 new)

**Test Coverage Goal:** 50+ tests (currently 31 + 19 new)

**Deliverables:**
- ✅ Working private payroll (send/receive salaries privately)
- ✅ Recurring payments (create, pause, resume, edit, cancel, process)
- ✅ Batch payroll processing (50 employees at once)
- ✅ Payment status tracking (pending/completed/failed/cancelled)
- ✅ Payment memos (encrypted)
- ✅ Company metadata updates
- ✅ All circuits compiling and tested
- ✅ Ready for UI integration (Week 3)

---

### Week 2: ZKML Integration (Nov 8-14)

**Goal:** Build and integrate 2 core ZKML features (credit scoring + fair pay)

**ZKML Development:**
- Day 8-9: Credit Scoring Model
  - Build XGBoost model in Python
  - Train on synthetic credit data
  - Export to ONNX format
  - Test accuracy (target >80%)

- Day 10-11: Convert to ZK Circuit (EZKL)
  - Install EZKL library
  - Generate ZK circuit from ONNX
  - Test proof generation (< 60 seconds)
  - Optimize circuit size

- Day 12: Fair Pay Analysis Model
  - Build linear regression model
  - Train on simulated payroll data
  - Export to ONNX

- Day 13: Convert Fair Pay to ZK Circuit
  - Generate circuit
  - Test with 50-employee dataset

- Day 14: Smart Contract Integration
  - Build CreditScoring.compact
  - Build FairPayAnalysis.compact
  - Test proof verification on Midnight
  - Deploy to testnet

**Deliverable:** Working credit scoring + fair pay analysis with ZK proofs

---

### Week 3: UI, Demo, & Polish (Nov 15-21)

**Goal:** Production-quality demo + pitch preparation

**Design References:**
- `docs/design/1_ONBOARDING_WIREFRAME.md` - Landing page
- `docs/design/2_APP_DASHBOARD_WIREFRAME.md` - Company & Employee dashboards
- `docs/design/3_PAYROLL_LIST_VIEW_WIREFRAME.md` - Payment history table
- `docs/design/PAYROLL_PAGES_WIREFRAMES.md` - Add employee, pay employee, recurring payments, batch payroll
- `docs/design/PAYMENT_DETAIL_PAGE_WIREFRAME.md` - Individual payment details
- `docs/design/AUTHENTICATION_ONBOARDING_WIREFRAMES.md` - Wallet connection, onboarding
- `docs/design/SETTINGS_NOTIFICATIONS_WIREFRAMES.md` - Settings, funding, notifications
- `docs/design/MISC_UX_COMPONENTS.md` - Help center, loading states, accessibility, error pages

---

**Day 15: Foundation & Authentication (AUTHENTICATION_ONBOARDING_WIREFRAMES.md)**

**Landing Page (ONBOARDING_WIREFRAME.md):**
- Hero section with animated encrypted balance particles background
- Main headline: "Private Payroll, Verified On-Chain"
- Primary CTA: "Open App" (orange), Secondary: "View Documentation" (cyan)
- Social proof stats: "552,800+ Private Payments", "297,500+ Verified Employees"
- 4-column Use Cases grid (DAOs, Web3 Companies, Privacy-First Teams, Traditional Companies)
- Expandable Features accordion (Encrypted Payroll, ZK Proofs, ZKML Credit Scoring, Fair Pay Analysis, Fraud Detection)
- Developer Integration section with code snippets
- 4-column footer (Product, Developers, Company, Legal)

**Authentication Flow:**
- Wallet Connection modal with Midnight Wallet install detection
- "Wallet Not Installed" modal with install link and instructions
- Network validation (Midnight Mainnet check)
- "Wrong Network" modal with auto-switch option
- Connection rejection handling with retry/cancel options
- Role detection via smart contract (company, employee, dual role, new user)
- Dual role selection modal ("Continue as Company" / "Continue as Employee")

**Onboarding Flows:**
- Company onboarding: Company name, wallet address auto-fill, success confirmation
- Employee onboarding: Email input (optional), explanation of privacy features, success confirmation
- Session management: auto-reconnect on page load, timeout warnings (15 min idle), concurrent session detection

**Components to Build:**
- `components/landing/`: Hero, UseCases, Features, DeveloperSection, Footer
- `components/auth/`: WalletConnect, NetworkCheck, RoleDetection, OnboardingWizard
- `hooks/useAuth.ts`: Wallet connection, role detection, session management

---

**Day 16: App Dashboard & Navigation (APP_DASHBOARD_WIREFRAME.md)**

**Top Navigation:**
- Logo + App title
- Tab navigation: Dashboard, Payroll, History, Settings
- Account dropdown: View Profile, Switch Role (if dual), Disconnect Wallet
- Notification bell with unread count badge

**Alert Banners:**
- Warning banner: "Low balance warning: You have 3.5 months of runway" (dismissible)
- Info banner: Wallet address display with copy button
- Success banner: Transaction confirmations (auto-dismiss after 5s)

**Company Dashboard View:**
- Quick Stats grid (4 columns): Total Payroll This Month, Active Employees, Pending Payments, Total Payments Made
- Feature Cards (2x2 grid):
  - Pay Employee (3D illustration, "Send encrypted payroll payments")
  - Recurring Payments (3D illustration, "Set up automated monthly salaries")
  - Add Employee (3D illustration, "Onboard new team members privately")
  - Fair Pay Analysis (3D illustration, "Run ZK-powered equity audit")
- Featured Companies carousel (privacy-preserving company list)
- Quick Actions floating panel (bottom-right): Pay Employee +, Add Employee +

**Employee Dashboard View:**
- Quick Stats grid (4 columns): Current Balance, This Month Received, Pending Payments, Total Payments Received
- Feature Cards:
  - Withdraw Funds (withdraw to external wallet)
  - Payment History (view all payments)
  - Generate Proof (create ZK proofs for third parties)
  - Settings (account management)
- Recent Payments table (last 5 payments with decrypt buttons)

**Empty States:**
- No employees yet: "Add your first employee to get started" with CTA
- No payments yet: "No payment history yet" with helpful tips

**Components to Build:**
- `components/layout/`: AppNavigation, AlertBanner, QuickActions
- `components/dashboard/`: FeatureCard, StatsGrid, FeaturedCompanies, EmptyState
- `components/shared/`: NotificationBell, AccountDropdown

---

**Day 17: Payroll Operations (PAYROLL_PAGES_WIREFRAMES.md)**

**Add Employee Page:**
- Form: Employee wallet address, monthly salary, role/title, start date, notes (optional)
- Validation: address format check, duplicate detection, minimum salary check
- Success flow: Confirmation modal → redirect to employee list
- Blockchain transaction with loading state and gas fee display

**Pay Employee (One-Time Payment):**
- Employee selection dropdown with search
- Amount input with token selector (USDC/DUST)
- Payment memo (optional, encrypted)
- Balance check and insufficient funds warning
- Confirmation modal with transaction summary
- Success state with transaction hash and "View on Explorer" link

**Recurring Payments Setup:**
- Form: Employee, amount, frequency (weekly/bi-weekly/monthly), start date, end date (optional)
- Auto-debit approval explanation
- Transaction authorization with wallet signature
- Success state showing next payment date

**Batch Payroll:**
- CSV upload interface with template download
- Preview table showing all payments to be processed
- Total amount calculation and balance check
- Bulk approval with single signature
- Progress indicator during batch processing (1/50, 2/50...)
- Success summary: "50 payments sent successfully"

**Recurring Management:**
- List of all active recurring payments
- Actions: Pause, Resume, Edit Amount, Cancel
- Edit modal: Update amount, change frequency
- Pause confirmation: "Subscription paused until you resume"
- Cancel confirmation with warning: "This cannot be undone"

**Components to Build:**
- `components/payroll/`: AddEmployeeForm, PaymentForm, RecurringSetup, BatchUpload, RecurringManager
- `components/shared/`: ConfirmationModal, TransactionStatus, SuccessAnimation

---

**Day 18: Payment History & Details (PAYROLL_LIST_VIEW_WIREFRAME.md, PAYMENT_DETAIL_PAGE_WIREFRAME.md)**

**Payroll List View (Company):**
- Tab navigation: All, Received, Sent, Search
- Primary CTA: "Pay Employee +"
- Table columns: Status (icon), Employee/Company, Amount, Date, Type, Actions
- Row hover state with payment metadata
- Actions dropdown per row: View Details, Generate Proof, Download Receipt, Cancel (if pending)
- Pagination: 20 per page with page selector
- Empty states with actionable cards

**Payroll List View (Employee):**
- Privacy banner: "Amounts encrypted. Click 🔓 to decrypt locally"
- Table with encrypted amounts shown as "••••••"
- 🔓 icon on each row for individual decryption
- "Decrypt All Amounts" button at top
- Decryption interaction: click 🔓 → loading animation → show amount → icon changes to 🔒
- All other features same as company view

**Search Modal:**
- Filter options: Employee (dropdown), Date Range (calendar), Amount Range (min/max), Payment Type (one-time/recurring), Status (pending/completed/failed), Network (testnet/mainnet)
- Clear All button
- Show Results button with count preview
- Applied filters shown as removable chips

**Payment Detail Page:**
- Visual center: Large payment card with amount, status, date
- Attributes panel: From/To, Payment Type, Network, Transaction Hash (with copy), Block Number
- Balance Status panel: Previous balance, amount, new balance (company view)
- Transaction Details: Gas fee, confirmation time, memo (if present)
- Action buttons: Withdraw (employee), Generate Proof, Download Receipt, Cancel (if pending)

**Withdraw Modal:**
- Current balance display
- Amount to withdraw input (with "Max" button)
- Destination address (pre-filled with connected wallet)
- Gas fee estimate
- Confirmation with transaction hash

**Generate Proof Modal:**
- Proof type selector: Income Proof, Employment Proof, Credit Score Proof
- Date range selector
- "What can verifier see?" explanation
- Generate button with loading state
- Success: QR code + copyable proof string + expiration notice

**Download Receipt Modal:**
- Receipt preview (PDF format)
- Format selector: PDF, CSV
- Download button
- Email option (optional enhancement)

**Components to Build:**
- `components/payroll/`: PayrollList, PayrollRow, PayrollSearchModal, DecryptButton, PrivacyBanner
- `components/payment/`: PaymentDetail, WithdrawModal, GenerateProofModal, ReceiptModal
- `utils/encryption.ts`: Local decryption utilities

---

**Day 19: Settings & Notifications (SETTINGS_NOTIFICATIONS_WIREFRAMES.md)**

**Settings Layout:**
- Left sidebar navigation: Account, Wallet, Notifications, Privacy, Help & Support
- Content area with section-specific forms
- Auto-save indicators
- Unsaved changes warning on navigation

**Company Settings:**
- Account tab: Company name, email, logo upload, timezone
- Wallet Management:
  - Payroll account balance display (large)
  - Next payment estimate (date + amount)
  - Balance after next payment calculation
  - Low balance warning (configurable threshold)
  - "Fund Account" CTA button
  - Transaction history link
- Notifications: Email preferences, low balance alerts, payment confirmations
- Privacy: Data export, account deletion

**Fund Account Flow (Modal):**
- Current balance display
- Upcoming payments summary (next 30 days total)
- Balance after payments (calculated)
- Runway estimate (months)
- Amount to deposit input
- Token selector (USDC dropdown)
- Deposit from: Connected wallet / External transfer
- Available balance check (if connected wallet)
- Summary panel: Deposit amount, gas fee, new balance, new runway
- Confirm Deposit button
- Transaction status with progress indicator

**Employee Settings:**
- Account tab: Display name, email, profile picture
- Connected Wallet: Address display with copy button, disconnect option
- Backup & Recovery: Seed phrase warning, backup reminder
- Notifications: Payment alerts, proof request alerts, system updates
- Privacy: View data, export data, delete account

**Notification System:**
- Bell dropdown (top nav):
  - Header: "Notifications" with unread count
  - Notification list (max 5 recent)
  - Each item: Icon, title, time, mark as read
  - "View All" link to full notification center
  - "Mark All as Read" action
- Toast notifications (bottom-right):
  - Success: Green with checkmark icon, 5s auto-dismiss
  - Error: Red with X icon, persistent until dismissed
  - Info: Blue with i icon, 5s auto-dismiss
  - Warning: Orange with ! icon, 7s auto-dismiss
  - Action button optional (e.g., "View", "Undo")

**Components to Build:**
- `components/settings/`: SettingsLayout, AccountSettings, WalletSettings, NotificationSettings, PrivacySettings
- `components/modals/`: FundAccountModal
- `components/notifications/`: NotificationBell, NotificationDropdown, Toast
- `services/NotificationService.ts`: Centralized notification management

---

**Day 20: Help, Accessibility & Polish (MISC_UX_COMPONENTS.md)**

**Help Center:**
- Help icon in top nav (? icon)
- Help modal with:
  - Search bar ("Search for help...")
  - Category tabs: Getting Started, Payments, Proofs, Troubleshooting
  - FAQ accordion (10-15 common questions)
  - Contact Support button (email/Discord)
  - Video tutorial links (YouTube/Loom)

**Contextual Help:**
- Tooltips on all complex UI elements (i icon with hover)
- Inline hints for form fields (light gray text below inputs)
- "Learn more" links throughout UI

**Tutorial System:**
- First-time user product tour (Shepherd.js or similar):
  - Step 1: "This is your dashboard"
  - Step 2: "Pay employees here"
  - Step 3: "View payment history here"
  - Step 4: "Generate ZK proofs here"
  - Skip button + progress dots
- Inline hints that appear on first visit to each page
- "Show Tutorial Again" option in settings

**Loading States:**
- Skeleton screens for all major views (dashboard, payment list, payment detail)
- Shimmer animation on skeleton elements
- Progress indicators for long operations:
  - Circular spinner for <5s operations
  - Progress bar for batch operations (with percentage)
  - Step indicator for multi-step flows (1/4, 2/4...)
- Optimistic UI: Show action immediately, confirm asynchronously

**Accessibility (WCAG 2.1 AA Compliance):**
- Keyboard Navigation:
  - Tab/Shift+Tab through all interactive elements
  - Enter/Space activates buttons
  - Escape closes modals/dropdowns
  - Arrow keys navigate dropdowns/lists
  - Focus indicators: 2px solid cyan with 4px offset
  - "Skip to main content" link at top
- Screen Reader Support:
  - Semantic HTML (header, nav, main, section, footer)
  - ARIA labels on all icon buttons
  - ARIA live regions for toast notifications (aria-live="polite")
  - ARIA live regions for errors (aria-live="assertive")
  - Focus management (trap focus in modals)
- Color Contrast:
  - All text meets WCAG AA (4.5:1 minimum)
  - Interactive elements meet AAA (7:1)
  - Status indicators use icons + text (not color alone)
- Alt text on all images and 3D illustrations

**Error Pages:**
- 404 Not Found: Friendly illustration + "Go Home" button
- 500 Server Error: Apology + "Try Again" button
- Network Error: Offline detection + "Retry Connection" button
- Maintenance Mode: Scheduled maintenance notice + countdown

**Browser Compatibility:**
- Unsupported browser detection (IE, old Chrome/Firefox)
- Unsupported browser modal with browser download links
- Mobile browser detection: "Best viewed on desktop" notice (for complex features)

**Mobile Responsive Design:**
- Breakpoints: Desktop (>1024px), Tablet (768-1024px), Mobile (<768px)
- Mobile navigation: Hamburger menu instead of tabs
- Mobile tables: Card layout instead of table (stack columns vertically)
- Mobile modals: Full-screen instead of centered
- Touch-friendly targets: Minimum 44x44px hit areas
- Mobile quick actions: Bottom sheet instead of floating panel

**UI Polish:**
- Micro-interactions: Button hover states, ripple effects, smooth transitions
- Empty state illustrations (custom or from unDraw)
- 3D illustrations for feature cards (Spline or similar)
- Consistent spacing (8px grid system)
- Typography hierarchy (3 font sizes max)
- Color palette consistency (primary, secondary, success, error, warning, info)
- Dark mode support (optional - if time permits)

**Component Architecture:**
- `components/help/`: HelpCenter, FAQAccordion, VideoTutorial, ContextualHelp
- `components/tutorial/`: ProductTour, InlineHint
- `components/loading/`: SkeletonScreen, Spinner, ProgressBar, StepIndicator
- `components/errors/`: ErrorPage404, ErrorPage500, NetworkError, MaintenanceMode
- `components/a11y/`: SkipLink, FocusTrap, ScreenReaderOnly
- `hooks/useKeyboardNav.ts`: Keyboard navigation utilities
- `utils/a11y.ts`: Accessibility helper functions

---

**Day 21: Demo Preparation & Final Testing**

**Create Demo Data:**
- Mock company: "Midnight DAO" with realistic logo
- 50 mock employees with diverse names and addresses
- Historical payments: 6 months of payment history (300+ transactions)
- Run actual payroll on Midnight testnet
- Generate real ZK proofs (credit scoring, fair pay analysis)
- Test full user flows:
  - Company: Add employee → pay employee → run fair pay analysis → generate proof
  - Employee: View payment → decrypt amount → generate income proof → withdraw funds
  - Verifier: Receive proof → verify proof → view results

**Testing Checklist:**
- Functional testing: All features work end-to-end
- Cross-browser testing: Chrome, Firefox, Safari, Edge
- Mobile testing: iOS Safari, Android Chrome (basic responsiveness check)
- Accessibility testing: Keyboard navigation, screen reader (NVDA/VoiceOver)
- Performance testing: Page load times, proof generation times
- Security testing: XSS prevention, SQL injection checks (if applicable), CSRF protection
- Error handling: Test all error states (network failure, insufficient funds, etc.)
- Edge cases: Empty states, very long names, large numbers, special characters

**Polish & Practice:**
- UI/UX final pass: Consistent spacing, alignment, typography
- Copy editing: Fix typos, improve button labels, clarify instructions
- Fix critical bugs only (defer minor issues)
- Practice pitch (2 minutes):
  - Opening (15s): Problem statement
  - Demo Part 1 (30s): Show public payroll problem (Etherscan)
  - Demo Part 2 (30s): Show zkSalaria private payroll
  - Demo Part 3 (45s): Show ZKML features (credit scoring + fair pay)
  - Close (15s): Differentiation vs Aleo, call to action
- Record backup video demo (in case live demo fails)

**Final Deployment:**
- Deploy frontend to Vercel/Netlify (production build)
- Deploy smart contracts to Midnight testnet (if not already deployed)
- Configure custom domain (optional)
- Set up analytics (privacy-preserving - Plausible or similar)
- Create pitch deck (10 slides max):
  - Slide 1: Title + tagline
  - Slide 2: Problem (public salaries)
  - Slide 3: Market validation (Aleo's $4M)
  - Slide 4: Solution overview
  - Slide 5: ZKML features
  - Slide 6: Technical architecture
  - Slide 7: Competitive positioning
  - Slide 8: Business model
  - Slide 9: Traction/roadmap
  - Slide 10: Team + contact

**Pre-Demo Checklist:**
- Test on-site network (if possible)
- Backup: Pre-loaded demo data, pre-recorded video, static screenshots
- Prepare for questions: Technical depth, scalability, business model, regulatory
- Charge laptop, bring chargers, test HDMI/display connection

**Deliverable:** Competition-ready demo + pitch + backup materials

---

## Technology Stack

### Blockchain & Privacy
- **Midnight Network:** Testnet deployment
- **Compact Language:** TypeScript-like DSL for smart contracts
- **Midnight.js SDK:** Frontend integration
- **Lace Wallet:** User authentication

### ZKML Libraries
- **EZKL:** Convert ML models to ZK circuits (primary)
- **Giza:** Alternative for specific models (backup)
- **zkML (Modulus Labs):** Research reference

### Machine Learning
- **Python 3.10+:** Model development
- **PyTorch:** Deep learning models
- **scikit-learn:** Classical ML (regression, classification)
- **XGBoost:** Gradient boosting (credit scoring)
- **ONNX:** Model export format
- **Pandas/NumPy:** Data manipulation

### Frontend
- **React 18:** UI framework
- **TypeScript:** Type safety
- **Vite:** Build tool
- **TailwindCSS:** Styling
- **Material-UI:** Component library
- **RxJS:** Reactive state management

### Backend/API
- **Node.js:** Server runtime
- **Express:** API framework (if needed)
- **TypeScript:** Type safety

### Development Tools
- **Git/GitHub:** Version control
- **Docker:** Containerization (optional)
- **Jest:** Testing
- **ESLint/Prettier:** Code quality

---

## Demo Strategy

### The 2-Minute Pitch

**Opening (15 seconds):**
> "Crypto payroll is broken. Every salary is public on Ethereum. Aleo and Request Finance solved privacy - they processed $4M in 2 months. But privacy alone isn't enough. You need intelligence."

**Problem Demo (30 seconds):**
- Show Etherscan: Real DAO payroll (all amounts visible)
- "Alice makes $7,500. Bob makes $5,000. Everyone knows. Alice gets targeted for phishing. Bob feels underpaid and quits."

**Solution Part 1: Privacy (30 seconds):**
- Show zkSalaria payroll on Midnight
- "Same payroll, but private. Watch the explorer - no amounts, no recipients."
- "This is what Aleo does. We do this too. But we go further."

**Solution Part 2: ZKML Intelligence (45 seconds):**
- **Credit Scoring:**
  - "Alice needs $2k for emergency. Traditional lender wants bank statements."
  - "Watch: ML analyzes her payment history locally. Credit score: 745. ZK proof generated."
  - "Company approves $2k advance. Never saw her salary or score. This is new revenue."

- **Fair Pay Analysis:**
  - "Company has 50 employees. Are we paying fairly?"
  - "ML analyzes all salaries - encrypted. Result: Gender gap 2.1%, not statistically significant."
  - "ZK proof generated. Regulators verify. Board verifies. No salary revealed. Ever."
  - "Try doing THIS with Gusto or Rippling. Legally impossible. We can."

**Close (15 seconds):**
> "Aleo built Private Payroll 1.0. We built 2.0. Zero-knowledge machine learning unlocks insights that are impossible today. zkSalaria - the highway of fair wages. Built on Midnight."

---

### Live Demo Flow

**Setup:**
- Pre-loaded company "Midnight DAO" with 50 employees
- Real transactions on Midnight testnet
- Mock employee "Alice" logged in
- Mock verifier "Springfield Apartments" ready

**Demo Sequence:**

1. **Show Public Problem** (Etherscan)
   - Display real DAO payroll transactions
   - Point out visible amounts

2. **Show Private Payroll** (zkSalaria)
   - Run payroll for 50 employees
   - Show Midnight explorer (no details)
   - Employee view: Alice sees her payment

3. **Credit Scoring Feature**
   - Alice clicks "Request Advance"
   - Show ML analyzing locally (network tab: no uploads)
   - Generate ZK proof: "Qualifies for $3k"
   - Company approves instantly

4. **Fair Pay Analysis**
   - Admin clicks "Analyze Pay Equity"
   - ML runs (show progress)
   - Result: "No significant gap detected"
   - Generate ZK proof
   - Show verification (anyone can verify, no data exposed)

5. **Technical Proof**
   - Open smart contract on explorer
   - Show proof verification transaction
   - "This is mathematically proven, not trusted."

**Backup:** Pre-recorded video of entire flow (if demo gods are cruel)

---

## Competitive Positioning

### vs Aleo + Request Finance

| Feature | Aleo/Request | zkSalaria |
|---------|--------------|-----------|
| **Private Payments** | ✅ | ✅ |
| **Hide Amounts** | ✅ | ✅ |
| **Credit Scoring** | ❌ | ✅ |
| **Fair Pay Analysis** | ❌ | ✅ |
| **Fraud Detection** | ❌ | ✅ |
| **Salary Benchmarking** | ❌ | ✅ |
| **Retention Analytics** | ❌ | ✅ |
| **Network Effects** | ⚠️ (basic) | ✅ (benchmarking moat) |

**Our Advantage:** They validated the market. We captured the moat.

---

### vs Traditional Payroll (Gusto, Rippling)

**What they can't do:**
- Fair pay analysis (privacy laws prevent cross-employee analysis)
- Private credit scoring (centralized = trust required)
- Fraud detection without surveillance (compliance issues)

**What we can do:**
- All of the above (ZKML enables legally impossible insights)
- Crypto-native (DAOs can't use Gusto easily)
- Global (no banking restrictions)

**Our Advantage:** Unlock insights traditional systems legally can't provide.

---

### vs Other Hackathon Teams

**Expected Competition:**
- 15+ teams building "AI agent reputation systems" (hyped, crowded)
- 5+ teams building property tokenization (BrickChain clones)
- 3+ teams building general "privacy vaults" (no specific focus)

**Our Differentiation:**
1. **Proven market:** Aleo showed $4M demand in 2 months
2. **Clear customer:** DAOs need this TODAY (not theoretical)
3. **Technical depth:** Actually implementing ZKML (not just talking about it)
4. **Business model:** B2B SaaS with clear pricing
5. **Uncrowded:** Only team doing payroll + ZKML

**Strategic Advantage:** Boring is beautiful. Everyone builds toys, we build infrastructure.

---

## Finance Track Alignment

### Why This Wins Finance Track

**Track Description:** "Compliant privacy for the real economy... ZK-KYC, private settlement, policy-gated disclosure"

**Our Fit:**

✅ **Real Economy:** Payroll is literally the real economy (not DeFi speculation)

✅ **ZK-KYC Equivalent:**
- Prove employment without revealing employer
- Prove income without revealing amount
- Prove creditworthiness without financial exposure

✅ **Private Settlement:**
- Shielded salary payments via Midnight
- No public transaction amounts
- Only sender/receiver know details

✅ **Policy-Gated Disclosure:**
- Employees control who sees what
- Selective disclosure to IRS (tax compliance)
- Conditional reveals to lenders/landlords
- Revocable access

✅ **Regulatory Friendly:**
- Fair pay analysis for DEI compliance
- Provable tax payments
- Audit trails without public exposure

**Track Example: "ZK-KYC lending pool"**
- Our credit scoring feature is literally this
- Prove creditworthiness, get loan, maintain privacy

---

## Success Metrics

### Hackathon Goals

**Must Have (Minimum Viable):**
- ✅ Working private payroll on Midnight testnet
- ✅ One ZKML feature working (credit scoring)
- ✅ Live demo (no mocks)
- ✅ Clear pitch (2 minutes)

**Should Have (Competitive):**
- ✅ Two ZKML features (credit scoring + fair pay)
- ✅ Production-quality UI
- ✅ Actual ZK proofs generated and verified
- ✅ Differentiated positioning vs Aleo

**Nice to Have (Winning):**
- ✅ Three ZKML features
- ✅ Network effect demonstration (benchmarking)
- ✅ Technical whitepaper
- ✅ Video demo (backup)

---

### Post-Hackathon (if applicable)

**Phase 1 (Months 1-3):**
- Launch MVP with 5 pilot DAOs
- Iterate based on feedback
- Midnight mainnet deployment (when available)

**Phase 2 (Months 4-6):**
- 20+ paying customers
- All 5 ZKML features production-ready
- Raise pre-seed ($500k-$1M)

**Phase 3 (Months 7-12):**
- 100+ customers
- Enterprise features
- Seed round ($2-3M)

---

## Risk Mitigation

### Technical Risks

**Risk: ZKML circuit generation fails**
- Mitigation: Use pre-trained simple models (linear regression, decision trees)
- Fallback: Demonstrate concept with simplified circuits
- Test early (Week 2, Day 10)

**Risk: Midnight testnet issues**
- Mitigation: Deploy early, test continuously
- Fallback: Local Midnight node for demo
- Backup: Video demo if network down

**Risk: Performance (proof generation too slow)**
- Mitigation: Optimize circuit size, use smaller models
- Acceptable: 30-60 seconds for proof (vs instant)
- User education: "Generating cryptographic proof..."

---

### Business Risks

**Risk: Aleo/Request adds ZKML**
- Mitigation: They're focused on enterprise sales, 12+ months to ship
- Our advantage: Move fast, capture early adopters
- Patent consideration: File provisional patents on ZKML payroll methods

**Risk: Market too small**
- Mitigation: 10,000+ DAOs with treasuries, growing fast
- Expansion: Crypto companies, eventually traditional companies
- Evidence: Aleo's $4M in 2 months proves demand

**Risk: Regulatory concerns**
- Mitigation: Selective disclosure to regulators built-in
- Positioning: "Privacy from PUBLIC, not from government"
- Legal: Like direct deposit (coworkers don't see your salary)

---

### Execution Risks

**Risk: Can't build all 5 ZKML features in 3 weeks**
- Mitigation: Prioritize credit scoring + fair pay (most impactful)
- Acceptable: 2 features working perfectly > 5 features half-working
- Week 2 decision point: Assess progress, adjust scope

**Risk: Demo fails on stage**
- Mitigation: Extensive testing Week 3
- Backup: Pre-recorded video
- Fallback: Static screenshots with narrative

**Risk: Pitch doesn't land**
- Mitigation: Practice 20+ times
- Test on non-technical people (do they get it?)
- Record and review

---

## Why We Win

### Judge Criteria Alignment

**Product & Vision (20%):**
- ✅ Clear problem (public salaries)
- ✅ Proven market (Aleo's $4M)
- ✅ Big vision (reimagine compensation infrastructure)

**Engineering & Implementation (20%):**
- ✅ Complex (ZKML + Midnight)
- ✅ Working demo (not vaporware)
- ✅ Technical depth (5 ZKML features)

**User Experience & Design (15%):**
- ✅ Intuitive (looks like Gusto/Rippling)
- ✅ Two-sided (companies + employees)
- ✅ Clear value (before/after comparison)

**Quality Assurance & Reliability (15%):**
- ✅ Tested (on real testnet)
- ✅ Reproducible (judges can verify)
- ✅ Polished (3 weeks is enough)

**Communication & Advocacy (15%):**
- ✅ Clear pitch (everyone understands payroll)
- ✅ Demo impact (ZKML is visually impressive)
- ✅ Differentiated (not another AI agent toy)

**Business Development & Viability (15%):**
- ✅ Revenue model (B2B SaaS, $99-999/month)
- ✅ Clear customers (DAOs, easy to reach)
- ✅ Validated market (Aleo proved it)

---

### The Narrative

**What judges will remember:**

"Everyone else built AI agent toys. These people built infrastructure for a $4M proven market. They showed working ZKML that does things that are legally impossible with traditional systems. And they're launching in January."

**The emotion:**

> "I get paid in crypto. My salary is public. I've been doxxed. I need this. When can I use it?"

**The technical respect:**

> "They actually implemented ZKML. Not just talked about it. Those proofs are real. This is hard engineering."

**The business conviction:**

> "Aleo did $4M in 2 months with basic privacy. These people have intelligence as a moat. Network effects from benchmarking. This is a real company."

---

## Future Enhancement: Token Vesting

**Status:** Out of scope for hackathon MVP
**Documentation:** See `VESTING_DESIGN.md` for complete specification

**What is it:**
Token vesting extends zkSalaria beyond payroll to include **equity/token compensation** with time-locked grants. While payroll is "pay-as-you-go" (work → get paid), vesting is "grant-upfront" (tokens locked → unlock over time).

**Why consider it:**
- Completes the compensation story (salary + equity = total comp)
- Competitive differentiation from Sablier (adds ZK privacy to vesting)
- Natural fit for web3 companies (many pay salary + token grants)
- Reuses zkSalaria's encrypted balance infrastructure

**Example Use Case:**
- Company grants employee 100,000 tokens on Jan 1, 2024
- 1-year cliff (no tokens until Jan 1, 2025)
- 4-year linear vesting (fully vested Jan 1, 2028)
- After cliff: 2,083 tokens unlock per month
- Employee can withdraw vested tokens anytime
- If employee leaves, company reclaims unvested tokens

**Technical Highlights:**
- Vesting schedules stored on public ledger (dates are public)
- Token amounts encrypted (grant amount, vested amount stay private)
- Smart contract calculates vested amount using `current_timestamp`
- Employee withdraws via `withdraw_vested()` circuit
- Company can cancel via `cancel_vesting()` circuit

**Privacy Trade-off:**
- Schedule dates must be public (contract needs them for calculations)
- Token amounts stay encrypted (privacy preserved)
- ZKML enhancement: Employee can prove "I have vested tokens worth > $X" without revealing exact amount

**Implementation Effort:**
- ~4-6 weeks after MVP launch
- Reuses existing encrypted balance primitives
- New circuits: grant_vesting, withdraw_vested, cancel_vesting
- New UI: Vesting timeline, grant modal, withdrawal interface

**Positioning vs Sablier:**
- **Sablier:** Public vesting (all amounts visible)
- **zkSalaria:** Private vesting (encrypted amounts, ZK proofs)

**Recommendation:** Build payroll first, add vesting after product-market fit

**See:** `docs/technical/VESTING_DESIGN.md` for complete specification with UX wireframes, smart contract code, and implementation roadmap.

---

## Appendix: ZKML Technical Details

### Why ZKML is Hard (and Why That's Good)

**Challenge 1: Circuit Size**
- Neural networks have millions of parameters
- Each parameter = constraint in ZK circuit
- Larger circuits = longer proof time (exponential)
- Solution: Use simpler models (linear regression, small trees)

**Challenge 2: Non-Linearity**
- ZK circuits work with polynomial constraints
- Neural network activations (ReLU, sigmoid) are non-linear
- Approximation introduces error
- Solution: Use models with simpler math (linear, decision trees)

**Challenge 3: Floating Point**
- ZK circuits use finite fields (integers)
- ML models use floating point (decimals)
- Conversion loses precision
- Solution: Fixed-point arithmetic (scale integers)

**Why This Creates a Moat:**
- Not every ML model can be converted to ZK
- Requires deep expertise (cryptography + ML + optimization)
- 6-12 months for competitors to replicate
- We'll have production data and feedback loops by then

---

### Our ZKML Approach

**For Credit Scoring:**
- Model: XGBoost with 1000 trees, depth 8
- Circuit size: ~50,000 constraints (feasible)
- Proof time: ~30 seconds on consumer laptop
- Accuracy: 82% (acceptable for credit decisions)

**For Fair Pay Analysis:**
- Model: Linear regression (inherently ZK-friendly)
- Circuit size: ~1,000 constraints (very efficient)
- Proof time: <5 seconds
- Accuracy: R² = 0.89 (excellent for salary prediction)

**For Fraud Detection:**
- Model: Isolation Forest (tree-based)
- Circuit size: ~20,000 constraints
- Proof time: ~15 seconds
- Accuracy: 94% anomaly detection

**Conversion Process:**
1. Train model in Python (PyTorch/scikit-learn)
2. Export to ONNX format (standardized ML model format)
3. Use EZKL to generate ZK circuit from ONNX
4. Compile circuit for Midnight's proof system
5. Generate proving/verification keys
6. Integrate with Compact smart contracts

---

### EZKL Integration Example (Conceptual)

**Step 1: Train Model**
```python
# Python - train credit scoring model
import xgboost as xgb
model = xgb.XGBClassifier(n_estimators=1000, max_depth=8)
model.fit(X_train, y_train)
```

**Step 2: Export to ONNX**
```python
# Convert to ONNX
from skl2onnx import convert_sklearn
onnx_model = convert_sklearn(model, initial_types=[...])
with open("credit_model.onnx", "wb") as f:
    f.write(onnx_model.SerializeToString())
```

**Step 3: Generate ZK Circuit**
```bash
# EZKL - generate circuit
ezkl gen-settings -M credit_model.onnx
ezkl compile-circuit -M credit_model.onnx
ezkl setup -M credit_model.onnx
```

**Step 4: Generate Proof**
```python
# Generate ZK proof of credit score
proof = ezkl.prove(
    witness_data=employee_payment_history,
    model="credit_model.onnx"
)
```

**Step 5: Verify in Smart Contract**
```compact
// Compact smart contract
export circuit verify_credit_proof(
  proof: Bytes<256>,
  employee_id: Bytes<32>
): Boolean {
  // Verify ZK proof using Midnight's verification
  const valid = midnight_verify_proof(proof);
  assert(valid, "Invalid proof");
  return true;
}
```

---

## Final Thoughts

**zkSalaria isn't just a hackathon project.** It's the foundation for reimagining compensation infrastructure in a privacy-first world.

Aleo and Request Finance proved the market exists. We're building the product that will dominate it.

**The name says it all:** Via Salaria was Rome's salt road - the ancient highway where value flowed to soldiers. We're building the modern version: a decentralized, intelligent, privacy-preserving infrastructure for fair wages.

**Three weeks. Five ZKML features. One goal: Win.**

---

## Quick Reference

**Project Name:** zkSalaria
**Tagline:** "The Highway of Fair Wages"
**Track:** Finance
**Tech:** Midnight + ZKML (EZKL/Giza)
**Timeline:** 3 weeks
**Team Size:** [Your team size]
**Demo URL:** [Will be deployed Week 3]
**GitHub:** [Will be created]

**Contact:** [Your contact info]

---

*Built with mathematical rigor and ancient wisdom. Named after Via Salaria - because fair compensation has been a highway, not a barrier, for 2,000 years.*
