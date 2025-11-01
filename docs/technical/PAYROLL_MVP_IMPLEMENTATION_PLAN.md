# Payroll MVP Implementation Plan

**Version:** 1.0
**Date:** 2025-10-31
**Scope:** Complete payroll automation with recurring payments, batch processing, and smart scheduling

---

## Executive Summary

Based on user decisions, we're building a **complete payroll MVP** with:

✅ **Recurring Payments** - Automated biweekly/monthly payroll
✅ **Hybrid Salary Storage** - Default base salary with override capability
✅ **Batch Payments** - Pay all employees in single transaction
✅ **Recurring Schedule** - Set it and forget it automation
✅ **Automatic Execution** - Trustless smart contract execution

**MVP Timeline:** 6-8 weeks
**Target:** Feature parity with Gusto/Rippling core payroll (minus tax withholding)

---

## Architecture Overview

### Smart Contract Layer (Compact)

```
payroll.compact
├── Employee Management
│   ├── add_employee(id, wallet, base_salary, role)
│   ├── remove_employee(id)
│   └── update_employee_salary(id, new_salary)
├── One-Time Payments
│   ├── pay_employee(id, amount)
│   └── batch_pay_employees([ids], [amounts])
├── Recurring Payments
│   ├── setup_recurring_payment(id, amount, frequency, start_date)
│   ├── execute_recurring_payment(schedule_id)
│   └── cancel_recurring_payment(schedule_id)
└── Ledger State
    ├── employees: Map<employee_id, EmployeeData>
    ├── encrypted_balances: Map<employee_id, EncryptedBalance>
    ├── recurring_schedules: Map<schedule_id, RecurringSchedule>
    └── payment_history: Array<PaymentRecord>
```

### Off-Chain Services Layer (TypeScript)

```
payroll-api/
├── PaymentScheduler (Cron Service)
│   ├── Monitor recurring_schedules every minute
│   ├── Trigger execute_recurring_payment when due
│   └── Handle failures and retries
├── NotificationService
│   ├── Email employees when paid
│   ├── Webhook to accounting systems
│   └── Alert company on payment failures
└── PayrollAPI (SDK)
    ├── Company operations (add employee, setup payroll)
    ├── Employee operations (view balance, withdraw)
    └── Admin operations (reports, audits)
```

### UI Layer (React)

```
payroll-ui/
├── Company Dashboard
│   ├── Add Employee page
│   ├── Pay Employee page (one-time)
│   ├── Setup Recurring Payment page
│   ├── Run Payroll page (batch)
│   └── Payment History page
└── Employee Dashboard
    ├── My Salary page
    ├── Payment History page
    └── Withdraw page
```

---

## Smart Contract Circuits

### 1. Employee Management

#### `add_employee`

**Purpose:** Register employee with base salary (stored encrypted)

**Circuit:**
```compact
circuit add_employee(
  Bytes<32> employee_id,
  Address employee_wallet,
  Uint<64> base_salary,
  Bytes<32> role
): Void {
  // Validate inputs
  assert(base_salary > 0, "Salary must be positive");
  assert(!employees.has(employee_id), "Employee already exists");

  // Encrypt base salary with company key
  let encrypted_salary = encrypt_with_company_key(base_salary);

  // Store employee data
  employees.insert(employee_id, EmployeeData {
    wallet: employee_wallet,
    encrypted_base_salary: encrypted_salary,
    role: role,
    active: true,
    created_at: current_timestamp()
  });

  // Initialize employee balance to 0
  encrypted_balances.insert(employee_id, encrypt_zero());

  // Emit event
  emit EmployeeAdded(employee_id, role);
}
```

**Inputs:**
- `employee_id`: Unique identifier (e.g., "alice")
- `employee_wallet`: Midnight wallet address
- `base_salary`: Monthly/biweekly salary (encrypted on-chain)
- `role`: Job title (e.g., "Engineer", "Designer")

**Ledger Updates:**
- Add to `employees` map
- Initialize `encrypted_balances[employee_id] = 0`

---

#### `update_employee_salary`

**Purpose:** Change employee's base salary (for raises, promotions)

**Circuit:**
```compact
circuit update_employee_salary(
  Bytes<32> employee_id,
  Uint<64> new_salary
): Void {
  // Validate
  assert(employees.has(employee_id), "Employee not found");
  assert(new_salary > 0, "Salary must be positive");

  // Update encrypted salary
  let employee = employees.get(employee_id);
  employee.encrypted_base_salary = encrypt_with_company_key(new_salary);
  employees.insert(employee_id, employee);

  emit SalaryUpdated(employee_id, new_salary);
}
```

---

### 2. One-Time Payments

#### `pay_employee`

**Purpose:** Pay single employee (already implemented ✅)

**Circuit:**
```compact
circuit pay_employee(
  Bytes<32> employee_id,
  Uint<64> amount
): Void {
  // Already implemented in Phase 0
  // 1. Decrypt company balance
  // 2. Decrypt employee balance
  // 3. Transfer: company_bal -= amount; employee_bal += amount
  // 4. Re-encrypt both balances
  // 5. Update balance_mappings
  // 6. Append to payment_history
}
```

**Status:** ✅ COMPLETED (Phase 0)

---

#### `batch_pay_employees` (NEW)

**Purpose:** Pay multiple employees in single transaction (gas efficiency)

**Circuit:**
```compact
circuit batch_pay_employees(
  Array<Bytes<32>> employee_ids,
  Array<Uint<64>> amounts
): Void {
  // Validate inputs
  assert(employee_ids.length == amounts.length, "Mismatched arrays");
  assert(employee_ids.length > 0, "Empty batch");
  assert(employee_ids.length <= 100, "Batch too large"); // Gas limit

  // Calculate total amount needed
  let total_amount = 0;
  for (let i = 0; i < amounts.length; i++) {
    total_amount += amounts[i];
  }

  // Decrypt company balance once
  let company_balance = decrypt_company_balance();
  assert(company_balance >= total_amount, "Insufficient balance");

  // Process each employee
  for (let i = 0; i < employee_ids.length; i++) {
    let employee_id = employee_ids[i];
    let amount = amounts[i];

    // Validate employee exists
    assert(employees.has(employee_id), "Employee not found");

    // Decrypt employee balance
    let employee_balance = decrypt_employee_balance(employee_id);

    // Transfer
    company_balance -= amount;
    employee_balance += amount;

    // Re-encrypt and store
    encrypted_balances.insert(
      employee_id,
      encrypt_with_employee_key(employee_balance, employee_id)
    );

    // Record payment
    payment_history.push(PaymentRecord {
      employee_id: employee_id,
      amount: amount,
      timestamp: current_timestamp(),
      type: "batch_payroll"
    });
  }

  // Update company balance once
  company_encrypted_balance = encrypt_with_company_key(company_balance);

  // Emit event
  emit BatchPaymentProcessed(employee_ids.length, total_amount);
}
```

**Gas Optimization:**
- Decrypt company balance ONCE (not per employee)
- Single transaction (not 12 separate transactions for 12 employees)
- Batch limit: 100 employees (avoid gas limit issues)

**Use Case:**
```typescript
// Pay all 12 employees at once
await payroll.batch_pay_employees(
  ["alice", "bob", "carol", ...], // 12 employee IDs
  [5000, 6500, 4200, ...]        // 12 salaries
);
// Result: Single transaction, ~5-10x cheaper gas than 12 individual payments
```

---

### 3. Recurring Payments

#### `setup_recurring_payment` (NEW)

**Purpose:** Create automated payment schedule (biweekly, monthly)

**Circuit:**
```compact
struct RecurringSchedule {
  schedule_id: Bytes<32>,
  employee_id: Bytes<32>,
  amount: Uint<64>,           // Encrypted payment amount
  frequency: Uint<32>,        // Seconds between payments (e.g., 1209600 = 2 weeks)
  start_date: Uint<64>,       // Unix timestamp
  next_payment_date: Uint<64>, // Next scheduled payment
  end_date: Option<Uint<64>>,  // Optional end date
  active: Boolean,
  created_at: Uint<64>
}

circuit setup_recurring_payment(
  Bytes<32> employee_id,
  Uint<64> amount,
  Uint<32> frequency,        // 604800 (1 week), 1209600 (2 weeks), 2592000 (1 month)
  Uint<64> start_date,
  Option<Uint<64>> end_date
): Bytes<32> {
  // Validate
  assert(employees.has(employee_id), "Employee not found");
  assert(amount > 0, "Amount must be positive");
  assert(frequency > 0, "Frequency must be positive");
  assert(start_date > current_timestamp(), "Start date must be in future");

  // Generate unique schedule ID
  let schedule_id = hash(employee_id + current_timestamp());

  // Create schedule
  let schedule = RecurringSchedule {
    schedule_id: schedule_id,
    employee_id: employee_id,
    amount: amount,
    frequency: frequency,
    start_date: start_date,
    next_payment_date: start_date, // First payment on start date
    end_date: end_date,
    active: true,
    created_at: current_timestamp()
  };

  // Store schedule
  recurring_schedules.insert(schedule_id, schedule);

  // Emit event
  emit RecurringPaymentCreated(schedule_id, employee_id, frequency);

  return schedule_id;
}
```

**Frequency Options:**
- Weekly: `604800` seconds (7 days)
- Biweekly: `1209600` seconds (14 days)
- Monthly: `2592000` seconds (30 days)
- Semi-monthly: `1296000` seconds (15 days)

**Example:**
```typescript
// Setup recurring payment: Pay Alice $5,000 biweekly starting Nov 15
const scheduleId = await payroll.setup_recurring_payment(
  "alice",                    // employee_id
  5000,                       // $5,000
  1209600,                    // Biweekly (14 days)
  1731628800,                 // Nov 15, 2025 (Unix timestamp)
  null                        // No end date
);
```

---

#### `execute_recurring_payment` (NEW)

**Purpose:** Process scheduled payment when due (called by cron job)

**Circuit:**
```compact
circuit execute_recurring_payment(
  Bytes<32> schedule_id
): Void {
  // Get schedule
  assert(recurring_schedules.has(schedule_id), "Schedule not found");
  let schedule = recurring_schedules.get(schedule_id);

  // Validate schedule is active
  assert(schedule.active, "Schedule is cancelled");

  // Check if payment is due
  let now = current_timestamp();
  assert(now >= schedule.next_payment_date, "Payment not due yet");

  // Check if schedule has ended
  if (schedule.end_date.is_some() && now > schedule.end_date.unwrap()) {
    // Auto-cancel expired schedule
    schedule.active = false;
    recurring_schedules.insert(schedule_id, schedule);
    emit RecurringPaymentEnded(schedule_id);
    return;
  }

  // Execute payment
  pay_employee(schedule.employee_id, schedule.amount);

  // Update next payment date
  schedule.next_payment_date += schedule.frequency;
  recurring_schedules.insert(schedule_id, schedule);

  // Emit event
  emit RecurringPaymentExecuted(schedule_id, schedule.employee_id, schedule.amount);
}
```

**Execution Trigger:**
- **Phase 1 (MVP):** Off-chain cron job polls `recurring_schedules` every minute
- **Phase 2 (Future):** Compact runtime native time-based execution (when available)

**Cron Job Logic (TypeScript):**
```typescript
// Payment Scheduler Service
setInterval(async () => {
  // Query all active recurring schedules
  const schedules = await payroll.getRecurringSchedules({ active: true });

  const now = Math.floor(Date.now() / 1000); // Unix timestamp

  for (const schedule of schedules) {
    // Check if payment is due
    if (now >= schedule.next_payment_date) {
      try {
        // Trigger smart contract execution
        await payroll.execute_recurring_payment(schedule.schedule_id);
        console.log(`✅ Paid ${schedule.employee_id} - $${schedule.amount}`);
      } catch (error) {
        console.error(`❌ Payment failed for ${schedule.employee_id}:`, error);
        // Retry logic, send alert to company
      }
    }
  }
}, 60000); // Check every 60 seconds
```

---

#### `cancel_recurring_payment` (NEW)

**Purpose:** Stop automated payments (employee leaves, salary changes)

**Circuit:**
```compact
circuit cancel_recurring_payment(
  Bytes<32> schedule_id
): Void {
  // Get schedule
  assert(recurring_schedules.has(schedule_id), "Schedule not found");
  let schedule = recurring_schedules.get(schedule_id);

  // Mark as inactive
  schedule.active = false;
  recurring_schedules.insert(schedule_id, schedule);

  // Emit event
  emit RecurringPaymentCancelled(schedule_id);
}
```

---

## Off-Chain Services

### 1. Payment Scheduler (Cron Service)

**Purpose:** Monitor recurring schedules and trigger payments when due

**Architecture:**
```typescript
// payroll-scheduler/src/index.ts

import { PayrollAPI } from '@zksalaria/payroll-api';

class PaymentScheduler {
  private payroll: PayrollAPI;
  private checkInterval: NodeJS.Timeout;

  constructor(contractAddress: string) {
    this.payroll = PayrollAPI.connect(contractAddress);
  }

  async start() {
    console.log('🚀 Payment Scheduler started');

    // Check every 60 seconds
    this.checkInterval = setInterval(() => {
      this.processScheduledPayments();
    }, 60000);
  }

  async processScheduledPayments() {
    try {
      // Get all active schedules
      const schedules = await this.payroll.getRecurringSchedules({
        active: true
      });

      const now = Math.floor(Date.now() / 1000);

      for (const schedule of schedules) {
        // Check if payment is due (allow 5-minute grace period)
        if (now >= schedule.next_payment_date - 300) {
          await this.executePayment(schedule);
        }
      }
    } catch (error) {
      console.error('Scheduler error:', error);
      // Send alert to admin
    }
  }

  async executePayment(schedule: RecurringSchedule) {
    try {
      console.log(`💰 Processing payment for ${schedule.employee_id}...`);

      // Call smart contract
      await this.payroll.execute_recurring_payment(schedule.schedule_id);

      console.log(`✅ Payment successful: ${schedule.employee_id} - $${schedule.amount}`);

      // Send notification
      await this.notifyEmployee(schedule.employee_id, schedule.amount);

    } catch (error) {
      console.error(`❌ Payment failed: ${schedule.employee_id}`, error);

      // Retry logic
      await this.retryPayment(schedule, error);
    }
  }

  async retryPayment(schedule: RecurringSchedule, error: Error) {
    // Check error type
    if (error.message.includes('Insufficient balance')) {
      // Alert company: needs to fund payroll account
      await this.alertCompany(schedule, 'insufficient_balance');
    } else {
      // Retry up to 3 times with exponential backoff
      // If still fails, alert company and pause schedule
    }
  }

  async notifyEmployee(employeeId: string, amount: number) {
    // Email notification
    // Webhook to employee's notification preferences
  }

  async alertCompany(schedule: RecurringSchedule, reason: string) {
    // Email to company admin
    // Slack/Discord webhook
    // Dashboard notification
  }

  stop() {
    clearInterval(this.checkInterval);
    console.log('🛑 Payment Scheduler stopped');
  }
}

// Start scheduler
const scheduler = new PaymentScheduler(process.env.PAYROLL_CONTRACT_ADDRESS);
scheduler.start();
```

**Deployment:**
- Docker container running on cloud (AWS ECS, Google Cloud Run)
- High availability: Run 2+ instances with leader election
- Monitoring: CloudWatch logs, error alerts
- Cost: ~$10-20/month for basic infrastructure

---

### 2. Notification Service

**Purpose:** Notify employees and company about payment events

**Events to Handle:**
- `PaymentReceived` → Email employee: "You received $5,000"
- `RecurringPaymentExecuted` → Email employee: "Your biweekly salary of $5,000 was paid"
- `PaymentFailed` → Alert company: "Insufficient balance for Alice's payment"
- `RecurringPaymentCancelled` → Email employee: "Your recurring payment was cancelled"

**Architecture:**
```typescript
// notification-service/src/index.ts

import { PayrollAPI } from '@zksalaria/payroll-api';
import nodemailer from 'nodemailer';

class NotificationService {
  private payroll: PayrollAPI;
  private emailClient: nodemailer.Transporter;

  constructor() {
    this.payroll = PayrollAPI.connect(process.env.PAYROLL_CONTRACT_ADDRESS);
    this.emailClient = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    });
  }

  async start() {
    // Subscribe to contract events
    this.payroll.events$.subscribe(async (event) => {
      switch (event.type) {
        case 'PaymentReceived':
          await this.notifyEmployeePayment(event);
          break;
        case 'RecurringPaymentExecuted':
          await this.notifyRecurringPayment(event);
          break;
        case 'PaymentFailed':
          await this.alertCompanyFailure(event);
          break;
      }
    });
  }

  async notifyEmployeePayment(event: PaymentEvent) {
    const employee = await this.payroll.getEmployee(event.employee_id);

    await this.emailClient.sendMail({
      to: employee.email,
      subject: '💰 You received a payment',
      html: `
        <h2>Payment Received</h2>
        <p>Your employer paid you <strong>$${event.amount}</strong></p>
        <p>Your encrypted balance has been updated.</p>
        <a href="https://zksalaria.app/dashboard">View Dashboard</a>
      `
    });
  }

  async alertCompanyFailure(event: FailureEvent) {
    const company = await this.payroll.getCompany();

    await this.emailClient.sendMail({
      to: company.admin_email,
      subject: '⚠️ Payroll Payment Failed',
      html: `
        <h2>Payment Failure Alert</h2>
        <p>Failed to pay ${event.employee_id}: <strong>${event.reason}</strong></p>
        <p>Action required: Please fund your payroll account.</p>
        <a href="https://zksalaria.app/dashboard">Go to Dashboard</a>
      `
    });
  }
}

const notificationService = new NotificationService();
notificationService.start();
```

---

## User Flows

### Flow 1: Setup Recurring Payment (Company)

**Persona:** Sarah (HR Manager at Acme Corp)

**Scenario:** Setup biweekly payroll for Alice ($5,000 every 2 weeks)

**Steps:**

1. **Navigate to Setup Recurring Payment**
   - Company Dashboard → [Setup Recurring Payment] button
   - Page loads with form

2. **Fill Out Form**
   ```
   Employee: [Alice Johnson ▼]
   Amount:   [$5,000____]
   Frequency: [Biweekly (every 2 weeks) ▼]
   Start Date: [Nov 15, 2025 📅]
   End Date:  ⦿ No end date
              ○ Specific date: [______ 📅]
   ```

3. **Preview Schedule**
   - Click "Preview" button
   - Modal shows:
     ```
     Next 5 Payments:
     • Nov 15, 2025 - $5,000
     • Nov 29, 2025 - $5,000
     • Dec 13, 2025 - $5,000
     • Dec 27, 2025 - $5,000
     • Jan 10, 2026 - $5,000
     ```

4. **Confirm Setup**
   - Click "Setup Recurring Payment" button
   - MetaMask popup: Sign transaction
   - Smart contract: `setup_recurring_payment("alice", 5000, 1209600, 1731628800, null)`
   - Success toast: "✅ Recurring payment setup for Alice Johnson"

5. **Verify in Dashboard**
   - Navigate to "Recurring Payments" tab
   - See card:
     ```
     Alice Johnson
     $5,000 biweekly
     Next payment: Nov 15, 2025 (in 14 days)
     [Cancel] [Edit]
     ```

---

### Flow 2: Automatic Payment Execution (System)

**Scenario:** Nov 15, 2025 arrives, cron job triggers payment

**Steps:**

1. **Cron Job Checks (Every 60 seconds)**
   ```typescript
   // 12:00:00 PM Nov 15, 2025
   const now = 1731628800;

   // Query: Get all active schedules
   const schedules = await payroll.getRecurringSchedules({ active: true });

   // Found: Alice's schedule (next_payment_date = 1731628800)
   // Condition: now >= next_payment_date → TRUE
   ```

2. **Execute Payment**
   ```typescript
   await payroll.execute_recurring_payment(schedule_id);

   // Smart contract:
   // 1. Verify schedule is active
   // 2. Verify payment is due
   // 3. Call pay_employee("alice", 5000)
   // 4. Update next_payment_date to Nov 29, 2025
   ```

3. **Notification Sent**
   ```
   To: alice@example.com
   Subject: 💰 Your salary was paid

   Hi Alice,

   Your biweekly salary of $5,000 has been paid by Acme Corp.
   Your encrypted balance has been updated.

   Next payment: Nov 29, 2025

   [View Dashboard]
   ```

4. **Employee Sees Update**
   - Alice logs in to dashboard
   - Card shows: "Current Balance: ••••••" → Click decrypt → "$10,000"
   - Payment history:
     ```
     ✓ Completed   Acme Corp   $5,000   Nov 15, 2025   Recurring Payroll
     ✓ Completed   Acme Corp   $5,000   Nov 1, 2025    Recurring Payroll
     ```

---

### Flow 3: Batch Payroll (Company)

**Persona:** Sarah (HR Manager)

**Scenario:** Pay all 12 employees at once (payday)

**Steps:**

1. **Navigate to Run Payroll**
   - Company Dashboard → [Run Payroll] button
   - Page loads with employee list

2. **Review Employees**
   ```
   ☑ Alice Johnson    Engineer       $5,000
   ☑ Bob Smith        Designer       $6,500
   ☑ Carol Lee        Product        $4,200
   ☑ David Chen       Marketing      $5,800
   ☑ ... (8 more employees)

   Total: $54,200
   Estimated Gas: ~$0.12
   ```

3. **Customize Amounts (Optional)**
   - Uncheck Bob (already paid manually)
   - Override Carol: $4,200 → $4,500 (bonus)

4. **Confirm Batch Payment**
   - Click "Pay All Employees" button
   - MetaMask popup: Sign transaction
   - Smart contract: `batch_pay_employees([ids], [amounts])`
   - Progress indicator: "Processing 11 payments..."

5. **Success Confirmation**
   ```
   ✅ Payroll Completed

   11 employees paid
   Total: $54,500
   Gas fee: $0.11

   Notifications sent to all employees.

   [View Payment Report]
   ```

6. **Payment Report (PDF)**
   ```
   Acme Corp - Payroll Report
   Date: Nov 15, 2025

   Employee         Amount    Status
   ────────────────────────────────
   Alice Johnson    $5,000    ✓ Paid
   Carol Lee        $4,500    ✓ Paid (bonus)
   David Chen       $5,800    ✓ Paid
   ... (8 more)

   Total Paid: $54,500
   Gas Fee: $0.11
   Transaction: 0x1234...5678
   ```

---

## Technical Challenges & Solutions

### Challenge 1: Time-Based Execution in Compact

**Problem:** Compact runtime may not support native time-based triggers (like Ethereum's Chainlink Keepers)

**Solution (Interim):** Off-chain cron job polls smart contract

**Architecture:**
```
┌─────────────────────┐
│ Payment Scheduler   │
│ (Cron Service)      │
└──────────┬──────────┘
           │ Every 60s: Check schedules
           ▼
┌─────────────────────┐
│ Payroll Smart       │
│ Contract            │
│ - recurring_        │
│   schedules         │
└─────────────────────┘
           │ If due: execute_recurring_payment()
           ▼
┌─────────────────────┐
│ Employee Balance    │
│ Updated             │
└─────────────────────┘
```

**Future (Compact Runtime Upgrade):**
- Compact adds native time-based execution
- Remove cron job, use on-chain scheduler
- More decentralized, no off-chain dependency

---

### Challenge 2: Gas Costs for Large Batches

**Problem:** Paying 100 employees in single transaction may hit gas limit

**Solution:** Dynamic batch sizing

**Implementation:**
```typescript
async function batchPayEmployees(employees: Employee[]) {
  const BATCH_SIZE = 50; // Conservative limit

  for (let i = 0; i < employees.length; i += BATCH_SIZE) {
    const batch = employees.slice(i, i + BATCH_SIZE);
    const ids = batch.map(e => e.id);
    const amounts = batch.map(e => e.base_salary);

    await payroll.batch_pay_employees(ids, amounts);

    // Wait for confirmation before next batch
    await waitForConfirmation();
  }
}
```

**Gas Benchmarking:**
- 1 payment: ~100k gas (~$0.01)
- 10 payments (batch): ~500k gas (~$0.05)
- 50 payments (batch): ~2M gas (~$0.20)
- 100 payments (2 batches): ~4M gas (~$0.40)

**Comparison to Individual Payments:**
- 100 individual transactions: ~10M gas (~$1.00)
- Savings: 60% cheaper with batching

---

### Challenge 3: Handling Payment Failures

**Problem:** Recurring payment fails (insufficient balance, network error)

**Solution:** Multi-layer retry logic

**Implementation:**
```typescript
async function executePaymentWithRetry(schedule: RecurringSchedule) {
  const MAX_RETRIES = 3;
  const BACKOFF = [5000, 30000, 300000]; // 5s, 30s, 5min

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      await payroll.execute_recurring_payment(schedule.schedule_id);
      return; // Success
    } catch (error) {
      if (error.message.includes('Insufficient balance')) {
        // Cannot retry, alert company
        await alertCompany(schedule, 'insufficient_balance');
        await pauseSchedule(schedule.schedule_id);
        return;
      }

      // Network error, retry with backoff
      if (attempt < MAX_RETRIES - 1) {
        await sleep(BACKOFF[attempt]);
      } else {
        // Final retry failed, alert company
        await alertCompany(schedule, 'execution_failed');
      }
    }
  }
}
```

**Alert Email to Company:**
```
Subject: ⚠️ Payroll Payment Failed - Action Required

Hi Acme Corp,

We attempted to pay Alice Johnson $5,000 (recurring payment), but
your payroll account has insufficient balance.

Current Balance: $2,300
Required: $5,000

Please fund your payroll account to resume payments.

Recurring payment has been PAUSED until you add funds.

[Fund Account] [Contact Support]
```

---

## MVP Milestones

### Week 1-2: Smart Contract Development

**Tasks:**
- [ ] Implement `batch_pay_employees` circuit
- [ ] Implement `setup_recurring_payment` circuit
- [ ] Implement `execute_recurring_payment` circuit
- [ ] Implement `cancel_recurring_payment` circuit
- [ ] Implement `update_employee_salary` circuit
- [ ] Unit tests for all circuits
- [ ] Integration tests (batch + recurring scenarios)

**Deliverable:** Compiled smart contract with all 8 circuits

---

### Week 3-4: Off-Chain Services

**Tasks:**
- [ ] Build Payment Scheduler (cron service)
- [ ] Build Notification Service (email + webhooks)
- [ ] Dockerize both services
- [ ] Deploy to staging (Google Cloud Run)
- [ ] Load testing (100 employees, 1000 schedules)
- [ ] Monitoring setup (logs, alerts, metrics)

**Deliverable:** Payment automation infrastructure running 24/7

---

### Week 5-6: UI Development

**Tasks:**
- [ ] Setup Recurring Payment page (wireframe → implementation)
- [ ] Run Payroll page (batch payments UI)
- [ ] Recurring Payments management (list, cancel, edit)
- [ ] Payment preview modal (next 5 payments)
- [ ] Integration with PayrollAPI SDK
- [ ] E2E tests (Cypress)

**Deliverable:** Complete company dashboard with all payroll features

---

### Week 7-8: Testing & Launch

**Tasks:**
- [ ] Internal testing (10 test employees, 30-day simulation)
- [ ] Beta testing with 3 pilot companies
- [ ] Bug fixes and polish
- [ ] Documentation (user guides, API docs)
- [ ] Mainnet deployment
- [ ] Public launch 🚀

**Deliverable:** Production-ready zkSalaria payroll MVP

---

## Success Metrics

### Technical Metrics

- ✅ **Payment Success Rate:** >99.5% (recurring payments execute on time)
- ✅ **Gas Efficiency:** Batch payments 50%+ cheaper than individual
- ✅ **Uptime:** Scheduler service 99.9% uptime
- ✅ **Latency:** Payment confirmation <30 seconds
- ✅ **Scale:** Support 100+ employees per company

### Product Metrics

- ✅ **Feature Parity:** Match Gusto core payroll (excluding tax withholding)
- ✅ **User Satisfaction:** NPS >50 from beta testers
- ✅ **Setup Time:** <10 minutes to onboard company and setup first recurring payment
- ✅ **Error Rate:** <1% payment failures (excluding insufficient balance)

---

## Future Enhancements (Post-MVP)

### Phase 5: Tax Withholding & Compliance

- `setup_tax_withholding` circuit
- `calculate_net_salary` (gross - taxes)
- `generate_w2_proof` (ZK proof of W-2 data)
- Integration with IRS tax tables

### Phase 6: Employee Benefits

- Health insurance deductions
- 401k contributions
- PTO accrual tracking
- Benefits enrollment UI

### Phase 7: Advanced Features

- Multi-currency payroll (pay in USDC, EUR, etc.)
- Contractor payments (1099)
- Payroll financing (advance salaries)
- AI-powered pay equity audits (ZKML)

---

## Conclusion

This implementation plan delivers a **complete, production-ready payroll MVP** with:

✅ **Recurring Payments** - Set it and forget it automation
✅ **Batch Processing** - Pay 100 employees in single transaction
✅ **Trustless Execution** - Smart contracts enforce rules
✅ **Employee Privacy** - Encrypted salaries, ZK proofs
✅ **Feature Parity** - Competitive with Gusto/Rippling core payroll

**Timeline:** 6-8 weeks
**Team Size:** 2-3 engineers (1 smart contracts, 1 backend, 1 frontend)
**Infrastructure Cost:** ~$50-100/month (scheduler + notifications)

This MVP proves zkSalaria is not just "crypto payroll" - it's a **complete payroll platform with privacy superpowers**.

---

*Next Step: Create UI wireframes for all payroll pages*
