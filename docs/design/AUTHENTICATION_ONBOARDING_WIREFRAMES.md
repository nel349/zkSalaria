# Authentication & Onboarding - Wireframes & Specifications

**Version:** 1.0
**Date:** 2025-11-01
**Purpose:** Complete authentication, wallet connection, and user onboarding flows

---

## Overview

**What This Covers:**
- Wallet connection flow (Midnight Wallet)
- Company registration (first-time setup)
- Employee first-time experience
- Role detection and routing
- Error states (wallet not installed, connection rejected, wrong network)
- Session management (disconnect, reconnect, network switch)

**Authentication Model:**
- **No passwords** - Wallet-based authentication only
- **Non-custodial** - User controls private keys (via Midnight Wallet)
- **Role-based** - Company vs Employee (detected from smart contract)

---

## Design System (Inherited)

**Colors:**
- Background: `#0A0E27` (Deep midnight blue)
- Cards: `#1A1F3A` (Lighter midnight)
- Primary Action: `#FF6B35` (Orange)
- Secondary Action: `#00D9FF` (Cyan)
- Success: `#10B981` (Green)
- Warning: `#F59E0B` (Yellow)
- Error: `#EF4444` (Red)
- Text Primary: `#F9FAFB` (White)
- Text Secondary: `#A0AEC0` (Gray)

**Typography:**
- Headings: Inter, 700 weight
- Body: Inter, 400 weight
- Buttons: Inter, 600 weight

---

## Flow 1: Landing Page → Connect Wallet

### Entry Point (Landing Page)

```
┌────────────────────────────────────────────────────┐
│ zkSalaria Landing Page                             │
│ (from ONBOARDING_WIREFRAME.md)                     │
├────────────────────────────────────────────────────┤
│                                                    │
│ Hero Section:                                      │
│ "Private Payroll, Verified On-Chain."              │
│                                                    │
│ [Open App →] (Orange button, 56px height)          │
│                                                    │
└────────────────────────────────────────────────────┘
```

**User clicks "Open App"**

---

### Step 1: Check Wallet Installation

**System checks: Is Midnight Wallet browser extension installed?**

#### Scenario A: Wallet NOT Installed ❌

```
┌────────────────────────────────────────────────────┐
│         Midnight Wallet Required                   │
├────────────────────────────────────────────────────┤
│                                                    │
│              🔐                                    │
│                                                    │
│ zkSalaria requires Midnight Wallet to connect.     │
│                                                    │
│ Midnight Wallet is a secure, non-custodial wallet  │
│ for the Midnight Network. Your private keys never  │
│ leave your device.                                 │
│                                                    │
│ ─────────────────────────────────────────────────  │
│                                                    │
│ [Install Midnight Wallet →] (Orange, primary)      │
│ (Opens: chrome.google.com/webstore/midnight)       │
│                                                    │
│ [Learn More About Midnight Wallet]                 │
│ (Link, opens docs)                                 │
│                                                    │
└────────────────────────────────────────────────────┘
```

**After Installation:**
```
User installs extension → Refreshes page → Try again
```

---

#### Scenario B: Wallet Installed ✅

**System proceeds to connection request**

```
┌────────────────────────────────────────────────────┐
│         Connect Your Wallet                        │
├────────────────────────────────────────────────────┤
│                                                    │
│              🔐                                    │
│                                                    │
│ Connect your Midnight Wallet to access zkSalaria.  │
│                                                    │
│ We'll use your wallet to:                          │
│ • Identify your account                            │
│ • Sign transactions (pay employees, withdraw)      │
│ • Decrypt your encrypted salary data               │
│                                                    │
│ Your private keys stay secure in your wallet.      │
│                                                    │
│ ─────────────────────────────────────────────────  │
│                                                    │
│ [Connect Wallet →] (Orange, primary)               │
│                                                    │
│ [Why do I need a wallet?]                          │
│ (Link, opens help article)                         │
│                                                    │
└────────────────────────────────────────────────────┘
```

**User clicks "Connect Wallet"**

---

### Step 2: Wallet Connection Request

**Midnight Wallet Extension Popup:**

```
┌────────────────────────────────────┐
│ Midnight Wallet                    │
├────────────────────────────────────┤
│                                    │
│ zkSalaria.app wants to connect     │
│                                    │
│ This site is requesting:           │
│ • Your wallet address              │
│ • Permission to request signatures │
│                                    │
│ Account: 0x1234...5678             │
│ Balance: 1,250 DUST                │
│                                    │
│ ⚠️ Only connect to sites you trust │
│                                    │
│ [Reject]        [Connect]          │
│  (Gray)         (Green)            │
└────────────────────────────────────┘
```

---

#### Scenario A: User Rejects Connection ❌

**zkSalaria shows:**

```
┌────────────────────────────────────────────────────┐
│         Connection Rejected                        │
├────────────────────────────────────────────────────┤
│                                                    │
│              ⚠️                                    │
│                                                    │
│ You rejected the wallet connection request.        │
│                                                    │
│ zkSalaria needs access to your wallet to:          │
│ • Identify your account                            │
│ • Sign payroll transactions                        │
│ • Decrypt encrypted salary data                    │
│                                                    │
│ Your private keys remain secure in your wallet.    │
│ We cannot access your funds without your approval. │
│                                                    │
│ ─────────────────────────────────────────────────  │
│                                                    │
│ [Try Again]     [Learn More]                       │
│  (Orange)        (Link)                            │
│                                                    │
└────────────────────────────────────────────────────┘
```

---

#### Scenario B: User Approves Connection ✅

**System checks: Is user on correct network?**

---

### Step 3: Network Validation

**Check: Is user connected to Midnight Mainnet?**

#### Scenario A: Wrong Network (e.g., Testnet) ❌

```
┌────────────────────────────────────────────────────┐
│         Wrong Network Detected                     │
├────────────────────────────────────────────────────┤
│                                                    │
│              🔗                                    │
│                                                    │
│ Please switch to Midnight Mainnet.                 │
│                                                    │
│ Current Network:  Midnight Testnet                 │
│ Required Network: Midnight Mainnet                 │
│                                                    │
│ ─────────────────────────────────────────────────  │
│                                                    │
│ [Switch Network →] (Orange, triggers wallet)       │
│                                                    │
│ [Use Testnet (Demo Mode)]                          │
│ (Link, for testing only)                           │
│                                                    │
└────────────────────────────────────────────────────┘
```

**Clicking "Switch Network" triggers Midnight Wallet popup:**

```
┌────────────────────────────────────┐
│ Midnight Wallet                    │
├────────────────────────────────────┤
│                                    │
│ zkSalaria.app requests to switch   │
│ networks.                          │
│                                    │
│ From: Midnight Testnet             │
│ To:   Midnight Mainnet             │
│                                    │
│ [Reject]        [Switch]           │
│  (Gray)         (Orange)           │
└────────────────────────────────────┘
```

---

#### Scenario B: Correct Network (Mainnet) ✅

**System proceeds to role detection**

---

### Step 4: Role Detection

**Smart Contract Query:**
```typescript
// Check if wallet is registered
const companyData = await contract.getCompany(walletAddress);
const employeeData = await contract.getEmployee(walletAddress);

if (companyData && employeeData) {
  // User is BOTH company and employee
  route = 'ROLE_SELECTOR';
} else if (companyData) {
  // User is company only
  route = 'COMPANY_DASHBOARD';
} else if (employeeData) {
  // User is employee only
  route = 'EMPLOYEE_DASHBOARD';
} else {
  // User is NEW (not registered)
  route = 'ONBOARDING';
}
```

---

#### Scenario A: New User (Not Registered) 🆕

**Show role selection:**

```
┌────────────────────────────────────────────────────┐
│         Welcome to zkSalaria! 👋                    │
├────────────────────────────────────────────────────┤
│                                                    │
│ Are you here as a company or an employee?          │
│                                                    │
│ ┌──────────────────────┐  ┌──────────────────────┐│
│ │                      │  │                      ││
│ │         🏢           │  │         👤           ││
│ │                      │  │                      ││
│ │      Company         │  │      Employee        ││
│ │                      │  │                      ││
│ │  I want to pay       │  │  I receive salary    ││
│ │  my employees        │  │  from my employer    ││
│ │                      │  │                      ││
│ │ [Get Started →]      │  │ [Get Started →]      ││
│ │                      │  │                      ││
│ └──────────────────────┘  └──────────────────────┘│
│                                                    │
│ ─────────────────────────────────────────────────  │
│                                                    │
│ Not sure? [Learn More About zkSalaria]             │
│                                                    │
└────────────────────────────────────────────────────┘
```

**User clicks "Company" → Go to Flow 2 (Company Onboarding)**
**User clicks "Employee" → Go to Flow 3 (Employee Onboarding)**

---

#### Scenario B: Registered Company ✅

**Loading state while fetching data:**

```
┌────────────────────────────────────────────────────┐
│              Loading Dashboard...                  │
├────────────────────────────────────────────────────┤
│                                                    │
│              ⏳                                    │
│                                                    │
│ Fetching your company data from blockchain...      │
│                                                    │
│ ████████████████░░░░░░░░  60%                      │
│                                                    │
└────────────────────────────────────────────────────┘
```

**Redirect to:** Company Dashboard

---

#### Scenario C: Registered Employee ✅

**Loading state:**

```
┌────────────────────────────────────────────────────┐
│              Loading Dashboard...                  │
├────────────────────────────────────────────────────┤
│                                                    │
│              ⏳                                    │
│                                                    │
│ Fetching your salary data from blockchain...       │
│                                                    │
│ ████████████████░░░░░░░░  60%                      │
│                                                    │
└────────────────────────────────────────────────────┘
```

**Redirect to:** Employee Dashboard

---

#### Scenario D: Both Company AND Employee 🔄

**Show role switcher:**

```
┌────────────────────────────────────────────────────┐
│         Multiple Roles Detected                    │
├────────────────────────────────────────────────────┤
│                                                    │
│ Your wallet has access to multiple accounts:       │
│                                                    │
│ ┌──────────────────────┐  ┌──────────────────────┐│
│ │ 🏢 Acme Corp         │  │ 👤 Employee at       ││
│ │                      │  │    TechStart Inc     ││
│ │ 12 employees         │  │                      ││
│ │ $54,500 paid         │  │ $8,200 balance       ││
│ │                      │  │                      ││
│ │ [View Dashboard →]   │  │ [View Dashboard →]   ││
│ │                      │  │                      ││
│ └──────────────────────┘  └──────────────────────┘│
│                                                    │
│ You can switch between roles anytime using the     │
│ switcher in the top navigation.                    │
│                                                    │
│ [Continue]                                         │
│                                                    │
└────────────────────────────────────────────────────┘
```

---

## Flow 2: Company Onboarding (First-Time Setup)

**Entry Point:** User selected "Company" in role selector

### Step 1: Company Registration Form

```
┌────────────────────────────────────────────────────┐
│         Setup Your Company                         │
├────────────────────────────────────────────────────┤
│                                                    │
│ Let's get your payroll account set up.             │
│                                                    │
│ ─────────────────────────────────────────────────  │
│                                                    │
│ Company Information                                │
│                                                    │
│ Company Name *                                     │
│ [Acme Corporation___________________________]      │
│ Legal name of your business                        │
│                                                    │
│ Industry                                           │
│ [Dropdown: Technology ▼                        ]   │
│ Options: Technology, Finance, Healthcare,          │
│          Retail, Manufacturing, Other              │
│                                                    │
│ Company Size                                       │
│ [Dropdown: 1-10 employees ▼                    ]   │
│ Options: 1-10, 11-50, 51-200, 201-1000, 1000+      │
│                                                    │
│ Admin Email *                                      │
│ [admin@acmecorp.com_________________________]      │
│ For payment notifications and alerts               │
│                                                    │
│ ─────────────────────────────────────────────────  │
│                                                    │
│ Connected Wallet                                   │
│ 0x1234...5678 [📋 Copy]                            │
│ This will be your company's payroll wallet         │
│                                                    │
│ ─────────────────────────────────────────────────  │
│                                                    │
│ ☐ I agree to zkSalaria Terms of Service            │
│                                                    │
│ [Cancel]                      [Create Company →]   │
│  (Gray)                        (Orange)            │
│                                                    │
└────────────────────────────────────────────────────┘
```

**Validation:**
- Company name: Required, 2-100 characters
- Industry: Required, from dropdown
- Company size: Required, from dropdown
- Admin email: Required, valid email format
- Terms: Must be checked

**User clicks "Create Company"**

---

### Step 2: Smart Contract Transaction

**Midnight Wallet popup:**

```
┌────────────────────────────────────┐
│ Midnight Wallet                    │
├────────────────────────────────────┤
│                                    │
│ zkSalaria.app requests to execute  │
│ transaction.                       │
│                                    │
│ Function: register_company         │
│ Parameters:                        │
│ • name: "Acme Corporation"         │
│ • wallet: 0x1234...5678            │
│ • email: "admin@acmecorp.com"      │
│                                    │
│ Gas Fee: ~0.001 DUST (~$0.02)      │
│                                    │
│ [Reject]        [Confirm]          │
│  (Gray)         (Green)            │
└────────────────────────────────────┘
```

**User clicks "Confirm"**

---

### Step 3: Processing Transaction

**Loading state:**

```
┌────────────────────────────────────────────────────┐
│         Creating Your Company...                   │
├────────────────────────────────────────────────────┤
│                                                    │
│              ⏳                                    │
│                                                    │
│ Registering your company on the blockchain...      │
│                                                    │
│ This may take 10-30 seconds.                       │
│                                                    │
│ Transaction: 0x9876...1234                         │
│                                                    │
└────────────────────────────────────────────────────┘
```

---

### Step 4: Success + Onboarding Wizard

**Success modal:**

```
┌────────────────────────────────────────────────────┐
│         Company Created! 🎉                         │
├────────────────────────────────────────────────────┤
│                                                    │
│ Acme Corporation is now registered on zkSalaria.   │
│                                                    │
│ Transaction: 0x9876...1234 [📋 Copy]               │
│ Block: #1,234,567                                  │
│                                                    │
│ ─────────────────────────────────────────────────  │
│                                                    │
│ Next Steps:                                        │
│                                                    │
│ 1. Fund your payroll account                       │
│ 2. Add your first employee                         │
│ 3. Make your first payment                         │
│                                                    │
│ [Get Started →]                                    │
│                                                    │
└────────────────────────────────────────────────────┘
```

**User clicks "Get Started"**

---

### Step 5: Onboarding Wizard (Optional Quick Start)

**Wizard Step 1: Fund Account**

```
┌────────────────────────────────────────────────────┐
│ Quick Start (1 of 3): Fund Your Payroll Account    │
├────────────────────────────────────────────────────┤
│                                                    │
│ To pay employees, you need to deposit USDC or      │
│ DUST into your payroll account.                    │
│                                                    │
│ Current Balance: 0 USDC                            │
│                                                    │
│ Recommended: Deposit enough to cover 1 month of    │
│              employee salaries.                    │
│                                                    │
│ Amount to Deposit:                                 │
│ [$10,000___] USDC                                  │
│                                                    │
│ [Deposit Now] [Skip for Now]                       │
│                                                    │
└────────────────────────────────────────────────────┘
```

**Wizard Step 2: Add First Employee**

```
┌────────────────────────────────────────────────────┐
│ Quick Start (2 of 3): Add Your First Employee      │
├────────────────────────────────────────────────────┤
│                                                    │
│ Employee Name:                                     │
│ [Alice Johnson___________________________]         │
│                                                    │
│ Wallet Address:                                    │
│ [0xABCD...________________________________]        │
│                                                    │
│ Base Salary:                                       │
│ [$5,000___] per [Month ▼]                          │
│                                                    │
│ Role:                                              │
│ [Engineer ▼]                                       │
│                                                    │
│ [Add Employee] [Skip for Now]                      │
│                                                    │
└────────────────────────────────────────────────────┘
```

**Wizard Step 3: Setup Recurring Payment**

```
┌────────────────────────────────────────────────────┐
│ Quick Start (3 of 3): Setup Recurring Payment      │
├────────────────────────────────────────────────────┤
│                                                    │
│ Automate Alice's payroll with recurring payments.  │
│                                                    │
│ Employee: Alice Johnson                            │
│ Amount: $5,000                                     │
│                                                    │
│ Frequency:                                         │
│ [Monthly ▼]                                        │
│                                                    │
│ Start Date:                                        │
│ [Dec 1, 2025 📅]                                   │
│                                                    │
│ [Setup Recurring Payment] [Skip for Now]           │
│                                                    │
└────────────────────────────────────────────────────┘
```

**Wizard Complete:**

```
┌────────────────────────────────────────────────────┐
│         All Set! ✅                                 │
├────────────────────────────────────────────────────┤
│                                                    │
│ Your payroll is configured and ready.              │
│                                                    │
│ Summary:                                           │
│ • Funded: $10,000 USDC                             │
│ • Employee: Alice Johnson added                    │
│ • Recurring: Monthly payments ($5,000)             │
│                                                    │
│ Alice's first payment will be on Dec 1, 2025.      │
│                                                    │
│ [Go to Dashboard →]                                │
│                                                    │
└────────────────────────────────────────────────────┘
```

---

## Flow 3: Employee Onboarding (First-Time Experience)

**Entry Point:** User selected "Employee" in role selector

### Scenario A: Employee Already Added by Company ✅

**Check smart contract:**
```typescript
const employeeData = await contract.getEmployee(walletAddress);
if (employeeData) {
  // Employee exists, show welcome
} else {
  // Employee not added yet, show pending state
}
```

**Welcome screen:**

```
┌────────────────────────────────────────────────────┐
│         Welcome to zkSalaria! 🎉                    │
├────────────────────────────────────────────────────┤
│                                                    │
│ You've been added to payroll by:                   │
│                                                    │
│         🏢 Acme Corporation                        │
│                                                    │
│ Your encrypted salary balance:                     │
│         ••••••  🔓 (Click to decrypt)              │
│                                                    │
│ Role: Engineer                                     │
│ Base Salary: $5,000/month                          │
│                                                    │
│ ─────────────────────────────────────────────────  │
│                                                    │
│ Quick Actions:                                     │
│ • View your payment history                        │
│ • Withdraw salary to your wallet                   │
│ • Generate income proof for lenders                │
│                                                    │
│ [Go to Dashboard →]                                │
│                                                    │
└────────────────────────────────────────────────────┘
```

---

### Scenario B: Employee NOT Added Yet (Pending) ⏸️

**Pending state:**

```
┌────────────────────────────────────────────────────┐
│         Not Yet Added to Payroll                   │
├────────────────────────────────────────────────────┤
│                                                    │
│              ⏳                                    │
│                                                    │
│ Your employer hasn't added you to payroll yet.     │
│                                                    │
│ To receive payments, ask your employer to add      │
│ your wallet address:                               │
│                                                    │
│ ┌────────────────────────────────────────────────┐│
│ │ 0x1234567890abcdef1234567890abcdef12345678     ││
│ │ [📋 Copy Address]                              ││
│ └────────────────────────────────────────────────┘│
│                                                    │
│ Once added, you'll receive a notification and can  │
│ access your dashboard.                             │
│                                                    │
│ ─────────────────────────────────────────────────  │
│                                                    │
│ [Email Instructions to Employer]                   │
│ [Learn More About zkSalaria]                       │
│                                                    │
└────────────────────────────────────────────────────┘
```

**Email template generated when user clicks "Email Instructions":**

```
To: [employer_email]
Subject: Add me to zkSalaria Payroll

Hi,

I'd like to receive my salary through zkSalaria.

Please add me to payroll with this wallet address:
0x1234567890abcdef1234567890abcdef12345678

Steps:
1. Log in to zkSalaria.app
2. Click "Add Employee"
3. Enter my wallet address above
4. Set my base salary and role

Thank you!

[Employee Name]
```

---

## Flow 4: Session Management (After Login)

### Persistent Connection

**Save wallet connection state:**
```typescript
// After successful connection
localStorage.setItem('wallet_connected', 'true');
localStorage.setItem('wallet_address', walletAddress);
localStorage.setItem('user_role', 'company'); // or 'employee'

// On app reload
const wasConnected = localStorage.getItem('wallet_connected');
if (wasConnected) {
  // Auto-reconnect to wallet
  await reconnectWallet();
}
```

---

### Disconnect Wallet

**User clicks disconnect (in header or settings):**

```
┌────────────────────────────────────┐
│ Disconnect Wallet?                 │
├────────────────────────────────────┤
│                                    │
│ Are you sure you want to           │
│ disconnect your wallet?            │
│                                    │
│ You'll need to reconnect to use    │
│ zkSalaria.                         │
│                                    │
│ [Cancel]        [Disconnect]       │
│  (Gray)         (Red)              │
└────────────────────────────────────┘
```

**After disconnect:**
```
Clear session:
• localStorage.clear()
• Redirect to landing page
```

---

### Network Switch Detected

**User switches network in Midnight Wallet (e.g., Mainnet → Testnet):**

**Show banner:**

```
┌────────────────────────────────────────────────────┐
│ ⚠️ Network Changed                                  │
├────────────────────────────────────────────────────┤
│ You switched to Midnight Testnet. zkSalaria        │
│ requires Midnight Mainnet.                         │
│                                                    │
│ [Switch Back to Mainnet] [Dismiss]                 │
└────────────────────────────────────────────────────┘
```

**Or automatically switch:**

```typescript
// Listen for network changes
wallet.on('chainChanged', (chainId) => {
  if (chainId !== MIDNIGHT_MAINNET_CHAIN_ID) {
    // Show warning or auto-request switch
    await wallet.switchChain(MIDNIGHT_MAINNET_CHAIN_ID);
  }
});
```

---

### Wallet Disconnected (While Using App)

**User disconnects wallet manually or extension crashes:**

**Show blocking modal:**

```
┌────────────────────────────────────────────────────┐
│         Wallet Disconnected                        │
├────────────────────────────────────────────────────┤
│                                                    │
│              🔌                                    │
│                                                    │
│ Your wallet was disconnected.                      │
│                                                    │
│ Please reconnect to continue using zkSalaria.      │
│                                                    │
│ [Reconnect Wallet →]                               │
│                                                    │
└────────────────────────────────────────────────────┘
```

---

## Error States (Comprehensive)

### Error 1: Transaction Failed

```
┌────────────────────────────────────────────────────┐
│         Transaction Failed ❌                       │
├────────────────────────────────────────────────────┤
│                                                    │
│ Failed to register company.                        │
│                                                    │
│ Error: Transaction reverted - insufficient gas     │
│                                                    │
│ Common causes:                                     │
│ • Not enough DUST for gas fees                     │
│ • Network congestion (try again later)             │
│ • Wallet rejected transaction                      │
│                                                    │
│ Transaction Hash: 0x9876...1234 [📋 Copy]          │
│                                                    │
│ [Try Again]  [Contact Support]  [Cancel]           │
│                                                    │
└────────────────────────────────────────────────────┘
```

---

### Error 2: Network Error

```
┌────────────────────────────────────────────────────┐
│         Network Error                              │
├────────────────────────────────────────────────────┤
│                                                    │
│              🌐                                    │
│                                                    │
│ Cannot connect to Midnight Network.                │
│                                                    │
│ Please check:                                      │
│ • Your internet connection                         │
│ • Midnight Network status (status.midnight.network)│
│ • Firewall settings                                │
│                                                    │
│ [Retry]  [Check Network Status]  [Cancel]          │
│                                                    │
└────────────────────────────────────────────────────┘
```

---

### Error 3: Account Already Registered

```
┌────────────────────────────────────────────────────┐
│         Account Already Registered                 │
├────────────────────────────────────────────────────┤
│                                                    │
│              ⚠️                                    │
│                                                    │
│ This wallet is already registered as a company.    │
│                                                    │
│ Company Name: Acme Corporation                     │
│ Registered: Nov 1, 2025                            │
│                                                    │
│ Would you like to:                                 │
│ • Go to your dashboard                             │
│ • Use a different wallet                           │
│                                                    │
│ [Go to Dashboard]  [Disconnect & Switch Wallet]    │
│                                                    │
└────────────────────────────────────────────────────┘
```

---

### Error 4: Insufficient Funds (Gas)

```
┌────────────────────────────────────────────────────┐
│         Insufficient Funds for Gas                 │
├────────────────────────────────────────────────────┤
│                                                    │
│              💰                                    │
│                                                    │
│ You don't have enough DUST to pay gas fees.        │
│                                                    │
│ Your Balance:  0.0001 DUST                         │
│ Gas Required:  0.001 DUST (~$0.02)                 │
│ Shortfall:     0.0009 DUST (~$0.018)               │
│                                                    │
│ Please add DUST to your wallet and try again.      │
│                                                    │
│ [Buy DUST]  [Learn More]  [Cancel]                 │
│                                                    │
└────────────────────────────────────────────────────┘
```

---

## Mobile Responsive Design

### Mobile Wallet Connection

**Landing page (mobile):**

```
┌─────────────────────────────┐
│ zkSalaria                   │
│                             │
│ Private Payroll,            │
│ Verified On-Chain.          │
│                             │
│ Pay employees with          │
│ encrypted balances...       │
│                             │
│ [Open App →]                │
│ (Full width button)         │
└─────────────────────────────┘
```

**Wallet connection (mobile):**

```
┌─────────────────────────────┐
│ Connect Wallet              │
├─────────────────────────────┤
│                             │
│        🔐                   │
│                             │
│ Connect your Midnight       │
│ Wallet to access zkSalaria. │
│                             │
│ We'll use your wallet to:   │
│ • Identify your account     │
│ • Sign transactions         │
│ • Decrypt encrypted data    │
│                             │
│ [Connect Wallet →]          │
│                             │
│ [Learn More]                │
└─────────────────────────────┘
```

**Company registration (mobile):**

```
┌─────────────────────────────┐
│ Setup Your Company          │
├─────────────────────────────┤
│                             │
│ Company Name *              │
│ [Acme Corp__________]       │
│                             │
│ Industry                    │
│ [Technology ▼]              │
│                             │
│ Company Size                │
│ [1-10 employees ▼]          │
│                             │
│ Admin Email *               │
│ [admin@acme.com_____]       │
│                             │
│ ☐ Agree to Terms            │
│                             │
│ [Create Company →]          │
│                             │
└─────────────────────────────┘
(Sticky bottom button)
```

---

## Implementation Notes

### Frontend (React/TypeScript)

```typescript
// hooks/useAuth.ts

import { MidnightWallet } from '@midnight-network/wallet-sdk';
import { useState, useEffect } from 'react';

export function useAuth() {
  const [wallet, setWallet] = useState<MidnightWallet | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [role, setRole] = useState<'company' | 'employee' | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Try to auto-reconnect on page load
    autoReconnect();
  }, []);

  async function autoReconnect() {
    const wasConnected = localStorage.getItem('wallet_connected');
    if (wasConnected === 'true') {
      await connectWallet();
    }
    setLoading(false);
  }

  async function connectWallet() {
    try {
      // Check if Midnight Wallet is installed
      if (!window.midnight) {
        throw new Error('WALLET_NOT_INSTALLED');
      }

      // Request connection
      const wallet = await MidnightWallet.connect();
      const address = await wallet.getAddress();

      // Check network
      const chainId = await wallet.getChainId();
      if (chainId !== MIDNIGHT_MAINNET_CHAIN_ID) {
        throw new Error('WRONG_NETWORK');
      }

      // Detect role from smart contract
      const role = await detectRole(address);

      // Save state
      setWallet(wallet);
      setAddress(address);
      setRole(role);
      localStorage.setItem('wallet_connected', 'true');
      localStorage.setItem('wallet_address', address);
      localStorage.setItem('user_role', role);

      return { wallet, address, role };
    } catch (error) {
      handleAuthError(error);
    }
  }

  async function detectRole(address: string): Promise<'company' | 'employee' | null> {
    const companyData = await payrollContract.getCompany(address);
    const employeeData = await payrollContract.getEmployee(address);

    if (companyData && employeeData) {
      // User has both roles
      return await askUserRole(); // Show role selector
    } else if (companyData) {
      return 'company';
    } else if (employeeData) {
      return 'employee';
    } else {
      return null; // New user, needs onboarding
    }
  }

  function disconnect() {
    setWallet(null);
    setAddress(null);
    setRole(null);
    localStorage.clear();
  }

  return {
    wallet,
    address,
    role,
    loading,
    connectWallet,
    disconnect,
    isConnected: !!wallet
  };
}
```

---

### Smart Contract Integration

```typescript
// services/payroll.ts

export async function registerCompany(data: {
  name: string;
  email: string;
  industry: string;
  size: string;
}) {
  // Request wallet signature
  const wallet = await MidnightWallet.getConnected();

  // Call smart contract
  const tx = await payrollContract.register_company(
    data.name,
    wallet.address,
    data.email
  );

  // Wait for confirmation
  await tx.wait();

  return tx.hash;
}

export async function getCompany(address: string) {
  return await payrollContract.getCompany(address);
}

export async function getEmployee(address: string) {
  return await payrollContract.getEmployee(address);
}
```

---

## Success Criteria

**Wallet Connection:**
- ✅ Detect Midnight Wallet installation (100% accuracy)
- ✅ Handle connection rejection gracefully
- ✅ Validate network before proceeding
- ✅ Auto-reconnect on page reload (if user was connected)

**Role Detection:**
- ✅ Correctly identify company vs employee (100% accuracy)
- ✅ Handle dual roles (both company and employee)
- ✅ Handle new users (not registered)

**Onboarding:**
- ✅ Company registration <3 minutes
- ✅ Employee pending state clear and actionable
- ✅ <5% drop-off rate during onboarding

**Error Handling:**
- ✅ All error scenarios handled
- ✅ Clear error messages with actionable next steps
- ✅ <1% unhandled exceptions

---

*This authentication flow provides a complete, production-ready wallet-based authentication system for zkSalaria with comprehensive error handling and role-based routing.*
