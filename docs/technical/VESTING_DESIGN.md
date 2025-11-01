# zkSalaria Vesting Feature - Complete Design Specification

**Status:** Future Enhancement (Out of Scope for MVP)
**Version:** 1.0
**Date:** 2025-10-31
**Purpose:** Token vesting feature for equity compensation (separate from payroll)

---

## Executive Summary

This document specifies the **Token Vesting** feature for zkSalaria - a future enhancement that extends beyond traditional payroll to include **equity/token compensation** with time-locked grants.

**Key Difference from Payroll:**
- **Payroll** = Pay-as-you-go (work done → get paid immediately)
- **Vesting** = Grant-upfront (tokens locked → unlock over time based on schedule)

**Why Add Vesting:**
- Completes the compensation story (salary + equity = total comp)
- Competitive differentiation from Sablier (adds ZK privacy to vesting)
- Natural fit for web3 companies (many pay salary + token grants)
- Reuses zkSalaria's encrypted balance infrastructure

---

## Payroll vs Vesting - Core Differences

| Aspect | 💼 Payroll (Current) | 🌱 Vesting (Future) |
|--------|----------------------|---------------------|
| **Payment Model** | Pay-as-you-go (work → paid) | Grant-upfront (locked → unlock) |
| **Timing** | Recurring intervals (biweekly, monthly) | Time-based unlock (daily, monthly over years) |
| **Access** | Immediate access after payment | Delayed access (cliff + linear unlock) |
| **Cancellation** | Cannot undo payment | Can cancel unvested tokens if employee leaves |
| **Use Case** | Regular salary compensation | Equity/token compensation (startups, DAOs) |
| **Tax Treatment** | Taxed when received | Taxed when vested (or when exercised) |
| **Privacy Need** | Salary amount privacy | Vesting amount privacy (total grant, vested) |
| **ZKML Use** | Credit scoring, fraud detection | Vesting proof ("I have vested tokens worth > $X") |

---

## Smart Contract Differences

### Current Payroll Contract

```compact
// Simple payment model (zkSalaria MVP)
pay_employee(employee_id, amount) {
  // Transfer from company balance → employee balance
  // Employee can withdraw immediately
  // Payment recorded in history
}
```

**Key State:**
- `encrypted_employee_balances` - Current available balance
- `employee_payment_history` - Past payments

---

### New Vesting Contract (Future)

```compact
// Complex time-locked model
grant_vesting(employee_id, total_amount, start_date, cliff_months, duration_months) {
  // Create vesting schedule (tokens locked in contract)
  // No tokens accessible until cliff period
  // After cliff: Linear unlock over duration
}

calculate_vested_amount(employee_id, current_timestamp) -> Uint<64> {
  // Calculate how many tokens are vested based on time
  // If before cliff: return 0
  // If after cliff: return (total * (time_elapsed / total_duration))
}

withdraw_vested(employee_id, amount) {
  // Only allow withdrawal of vested amount
  // vested_amount = calculate_vested_amount(employee_id, now)
  // if amount > vested_amount: reject
}

cancel_vesting(employee_id) {
  // Company can cancel if employee leaves
  // Vested tokens stay with employee
  // Unvested tokens return to company
}
```

**Key State:**
```compact
// Vesting schedules
export ledger vesting_schedules: Map<Bytes<32>, VestingGrant>;
export ledger vesting_withdrawn_amounts: Map<Bytes<32>, Uint<64>>;
export ledger vesting_cancelled: Map<Bytes<32>, Bool>;

struct VestingGrant {
  employee_id: Bytes<32>,
  company_id: Bytes<32>,
  total_amount: Uint<64>,           // Total tokens granted
  start_timestamp: Uint<64>,        // When vesting begins
  cliff_months: Uint<8>,            // Months until first unlock (typically 12)
  duration_months: Uint<16>,        // Total vesting period (typically 48)
  vesting_type: Uint<8>,            // 1=linear continuous, 2=monthly chunks
  is_active: Bool,
  created_timestamp: Uint<64>
}
```

---

## UX Differences

### 🏢 Company View - Vesting Tab

**New Navigation Tab:** "Vesting" (separate from "Payroll")

**Main Dashboard Card:**

```
┌─────────────────────────────────────────┐
│                                         │
│    Grant Token Vesting                  │
│                                         │
│ Total Granted: 1,200,000 tokens         │
│ Total Vested: 450,000 tokens (37.5%)    │
│ Unvested: 750,000 tokens                │
│                                         │
│        [Grant New Vesting →]            │
│                                         │
└─────────────────────────────────────────┘
```

**Vesting Schedule Visualization:**

```
Employee: Alice Johnson

Total Grant: 100,000 tokens
Cliff: 12 months (Jan 1, 2025)
Duration: 48 months (Jan 1, 2025 - Jan 1, 2029)

Timeline:
├─────────────┼─────────────────────────────────┤
0%            25%                              100%
Jan 2024      Jan 2025 (cliff)                Jan 2029

Current Progress: ████████░░░░░░░░░░░░░░░░░░░░ 37.5%
Vested: 37,500 tokens
Withdrawn: 10,000 tokens
Available to withdraw: 27,500 tokens
```

**Grant Vesting Modal:**

```
┌──────────────────────────────────────────────────┐
│  Grant Token Vesting                      [X]    │
│  ──────────────────────────────────────────────  │
│                                                  │
│  Employee                                        │
│  [alice                                    ▼]    │
│                                                  │
│  Total Grant Amount                              │
│  [100,000 tokens                            ]    │
│                                                  │
│  Vesting Schedule                                │
│  [○ Standard (4yr, 1yr cliff)                    │
│   ● Custom                                   ]   │
│                                                  │
│  Start Date                                      │
│  [Jan 1, 2024                              ▼]    │
│                                                  │
│  Cliff Period (months)                           │
│  [12                                        ]    │
│                                                  │
│  Total Duration (months)                         │
│  [48                                        ]    │
│                                                  │
│  Vesting Type                                    │
│  [● Linear (continuous unlock)                   │
│   ○ Monthly (unlock each month)             ]   │
│                                                  │
│  Preview:                                        │
│  • Cliff: 25,000 tokens unlock on Jan 1, 2025   │
│  • Monthly after cliff: 2,083 tokens/month       │
│  • Fully vested: Jan 1, 2029                     │
│                                                  │
│  ☑ Allow early exercise (employee can buy       │
│     unvested tokens at strike price)             │
│                                                  │
│            [Cancel]  [Grant Vesting]             │
│                                                  │
└──────────────────────────────────────────────────┘
```

---

### 👤 Employee View - Vesting Tab

**New Navigation Tab:** "My Vesting" (separate from "My Salary")

**Main Vesting Card:**

```
┌─────────────────────────────────────────┐
│                                         │
│    My Token Vesting                     │
│                                         │
│ Total Grant: 100,000 tokens             │
│ Vested: 37,500 tokens ████████░░░░░░    │
│ Withdrawn: 10,000 tokens                │
│ Available: 27,500 tokens                │
│                                         │
│        [Withdraw Vested Tokens →]       │
│                                         │
└─────────────────────────────────────────┘
```

**Vesting Timeline (Interactive Chart):**

```
Your Vesting Progress

100k ┤                                    ╭─────
     │                              ╭────╯
     │                         ╭────╯
 50k ┤                    ╭────╯
     │               ╭────╯
     │          ╭────╯
     │     ╭────╯
  0k ┼─────┤
     │     │
   Jan'24  Jan'25 (cliff)        Jan'29
           ▲
           You are here (37.5% vested)

Next unlock: 2,083 tokens in 30 days
```

**Withdraw Vested Tokens Modal:**

```
┌──────────────────────────────────────────────────┐
│  Withdraw Vested Tokens                   [X]    │
│  ──────────────────────────────────────────────  │
│                                                  │
│  Amount to Withdraw                              │
│  [27,500                                    ]    │
│                                                  │
│  Available to withdraw: 27,500 tokens            │
│  (37,500 vested - 10,000 already withdrawn)      │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━    │
│                                                  │
│  ⚠️  You have 62,500 unvested tokens remaining.  │
│     These will unlock over the next 30 months.   │
│                                                  │
│  Next unlock: Feb 1, 2025 (2,083 tokens)         │
│                                                  │
│  Preview:                                        │
│  Withdraw: 27,500 tokens                         │
│  Gas estimate: ~0.002 DUST                       │
│                                                  │
│            [Cancel]  [Withdraw Tokens]           │
│                                                  │
└──────────────────────────────────────────────────┘
```

---

## Navigation Structure Options

### Option 1: Separate Tabs (Recommended)

**Company Navigation:**
- Home
- **Payroll** (regular salary payments)
- **Vesting** (token grants)
- Verification
- Audits

**Employee Navigation:**
- Home
- **My Salary** (regular payments)
- **My Vesting** (token grants)
- Verification
- My Profile

**Why Separate:**
- Different mental models (immediate vs time-locked)
- Different actions (pay vs grant vs withdraw vested)
- Different visualizations (payment history vs vesting timeline)
- Clearer user experience

---

### Option 2: Combined Compensation Tab

**Company Navigation:**
- Home
- **Compensation** (includes payroll + vesting)
  - Subtabs: Salary | Vesting | Benefits | Tax
- Verification
- Audits

**Employee Navigation:**
- Home
- **My Compensation** (includes salary + vesting)
  - Subtabs: Salary | Vesting | Benefits | Tax
- Verification
- My Profile

**Why Combined:**
- More streamlined navigation
- Unified view of total compensation
- Easier to see total earnings

---

## Key Privacy Considerations

**What Should Be Encrypted:**
1. ✅ **Total grant amount** - Encrypted (like salary)
2. ✅ **Vested amount** - Encrypted (only employee sees)
3. ✅ **Withdrawn amount** - Encrypted

**What Must Be Public:**
1. ❌ **Vesting schedule dates** - Public (needed for on-chain calculation)
2. ❌ **Cliff period** - Public
3. ❌ **Duration** - Public

**Why Some Fields Are Public:**
- Smart contract needs to calculate vested amount on-chain
- Calculation requires `current_timestamp - start_date` math
- If we encrypt the schedule, contract can't verify withdrawals
- **Trade-off:** Schedule is public, but amounts stay private

**ZKML Enhancement for Vesting:**
- Employee could generate ZK proof: "I have vested tokens worth > $X"
- Useful for showing financial stability without revealing exact grant
- Pattern: Off-chain ZKML → generate proof → verify on-chain

---

## Smart Contract Implementation

### Core Circuits

```compact
// 1. Grant vesting schedule
export circuit grant_vesting(
  employee_id: Bytes<32>,
  total_amount: Uint<64>,
  start_timestamp: Uint<64>,
  cliff_months: Uint<8>,
  duration_months: Uint<16>,
  vesting_type: Uint<8>
): Ledger {
  // Verify company has sufficient balance
  // Create VestingGrant on ledger
  // Deduct total_amount from company balance (locked)
  // Emit event
}

// 2. Calculate vested amount (pure function, no state change)
pure circuit calculate_vested_amount(
  grant: VestingGrant,
  current_timestamp: Uint<64>
): Uint<64> {
  // If before start: return 0
  // If before cliff: return 0
  // If after cliff but before end:
  //   time_elapsed = current_timestamp - (start_timestamp + cliff_months)
  //   vested_fraction = time_elapsed / duration_months
  //   vested = total_amount * vested_fraction
  // If after end: return total_amount
}

// 3. Withdraw vested tokens
export circuit withdraw_vested(
  employee_id: Bytes<32>,
  amount: Uint<64>
): Ledger {
  // Get vesting grant for employee
  // Calculate vested amount
  // Check: amount <= (vested - already_withdrawn)
  // Transfer tokens to employee
  // Update vesting_withdrawn_amounts
}

// 4. Cancel vesting (if employee leaves)
export circuit cancel_vesting(
  employee_id: Bytes<32>,
  company_id: Bytes<32>
): Ledger {
  // Only company can cancel
  // Get vesting grant
  // Calculate vested amount (employee keeps)
  // Calculate unvested amount (company gets back)
  // Transfer vested to employee
  // Return unvested to company
  // Mark grant as cancelled
}

// 5. Accelerate vesting (emergency/acquisition)
export circuit accelerate_vesting(
  employee_id: Bytes<32>,
  new_cliff_months: Uint<8>,
  new_duration_months: Uint<16>
): Ledger {
  // Only company can accelerate
  // Update grant schedule to faster vesting
  // Common in acquisitions or emergency situations
}
```

---

## Ledger State

```compact
// Vesting grants
export ledger vesting_schedules: Map<Bytes<32>, VestingGrant>;

// Track how much each employee has withdrawn
export ledger vesting_withdrawn_amounts: Map<Bytes<32>, Uint<64>>;

// Track cancelled grants
export ledger vesting_cancelled: Map<Bytes<32>, Bool>;

struct VestingGrant {
  employee_id: Bytes<32>,
  company_id: Bytes<32>,
  total_amount: Uint<64>,           // Total tokens granted
  start_timestamp: Uint<64>,        // When vesting begins
  cliff_months: Uint<8>,            // Months until first unlock (typically 12)
  duration_months: Uint<16>,        // Total vesting period (typically 48)
  vesting_type: Uint<8>,            // 1=linear continuous, 2=monthly chunks
  is_active: Bool,
  created_timestamp: Uint<64>
}
```

---

## Vesting Calculation Examples

### Standard 4-Year Vesting with 1-Year Cliff

**Grant:** 100,000 tokens on Jan 1, 2024
**Cliff:** 12 months
**Duration:** 48 months

**Timeline:**

| Date | Months Elapsed | Vested Amount | Available to Withdraw |
|------|----------------|---------------|----------------------|
| Jan 1, 2024 | 0 | 0 | 0 |
| Dec 31, 2024 | 11.9 | 0 (before cliff) | 0 |
| Jan 1, 2025 | 12 | 25,000 (cliff unlock) | 25,000 |
| Feb 1, 2025 | 13 | 27,083 | 27,083 |
| Jul 1, 2025 | 18 | 37,500 | 37,500 |
| Jan 1, 2026 | 24 | 50,000 | 50,000 |
| Jan 1, 2027 | 36 | 75,000 | 75,000 |
| Jan 1, 2028 | 48 | 100,000 (fully vested) | 100,000 |

**Calculation After Cliff:**
```
vested_amount = total_amount * ((current_months - cliff_months) / (duration_months - cliff_months))
vested_amount = 100,000 * ((24 - 12) / (48 - 12))
vested_amount = 100,000 * (12 / 36)
vested_amount = 100,000 * 0.333...
vested_amount = 33,333 tokens
```

---

## Comparison to Sablier

**Sablier Focus:**
- Public token streaming and vesting
- Multi-chain deployment
- DAOs and protocol treasuries
- ❌ **No privacy** - All vesting schedules and amounts are public

**zkSalaria Vesting Focus:**
- Private vesting with encrypted amounts
- Midnight Network only
- Companies and employees
- ✅ **Privacy** - Grant amounts encrypted, schedules public

**Competitive Positioning:**
- **Sablier:** "Public vesting infrastructure"
- **zkSalaria:** "Private compensation platform (payroll + vesting)"

---

## Should zkSalaria Support Vesting?

### Arguments FOR

1. ✅ **Completes the compensation story** - Salary + equity = total comp
2. ✅ **Competitive differentiation** - Sablier does vesting well, but not with ZK privacy
3. ✅ **Startup/DAO use case** - Many web3 companies pay salary + token vesting
4. ✅ **Reuses infrastructure** - Same encrypted balance system, same ZKML proofs
5. ✅ **Natural fit** - Midnight Network is perfect for private vesting (hide equity grants)

### Arguments AGAINST

1. ❌ **Scope creep** - Adds complexity to MVP
2. ❌ **Different user journey** - Vesting users ≠ payroll users (DAOs vs companies)
3. ❌ **Sablier already exists** - Well-tested vesting protocol on multiple chains
4. ❌ **Phase 2 feature** - Better to nail payroll first

---

## Recommendation

**Phase 1 (Now):** Focus on **payroll only**
- Get encrypted salaries right
- Nail ZKML credit scoring
- Ship compliance audits
- Perfect the employee/company UX

**Phase 2 (Later):** Add **vesting as a separate tab**
- Keep payroll and vesting mentally separate (different tabs)
- Reuse encrypted balance primitives
- Add vesting-specific circuits
- Add timeline visualizations
- Market as "Complete private compensation platform"

**Positioning:**
- **Sablier:** Public token streaming and vesting (no privacy)
- **zkSalaria:** Private payroll + private vesting (ZK privacy on Midnight)

---

## Implementation Roadmap (If Approved)

### Phase 6: Token Vesting (Future)

**Timeline:** 4-6 weeks after MVP launch

**Week 1-2: Smart Contracts**
- [ ] Create VestingContract.compact
- [ ] Implement vesting circuits:
  - `grant_vesting()`
  - `calculate_vested_amount()`
  - `withdraw_vested()`
  - `cancel_vesting()`
  - `accelerate_vesting()`
- [ ] Add vesting ledger state (VestingGrant struct)
- [ ] Test vesting calculations with various schedules
- [ ] Test cliff periods, cancellations, accelerations

**Week 3-4: API Layer**
- [ ] Create vesting-api package (following payroll-api patterns)
- [ ] Add VestingAPI class with RxJS reactive state
- [ ] Implement API methods:
  - `grantVesting()`
  - `getVestingSchedule()`
  - `withdrawVested()`
  - `cancelVesting()`
  - `accelerateVesting()`
- [ ] Add vesting state to dashboard (total granted, vested, available)
- [ ] Write integration tests

**Week 5-6: UI Development**
- [ ] Add "Vesting" tab to company dashboard
- [ ] Add "My Vesting" tab to employee dashboard
- [ ] Build grant vesting modal
- [ ] Build vesting timeline visualization (chart)
- [ ] Build withdraw vested tokens modal
- [ ] Add ZKML vesting proof generation (optional)
- [ ] Polish and test

**Deliverable:** Complete private vesting feature integrated with payroll

---

## Technical Challenges

### Challenge 1: On-Chain Time-Based Calculations

**Problem:** Smart contract needs to calculate vested amount based on current timestamp
**Solution:** Use `current_timestamp` from Midnight blockchain + pure circuit for calculation
**Note:** This is already proven in DeFi protocols (Compound, Aave use time-based calculations)

### Challenge 2: Cliff Handling

**Problem:** No tokens should be accessible until cliff period ends
**Solution:**
```compact
if (current_timestamp < start_timestamp + (cliff_months * 30 * 86400)) {
  return 0; // Before cliff
}
```

### Challenge 3: Linear vs Monthly Vesting

**Problem:** Some companies want continuous unlock, others want monthly chunks
**Solution:** `vesting_type` field:
- Type 1 (Linear): Calculate based on seconds elapsed
- Type 2 (Monthly): Calculate based on months elapsed, round down

### Challenge 4: Cancellation Edge Cases

**Problem:** What if employee withdraws some vested tokens, then company cancels?
**Solution:**
```compact
vested_amount = calculate_vested_amount(grant, now)
already_withdrawn = vesting_withdrawn_amounts[employee_id]
employee_gets = max(0, vested_amount - already_withdrawn)
company_gets_back = total_amount - vested_amount
```

---

## Alternative: Integrate Sablier

**Instead of building vesting in-house, could we integrate Sablier?**

**Option:** Add Sablier as a separate feature in zkSalaria
- Company creates vesting stream on Sablier
- zkSalaria tracks vesting schedule reference
- Employee withdraws from Sablier directly
- zkSalaria shows unified view (salary + vesting)

**Pros:**
- ✅ Leverage existing battle-tested vesting protocol
- ✅ Multi-chain support (if Sablier on Midnight eventually)
- ✅ Less development work

**Cons:**
- ❌ Sablier is public (no privacy)
- ❌ Two separate systems (complexity)
- ❌ Different UX patterns
- ❌ Sablier not on Midnight Network yet

**Recommendation:** Build native vesting for privacy consistency

---

## Conclusion

**Token vesting is a natural extension of zkSalaria**, but should be deferred until after MVP launch.

**Priority:**
1. **Phase 0-1:** Encrypted payroll (DONE)
2. **Phase 2:** ZKML credit scoring (IN PROGRESS)
3. **Phase 3:** UI development
4. **Phase 4:** LLM integration
5. **Phase 5:** Deployment & demo
6. **Phase 6 (Future):** Token vesting ← THIS DOCUMENT

**When to Build:**
- After MVP has paying customers
- After ZKML features are proven
- After UI/UX is polished
- When customers specifically request vesting

**Value Prop:**
> "zkSalaria: The only private compensation platform. Salary + equity, all encrypted."

---

## References

- **Sablier Protocol:** https://sablier.com/ (public vesting competitor)
- **zkSalaria Payroll:** Current implementation (encrypted salary payments)
- **Midnight Bank Contract:** Encrypted balance pattern (architecture reference)
- **ZKML Technical Deep Dive:** Off-chain proof generation, on-chain verification

---

*This is a future enhancement. Not in scope for current MVP development.*
