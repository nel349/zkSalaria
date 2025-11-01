# Payroll Pages - Wireframes & Specifications

**Version:** 1.0
**Date:** 2025-10-31
**Purpose:** Complete UI specifications for zkSalaria payroll operations

---

## Design System (Inherited from App)

**Colors:**
- Background: `#0A0E27` (Deep midnight blue)
- Cards: `#1A1F3A` (Lighter midnight)
- Primary Action: `#FF6B35` (Orange - pay/execute)
- Secondary Action: `#00D9FF` (Cyan - setup/configure)
- Success: `#10B981` (Green - completed)
- Warning: `#F59E0B` (Yellow - pending)
- Error: `#EF4444` (Red - failed)
- Text Primary: `#F9FAFB` (White)
- Text Secondary: `#A0AEC0` (Gray)
- Text Dimmed: `#6B7280` (Darker gray)

**Typography:**
- Headings: Inter, 700 weight
- Body: Inter, 400 weight
- Monospace: SF Mono (for amounts, addresses)

**Spacing:**
- Page padding: 32px
- Card padding: 24px
- Input spacing: 16px
- Button padding: 12px 24px

**Borders:**
- Card radius: 12px
- Button radius: 8px
- Input radius: 8px
- Border color: `#2D3748` (subtle)

---

## Page 1: Add Employee

### Layout

**Breadcrumb:**
`Company Dashboard > Add Employee`

**Page Title:**
```
Add Employee
Add a new employee to your payroll roster
```

### Form (Centered Card, 600px wide)

```
┌────────────────────────────────────────────────────┐
│ Employee Information                               │
├────────────────────────────────────────────────────┤
│                                                    │
│ Employee Name *                                    │
│ [____________________________________]             │
│ Full legal name                                    │
│                                                    │
│ Wallet Address *                                   │
│ [____________________________________] [📋 Paste]  │
│ Midnight Network wallet address                    │
│                                                    │
│ Email Address                                      │
│ [____________________________________]             │
│ For payment notifications (optional)               │
│                                                    │
│ Role / Job Title *                                 │
│ [Dropdown: Engineer ▼                ]             │
│ Options: Engineer, Designer, Product, Marketing,   │
│          Sales, Operations, Executive, Other       │
│                                                    │
│ Base Salary *                                      │
│ [$_________] per [Dropdown: Month ▼  ]             │
│ This will be used for recurring payments           │
│                                                    │
│ Start Date                                         │
│ [Nov 15, 2025 📅]                                  │
│                                                    │
│ ─────────────────────────────────────────────────  │
│                                                    │
│ Privacy Notice:                                    │
│ 🔒 Salary will be encrypted on-chain. Only you and │
│    the employee can decrypt it.                    │
│                                                    │
│ [Cancel]                    [Add Employee →]       │
│                              (Orange button)       │
└────────────────────────────────────────────────────┘
```

### Field Specifications

| Field | Type | Validation | Encrypted |
|-------|------|------------|-----------|
| **Employee Name** | Text | Required, 2-100 chars | No |
| **Wallet Address** | Text | Required, valid Midnight address | No |
| **Email** | Email | Optional, valid email format | No |
| **Role** | Dropdown | Required, from predefined list | No |
| **Base Salary** | Number | Required, >0, max 1,000,000 | **Yes (encrypted on-chain)** |
| **Salary Period** | Dropdown | Required (Week, Biweekly, Month, Year) | No |
| **Start Date** | Date | Required, future or today | No |

### Form Behavior

**Validation:**
- Real-time validation on blur
- Show error states in red below field
- Disable "Add Employee" button until all required fields valid

**Error States:**
```
Employee Name *
[____________________________________]
⚠️ Name is required

Wallet Address *
[0x123___________________________]
⚠️ Invalid Midnight wallet address (must start with 0x and be 42 chars)

Base Salary *
[$-5000____] per [Month ▼]
⚠️ Salary must be positive
```

**Success Flow:**
1. User fills form
2. Clicks "Add Employee"
3. MetaMask popup: "Sign transaction to add employee"
4. Transaction submitted
5. Loading state: Button shows spinner "Adding employee..."
6. Success: Toast notification "✅ Alice Johnson added to payroll"
7. Redirect to "Setup Recurring Payment" page with Alice pre-selected

### Responsive (Mobile)

- Form width: 100% (no max-width)
- Stacked layout
- Larger touch targets (48px min height)

---

## Page 2: Pay Employee (One-Time)

### Layout

**Breadcrumb:**
`Company Dashboard > Pay Employee`

**Page Title:**
```
Pay Employee
Make a one-time salary payment
```

### Form (Centered Card, 600px wide)

```
┌────────────────────────────────────────────────────┐
│ Payment Details                                    │
├────────────────────────────────────────────────────┤
│                                                    │
│ Select Employee *                                  │
│ [Dropdown: Alice Johnson (Engineer, $5,000/mo) ▼] │
│                                                    │
│ ─────────────────────────────────────────────────  │
│                                                    │
│ Payment Amount *                                   │
│ ● Use Base Salary: $5,000                          │
│ ○ Custom Amount: [$_________]                      │
│                                                    │
│ Payment Type                                       │
│ [Dropdown: Regular Salary ▼                    ]   │
│ Options: Regular Salary, Bonus, Commission,        │
│          Reimbursement, Advance, Adjustment        │
│                                                    │
│ Memo (Optional)                                    │
│ [___________________________________________]      │
│ Internal note (not visible to employee)            │
│                                                    │
│ ─────────────────────────────────────────────────  │
│                                                    │
│ Summary                                            │
│ Employee:    Alice Johnson                         │
│ Amount:      $5,000                                │
│ Type:        Regular Salary                        │
│ Gas Fee:     ~$0.01                                │
│ Total Cost:  $5,000.01                             │
│                                                    │
│ Privacy: Amount will be encrypted on-chain 🔒      │
│                                                    │
│ [Cancel]                         [Pay Now →]       │
│                                   (Orange)         │
└────────────────────────────────────────────────────┘
```

### Employee Dropdown Options

```
┌────────────────────────────────────────────────────┐
│ 🔍 Search employees...                             │
├────────────────────────────────────────────────────┤
│ Alice Johnson                                      │
│ Engineer • $5,000/month                            │
│ Last paid: 14 days ago                             │
│                                                    │
│ Bob Smith                                          │
│ Designer • $6,500/month                            │
│ Last paid: 15 days ago                             │
│                                                    │
│ Carol Lee                                          │
│ Product Manager • $4,200/month                     │
│ Last paid: 2 days ago ⚠️                           │
│                                                    │
│ ... (9 more employees)                             │
└────────────────────────────────────────────────────┘
```

**Features:**
- Search by name
- Show role + base salary
- Show last paid date
- Warning (⚠️) if paid within last 7 days (potential duplicate)

### Amount Selection Behavior

**Radio Toggle:**
```
● Use Base Salary: $5,000
  └─ Auto-fills from employee record
  └─ Fast UX for standard payments

○ Custom Amount: [$_________]
  └─ Override for bonuses, adjustments
  └─ Validation: >0, max 1,000,000
```

**When Custom Selected:**
- Radio switches
- Input field becomes active
- Previous amount pre-filled (if any)

### Success Flow

1. Select employee from dropdown
2. Choose amount (base or custom)
3. Add payment type and memo (optional)
4. Click "Pay Now"
5. MetaMask popup: "Sign transaction to pay Alice Johnson $5,000"
6. Transaction submitted
7. Loading state: Button spinner "Processing payment..."
8. Success: Toast "✅ Paid Alice Johnson $5,000"
9. Modal appears:

```
┌────────────────────────────────────────────────────┐
│                   Payment Successful               │
├────────────────────────────────────────────────────┤
│                                                    │
│               ✅ $5,000 paid to                     │
│                Alice Johnson                       │
│                                                    │
│ Transaction: 0x1234...5678 [📋 Copy]               │
│ Gas Fee: $0.01                                     │
│ Timestamp: Nov 15, 2025 12:34 PM                   │
│                                                    │
│ Employee has been notified via email.              │
│                                                    │
│ [View Payment History]  [Pay Another Employee]     │
│                                                    │
└────────────────────────────────────────────────────┘
```

---

## Page 3: Setup Recurring Payment

### Layout

**Breadcrumb:**
`Company Dashboard > Setup Recurring Payment`

**Page Title:**
```
Setup Recurring Payment
Automate biweekly or monthly salary payments
```

### Form (Centered Card, 600px wide)

```
┌────────────────────────────────────────────────────┐
│ Recurring Payment Configuration                    │
├────────────────────────────────────────────────────┤
│                                                    │
│ Select Employee *                                  │
│ [Dropdown: Alice Johnson (Engineer, $5,000/mo) ▼] │
│                                                    │
│ ─────────────────────────────────────────────────  │
│                                                    │
│ Payment Amount *                                   │
│ [$5,000____] per payment                           │
│ This amount will be paid each cycle                │
│                                                    │
│ Payment Frequency *                                │
│ [Dropdown: Biweekly (every 2 weeks) ▼          ]   │
│ Options:                                           │
│ • Weekly (every 7 days)                            │
│ • Biweekly (every 14 days) ← Most common           │
│ • Semi-monthly (1st and 15th)                      │
│ • Monthly (every 30 days)                          │
│                                                    │
│ ─────────────────────────────────────────────────  │
│                                                    │
│ Schedule                                           │
│                                                    │
│ Start Date *                                       │
│ [Nov 15, 2025 📅]                                  │
│ First payment will be on this date                 │
│                                                    │
│ End Date                                           │
│ ● No end date (until cancelled)                    │
│ ○ Specific date: [__________ 📅]                   │
│                                                    │
│ ─────────────────────────────────────────────────  │
│                                                    │
│ Preview Next Payments                              │
│ [Preview Schedule]                                 │
│                                                    │
│ ─────────────────────────────────────────────────  │
│                                                    │
│ Summary                                            │
│ Employee:    Alice Johnson                         │
│ Amount:      $5,000 biweekly                       │
│ Start:       Nov 15, 2025                          │
│ End:         No end date                           │
│ Setup Fee:   ~$0.02 (one-time)                     │
│                                                    │
│ ⚡ Automated: Payments execute automatically        │
│               No manual approval needed            │
│                                                    │
│ [Cancel]              [Setup Recurring Payment →]  │
│                              (Cyan button)         │
└────────────────────────────────────────────────────┘
```

### Preview Schedule Modal

**Triggered by:** Click "Preview Schedule" button

```
┌────────────────────────────────────────────────────┐
│         Payment Schedule Preview                   │
│                                                    │
│ Next 10 Payments for Alice Johnson                 │
├────────────────────────────────────────────────────┤
│                                                    │
│ 1.  Nov 15, 2025 (Friday)      $5,000              │
│ 2.  Nov 29, 2025 (Friday)      $5,000              │
│ 3.  Dec 13, 2025 (Friday)      $5,000              │
│ 4.  Dec 27, 2025 (Friday)      $5,000              │
│ 5.  Jan 10, 2026 (Friday)      $5,000              │
│ 6.  Jan 24, 2026 (Friday)      $5,000              │
│ 7.  Feb  7, 2026 (Friday)      $5,000              │
│ 8.  Feb 21, 2026 (Friday)      $5,000              │
│ 9.  Mar  7, 2026 (Friday)      $5,000              │
│ 10. Mar 21, 2026 (Friday)      $5,000              │
│                                                    │
│ ─────────────────────────────────────────────────  │
│                                                    │
│ Total (next 10 payments): $50,000                  │
│ Ensure your account has sufficient balance.        │
│                                                    │
│ [Close]                     [Looks Good, Setup →]  │
│                                                    │
└────────────────────────────────────────────────────┘
```

**Calendar View (Optional Enhancement):**
- Show payments on calendar grid
- Visualize payment frequency
- Highlight weekends vs weekdays

### Success Flow

1. Fill form (employee, amount, frequency, dates)
2. Click "Preview Schedule" → Review modal
3. Click "Setup Recurring Payment"
4. MetaMask popup: "Sign transaction to setup recurring payment"
5. Transaction submitted
6. Loading: "Setting up recurring payment..."
7. Success: Toast "✅ Recurring payment setup for Alice Johnson"
8. Redirect to "Recurring Payments" page (see below)

---

## Page 4: Run Payroll (Batch Payment)

### Layout

**Breadcrumb:**
`Company Dashboard > Run Payroll`

**Page Title:**
```
Run Payroll
Pay all employees at once (batch payment)
```

### Employee List (Full-Width Table)

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ Run Payroll - Select Employees                                              │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│ Pay Period: [Dropdown: Nov 1-15, 2025 ▼]                                    │
│                                                                              │
│ ☑ Select All (12 employees)        🔍 [Search employees...              ]   │
│                                                                              │
├────┬────────────────────┬──────────────┬──────────────┬─────────────────────┤
│ ☑  │ Employee           │ Role         │ Base Salary  │ Amount This Period  │
├────┼────────────────────┼──────────────┼──────────────┼─────────────────────┤
│ ☑  │ Alice Johnson      │ Engineer     │ $5,000/mo    │ [$5,000______]      │
│    │ alice@example.com  │              │              │ ○ Salary ● Custom   │
│    │ Last paid: 14 days ago            │              │                     │
├────┼────────────────────┼──────────────┼──────────────┼─────────────────────┤
│ ☑  │ Bob Smith          │ Designer     │ $6,500/mo    │ [$6,500______]      │
│    │ bob@example.com    │              │              │ ● Salary ○ Custom   │
│    │ Last paid: 15 days ago            │              │                     │
├────┼────────────────────┼──────────────┼──────────────┼─────────────────────┤
│ ☐  │ Carol Lee          │ Product      │ $4,200/mo    │ [$4,500______]      │
│    │ carol@example.com  │              │              │ ○ Salary ● Custom   │
│    │ Last paid: 2 days ago ⚠️           │              │ (Bonus: +$300)      │
├────┼────────────────────┼──────────────┼──────────────┼─────────────────────┤
│ ☑  │ David Chen         │ Marketing    │ $5,800/mo    │ [$5,800______]      │
│    │ david@example.com  │              │              │ ● Salary ○ Custom   │
│    │ Last paid: 14 days ago            │              │                     │
├────┼────────────────────┼──────────────┼──────────────┼─────────────────────┤
│    │ ... (8 more employees)                                                 │
└────┴────────────────────┴──────────────┴──────────────┴─────────────────────┘

Warnings:
⚠️ Carol Lee was paid 2 days ago. Are you sure you want to pay again?

┌────────────────────────────────────────────────────┐
│ Payment Summary                                    │
├────────────────────────────────────────────────────┤
│                                                    │
│ Employees Selected:     11 / 12                    │
│ Total Salaries:         $54,500                    │
│ Estimated Gas:          ~$0.12                     │
│ Total Cost:             $54,500.12                 │
│                                                    │
│ Excluded:                                          │
│ • Carol Lee (unchecked)                            │
│                                                    │
│ [Cancel]                    [Pay All Employees →]  │
│                              (Orange, large)       │
└────────────────────────────────────────────────────┘
```

### Table Features

**Per-Employee Controls:**
- ☑ Checkbox: Include in batch (default: all checked)
- Amount: Radio toggle (Salary vs Custom)
  - Salary: Use base salary (fast)
  - Custom: Override amount (for bonuses, adjustments)
- Last paid warning (⚠️ if <7 days)

**Bulk Actions:**
- "Select All" checkbox (header)
- Search/filter by name, role, email
- Pay period dropdown (for record-keeping)

**Amount Customization:**
```
Amount This Period
[$4,500______]
○ Salary ($4,200)
● Custom

Reason for Override:
[Dropdown: Bonus ▼]
Options: Bonus, Commission, Adjustment, Raise, Other
```

### Confirmation Modal

**Triggered by:** Click "Pay All Employees"

```
┌────────────────────────────────────────────────────┐
│         Confirm Batch Payroll                      │
├────────────────────────────────────────────────────┤
│                                                    │
│ You are about to pay 11 employees:                 │
│                                                    │
│ Alice Johnson     $5,000                           │
│ Bob Smith         $6,500                           │
│ David Chen        $5,800                           │
│ ... (8 more employees)                             │
│                                                    │
│ Total: $54,500                                     │
│ Gas:   ~$0.12                                      │
│                                                    │
│ ⚠️  This action cannot be undone.                  │
│     Ensure all amounts are correct.                │
│                                                    │
│ [Cancel]                         [Confirm & Pay →] │
│                                                    │
└────────────────────────────────────────────────────┘
```

### Success Flow

1. Select employees (default: all selected)
2. Customize amounts if needed (bonuses, adjustments)
3. Review summary (11 employees, $54,500)
4. Click "Pay All Employees"
5. Confirmation modal appears
6. Click "Confirm & Pay"
7. MetaMask popup: "Sign transaction to pay 11 employees"
8. Transaction submitted
9. Progress modal:

```
┌────────────────────────────────────────────────────┐
│         Processing Payroll...                      │
├────────────────────────────────────────────────────┤
│                                                    │
│ ████████████████░░░░░░░░░░  60%                    │
│                                                    │
│ Paying 11 employees...                             │
│ Transaction: 0x1234...5678                         │
│                                                    │
│ Please wait, this may take 30-60 seconds.          │
│                                                    │
└────────────────────────────────────────────────────┘
```

10. Success modal:

```
┌────────────────────────────────────────────────────┐
│         Payroll Completed ✅                        │
├────────────────────────────────────────────────────┤
│                                                    │
│ 11 employees paid successfully                     │
│                                                    │
│ Total Paid:    $54,500                             │
│ Gas Fee:       $0.11                               │
│ Transaction:   0x1234...5678 [📋 Copy]             │
│ Timestamp:     Nov 15, 2025 2:45 PM                │
│                                                    │
│ All employees have been notified via email.        │
│                                                    │
│ [Download Payroll Report (PDF)]                    │
│ [View Payment History]                             │
│ [Run Another Payroll]                              │
│                                                    │
└────────────────────────────────────────────────────┘
```

### Payroll Report (PDF)

**Auto-generated and downloadable:**

```
┌────────────────────────────────────────────────────┐
│                                                    │
│             ACME CORP - PAYROLL REPORT             │
│             Pay Period: Nov 1-15, 2025             │
│                                                    │
├────────────────────────────────────────────────────┤
│                                                    │
│ Employee         Role        Amount    Status      │
│ ───────────────────────────────────────────────    │
│ Alice Johnson    Engineer    $5,000   ✓ Paid      │
│ Bob Smith        Designer    $6,500   ✓ Paid      │
│ David Chen       Marketing   $5,800   ✓ Paid      │
│ Emily Davis      Sales        $6,200   ✓ Paid      │
│ ... (7 more)                                       │
│                                                    │
│ ───────────────────────────────────────────────    │
│ Total Paid:                  $54,500               │
│ Gas Fee:                     $0.11                 │
│ Transaction Hash:            0x1234...5678         │
│ Block Number:                #1,234,567            │
│ Timestamp:                   Nov 15, 2025 2:45 PM  │
│                                                    │
│ Privacy Notice:                                    │
│ All salary amounts are encrypted on the Midnight   │
│ Network blockchain. This report is for internal    │
│ accounting purposes only.                          │
│                                                    │
└────────────────────────────────────────────────────┘
```

---

## Page 5: Recurring Payments Management

### Layout

**Breadcrumb:**
`Company Dashboard > Recurring Payments`

**Page Title:**
```
Recurring Payments
Manage automated salary schedules
```

### Page Header

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ Recurring Payments (8 active)                                                │
│                                                                              │
│ [+ Setup New Recurring Payment]  (Cyan button)                               │
│                                                                              │
│ Filters: [All ▼] [Active ▼] [Search...                                   ]  │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Recurring Payment Cards (Grid Layout)

```
┌──────────────────────────────┐  ┌──────────────────────────────┐
│ Alice Johnson                │  │ Bob Smith                    │
│ Engineer                     │  │ Designer                     │
│                              │  │                              │
│ 💰 $5,000 biweekly            │  │ 💰 $6,500 monthly             │
│ 🗓️ Next: Nov 29 (in 14 days)  │  │ 🗓️ Next: Dec 1 (in 16 days)   │
│ 📅 Started: Jan 1, 2025       │  │ 📅 Started: Mar 15, 2025      │
│ 📊 28 payments made           │  │ 📊 8 payments made            │
│                              │  │                              │
│ ✅ Active                     │  │ ✅ Active                     │
│                              │  │                              │
│ [Edit] [Pause] [Cancel]      │  │ [Edit] [Pause] [Cancel]      │
└──────────────────────────────┘  └──────────────────────────────┘

┌──────────────────────────────┐  ┌──────────────────────────────┐
│ Carol Lee                    │  │ David Chen                   │
│ Product Manager              │  │ Marketing Lead               │
│                              │  │                              │
│ 💰 $4,200 biweekly            │  │ 💰 $5,800 biweekly            │
│ 🗓️ Next: Nov 22 (in 7 days)   │  │ 🗓️ Next: Nov 29 (in 14 days)  │
│ 📅 Started: Feb 1, 2025       │  │ 📅 Started: Jan 15, 2025      │
│ 📊 20 payments made           │  │ 📊 24 payments made           │
│                              │  │                              │
│ ⏸️ Paused (since Nov 1)       │  │ ✅ Active                     │
│                              │  │                              │
│ [Resume] [Edit] [Cancel]     │  │ [Edit] [Pause] [Cancel]      │
└──────────────────────────────┘  └──────────────────────────────┘

... (4 more cards)
```

### Card States

**Active:**
- Green checkmark: ✅ Active
- Actions: Edit, Pause, Cancel

**Paused:**
- Orange pause icon: ⏸️ Paused (since Nov 1)
- Actions: Resume, Edit, Cancel

**Cancelled:**
- Red X: ❌ Cancelled (on Nov 10)
- Actions: View Details (no edit)

**Ending Soon:**
- Warning badge: ⚠️ Ends Dec 31, 2025 (in 45 days)
- Actions: Extend, Edit, Cancel

### Action Modals

#### Pause Recurring Payment

```
┌────────────────────────────────────────────────────┐
│         Pause Recurring Payment?                   │
├────────────────────────────────────────────────────┤
│                                                    │
│ Employee: Alice Johnson                            │
│ Amount:   $5,000 biweekly                          │
│                                                    │
│ This will pause all future payments.               │
│ You can resume at any time.                        │
│                                                    │
│ Reason for Pausing (Optional):                     │
│ [Dropdown: Leave of Absence ▼              ]       │
│ Options: Leave of Absence, Contract Change,        │
│          Budget Constraints, Employee Request      │
│                                                    │
│ [Cancel]                              [Pause →]    │
│                                                    │
└────────────────────────────────────────────────────┘
```

#### Cancel Recurring Payment

```
┌────────────────────────────────────────────────────┐
│         Cancel Recurring Payment?                  │
├────────────────────────────────────────────────────┤
│                                                    │
│ ⚠️  This action cannot be undone.                  │
│                                                    │
│ Employee: Alice Johnson                            │
│ Amount:   $5,000 biweekly                          │
│ Payments Made: 28 ($140,000 total)                │
│                                                    │
│ Future scheduled payments will be cancelled.       │
│ Employee will need to be added to a new schedule.  │
│                                                    │
│ Reason for Cancellation (Required):                │
│ [Dropdown: Employee Left Company ▼         ]       │
│ Options: Employee Left, Salary Change,             │
│          Contract Ended, Budget Cut                │
│                                                    │
│ [Cancel]                          [Confirm Cancel] │
│                                    (Red button)    │
└────────────────────────────────────────────────────┘
```

#### Edit Recurring Payment

```
┌────────────────────────────────────────────────────┐
│         Edit Recurring Payment                     │
├────────────────────────────────────────────────────┤
│                                                    │
│ Employee: Alice Johnson (Engineer)                 │
│                                                    │
│ Current Amount: $5,000 biweekly                    │
│ New Amount:     [$5,500____] biweekly              │
│                                                    │
│ Current Frequency: Biweekly                        │
│ New Frequency:     [Dropdown: Biweekly ▼]          │
│                                                    │
│ Apply Changes:                                     │
│ ● Starting next payment (Nov 29, 2025)             │
│ ○ Starting specific date: [______ 📅]              │
│                                                    │
│ ⚡ Changes will create a new schedule and           │
│    cancel the old one.                             │
│                                                    │
│ [Cancel]                         [Save Changes →]  │
│                                                    │
└────────────────────────────────────────────────────┘
```

### Empty State (No Recurring Payments)

```
┌────────────────────────────────────────────────────┐
│                                                    │
│              🗓️  No Recurring Payments              │
│                                                    │
│     Automate your payroll with recurring payments. │
│     Set it up once, and employees get paid on      │
│     schedule automatically.                        │
│                                                    │
│     [Setup First Recurring Payment →]              │
│                                                    │
└────────────────────────────────────────────────────┘
```

---

## Page 6: Payment History (Company View)

**Note:** This is an enhancement to the existing PAYROLL_LIST_VIEW_WIREFRAME.md

### Additional Filters for Company

```
Filters:
┌────────────────────────────────────────────────────┐
│ [📋 All Payments] [📤 Sent] [🔁 Recurring] [🔍]    │
├────────────────────────────────────────────────────┤
│                                                    │
│ Date Range: [Last 30 days ▼]                      │
│ Employee:   [All employees ▼]                     │
│ Type:       [All types ▼]                         │
│                                                    │
│ Advanced Filters ▼                                │
│ ☐ Show only recurring payments                   │
│ ☐ Show only bonuses                              │
│ ☐ Show amounts >$10,000                           │
│                                                    │
└────────────────────────────────────────────────────┘
```

### Export Options

```
[Export Payroll Report ▼]
├── CSV (for QuickBooks/Xero)
├── PDF (printable report)
├── Excel (detailed breakdown)
└── JSON (API integration)
```

---

## Responsive Design (Mobile)

### Breakpoints

- **Desktop:** >1024px (3-column card grid)
- **Tablet:** 768-1024px (2-column card grid)
- **Mobile:** <768px (1-column stack, simplified forms)

### Mobile Optimizations

**Forms:**
- Full-width inputs (no 600px max-width)
- Larger touch targets (48px min height)
- Bottom sheet modals (instead of centered)
- Sticky "Pay" button at bottom

**Tables:**
- Switch to card layout (no tables)
- Swipe to reveal actions
- Collapsible sections

**Example: Run Payroll on Mobile**

```
┌─────────────────────────────┐
│ Run Payroll                 │
├─────────────────────────────┤
│                             │
│ ☑ Alice Johnson             │
│ Engineer • $5,000           │
│ [Edit Amount ▼]             │
│                             │
├─────────────────────────────┤
│ ☑ Bob Smith                 │
│ Designer • $6,500           │
│ [Edit Amount ▼]             │
│                             │
├─────────────────────────────┤
│ ☐ Carol Lee                 │
│ Product • $4,200            │
│ ⚠️ Paid 2 days ago           │
│                             │
└─────────────────────────────┘

┌─────────────────────────────┐
│ 11 selected • $54,500       │
│ [Pay All Employees →]       │
└─────────────────────────────┘
(Sticky bottom bar)
```

---

## Accessibility (WCAG 2.1 AA)

### Keyboard Navigation

- All forms navigable with Tab/Shift+Tab
- Enter key submits forms
- Escape key closes modals
- Arrow keys navigate dropdowns

### Screen Readers

- Semantic HTML (`<form>`, `<label>`, `<button>`)
- ARIA labels for icons ("Edit recurring payment")
- Live regions for toast notifications
- Focus management (trap in modals)

### Color Contrast

- Text on background: 7:1 ratio (AAA)
- Button text: 4.5:1 ratio (AA)
- Error states: Red + icon (not color alone)

### Focus Indicators

- Visible focus ring: 2px solid cyan
- Skip to content link (for keyboard users)

---

## Animation & Transitions

### Loading States

**Button Spinner:**
```css
.button-loading {
  opacity: 0.6;
  pointer-events: none;
}
.button-loading::after {
  content: '';
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid #fff;
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}
```

**Progress Bar:**
```css
.progress-bar {
  background: linear-gradient(90deg, #00D9FF, #7B61FF);
  animation: progress 2s ease-in-out;
}
```

### Toast Notifications

```css
.toast {
  position: fixed;
  top: 24px;
  right: 24px;
  padding: 16px 24px;
  background: #10B981; /* Green for success */
  color: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.3);
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from { transform: translateX(400px); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}
```

**Auto-dismiss:** 5 seconds

---

## Error Handling

### Insufficient Balance

```
┌────────────────────────────────────────────────────┐
│         ⚠️ Insufficient Balance                     │
├────────────────────────────────────────────────────┤
│                                                    │
│ Cannot pay Alice Johnson $5,000.                   │
│                                                    │
│ Your Balance:  $2,300                              │
│ Required:      $5,000                              │
│ Shortfall:     $2,700                              │
│                                                    │
│ Please fund your payroll account to continue.      │
│                                                    │
│ [Fund Account →]                         [Cancel]  │
│                                                    │
└────────────────────────────────────────────────────┘
```

### Transaction Failed

```
┌────────────────────────────────────────────────────┐
│         ❌ Payment Failed                           │
├────────────────────────────────────────────────────┤
│                                                    │
│ Failed to pay Alice Johnson $5,000.                │
│                                                    │
│ Error: Transaction reverted (gas estimation failed)│
│                                                    │
│ Common causes:                                     │
│ • Insufficient balance in wallet                  │
│ • Network congestion                              │
│ • Invalid wallet address                          │
│                                                    │
│ [Retry Payment]  [Contact Support]  [Cancel]      │
│                                                    │
└────────────────────────────────────────────────────┘
```

### Recurring Payment Missed

**Email Alert to Company:**
```
Subject: ⚠️ Recurring Payment Failed - Alice Johnson

Hi Acme Corp,

We attempted to pay Alice Johnson $5,000 (scheduled for Nov 29),
but your payroll account has insufficient balance.

Current Balance: $3,200
Required: $5,000

Action Required:
1. Fund your payroll account
2. We will automatically retry the payment

If not resolved within 24 hours, the recurring payment will be
paused and Alice will be notified.

[Fund Account Now] [Contact Support]
```

---

## Success Criteria

### UX Metrics

- ✅ **Setup Time:** <3 minutes to setup first recurring payment
- ✅ **Batch Payroll:** <1 minute to pay 10+ employees
- ✅ **Error Rate:** <5% form validation errors
- ✅ **Mobile Usability:** 100% feature parity with desktop

### Accessibility

- ✅ **WCAG 2.1 AA** compliance
- ✅ **Keyboard Navigation:** All actions accessible
- ✅ **Screen Reader:** All content readable
- ✅ **Color Contrast:** 4.5:1 minimum

### Performance

- ✅ **Page Load:** <2 seconds (3G)
- ✅ **Form Validation:** Real-time (<100ms)
- ✅ **Transaction Confirmation:** <30 seconds
- ✅ **Batch Payment:** <60 seconds (10 employees)

---

## Next Steps

1. **Review & Approve** wireframes with stakeholders
2. **Create Figma Mockups** (high-fidelity designs)
3. **Build React Components** (following wireframe specs)
4. **Integrate with PayrollAPI** (TypeScript SDK)
5. **E2E Testing** (Cypress)
6. **Beta Testing** with 3 pilot companies

---

*These wireframes provide complete specifications for implementing zkSalaria's payroll UI. All pages support the ambitious MVP scope: recurring payments, batch processing, and trustless automation.*
