# zkSalaria Authentication & Onboarding Flow
**Implementation Roadmap**
**Date:** 2025-11-04

---

## Implementation Order

### Phase 1: Core Authentication (Pages 1-4)
1. Landing Page
2. Wallet Connection
3. Network Validation
4. Role Detection

### Phase 2: Onboarding Flows (Pages 5-8)
5. New User Role Selector
6. Company Onboarding
7. Employee Onboarding
8. Session Management

---

## Complete Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  PAGE 1: LANDING PAGE (1_ONBOARDING_WIREFRAME.md)              │
│  /                                                              │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  Hero Section                                             │ │
│  │  • "Private Payroll, Verified On-Chain."                  │ │
│  │  • Social proof stats (552K payments, 297K employees)     │ │
│  │  • Primary CTA: [Open App →]                              │ │
│  │  • Secondary: [View Documentation →]                      │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  User clicks "Open App" ↓                                       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

                            ↓

┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  PAGE 2: WALLET DETECTION                                      │
│  /app (automatic check)                                        │
│                                                                 │
│  System checks: window.midnight exists?                        │
│                                                                 │
│  ┌──────────────────┐              ┌──────────────────┐        │
│  │   ❌ NO          │              │   ✅ YES         │        │
│  │                  │              │                  │        │
│  │  Show "Wallet   │              │  Show "Connect  │        │
│  │  Required"       │              │  Your Wallet"    │        │
│  │  Modal           │              │  Modal           │        │
│  │                  │              │                  │        │
│  │  [Install →]     │              │  [Connect →]     │        │
│  └──────────────────┘              └──────────────────┘        │
│                                                                 │
│  After install: User refreshes → Try again                     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

                            ↓

┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  PAGE 3: WALLET CONNECTION REQUEST                             │
│  (Midnight Wallet Extension Popup)                             │
│                                                                 │
│  "zkSalaria.app wants to connect"                              │
│  • Your wallet address                                         │
│  • Permission to request signatures                            │
│                                                                 │
│  ┌──────────────────┐              ┌──────────────────┐        │
│  │   ❌ REJECT      │              │   ✅ APPROVE     │        │
│  │                  │              │                  │        │
│  │  Show "Connect. │              │  Check network   │        │
│  │  Rejected"       │              │  validation      │        │
│  │  Modal           │              │                  │        │
│  │                  │              │                  │        │
│  │  [Try Again]     │              │  → Next Step     │        │
│  └──────────────────┘              └──────────────────┘        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

                            ↓

┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  PAGE 4: NETWORK VALIDATION                                    │
│  (automatic check after connection)                            │
│                                                                 │
│  System checks: chainId === MIDNIGHT_MAINNET?                  │
│                                                                 │
│  ┌──────────────────┐              ┌──────────────────┐        │
│  │   ❌ WRONG NET   │              │   ✅ CORRECT     │        │
│  │                  │              │                  │        │
│  │  Show "Wrong    │              │  Proceed to      │        │
│  │  Network"        │              │  Role Detection  │        │
│  │  Modal           │              │                  │        │
│  │                  │              │                  │        │
│  │  [Switch →]      │              │  → Next Step     │        │
│  └──────────────────┘              └──────────────────┘        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

                            ↓

┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  PAGE 5: ROLE DETECTION                                        │
│  (Smart contract query)                                        │
│                                                                 │
│  Query blockchain:                                             │
│  • const companyData = await contract.getCompany(address)      │
│  • const employeeData = await contract.getEmployee(address)    │
│                                                                 │
│  ┌───────────┬───────────┬──────────┬────────────┐            │
│  │  NEW USER │ COMPANY   │ EMPLOYEE │ BOTH ROLES │            │
│  │  (null)   │ (exists)  │ (exists) │  (both)    │            │
│  └───────────┴───────────┴──────────┴────────────┘            │
│       ↓            ↓           ↓           ↓                   │
│    Page 6       Page 9      Page 9    Page 8                  │
│    Role         Company     Employee   Role                   │
│    Selector     Dashboard   Dashboard  Switcher               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

         ↓ NEW USER

┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  PAGE 6: ROLE SELECTOR                                         │
│  /onboarding/role                                              │
│                                                                 │
│  "Welcome to zkSalaria! 👋"                                     │
│  "Are you here as a company or an employee?"                   │
│                                                                 │
│  ┌────────────────────┐         ┌────────────────────┐         │
│  │       🏢           │         │       👤           │         │
│  │                    │         │                    │         │
│  │    Company         │         │    Employee        │         │
│  │                    │         │                    │         │
│  │  I want to pay     │         │  I receive salary  │         │
│  │  my employees      │         │  from my employer  │         │
│  │                    │         │                    │         │
│  │  [Get Started →]   │         │  [Get Started →]   │         │
│  └────────────────────┘         └────────────────────┘         │
│         ↓                                ↓                     │
│      Page 7                           Page 10                  │
│      Company                          Employee                 │
│      Onboarding                       Onboarding               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

         ↓ COMPANY PATH

┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  PAGE 7: COMPANY REGISTRATION FORM                             │
│  /onboarding/company/register                                  │
│                                                                 │
│  "Setup Your Company"                                          │
│                                                                 │
│  Form Fields:                                                  │
│  • Company Name * (text input)                                 │
│  • Industry (dropdown: Technology, Finance, etc.)              │
│  • Company Size (dropdown: 1-10, 11-50, etc.)                  │
│  • Admin Email * (email input)                                 │
│  • Connected Wallet (display: 0x1234...5678)                   │
│  • ☐ I agree to Terms of Service                               │
│                                                                 │
│  Validation:                                                   │
│  • Company name: Required, 2-100 chars                         │
│  • Email: Required, valid format                               │
│  • Terms: Must be checked                                      │
│                                                                 │
│  [Cancel]              [Create Company →]                      │
│                                                                 │
│  User clicks "Create Company" ↓                                │
│  • Midnight Wallet popup (confirm transaction)                 │
│  • Show "Creating Company..." loading state                    │
│  • Transaction mines (10-30 seconds)                           │
│  • Success! → Page 7b                                          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

                            ↓

┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  PAGE 7b: COMPANY REGISTRATION SUCCESS                         │
│  (Modal overlay)                                               │
│                                                                 │
│  "Company Created! 🎉"                                          │
│                                                                 │
│  • Acme Corporation is now registered                          │
│  • Transaction: 0x9876...1234                                  │
│  • Block: #1,234,567                                           │
│                                                                 │
│  Next Steps:                                                   │
│  1. Fund your payroll account                                  │
│  2. Add your first employee                                    │
│  3. Make your first payment                                    │
│                                                                 │
│  [Get Started →]                                               │
│                                                                 │
│  User clicks → Page 7c (Optional Quick Start Wizard)           │
│  OR skip wizard → Page 9 (Company Dashboard)                   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

                            ↓ (Optional)

┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  PAGE 7c: ONBOARDING WIZARD (3 STEPS)                          │
│  /onboarding/company/quickstart                                │
│                                                                 │
│  Step 1 of 3: Fund Account                                     │
│  • Current Balance: 0 USDC                                     │
│  • Amount to Deposit: [$10,000] USDC                           │
│  • [Deposit Now]  [Skip for Now]                               │
│                                                                 │
│  Step 2 of 3: Add First Employee                               │
│  • Employee Name: [Alice Johnson]                              │
│  • Wallet Address: [0xABCD...]                                 │
│  • Base Salary: [$5,000] per [Month ▼]                         │
│  • Role: [Engineer ▼]                                          │
│  • [Add Employee]  [Skip for Now]                              │
│                                                                 │
│  Step 3 of 3: Setup Recurring Payment                          │
│  • Employee: Alice Johnson                                     │
│  • Amount: $5,000                                              │
│  • Frequency: [Monthly ▼]                                      │
│  • Start Date: [Dec 1, 2025 📅]                                │
│  • [Setup Recurring]  [Skip for Now]                           │
│                                                                 │
│  Wizard Complete:                                              │
│  • Funded: $10,000                                             │
│  • Employee: Alice Johnson added                               │
│  • Recurring: Monthly ($5,000)                                 │
│  • [Go to Dashboard →] → Page 9                                │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

         ↓ BOTH ROLES

┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  PAGE 8: ROLE SWITCHER (Dual Roles Detected)                   │
│  /role-selector                                                │
│                                                                 │
│  "Multiple Roles Detected"                                     │
│  "Your wallet has access to multiple accounts:"                │
│                                                                 │
│  ┌────────────────────┐         ┌────────────────────┐         │
│  │  🏢 Acme Corp      │         │  👤 Employee at    │         │
│  │                    │         │     TechStart Inc  │         │
│  │  12 employees      │         │                    │         │
│  │  $54,500 paid      │         │  $8,200 balance    │         │
│  │                    │         │                    │         │
│  │  [View Dashboard]  │         │  [View Dashboard]  │         │
│  └────────────────────┘         └────────────────────┘         │
│         ↓                                ↓                     │
│      Page 9                           Page 9                   │
│      Company                          Employee                 │
│      Dashboard                        Dashboard                │
│                                                                 │
│  Note: Role switcher in top nav                                │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

         ↓ DASHBOARD

┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  PAGE 9: MAIN DASHBOARDS (Implementation in later phases)      │
│  /company/dashboard OR /employee/dashboard                     │
│                                                                 │
│  Company Dashboard:                                            │
│  • Stats: Employees, Total Paid, Balance                       │
│  • Employee list table                                         │
│  • Quick actions: Add Employee, Make Payment, Deposit          │
│  • Recent transactions                                         │
│                                                                 │
│  Employee Dashboard:                                           │
│  • Current balance (encrypted, click to decrypt)               │
│  • Payment history                                             │
│  • Withdrawal history                                          │
│  • Quick actions: Withdraw, Generate Income Proof              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

         ↓ EMPLOYEE PATH (from Page 6)

┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  PAGE 10: EMPLOYEE ONBOARDING                                  │
│  /onboarding/employee                                          │
│                                                                 │
│  Smart contract check:                                         │
│  const employeeData = await contract.getEmployee(address)      │
│                                                                 │
│  ┌──────────────────┐              ┌──────────────────┐        │
│  │  ✅ ADDED        │              │  ⏸️ PENDING      │        │
│  │                  │              │                  │        │
│  │  "Welcome! 🎉"   │              │  "Not Yet Added" │        │
│  │                  │              │                  │        │
│  │  You've been     │              │  Your employer   │        │
│  │  added by:       │              │  hasn't added    │        │
│  │  🏢 Acme Corp    │              │  you yet.        │        │
│  │                  │              │                  │        │
│  │  Your balance:   │              │  Share your      │        │
│  │  •••••• 🔓       │              │  address:        │        │
│  │                  │              │  0x1234...5678   │        │
│  │  Role: Engineer  │              │  [📋 Copy]       │        │
│  │  Salary: $5K/mo  │              │                  │        │
│  │                  │              │  [Email          │        │
│  │  [Go to →]       │              │   Employer]      │        │
│  │  Dashboard       │              │                  │        │
│  └──────────────────┘              └──────────────────┘        │
│         ↓                                    ↓                 │
│      Page 9                          Stay on page,             │
│      Employee                        wait for employer         │
│      Dashboard                                                 │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Session Management (Persistent)

### After Successful Auth:

```typescript
// Save to localStorage
localStorage.setItem('wallet_connected', 'true');
localStorage.setItem('wallet_address', address);
localStorage.setItem('user_role', 'company'); // or 'employee'
```

### On App Reload:

```typescript
// Auto-reconnect
const wasConnected = localStorage.getItem('wallet_connected');
if (wasConnected) {
  await reconnectWallet();
  // Redirect to last dashboard
}
```

### Disconnect Flow:

```
User clicks "Disconnect" in header
↓
Show "Disconnect Wallet?" modal
↓
Confirm → Clear localStorage → Redirect to landing page
```

---

## Error States Handled

1. **Wallet Not Installed**: Show install instructions + link to extension
2. **Connection Rejected**: Explain why wallet needed + "Try Again" button
3. **Wrong Network**: Auto-request network switch OR manual switch button
4. **Transaction Failed**: Show error + retry option + support link
5. **Network Error**: Check connection + Midnight status link
6. **Already Registered**: Go to dashboard OR switch wallet
7. **Insufficient Gas**: Show balance + buy DUST link
8. **Disconnected During Use**: Blocking modal with reconnect button

---

## Implementation Checklist

### Phase 1: Core Auth (Pages 1-5)
- [ ] Landing page with "Open App" CTA
- [ ] Wallet detection (check `window.midnight`)
- [ ] Connection modal + request
- [ ] Network validation
- [ ] Role detection from smart contract
- [ ] Error handling (all 8 scenarios)

### Phase 2: Onboarding (Pages 6-10)
- [ ] Role selector (company vs employee)
- [ ] Company registration form
- [ ] Company success + quick start wizard
- [ ] Employee welcome/pending screens
- [ ] Dual role switcher
- [ ] Session persistence (localStorage)

### Phase 3: Dashboards (Page 9)
- [ ] Company dashboard (covered in other wireframes)
- [ ] Employee dashboard (covered in other wireframes)

---

## Key Decision Points

1. **Network**: Mainnet vs Testnet
   - Production: Mainnet only
   - Development: Allow testnet with banner

2. **Role Detection**: What if both company AND employee?
   - Show role switcher
   - Remember last selected role in localStorage

3. **Quick Start Wizard**: Skip vs Complete
   - Optional (can skip all steps)
   - Can complete later from dashboard

4. **Email Template**: Auto-generate for pending employees
   - Pre-fill with wallet address
   - Instructions for employer

---

## Next Steps for Implementation

1. **Start with Page 1**: Landing page (from 1_ONBOARDING_WIREFRAME.md)
2. **Build Page 2-4**: Wallet connection flow (reusable hook)
3. **Build Page 5**: Role detection (smart contract integration)
4. **Build Pages 6-10**: Onboarding flows (company vs employee)
5. **Add Session Management**: Persistence and reconnection
6. **Test All Error States**: 8 error scenarios
7. **Build Dashboards**: Company and employee views (next phase)

---

**This flow diagram serves as the implementation roadmap for the authentication and onboarding system. All pages are documented with specific wireframes in AUTHENTICATION_ONBOARDING_WIREFRAMES.md.**
