# zkSalaria UI Implementation Roadmap

**Version:** 1.3
**Date:** 2025-11-08
**Status:** Phase 3 Complete, Phase 2 In Progress
**Backend Coverage:** 98% Complete ✅ (On-Chain Recovery Implemented)

---

## Executive Summary

This document provides a **complete implementation roadmap** for the zkSalaria UI, synthesizing all wireframe documents into a prioritized, phased development plan.

**Total Screens:** 28 unique pages/views
**Total Components:** ~85 reusable components
**Estimated Timeline:** 6-8 weeks (2 developers)
**Backend Readiness:** ✅ All critical APIs implemented

---

## Phase Overview

| Phase | Focus | Screens | Duration | Priority |
|-------|-------|---------|----------|----------|
| **Phase 1** | Auth & Core Setup | 5 screens | 1 week | 🔴 Critical |
| **Phase 2** | Payment Operations | 8 screens | 2 weeks | 🔴 Critical |
| **Phase 3** | Dashboard & Lists | 6 screens | 1.5 weeks | 🟠 High |
| **Phase 4** | Settings & Management | 5 screens | 1 week | 🟡 Medium |
| **Phase 5** | Polish & UX | 4 features | 1 week | 🟢 Nice-to-have |

---

## Phase 1: Authentication & Core Setup (Week 1)

**Goal:** Get users connected and onboarded with role detection.

### Screens to Build

#### 1.1 Landing Page (`/`) ✅ **COMPLETED**
- **File Reference:** `1_ONBOARDING_WIREFRAME.md` (Page 1)
- **Status:** ✅ Shipped November 5, 2025
- **Implementation:**
  - Hero section with typing animation and video backgrounds (dark/light modes)
  - Use Cases section (4 cards)
  - Features section (accordion with visual content)
  - Metrics section with gradient text
  - CTA section and Footer
  - Theme system fully integrated
- **Components Built:**
  - LandingPage.tsx
  - UseCasesSection.tsx
  - FeaturesSection.tsx
  - MetricsSection.tsx
  - CTASection.tsx
  - Footer.tsx
  - ThemeToggle.tsx
- **Backend:** None (static page)

#### 1.2 Connect Wallet Page (`/connect`) ✅ **COMPLETED**
- **File Reference:** `AUTHENTICATION_ONBOARDING_WIREFRAMES.md` (Page 2)
- **Status:** ✅ Shipped November 5, 2025 (Updated November 7, 2025)
- **Implementation:**
  - Wallet detection (Midnight Lace installed check)
  - Connection flow with loading states
  - Error handling (not installed, timeout, rejected)
  - **Auto-reconnect on page reload** using Lace `isEnabled()` API (no localStorage flags needed)
  - Wallet stays connected across page refreshes (matches bank-ui pattern)
  - WalletConnectionPrompt reusable component for non-connected state
  - Theme-aware UI with glass morphism
- **Components Built:**
  - ConnectWalletPage.tsx (fully themed)
  - PayrollWalletContext.tsx (state management + auto-reconnect)
  - WalletConnectionPrompt.tsx (reusable prompt component)
  - connectToWallet.ts (wallet SDK integration)
- **Auto-Connect Logic:**
  - On mount, checks `window.midnight.mnLace.isEnabled()` to detect previous authorization
  - If authorized and not connected, silently reconnects in background
  - No race conditions - dashboard waits for connection before showing content
- **Backend:** Midnight Lace Wallet SDK integration ✅
- **Critical:** ✅ Wallet connection working with persistent sessions

#### 1.3 Network Validation & Role Detection (`/loading`) ✅ **COMPLETED**
- **File Reference:** `AUTH_ONBOARDING_FLOW.md` (Pages 4-5)
- **Status:** ✅ Shipped November 5, 2025
- **Implementation:**
  - Network validation hook with chainId checking
  - Loading page with multi-step progress indicator
  - Role detection service (smart contract queries)
  - Intelligent routing based on detected role
  - Error handling for network mismatch
- **Components Built:**
  - RoleDetectionPage.tsx (loading UI with status)
  - useNetworkValidation.ts (network checking hook)
  - roleDetection.ts (smart contract query service)
  - Updated ConnectWalletPage to redirect to /loading
  - Updated App.tsx with /loading route
- **Routing Logic:**
  - New User → `/onboarding/role` (Phase 1.4)
  - Company Only → `/dashboard` (company view)
  - Employee Only → `/dashboard` (employee view)
  - Both Roles → `/role-switcher` (Phase 1.5)
- **Backend API:** Network validation ✅, Role queries (mock ready for integration)
- **Sub-tasks:**
  - ✅ Network validation component
  - ✅ Network error handling
  - ✅ Loading page with status updates
  - ✅ Role detection service
  - ✅ Routing logic (redirect to correct page)

#### 1.4 Company Onboarding Wizard (`/onboarding/company`) ✅ **COMPLETED**
- **File Reference:** `AUTH_ONBOARDING_FLOW.md` (Pages 7, 7b, 7c)
- **Status:** ✅ Shipped November 5, 2025
- **Implementation:**
  - Company registration form with validation
  - Contract deployment (mock ready for integration)
  - Quick start wizard with 3 optional steps
  - Multi-step progress indicator (Stepper)
  - Skip functionality for all optional steps
  - Progress summary with completed items
- **Components Built:**
  - CompanyOnboardingPage.tsx (registration form)
  - CompanyQuickStartPage.tsx (3-step wizard)
  - Updated RoleSelectorPage to navigate to company onboarding
  - Updated App.tsx with onboarding routes
- **Wizard Steps:**
  - Step 1: Fund payroll account (optional, can skip)
  - Step 2: Add first employee (optional, can skip)
  - Step 3: Setup recurring payment (optional, requires employee)
  - All steps skippable → navigate to dashboard
- **Form Validation:**
  - Company name: Required, 2-100 characters
  - Email: Required, valid format
  - Terms: Must be checked
  - Real-time error messages
- **Backend API:** Mock implementation ready for:
  - `PayrollAPI.deploy()` - Company creation
  - `depositCompanyFunds()` - Account funding
  - `addEmployee()` - Employee onboarding
  - `createRecurringPayment()` - Recurring setup
- **Data Persistence:** localStorage (temporary, ready for state management)

#### 1.5 Employee Onboarding Page (`/onboarding/employee`) ✅ **COMPLETED**
- **File Reference:** `AUTH_ONBOARDING_FLOW.md` (Page 10)
- **Status:** ✅ Shipped November 5, 2025
- **Implementation:**
  - Two-state checking system (checking → added/pending)
  - State 1 (Added): Welcome screen with company info, encrypted balance with decrypt toggle
  - State 2 (Pending): "Not Yet Added" screen with wallet address copy and email employer functionality
  - Mock implementation ready for smart contract integration
  - Theme-aware UI with glass morphism
- **Components Built:**
  - EmployeeOnboardingPage.tsx with both states
  - Updated RoleSelectorPage to navigate to employee onboarding
  - Updated App.tsx with /onboarding/employee route
- **Features:**
  - **State 1: Employee Added (by company)**
    - Success icon and welcome message
    - Company name display
    - Role and salary information
    - Encrypted balance display with decrypt/encrypt toggle button
    - Info alert about encrypted on-chain balance
    - "Go to Dashboard" button
  - **State 2: Employee Pending (not added yet)**
    - Clock icon and "Not Yet Added" message
    - Wallet address display with copy button
    - "Copy Address" and "Email Employer" buttons
    - Instructions for sharing address with employer
    - Help text about company requirement
- **Backend API:** `getEmployeeInfo()` - Mock implementation ready for integration
- **Note:** Employees cannot self-register. They must be added by a company first.

### Phase 1 Deliverables
- ✅ Landing page with branding
- ✅ Wallet connection flow
- ✅ Role-based routing
- ✅ Company onboarding wizard (4 steps)
- ✅ Employee welcome screen

**UI Status:** ✅ Complete (all screens built)
**API Status:** ✅ **COMPLETE** (all integrations working)

### Phase 1 API Integration Summary ✅ COMPLETED

All Phase 1 API integrations have been successfully completed:

#### 1.3 Role Detection (`roleDetection.ts`) ✅
- ✅ Integrated `api.getCompanyInfo(walletAddress)` and `api.getEmployeeInfo(walletAddress)`
- ✅ Role determination based on exists flags
- ✅ Contract address stored/retrieved from localStorage
- ✅ Proper error handling for missing contracts

#### 1.4 Company Onboarding (`CompanyOnboardingPage.tsx`) ✅
- ✅ Integrated `PayrollAPI.deploy(providers, walletAddress, companyName, logger)`
- ✅ Contract address stored in localStorage for future operations
- ✅ Pino logger integrated for debugging
- ✅ Navigation to quick start wizard after deployment

#### 1.4 Quick Start Wizard (`CompanyQuickStartPage.tsx`) ✅
- ✅ **Step 1 (Fund):** Integrated `api.depositCompanyFunds(companyId, amount)`
- ✅ **Step 2 (Add Employee):** Integrated `api.addEmployee(companyId, employeeId)`
- ✅ **Step 3 (Recurring):** Integrated `api.createRecurringPayment(companyId, employeeId, amount, frequency, startDate, endDate, dayOfWeek)`
- ✅ Contract connection on component mount
- ✅ All steps use real PayrollAPI calls
- ✅ Proper validation and error handling

#### 1.5 Employee Onboarding (`EmployeeOnboardingPage.tsx`) ✅
- ✅ Integrated `api.getEmployeeInfo(walletAddress)` to check employee status
- ✅ Uses `employeeInfo.exists` to determine added/pending state
- ✅ Fetches `api.getEmployeePaymentHistory(employeeId)` for payment count
- ✅ Contract address lookup from localStorage
- ✅ Displays company name from stored company data

**Total Effort:** 1 week (2 developers in parallel)

---

## Phase 2: Payment Operations (Weeks 2-3)

**Goal:** Enable companies to pay employees and employees to withdraw.

### Screens to Build

#### 2.1 Add Employee Modal ✅ **COMPLETED**
- **File Reference:** `PAYROLL_PAGES_WIREFRAMES.md` (Page 1)
- **Status:** ✅ Shipped November 7, 2025
- **Implementation:**
  - Modal-based employee addition (not separate route)
  - Form with fields: name, wallet address, email, role (optional), base salary (optional)
  - Real-time validation (name min 2 chars, valid email format, wallet address required, salary must be positive)
  - Duplicate employee check via `getEmployeeInfo()` API
  - Success/error toast notifications
  - Stores employee metadata in localStorage with proper TypeScript types
  - Integrated into CompanyDashboard quick actions
- **Components Built:**
  - AddEmployeeModal.tsx (full validation + API integration)
  - EmployeeMetadata type (src/types/payment.ts)
- **Backend API:** ✅ `addEmployee()`, `getEmployeeInfo()`
- **Complexity:** 🟢 Low (0.5 day)

#### 2.2 Pay Employee Modal (One-Time) ✅ **COMPLETED**
- **File Reference:** `PAYROLL_PAGES_WIREFRAMES.md` (Page 2)
- **Status:** ✅ Shipped November 7, 2025
- **Implementation:**
  - Modal-based payment interface (integrated into dashboard)
  - Employee autocomplete with search (shows name, role, base salary)
  - Amount selection: radio buttons for base salary vs custom amount
  - Custom amount field with autoFocus for better UX
  - Payment type dropdown: Regular Salary, Bonus, Commission, Reimbursement, Advance, Adjustment
  - Memo field (optional, internal notes)
  - Summary section showing employee, amount, type, gas fee, total cost
  - Success/error toast notifications
  - Stores payment metadata in localStorage with PaymentMetadata TypeScript type
  - Payment metadata includes: employeeId, employeeName, amount, paymentType, memo, timestamp, companyId
- **Components Built:**
  - PayEmployeeModal.tsx (full form + API integration)
  - PaymentMetadata type (src/types/payment.ts)
  - ToastNotification component for feedback
- **Backend API:** ✅ `payEmployee(companyId, employeeId, amount, paymentType)`
- **Complexity:** 🟡 Medium (1 day)

#### 2.3 Setup Recurring Payment (Integration with modal) ✅ **COMPLETED**
- **File Reference:** `PAYROLL_PAGES_WIREFRAMES.md` (Page 3)
- **Status:** ✅ Shipped (integrated into CompanyDashboard)
- **Implementation:**
  - Modal-based recurring payment creation from dashboard Quick Actions
  - Employee autocomplete with search
  - Amount input with validation
  - Frequency dropdown (Weekly, Bi-Weekly, Monthly)
  - Schedule picker (start date, optional end date)
  - Day of week selector for weekly/bi-weekly payments
  - Checks for existing recurring payments per employee
  - Success/error toast notifications
  - Stores recurring payment metadata in localStorage
  - Integrated with on-chain recurring payment system
- **Components Built:**
  - SetupRecurringPaymentModal.tsx (full form with validation)
  - Integrated into CompanyDashboard.tsx Quick Actions
- **Backend API:** ✅ `createRecurringPayment()`
- **Complexity:** 🟡 Medium (1.5 days)
- **Notes:**
  - Validates employee doesn't already have a recurring payment
  - Supports all three frequency types (0=Weekly, 1=Bi-Weekly, 2=Monthly)
  - Metadata stored for amount display since on-chain amounts are encrypted

#### 2.4 Run Payroll (Batch Payment) Modal - implement button as coming soon.
- **File Reference:** `PAYROLL_PAGES_WIREFRAMES.md` (Page 4)
- **Components:**
  - Employee table with checkboxes
  - Per-employee amount override
  - Select all / deselect all
  - Warnings (paid recently)
  - Confirmation modal
  - Progress modal (batch processing)
  - Success modal with PDF download
- **Backend API:** `payEmployee()` (called N times)
- **Complexity:** 🔴 High (2 days)

#### 2.5 Recurring Payments Management Modal ✅ **COMPLETED**
- **File Reference:** `PAYROLL_PAGES_WIREFRAMES.md` (Page 5)
- **Status:** ✅ Shipped November 7, 2025
- **Implementation:**
  - Modal-based recurring payments management (integrated into dashboard)
  - Card grid displaying all recurring payments with employee info
  - Filters (All, Active, Paused) with button toggles
  - **On-chain recovery capability:** Fetches ALL recurring payments from blockchain via List iteration
  - Actions menu per payment: Edit Amount, Pause, Resume
  - Edit Amount modal with validation
  - Success/error toast notifications
  - **SHA-256 hashing:** Uses `employeeUtils.ts` to hash wallet addresses for matching on-chain employee IDs with localStorage metadata
  - **Hybrid data model:** On-chain structure (frequency, status, dates, encrypted amounts) + localStorage metadata (employee names, plaintext amounts)
  - **Graceful fallback:** Shows `Employee 24aa4733...` if localStorage metadata missing
  - Empty state with instructions
- **Components Built:**
  - RecurringPaymentsModal.tsx (full CRUD + on-chain recovery)
  - employeeUtils.ts (SHA-256 hashing utility)
- **Backend API:** ✅ `getAllRecurringPayments()` (List iteration), `pauseRecurringPayment()`, `resumeRecurringPayment()`, `editRecurringPayment()`
- **Complexity:** 🟡 Medium (1.5 days)
- **Notes:**
  - True recovery capability - companies can retrieve all recurring payments from blockchain even if localStorage lost
  - Leverages new Compact List types (`recurring_payment_ids: List<Bytes<32>>`) with TypeScript iteration
  - On-chain data includes: employee_id, frequency, start_date, next_payment_date, status, encrypted_amount

#### 2.6 Withdraw Salary Modal (Employee)
- **File Reference:** `PAYMENT_DETAIL_PAGE_WIREFRAME.md` (Modal 1)
- **Components:**
  - Amount input (withdraw all vs custom)
  - Destination wallet input
  - Summary with gas estimate
  - Success modal
- **Backend API:** `withdrawEmployeeSalary()`
- **Complexity:** 🟡 Medium (1 day)

#### 2.7 Generate Proof Modal (Employee)
- **File Reference:** `PAYMENT_DETAIL_PAGE_WIREFRAME.md` (Modal 2)
- **Components:**
  - Proof type dropdown (4 types)
  - Threshold inputs
  - Options checkboxes (include employment, company name)
  - Expiration dropdown
  - Processing state (10-30s)
  - Success modal with share link
- **Backend API:** `submitIncomeProof()`
- **Complexity:** 🔴 High (2 days)

#### 2.8 Download Receipt Modal
- **File Reference:** `PAYMENT_DETAIL_PAGE_WIREFRAME.md` (Modal 3)
- **Components:**
  - Format selection (PDF, CSV, JSON)
  - Detail checkboxes
  - Privacy options (encrypted vs plaintext)
  - PDF generator
- **Backend API:** None (frontend generates PDF)
- **Complexity:** 🟡 Medium (1 day)

### Phase 2 Deliverables
- ✅ Add employee flow (modal-based)
- ✅ One-time payment (modal-based)
- ✅ Recurring payment setup (modal-based)
- ⏳ Batch payroll
- ✅ Recurring payment management (with on-chain recovery)
- ⏳ Withdraw salary (employee)
- ⏳ Generate ZK proof (employee)
- ⏳ Download receipt

**Current Status:** 4/8 completed (50%)
**Total Effort:** 2 weeks (2 developers)

### Phase 2 Type System (Completed)
- **PaymentMetadata interface** (`src/types/payment.ts`):
  - employeeId: string (wallet address)
  - employeeName: string
  - amount: number (dollars, plaintext)
  - paymentType: string ('Regular Salary' | 'Bonus' | 'Advance' | etc.)
  - memo: string (optional internal note)
  - timestamp: number (milliseconds since epoch)
  - companyId: string (contract address)
- **EmployeeMetadata interface** (`src/types/payment.ts`):
  - employeeId: string (wallet address)
  - name: string
  - email: string
  - role?: string (optional)
  - baseSalary?: string (optional)
  - addedAt: string (ISO timestamp)
  - companyContractAddress: string
- **Export:** Centralized in `src/types/index.ts` for reusable imports

---

## Phase 3: Dashboard & Lists (Weeks 4-5)

**Goal:** Display data, history, and navigation.

### Screens to Build

#### 3.1 Company Dashboard (`/dashboard`) ✅ **MOSTLY COMPLETED**
- **File Reference:** `2_APP_DASHBOARD_WIREFRAME.md` (Company View)
- **Status:** ✅ Implemented November 6, 2025
- **Implementation:**
  - Company dashboard with live contract state
  - Stats cards (Total Balance, Employees, Payments, Compliance)
  - Quick actions panel (Add Employee, Pay Employee, Setup Recurring, Deposit Funds)
  - AddEmployeeModal integrated (replaces route-based AddEmployeePage)
  - Real-time state updates via RxJS observable
  - SHA-256 wallet address hashing for employee IDs
- **Components Built:**
  - CompanyDashboard.tsx (main dashboard with state subscription)
  - AddEmployeeModal.tsx (add employee modal with validation)
  - DashboardPage.tsx (role detection and routing)
- **Backend API:** ✅ `PayrollAPI.connect()`, `state$` observable, `addEmployee()`, `getEmployeeInfo()`
- **Notes:**
  - Employee name now displays correctly from state.companyName
  - Fixed Compact Map access errors (using API methods instead of direct .get())
  - Account switcher for multiple companies (company selector)

#### 3.1b Account Selector Page (`/selector`) ✅ **COMPLETED**
- **Status:** ✅ Implemented November 6, 2025
- **Implementation:**
  - Unified account selector showing both companies (owner) and employers (employee)
  - Large action cards at top (Join as Employee, Create Company)
  - Separate sections for companies vs employers with color-coding
  - No default selection - user must choose account
  - Integrates with CompaniesLocalState and EmployerContractsLocalState
- **Components Built:**
  - AccountSelectorPage.tsx (unified selector with glassmorphic design)
  - Updated roleDetection.ts to check both companies and employers
  - Updated RoleDetectionPage.tsx to redirect to /selector for existing users
- **Routing:** `/selector` - Shown to users with existing companies or employer relationships

#### 3.1c Employee List/Management Page (`/employees`) ✅ **COMPLETED**
- **Status:** ✅ Implemented November 6, 2025
- **Implementation:**
  - Full employee table with columns: Name, Wallet Address, Email, Role, Base Salary, Status, Added Date, Actions
  - Search functionality (searches across name, email, wallet address, role)
  - Role filter dropdown
  - Actions menu per employee: View Details, Pay Employee, Edit Info, Remove Employee
  - Export to CSV functionality (exports all filtered employees)
  - View Details modal (shows all employee information)
  - Edit Employee modal (updates name, email, role, salary in localStorage)
  - Delete confirmation dialog (removes from localStorage with warning)
  - Empty state with "Add Employee" CTA
  - No search results state
  - Integration with AddEmployeeModal for adding new employees
  - Navigation from CompanyDashboard (clickable stat card + Quick Actions button)
- **Components Built:**
  - EmployeeListPage.tsx (full employee management interface)
  - Integrated with existing AddEmployeeModal.tsx
  - Connected to localStorage (`payroll-ui.employees.{companyAddress}`)
- **Routing:** `/employees` - Accessible from company dashboard
- **Backend API:** localStorage read/write for employee metadata
- **Complexity:** 🟡 Medium (1 day)
- **Notes:** Complete employee roster management with search, filter, CRUD operations, and CSV export

#### 3.2 Employee Dashboard (`/dashboard`) ✅ **COMPLETED**
- **File Reference:** `2_APP_DASHBOARD_WIREFRAME.md` (Employee View)
- **Status:** ✅ Implemented November 6, 2025
- **Implementation:**
  - Employee dashboard with basic stats
  - Stats cards (Current Balance, Last Payment, Total Payments, Status)
  - Quick actions panel (placeholder for Phase 4)
  - Company name display from contract state
- **Components Built:**
  - EmployeeDashboard.tsx (employee view with state subscription)
  - Uses placeholder values for encrypted balance/payment history (Phase 4)
- **Backend API:** ✅ `state$` observable, `getEmployeeInfo()`
- **Notes:**
  - Encrypted balance decryption and payment history queries deferred to Phase 4

#### 3.3 Payment History Section (Dashboard Integration) ✅ **COMPLETED**
- **Status:** ✅ Implemented November 7, 2025
- **Implementation:**
  - **Embedded in dashboard** (not a separate route - better UX)
  - PaymentHistorySection component integrated into both Company and Employee dashboards
  - Payment table with columns: Status, Employee/Company, Amount, Date, Type, Actions
  - **Index-based matching:** Payment history from contract matched to localStorage metadata by chronological index (no timestamp fuzzy matching)
  - Payment amounts retrieved from localStorage PaymentMetadata (plaintext for company view)
  - Dates displayed from localStorage timestamp (actual submission time) until contract timestamp issues resolved
  - Encrypted amount display with individual decrypt/encrypt toggle buttons (employee view)
  - Privacy banner with "Decrypt All Amounts" button (employee view, dismissible)
  - Actions dropdown: View Details, Generate Proof, Download Receipt
  - Empty state when no payments exist
  - Status badges (Completed ✓, Pending ⏳, Failed ✗)
  - Type badges (Salary, Bonus, Advance, Withdrawal)
  - Hover effects with border highlighting
  - Shows recent payments on dashboard (configurable maxRows, default 10)
  - Compact table design optimized for dashboard view
- **Components Built:**
  - PaymentHistorySection.tsx (reusable component)
  - Integrated into CompanyDashboard.tsx
  - Uses PaymentMetadata and EmployeeMetadata TypeScript types
- **Routing:** No separate route - embedded in `/dashboard`
- **Backend API:** ✅ `state$` observable, `getEmployeePaymentHistory()`, uses reactive contract state
- **Data Matching Logic:**
  - Contract returns payment records (payment_id, timestamp, payment_type, status) via `contractState.paymentHistory`
  - localStorage stores payment metadata (amount, memo, employeeName, etc.)
  - Matching: Sort metadata by timestamp, match contract payment at index N with metadata at index N
  - Unique ID: `employeeId-paymentIndex` (deterministic, no timestamp issues)
- **Complexity:** 🟡 Medium (1 day)
- **Notes:** Index-based matching solves timestamp synchronization issues between client and contract

#### 3.4 Payment Detail Page (Dashboard integration) ✅ **COMPLETED**
- **File Reference:** `PAYMENT_DETAIL_PAGE_WIREFRAME.md`
- **Status:** ✅ Shipped November 8, 2025
- **Implementation:**
  - **Embedded in dashboard as modal** (not a separate route - better UX)
  - **Visual payment card** with gradient background showing amount, status, type, and date
  - **Three-tab interface:**
    - **Overview:** Employee/company info, payment date, status cards
    - **Transaction Details:** Complete transaction information in table format
    - **History:** Payment timeline showing processing events
  - **Status indicators:** Color-coded chips for completed/pending/failed payments
  - **Encryption awareness:** Shows encrypted amounts with warning for employee view
  - **Download Receipt button** (placeholder for Phase 2.8)
  - **Responsive design:** Adapts to dark/light themes with glassmorphic styling
- **Components Built:**
  - PaymentDetailModal.tsx (comprehensive detail view)
  - Integrated into PaymentHistorySection.tsx (opens from "View Details" action)
- **Backend API:** ✅ `getEmployeePaymentHistory()`, `state$`
- **Complexity:** 🔴 High (2 days)
- **Notes:**
  - Supports all payment types including Commission, Reimbursement, Adjustment
  - Company name added to payment objects for employee view
  - Modal design matches overall app theme and style

#### 3.5 Notification Center (Postponed for later)
- **File Reference:** `SETTINGS_NOTIFICATIONS_WIREFRAMES.md`
- **Components:**
  - Bell icon with badge in header
  - Dropdown with notifications list
  - Toast notifications (bottom-right)
  - Mark all read button
- **Backend API:** WebSocket or polling for real-time updates
- **Complexity:** 🟡 Medium (1 day)

#### 3.6 Role Switcher (Dual Role Users) ✅ **COMPLETED**
- **File Reference:** `2_APP_DASHBOARD_WIREFRAME.md`
- **Status:** ✅ Shipped November 8, 2025
- **Implementation:**
  - **Toggle button group** in dashboard header (Company ⇄ Employee)
  - **Only shows for dual-role users** (users who are both company owner and employee)
  - **Persists selection in localStorage** via ViewModeLocalState utility
  - **Seamless view switching** without page reload
  - **Integrated into both dashboards:** CompanyDashboard and EmployeeDashboard
  - **Theme-aware styling** with proper active/inactive states
- **Components Built:**
  - RoleSwitcher.tsx (toggle button component)
  - ViewModeLocalState.ts (localStorage persistence utility)
  - Updated DashboardPage.tsx (view mode state management)
  - Updated CompanyDashboard.tsx (adds switcher to header)
  - Updated EmployeeDashboard.tsx (adds switcher to header)
- **Backend API:** None (client-side routing)
- **Complexity:** 🟢 Low (0.5 day)
- **Notes:**
  - Clean UX - toggle appears in header next to network badge
  - Default view is "company" for dual-role users
  - View preference persists across sessions

### Phase 3 Deliverables
- ✅ Company dashboard (with live contract state)
- ✅ Employee dashboard (basic stats)
- ✅ Account selector (unified company/employer view)
- ✅ Employee list/management page (full CRUD + CSV export)
- ✅ Payment history section (index-based matching, embedded in dashboard)
- ✅ Payment detail page (modal with 3-tab interface)
- ⏸️ Notification center (postponed - not required for MVP)
- ✅ Role switcher (dual role support)

**Current Status:** 7/8 completed (87.5%) - 1 postponed
**Total Effort:** 1.5 weeks (2 developers)

---

## Phase 4: Settings & Management (Week 6)

**Goal:** Account management, notifications, and funding.

### Screens to Build

#### 4.1 Settings - Company Profile (`/settings/profile`)
- **File Reference:** `SETTINGS_NOTIFICATIONS_WIREFRAMES.md` (Section 1)
- **Components:**
  - Company logo upload
  - Company info form (name, industry, size, email)
  - Save button
- **Backend API:** Off-chain storage (not on contract)
- **Complexity:** 🟢 Low (0.5 day)

#### 4.2 Settings - Wallet Management (`/settings/wallet`)
- **File Reference:** `SETTINGS_NOTIFICATIONS_WIREFRAMES.md` (Section 2)
- **Components:**
  - Connected wallet display
  - Payroll account balance
  - Fund account button → modal
  - Gas fee reserve display
  - Transaction history link
- **Backend API:** `state$`, `depositCompanyFunds()`
- **Complexity:** 🟡 Medium (1 day)

#### 4.3 Fund Account Modal
- **File Reference:** `SETTINGS_NOTIFICATIONS_WIREFRAMES.md` (Flow)
- **Components:**
  - Amount input with recommendations
  - Token dropdown (USDC, DUST, DAI)
  - Deposit source (connected wallet vs external)
  - Wallet approval flow
  - Processing modal
  - Success modal
- **Backend API:** `depositCompanyFunds()`
- **Complexity:** 🟡 Medium (1 day)

#### 4.4 Settings - Notification Preferences (`/settings/notifications`)
- **File Reference:** `SETTINGS_NOTIFICATIONS_WIREFRAMES.md` (Section 4)
- **Components:**
  - Email notification checkboxes
  - In-app notification toggles
  - Webhook integration (advanced)
- **Backend API:** Off-chain user preferences
- **Complexity:** 🟢 Low (0.5 day)

#### 4.5 Settings - Privacy & Security (`/settings/privacy`)
- **File Reference:** `SETTINGS_NOTIFICATIONS_WIREFRAMES.md` (Section 5)
- **Components:**
  - Encryption status
  - Data visibility settings
  - Session management (active sessions list)
  - Revoke session buttons
- **Backend API:** Session management API
- **Complexity:** 🟡 Medium (1 day)

#### 4.6 Settings - Employee Profile (`/settings/profile`) (Employee View)
- **File Reference:** `SETTINGS_NOTIFICATIONS_WIREFRAMES.md` (Section 1, Employee)
- **Components:**
  - Personal info form (name, email, role)
  - Connected wallet (read-only)
  - Employment info (read-only)
- **Backend API:** `getEmployeeInfo()`
- **Complexity:** 🟢 Low (0.5 day)

#### 4.7 Settings - Privacy & Disclosure (Employee)
- **File Reference:** `SETTINGS_NOTIFICATIONS_WIREFRAMES.md` (Section 3, Employee)
- **Components:**
  - Generated proofs list (cards)
  - Revoke/download buttons
  - Granted disclosures list
  - Revoke access buttons
- **Backend API:** Query proofs from contract state
- **Complexity:** 🟡 Medium (1 day)

### Phase 4 Deliverables
- ✅ Company settings (profile, wallet, notifications, privacy)
- ✅ Employee settings (profile, privacy, disclosures)
- ✅ Fund account flow
- ✅ Notification preferences
- ✅ Session management

**Total Effort:** 1 week (2 developers)

---

## Phase 5: Polish & UX (Week 7)

**Goal:** Help, error handling, accessibility, loading states.

### Features to Build

#### 5.1 Help Center (`/help`)
- **File Reference:** `MISC_UX_COMPONENTS.md` (Section 1)
- **Components:**
  - Search bar
  - Topic cards (6 categories)
  - FAQ accordion
  - Video tutorials (embedded)
  - Contact support buttons
- **Backend API:** Static content
- **Complexity:** 🟡 Medium (1 day)

#### 5.2 Interactive Product Tour
- **File Reference:** `MISC_UX_COMPONENTS.md` (Section 2)
- **Components:**
  - 5-step tutorial overlay
  - Highlighting specific UI elements
  - Progress indicator
  - Skip/dismiss options
  - "Don't show again" checkbox
- **Backend API:** None (localStorage for seen state)
- **Complexity:** 🟡 Medium (1 day)

#### 5.3 Loading States & Skeletons
- **File Reference:** `MISC_UX_COMPONENTS.md` (Section 3)
- **Components:**
  - Skeleton screens for all data-heavy pages
  - Progress indicators for transactions
  - Infinite scroll loading
  - Optimistic UI updates
- **Backend API:** None (frontend patterns)
- **Complexity:** 🟡 Medium (1 day)

#### 5.4 Error Pages
- **File Reference:** `MISC_UX_COMPONENTS.md` (Section 5)
- **Pages:**
  - 404 Not Found
  - 500 Server Error
  - Network Error
  - Maintenance Mode
- **Backend API:** None (static pages)
- **Complexity:** 🟢 Low (0.5 day)

#### 5.5 Accessibility Features
- **File Reference:** `MISC_UX_COMPONENTS.md` (Section 4)
- **Features:**
  - Keyboard navigation (Tab, Enter, Esc)
  - ARIA labels for all interactive elements
  - Skip links
  - Screen reader announcements
  - Focus indicators
- **Backend API:** None (frontend patterns)
- **Complexity:** 🟡 Medium (1 day)

#### 5.6 Browser Compatibility & Session Management
- **File Reference:** `MISC_UX_COMPONENTS.md` (Sections 6, 7)
- **Features:**
  - Unsupported browser warning
  - Session timeout warning (30 min)
  - Session expired page
  - Concurrent session detection
- **Backend API:** Session management API
- **Complexity:** 🟡 Medium (1 day)

### Phase 5 Deliverables
- ✅ Help center with FAQ
- ✅ Product tour (first-time users)
- ✅ Loading states & skeletons
- ✅ Error pages (404, 500, network, maintenance)
- ✅ Accessibility (WCAG 2.1 AA)
- ✅ Browser compatibility checks
- ✅ Session management

**Total Effort:** 1 week (2 developers)

---

## Component Library

### Reusable Components (Build Once, Use Everywhere)

#### Layout Components (8)
- `<AppLayout>` - Main layout with nav + content
- `<TopNavigation>` - Header with wallet, network, notifications
- `<Sidebar>` - Settings sidebar
- `<PageHeader>` - Breadcrumb + title
- `<Footer>` - Links and branding
- `<Container>` - Max-width wrapper
- `<Card>` - Rounded card with border
- `<EmptyState>` - Illustration + message + CTA

#### Form Components (10)
- `<Input>` - Text input with validation
- `<Dropdown>` - Select/dropdown with search
- `<Checkbox>` - Styled checkbox
- `<Radio>` - Radio button
- `<DatePicker>` - Date selection
- `<AmountInput>` - Number input with currency
- `<WalletAddressInput>` - Wallet input with paste button
- `<FormGroup>` - Label + input + error
- `<ValidationMessage>` - Error/success message
- `<FormWizard>` - Multi-step form

#### Button Components (5)
- `<Button>` - Primary/secondary/ghost variants
- `<IconButton>` - Icon-only button
- `<LoadingButton>` - Button with spinner
- `<DropdownButton>` - Button + dropdown
- `<FAB>` - Floating action button (mobile)

#### Data Display Components (12)
- `<Table>` - Data table with sorting/filtering
- `<DataCard>` - Card with data fields
- `<StatCard>` - Stat widget (number + label + change)
- `<Badge>` - Status badge
- `<Tag>` - Category tag
- `<Tooltip>` - Hover tooltip
- `<ProgressBar>` - Progress indicator
- `<Timeline>` - Event timeline
- `<Chart>` - Analytics chart (wrapper for charting library)
- `<EncryptedAmount>` - Amount with decrypt button
- `<SkeletonLoader>` - Loading placeholder
- `<Avatar>` - User/company avatar

#### Modal Components (8)
- `<Modal>` - Base modal with backdrop
- `<ConfirmModal>` - Confirmation dialog
- `<SuccessModal>` - Success message
- `<ErrorModal>` - Error message
- `<LoadingModal>` - Processing state
- `<FormModal>` - Modal with form
- `<DetailsModal>` - Tabbed detail view
- `<WizardModal>` - Multi-step modal

#### Notification Components (4)
- `<Toast>` - Toast notification (bottom-right)
- `<NotificationBell>` - Bell icon with badge
- `<NotificationDropdown>` - Notification list
- `<AlertBanner>` - Page-level alert

#### Payment Components (8)
- `<PaymentCard>` - Visual payment card (detail page left panel)
- `<PaymentRow>` - Table row for payment list
- `<PaymentSummary>` - Payment summary section
- `<RecurringPaymentCard>` - Card for recurring payment
- `<EmployeeDropdown>` - Searchable employee selector
- `<AmountSelector>` - Base salary vs custom amount
- `<PaymentTypeDropdown>` - Salary/Bonus/Advance selector
- `<WithdrawalHistoryList>` - List of withdrawals

#### Utility Components (6)
- `<SearchBar>` - Search input with icon
- `<FilterBar>` - Filter buttons
- `<Pagination>` - Page navigation
- `<InfiniteScroll>` - Load more on scroll
- `<CopyButton>` - Copy to clipboard
- `<ExportButton>` - Export dropdown (CSV/PDF/JSON)

**Total Components:** ~75 reusable components

---

## Implementation Order (Dependency Graph)

### Critical Path (Must Build in Order)

```
1. Landing Page (independent)
   ↓
2. Connect Wallet (independent)
   ↓
3. Role Detection (depends on wallet)
   ↓
4. Company Onboarding OR Employee Welcome (depends on role)
   ↓
5. Dashboard (depends on onboarding)
   ↓
6. Payment Operations (depends on dashboard)
   ↓
7. Lists & Detail Views (depends on payment data)
   ↓
8. Settings (depends on dashboard navigation)
   ↓
9. Polish & UX (can happen in parallel with 5-8)
```

### Parallel Workstreams

**Developer 1:** Focus on company flows
- Onboarding wizard
- Pay employee
- Batch payroll
- Recurring payments
- Company dashboard

**Developer 2:** Focus on employee flows + shared components
- Employee welcome
- Withdraw salary
- Generate proof
- Employee dashboard
- Shared components (buttons, inputs, modals)

**Week 5-7:** Both developers on shared features
- Payment list view
- Payment detail page
- Settings
- Polish & UX

---

## Technology Stack

### Frontend Framework
- **React 18** with TypeScript
- **Next.js 14** (App Router) for routing
- **Tailwind CSS** for styling

### State Management
- **Zustand** for global state (user, wallet, notifications)
- **React Query** for server state (API calls, caching)

### Forms & Validation
- **React Hook Form** for form state
- **Zod** for validation schemas

### UI Libraries
- **Headless UI** for accessible components (dropdowns, modals)
- **Framer Motion** for animations
- **Lucide React** for icons
- **Recharts** for analytics charts

### Web3 Integration
- **Midnight SDK** for wallet connection
- **PayrollAPI** (TypeScript client) for contract calls

### Utilities
- **date-fns** for date formatting
- **clsx** for conditional classes
- **react-hot-toast** for notifications
- **jsPDF** for PDF generation
- **papaparse** for CSV export

---

## Routing Structure

```
/                          → Landing page
/connect                   → Connect wallet
/loading                   → Role detection
/onboard/company           → Company onboarding wizard
/welcome                   → Employee welcome

/dashboard                 → Main dashboard (company or employee)

/employees
  /add                     → Add employee
  /:id                     → Employee detail (future)

/payments                  → Payment list view
  /:id                     → Payment detail page
  /pay                     → Pay employee (one-time)
  /batch                   → Run payroll (batch)

/recurring                 → Recurring payments management
  /setup                   → Setup new recurring payment

/settings
  /profile                 → Company/employee profile
  /wallet                  → Wallet management
  /team                    → Team management (future)
  /employees               → Employee list (future)
  /recurring               → Recurring payment settings
  /notifications           → Notification preferences
  /privacy                 → Privacy & security
  /backup                  → Backup & recovery (future)
  /api                     → API keys (future)

/help                      → Help center
/changelog                 → Changelog

/404                       → Not found
/500                       → Server error
/network-error             → Network error
/maintenance               → Maintenance mode
```

---

## API Integration Points

### PayrollAPI Methods (Backend Ready ✅)

**Deployment:**
- `PayrollAPI.deploy(providers, companyId, name)` → Deploy contract

**Company Operations:**
- `depositCompanyFunds(companyId, amount)` → Fund payroll account
- `addEmployee(companyId, employeeId)` → Add employee
- `payEmployee(companyId, employeeId, amount, paymentType)` → One-time payment

**Recurring Payments:**
- `createRecurringPayment(...)` → Setup recurring schedule
- `processRecurringPayment(recurringPaymentId)` → Execute scheduled payment
- `pauseRecurringPayment(recurringPaymentId)` → Pause schedule
- `resumeRecurringPayment(recurringPaymentId, nextPaymentDate)` → Resume schedule
- `editRecurringPayment(recurringPaymentId, newAmount)` → Edit amount

**Employee Operations:**
- `withdrawEmployeeSalary(employeeId, amount)` → Withdraw to wallet
- `getEmployeePaymentHistory(employeeId)` → Get payments
- `getEmployeeInfo(employeeId)` → Get employee details
- `getEmployeeCount()` → Get total employee count
- `getAllEmployeeIds()` → Get all employee IDs from blockchain (List iteration)
- `getAllRecurringPayments()` → Get all recurring payments from blockchain (List iteration)

**Disclosure & Privacy:**
- `grantIncomeDisclosure(employeeId, lenderId, minThreshold, expiresIn)`
- `grantEmploymentDisclosure(employeeId, verifierId, expiresIn)`
- `grantAuditDisclosure(companyId, auditorId, expiresIn)`
- `revokeDisclosure(grantorId, granteeId, permissionType)`

**ZKML Income Proofs:**
- `registerTrustedVerifier(verifierPubkey)`
- `submitIncomeProof(employeeId, proofType, ...)`
- `verifyIncomeProof(employeeId, requiredProofType, requiredThreshold)`

**State Observables:**
- `state$` → Observable for real-time updates (balances, counters)

---

## Gaps & Workarounds

### Known Gaps (from Gap Analysis)

#### Gap 1: Payment Type Field ⚠️ **ADDRESSED IN PREVIOUS WORK**
- **Status:** ✅ **COMPLETED** - Payment type parameter added to `pay_employee` circuit
- **Backend:** `payEmployee(companyId, employeeId, amount, paymentType: number = 0)`
- **UI:** Dropdown with Salary (0), Advance (1), Bonus (2)

#### Gap 2: Withdrawal History (Per-Payment Tracking) 🟡 Low Priority
- **Status:** ⚠️ **IMPLEMENTED** - API-layer storage via `privateStateProvider`
- **Backend:** `getWithdrawalHistory()` returns withdrawal log
- **UI:** Show aggregate balance + withdrawal history in payment detail page

#### Gap 3: Company Metadata (Industry, Size, Email) 🟢 Skip for MVP
- **Solution:** Store in off-chain database or skip entirely
- **UI:** Optional fields in company profile settings

#### Gap 4: Employee Role/Base Salary 🟢 Skip for MVP
- **Solution:** Store in off-chain database or skip entirely
- **UI:** Optional fields in add employee form

#### Gap 5: CSV Import 🟢 Post-MVP
- **Solution:** Build admin dashboard with CSV parser later
- **UI:** Remove "Import CSV" button from empty state

---

## Testing Strategy

### Unit Tests
- All components with Jest + React Testing Library
- Coverage target: 80%

### Integration Tests
- API integration with mocked PayrollAPI
- Form submission flows
- Navigation flows

### E2E Tests (Cypress)
- Critical paths:
  - Company onboarding → Add employee → Pay employee
  - Employee login → View balance → Withdraw
  - Setup recurring payment → Process payment

### Accessibility Tests
- Automated: `axe-core` + Lighthouse
- Manual: NVDA/VoiceOver testing

---

## Performance Targets

- **Time to Interactive:** < 2s
- **First Contentful Paint:** < 1s
- **Lighthouse Score:** > 90
- **Bundle Size:** < 500 KB (gzipped)

### Optimization Strategies
- Code splitting by route
- Lazy load modals
- Image optimization (WebP)
- Virtual scrolling for long lists
- Web Workers for decryption

---

## Success Criteria

### MVP Launch Checklist

**Phase 1 (Auth & Setup):**
- ✅ User can connect wallet
- ✅ Role detection works
- ✅ Company can complete onboarding
- ✅ Employee sees welcome screen

**Phase 2 (Payments):**
- ✅ Company can add employees
- ✅ Company can pay employees (one-time)
- ✅ Company can setup recurring payments
- ✅ Employee can withdraw salary
- ✅ Employee can generate income proof

**Phase 3 (Dashboard & Lists):**
- ✅ Dashboard shows accurate data
- ✅ Payment list view works
- ✅ Payment detail page works
- ✅ Notifications work

**Phase 4 (Settings):**
- ✅ Company can fund account
- ✅ User can manage settings
- ✅ Privacy controls work

**Phase 5 (Polish):**
- ✅ Help center accessible
- ✅ Error pages work
- ✅ Accessibility compliant (WCAG 2.1 AA)

---

## Timeline Estimate

### 6-Week Timeline (2 Developers)

| Week | Phase | Focus | Deliverables |
|------|-------|-------|--------------|
| **1** | Phase 1 | Auth & Onboarding | Landing, wallet connection, company wizard, employee welcome |
| **2** | Phase 2A | Core Payments | Add employee, pay employee, recurring setup |
| **3** | Phase 2B | Advanced Payments | Batch payroll, recurring management, withdraw, proof generation |
| **4** | Phase 3 | Dashboard & Lists | Company/employee dashboards, payment list, payment detail |
| **5** | Phase 4 | Settings | Company/employee settings, fund account, notifications |
| **6** | Phase 5 | Polish | Help, error pages, accessibility, loading states |

### 8-Week Timeline (1 Developer)

Multiply all estimates by 1.5x for single developer.

---

## Next Steps

### Immediate Actions (Start Phase 1)

1. **Setup Project:**
   - Initialize Next.js 14 project
   - Install dependencies (Tailwind, Zustand, React Query, etc.)
   - Setup folder structure (components, pages, hooks, utils)

2. **Build Component Library:**
   - Create base components (Button, Input, Card, Modal)
   - Setup Storybook for component development
   - Define color tokens and spacing system

3. **Integrate Midnight SDK:**
   - Add Midnight Wallet connection logic
   - Test wallet connection on testnet
   - Setup PayrollAPI client

4. **Build Phase 1 Screens:**
   - Landing page
   - Connect wallet
   - Role detection
   - Company onboarding wizard
   - Employee welcome

**Target:** Complete Phase 1 in Week 1 ✅

---

## Summary

**Total Implementation:**
- **28 screens** across 5 phases
- **~75 reusable components**
- **96% backend coverage** (ready for UI)
- **6-8 weeks** timeline (2 developers)

**Current Progress (as of November 8, 2025):**
- ✅ Phase 1: **Complete** (5/5 screens - 100%)
- ⏳ Phase 2: **In Progress** (4/8 screens - 50%)
- ✅ Phase 3: **Complete** (7/8 screens - 87.5%, 1 postponed)
- ⏳ Phase 4: **Not Started** (0/7 screens - 0%)
- ⏳ Phase 5: **Not Started** (0/6 features - 0%)

**Recent Completions (November 8, 2025):**
- ✅ **Setup Recurring Payment Modal** - Full recurring payment creation with frequency selection
- ✅ **Payment Detail Modal** - 3-tab interface with Overview, Transaction Details, and History
- ✅ **Role Switcher** - Toggle between Company and Employee views for dual-role users
- ✅ **Payment type fixes** - Full support for Commission, Reimbursement, Adjustment types
- ✅ **Payment amount display** - Fixed metadata matching to show correct amounts from localStorage

**Previous Completions:**
- ✅ AddEmployeeModal with full validation + API integration
- ✅ PayEmployeeModal with payment type support
- ✅ RecurringPaymentsModal with on-chain recovery capability
- ✅ Payment history with index-based matching (solves timestamp sync issues)
- ✅ TypeScript type system (PaymentMetadata, EmployeeMetadata)
- ✅ Auto-reconnect wallet on page refresh (bank-ui pattern)
- ✅ WalletConnectionPrompt reusable component
- ✅ On-chain recovery system (employee IDs + recurring payments via Compact Lists)
- ✅ SHA-256 hashing utility (employeeUtils.ts) for on-chain ID matching

**Critical Path:**
Landing → Connect Wallet → Role Detection → Onboarding → Dashboard → **[Current: Payments]** → Settings → Polish

**Backend Readiness:** ✅ All critical APIs implemented, minimal gaps (payment type, withdrawal history addressed)

**Next Steps:** Complete Phase 2 (recurring payments, batch payroll, withdrawals, proofs) and Phase 3 (payment detail, notifications, role switcher)

---

## On-Chain Recovery System (November 8, 2025)

### Implementation Summary

**Problem:** Companies could lose all employee and recurring payment data if localStorage was deleted, even though employee IDs exist on-chain.

**Solution:** Implemented complete on-chain recovery capability using Compact List types with TypeScript iteration.

### Contract Changes (payroll.compact)

Added two new ledger Lists for iterating through on-chain data:

```compact
export ledger employee_ids: List<Bytes<32>>;              // Line 22
export ledger recurring_payment_ids: List<Bytes<32>>;     // Line 60
```

**Circuit Updates:**
- `add_employee` circuit: Calls `employee_ids.pushFront(disclose(employee_id));` (Line 143)
- `create_recurring_payment` circuit: Calls `recurring_payment_ids.pushFront(recurring_payment_id);` (Line 766)

**Compilation:** ✅ 19 circuits (successful)

### API Changes (payroll-api.ts)

**New Methods:**
1. `getEmployeeCount()` - Returns total employee count from map or counter
2. `getAllEmployeeIds()` - Iterates `employee_ids` List using TypeScript for-of loop, returns hex strings
3. `getAllRecurringPayments()` - Iterates `recurring_payment_ids` List, returns all payment structures

**List Iteration Pattern:**
```typescript
for (const employeeIdBytes of ledgerState.employee_ids) {
  const hexId = Array.from(employeeIdBytes as Uint8Array)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  employeeIds.push(hexId);
}
```

### UI Changes

**New Utility (employeeUtils.ts):**
- `walletAddressToEmployeeIdHex()` - SHA-256 hashing function to convert wallet addresses to on-chain employee IDs
- Uses `crypto.subtle.digest('SHA-256', data)` for client-side hashing
- Returns 32-byte hex string matching on-chain format

**RecurringPaymentsModal Updates:**
- Completely rewrote `loadRecurringPayments()` to fetch directly from blockchain
- Calls `api.getAllRecurringPayments()` once (no per-employee queries)
- Hashes localStorage wallet addresses to match on-chain employee IDs
- Merges on-chain data with localStorage metadata for display
- Shows fallback names (`Employee 24aa4733...`) if metadata missing

### Data Flow

**On-Chain Data (Recoverable):**
- Employee IDs (SHA-256 hashes of wallet addresses)
- Recurring payment IDs
- Payment frequency (weekly/bi-weekly/monthly)
- Payment status (active/paused/cancelled/completed)
- Start date, next payment date, end date
- Encrypted amounts

**Off-Chain Data (localStorage - Metadata Only):**
- Employee names, emails, roles
- Plaintext amounts for display
- Internal notes/memos

**Recovery Scenario:**
If localStorage is lost, companies can:
1. Retrieve all employee IDs from blockchain via `getAllEmployeeIds()`
2. Retrieve all recurring payment structures via `getAllRecurringPayments()`
3. Re-enter employee names/emails (metadata only)
4. Continue operations with full payment history and schedules intact

### Technical Notes

- **Compact Lists:** Support `pushFront()`, `popFront()`, `head()`, `length()`, `isEmpty()`, and TypeScript Symbol.iterator
- **No Map Iteration:** Compact Maps don't support iteration, hence separate Lists required
- **SHA-256 Matching:** Browser crypto API used for hashing (no server dependency)
- **Backward Compatible:** Old localStorage data still works, new recovery is additive

---

*Generated: November 4, 2025 | Updated: November 8, 2025 | zkSalaria v1.3*
