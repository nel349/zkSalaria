# Payment Detail Page - Wireframe & Specifications

**Version:** 1.0
**Date:** 2025-10-31
**Purpose:** Complete payment detail view with actions (adapted from Sablier vesting details)
**Reference:** Sablier vesting stream detail page

---

## Overview

**What is this page?**
- Detailed view of a single payment (when user clicks a payment in the list)
- Shows payment metadata, transaction details, and available actions
- Different views for **Company** vs **Employee**

**Key Differences from Sablier:**
- **Sablier:** Vesting stream with time-based unlock (deposit upfront, withdraw over time)
- **zkSalaria:** Payroll with immediate payment (pay-as-you-go, withdraw to personal wallet)

---

## Layout

### Full Page View (Desktop)

```
┌────────────────────────────────────────────────────────────────────────────────┐
│ Breadcrumb: Payroll > Payment History > Payment #1234                         │
│                                                                                │
│ ← Back to Payments                                                             │
└────────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────┬─────────────────────────────────────────────┐
│                                  │ Attributes         🔗 Share Link            │
│                                  ├─────────────────────────────────────────────┤
│                                  │                                             │
│      PAYMENT CARD                │ 🏢 Acme Corp    →    👤 Alice Johnson       │
│    (Visual Center)               │ (Sender)              (Recipient)           │
│                                  │                                             │
│                                  │ 📊 Payment Type      ⚡ Status              │
│                                  │    Regular Salary       ✅ Completed         │
│                                  │                                             │
│                                  │ 💰 Amount             📅 Date               │
│                                  │    ••••••  🔓          Nov 15, 2025         │
│                                  │                                             │
│                                  │ 🔗 Chain             🆔 Payment ID          │
│                                  │    Midnight           #PAY-1234             │
│                                  │                                             │
│                                  │ ─────────────────────────────────────────── │
│                                  │                                             │
│                                  │ 📊 Balance Status                           │
│                                  │                                             │
│                                  │ Paid amount                                 │
│                                  │ ████████████████████ 100%                   │
│                                  │ ••••••  🔓  (Click to decrypt)              │
│                                  │                                             │
│                                  │ Withdrawn amount                            │
│                                  │ ████████░░░░░░░░░░░░ 60%                    │
│                                  │ ••••••  🔓  (Click to decrypt)              │
│                                  │                                             │
│                                  │ ─────────────────────────────────────────── │
│                                  │                                             │
│                                  │ 📋 Transaction Details                      │
│                                  │ Completed on Nov 15, 2025 @ 2:45 PM         │
│                                  │ Transaction: 0x1234...5678 [📋 Copy]        │
│                                  │ Block: #1,234,567                           │
│                                  │                                             │
│  [Withdraw] [Details]            │ ─────────────────────────────────────────── │
│   (If Employee)                  │                                             │
│                                  │ Actions                                     │
│  [Download Receipt] [Details]    │                                             │
│   (If Company)                   │ [Details ···]    [History 📋]               │
│                                  │                                             │
│                                  │ [Generate Proof]  [Download Receipt]        │
│                                  │ (If Employee)     (Both)                    │
│                                  │                                             │
│                                  │ [Withdraw 💰]     [More Options ···]        │
│                                  │ (If Employee)                               │
└──────────────────────────────────┴─────────────────────────────────────────────┘
```

---

## Left Panel: Payment Card (Visual Center)

### Employee View (Has Balance to Withdraw)

```
┌──────────────────────────────────┐
│                                  │
│         💰 Payment               │
│                                  │
│    ┌────────────────────┐        │
│    │                    │        │
│    │                    │        │
│    │      ••••••        │        │
│    │    💵 Click 🔓      │        │
│    │    to decrypt      │        │
│    │                    │        │
│    │  Regular Salary    │        │
│    │  Nov 15, 2025      │        │
│    │                    │        │
│    └────────────────────┘        │
│                                  │
│   Balance Remaining: ••••••      │
│   Withdrawn: ••••••  (60%)       │
│                                  │
│   [💰 Withdraw]  [📋 Details]    │
│    (Orange)      (Gray)          │
│                                  │
└──────────────────────────────────┘
```

**Interaction:**
- Click 🔓 icon → Decrypt locally → Show amount
- "Withdraw" button only visible if balance remaining > 0

---

### Company View (Cannot Withdraw)

```
┌──────────────────────────────────┐
│                                  │
│         💰 Payment Sent          │
│                                  │
│    ┌────────────────────┐        │
│    │                    │        │
│    │                    │        │
│    │    Alice Johnson   │        │
│    │      $5,000        │        │
│    │                    │        │
│    │  Regular Salary    │        │
│    │  Nov 15, 2025      │        │
│    │                    │        │
│    └────────────────────┘        │
│                                  │
│   Status: ✅ Completed            │
│   Employee has withdrawn 60%     │
│                                  │
│   [📄 Download Receipt] [Details]│
│    (Cyan)               (Gray)   │
│                                  │
└──────────────────────────────────┘
```

**Key Differences:**
- Company sees plaintext amount (they know what they paid)
- Company sees aggregate "Employee has withdrawn 60%" (not exact amount due to privacy)
- No "Withdraw" button (company cannot withdraw employee's salary)

---

## Right Panel: Attributes & Details

### Attributes Section

```
┌─────────────────────────────────────────────┐
│ Attributes              🔗 Share Link       │
├─────────────────────────────────────────────┤
│                                             │
│ 🏢 Acme Corp     →      👤 Alice Johnson    │
│ acme.mn              alice.mn               │
│ (Sender)              (Recipient)           │
│                                             │
│ 📊 Payment Type         ⚡ Status            │
│    Regular Salary          ✅ Completed      │
│                                             │
│ 💰 Gross Amount          📅 Payment Date    │
│    ••••••  🔓             Nov 15, 2025      │
│                          2:45 PM            │
│                                             │
│ 🔗 Chain                🆔 Payment ID       │
│    Midnight Network      #PAY-1234          │
│                                             │
│ 🔐 Privacy               🎯 Recurring       │
│    Encrypted on-chain    Yes (Biweekly)    │
│                                             │
└─────────────────────────────────────────────┘
```

**Field Explanations:**

| Field | Description | Privacy |
|-------|-------------|---------|
| **Sender** | Company wallet address | Public |
| **Recipient** | Employee wallet address | Public |
| **Payment Type** | Regular Salary, Bonus, Commission, etc. | Public metadata |
| **Status** | Completed, Pending, Failed | Public |
| **Gross Amount** | Payment amount before withdrawals | **Encrypted** (🔓 to decrypt) |
| **Payment Date** | When payment was executed | Public timestamp |
| **Chain** | Midnight Network | Public |
| **Payment ID** | Unique identifier (#PAY-1234) | Public |
| **Privacy** | Encryption status | Public metadata |
| **Recurring** | If part of recurring schedule | Public |

---

### Balance Status Section (Employee View Only)

```
┌─────────────────────────────────────────────┐
│ 📊 Balance Status                           │
├─────────────────────────────────────────────┤
│                                             │
│ 💵 Paid amount                              │
│ ████████████████████ 100%                   │
│ ••••••  🔓  (Click to decrypt)              │
│                                             │
│ 💸 Withdrawn amount                         │
│ ████████░░░░░░░░░░░░ 60%                    │
│ ••••••  🔓  (Click to decrypt)              │
│                                             │
│ 💰 Available to withdraw                    │
│ ████░░░░░░░░░░░░░░░░ 40%                    │
│ ••••••  🔓  (Click to decrypt)              │
│                                             │
└─────────────────────────────────────────────┘
```

**Calculation:**
```
Paid amount:              $5,000  (100%)
Withdrawn amount:         $3,000  ( 60%)
Available to withdraw:    $2,000  ( 40%)
```

**Privacy:**
- All amounts encrypted by default (show "••••••")
- Click 🔓 icon → Decrypt locally with employee key → Show plaintext
- Progress bars show percentages (not amounts, to preserve privacy)

---

### Transaction Details Section

```
┌─────────────────────────────────────────────┐
│ 📋 Transaction Details                      │
├─────────────────────────────────────────────┤
│                                             │
│ ✅ Payment completed successfully            │
│    on Nov 15, 2025 @ 2:45 PM                │
│                                             │
│ 🔗 Transaction Hash:                        │
│    0x1234567890abcdef...5678 [📋 Copy]      │
│                                             │
│ 🔢 Block Number:                            │
│    #1,234,567                               │
│                                             │
│ ⛽ Gas Fee:                                 │
│    $0.01                                    │
│                                             │
│ 🔍 View on Explorer →                       │
│    (Link to Midnight Network block explorer)│
│                                             │
└─────────────────────────────────────────────┘
```

---

### Actions Section

```
┌─────────────────────────────────────────────┐
│ Actions                                     │
├─────────────────────────────────────────────┤
│                                             │
│ [Details ···]       [History 📋]            │
│ (Open modal)        (View all payments)     │
│                                             │
│ [Generate Proof]    [Download Receipt]      │
│ (ZK proof)          (PDF)                   │
│                                             │
│ [Withdraw 💰]       [More Options ···]      │
│ (To wallet)         (Share, Export, etc.)   │
│                                             │
└─────────────────────────────────────────────┘
```

**Action Matrix (Company vs Employee):**

| Action | Company | Employee | Description |
|--------|---------|----------|-------------|
| **Details** | ✅ | ✅ | Open details modal (overview, accounting, history) |
| **History** | ✅ | ✅ | View all payments for this employee/company |
| **Generate Proof** | ❌ | ✅ | Create ZK proof of income (for lender, landlord) |
| **Download Receipt** | ✅ | ✅ | PDF receipt with payment details |
| **Withdraw** | ❌ | ✅ | Withdraw balance to personal wallet |
| **Share** | ✅ | ✅ | Share link to payment details (view-only) |
| **Export** | ✅ | ✅ | Export to CSV/JSON for accounting |

---

## Details Modal (Tabbed Interface)

**Triggered by:** Click "Details" button

### Tab 1: Overview

```
┌────────────────────────────────────────────────────┐
│ ← Details                                          │
├────────────────────────────────────────────────────┤
│                                                    │
│ Overview                                           │
│                                                    │
│ 🔗 Chain: Midnight Network                         │
│                                                    │
│ ⚡ Status: ✅ Completed                             │
│                                                    │
│ 🆔 Payment ID: #PAY-1234 [📋 Copy]                 │
│                                                    │
│ 💰 Amount: ••••••  🔓                              │
│                                                    │
│ 📊 Type: Regular Salary (Biweekly)                 │
│                                                    │
│ 📅 Timing: Paid on Nov 15, 2025 @ 2:45 PM          │
│                                                    │
│ 🏢 Sender: Acme Corp (acme.mn) [📋 Copy]           │
│                                                    │
│ 👤 Recipient: Alice Johnson (alice.mn) [📋 Copy]   │
│                                                    │
│ 🔐 Privacy: Amount encrypted on-chain              │
│                                                    │
│ 🎯 Recurring: Yes (Biweekly, Schedule #REC-456)    │
│                                                    │
│ 🔍 Transaction: View on block explorer →           │
│    0x1234...5678                                   │
│                                                    │
│ 📋 Smart Contract: View contract →                 │
│    0xABCD...EFGH                                   │
│                                                    │
└────────────────────────────────────────────────────┘
```

---

### Tab 2: Accounting (Employee View Only)

```
┌────────────────────────────────────────────────────┐
│ ← Details                                          │
├────────────────────────────────────────────────────┤
│                                                    │
│ Accounting                                         │
│                                                    │
│ ─────────────────────────────────────────────────  │
│ Amounts                                            │
│                                                    │
│ ┌──────────────────────┐  ┌──────────────────────┐│
│ │ 💵 Gross Amount      │  │ 💸 Withdrawn         ││
│ │                      │  │                      ││
│ │   ••••••  🔓         │  │   ••••••  🔓         ││
│ │   (Click to decrypt) │  │   60% of gross       ││
│ └──────────────────────┘  └──────────────────────┘│
│                                                    │
│ ┌──────────────────────┐  ┌──────────────────────┐│
│ │ 💰 Available         │  │ ⛽ Gas Fee           ││
│ │                      │  │                      ││
│ │   ••••••  🔓         │  │   $0.01              ││
│ │   40% of gross       │  │   (Paid by company)  ││
│ └──────────────────────┘  └──────────────────────┘│
│                                                    │
│ ─────────────────────────────────────────────────  │
│ Timeline                                           │
│                                                    │
│ ✅ Payment completed     2 weeks ago               │
│                                                    │
│ 📅 Paid on              Nov 15, 2025 @ 2:45 PM     │
│                                                    │
│ 💸 First withdrawal     Nov 16, 2025 @ 9:00 AM     │
│                                                    │
│ 💸 Last withdrawal      Nov 20, 2025 @ 3:30 PM     │
│                                                    │
│ 📊 Total withdrawals    3 transactions             │
│                                                    │
│ 🔄 Next payment         Nov 29, 2025 (Recurring)   │
│                                                    │
└────────────────────────────────────────────────────┘
```

**Withdrawal History (Expandable):**

```
┌────────────────────────────────────────────────────┐
│ Withdrawal History (3 transactions)                │
├────────────────────────────────────────────────────┤
│                                                    │
│ 1. Nov 16, 2025 @ 9:00 AM                          │
│    Amount: ••••••  🔓                              │
│    To: alice_personal.mn                           │
│    Tx: 0xABCD...1234                               │
│                                                    │
│ 2. Nov 18, 2025 @ 2:15 PM                          │
│    Amount: ••••••  🔓                              │
│    To: alice_personal.mn                           │
│    Tx: 0xDEF0...5678                               │
│                                                    │
│ 3. Nov 20, 2025 @ 3:30 PM                          │
│    Amount: ••••••  🔓                              │
│    To: alice_personal.mn                           │
│    Tx: 0x9876...ABCD                               │
│                                                    │
└────────────────────────────────────────────────────┘
```

---

### Tab 3: History (All Payments for This Employee/Company)

```
┌────────────────────────────────────────────────────┐
│ ← Details                                          │
├────────────────────────────────────────────────────┤
│                                                    │
│ Payment History                                    │
│                                                    │
│ All payments for Alice Johnson                     │
│ Total: 28 payments, ••••••  🔓 (total paid)        │
│                                                    │
├────┬──────────────┬──────────────┬────────────────┤
│ #  │ Date         │ Amount       │ Status         │
├────┼──────────────┼──────────────┼────────────────┤
│ 28 │ Nov 15, 2025 │ ••••••  🔓   │ ✅ Completed    │
│    │ (Current)    │              │ → Details      │
├────┼──────────────┼──────────────┼────────────────┤
│ 27 │ Nov 1, 2025  │ ••••••  🔓   │ ✅ Completed    │
│    │ Biweekly     │              │ → Details      │
├────┼──────────────┼──────────────┼────────────────┤
│ 26 │ Oct 18, 2025 │ ••••••  🔓   │ ✅ Completed    │
│    │ Biweekly     │              │ → Details      │
├────┼──────────────┼──────────────┼────────────────┤
│ 25 │ Oct 4, 2025  │ ••••••  🔓   │ ✅ Completed    │
│    │ Biweekly     │              │ → Details      │
├────┼──────────────┼──────────────┼────────────────┤
│    │ ... (24 more payments)                       │
└────┴──────────────┴──────────────┴────────────────┘
│                                                    │
│ [Export to CSV]  [Download Report (PDF)]          │
│                                                    │
└────────────────────────────────────────────────────┘
```

---

## Action Modals

### 1. Withdraw Modal (Employee Only)

**Triggered by:** Click "Withdraw" button

```
┌────────────────────────────────────────────────────┐
│         Withdraw Salary                            │
├────────────────────────────────────────────────────┤
│                                                    │
│ Available Balance: ••••••  🔓                      │
│ (Click to decrypt)                                 │
│                                                    │
│ ─────────────────────────────────────────────────  │
│                                                    │
│ Withdraw Amount *                                  │
│ [$_________]                                       │
│ ● Withdraw All (••••••)                            │
│ ○ Custom Amount                                    │
│                                                    │
│ ─────────────────────────────────────────────────  │
│                                                    │
│ Destination Wallet *                               │
│ [0xABCD...______________________________] [Paste]  │
│ Your personal Midnight Network wallet address      │
│                                                    │
│ ─────────────────────────────────────────────────  │
│                                                    │
│ Summary                                            │
│ Amount:     ••••••  🔓                             │
│ Gas Fee:    ~$0.005                                │
│ You'll Get: ••••••  🔓                             │
│                                                    │
│ [Cancel]                           [Withdraw →]    │
│                                     (Orange)       │
└────────────────────────────────────────────────────┘
```

**Validation:**
- Amount must be ≤ available balance
- Wallet address must be valid Midnight address
- Gas fee estimated in real-time

**Success Flow:**
1. Click "Withdraw"
2. MetaMask popup: "Sign transaction to withdraw"
3. Transaction submitted
4. Loading: "Processing withdrawal..."
5. Success: Toast "✅ Withdrew ••••• to your wallet"
6. Balance status updated (withdrawn amount increases)

---

### 2. Generate Proof Modal (Employee Only)

**Triggered by:** Click "Generate Proof" button

```
┌────────────────────────────────────────────────────┐
│         Generate Income Proof (ZK)                 │
├────────────────────────────────────────────────────┤
│                                                    │
│ Create a zero-knowledge proof of your income       │
│ without revealing your exact salary.               │
│                                                    │
│ ─────────────────────────────────────────────────  │
│                                                    │
│ Proof Type *                                       │
│ [Dropdown: Income Proof ▼                      ]   │
│ Options:                                           │
│ • Income Proof (earn > $X/month)                   │
│ • Employment Proof (currently employed)            │
│ • Credit Score Proof (ZKML)                        │
│                                                    │
│ ─────────────────────────────────────────────────  │
│                                                    │
│ Proof Statement                                    │
│ I earn more than [$5,000___] per month             │
│                                                    │
│ ☐ Include employment status (currently employed)   │
│ ☐ Include company name (Acme Corp)                 │
│                                                    │
│ ─────────────────────────────────────────────────  │
│                                                    │
│ Valid For (Optional)                               │
│ [30 days ▼]  or  ☐ No expiration                  │
│                                                    │
│ ─────────────────────────────────────────────────  │
│                                                    │
│ Proof Preview                                      │
│ "Alice Johnson earns more than $5,000/month        │
│  and is currently employed at Acme Corp."          │
│                                                    │
│ Verifier: [Recipient email/wallet____]             │
│ (Optional - who can verify this proof)             │
│                                                    │
│ [Cancel]                     [Generate Proof →]    │
│                               (Purple)             │
└────────────────────────────────────────────────────┘
```

**Success Flow:**
1. Fill proof parameters
2. Click "Generate Proof"
3. Processing: "Generating ZK proof..." (may take 10-30s)
4. Success modal:

```
┌────────────────────────────────────────────────────┐
│         Proof Generated ✅                          │
├────────────────────────────────────────────────────┤
│                                                    │
│ Your zero-knowledge proof has been created.        │
│                                                    │
│ Proof ID: #PROOF-789                               │
│ Valid until: Dec 15, 2025                          │
│                                                    │
│ ─────────────────────────────────────────────────  │
│                                                    │
│ Share Proof:                                       │
│ [https://zksalaria.app/verify/PROOF-789] [📋 Copy]│
│                                                    │
│ Or send to verifier:                               │
│ [Email] [Download PDF] [Copy Link]                 │
│                                                    │
│ [Close]                         [Share Proof →]    │
│                                                    │
└────────────────────────────────────────────────────┘
```

---

### 3. Download Receipt Modal (Both)

**Triggered by:** Click "Download Receipt" button

```
┌────────────────────────────────────────────────────┐
│         Download Payment Receipt                   │
├────────────────────────────────────────────────────┤
│                                                    │
│ Format *                                           │
│ ● PDF (printable)                                  │
│ ○ CSV (for accounting software)                    │
│ ○ JSON (for developers)                            │
│                                                    │
│ ─────────────────────────────────────────────────  │
│                                                    │
│ Include Details                                    │
│ ☑ Payment amount                                   │
│ ☑ Payment date and time                            │
│ ☑ Sender and recipient                             │
│ ☑ Transaction hash                                 │
│ ☑ Block number                                     │
│ ☐ Withdrawal history (if employee)                 │
│                                                    │
│ ─────────────────────────────────────────────────  │
│                                                    │
│ Privacy Options (Employee Only)                    │
│ ● Show encrypted amounts (••••••)                  │
│ ○ Show plaintext amounts (requires decryption)     │
│                                                    │
│ [Cancel]                      [Download Receipt]   │
│                                (Cyan)              │
└────────────────────────────────────────────────────┘
```

**PDF Receipt Example:**

```
┌────────────────────────────────────────────────────┐
│                                                    │
│           PAYMENT RECEIPT                          │
│           zkSalaria                                │
│                                                    │
├────────────────────────────────────────────────────┤
│                                                    │
│ Payment ID:       #PAY-1234                        │
│ Date:             Nov 15, 2025 @ 2:45 PM           │
│ Status:           ✅ Completed                      │
│                                                    │
│ From:             Acme Corp                        │
│                   acme.mn                          │
│                                                    │
│ To:               Alice Johnson                    │
│                   alice.mn                         │
│                                                    │
│ Amount:           ••••••  (encrypted on-chain)     │
│ Payment Type:     Regular Salary (Biweekly)        │
│                                                    │
│ Transaction Hash: 0x1234567890abcdef...5678        │
│ Block Number:     #1,234,567                       │
│ Chain:            Midnight Network                 │
│                                                    │
│ Privacy Notice:                                    │
│ This payment amount is encrypted on the blockchain │
│ and can only be decrypted by the recipient.        │
│                                                    │
│ Generated on: Nov 15, 2025 @ 3:00 PM               │
│                                                    │
└────────────────────────────────────────────────────┘
```

---

## Mobile Responsive Design

### Payment Detail (Mobile)

```
┌─────────────────────────────┐
│ ← Payment #1234             │
├─────────────────────────────┤
│                             │
│ ┌─────────────────────────┐ │
│ │                         │ │
│ │      ••••••             │ │
│ │    💵 Click 🔓           │ │
│ │    to decrypt           │ │
│ │                         │ │
│ │  Regular Salary         │ │
│ │  Nov 15, 2025           │ │
│ │                         │ │
│ └─────────────────────────┘ │
│                             │
│ Status: ✅ Completed         │
│ Available: ••••••  🔓       │
│                             │
│ [Withdraw]  [Details]       │
│                             │
├─────────────────────────────┤
│ Attributes                  │
├─────────────────────────────┤
│ Sender:   Acme Corp         │
│ Recipient: Alice Johnson    │
│ Type:     Regular Salary    │
│ Date:     Nov 15, 2025      │
│                             │
│ [More Details ▼]            │
├─────────────────────────────┤
│ Actions                     │
├─────────────────────────────┤
│ [Generate Proof]            │
│ [Download Receipt]          │
│ [Share Link]                │
│ [More Options ···]          │
└─────────────────────────────┘

┌─────────────────────────────┐
│ [Withdraw to Wallet]        │
│ (Sticky bottom bar)         │
└─────────────────────────────┘
```

---

## Key Differences: Sablier vs zkSalaria

| Feature | Sablier (Vesting) | zkSalaria (Payroll) |
|---------|-------------------|---------------------|
| **Visual Center** | Circular progress (vested %) | Payment card (amount, date) |
| **Streamed Amount** | Tokens unlocking over time | N/A (payment is instant) |
| **Withdrawn Amount** | Portion withdrawn from stream | Withdrawn from balance to wallet |
| **Emission Chart** | Linear/cliff vesting curve | N/A (or recurring timeline) |
| **Withdraw Button** | Withdraw vested tokens | Withdraw salary to personal wallet |
| **Cancel Button** | Sender cancels unvested tokens | N/A (cannot undo completed payment) |
| **Transfer Button** | Transfer stream NFT | N/A (employee owns balance) |
| **Simulate** | Fast-forward time to see vesting | N/A (no time-based unlock) |
| **Privacy** | Public amounts on blockchain | **Encrypted amounts** (key difference) |

---

## Next Steps

1. **Review wireframes** with stakeholders
2. **Create Figma mockups** for payment detail page
3. **Implement React components** (overview, details modal, action modals)
4. **Build withdraw flow** (employee withdraws to personal wallet)
5. **Build proof generation** (ZK income proofs)
6. **Test UX** with beta users

---

*This payment detail page provides complete visibility into individual payments while preserving privacy through encrypted amounts and ZK proofs.*
