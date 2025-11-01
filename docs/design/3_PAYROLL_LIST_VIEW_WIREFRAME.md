# zkSalaria Payroll & Vesting List View - Wireframe Specification

**Version:** 1.0
**Date:** 2025-10-31
**Purpose:** Table/list view for payments and vesting grants (adapted from Sablier)

---

## Overview

This document specifies the **list view** for both Payroll (current) and Vesting (future). The pattern is adapted from Sablier's vesting streams interface but tailored for zkSalaria's privacy-focused payroll use case.

**Key Differences from Sablier:**
- ✅ **Privacy-first**: Encrypted amounts shown as "••••" until decrypted
- ✅ **Role-based**: Different views for company vs employee
- ✅ **Combined view**: Payroll + Vesting in same interface (future)

---

## 🏢 COMPANY VIEW - Payroll List

**Navigation Path:** Home → Payroll Tab → Payroll List

### Page Header

```
┌────────────────────────────────────────────────────────────────────────────┐
│                                                                            │
│  Payroll > All                                                             │
│                                                                            │
│  Salary Payments                    🌙 Midnight Network                    │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

### Tab Navigation + Primary CTA

```
┌────────────────────────────────────────────────────────────────────────────┐
│                                                                            │
│  [📋 All] [📥 Received] [📤 Sent] [🔍 Search]          [Pay Employee +]   │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

**Tab Specifications:**

| Tab | Icon | Label | Description | Company Sees | Employee Sees |
|-----|------|-------|-------------|--------------|---------------|
| **All** | 📋 | All | All payments (sent + received) | All company payments | N/A (employee only sees "Received") |
| **Received** | 📥 | Received | Payments received (deposits) | Company deposits from treasury | Employee salary payments |
| **Sent** | 📤 | Sent | Payments sent (withdrawals) | Salary payments to employees | Employee withdrawals to wallet |
| **Search** | 🔍 | Search | Advanced filtering | Opens search modal | Opens search modal |

**Primary CTA:**
- **Company view**: "Pay Employee +" (orange button, top-right)
- **Employee view**: "Withdraw Salary +" (cyan button, top-right)

---

### Table Structure

**Column Headers:**

```
┌────────────────────────────────────────────────────────────────────────────┐
│ STATUS    EMPLOYEE / COMPANY    AMOUNT    DATE    TYPE    ACTIONS          │
└────────────────────────────────────────────────────────────────────────────┘
```

**Column Specifications:**

| Column | Width | Content | Sort | Filter |
|--------|-------|---------|------|--------|
| **STATUS** | 10% | Badge: Completed ✓, Pending ⏳, Failed ✗ | Yes | Yes |
| **EMPLOYEE / COMPANY** | 25% | Name + ID (truncated address) | Yes | Yes |
| **AMOUNT** | 15% | Encrypted: "••••" or Decrypted: "$5,000" | Yes | No |
| **DATE** | 15% | "3 days ago" (relative) or "Jan 15, 2025" | Yes | Yes |
| **TYPE** | 15% | Badge: Salary, Bonus, Advance, Withdrawal | Yes | Yes |
| **ACTIONS** | 20% | Dropdown: View Details, Generate Proof, Download Receipt | No | No |

---

### Table Rows (Examples)

**Company View - "All" Tab:**

```
┌────────────────────────────────────────────────────────────────────────────┐
│                                                                            │
│  ✓ Completed   Alice Johnson (alice)   $5,000   3 days ago   Salary   ⋮  │
│  ✓ Completed   Bob Smith (bob)         $4,200   3 days ago   Salary   ⋮  │
│  ✓ Completed   Carol Lee (carol)       $6,500   3 days ago   Salary   ⋮  │
│  ⏳ Pending    Dave Kim (dave)         $3,800   Just now      Salary   ⋮  │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

**Employee View - "Received" Tab:**

```
┌────────────────────────────────────────────────────────────────────────────┐
│                                                                            │
│  ✓ Completed   Acme Corp (acme-corp)   ••••••   3 days ago   Salary   🔓  │
│  ✓ Completed   Acme Corp (acme-corp)   ••••••   17 days ago  Salary   🔓  │
│  ✓ Completed   Acme Corp (acme-corp)   ••••••   31 days ago  Salary   🔓  │
│                                                                            │
│  💡 Decrypt amounts to see your payment history                           │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

**Privacy Feature:**
- Employee sees encrypted amounts ("••••••") by default
- Click 🔓 icon to decrypt (requires local key)
- Decryption happens locally, never sent to server

---

### Row Hover State

```
┌────────────────────────────────────────────────────────────────────────────┐
│ ✓ Completed   Alice Johnson (alice)   $5,000   3 days ago   Salary   [⋮] │
│                                                                            │
│ ↳ Payment ID: 0xa3f2...8b9c                                                │
│ ↳ Transaction: View on explorer →                                         │
└────────────────────────────────────────────────────────────────────────────┘
```

**Hover Effects:**
- Background: Lighten to rgba(0, 217, 255, 0.05)
- Border-left: 4px solid #00D9FF
- Show additional metadata (payment ID, transaction link)

---

### Actions Dropdown

**Trigger:** Click ⋮ icon on any row

```
┌─────────────────────────────┐
│ View Payment Details        │
│ Generate Income Proof       │
│ Download Receipt (PDF)      │
│ ───────────────────────     │
│ Cancel Payment (if pending) │
│ Report Issue                │
└─────────────────────────────┘
```

**Actions Breakdown:**

**For Company:**
- **View Payment Details** → Opens modal with full payment info
- **Generate Proof** → (If employee granted disclosure) Generate ZK proof of payment
- **Download Receipt** → PDF with payment details
- **Cancel Payment** → (Only if status = Pending) Cancel transaction
- **Report Issue** → Open support ticket

**For Employee:**
- **View Payment Details** → Opens modal with decrypted payment info
- **Generate Income Proof** → Generate ZK proof of income for lenders/landlords
- **Download Paystub** → PDF with gross/net salary, taxes, benefits
- **Request Correction** → (If incorrect amount) Contact company

---

### Empty State - "All" Tab (Company View)

```
┌────────────────────────────────────────────────────────────────────────────┐
│                                                                            │
│                         No payments found                                  │
│                                                                            │
│  ┌──────────────────────────────────┐  ┌──────────────────────────────┐  │
│  │                                  │  │                              │  │
│  │    [💸 3D Illustration]          │  │   [📊 3D Illustration]       │  │
│  │                                  │  │                              │  │
│  │    Start Paying Employees        │  │   Import Payment History     │  │
│  │                                  │  │                              │  │
│  │    Set up your first salary      │  │   Upload CSV of past         │  │
│  │    payment and pay your team.    │  │   payments to get started.   │  │
│  │                                  │  │                              │  │
│  │    [Pay Employee +]              │  │   [Import CSV →]             │  │
│  │                                  │  │                              │  │
│  └──────────────────────────────────┘  └──────────────────────────────┘  │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

**Card 1: Start Paying Employees**
- 3D illustration: Coins flowing into wallet
- Title: "Start Paying Employees" (Inter Semibold 20px)
- Description: "Set up your first salary payment and pay your team." (Inter Regular 14px, #A0AEC0)
- CTA: "Pay Employee +" (orange background #FF6B35)

**Card 2: Import Payment History**
- 3D illustration: Spreadsheet with charts
- Title: "Import Payment History"
- Description: "Upload CSV of past payments to get started."
- CTA: "Import CSV →" (cyan border #00D9FF)

---

### Empty State - "Received" Tab (Employee View)

```
┌────────────────────────────────────────────────────────────────────────────┐
│                                                                            │
│                         No payments received yet                           │
│                                                                            │
│  ┌──────────────────────────────────┐  ┌──────────────────────────────┐  │
│  │                                  │  │                              │  │
│  │    [⏰ 3D Illustration]          │  │   [🔐 3D Illustration]       │  │
│  │                                  │  │                              │  │
│  │    Waiting for First Payment     │  │   Set Up Direct Deposit      │  │
│  │                                  │  │                              │  │
│  │    Your company hasn't paid      │  │   Add your Midnight wallet   │  │
│  │    your salary yet. Check back   │  │   to receive salary payments.│  │
│  │    after payday.                 │  │                              │  │
│  │                                  │  │   [Add Wallet →]             │  │
│  │                                  │  │                              │  │
│  └──────────────────────────────────┘  └──────────────────────────────┘  │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

**Card 1: Waiting for First Payment**
- 3D illustration: Clock with coins
- Title: "Waiting for First Payment"
- Description: "Your company hasn't paid your salary yet. Check back after payday."
- No CTA (informational only)

**Card 2: Set Up Direct Deposit**
- 3D illustration: Shield with wallet
- Title: "Set Up Direct Deposit"
- Description: "Add your Midnight wallet to receive salary payments."
- CTA: "Add Wallet →" (cyan border #00D9FF)

---

### Search Modal

**Trigger:** Click "Search" tab

```
┌──────────────────────────────────────────────────────────────────────────┐
│                                                                          │
│  Search salary payments                                          [?] [×] │
│                                                                          │
│  Employee                              Date Range                        │
│  [alice                          ▼]    [Last 30 days            ▼]      │
│                                                                          │
│  Amount Range                          Payment Type                      │
│  Min: [$0                        ]     [● All                    ]       │
│  Max: [$10,000                   ]     [○ Salary                 ]       │
│                                        [○ Bonus                  ]       │
│                                        [○ Advance                ]       │
│                                                                          │
│  Status                                Network                           │
│  [● All  ○ Completed  ○ Pending]      [🌙 Midnight Network       ▼]     │
│                                                                          │
│  Payment IDs                                                             │
│  [0xa3f2...8b9c                                                + Add ID] │
│                                                                          │
│  E.g., show all salary payments on 🌙 Midnight                           │
│                                                                          │
│                          [Clear 🗑️]  [Show results 🔍]                  │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

**Search Fields:**

| Field | Type | Options | Default |
|-------|------|---------|---------|
| **Employee** | Dropdown | List of all employees | All employees |
| **Date Range** | Dropdown | Last 7/30/90 days, This year, All time, Custom | Last 30 days |
| **Amount Range** | Number inputs | Min/Max amount filters | $0 - No limit |
| **Payment Type** | Radio buttons | All, Salary, Bonus, Advance, Withdrawal | All |
| **Status** | Radio buttons | All, Completed, Pending, Failed | All |
| **Network** | Dropdown | Midnight Network (default) | Midnight |
| **Payment IDs** | Text inputs | Multiple payment ID search | Empty |

**Buttons:**
- **Clear** - Reset all filters (border #2D3748)
- **Show results** - Apply filters and close modal (background #00D9FF)

---

## 👤 EMPLOYEE VIEW - Payroll List

**Navigation Path:** Home → My Salary Tab → Payment History

### Page Header

```
┌────────────────────────────────────────────────────────────────────────────┐
│                                                                            │
│  My Salary > Received                                                      │
│                                                                            │
│  Payment History                    🌙 Midnight Network                    │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

### Tab Navigation (Employee View)

**Employee sees ONLY:**
- **Received** (default) - Salary payments from company
- **Sent** - Withdrawals to external wallet
- **Search** - Filter own payment history

**No "All" tab** - Employee doesn't need to see aggregated view (company-only feature)

### Privacy Banner (Top of Table)

```
┌────────────────────────────────────────────────────────────────────────────┐
│ 🔒 Your salary amounts are encrypted. Click 🔓 to decrypt locally.         │
│                                                      [Decrypt All Amounts] │
└────────────────────────────────────────────────────────────────────────────┘
```

**Banner Styling:**
- Background: rgba(0, 217, 255, 0.1)
- Border-left: 4px solid #00D9FF
- Dismissible: X button on far right
- "Decrypt All Amounts" button: Decrypts entire table at once

---

### Table Structure (Employee View)

**Encrypted State:**

```
┌────────────────────────────────────────────────────────────────────────────┐
│ STATUS    COMPANY           AMOUNT    DATE          TYPE      ACTIONS      │
├────────────────────────────────────────────────────────────────────────────┤
│ ✓ Complete  Acme Corp      ••••••    3 days ago    Salary    🔓  ⋮        │
│ ✓ Complete  Acme Corp      ••••••    17 days ago   Salary    🔓  ⋮        │
│ ✓ Complete  Acme Corp      ••••••    31 days ago   Salary    🔓  ⋮        │
└────────────────────────────────────────────────────────────────────────────┘
```

**Decrypted State (After clicking 🔓):**

```
┌────────────────────────────────────────────────────────────────────────────┐
│ STATUS    COMPANY           AMOUNT    DATE          TYPE      ACTIONS      │
├────────────────────────────────────────────────────────────────────────────┤
│ ✓ Complete  Acme Corp      $5,000    3 days ago    Salary    🔒  ⋮        │
│ ✓ Complete  Acme Corp      $5,000    17 days ago   Salary    🔒  ⋮        │
│ ✓ Complete  Acme Corp      $5,000    31 days ago   Salary    🔒  ⋮        │
└────────────────────────────────────────────────────────────────────────────┘
```

**Decryption Interaction:**
- Click 🔓 icon → Shows loading spinner → Decrypts locally → Shows amount
- Icon changes to 🔒 (locked = decrypted and visible)
- "Decrypt All Amounts" button: Decrypts all rows in table at once
- Decryption persists for session (refresh page = re-encrypt)

---

## 🌱 VESTING VIEW (Future Phase 6)

**Note:** This section is for future implementation. Same pattern as payroll, but for vesting grants.

### Page Header

```
┌────────────────────────────────────────────────────────────────────────────┐
│                                                                            │
│  Vesting > All                                                             │
│                                                                            │
│  Vesting Grants                     🌙 Midnight Network                    │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

### Tab Navigation (Vesting)

| Tab | Label | Company View | Employee View |
|-----|-------|--------------|---------------|
| **All** | All Grants | All vesting grants created | N/A |
| **Incoming** | Incoming | N/A | Vesting grants received |
| **Outgoing** | Outgoing | Vesting grants created | N/A |
| **Search** | Search | Filter grants | Filter own grants |

### Table Structure (Vesting)

**Column Headers:**

```
┌────────────────────────────────────────────────────────────────────────────┐
│ STATUS    EMPLOYEE    TOTAL GRANT    VESTED    TIMELINE    ACTIONS         │
└────────────────────────────────────────────────────────────────────────────┘
```

**Column Specifications:**

| Column | Width | Content | Example |
|--------|-------|---------|---------|
| **STATUS** | 10% | Badge: Active 🟢, Cancelled 🔴, Completed ✓ | Active 🟢 |
| **EMPLOYEE** | 20% | Name + ID | Alice Johnson (alice) |
| **TOTAL GRANT** | 15% | Encrypted or decrypted amount | ••••••• or "100,000 tokens" |
| **VESTED** | 15% | Progress bar + percentage | 37.5% (37,500 vested) |
| **TIMELINE** | 25% | Visual timeline with cliff/duration | [Timeline visualization] |
| **ACTIONS** | 15% | Dropdown: View, Accelerate, Cancel | ⋮ |

**Timeline Column Visualization:**

```
├─────┼─────────────────────────┤
0%    25%                     100%
      Cliff  Current (37.5%)  End
```

---

### Empty State - "Outgoing" Tab (Company View)

```
┌────────────────────────────────────────────────────────────────────────────┐
│                                                                            │
│                         No vesting grants created                          │
│                                                                            │
│  ┌──────────────────────────────────┐  ┌──────────────────────────────┐  │
│  │                                  │  │                              │  │
│  │    [🔒 3D Illustration]          │  │   [📊 3D Illustration]       │  │
│  │                                  │  │                              │  │
│  │    Start Vesting                 │  │   Import Vesting Schedules   │  │
│  │                                  │  │                              │  │
│  │    Set up an onchain vesting     │  │   Upload CSV of existing     │  │
│  │    plan. Lock up your tokens.    │  │   grants to migrate.         │  │
│  │                                  │  │                              │  │
│  │    [Create Grant +]              │  │   [Import CSV →]             │  │
│  │                                  │  │                              │  │
│  └──────────────────────────────────┘  └──────────────────────────────┘  │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

---

### Empty State - "Incoming" Tab (Employee View)

```
┌────────────────────────────────────────────────────────────────────────────┐
│                                                                            │
│                         No vesting grants received                         │
│                                                                            │
│  ┌──────────────────────────────────┐  ┌──────────────────────────────┐  │
│  │                                  │  │                              │  │
│  │    [⏰ 3D Illustration]          │  │   [🔐 3D Illustration]       │  │
│  │                                  │  │                              │  │
│  │    Request A Grant               │  │   Learn About Vesting        │  │
│  │                                  │  │                              │  │
│  │    Ask your company to create    │  │   See how token vesting      │  │
│  │    a vesting plan for you.       │  │   works with zkSalaria.      │  │
│  │                                  │  │                              │  │
│  │    [Contact Company →]           │  │   [Learn More →]             │  │
│  │                                  │  │                              │  │
│  └──────────────────────────────────┘  └──────────────────────────────┘  │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

---

## Responsive Design

### Desktop (1440px+)
- Full table with all columns visible
- 3D illustrations in empty states
- Hover effects on all interactive elements

### Laptop (1024px - 1439px)
- Condense timeline column to icon + percentage
- Reduce padding in cells

### Tablet (768px - 1023px)
- Stack table as cards (mobile-first approach)
- Each row becomes a card with vertical layout
- Actions moved to bottom of card

### Mobile (<768px)
- Full card-based layout
- Swipe to reveal actions
- Decrypt button prominent in each card
- Search becomes full-screen modal

---

## Accessibility

**Keyboard Navigation:**
- Tab through all interactive elements (tabs, rows, actions)
- Enter to open dropdowns/modals
- Escape to close modals
- Arrow keys to navigate table rows

**Screen Readers:**
- All icons have aria-labels
- Table announces row count: "Showing 15 payments"
- Decrypt action announces: "Decrypting payment amount"
- Empty states announce: "No payments found. Start by paying an employee."

**Color Contrast:**
- All text meets WCAG AA (4.5:1 minimum)
- Status badges use icons + text (not just color)
- Focus indicators: 2px solid #00D9FF

---

## Performance

**Pagination:**
- Load 50 rows at a time
- Infinite scroll OR pagination controls
- Virtual scrolling for large datasets (1000+ rows)

**Decryption:**
- Lazy decrypt (only decrypt visible rows)
- Cache decrypted values in session storage
- Web Workers for bulk decryption (don't block UI)

**Filtering:**
- Client-side filtering for <1000 rows
- Server-side filtering for >1000 rows
- Debounce search input (300ms)

---

## Technical Implementation

**Components:**

```typescript
components/
├── payroll/
│   ├── PayrollList.tsx           // Main table component
│   ├── PayrollRow.tsx             // Individual row
│   ├── PayrollEmptyState.tsx      // Empty state cards
│   ├── PayrollSearchModal.tsx     // Search/filter modal
│   ├── PayrollActions.tsx         // Actions dropdown
│   ├── DecryptButton.tsx          // Decrypt icon + logic
│   └── PrivacyBanner.tsx          // Encryption notice banner
├── vesting/                        // Future Phase 6
│   ├── VestingList.tsx
│   ├── VestingRow.tsx
│   ├── VestingTimeline.tsx         // Timeline visualization
│   └── VestingSearchModal.tsx
└── shared/
    ├── StatusBadge.tsx             // Reusable status indicator
    ├── TableSkeleton.tsx           // Loading state
    └── EmptyStateCard.tsx          // Reusable empty state
```

**State Management:**

```typescript
interface PayrollListState {
  payments: Payment[];
  activeTab: 'all' | 'received' | 'sent';
  filters: PayrollFilters;
  decryptedAmounts: Map<string, bigint>; // payment_id -> amount
  isLoading: boolean;
  pagination: { page: number; total: number };
}

interface PayrollFilters {
  employee?: string;
  dateRange?: { start: Date; end: Date };
  amountRange?: { min: bigint; max: bigint };
  type?: 'salary' | 'bonus' | 'advance' | 'withdrawal';
  status?: 'completed' | 'pending' | 'failed';
}
```

---

## Summary

This list view pattern provides:

1. ✅ **Clear navigation** - Tab-based filtering (All/Received/Sent/Search)
2. ✅ **Privacy-first** - Encrypted amounts with local decryption
3. ✅ **Role-aware** - Different views for company vs employee
4. ✅ **Action-rich** - Contextual dropdowns for each payment
5. ✅ **Empty states** - Helpful CTAs when no data exists
6. ✅ **Searchable** - Advanced filtering modal
7. ✅ **Future-proof** - Same pattern works for vesting (Phase 6)

**Adapted from Sablier, but better:**
- Sablier shows public amounts → zkSalaria shows encrypted amounts
- Sablier has single user type → zkSalaria has company/employee roles
- Sablier focuses on vesting → zkSalaria focuses on payroll (vesting is bonus)
