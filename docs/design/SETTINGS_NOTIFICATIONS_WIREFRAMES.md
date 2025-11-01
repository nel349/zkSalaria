# Settings & Notifications - Wireframes & Specifications

**Version:** 1.0
**Date:** 2025-11-01
**Purpose:** Complete settings, account management, notifications, and funding flows

---

## Overview

**What This Covers:**
- Settings page (Company & Employee views)
- Account funding flow (Company deposits USDC/DUST)
- Notification preferences
- In-app notifications (toast + notification center)
- Profile management
- Privacy & security settings

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

---

## Page 1: Settings (Company View)

### Layout

**Breadcrumb:**
`Dashboard > Settings`

**Page Structure: Sidebar + Content (Desktop)**

```
┌────────────────────────────────────────────────────────────────┐
│ Settings                                                       │
├──────────────┬─────────────────────────────────────────────────┤
│              │                                                 │
│ SIDEBAR      │ CONTENT AREA                                    │
│ (240px)      │ (Fill remaining)                                │
│              │                                                 │
│ Company      │ [Active section content shown here]             │
│ ● Profile    │                                                 │
│   Wallet     │                                                 │
│   Team       │                                                 │
│              │                                                 │
│ Payroll      │                                                 │
│   Employees  │                                                 │
│   Recurring  │                                                 │
│              │                                                 │
│ Preferences  │                                                 │
│   Notif...   │                                                 │
│   Privacy    │                                                 │
│              │                                                 │
│ Advanced     │                                                 │
│   Backup     │                                                 │
│   API Keys   │                                                 │
│              │                                                 │
└──────────────┴─────────────────────────────────────────────────┘
```

---

### Section 1: Company Profile

**Sidebar:** Company > Profile (active)

```
┌─────────────────────────────────────────────────────┐
│ Company Profile                                     │
├─────────────────────────────────────────────────────┤
│                                                     │
│ Company Information                                 │
│                                                     │
│ Company Logo                                        │
│ ┌──────────┐                                        │
│ │          │                                        │
│ │   ACME   │  [Upload New Logo] [Remove]           │
│ │          │   (Max 2 MB, PNG/JPG)                 │
│ └──────────┘                                        │
│                                                     │
│ Company Name *                                      │
│ [Acme Corporation_________________________]         │
│                                                     │
│ Industry                                            │
│ [Dropdown: Technology ▼                         ]   │
│                                                     │
│ Company Size                                        │
│ [Dropdown: 11-50 employees ▼                    ]   │
│                                                     │
│ Admin Email *                                       │
│ [admin@acmecorp.com_________________________]       │
│ Used for important notifications and alerts         │
│                                                     │
│ Registered On                                       │
│ Nov 1, 2025 (30 days ago)                           │
│                                                     │
│ ─────────────────────────────────────────────────   │
│                                                     │
│ [Cancel]                        [Save Changes →]    │
│                                  (Orange)           │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

### Section 2: Wallet Management

**Sidebar:** Company > Wallet (active)

```
┌─────────────────────────────────────────────────────┐
│ Wallet Management                                   │
├─────────────────────────────────────────────────────┤
│                                                     │
│ Connected Wallet                                    │
│                                                     │
│ ┌───────────────────────────────────────────────┐  │
│ │ 🔐 0x1234567890abcdef1234567890abcdef12345678  │  │
│ │ [📋 Copy] [🔗 View on Explorer]               │  │
│ │                                                │  │
│ │ Status: ✅ Connected                           │  │
│ │ Network: Midnight Mainnet                      │  │
│ │ Balance: 1,250 DUST (~$25)                     │  │
│ └───────────────────────────────────────────────┘  │
│                                                     │
│ [Disconnect Wallet]                                 │
│  (Gray button)                                      │
│                                                     │
│ ─────────────────────────────────────────────────   │
│                                                     │
│ Payroll Account Balance                             │
│                                                     │
│ ┌───────────────────────────────────────────────┐  │
│ │ 💰 $54,200 USDC                                │  │
│ │                                                │  │
│ │ Next payment: $12,000 (in 3 days)              │  │
│ │ Remaining after: $42,200                       │  │
│ │                                                │  │
│ │ ⚠️ Low balance warning:                        │  │
│ │ You have 3.5 months of runway at current rate  │  │
│ └───────────────────────────────────────────────┘  │
│                                                     │
│ [Fund Account →]  [View Transaction History]        │
│  (Orange)          (Link)                           │
│                                                     │
│ ─────────────────────────────────────────────────   │
│                                                     │
│ Gas Fee Reserve                                     │
│                                                     │
│ Balance: 0.5 DUST (~$0.10)                          │
│ Recommended: 1.0 DUST (~$0.20)                      │
│                                                     │
│ ℹ️ Gas fees are paid from your DUST balance,       │
│    not your payroll account.                        │
│                                                     │
│ [Add DUST →]                                        │
│  (Cyan)                                             │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

### Section 3: Team Management (Future)

**Sidebar:** Company > Team (active)

```
┌─────────────────────────────────────────────────────┐
│ Team Management                                     │
├─────────────────────────────────────────────────────┤
│                                                     │
│ Team Members (Admins)                               │
│                                                     │
│ Admins can pay employees, add employees, and        │
│ manage payroll settings.                            │
│                                                     │
│ ┌───────────────────────────────────────────────┐  │
│ │ 👤 You (Owner)                                 │  │
│ │    admin@acmecorp.com                          │  │
│ │    0x1234...5678                               │  │
│ │    Role: Owner (Full Access)                   │  │
│ │    [Remove] (disabled)                         │  │
│ └───────────────────────────────────────────────┘  │
│                                                     │
│ ┌───────────────────────────────────────────────┐  │
│ │ 👤 Bob Smith (Admin)                           │  │
│ │    bob@acmecorp.com                            │  │
│ │    0x9876...4321                               │  │
│ │    Role: Admin (Can pay employees)             │  │
│ │    [Edit] [Remove]                             │  │
│ └───────────────────────────────────────────────┘  │
│                                                     │
│ [+ Add Team Member]                                 │
│  (Cyan button)                                      │
│                                                     │
│ ─────────────────────────────────────────────────   │
│                                                     │
│ ⏸️ Team management is a future feature (Phase 5)   │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

### Section 4: Notification Preferences

**Sidebar:** Preferences > Notifications (active)

```
┌─────────────────────────────────────────────────────┐
│ Notification Preferences                            │
├─────────────────────────────────────────────────────┤
│                                                     │
│ Email Notifications                                 │
│                                                     │
│ Send notifications to: admin@acmecorp.com           │
│ [Change Email]                                      │
│                                                     │
│ ☑ Payment Executed                                  │
│   Notify when recurring payments are processed      │
│                                                     │
│ ☑ Payment Failed                                    │
│   Alert when payment fails (insufficient balance)   │
│                                                     │
│ ☑ Low Balance Warning                               │
│   Alert when payroll balance is low                 │
│   Threshold: [2 months ▼] of runway                 │
│                                                     │
│ ☑ Employee Added                                    │
│   Notify when new employee is added to payroll      │
│                                                     │
│ ☐ Weekly Summary                                    │
│   Weekly payroll summary (every Monday)             │
│                                                     │
│ ─────────────────────────────────────────────────   │
│                                                     │
│ In-App Notifications                                │
│                                                     │
│ ☑ Show toast notifications (bottom-right)           │
│ ☑ Show notification bell badge (top-right)          │
│ ☐ Play sound on notification                        │
│                                                     │
│ ─────────────────────────────────────────────────   │
│                                                     │
│ Webhook Integration (Advanced)                      │
│                                                     │
│ Send events to external systems (accounting, etc.)  │
│                                                     │
│ Webhook URL:                                        │
│ [https://api.acmecorp.com/webhooks/payroll___]      │
│                                                     │
│ Events to Send:                                     │
│ ☑ payment.executed                                  │
│ ☑ payment.failed                                    │
│ ☑ employee.added                                    │
│                                                     │
│ [Test Webhook]  [Save Changes]                      │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

### Section 5: Privacy & Security

**Sidebar:** Preferences > Privacy (active)

```
┌─────────────────────────────────────────────────────┐
│ Privacy & Security                                  │
├─────────────────────────────────────────────────────┤
│                                                     │
│ Encryption Status                                   │
│                                                     │
│ ✅ All employee salary data is encrypted on-chain   │
│                                                     │
│ Encryption Key: [View Technical Details]            │
│                                                     │
│ ─────────────────────────────────────────────────   │
│                                                     │
│ Data Visibility                                     │
│                                                     │
│ Who can see employee salaries?                      │
│ ● Only you (company owner)                          │
│ ○ All team admins                                   │
│ ○ Specific team members (select below)              │
│                                                     │
│ ─────────────────────────────────────────────────   │
│                                                     │
│ Session Management                                  │
│                                                     │
│ Active Sessions:                                    │
│                                                     │
│ ┌───────────────────────────────────────────────┐  │
│ │ 🖥️ MacBook Pro (Current)                       │  │
│ │    Chrome on macOS                             │  │
│ │    Last active: Now                            │  │
│ │    IP: 192.168.1.100                           │  │
│ └───────────────────────────────────────────────┘  │
│                                                     │
│ ┌───────────────────────────────────────────────┐  │
│ │ 📱 iPhone 15                                   │  │
│ │    Safari on iOS                               │  │
│ │    Last active: 2 hours ago                    │  │
│ │    IP: 192.168.1.101                           │  │
│ │    [Revoke Session]                            │  │
│ └───────────────────────────────────────────────┘  │
│                                                     │
│ [Revoke All Other Sessions]                         │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

## Page 2: Settings (Employee View)

### Section 1: Profile

**Sidebar:** Profile (active)

```
┌─────────────────────────────────────────────────────┐
│ My Profile                                          │
├─────────────────────────────────────────────────────┤
│                                                     │
│ Personal Information                                │
│                                                     │
│ Name                                                │
│ [Alice Johnson____________________________]         │
│                                                     │
│ Email                                               │
│ [alice@example.com________________________]         │
│ Used for payment notifications                      │
│                                                     │
│ Role                                                │
│ [Engineer_________________________________]         │
│ (Read-only, set by company)                         │
│                                                     │
│ ─────────────────────────────────────────────────   │
│                                                     │
│ Connected Wallet                                    │
│                                                     │
│ 0x1234567890abcdef1234567890abcdef12345678          │
│ [📋 Copy] [🔗 View on Explorer]                     │
│                                                     │
│ ⚠️ Cannot change wallet address                     │
│ If you need to change it, contact your employer    │
│                                                     │
│ ─────────────────────────────────────────────────   │
│                                                     │
│ Employment Information (Read-Only)                  │
│                                                     │
│ Employer: Acme Corporation                          │
│ Base Salary: ••••••  🔓 (Click to decrypt)          │
│ Start Date: Jan 15, 2024                            │
│ Employment Status: ✅ Active                        │
│                                                     │
│ [Cancel]                        [Save Changes →]    │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

### Section 2: Notification Preferences (Employee)

**Sidebar:** Preferences > Notifications (active)

```
┌─────────────────────────────────────────────────────┐
│ Notification Preferences                            │
├─────────────────────────────────────────────────────┤
│                                                     │
│ Email Notifications                                 │
│                                                     │
│ Send notifications to: alice@example.com            │
│ [Change Email]                                      │
│                                                     │
│ ☑ Payment Received                                  │
│   Notify when salary payment is received            │
│                                                     │
│ ☑ Recurring Payment Executed                        │
│   Notify when recurring salary is paid              │
│                                                     │
│ ☑ Proof Generated                                   │
│   Alert when ZK proof generation is complete        │
│                                                     │
│ ☑ Employment Status Change                          │
│   Notify when employment status changes             │
│                                                     │
│ ☐ Monthly Summary                                   │
│   Monthly earnings summary (first of each month)    │
│                                                     │
│ ─────────────────────────────────────────────────   │
│                                                     │
│ In-App Notifications                                │
│                                                     │
│ ☑ Show toast notifications                          │
│ ☑ Show notification bell badge                      │
│ ☐ Play sound on notification                        │
│                                                     │
│ [Save Changes]                                      │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

### Section 3: Privacy & Disclosure (Employee)

**Sidebar:** Preferences > Privacy (active)

```
┌─────────────────────────────────────────────────────┐
│ Privacy & Disclosure                                │
├─────────────────────────────────────────────────────┤
│                                                     │
│ Generated Proofs                                    │
│                                                     │
│ ZK proofs you've created for lenders, landlords,    │
│ or other third parties.                             │
│                                                     │
│ ┌───────────────────────────────────────────────┐  │
│ │ Income Proof - Wells Fargo                     │  │
│ │ "I earn > $5,000/month"                        │  │
│ │ Created: Nov 10, 2025                          │  │
│ │ Expires: Dec 10, 2025 (30 days)                │  │
│ │ Status: ✅ Active                              │  │
│ │ [Revoke] [Download]                            │  │
│ └───────────────────────────────────────────────┘  │
│                                                     │
│ ┌───────────────────────────────────────────────┐  │
│ │ Employment Proof - Landlord (Acme Apartments)  │  │
│ │ "Employed at Acme Corporation"                 │  │
│ │ Created: Oct 1, 2025                           │  │
│ │ Expires: Oct 1, 2026 (1 year)                  │  │
│ │ Status: ✅ Active                              │  │
│ │ [Revoke] [Download]                            │  │
│ └───────────────────────────────────────────────┘  │
│                                                     │
│ [+ Generate New Proof]                              │
│                                                     │
│ ─────────────────────────────────────────────────   │
│                                                     │
│ Granted Disclosures                                 │
│                                                     │
│ Third parties you've granted access to view your    │
│ salary data.                                        │
│                                                     │
│ ┌───────────────────────────────────────────────┐  │
│ │ Wells Fargo (Mortgage Application)             │  │
│ │ Access: View salary amounts                    │  │
│ │ Granted: Nov 10, 2025                          │  │
│ │ Expires: Dec 10, 2025 (30 days)                │  │
│ │ [Revoke Access]                                │  │
│ └───────────────────────────────────────────────┘  │
│                                                     │
│ [+ Grant New Disclosure]                            │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

## Flow: Fund Payroll Account (Company)

### Entry Point

**From Settings > Wallet Management:**

User clicks **[Fund Account →]**

---

### Modal: Fund Payroll Account

```
┌─────────────────────────────────────────────────────┐
│         Fund Payroll Account                        │
├─────────────────────────────────────────────────────┤
│                                                     │
│ Current Balance: $54,200 USDC                       │
│                                                     │
│ Upcoming Payments (Next 30 Days):                   │
│ • Nov 15: $12,000 (4 employees)                     │
│ • Nov 29: $12,000 (4 employees)                     │
│ • Dec 1: $6,500 (2 employees)                       │
│ • Dec 13: $12,000 (4 employees)                     │
│ Total: $42,500                                      │
│                                                     │
│ Balance After Payments: $11,700                     │
│ ⚠️ Recommend funding at least $30,000 more          │
│                                                     │
│ ─────────────────────────────────────────────────   │
│                                                     │
│ Amount to Deposit *                                 │
│ [$50,000___]                                        │
│                                                     │
│ Token                                               │
│ [Dropdown: USDC ▼                               ]   │
│ Options: USDC, DUST, DAI                            │
│                                                     │
│ ─────────────────────────────────────────────────   │
│                                                     │
│ Deposit From                                        │
│ ● Connected Wallet (0x1234...5678)                  │
│   Available: 75,000 USDC                            │
│ ○ External Wallet                                   │
│   [Paste address__________________]                 │
│                                                     │
│ ─────────────────────────────────────────────────   │
│                                                     │
│ Summary                                             │
│ Deposit Amount: $50,000 USDC                        │
│ Gas Fee: ~$0.02                                     │
│ New Balance: $104,200 USDC                          │
│ Runway: ~8.7 months                                 │
│                                                     │
│ [Cancel]                           [Deposit Now →]  │
│  (Gray)                             (Orange)        │
│                                                     │
└─────────────────────────────────────────────────────┘
```

**User clicks "Deposit Now"**

---

### Wallet Approval (Midnight Wallet Popup)

```
┌────────────────────────────────────┐
│ Midnight Wallet                    │
├────────────────────────────────────┤
│                                    │
│ zkSalaria.app requests permission  │
│ to spend your USDC.                │
│                                    │
│ Amount: 50,000 USDC                │
│ Spender: zkSalaria Payroll Contract│
│ Contract: 0xABCD...EFGH            │
│                                    │
│ This is a one-time approval.       │
│                                    │
│ [Reject]        [Approve]          │
│  (Gray)         (Green)            │
└────────────────────────────────────┘
```

**User clicks "Approve"**

---

### Deposit Transaction

**Midnight Wallet popup:**

```
┌────────────────────────────────────┐
│ Midnight Wallet                    │
├────────────────────────────────────┤
│                                    │
│ zkSalaria.app requests to execute  │
│ transaction.                       │
│                                    │
│ Function: deposit_to_payroll       │
│ Amount: 50,000 USDC                │
│ Gas Fee: ~0.001 DUST (~$0.02)      │
│                                    │
│ [Reject]        [Confirm]          │
│  (Gray)         (Green)            │
└────────────────────────────────────┘
```

**User clicks "Confirm"**

---

### Processing

**Loading modal:**

```
┌─────────────────────────────────────────────────────┐
│         Processing Deposit...                       │
├─────────────────────────────────────────────────────┤
│                                                     │
│              ⏳                                     │
│                                                     │
│ Depositing 50,000 USDC to your payroll account...   │
│                                                     │
│ This may take 10-30 seconds.                        │
│                                                     │
│ Transaction: 0x5678...9012                          │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

### Success

**Success modal:**

```
┌─────────────────────────────────────────────────────┐
│         Deposit Successful! ✅                       │
├─────────────────────────────────────────────────────┤
│                                                     │
│ $50,000 USDC added to your payroll account.         │
│                                                     │
│ New Balance: $104,200 USDC                          │
│ Runway: ~8.7 months                                 │
│                                                     │
│ Transaction: 0x5678...9012 [📋 Copy]                │
│ Block: #1,234,890                                   │
│                                                     │
│ [View Transaction on Explorer]                      │
│ [Close]                                             │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

## In-App Notifications

### Notification Bell (Header)

**Top-right header:**

```
┌────────────────────────────────────┐
│ zkSalaria    🔔 3    👤 0x1234...  │
│              (Badge)  (Wallet)     │
└────────────────────────────────────┘
```

**User clicks notification bell:**

---

### Notification Dropdown

```
┌────────────────────────────────────────────────────┐
│ Notifications (3 unread)           [Mark All Read] │
├────────────────────────────────────────────────────┤
│                                                    │
│ 💰 Payment Received                                │
│ You received $5,000 from Acme Corp                 │
│ 2 minutes ago                                      │
│ [View Payment]                                     │
│                                                    │
├────────────────────────────────────────────────────┤
│ ✅ Recurring Payment Executed                      │
│ Your biweekly salary of $5,000 was paid            │
│ 1 hour ago                                         │
│ [View Payment]                                     │
│                                                    │
├────────────────────────────────────────────────────┤
│ ⚠️ Low Balance Warning                             │
│ Payroll account has 2 months runway ($24,500)      │
│ 3 hours ago                                        │
│ [Fund Account]                                     │
│                                                    │
├────────────────────────────────────────────────────┤
│                                                    │
│ [View All Notifications]                           │
│                                                    │
└────────────────────────────────────────────────────┘
```

**Notification Types:**

| Icon | Type | Example |
|------|------|---------|
| 💰 | Payment | "Payment received: $5,000" |
| ✅ | Success | "Recurring payment executed" |
| ⚠️ | Warning | "Low balance warning" |
| ❌ | Error | "Payment failed: Insufficient balance" |
| 👤 | Employee | "New employee added: Bob Smith" |
| 🔐 | Security | "New device logged in from iPhone" |

---

### Toast Notifications (Bottom-Right)

**Auto-appear on events, auto-dismiss after 5 seconds:**

**Success Toast:**
```
┌─────────────────────────────────────┐
│ ✅ Payment Sent                     │
│ Paid Alice Johnson $5,000           │
│ [View] [Dismiss]                    │
└─────────────────────────────────────┘
```

**Error Toast:**
```
┌─────────────────────────────────────┐
│ ❌ Payment Failed                   │
│ Insufficient balance                │
│ [Fund Account] [Dismiss]            │
└─────────────────────────────────────┘
```

**Warning Toast:**
```
┌─────────────────────────────────────┐
│ ⚠️ Low Balance                      │
│ Only 2 months runway remaining      │
│ [Fund Now] [Dismiss]                │
└─────────────────────────────────────┘
```

---

## Mobile Responsive Design

### Settings (Mobile)

**Stacked navigation instead of sidebar:**

```
┌─────────────────────────────┐
│ Settings                    │
├─────────────────────────────┤
│                             │
│ Company                     │
│ > Profile                   │
│ > Wallet Management         │
│ > Team                      │
│                             │
│ Payroll                     │
│ > Employees                 │
│ > Recurring Payments        │
│                             │
│ Preferences                 │
│ > Notifications             │
│ > Privacy & Security        │
│                             │
│ Advanced                    │
│ > Backup & Recovery         │
│ > API Keys                  │
│                             │
└─────────────────────────────┘
```

**Tapping section opens full-screen view:**

```
┌─────────────────────────────┐
│ ← Company Profile           │
├─────────────────────────────┤
│                             │
│ Company Logo                │
│ [Upload]                    │
│                             │
│ Company Name *              │
│ [Acme Corp__________]       │
│                             │
│ Industry                    │
│ [Technology ▼]              │
│                             │
│ Admin Email *               │
│ [admin@acme.com_____]       │
│                             │
└─────────────────────────────┘

┌─────────────────────────────┐
│ [Save Changes]              │
│ (Sticky bottom bar)         │
└─────────────────────────────┘
```

---

## Implementation Notes

### Frontend (React)

```typescript
// components/Settings/SettingsSidebar.tsx

export function SettingsSidebar({ role }: { role: 'company' | 'employee' }) {
  const sections = role === 'company'
    ? COMPANY_SETTINGS_SECTIONS
    : EMPLOYEE_SETTINGS_SECTIONS;

  return (
    <nav className="settings-sidebar">
      {sections.map(section => (
        <SettingsSection key={section.id} {...section} />
      ))}
    </nav>
  );
}

// constants/settings.ts

const COMPANY_SETTINGS_SECTIONS = [
  {
    title: 'Company',
    items: [
      { label: 'Profile', path: '/settings/profile', icon: '🏢' },
      { label: 'Wallet', path: '/settings/wallet', icon: '🔐' },
      { label: 'Team', path: '/settings/team', icon: '👥', badge: 'Soon' }
    ]
  },
  {
    title: 'Payroll',
    items: [
      { label: 'Employees', path: '/settings/employees', icon: '👤' },
      { label: 'Recurring', path: '/settings/recurring', icon: '🔁' }
    ]
  },
  {
    title: 'Preferences',
    items: [
      { label: 'Notifications', path: '/settings/notifications', icon: '🔔' },
      { label: 'Privacy', path: '/settings/privacy', icon: '🔒' }
    ]
  }
];
```

---

### Notifications System

```typescript
// services/notifications.ts

import { toast } from 'react-hot-toast';

export class NotificationService {
  // Toast notifications (bottom-right)
  static success(message: string, action?: () => void) {
    toast.success(message, {
      duration: 5000,
      position: 'bottom-right',
      action: action ? { label: 'View', onClick: action } : undefined
    });
  }

  static error(message: string, action?: () => void) {
    toast.error(message, {
      duration: 7000,
      position: 'bottom-right'
    });
  }

  // Notification center (top-right bell)
  static async addNotification(notification: Notification) {
    // Add to IndexedDB
    await db.notifications.add(notification);

    // Update badge count
    const unreadCount = await db.notifications
      .where('read').equals(false)
      .count();

    // Update UI
    notificationStore.setUnreadCount(unreadCount);
  }

  // Email notifications (via backend)
  static async sendEmail(to: string, template: string, data: any) {
    await fetch('/api/notifications/email', {
      method: 'POST',
      body: JSON.stringify({ to, template, data })
    });
  }
}

// Usage in components
NotificationService.success('Payment sent to Alice Johnson', () => {
  router.push('/payments/123');
});
```

---

## Success Criteria

**Settings Page:**
- ✅ All settings accessible within 2 clicks
- ✅ Changes saved immediately (no "Save" button lag)
- ✅ Mobile responsive (stacked navigation)

**Funding Flow:**
- ✅ <2 minutes to fund account (from click to confirmation)
- ✅ Clear balance projection (runway in months)
- ✅ <1% transaction failure rate

**Notifications:**
- ✅ Real-time notifications (<5s delay)
- ✅ Email delivery within 1 minute
- ✅ Notification center loads <500ms

---

*This settings and notifications system provides complete account management and communication infrastructure for zkSalaria.*
