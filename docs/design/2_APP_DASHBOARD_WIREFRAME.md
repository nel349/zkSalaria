# zkSalaria App Dashboard - Detailed Wireframe Specification

**Version:** 1.0
**Date:** 2025-10-31
**Purpose:** Application interface after user connects wallet (post-authentication)

---

## Design System (Inherited from Onboarding)

### Color Palette
```
Primary Background: #0A0E27 (Deep midnight blue)
Secondary Background: #1A1F3A (Lighter midnight blue)
Card Background: #151932 (Medium midnight blue)
Accent Primary: #00D9FF (Cyan - privacy/encryption)
Accent Secondary: #7B61FF (Purple - ZKML/AI)
Warning/CTA: #FF6B35 (Orange - primary actions)
Success: #10B981 (Green - compliance/verified)
Alert Background: rgba(255, 107, 53, 0.1) (Orange tint)
Text Primary: #FFFFFF (White)
Text Secondary: #A0AEC0 (Light gray)
Border: #2D3748 (Dark gray)
```

### Typography
```
Same as onboarding page:
Heading 1: Inter, 48px, Bold
Heading 2: Inter, 32px, Bold
Heading 3: Inter, 24px, Semibold
Body Large: Inter, 16px, Regular
Body: Inter, 14px, Regular
Monospace: JetBrains Mono, 14px
```

---

## Role-Based Dashboard System

**zkSalaria supports two distinct user roles with different dashboard experiences:**

### Role Detection
- **Company Role:** Wallet address matches a registered company on-chain
- **Employee Role:** Wallet address matches a registered employee on-chain
- **Dual Role:** Some users may be both (e.g., company owner who is also an employee)
- **New User:** Wallet not registered → Show onboarding prompt

### Role Switcher (For Dual Role Users)

If user has both roles, show switcher in top nav:

```
┌─────────────────────────┐
│ View as:  [Company] ✓   │
│           [Employee]    │
└─────────────────────────┘
```

**Design:**
- Toggle button in top nav (left of network selector)
- Active role: #00D9FF background
- Inactive role: Transparent
- Clicking switches entire dashboard view
- Persists selection in local storage

---

## Page Structure

### Top Navigation Bar

**Height:** 72px
**Background:** #0A0E27 with border-bottom: 1px solid #2D3748
**Position:** Sticky top, z-index: 1000

```
┌────────────────────────────────────────────────────────────────────────────┐
│                                                                            │
│  [Logo] [Home] [Payroll] [Verification] [Audits]    [🔔] [Midnight] [Wallet] │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

**Layout Breakdown:**

**Left Section (Logo + Navigation Tabs):**
- **Logo:** zkSalaria shield icon + text (160px width)
  - Icon: 28px × 28px with cyan glow
  - Text: Inter Semibold 18px
  - Clickable: Returns to Overview

- **Navigation Tabs:**
  - **Home** (icon: house)
  - **Payroll** (icon: coins)
  - **Verification** (icon: shield with checkmark)
  - **Audits** (icon: document with magnifying glass)

  Tab styling:
  - Inactive: #A0AEC0, background transparent
  - Active: #FFFFFF, background rgba(0, 217, 255, 0.1), border-bottom: 2px solid #00D9FF
  - Hover: #FFFFFF, background rgba(0, 217, 255, 0.05)
  - Icon + text layout with 8px gap
  - Padding: 16px 20px

**Right Section (Status + Network + Wallet):**
- **Notification Bell** (icon: bell)
  - Badge: Red dot if unread notifications
  - Dropdown on click: Recent activity, audit alerts, payment confirmations

- **Network Selector**
  - Badge: "Midnight Network" with Midnight logo
  - Background: #151932
  - Border: 1px solid #2D3748
  - Padding: 8px 16px
  - Border-radius: 8px
  - Icon: Midnight logo 20px × 20px
  - Future: Dropdown for testnet/mainnet selection

- **Wallet Connection**
  - Connected state: Truncated address "D1fb39...7WjY"
  - Background: #151932
  - Border: 1px solid #00D9FF
  - Padding: 8px 16px
  - Border-radius: 8px
  - Icon: Wallet icon 20px × 20px
  - Click: Dropdown with:
    - Copy address
    - View on explorer
    - Disconnect wallet

---

## Overview Page (Default "Home" Tab)

**Note:** This section documents BOTH company and employee views. Key differences are highlighted.

---

## 🏢 COMPANY VIEW vs 👤 EMPLOYEE VIEW

### Navigation Tabs

**Company View:**
- Home
- **Payroll** (manage employees, payments, schedules)
- Verification (view employee proofs)
- **Audits** (run compliance audits, view reports)

**Employee View:**
- Home
- **My Salary** (view balance, payment history)
- Verification (generate proofs, grant disclosures)
- **My Profile** (employment status, benefits)

---

### Alert Banner (Optional - Show when relevant)

**Position:** Below navigation, above page header
**Height:** 56px
**Background:** rgba(123, 97, 255, 0.1) (Purple tint for ZKML features)
**Border:** 1px solid #7B61FF
**Border-radius:** 12px (within container padding)

```
┌────────────────────────────────────────────────────────────────────────────┐
│                                                                            │
│  ⚡ New ZKML Credit Scoring Available - Generate verifiable proofs  →      │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

**Content:**
- Icon: Lightning bolt (20px, #7B61FF)
- Text: Inter Medium 14px, #FFFFFF
- Arrow: Indicates clickable banner
- Hover: Background becomes rgba(123, 97, 255, 0.15)
- Dismissible: X button on far right

**Example Alerts (Company View):**
- "⚡ New ZKML Credit Scoring Available"
- "🤖 AI Compliance Reports Ready - Ask questions in natural language"
- "⚠️ Pay Equity Audit Found Issues - Review now"
- "💰 3 Pending Salary Payments - Review now"

**Example Alerts (Employee View):**
- "💵 New Salary Payment Received - $5,000"
- "🔐 Bank XYZ Requested Employment Verification - Grant access?"
- "✅ Your Credit Score Updated - 750 (Excellent)"
- "📊 Annual W-2 Form Available - Download now"

---

### Page Header

**Padding:** 48px 0 32px 0
**Container:** Max-width 1440px, centered

```
┌────────────────────────────────────────────────────────────────────────────┐
│                                                                            │
│  zkSalaria Overview                        🌙 Midnight Network             │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

**Left:**
- Title: "zkSalaria Overview"
- Font: Inter Bold 32px
- Color: #FFFFFF

**Right:**
- Network badge: "Midnight Network"
- Background: rgba(0, 217, 255, 0.1)
- Border: 1px solid #00D9FF
- Padding: 8px 16px
- Border-radius: 8px
- Icon: Moon emoji or Midnight logo

---

### Main Feature Cards (3-Column Grid)

**Note:** This section shows COMPANY VIEW cards. Scroll down for EMPLOYEE VIEW cards.

---

## 🏢 COMPANY VIEW - Feature Cards

**Grid Layout:**
- Columns: 3 equal width
- Gap: 24px
- Margin-top: 32px
- Container: Max-width 1440px

**Card Design:**

```
┌─────────────────────────────────────────┐
│                                         │
│       [3D Illustration - 240px]         │
│                                         │
│         Feature Title (24px)            │
│                                         │
│    Description in 1-2 lines explaining  │
│    what this feature does privately.    │
│                                         │
│           [View yours  →]               │
│                                         │
└─────────────────────────────────────────┘
```

**Card Specifications:**
- Background: #151932
- Border: 1px solid #2D3748
- Border-radius: 16px
- Padding: 32px
- Min-height: 480px
- Hover: Border color #00D9FF, translate Y -4px, shadow: 0 20px 40px rgba(0, 217, 255, 0.15)
- Transition: all 0.3s ease

---

### Zero State vs Active State Summary

**Quick Reference Table for Metadata Display:**

| Card | Metric | Zero State | Active State | Color (Zero) | Color (Active) |
|------|--------|------------|--------------|--------------|----------------|
| **Private Payroll** | Total employees | "0 employees" | "12 employees" | #6B7280 | #A0AEC0 |
| | Total paid | "$0" | "$45,230" | #6B7280 | #A0AEC0 |
| | Next payment | Hide badge | "In 3 days" | - | #A0AEC0 |
| **ZK Verification** | Active proofs | "0 active" + CTA hint | "3 active" | #6B7280 | #A0AEC0 |
| | Credit score | "Not generated" | "Generated" (hover: "750") | #6B7280 | #A0AEC0 |
| | Employment verified | "0 verifiers" | "2 verifiers" | #6B7280 | #A0AEC0 |
| **Compliance & Audits** | Last audit | "Never" + CTA hint | "7 days ago" | #6B7280 | #A0AEC0 |
| | Status | Hide badge | "Passed"/"Issues"/"Warning" | - | #10B981/#FF6B35/#F59E0B |
| | Reports | "0 available" | "4 available" | #6B7280 | #A0AEC0 |

**Design Pattern:**
- Zero state uses dimmed text (#6B7280 instead of #A0AEC0)
- Some badges are hidden entirely in zero state (Next payment, Status)
- CTA hints ("Generate first proof →", "Run first audit →") encourage first action
- Zero state should feel informative but not empty or broken

---

### Card 1: Private Payroll

**3D Illustration:**
- Visual: Shield with lock, surrounded by floating encrypted coins
- Colors: Gradient from #00D9FF to #7B61FF
- Animation: Subtle floating motion (coins moving up/down)

**Content:**
- **Title:** "Private Payroll"
- **Description:** "Pay employees with fully encrypted balances. Salaries stay private on-chain with zero-knowledge proofs."
- **CTA Button:**
  - Text: "View yours" with shield icon
  - Background: Transparent
  - Border: 1px solid #00D9FF
  - Text color: #00D9FF
  - Hover: Background rgba(0, 217, 255, 0.1), scale(1.02)
  - Icon: Shield with checkmark (16px)

**Metadata (Bottom of card):**
- Small badges showing:
  - **Active state:** Total employees: "12 employees"
  - **Zero state:** Total employees: "0 employees" (with dimmed text #6B7280)

  - **Active state:** Total paid: "$45,230"
  - **Zero state:** Total paid: "$0" (with dimmed text #6B7280)

  - **Active state:** Next payment: "In 3 days"
  - **Zero state:** Next payment: "No scheduled payments" (or hide this badge entirely)
- Font: Inter Medium 12px, #A0AEC0 (active) or #6B7280 (zero state)

---

### Card 2: ZK Verification

**3D Illustration:**
- Visual: Document with checkmark badge, surrounded by circuit patterns
- Colors: Gradient from #7B61FF to #00D9FF
- Animation: Checkmark pulses gently

**Content:**
- **Title:** "ZK Verification"
- **Description:** "Generate credit scores and employment proofs using ZKML. Verify without revealing sensitive data."
- **CTA Button:**
  - Text: "View yours" with sparkles icon
  - Background: Transparent
  - Border: 1px solid #7B61FF
  - Text color: #7B61FF
  - Hover: Background rgba(123, 97, 255, 0.1)
  - Icon: Sparkles/stars (16px)

**Metadata:**
- Small badges:
  - **Active state:** Active proofs: "3 active"
  - **Zero state:** Active proofs: "0 active" (with dimmed text #6B7280 + CTA hint "Generate first proof →")

  - **Active state:** Credit score: "Generated" (shows actual score on hover, e.g., "750")
  - **Zero state:** Credit score: "Not generated" (with dimmed text #6B7280)

  - **Active state:** Employment verified: "2 verifiers"
  - **Zero state:** Employment verified: "0 verifiers" (with dimmed text #6B7280)
- Font: Inter Medium 12px, #A0AEC0 (active) or #6B7280 (zero state)

---

### Card 3: Compliance & Audits

**3D Illustration:**
- Visual: Clipboard with AI brain icon, surrounded by checkmarks and alerts
- Colors: Gradient from #10B981 to #7B61FF
- Animation: Checkmarks appear one by one

**Content:**
- **Title:** "Compliance & Audits"
- **Description:** "AI-powered compliance audits detect pay equity issues, tax irregularities, and fraud with ZK proofs."
- **CTA Button:**
  - Text: "View yours" with document icon
  - Background: Transparent
  - Border: 1px solid #10B981
  - Text color: #10B981
  - Hover: Background rgba(16, 185, 129, 0.1)
  - Icon: Document with checkmark (16px)

**Metadata:**
- Small badges:
  - **Active state:** Last audit: "7 days ago" (relative time)
  - **Zero state:** Last audit: "Never" (with dimmed text #6B7280 + CTA hint "Run first audit →")

  - **Active state:** Status: "Passed" (#10B981 green) or "Issues found" (#FF6B35 orange) or "Warning" (#F59E0B yellow)
  - **Zero state:** Status badge hidden entirely (only show after first audit)

  - **Active state:** Reports: "4 available"
  - **Zero state:** Reports: "0 available" (with dimmed text #6B7280)
- Font: Inter Medium 12px, #A0AEC0 (active) or #6B7280 (zero state)

---

## 👤 EMPLOYEE VIEW - Feature Cards

**Same grid layout as company view** (3 columns, 24px gap)

### Employee Card 1: My Salary

**3D Illustration:**
- Visual: Wallet with encrypted coins flowing in
- Colors: Gradient from #00D9FF to #10B981 (cyan to green)
- Animation: Coins dropping into wallet periodically

**Content:**
- **Title:** "My Salary"
- **Description:** "View your encrypted balance and payment history. Your salary is private—only you can see the actual amounts."
- **CTA Button:**
  - Text: "View balance" with wallet icon
  - Background: Transparent
  - Border: 1px solid #00D9FF
  - Text color: #00D9FF
  - Hover: Background rgba(0, 217, 255, 0.1), scale(1.02)
  - Icon: Wallet (16px)

**Metadata (Bottom of card):**
- Small badges showing:
  - **Active state:** Current balance: "$12,450" (decrypted locally)
  - **Zero state:** Current balance: "$0" (dimmed #6B7280)

  - **Active state:** Last payment: "3 days ago" ($5,000)
  - **Zero state:** Last payment: "Never" (dimmed #6B7280)

  - **Active state:** Total earned: "$45,230 this year"
  - **Zero state:** Total earned: "$0 this year" (dimmed #6B7280)
- Font: Inter Medium 12px, #A0AEC0 (active) or #6B7280 (zero state)

---

### Employee Card 2: Verification Proofs

**3D Illustration:**
- Visual: Badge with shield, surrounded by checkmarks
- Colors: Gradient from #7B61FF to #00D9FF
- Animation: Shield glows when hovering

**Content:**
- **Title:** "Verification Proofs"
- **Description:** "Generate ZK proofs for banks, landlords, and verifiers. Prove your income or employment without revealing your actual salary."
- **CTA Button:**
  - Text: "Manage proofs" with badge icon
  - Background: Transparent
  - Border: 1px solid #7B61FF
  - Text color: #7B61FF
  - Hover: Background rgba(123, 97, 255, 0.1)
  - Icon: Badge/shield (16px)

**Metadata:**
- Small badges:
  - **Active state:** Active proofs: "2 active"
  - **Zero state:** Active proofs: "0 active" (dimmed #6B7280 + CTA hint "Generate first proof →")

  - **Active state:** Credit score: "750 (Excellent)"
  - **Zero state:** Credit score: "Not generated" (dimmed #6B7280)

  - **Active state:** Disclosures granted: "3 verifiers"
  - **Zero state:** Disclosures granted: "0 verifiers" (dimmed #6B7280)
- Font: Inter Medium 12px, #A0AEC0 (active) or #6B7280 (zero state)

---

### Employee Card 3: Employment Status

**3D Illustration:**
- Visual: ID card with checkmark badge
- Colors: Gradient from #10B981 to #00D9FF (green to cyan)
- Animation: Checkmark pulses gently

**Content:**
- **Title:** "Employment Status"
- **Description:** "View your employment details, benefits, and tax withholdings. Share verified employment status with third parties."
- **CTA Button:**
  - Text: "View details" with ID card icon
  - Background: Transparent
  - Border: 1px solid #10B981
  - Text color: #10B981
  - Hover: Background rgba(16, 185, 129, 0.1)
  - Icon: ID card (16px)

**Metadata:**
- Small badges:
  - **Active state:** Status: "Active Employee" (#10B981 green)
  - **Zero state:** Status: "Not employed" (dimmed #6B7280)

  - **Active state:** Company: "Acme Corp" (with company logo)
  - **Zero state:** Company: "—" (hidden)

  - **Active state:** Benefits: "Health, 401k" (or "View all →")
  - **Zero state:** Benefits: "None" (dimmed #6B7280)
- Font: Inter Medium 12px, #A0AEC0 (active) or #6B7280 (zero state)

---

## 🏢 COMPANY VIEW - Quick Stats Section

**4-Column Grid:**

```
💰 $45,230         👥 12 Employees      📊 28 Payments      ✅ 100%
Total Paid         Active               This Month         Compliant
```

(Already documented above - see "Quick Stats Section")

---

## 👤 EMPLOYEE VIEW - Quick Stats Section

**4-Column Grid:**

```
💵 $12,450         📅 $5,000            📊 8 Payments       ✅ Active
Current Balance    Last Payment         This Year          Status
```

**Each Stat Card (Same styling as company view):**
- Background: #151932
- Border: 1px solid #2D3748
- Border-radius: 12px
- Padding: 24px
- Text-align: center

**Stat 1: Current Balance**
- Icon: 💵 (wallet/money)
- **Active state:** "$12,450" (gradient #00D9FF to #7B61FF)
- **Zero state:** "$0" (dimmed #6B7280)
- Label: "Current Balance"
- Change: "+$5,000 this month" (green) or hidden if zero

**Stat 2: Last Payment**
- Icon: 📅 (calendar)
- **Active state:** "$5,000" (gradient #00D9FF to #7B61FF)
- **Zero state:** "$0" (dimmed #6B7280)
- Label: "Last Payment"
- Change: "3 days ago" or "Never" (gray)

**Stat 3: Payments This Year**
- Icon: 📊 (chart)
- **Active state:** "8 Payments" (gradient #00D9FF to #7B61FF)
- **Zero state:** "0 Payments" (dimmed #6B7280)
- Label: "This Year"
- Change: "66% on-time" or hidden if zero

**Stat 4: Employment Status**
- Icon: ✅ (checkmark)
- **Active state:** "Active" (green #10B981)
- **Zero state:** "Inactive" (dimmed #6B7280)
- Label: "Status"
- Change: "Since Jan 2024" or hidden if inactive

---

## 🏢 COMPANY VIEW - Quick Actions

**Floating Panel (bottom-right):**

```
┌─────────────────────────────────┐
│      Quick Actions              │
│  [💸 Pay Employee]              │
│  [➕ Add Employee]              │
│  [🔐 Generate Proof]            │
│  [📊 Run Audit]                 │
└─────────────────────────────────┘
```

(Already documented above)

---

## 👤 EMPLOYEE VIEW - Quick Actions

**Floating Panel (bottom-right):**

```
┌─────────────────────────────────┐
│      Quick Actions              │
│  [💵 Withdraw Salary]           │
│  [🔐 Generate Proof]            │
│  [✅ Grant Disclosure]          │
│  [📄 Download W-2]              │
└─────────────────────────────────┘
```

**Action Buttons:**

**1. Withdraw Salary**
- Icon: 💵 (20px)
- Text: "Withdraw Salary"
- Background: #FF6B35 (orange - primary action)
- Full width, height 40px
- Hover: Brightness increase

**2. Generate Proof**
- Icon: 🔐 (20px)
- Text: "Generate Proof"
- Background: #7B61FF (purple - ZKML)
- Full width

**3. Grant Disclosure**
- Icon: ✅ (20px)
- Text: "Grant Disclosure"
- Background: #00D9FF (cyan - privacy)
- Full width

**4. Download W-2**
- Icon: 📄 (20px)
- Text: "Download W-2"
- Background: #10B981 (green - tax/compliance)
- Full width

**Button Specs:**
- Same as company view (height 40px, gap 8px, etc.)

---

### Featured Companies Section

**Position:** Below main cards
**Padding:** 64px 0
**Background:** Transparent

**Section Header:**
```
┌────────────────────────────────────────────────────────────────────────────┐
│                                                                            │
│                           Featured Companies                               │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

**Title:**
- Text: "Featured Companies"
- Font: Inter Bold 24px
- Color: #FFFFFF
- Center-aligned

**Carousel Layout:**

Horizontal scrollable carousel (drag to scroll, or arrow buttons on desktop)

```
┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐
│  [Icon]  │  │  [Icon]  │  │  [Icon]  │  │  [Icon]  │  │  [Icon]  │
│          │  │          │  │          │  │          │  │          │
│  Acme    │  │  TechCo  │  │  Global  │  │  Startup │  │  Mega    │
│  Corp    │  │  Labs    │  │  Finance │  │  Inc     │  │  Bank    │
│          │  │          │  │          │  │          │  │          │
│ Private  │  │ ZK Credit│  │ Multi-   │  │ Benefits │  │ Recurring│
│ Payroll  │  │ Scoring  │  │ Currency │  │ Tracking │  │ Payments │
│          │  │          │  │          │  │          │  │          │
│    →     │  │    →     │  │    →     │  │    →     │  │    →     │
└──────────┘  └──────────┘  └──────────┘  └──────────┘  └──────────┘
```

**Card Specifications:**
- Width: 220px
- Height: 160px
- Background: #151932
- Border: 1px solid #2D3748
- Border-radius: 12px
- Padding: 20px
- Gap: 16px between cards
- Hover: Border color #00D9FF, scale(1.02)

**Card Content:**
- **Icon:** 48px × 48px company logo placeholder
- **Company Name:** Inter Semibold 16px, #FFFFFF
- **Use Case:** Inter Regular 12px, #A0AEC0 (e.g., "Private Payroll", "ZK Credit Scoring")
- **Arrow:** Bottom-right, #00D9FF, 16px

**Example Companies:**
- Acme Corp (Private Payroll)
- TechCo Labs (ZK Credit Scoring)
- Global Finance (Multi-Currency)
- Startup Inc (Benefits Tracking)
- Mega Bank (Recurring Payments)
- Enterprise LLC (Compliance Audits)

---

## Quick Stats Section

**Position:** Above Featured Companies
**Padding:** 48px 0
**Background:** #0A0E27

### Stats Grid (4 Columns)

```
┌────────────────────────────────────────────────────────────────────────────┐
│                                                                            │
│   💰 $45,230         👥 12 Employees      📊 28 Payments      ✅ 100%      │
│   Total Paid         Active               This Month         Compliant    │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

**Each Stat Card:**
- Background: #151932
- Border: 1px solid #2D3748
- Border-radius: 12px
- Padding: 24px
- Text-align: center

**Content:**
- **Icon:** 32px emoji or icon, centered
- **Number:**
  - **Active state:** Inter Bold 32px, gradient #00D9FF to #7B61FF (e.g., "$45,230")
  - **Zero state:** Inter Bold 32px, dimmed #6B7280 (e.g., "$0")
- **Label:** Inter Regular 14px, #A0AEC0 (always shown)
- **Change indicator:**
  - **Active state:** Small text "+12% this month" (#10B981 green) or "-5% this month" (#EF4444 red)
  - **Zero state:** Hidden (don't show "0% change")

---

## Action Bar (Floating Bottom)

**Position:** Fixed bottom-right
**Width:** 280px
**Background:** #151932
**Border:** 1px solid #00D9FF
**Border-radius:** 16px
**Padding:** 20px
**Shadow:** 0 10px 40px rgba(0, 217, 255, 0.3)
**Z-index:** 999

```
┌─────────────────────────────────┐
│                                 │
│      Quick Actions              │
│                                 │
│  [💸 Pay Employee]              │
│  [➕ Add Employee]              │
│  [🔐 Generate Proof]            │
│  [📊 Run Audit]                 │
│                                 │
└─────────────────────────────────┘
```

**Header:**
- Text: "Quick Actions"
- Font: Inter Semibold 14px
- Color: #A0AEC0
- Margin-bottom: 12px

**Action Buttons (Stack vertically):**
- **Pay Employee:**
  - Icon: 💸 (20px)
  - Text: "Pay Employee"
  - Background: #FF6B35
  - Full width
  - Hover: Brightness increase

- **Add Employee:**
  - Icon: ➕ (20px)
  - Text: "Add Employee"
  - Background: #00D9FF
  - Full width

- **Generate Proof:**
  - Icon: 🔐 (20px)
  - Text: "Generate Proof"
  - Background: #7B61FF
  - Full width

- **Run Audit:**
  - Icon: 📊 (20px)
  - Text: "Run Audit"
  - Background: #10B981
  - Full width

**Button Specs:**
- Height: 40px
- Border-radius: 8px
- Font: Inter Medium 14px
- Gap: 8px between buttons
- Transition: all 0.2s ease
- Hover: scale(1.02), brightness(1.1)

---

## Responsive Breakpoints

```
Desktop:  1440px+ (default)
Laptop:   1024px - 1439px (scale down, 2-column feature cards)
Tablet:   768px - 1023px (stack feature cards)
Mobile:   < 768px (single column, hide action bar, show FAB instead)
```

**Mobile Adjustments:**
- Feature cards: Stack vertically
- Featured companies: Horizontal scroll with snap
- Quick actions: Floating action button (FAB) bottom-right → modal on tap
- Navigation: Hamburger menu
- Stats: 2×2 grid instead of 4 columns

---

## Empty States

### No Employees Yet

```
┌─────────────────────────────────────────┐
│                                         │
│         [Empty state illustration]      │
│                                         │
│       No employees added yet            │
│                                         │
│   Add your first employee to start      │
│   making encrypted salary payments.     │
│                                         │
│        [Add Employee Button]            │
│                                         │
└─────────────────────────────────────────┘
```

### No Proofs Generated

```
┌─────────────────────────────────────────┐
│                                         │
│         [Empty state illustration]      │
│                                         │
│      No ZK proofs generated yet         │
│                                         │
│   Generate your first credit score or   │
│   employment proof using ZKML.          │
│                                         │
│       [Generate Proof Button]           │
│                                         │
└─────────────────────────────────────────┘
```

---

## Modals / Overlays

**Note:** This section documents modals for BOTH company and employee views.

---

## 🏢 COMPANY VIEW - Modals

### Pay Employee Modal

**Trigger:** Click "Pay Employee" from quick actions or feature card
**Size:** 560px width, auto height
**Background:** #151932
**Border:** 1px solid #00D9FF
**Border-radius:** 16px
**Backdrop:** rgba(10, 14, 39, 0.8) with blur

```
┌──────────────────────────────────────────────────┐
│                                                  │
│  Pay Employee                            [X]     │
│  ──────────────────────────────────────────────  │
│                                                  │
│  Employee ID                                     │
│  [alice                                    ▼]    │
│                                                  │
│  Amount (in tokens)                              │
│  [5,000                                      ]    │
│                                                  │
│  ☑ Encrypt balance (recommended)                │
│  ☑ Generate payment proof                       │
│                                                  │
│  Preview:                                        │
│  Employee: Alice Johnson                         │
│  Amount: 5,000 tokens ($50.00)                   │
│  Gas estimate: ~0.001 DUST                       │
│                                                  │
│            [Cancel]  [Pay Employee]              │
│                                                  │
└──────────────────────────────────────────────────┘
```

**Form Fields:**
- Employee dropdown: Searchable, shows employee ID + name
- Amount input: Number field with token symbol
- Checkboxes: Default checked (encrypt + proof)
- Preview section: Shows formatted payment details
- Cancel button: Border #2D3748, text #A0AEC0
- Pay button: Background #FF6B35, text white, loading state

---

### Generate Proof Modal

**Trigger:** Click "Generate Proof" from quick actions
**Size:** 640px width

```
┌──────────────────────────────────────────────────┐
│                                                  │
│  Generate ZK Proof                       [X]     │
│  ──────────────────────────────────────────────  │
│                                                  │
│  Proof Type                                      │
│  ○ Credit Score     ● Employment     ○ Audit     │
│                                                  │
│  Employee ID                                     │
│  [alice                                    ▼]    │
│                                                  │
│  ZKML Model                                      │
│  [XGBoost Credit Scorer v1               ▼]    │
│                                                  │
│  ℹ️  This will generate a zero-knowledge proof   │
│     using your private salary data. The proof    │
│     verifies your credit score without revealing │
│     actual salary amounts.                       │
│                                                  │
│  Estimated time: 30-60 seconds                   │
│  Gas cost: ~0.005 DUST                           │
│                                                  │
│            [Cancel]  [Generate Proof]            │
│                                                  │
└──────────────────────────────────────────────────┘
```

**Progress State (After clicking Generate):**
```
┌──────────────────────────────────────────────────┐
│                                                  │
│  Generating Proof...                             │
│  ──────────────────────────────────────────────  │
│                                                  │
│         [Animated spinner/progress bar]          │
│                                                  │
│  ✓ Loading ZKML model                            │
│  ✓ Fetching encrypted salary data                │
│  ⏳ Computing zero-knowledge proof...            │
│  ⏳ Submitting to blockchain...                  │
│                                                  │
│  This may take up to 60 seconds.                 │
│  Please don't close this window.                 │
│                                                  │
└──────────────────────────────────────────────────┘
```

**Success State:**
```
┌──────────────────────────────────────────────────┐
│                                                  │
│  ✅ Proof Generated Successfully!                │
│  ──────────────────────────────────────────────  │
│                                                  │
│  Credit Score: 750 (Excellent)                   │
│  Proof Hash: 0xa3f2...8b9c                       │
│  Transaction: View on explorer →                 │
│                                                  │
│  Your credit score proof has been stored         │
│  on-chain. Authorized verifiers can now          │
│  check your score without seeing your salary.    │
│                                                  │
│               [Share Proof]  [Close]             │
│                                                  │
└──────────────────────────────────────────────────┘
```

---

## 👤 EMPLOYEE VIEW - Modals

### Withdraw Salary Modal

**Trigger:** Click "Withdraw Salary" from quick actions
**Size:** 560px width, auto height
**Background:** #151932
**Border:** 1px solid #00D9FF
**Border-radius:** 16px
**Backdrop:** rgba(10, 14, 39, 0.8) with blur

```
┌──────────────────────────────────────────────────┐
│                                                  │
│  Withdraw Salary                         [X]     │
│  ──────────────────────────────────────────────  │
│                                                  │
│  Amount to Withdraw                              │
│  [5,000                                      ]    │
│                                                  │
│  Available balance: $12,450                      │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━    │
│                                                  │
│  Withdrawal Address                              │
│  [0xD1fb39...7WjY                          ▼]    │
│                                                  │
│  ☑ Decrypt balance after withdrawal              │
│                                                  │
│  Preview:                                        │
│  Withdraw: $5,000 (5,000 tokens)                 │
│  Remaining balance: $7,450                       │
│  Gas estimate: ~0.002 DUST                       │
│                                                  │
│  ⚠️  Note: This operation is irreversible.       │
│     Funds will be sent to your wallet.           │
│                                                  │
│            [Cancel]  [Withdraw Salary]           │
│                                                  │
└──────────────────────────────────────────────────┘
```

**Form Fields:**
- Amount input: Number field with max button ("Max: $12,450")
- Address dropdown: Connected wallet by default, or custom address
- Checkbox: Decrypt balance (enabled by default)
- Preview section: Shows calculation + gas
- Warning: Orange banner with irreversible warning
- Cancel button: Border #2D3748, text #A0AEC0
- Withdraw button: Background #FF6B35, text white, loading state

**Success State:**
```
┌──────────────────────────────────────────────────┐
│                                                  │
│  ✅ Withdrawal Successful!                       │
│  ──────────────────────────────────────────────  │
│                                                  │
│  Amount: $5,000                                  │
│  Transaction: View on explorer →                 │
│  New balance: $7,450                             │
│                                                  │
│  Your salary has been withdrawn to your wallet.  │
│  It may take a few moments to appear.            │
│                                                  │
│                    [Close]                       │
│                                                  │
└──────────────────────────────────────────────────┘
```

---

### Grant Disclosure Modal

**Trigger:** Click "Grant Disclosure" from quick actions
**Size:** 640px width

```
┌──────────────────────────────────────────────────┐
│                                                  │
│  Grant Employment Disclosure             [X]     │
│  ──────────────────────────────────────────────  │
│                                                  │
│  Disclosure Type                                 │
│  ● Income/Salary   ○ Employment Status           │
│  ○ Credit Score    ○ Full Profile                │
│                                                  │
│  Verifier ID / Address                           │
│  [bank-xyz                                 ▼]    │
│                                                  │
│  Expiration                                      │
│  [30 days                                  ▼]    │
│  Options: 7 days, 30 days, 90 days, 1 year       │
│                                                  │
│  ℹ️  What verifiers will see:                    │
│     • Your employment status (Active/Inactive)   │
│     • Company name (Acme Corp)                   │
│     • Start date (Jan 2024)                      │
│                                                  │
│  ❌ What verifiers will NOT see:                 │
│     • Your actual salary amount                  │
│     • Payment history details                    │
│     • Tax withholdings                           │
│                                                  │
│  Gas cost: ~0.003 DUST                           │
│                                                  │
│            [Cancel]  [Grant Disclosure]          │
│                                                  │
└──────────────────────────────────────────────────┘
```

**Form Fields:**
- Disclosure type: Radio buttons (Income, Employment, Credit Score, Full)
- Verifier dropdown: Searchable, or enter custom address
- Expiration dropdown: Preset durations
- Privacy preview: Shows what IS and ISN'T shared (important for trust!)
- Grant button: Background #00D9FF, text white

**Success State:**
```
┌──────────────────────────────────────────────────┐
│                                                  │
│  ✅ Disclosure Granted!                          │
│  ──────────────────────────────────────────────  │
│                                                  │
│  Verifier: Bank XYZ                              │
│  Type: Employment Status                         │
│  Expires: In 30 days (Dec 1, 2025)               │
│  Proof Hash: 0x8f2a...4c9d                       │
│                                                  │
│  Bank XYZ can now verify your employment status  │
│  without seeing your salary. You can revoke this │
│  disclosure at any time from your profile.       │
│                                                  │
│           [View Disclosures]  [Close]            │
│                                                  │
└──────────────────────────────────────────────────┘
```

---

### Download W-2 Modal

**Trigger:** Click "Download W-2" from quick actions
**Size:** 560px width

```
┌──────────────────────────────────────────────────┐
│                                                  │
│  Download W-2 Tax Form                   [X]     │
│  ──────────────────────────────────────────────  │
│                                                  │
│  Tax Year                                        │
│  [2024                                     ▼]    │
│                                                  │
│  Available W-2 Forms:                            │
│                                                  │
│  ┌────────────────────────────────────────────┐ │
│  │ 📄 W-2 Form 2024                           │ │
│  │ Employer: Acme Corp                        │ │
│  │ Total Earnings: $60,000                    │ │
│  │ Federal Tax: $12,000                       │ │
│  │                        [Download PDF →]    │ │
│  └────────────────────────────────────────────┘ │
│                                                  │
│  ┌────────────────────────────────────────────┐ │
│  │ 📄 W-2 Form 2023                           │ │
│  │ Employer: Acme Corp                        │ │
│  │ Total Earnings: $55,000                    │ │
│  │ Federal Tax: $11,000                       │ │
│  │                        [Download PDF →]    │ │
│  └────────────────────────────────────────────┘ │
│                                                  │
│  ℹ️  W-2 forms are generated annually in        │
│     January. 2024 form will be available         │
│     after Jan 31, 2025.                          │
│                                                  │
│                    [Close]                       │
│                                                  │
└──────────────────────────────────────────────────┘
```

**Features:**
- Year dropdown: Shows available tax years
- W-2 cards: List of available forms
- Each card shows: Employer, Total earnings, Federal tax
- Download button: Generates PDF with encrypted salary data decrypted
- Info banner: Explains when forms are available

---

## Animations & Interactions

### Page Load
1. Navigation bar slides down (0.3s ease-out)
2. Feature cards fade in from bottom, stagger 0.1s each
3. Stats count up when scrolled into view
4. Featured companies carousel auto-scrolls slowly

### Hover States
- All cards: Lift 4px with shadow + border glow
- Buttons: Scale 1.02 + brightness increase
- Links: Underline animation (left to right)

### Transitions
- All interactions: 0.3s ease
- Modal open/close: 0.4s ease with backdrop fade
- Loading states: Spinner rotation 1s linear infinite

---

## Accessibility

### Keyboard Navigation
- All interactive elements focusable (Tab order logical)
- Focus ring: 2px solid #00D9FF with 4px offset
- Modal: Trap focus inside, Esc to close
- Dropdowns: Arrow keys to navigate, Enter to select

### Screen Readers
- All icons have aria-labels
- Modal announcements: "Dialog opened: Pay Employee"
- Form validation: Error messages announced
- Loading states: "Loading, please wait" announced

---

## State Management

### User States

**1. New User (No Activity)**
- Show empty states on all feature cards
- Highlight "Add Employee" action
- Show onboarding tooltip: "Start by adding your first employee"

**2. Active User (Has Employees)**
- Show actual stats (payments, employees, compliance status)
- Hide empty states
- Enable all quick actions

**3. Pending Transactions**
- Show loading indicator on relevant card
- Disable duplicate actions
- Update stats in real-time when transaction confirms

**4. Error States**
- Show error banner at top: "Transaction failed - Retry"
- Highlight problematic area (e.g., insufficient balance)
- Provide actionable error message

---

## Performance Targets

- Time to Interactive: < 2s
- First Contentful Paint: < 1s
- Smooth 60fps animations
- Lazy load featured companies carousel
- Cache user stats (refresh every 30s)

---

## Development Notes

### Tech Stack
- Framework: Next.js 14 (App Router)
- State: Zustand or Jotai for global state
- Forms: React Hook Form + Zod validation
- Animations: Framer Motion
- Web3: Midnight SDK (wallet connection, contract calls)
- Icons: Lucide React

### Component Structure
```
components/
├── layout/
│   ├── AppNavigation.tsx
│   ├── AlertBanner.tsx
│   ├── QuickActions.tsx
├── dashboard/
│   ├── FeatureCard.tsx
│   ├── StatsGrid.tsx
│   ├── FeaturedCompanies.tsx
│   ├── EmptyState.tsx
├── modals/
│   ├── PayEmployeeModal.tsx
│   ├── AddEmployeeModal.tsx
│   ├── GenerateProofModal.tsx
│   ├── RunAuditModal.tsx
├── ui/
│   ├── Button.tsx
│   ├── Input.tsx
│   ├── Select.tsx
│   ├── Card.tsx
│   ├── Modal.tsx
```

### API Endpoints
```
GET  /api/dashboard/stats        - User stats (payments, employees, etc.)
GET  /api/dashboard/companies    - Featured companies list
POST /api/payroll/pay-employee   - Pay employee transaction
POST /api/payroll/add-employee   - Add new employee
POST /api/zkml/generate-proof    - Generate ZK proof
POST /api/audit/run              - Run compliance audit
```

---

## Next Steps

After implementing this dashboard:
1. **Payroll Tab** - Detailed employee list, payment history, recurring schedules
2. **Verification Tab** - Manage proofs, grant/revoke disclosures, view verifications
3. **Audits Tab** - View audit reports, run custom audits, LLM query interface
4. **Settings** - Company profile, notifications, API keys, webhooks

---

## Role-Based Dashboard Comparison Table

| Element | 🏢 Company View | 👤 Employee View |
|---------|----------------|------------------|
| **Page Header** | "zkSalaria Overview" | "My Dashboard" |
| **Nav Tabs** | Home, Payroll, Verification, Audits | Home, My Salary, Verification, My Profile |
| **Alert Examples** | "⚠️ Pay Equity Issues", "💰 3 Pending Payments" | "💵 New Payment Received", "🔐 Verification Request" |
| **Card 1 Title** | Private Payroll | My Salary |
| **Card 1 Focus** | Manage employees, make payments | View balance, payment history |
| **Card 1 Metadata** | Total employees, Total paid, Next payment | Current balance, Last payment, Total earned |
| **Card 2 Title** | ZK Verification | Verification Proofs |
| **Card 2 Focus** | View employee proofs (read-only) | Generate proofs, grant disclosures |
| **Card 2 Metadata** | Active proofs, Credit score, Verifiers | Active proofs, Credit score, Disclosures granted |
| **Card 3 Title** | Compliance & Audits | Employment Status |
| **Card 3 Focus** | Run audits, view compliance reports | View status, benefits, tax withholdings |
| **Card 3 Metadata** | Last audit, Status, Reports | Status, Company, Benefits |
| **Stat 1** | 💰 Total Paid ($45,230) | 💵 Current Balance ($12,450) |
| **Stat 2** | 👥 Employees (12) | 📅 Last Payment ($5,000) |
| **Stat 3** | 📊 Payments This Month (28) | 📊 Payments This Year (8) |
| **Stat 4** | ✅ Compliance (100%) | ✅ Employment Status (Active) |
| **Quick Action 1** | 💸 Pay Employee | 💵 Withdraw Salary |
| **Quick Action 2** | ➕ Add Employee | 🔐 Generate Proof |
| **Quick Action 3** | 🔐 Generate Proof | ✅ Grant Disclosure |
| **Quick Action 4** | 📊 Run Audit | 📄 Download W-2 |
| **Featured Section** | Featured Companies (visible) | Hide Featured Companies section |
| **Primary Color** | #00D9FF (cyan - privacy) | #00D9FF (cyan - privacy) |
| **Secondary Color** | #FF6B35 (orange - payments) | #10B981 (green - earnings) |
| **Data Privacy** | See aggregated encrypted data | See only their own decrypted data |

---

## Comparison to Sablier

**What we adapted:**
- ✅ Clean 3-card overview layout
- ✅ Network selector in nav bar
- ✅ Alert banner for new features
- ✅ Featured users/companies carousel
- ✅ "View yours" CTA pattern
- ✅ Dark theme with brand color accents

**What's unique to zkSalaria:**
- 🔐 Privacy-focused cards (encrypted balances, ZK proofs)
- 🤖 ZKML verification features (not in Sablier)
- 🏦 Compliance & audit emphasis (not in Sablier)
- 💼 Company-centric (vs Sablier's DAO/vesting focus)
- 🌙 Midnight Network branding (vs multi-chain)
- ⚡ Quick actions floating panel (more actions than Sablier)

**Visual differentiation:**
- Sablier: Orange accents (#FF8B3D)
- zkSalaria: Cyan (#00D9FF) for privacy + Purple (#7B61FF) for ZKML
- Sablier: 3D gift/lock illustrations
- zkSalaria: 3D shield/circuit/brain illustrations emphasizing privacy/AI
