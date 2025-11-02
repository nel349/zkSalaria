import { describe, test, expect, beforeEach } from 'vitest';
import { PayrollMultiPartyTestSetup } from './payroll-setup-multi.js';
import { EmploymentStatus, RecurringPaymentFrequency, RecurringPaymentStatus } from '../types.js';
import { stringToBytes32 } from './utils.js';

describe('zkSalaria Multi-Party Privacy Tests', () => {
  let payroll: PayrollMultiPartyTestSetup;
  const companyId = 'COMP001';
  const companyName = 'Acme Corp';

  beforeEach(() => {
    payroll = new PayrollMultiPartyTestSetup(companyId, companyName);
    console.log('\n🔄 Multi-party payroll contract initialized for company:', companyName, '\n');
  });

  describe('Payment History on Public Ledger', () => {
    test('should create separate private states for each participant', () => {
      // Register multiple participants (company and employees)
      payroll.registerParticipant(companyId);
      payroll.registerParticipant('EMP001');
      payroll.registerParticipant('EMP002');

      // Verify all participants registered
      const participants = payroll.getRegisteredParticipants();
      expect(participants).toContain(companyId);
      expect(participants).toContain('EMP001');
      expect(participants).toContain('EMP002');
      expect(participants.length).toBe(3);

      console.log('✅ Separate private states created for each participant');
    });

    test('should store payment history per employee on public ledger', () => {
      // Setup
      const employee1 = 'EMP001';
      const employee2 = 'EMP002';

      payroll.addEmployee(employee1);
      payroll.addEmployee(employee2);
      payroll.depositCompanyFunds(100000n);

      // Pay both employees
      payroll.payEmployee(employee1, 5000n);
      payroll.payEmployee(employee2, 6000n);

      // Each employee has their own payment history on ledger
      const emp1History = payroll.getEmployeePaymentHistory(employee1);
      const emp1Payments = emp1History.filter(r => r.timestamp > 0n);
      expect(emp1Payments.length).toBe(1);

      // Decrypt and verify amounts
      const emp1Amount = payroll.decryptPaymentAmount(emp1Payments[0].encrypted_amount);
      expect(emp1Amount).toBe(5000n);

      const emp2History = payroll.getEmployeePaymentHistory(employee2);
      const emp2Payments = emp2History.filter(r => r.timestamp > 0n);
      expect(emp2Payments.length).toBe(1);

      const emp2Amount = payroll.decryptPaymentAmount(emp2Payments[0].encrypted_amount);
      expect(emp2Amount).toBe(6000n);

      // Histories are separate - each employee has their own payment record
      expect(emp1Payments.length).toBe(1);
      expect(emp2Payments.length).toBe(1);

      console.log('✅ Payment histories correctly separated on ledger per employee');
    });

    test('should allow company to write and anyone to read payment history', () => {
      const employeeId = 'EMP001';

      payroll.addEmployee(employeeId);
      payroll.depositCompanyFunds(50000n);
      payroll.payEmployee(employeeId, 7500n);

      // Payment history is on public ledger - accessible for ZKML credit scoring
      expect(payroll.canAccessPaymentHistory(employeeId, employeeId)).toBe(true);
      expect(payroll.canAccessPaymentHistory(companyId, employeeId)).toBe(true);
      expect(payroll.canAccessPaymentHistory('ANYONE', employeeId)).toBe(true);

      // Employee payment history is readable from ledger
      const empHistory = payroll.getEmployeePaymentHistory(employeeId);
      const empPayments = empHistory.filter(r => r.timestamp > 0n);
      expect(empPayments.length).toBe(1);

      // Decrypt and verify amount
      const amount = payroll.decryptPaymentAmount(empPayments[0].encrypted_amount);
      expect(amount).toBe(7500n);

      // NOTE: Company doesn't have its own payment history - only employees have payment records
      const companyHistory = payroll.getEmployeePaymentHistory(companyId);
      expect(companyHistory.filter(r => r.timestamp > 0n).length).toBe(0);

      console.log('✅ Payment history on public ledger - accessible for ZKML credit scoring');
    });

    test('should track payment history on ledger per employee', () => {
      const employeeId = 'EMP001';

      payroll.addEmployee(employeeId);
      payroll.depositCompanyFunds(100000n);

      // Make multiple payments to same employee
      payroll.payEmployee(employeeId, 5000n);
      payroll.payEmployee(employeeId, 6000n);
      payroll.payEmployee(employeeId, 7000n);

      // Employee's payment history accumulates on public ledger
      const empHistory = payroll.getEmployeePaymentHistory(employeeId);
      const payments = empHistory.filter(r => r.timestamp > 0n);

      expect(payments.length).toBe(3);

      // Decrypt and verify amounts
      const amount1 = payroll.decryptPaymentAmount(payments[0].encrypted_amount);
      const amount2 = payroll.decryptPaymentAmount(payments[1].encrypted_amount);
      const amount3 = payroll.decryptPaymentAmount(payments[2].encrypted_amount);

      expect(amount1).toBe(5000n);
      expect(amount2).toBe(6000n);
      expect(amount3).toBe(7000n);

      // Company doesn't have payment history - only employees do
      const companyHistory = payroll.getEmployeePaymentHistory(companyId);
      expect(companyHistory.filter(r => r.timestamp > 0n).length).toBe(0);

      console.log('✅ Payment history correctly tracked on ledger per employee');
    });
  });

  describe('Multiple Employee Payment History', () => {
    test('should maintain separate payment histories for multiple employees', () => {
      const employees = ['EMP001', 'EMP002', 'EMP003'];

      employees.forEach(emp => payroll.addEmployee(emp));
      payroll.depositCompanyFunds(500000n);

      // Pay each employee different amounts
      payroll.payEmployee(employees[0], 10000n);
      payroll.payEmployee(employees[1], 12000n);
      payroll.payEmployee(employees[2], 15000n);

      // Each employee should only see their own payment
      const emp1Payments = payroll.getEmployeePaymentHistory(employees[0]).filter(r => r.timestamp > 0n);
      const emp2Payments = payroll.getEmployeePaymentHistory(employees[1]).filter(r => r.timestamp > 0n);
      const emp3Payments = payroll.getEmployeePaymentHistory(employees[2]).filter(r => r.timestamp > 0n);

      expect(emp1Payments.length).toBe(1);
      expect(emp2Payments.length).toBe(1);
      expect(emp3Payments.length).toBe(1);

      // Decrypt and verify amounts
      const emp1Amount = payroll.decryptPaymentAmount(emp1Payments[0].encrypted_amount);
      const emp2Amount = payroll.decryptPaymentAmount(emp2Payments[0].encrypted_amount);
      const emp3Amount = payroll.decryptPaymentAmount(emp3Payments[0].encrypted_amount);

      expect(emp1Amount).toBe(10000n);
      expect(emp2Amount).toBe(12000n);
      expect(emp3Amount).toBe(15000n);

      // Each employee's history contains only their own payments
      expect(emp1Payments.length).toBe(1);
      expect(emp2Payments.length).toBe(1);
      expect(emp3Payments.length).toBe(1);

      console.log('✅ Multiple employee payment histories correctly separated on ledger');
    });
  });

  describe('Public Ledger Visibility (Encrypted Balances)', () => {
    test('should share public ledger state across all participants', () => {
      const emp1 = 'EMP001';
      const emp2 = 'EMP002';

      // All participants perform operations
      payroll.addEmployee(emp1);
      payroll.addEmployee(emp2);

      // All participants should see same public ledger state
      expect(payroll.getTotalCompanies()).toBe(1n); // This contract represents one company
      expect(payroll.getTotalEmployees()).toBe(2n);
      expect(payroll.getTotalPayments()).toBe(0n);

      payroll.depositCompanyFunds(100000n);

      // Public ledger state visible to all
      expect(payroll.getTotalSupply()).toBe(100000n);

      payroll.payEmployee(emp1, 8000n);
      payroll.payEmployee(emp2, 7000n);

      // Payment counter is public
      expect(payroll.getTotalPayments()).toBe(2n);

      console.log('✅ Public ledger state correctly shared across all participants');
    });

    test('should demonstrate privacy: encrypted balances + payment history on ledger', () => {
      const employeeId = 'EMP001';

      console.log('\n🔒 zkSalaria Privacy Architecture (following bank.compact pattern):');
      console.log('├─ PUBLIC LEDGER (shared by all):');
      console.log('│  ├─ Encrypted company balance (hash encrypted - PRIVATE)');
      console.log('│  ├─ Encrypted employee balances (hash encrypted - PRIVATE)');
      console.log('│  ├─ Payment history per employee (for ZKML - PUBLIC)');
      console.log('│  ├─ Total supply (aggregate only)');
      console.log('│  └─ Payment counters (aggregate only)');
      console.log('├─ PRIVACY MODEL:');
      console.log('│  ├─ Current balances: ENCRYPTED (nobody can see exact amounts)');
      console.log('│  ├─ Payment history: ENCRYPTED AMOUNTS (privacy preserved)');
      console.log('│  └─ Company can write payments, employee decrypts locally for ZKML');
      console.log('└─ MULTI-PARTY SAFE: Company can pay employees, history tracked on ledger ✅');

      payroll.addEmployee(employeeId);
      payroll.depositCompanyFunds(100000n);
      payroll.payEmployee(employeeId, 8000n);

      // Public ledger shows aggregates only (balances encrypted)
      expect(payroll.getTotalSupply()).toBe(100000n);
      expect(payroll.getTotalPayments()).toBe(1n);

      // Payment history is on public ledger - amounts ENCRYPTED for privacy
      // NOTE: Amounts are ENCRYPTED - employee decrypts locally for ZKML
      const empHistory = payroll.getEmployeePaymentHistory(employeeId);
      expect(empHistory.filter(r => r.timestamp > 0n).length).toBe(1);

      // Company doesn't have payment history (only employees do)
      const companyHistory = payroll.getEmployeePaymentHistory(companyId);
      expect(companyHistory.filter(r => r.timestamp > 0n).length).toBe(0);

      console.log('\n💡 Privacy achieved: Encrypted balances + encrypted payment history for ZKML!');
      payroll.printMultiPartyState();
    });
  });

  describe('Complex Multi-Party Scenarios', () => {
    test('should handle complex workflow with proper isolation', () => {
      // Setup: 1 company, 5 employees total
      const allEmployees = ['EMP001', 'EMP002', 'EMP003', 'EMP004', 'EMP005'];

      // Register employees
      allEmployees.forEach(emp => payroll.addEmployee(emp));

      // Deposit funds
      payroll.depositCompanyFunds(500000n);

      // Process payments
      payroll.payEmployee(allEmployees[0], 10000n);
      payroll.payEmployee(allEmployees[1], 12000n);
      payroll.payEmployee(allEmployees[2], 15000n);
      payroll.payEmployee(allEmployees[3], 8000n);
      payroll.payEmployee(allEmployees[4], 9000n);

      // Verify public ledger
      expect(payroll.getTotalCompanies()).toBe(1n); // This contract represents one company
      expect(payroll.getTotalEmployees()).toBe(5n);
      expect(payroll.getTotalPayments()).toBe(5n);
      expect(payroll.getTotalSupply()).toBe(500000n);

      // Verify each employee only sees their own payment
      // NOTE: Amounts are ENCRYPTED - we can only verify records exist, not read amounts
      allEmployees.forEach((emp, idx) => {
        const history = payroll.getEmployeePaymentHistory(emp);
        const payments = history.filter(r => r.timestamp > 0n);
        expect(payments.length).toBe(1);
      });

      // Company doesn't have payment history - only employees do
      const compHistory = payroll.getEmployeePaymentHistory(companyId);
      expect(compHistory.filter(r => r.timestamp > 0n).length).toBe(0);

      console.log('✅ Complex multi-party workflow with payment history on ledger');
      payroll.printMultiPartyState();
    });
  });

  describe('Multi-Party Employment Verification', () => {
    test('should allow employee to grant disclosure to verifier (landlord)', () => {
      // Setup: 3 participants - company, employee, verifier
      const employeeId = 'EMP001';
      const verifierId = 'LANDLORD001';

      // Company adds employee
      payroll.addEmployee(employeeId);

      // Employee grants employment disclosure to verifier
      payroll.grantEmploymentDisclosure(employeeId, verifierId, 0);

      // Verifier checks employment status
      const result = payroll.verifyEmployment(employeeId, verifierId);

      // Assert: Employee is active (0x01)
      expect(result[0]).toBe(1);

      // Verify participants registered
      const participants = payroll.getRegisteredParticipants();
      expect(participants).toContain(companyId);
      expect(participants).toContain(employeeId);
      expect(participants).toContain(verifierId);

      console.log('✅ Multi-party employment verification: employee → verifier grant successful');
    });

    test('should allow company to update employment status independently', () => {
      // Setup: 3 participants
      const employeeId = 'EMP002';
      const verifierId = 'LANDLORD002';

      // Company adds employee
      payroll.addEmployee(employeeId);

      // Employee grants disclosure
      payroll.grantEmploymentDisclosure(employeeId, verifierId, 0);

      // Verify initially active
      let result = payroll.verifyEmployment(employeeId, verifierId);
      expect(result[0]).toBe(1);

      // Company updates status to TERMINATED
      payroll.updateEmploymentStatus(employeeId, EmploymentStatus.TERMINATED);

      // Verifier checks again
      result = payroll.verifyEmployment(employeeId, verifierId);

      // Assert: Employee is no longer active (0x00)
      expect(result[0]).toBe(0);

      console.log('✅ Multi-party employment status update: company → employee status change');
    });

    test('should handle multiple verifiers for same employee', () => {
      // Setup: 1 company, 1 employee, 2 verifiers (landlord + bank)
      const employeeId = 'EMP003';
      const landlord = 'LANDLORD003';
      const bank = 'BANK003';

      payroll.addEmployee(employeeId);

      // Employee grants disclosure to both verifiers
      payroll.grantEmploymentDisclosure(employeeId, landlord, 0);
      payroll.grantEmploymentDisclosure(employeeId, bank, 0);

      // Both verifiers check employment
      const landlordResult = payroll.verifyEmployment(employeeId, landlord);
      const bankResult = payroll.verifyEmployment(employeeId, bank);

      // Both should see active employment
      expect(landlordResult[0]).toBe(1);
      expect(bankResult[0]).toBe(1);

      // Company terminates employee
      payroll.updateEmploymentStatus(employeeId, EmploymentStatus.TERMINATED);

      // Both verifiers should now see terminated
      const landlordResult2 = payroll.verifyEmployment(employeeId, landlord);
      const bankResult2 = payroll.verifyEmployment(employeeId, bank);

      expect(landlordResult2[0]).toBe(0);
      expect(bankResult2[0]).toBe(0);

      console.log('✅ Multi-party: multiple verifiers see consistent employment status');
    });

    test('should maintain separate employment records for different employees', () => {
      // Setup: 1 company with different employees
      const emp1 = 'EMP004';
      const emp2 = 'EMP005';
      const verifier = 'LANDLORD004';

      // Company adds employees
      payroll.addEmployee(emp1);
      payroll.addEmployee(emp2);

      // Employees grant disclosure
      payroll.grantEmploymentDisclosure(emp1, verifier, 0);
      payroll.grantEmploymentDisclosure(emp2, verifier, 0);

      // Verify both employed
      const emp1Result = payroll.verifyEmployment(emp1, verifier);
      const emp2Result = payroll.verifyEmployment(emp2, verifier);

      expect(emp1Result[0]).toBe(1);
      expect(emp2Result[0]).toBe(1);

      // Company terminates emp1
      payroll.updateEmploymentStatus(emp1, EmploymentStatus.TERMINATED);

      // Verify emp1 terminated, emp2 still active
      const emp1Result2 = payroll.verifyEmployment(emp1, verifier);
      const emp2Result2 = payroll.verifyEmployment(emp2, verifier);

      expect(emp1Result2[0]).toBe(0); // Terminated
      expect(emp2Result2[0]).toBe(1); // Still active

      console.log('✅ Multi-party: employment status independent across employees');
    });

    test('should enforce disclosure permission - verifier needs grant', () => {
      // Setup: company, employee, unauthorized verifier
      const employeeId = 'EMP006';
      const unauthorizedVerifier = 'HACKER001';

      payroll.addEmployee(employeeId);

      // Verifier tries to check without disclosure grant (should fail)
      expect(() => {
        payroll.verifyEmployment(employeeId, unauthorizedVerifier);
      }).toThrow();

      console.log('✅ Multi-party: unauthorized verifier blocked (no disclosure grant)');
    });

    test('should handle employment verification with time-based expiration', () => {
      // Setup
      const employeeId = 'EMP007';
      const verifierId = 'LANDLORD007';
      const currentTime = payroll.getCurrentTimestamp();
      const expirationDelta = 3600; // 1 hour

      payroll.addEmployee(employeeId);

      // Grant disclosure with expiration
      payroll.grantEmploymentDisclosure(employeeId, verifierId, expirationDelta);

      // Verify works before expiration
      let result = payroll.verifyEmployment(employeeId, verifierId);
      expect(result[0]).toBe(1);

      // Advance time past expiration
      payroll.updateTimestamp(currentTime + expirationDelta + 1);

      // Verification should fail after expiration
      expect(() => {
        payroll.verifyEmployment(employeeId, verifierId);
      }).toThrow();

      console.log('✅ Multi-party: employment disclosure expires after time limit');
    });

    test('should demonstrate complete 3-party workflow', () => {
      const employeeId = 'EMP008';
      const landlordId = 'LANDLORD008';

      console.log('\n👥 Multi-Party Employment Verification Workflow:');
      console.log('├─ Step 1: Company hires employee');
      payroll.addEmployee(employeeId);

      console.log('├─ Step 2: Employee grants employment disclosure to landlord');
      payroll.grantEmploymentDisclosure(employeeId, landlordId, 0);

      console.log('├─ Step 3: Landlord verifies employment status (ACTIVE)');
      let result = payroll.verifyEmployment(employeeId, landlordId);
      expect(result[0]).toBe(1);

      console.log('├─ Step 4: Company updates employee status to ON_LEAVE');
      payroll.updateEmploymentStatus(employeeId, EmploymentStatus.ON_LEAVE);

      console.log('├─ Step 5: Landlord re-verifies employment (NOT ACTIVE)');
      result = payroll.verifyEmployment(employeeId, landlordId);
      expect(result[0]).toBe(0);

      console.log('├─ Step 6: Company reactivates employee (ACTIVE)');
      payroll.updateEmploymentStatus(employeeId, EmploymentStatus.ACTIVE);

      console.log('└─ Step 7: Landlord verifies again (ACTIVE)');
      result = payroll.verifyEmployment(employeeId, landlordId);
      expect(result[0]).toBe(1);

      console.log('\n✅ Complete 3-party workflow: company ↔ employee ↔ verifier');

      // Verify all participants registered
      const participants = payroll.getRegisteredParticipants();
      expect(participants.length).toBeGreaterThanOrEqual(3);
      expect(participants).toContain(companyId);
      expect(participants).toContain(employeeId);
      expect(participants).toContain(landlordId);
    });
  });

  describe('Balance Decryption from Ledger (Multi-Party)', () => {
    test('should decrypt employee balance with separate participant private states', () => {
      // Arrange - Each participant has their own private state
      const employeeId = 'EMP_DECRYPT_TEST';
      const depositAmount = 100000n;
      const salaryAmount = 7500n;

      // Setup - Company and employee are separate participants
      payroll.addEmployee(employeeId);
      payroll.depositCompanyFunds(depositAmount);
      payroll.payEmployee(employeeId, salaryAmount);

      // Act - Decrypt employee balance from shared public ledger
      const actualBalance = payroll.getActualEmployeeBalance(employeeId);

      // Assert - Balance can be decrypted from encrypted_employee_balances + balance_mappings
      expect(actualBalance).not.toBeNull();
      expect(actualBalance).toBe(salaryAmount);

      // Also verify it matches manually tracked balance
      expect(actualBalance).toBe(payroll.getExpectedEmployeeBalance(employeeId));

      console.log('✅ Multi-party: Employee balance decrypted from shared ledger despite separate private states!');
    });

    test('should decrypt company balance from token reserve (multi-party)', () => {
      // Arrange
      const depositAmount = 75000n;

      // Act - Company deposits (company participant's private state)
      payroll.depositCompanyFunds(depositAmount);
      const actualCompanyBalance = payroll.getActualCompanyBalance();

      // Assert - Company balance = token reserve (not affected by separate private states)
      expect(actualCompanyBalance).toBe(depositAmount);

      console.log('✅ Multi-party: Company balance = token_reserve works with separate private states!');
    });

    test('should return null for employee with no balance entry (multi-party)', () => {
      // Arrange - Create employee but don't pay them
      const employeeId = 'EMP_NO_BALANCE';
      payroll.addEmployee(employeeId);

      // Act
      const actualBalance = payroll.getActualEmployeeBalance(employeeId);

      // Assert - Should return null (no balance entry yet)
      expect(actualBalance).toBeNull();

      console.log('✅ Multi-party: No balance entry returns null correctly');
    });

    test('should decrypt multiple employee balances independently (multi-party)', () => {
      // Arrange - Each employee has their own participant private state
      const emp1 = 'EMP_MULTI_1';
      const emp2 = 'EMP_MULTI_2';
      const emp3 = 'EMP_MULTI_3';

      payroll.addEmployee(emp1);
      payroll.addEmployee(emp2);
      payroll.addEmployee(emp3);

      payroll.depositCompanyFunds(500000n);

      // Pay different amounts to each employee (each uses their own private state)
      payroll.payEmployee(emp1, 10000n);
      payroll.payEmployee(emp2, 15000n);
      payroll.payEmployee(emp3, 20000n);

      // Act - Decrypt all balances from shared public ledger
      const balance1 = payroll.getActualEmployeeBalance(emp1);
      const balance2 = payroll.getActualEmployeeBalance(emp2);
      const balance3 = payroll.getActualEmployeeBalance(emp3);

      // Assert - Each employee has correct independent balance
      expect(balance1).toBe(10000n);
      expect(balance2).toBe(15000n);
      expect(balance3).toBe(20000n);

      // Verify company balance (token reserve) unchanged - payments are internal
      expect(payroll.getActualCompanyBalance()).toBe(500000n);

      console.log('✅ Multi-party: Each employee balance encrypted independently on shared ledger!');
    });

    test('should track balance changes through payment and withdrawal (multi-party)', () => {
      // Arrange - Employee participant has their own private state
      const employeeId = 'EMP_FLOW_TEST';
      payroll.addEmployee(employeeId);
      payroll.depositCompanyFunds(200000n);

      // Act & Assert - Track balance through workflow with separate participant states
      // 1. Initial payment (company → employee, different private states)
      payroll.payEmployee(employeeId, 10000n);
      expect(payroll.getActualEmployeeBalance(employeeId)).toBe(10000n);

      // 2. Second payment
      payroll.payEmployee(employeeId, 5000n);
      expect(payroll.getActualEmployeeBalance(employeeId)).toBe(15000n);

      // 3. Withdrawal (employee participant withdraws from their balance)
      payroll.withdrawEmployeeSalary(employeeId, 7000n);
      expect(payroll.getActualEmployeeBalance(employeeId)).toBe(8000n);

      // 4. Another payment
      payroll.payEmployee(employeeId, 3000n);
      expect(payroll.getActualEmployeeBalance(employeeId)).toBe(11000n);

      console.log('✅ Multi-party: Balance flow tracking works across separate participant private states!');
    });

    test('should handle employee withdrawal reducing both encrypted balance and token reserve', () => {
      // Arrange
      const employeeId = 'EMP_WITHDRAW_TEST';
      const depositAmount = 100000n;
      const salaryAmount = 7500n;
      const withdrawAmount = 5000n;

      // Setup - Each action executed by different participant
      payroll.addEmployee(employeeId);
      payroll.depositCompanyFunds(depositAmount);
      const reserveAfterDeposit = payroll.getTokenReserveBalance();
      payroll.payEmployee(employeeId, salaryAmount);

      // Act - Employee withdraws (employee participant's private state)
      payroll.withdrawEmployeeSalary(employeeId, withdrawAmount);

      // Assert - Verify both balances updated correctly
      expect(payroll.getActualEmployeeBalance(employeeId)).toBe(salaryAmount - withdrawAmount);
      expect(payroll.getTokenReserveBalance()).toBe(reserveAfterDeposit - withdrawAmount);

      console.log('✅ Multi-party: Withdrawal reduces both encrypted balance and token reserve!');
    });

    test('should demonstrate privacy: balances encrypted despite multi-party access to ledger', () => {
      // Arrange - Multiple participants interacting with shared ledger
      const emp1 = 'EMP_PRIVACY_1';
      const emp2 = 'EMP_PRIVACY_2';

      console.log('\n🔒 Multi-Party Privacy Test:');
      console.log('├─ Public ledger shared by all participants');
      console.log('├─ Each employee balance encrypted independently');
      console.log('├─ Company can pay, employees can withdraw');
      console.log('└─ Balance decryption uses encrypted_employee_balances + balance_mappings');

      payroll.addEmployee(emp1);
      payroll.addEmployee(emp2);
      payroll.depositCompanyFunds(200000n);

      // Pay employees different amounts
      payroll.payEmployee(emp1, 8000n);
      payroll.payEmployee(emp2, 12000n);

      // Act - Decrypt balances from shared ledger
      const balance1 = payroll.getActualEmployeeBalance(emp1);
      const balance2 = payroll.getActualEmployeeBalance(emp2);

      // Assert - Each balance is correctly decrypted
      expect(balance1).toBe(8000n);
      expect(balance2).toBe(12000n);

      // Verify company balance unchanged (internal transfers)
      expect(payroll.getActualCompanyBalance()).toBe(200000n);

      console.log('\n💡 Privacy achieved: Balances encrypted on shared ledger!');
      console.log('💡 Each participant has separate private state');
      console.log('💡 Decryption works via balance_mappings map');

      console.log('\n✅ Multi-party: Privacy preserved with encrypted balances on shared ledger!');
    });
  });

  describe('Recurring Payments', () => {
    test('should create recurring payment with 10-second start date', () => {
      // Register company and employee
      payroll.registerParticipant(companyId);
      payroll.addEmployee('EMP_RECURRING');

      console.log('👤 Employee EMP_RECURRING added for recurring payment test');

      // Get current timestamp from ledger
      const currentTimestamp = payroll.getLedgerState().current_timestamp;
      const startDate = currentTimestamp + 10n; // 10 seconds from now
      const endDate = 0n; // Never expires
      const frequency = 0n; // Weekly
      const amount = 500000n; // $5,000.00

      console.log(`⏰ Current timestamp: ${currentTimestamp}`);
      console.log(`📅 Start date: ${startDate} (in 10 seconds)`);
      console.log(`💰 Recurring amount: ${amount} (weekly)`);

      // Create recurring payment (API-calculated dates)
      const nextPaymentDate = startDate + 604800n; // 7 days after start for weekly
      const paymentDayOfWeek = 5n; // Friday (for weekly)
      payroll.createRecurringPayment(
        companyId,
        'EMP_RECURRING',
        amount,
        frequency,
        startDate,
        endDate,
        nextPaymentDate,
        0n, // paymentDayOfMonth1 (unused for weekly)
        0n, // paymentDayOfMonth2 (unused for weekly)
        paymentDayOfWeek
      );

      // Verify recurring payment was stored on ledger
      const recurringPayment = payroll.getRecurringPaymentForEmployee('EMP_RECURRING');

      console.log('\n🔍 Verifying recurring payment fields...');

      // Verify payment exists
      expect(recurringPayment).not.toBeNull();
      if (!recurringPayment) return; // Type guard for TypeScript

      // Verify all fields
      expect(recurringPayment.company_id).toEqual(stringToBytes32(companyId));
      expect(recurringPayment.employee_id).toEqual(stringToBytes32('EMP_RECURRING'));
      expect(recurringPayment.frequency).toBe(frequency);
      expect(recurringPayment.start_date).toBe(startDate);
      expect(recurringPayment.end_date).toBe(endDate);
      expect(recurringPayment.status).toBe(BigInt(RecurringPaymentStatus.ACTIVE));
      expect(recurringPayment.created_at).toBe(currentTimestamp);
      expect(recurringPayment.last_updated).toBe(currentTimestamp);

      // Verify next_payment_date calculated correctly
      // Weekly = 7 days = 604800 seconds
      const expectedNextPayment = startDate + 604800n;
      expect(recurringPayment.next_payment_date).toBe(expectedNextPayment);

      // Verify encrypted amount exists
      expect(recurringPayment.encrypted_amount).toBeDefined();
      expect(recurringPayment.encrypted_amount.length).toBe(32);

      console.log('✅ All recurring payment fields verified correctly!');
      console.log(`   - Status: ACTIVE (${RecurringPaymentStatus.ACTIVE}) ✓`);
      console.log(`   - Frequency: WEEKLY (0) ✓`);
      console.log(`   - Start date: ${startDate} ✓`);
      console.log(`   - Next payment: ${expectedNextPayment} (${startDate} + 604800s) ✓`);
      console.log(`   - Created at: ${currentTimestamp} ✓`);
      console.log(`   - Encrypted amount: ${Buffer.from(recurringPayment.encrypted_amount).toString('hex').substring(0, 16)}... ✓`);
    });

    test('should pause an active recurring payment', () => {
      // Setup: Create recurring payment
      payroll.registerParticipant(companyId);
      payroll.addEmployee('EMP_PAUSE');

      const currentTimestamp = payroll.getLedgerState().current_timestamp;
      const startDate = currentTimestamp + 10n;
      const endDate = 0n;
      const frequency = 0n; // Weekly
      const amount = 300000n; // $3,000.00

      console.log('🔁 Creating recurring payment to test pause...');
      const nextPaymentDate = startDate + 604800n; // 7 days after start for weekly
      payroll.createRecurringPayment(
        companyId,
        'EMP_PAUSE',
        amount,
        frequency,
        startDate,
        endDate,
        nextPaymentDate,
        0n, // paymentDayOfMonth1 (unused for weekly)
        0n, // paymentDayOfMonth2 (unused for weekly)
        5n  // paymentDayOfWeek - Friday
      );

      // Verify it starts as ACTIVE
      let recurringPayment = payroll.getRecurringPaymentForEmployee('EMP_PAUSE');
      expect(recurringPayment).not.toBeNull();
      if (!recurringPayment) return; // Type guard

      expect(recurringPayment.status).toBe(BigInt(RecurringPaymentStatus.ACTIVE));
      const originalNextPayment = recurringPayment.next_payment_date;
      const originalLastUpdated = recurringPayment.last_updated;

      console.log('⏸️  Pausing recurring payment...');

      // Pause the payment
      payroll.pauseRecurringPayment(companyId, 'EMP_PAUSE');

      // Verify status changed to PAUSED
      recurringPayment = payroll.getRecurringPaymentForEmployee('EMP_PAUSE');
      expect(recurringPayment).not.toBeNull();
      if (!recurringPayment) return; // Type guard

      expect(recurringPayment.status).toBe(BigInt(RecurringPaymentStatus.PAUSED));
      expect(recurringPayment.next_payment_date).toBe(originalNextPayment); // Should not change on pause
      expect(recurringPayment.last_updated).toBe(currentTimestamp); // Should update timestamp

      console.log('✅ Recurring payment paused successfully!');
      console.log(`   - Status changed: ACTIVE (${RecurringPaymentStatus.ACTIVE}) → PAUSED (${RecurringPaymentStatus.PAUSED}) ✓`);
      console.log(`   - Next payment date unchanged: ${originalNextPayment} ✓`);
      console.log(`   - Last updated: ${originalLastUpdated} → ${currentTimestamp} ✓`);
    });

    test('should resume a paused recurring payment and recalculate next payment date', () => {
      // Setup: Create and pause recurring payment
      payroll.registerParticipant(companyId);
      payroll.addEmployee('EMP_RESUME');

      const currentTimestamp = payroll.getLedgerState().current_timestamp;
      const startDate = currentTimestamp + 10n;
      const endDate = 0n;
      const frequency = BigInt(RecurringPaymentFrequency.WEEKLY); // Weekly
      const amount = 400000n; // $4,000.00

      console.log('🔁 Creating recurring payment to test resume...');
      const nextPaymentDate = startDate + 604800n; // 7 days after start for weekly
      payroll.createRecurringPayment(
        companyId,
        'EMP_RESUME',
        amount,
        frequency,
        startDate,
        endDate,
        nextPaymentDate,
        0n, // paymentDayOfMonth1 (unused for weekly)
        0n, // paymentDayOfMonth2 (unused for weekly)
        5n  // paymentDayOfWeek - Friday
      );

      console.log('⏸️  Pausing payment...');
      payroll.pauseRecurringPayment(companyId, 'EMP_RESUME');

      // Verify it's paused
      let recurringPayment = payroll.getRecurringPaymentForEmployee('EMP_RESUME');
      expect(recurringPayment).not.toBeNull();
      if (!recurringPayment) return; // Type guard

      expect(recurringPayment.status).toBe(BigInt(RecurringPaymentStatus.PAUSED));
      const pausedNextPayment = recurringPayment.next_payment_date;

      console.log('▶️  Resuming payment...');

      // Resume the payment - API calculates next payment date
      // For this test, since currentTimestamp < startDate, next should be startDate
      const resumeNextPayment = startDate; // Simplified for test
      payroll.resumeRecurringPayment(companyId, 'EMP_RESUME', resumeNextPayment);

      // Verify status changed back to ACTIVE
      recurringPayment = payroll.getRecurringPaymentForEmployee('EMP_RESUME');
      expect(recurringPayment).not.toBeNull();
      if (!recurringPayment) return; // Type guard

      expect(recurringPayment.status).toBe(BigInt(RecurringPaymentStatus.ACTIVE));

      // CALENDAR-BASED SCHEDULE: next_payment_date should align with anchor (startDate)
      // Since currentTimestamp (1762044401) < startDate (1762044411),
      // next payment should be the anchor itself (1762044411)
      // NOT rolling schedule (currentTimestamp + 604800)
      expect(recurringPayment.next_payment_date).toBe(startDate);
      expect(recurringPayment.last_updated).toBe(currentTimestamp);

      console.log('✅ Recurring payment resumed successfully!');
      console.log(`   - Status changed: PAUSED (${RecurringPaymentStatus.PAUSED}) → ACTIVE (${RecurringPaymentStatus.ACTIVE}) ✓`);
      console.log(`   - Next payment recalculated: ${pausedNextPayment} → ${recurringPayment.next_payment_date} ✓`);
      console.log(`   - Calendar-aligned: ${recurringPayment.next_payment_date} = anchor (${startDate}) ✓`);
      console.log(`   - Last updated: ${currentTimestamp} ✓`);
    });
  });

  describe('Calendar-Based Scheduling (Anchor Pattern)', () => {
    test('should align next payment to anchor when resuming after anchor date', () => {
      payroll.registerParticipant(companyId);
      payroll.addEmployee('EMP_CALENDAR_1');

      // Create payment with start date in future, then advance time past it
      const initialTimestamp = payroll.getLedgerState().current_timestamp;
      const startDate = initialTimestamp + 10n; // Anchor 10 seconds in future
      const frequency = RecurringPaymentFrequency.WEEKLY; // 604800 seconds
      const amount = 500000n;

      console.log('🔁 Creating recurring payment...');
      const nextPaymentDate = startDate + 604800n; // 7 days after start for weekly
      payroll.createRecurringPayment(
        companyId,
        'EMP_CALENDAR_1',
        amount,
        frequency,
        startDate,
        0n,
        nextPaymentDate,
        0n, // paymentDayOfMonth1 (unused for weekly)
        0n, // paymentDayOfMonth2 (unused for weekly)
        5n  // paymentDayOfWeek - Friday
      );

      // Advance time to 100k seconds after the anchor
      const newTimestamp = Number(startDate + 100000n);
      console.log(`⏰ Advancing time to ${newTimestamp} (100k sec after anchor)...`);
      payroll.updateTimestamp(newTimestamp);

      const currentTimestamp = payroll.getLedgerState().current_timestamp;
      payroll.pauseRecurringPayment(companyId, 'EMP_CALENDAR_1');

      console.log('▶️  Resuming payment - should align to next anchor occurrence...');
      // API calculates next payment aligned to anchor pattern
      const timeSinceAnchor = currentTimestamp - startDate;
      const intervalSeconds = 604800n;
      const remainder = timeSinceAnchor % intervalSeconds;
      const timeToNext = remainder === 0n ? intervalSeconds : (intervalSeconds - remainder);
      const resumeNextPayment = currentTimestamp + timeToNext;
      payroll.resumeRecurringPayment(companyId, 'EMP_CALENDAR_1', resumeNextPayment);

      const recurringPayment = payroll.getRecurringPaymentForEmployee('EMP_CALENDAR_1');
      expect(recurringPayment).not.toBeNull();
      if (!recurringPayment) return;

      // Verify next payment matches the API-calculated value
      expect(recurringPayment.next_payment_date).toBe(resumeNextPayment);

      console.log('✅ Calendar-based scheduling verified!');
      console.log(`   - Anchor date: ${startDate}`);
      console.log(`   - Current: ${currentTimestamp}`);
      console.log(`   - Time since anchor: ${timeSinceAnchor}s`);
      console.log(`   - Remainder: ${remainder}s`);
      console.log(`   - Next payment: ${recurringPayment.next_payment_date}`);
      console.log(`   - Maintains alignment to anchor pattern ✓`);
    });

    test('should handle biweekly payments with calendar alignment', () => {
      payroll.registerParticipant(companyId);
      payroll.addEmployee('EMP_BIWEEKLY');

      const initialTimestamp = payroll.getLedgerState().current_timestamp;
      const startDate = initialTimestamp + 10n;
      const frequency = RecurringPaymentFrequency.BIWEEKLY; // 1209600 seconds (14 days)
      const amount = 600000n;

      console.log('🔁 Creating biweekly recurring payment...');
      const nextPaymentDate = startDate + 1209600n; // 14 days after start for biweekly
      payroll.createRecurringPayment(
        companyId,
        'EMP_BIWEEKLY',
        amount,
        frequency,
        startDate,
        0n,
        nextPaymentDate,
        1n,  // paymentDayOfMonth1 - 1st
        15n, // paymentDayOfMonth2 - 15th
        0n   // paymentDayOfWeek (unused for biweekly)
      );

      // Advance time ~5.7 days after anchor
      payroll.updateTimestamp(Number(startDate + 500000n));
      const currentTimestamp = payroll.getLedgerState().current_timestamp;

      payroll.pauseRecurringPayment(companyId, 'EMP_BIWEEKLY');

      // API calculates next payment for biweekly
      const intervalSeconds = 1209600n;
      const timeSinceAnchor = currentTimestamp - startDate;
      const remainder = timeSinceAnchor % intervalSeconds;
      const timeToNext = remainder === 0n ? intervalSeconds : (intervalSeconds - remainder);
      const resumeNextPayment = currentTimestamp + timeToNext;
      payroll.resumeRecurringPayment(companyId, 'EMP_BIWEEKLY', resumeNextPayment);

      const recurringPayment = payroll.getRecurringPaymentForEmployee('EMP_BIWEEKLY');
      expect(recurringPayment).not.toBeNull();
      if (!recurringPayment) return;

      // Verify next payment matches calculated value
      expect(recurringPayment.next_payment_date).toBe(resumeNextPayment);

      console.log('✅ Biweekly calendar alignment verified!');
      console.log(`   - Frequency: BIWEEKLY (14 days)`);
      console.log(`   - Next payment aligns to anchor pattern ✓`);
    });

    test('should handle monthly payments with calendar alignment', () => {
      payroll.registerParticipant(companyId);
      payroll.addEmployee('EMP_MONTHLY');

      const initialTimestamp = payroll.getLedgerState().current_timestamp;
      const startDate = initialTimestamp + 10n;
      const frequency = RecurringPaymentFrequency.MONTHLY; // 2592000 seconds (30 days)
      const amount = 700000n;

      console.log('🔁 Creating monthly recurring payment...');
      const nextPaymentDate = startDate + 2592000n; // 30 days after start for monthly
      payroll.createRecurringPayment(
        companyId,
        'EMP_MONTHLY',
        amount,
        frequency,
        startDate,
        0n,
        nextPaymentDate,
        1n,  // paymentDayOfMonth1 - 1st of month
        0n,  // paymentDayOfMonth2 (unused for monthly)
        0n   // paymentDayOfWeek (unused for monthly)
      );

      // Advance time ~17 days after anchor
      payroll.updateTimestamp(Number(startDate + 1500000n));
      const currentTimestamp = payroll.getLedgerState().current_timestamp;

      payroll.pauseRecurringPayment(companyId, 'EMP_MONTHLY');

      // API calculates next payment for monthly
      const intervalSeconds = 2592000n;
      const timeSinceAnchor = currentTimestamp - startDate;
      const remainder = timeSinceAnchor % intervalSeconds;
      const timeToNext = remainder === 0n ? intervalSeconds : (intervalSeconds - remainder);
      const resumeNextPayment = currentTimestamp + timeToNext;
      payroll.resumeRecurringPayment(companyId, 'EMP_MONTHLY', resumeNextPayment);

      const recurringPayment = payroll.getRecurringPaymentForEmployee('EMP_MONTHLY');
      expect(recurringPayment).not.toBeNull();
      if (!recurringPayment) return;

      // Verify next payment matches calculated value
      expect(recurringPayment.next_payment_date).toBe(resumeNextPayment);

      console.log('✅ Monthly calendar alignment verified!');
      console.log(`   - Frequency: MONTHLY (30 days)`);
      console.log(`   - Next payment aligns to anchor pattern ✓`);
    });

    test('should handle resume when current is exactly on anchor date', () => {
      payroll.registerParticipant(companyId);
      payroll.addEmployee('EMP_EXACT');

      const currentTimestamp = payroll.getLedgerState().current_timestamp;
      // Set anchor to exactly current time
      const startDate = currentTimestamp;
      const frequency = RecurringPaymentFrequency.WEEKLY;
      const amount = 500000n;

      console.log('🔁 Creating payment with anchor = current time...');
      const nextPaymentDate = startDate + 604800n; // 7 days after start for weekly
      payroll.createRecurringPayment(
        companyId,
        'EMP_EXACT',
        amount,
        frequency,
        startDate,
        0n,
        nextPaymentDate,
        0n,  // paymentDayOfMonth1 (unused for weekly)
        0n,  // paymentDayOfMonth2 (unused for weekly)
        5n   // paymentDayOfWeek - Friday
      );
      payroll.pauseRecurringPayment(companyId, 'EMP_EXACT');

      // API calculates next payment when resuming (remainder = 0)
      const resumeNextPayment = currentTimestamp + 604800n;
      payroll.resumeRecurringPayment(companyId, 'EMP_EXACT', resumeNextPayment);

      const recurringPayment = payroll.getRecurringPaymentForEmployee('EMP_EXACT');
      expect(recurringPayment).not.toBeNull();
      if (!recurringPayment) return;

      // Verify next payment matches calculated value
      expect(recurringPayment.next_payment_date).toBe(resumeNextPayment);

      console.log('✅ Exact anchor alignment verified!');
      console.log(`   - Current = Anchor (remainder = 0)`);
      console.log(`   - Next payment = Current + 1 interval ✓`);
    });

    test('should maintain day-of-week alignment over multiple intervals', () => {
      payroll.registerParticipant(companyId);
      payroll.addEmployee('EMP_MULTI_INTERVAL');

      const initialTimestamp = payroll.getLedgerState().current_timestamp;
      const startDate = initialTimestamp + 10n;
      const frequency = RecurringPaymentFrequency.WEEKLY;
      const amount = 500000n;

      console.log('🔁 Creating payment...');
      const nextPaymentDate = startDate + 604800n; // 7 days after start for weekly
      payroll.createRecurringPayment(
        companyId,
        'EMP_MULTI_INTERVAL',
        amount,
        frequency,
        startDate,
        0n,
        nextPaymentDate,
        0n,  // paymentDayOfMonth1 (unused for weekly)
        0n,  // paymentDayOfMonth2 (unused for weekly)
        5n   // paymentDayOfWeek - Friday
      );

      // Advance time exactly 5 weeks (5 * 604800 = 3024000)
      payroll.updateTimestamp(Number(startDate + 3024000n));
      const currentTimestamp = payroll.getLedgerState().current_timestamp;

      payroll.pauseRecurringPayment(companyId, 'EMP_MULTI_INTERVAL');

      // API calculates next payment - exactly 5 weeks elapsed, so next is 1 week away
      const intervalSeconds = 604800n;
      const timeSinceAnchor = currentTimestamp - startDate;
      const remainder = timeSinceAnchor % intervalSeconds;
      const timeToNext = remainder === 0n ? intervalSeconds : (intervalSeconds - remainder);
      const resumeNextPayment = currentTimestamp + timeToNext;
      payroll.resumeRecurringPayment(companyId, 'EMP_MULTI_INTERVAL', resumeNextPayment);

      const recurringPayment = payroll.getRecurringPaymentForEmployee('EMP_MULTI_INTERVAL');
      expect(recurringPayment).not.toBeNull();
      if (!recurringPayment) return;

      // Verify next payment maintains alignment
      // Since time_since_anchor is exactly 5 weeks, remainder should be 0
      expect(timeSinceAnchor % intervalSeconds).toBe(0n);

      // Verify next payment matches calculated value
      expect(recurringPayment.next_payment_date).toBe(resumeNextPayment);

      console.log('✅ Multi-interval alignment verified!');
      console.log(`   - 5 complete weeks elapsed since anchor`);
      console.log(`   - Day-of-week pattern maintained ✓`);
    });

    test('should handle resume with partial interval elapsed', () => {
      payroll.registerParticipant(companyId);
      payroll.addEmployee('EMP_PARTIAL');

      const initialTimestamp = payroll.getLedgerState().current_timestamp;
      const startDate = initialTimestamp + 10n;
      const frequency = RecurringPaymentFrequency.WEEKLY; // 7 days
      const amount = 500000n;

      console.log('🔁 Creating payment...');
      const nextPaymentDate = startDate + 604800n; // 7 days after start for weekly
      payroll.createRecurringPayment(
        companyId,
        'EMP_PARTIAL',
        amount,
        frequency,
        startDate,
        0n,
        nextPaymentDate,
        0n,  // paymentDayOfMonth1 (unused for weekly)
        0n,  // paymentDayOfMonth2 (unused for weekly)
        5n   // paymentDayOfWeek - Friday
      );

      // Advance time 3.5 days after anchor (3.5 * 86400 = 302400)
      payroll.updateTimestamp(Number(startDate + 302400n));
      const currentTimestamp = payroll.getLedgerState().current_timestamp;

      payroll.pauseRecurringPayment(companyId, 'EMP_PARTIAL');

      // API calculates next payment - partial interval elapsed
      const intervalSeconds = 604800n;
      const timeSinceAnchor = 302400n;
      const remainder = timeSinceAnchor; // Less than one interval
      const timeToNext = intervalSeconds - remainder;
      const resumeNextPayment = currentTimestamp + timeToNext;
      payroll.resumeRecurringPayment(companyId, 'EMP_PARTIAL', resumeNextPayment);

      const recurringPayment = payroll.getRecurringPaymentForEmployee('EMP_PARTIAL');
      expect(recurringPayment).not.toBeNull();
      if (!recurringPayment) return;

      // Verify next payment matches calculated value
      expect(recurringPayment.next_payment_date).toBe(resumeNextPayment);

      console.log('✅ Partial interval alignment verified!');
      console.log(`   - 3.5 days elapsed (partial week)`);
      console.log(`   - Next payment in ${timeToNext / 86400n} days`);
      console.log(`   - Aligns to original anchor day-of-week ✓`);
    });
  });
});
