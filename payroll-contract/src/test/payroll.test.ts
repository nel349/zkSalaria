import { describe, test, expect, beforeEach } from 'vitest';
import { PayrollTestSetup } from './payroll-setup.js';
import { EmploymentStatus } from '../types.js';

describe('zkSalaria Payroll Tests (Encrypted Balance System)', () => {
  let payroll: PayrollTestSetup;

  beforeEach(() => {
    payroll = new PayrollTestSetup();
    console.log('\n🔄 Payroll system initialized with encrypted balances\n');
  });

  describe('Company Registration', () => {
    test('should register a new company', () => {
      // Arrange
      const companyId = 'COMP001';
      const companyName = 'Acme Corp';

      // Act
      payroll.registerCompany(companyId, companyName);

      // Assert
      expect(payroll.getTotalCompanies()).toBe(1n);
      console.log('✅ Company registration test passed');
    });

    test('should register multiple companies', () => {
      payroll.registerCompany('COMP001', 'Acme Corp');
      payroll.registerCompany('COMP002', 'Beta Inc');
      payroll.registerCompany('COMP003', 'Gamma LLC');

      expect(payroll.getTotalCompanies()).toBe(3n);
      console.log('✅ Multiple company registration test passed');
    });

    test('should fail to register duplicate company', () => {
      payroll.registerCompany('COMP001', 'Acme Corp');

      expect(() => {
        payroll.registerCompany('COMP001', 'Duplicate');
      }).toThrow(); // Should fail "Company already exists"
    });
  });

  describe('Employee Management', () => {
    test('should add employee to company', () => {
      // Arrange
      const companyId = 'COMP002';
      const employeeId = 'EMP001';

      // Act
      payroll.registerCompany(companyId, 'Test Company');
      payroll.addEmployee(companyId, employeeId);

      // Assert
      expect(payroll.getTotalEmployees()).toBe(1n);
      console.log('✅ Employee addition test passed');
    });

    test('should add multiple employees to same company', () => {
      const companyId = 'COMP003';

      payroll.registerCompany(companyId, 'Multi Employee Corp');
      payroll.addEmployee(companyId, 'EMP001');
      payroll.addEmployee(companyId, 'EMP002');
      payroll.addEmployee(companyId, 'EMP003');

      expect(payroll.getTotalEmployees()).toBe(3n);
      console.log('✅ Multiple employee addition test passed');
    });

    test('should fail to add employee to non-existent company', () => {
      expect(() => {
        payroll.addEmployee('NONEXISTENT', 'EMP001');
      }).toThrow(); // Should fail "Company not found"
    });

    test('should fail to add duplicate employee', () => {
      const companyId = 'COMP004';
      const employeeId = 'EMP001';

      payroll.registerCompany(companyId, 'Test Company');
      payroll.addEmployee(companyId, employeeId);

      expect(() => {
        payroll.addEmployee(companyId, employeeId);
      }).toThrow(); // Should fail "Employee already exists"
    });
  });

  describe('Token Operations (Encrypted Balance System)', () => {
    test('should mint tokens for testing', () => {
      // Arrange
      const mintAmount = 1000000n;

      // Act
      payroll.mintTokens(mintAmount);

      // Assert
      expect(payroll.getTotalSupply()).toBe(mintAmount);
      console.log('✅ Token minting test passed');
    });

    test('should deposit company funds (creates encrypted balance)', () => {
      // Arrange
      const companyId = 'COMP003';
      const depositAmount = 50000n;
      const initialSupply = payroll.getTotalSupply();

      // Setup
      payroll.registerCompany(companyId, 'Deposit Test Corp');

      // Act
      payroll.depositCompanyFunds(companyId, depositAmount);

      // Assert - Check public ledger (not encrypted balance)
      // Total supply should increase (tokens minted)
      expect(payroll.getTotalSupply()).toBe(initialSupply + depositAmount);

      // NOTE: Cannot verify encrypted balance directly - it's encrypted on ledger!
      // In production, would need company's encryption key to decrypt balance
      console.log('✅ Company deposit test passed (balance encrypted on ledger)');
    });

    test('should handle multiple company deposits', () => {
      payroll.registerCompany('COMP001', 'Company 1');
      payroll.registerCompany('COMP002', 'Company 2');

      const deposit1 = 50000n;
      const deposit2 = 75000n;

      payroll.depositCompanyFunds('COMP001', deposit1);
      payroll.depositCompanyFunds('COMP002', deposit2);

      // Total supply should reflect both deposits
      expect(payroll.getTotalSupply()).toBe(deposit1 + deposit2);
      console.log('✅ Multiple company deposits test passed');
    });
  });

  describe('Salary Payments (Encrypted Transfer)', () => {
    test('should pay employee salary (encrypted balance transfer)', () => {
      // Arrange
      const companyId = 'COMP004';
      const employeeId = 'EMP002';
      const depositAmount = 100000n;
      const salaryAmount = 7500n;

      // Setup
      payroll.registerCompany(companyId, 'Payroll Test Corp');
      payroll.addEmployee(companyId, employeeId);
      payroll.depositCompanyFunds(companyId, depositAmount);

      // Act
      payroll.payEmployee(companyId, employeeId, salaryAmount);

      // Assert - Check PUBLIC ledger only (balances are encrypted!)
      expect(payroll.getTotalPayments()).toBe(1n);
      expect(payroll.getTotalSupply()).toBe(depositAmount); // Supply unchanged (transfer, not mint/burn)

      // NOTE: Cannot verify encrypted balances directly - they're encrypted on ledger!
      // This is the PRIVACY benefit - even in tests, balances are private
      console.log('✅ Salary payment test passed (balances encrypted on ledger)');
    });

    test('should process multiple salary payments', () => {
      // Arrange
      const companyId = 'COMP005';
      const employee1 = 'EMP003';
      const employee2 = 'EMP004';
      const depositAmount = 200000n;
      const salary1 = 7500n;
      const salary2 = 8000n;

      // Setup
      payroll.registerCompany(companyId, 'Multi Pay Corp');
      payroll.addEmployee(companyId, employee1);
      payroll.addEmployee(companyId, employee2);
      payroll.depositCompanyFunds(companyId, depositAmount);

      // Act
      payroll.payEmployee(companyId, employee1, salary1);
      payroll.payEmployee(companyId, employee2, salary2);

      // Assert - Check PUBLIC ledger only
      expect(payroll.getTotalPayments()).toBe(2n);
      expect(payroll.getTotalSupply()).toBe(depositAmount); // Supply unchanged

      console.log('✅ Multiple payment test passed (encrypted transfers)');
    });

    test('should fail payment with insufficient company funds', () => {
      const companyId = 'COMP006';
      const employeeId = 'EMP005';

      payroll.registerCompany(companyId, 'Broke Corp');
      payroll.addEmployee(companyId, employeeId);
      payroll.depositCompanyFunds(companyId, 5000n); // Small deposit

      expect(() => {
        payroll.payEmployee(companyId, employeeId, 10000n); // Try to pay more than balance
      }).toThrow(); // Should fail "Insufficient company funds"
    });

    test('should fail payment to non-existent employee', () => {
      const companyId = 'COMP007';

      payroll.registerCompany(companyId, 'Test Corp');
      payroll.depositCompanyFunds(companyId, 50000n);

      expect(() => {
        payroll.payEmployee(companyId, 'NONEXISTENT', 5000n);
      }).toThrow(); // Should fail "Employee not found"
    });

    test('should fail payment from non-existent company', () => {
      expect(() => {
        payroll.payEmployee('NONEXISTENT', 'EMP001', 5000n);
      }).toThrow(); // Should fail "Company not found"
    });
  });

  describe('Employee Withdrawals (Encrypted Balance Decrement)', () => {
    test('should allow employee to withdraw salary', () => {
      // Arrange
      const companyId = 'COMP008';
      const employeeId = 'EMP006';
      const depositAmount = 100000n;
      const salaryAmount = 7500n;
      const withdrawAmount = 5000n;
      const initialSupply = payroll.getTotalSupply();

      // Setup
      payroll.registerCompany(companyId, 'Withdraw Test Corp');
      payroll.addEmployee(companyId, employeeId);
      payroll.depositCompanyFunds(companyId, depositAmount);
      payroll.payEmployee(companyId, employeeId, salaryAmount);

      // Act
      payroll.withdrawEmployeeSalary(employeeId, withdrawAmount);

      // Assert - Check PUBLIC ledger only
      // Total supply should decrease (tokens burned)
      expect(payroll.getTotalSupply()).toBe(initialSupply + depositAmount - withdrawAmount);

      // NOTE: Cannot verify encrypted balance directly - it's encrypted on ledger!
      console.log('✅ Employee withdrawal test passed (balance encrypted on ledger)');
    });

    test('should fail withdrawal with insufficient employee balance', () => {
      const companyId = 'COMP009';
      const employeeId = 'EMP007';

      payroll.registerCompany(companyId, 'Test Corp');
      payroll.addEmployee(companyId, employeeId);
      payroll.depositCompanyFunds(companyId, 50000n);
      payroll.payEmployee(companyId, employeeId, 5000n); // Employee has 5000

      expect(() => {
        payroll.withdrawEmployeeSalary(employeeId, 10000n); // Try to withdraw more
      }).toThrow(); // Should fail "Insufficient balance"
    });

    test('should fail withdrawal for non-existent employee', () => {
      expect(() => {
        payroll.withdrawEmployeeSalary('NONEXISTENT', 1000n);
      }).toThrow(); // Should fail "Employee not found"
    });
  });

  describe('Payment History (Private Witness - for ZKML)', () => {
    test('should track employee payment history', () => {
      // Arrange
      const companyId = 'COMP010';
      const employeeId = 'EMP008';

      // Setup
      payroll.registerCompany(companyId, 'History Test Corp');
      payroll.addEmployee(companyId, employeeId);
      payroll.depositCompanyFunds(companyId, 100000n);

      // Act - Make 3 payments
      payroll.payEmployee(companyId, employeeId, 5000n);
      payroll.payEmployee(companyId, employeeId, 6000n);
      payroll.payEmployee(companyId, employeeId, 7000n);

      // Assert - Check payment history in witness (for ZKML)
      const history = payroll.getEmployeePaymentHistory(employeeId);

      // History should have 3 non-empty records (most recent at end)
      const nonEmptyPayments = history.filter(record => record.amount > 0n);
      expect(nonEmptyPayments.length).toBe(3);

      // Verify amounts (should be in order)
      expect(nonEmptyPayments[0].amount).toBe(5000n);
      expect(nonEmptyPayments[1].amount).toBe(6000n);
      expect(nonEmptyPayments[2].amount).toBe(7000n);

      console.log('✅ Payment history tracking test passed');
    });
  });

  describe('System State and Privacy', () => {
    test('should maintain correct overall state with encrypted balances', () => {
      // Arrange & Act
      const companyId = 'COMP011';
      const employeeId = 'EMP009';

      payroll.registerCompany(companyId, 'State Test Corp');
      payroll.addEmployee(companyId, employeeId);
      payroll.depositCompanyFunds(companyId, 50000n);
      payroll.payEmployee(companyId, employeeId, 7500n);

      // Assert - Only public ledger values
      expect(payroll.getTotalCompanies()).toBe(1n);
      expect(payroll.getTotalEmployees()).toBe(1n);
      expect(payroll.getTotalPayments()).toBe(1n);
      expect(payroll.getTotalSupply()).toBe(50000n); // No withdrawals yet

      // Debug output
      payroll.printPayrollState();

      console.log('✅ System state test passed');
    });

    test('should demonstrate privacy benefits of encrypted balances', () => {
      console.log('\n🔒 zkSalaria Encrypted Balance Privacy:');
      console.log('├─ Company balances encrypted with company key');
      console.log('├─ Employee balances encrypted with employee key');
      console.log('├─ Balance mappings enable decryption with proper keys');
      console.log('├─ Only total_supply visible on public ledger (aggregate)');
      console.log('├─ Individual balances hidden from blockchain observers');
      console.log('└─ Payment history stored privately for ZKML credit scoring');

      // Create example scenario
      payroll.registerCompany('COMP001', 'Acme Corp');
      payroll.registerCompany('COMP002', 'Beta Inc');
      payroll.addEmployee('COMP001', 'EMP001');
      payroll.addEmployee('COMP002', 'EMP002');

      payroll.depositCompanyFunds('COMP001', 100000n);
      payroll.depositCompanyFunds('COMP002', 75000n);

      payroll.payEmployee('COMP001', 'EMP001', 8000n);
      payroll.payEmployee('COMP002', 'EMP002', 7500n);

      console.log('\n💡 Even in tests, individual balances are encrypted!');
      console.log('💡 Total supply: ' + payroll.getTotalSupply().toString() + ' (public aggregate)');
      console.log('💡 Individual company/employee balances: ENCRYPTED ✅');

      payroll.printPayrollState();
    });

    test('should handle complex multi-company payroll workflow', () => {
      // Company 1: 3 employees
      payroll.registerCompany('COMP001', 'Big Corp');
      payroll.addEmployee('COMP001', 'EMP001');
      payroll.addEmployee('COMP001', 'EMP002');
      payroll.addEmployee('COMP001', 'EMP003');
      payroll.depositCompanyFunds('COMP001', 500000n);

      // Company 2: 2 employees
      payroll.registerCompany('COMP002', 'Small Inc');
      payroll.addEmployee('COMP002', 'EMP004');
      payroll.addEmployee('COMP002', 'EMP005');
      payroll.depositCompanyFunds('COMP002', 200000n);

      // Process payments
      payroll.payEmployee('COMP001', 'EMP001', 10000n);
      payroll.payEmployee('COMP001', 'EMP002', 12000n);
      payroll.payEmployee('COMP001', 'EMP003', 15000n);
      payroll.payEmployee('COMP002', 'EMP004', 8000n);
      payroll.payEmployee('COMP002', 'EMP005', 9000n);

      // Process withdrawals
      payroll.withdrawEmployeeSalary('EMP001', 5000n);
      payroll.withdrawEmployeeSalary('EMP004', 4000n);

      // Assert final state
      expect(payroll.getTotalCompanies()).toBe(2n);
      expect(payroll.getTotalEmployees()).toBe(5n);
      expect(payroll.getTotalPayments()).toBe(5n);

      // Total supply: deposits (700000) - withdrawals (9000)
      expect(payroll.getTotalSupply()).toBe(691000n);

      console.log('✅ Complex workflow test passed');
      payroll.printPayrollState();
    });
  });

  describe('Employment Verification System', () => {
    test('should create employment record when adding employee', () => {
      // Arrange
      const companyId = 'COMP100';
      const employeeId = 'EMP100';

      // Act
      payroll.registerCompany(companyId, 'Employment Test Corp');
      payroll.addEmployee(companyId, employeeId);

      // Assert
      // Employment record is created with ACTIVE status
      // We'll verify this through the verify_employment circuit after granting disclosure
      expect(payroll.getTotalEmployees()).toBe(1n);
      console.log('✅ Employment record creation test passed');
    });

    test('should grant employment disclosure and verify active employment', () => {
      // Arrange
      const companyId = 'COMP101';
      const employeeId = 'EMP101';
      const verifierId = 'LANDLORD001';

      // Setup
      payroll.registerCompany(companyId, 'Acme Corp');
      payroll.addEmployee(companyId, employeeId);

      // Act
      payroll.grantEmploymentDisclosure(employeeId, verifierId, companyId, 0); // 0 = never expires

      // Verify employment
      const result = payroll.verifyEmployment(employeeId, companyId, verifierId);

      // Assert
      // Result should be 0x01 (employed and active)
      expect(result[0]).toBe(1);
      console.log('✅ Employment disclosure and verification test passed');
    });

    test('should update employment status to inactive', () => {
      // Arrange
      const companyId = 'COMP102';
      const employeeId = 'EMP102';
      const verifierId = 'LANDLORD002';

      // Setup
      payroll.registerCompany(companyId, 'Status Test Corp');
      payroll.addEmployee(companyId, employeeId);
      payroll.grantEmploymentDisclosure(employeeId, verifierId, companyId, 0);

      // Verify initially active
      let result = payroll.verifyEmployment(employeeId, companyId, verifierId);
      expect(result[0]).toBe(1); // Active

      // Act - Update status to INACTIVE
      payroll.updateEmploymentStatus(companyId, employeeId, EmploymentStatus.INACTIVE);

      // Verify now inactive
      result = payroll.verifyEmployment(employeeId, companyId, verifierId);

      // Assert
      expect(result[0]).toBe(0); // Inactive
      console.log('✅ Employment status update test passed');
    });

    test('should update employment status to terminated', () => {
      // Arrange
      const companyId = 'COMP103';
      const employeeId = 'EMP103';
      const verifierId = 'LANDLORD003';

      // Setup
      payroll.registerCompany(companyId, 'Termination Test Corp');
      payroll.addEmployee(companyId, employeeId);
      payroll.grantEmploymentDisclosure(employeeId, verifierId, companyId, 0);

      // Verify initially active
      let result = payroll.verifyEmployment(employeeId, companyId, verifierId);
      expect(result[0]).toBe(1); // Active

      // Act - Update status to TERMINATED
      payroll.updateEmploymentStatus(companyId, employeeId, EmploymentStatus.TERMINATED);

      // Verify now terminated
      result = payroll.verifyEmployment(employeeId, companyId, verifierId);

      // Assert
      expect(result[0]).toBe(0); // Not active (terminated)
      console.log('✅ Employment termination test passed');
    });

    test('should update employment status to on_leave', () => {
      // Arrange
      const companyId = 'COMP104';
      const employeeId = 'EMP104';
      const verifierId = 'LANDLORD004';

      // Setup
      payroll.registerCompany(companyId, 'Leave Test Corp');
      payroll.addEmployee(companyId, employeeId);
      payroll.grantEmploymentDisclosure(employeeId, verifierId, companyId, 0);

      // Act - Update status to ON_LEAVE
      payroll.updateEmploymentStatus(companyId, employeeId, EmploymentStatus.ON_LEAVE);

      // Verify
      const result = payroll.verifyEmployment(employeeId, companyId, verifierId);

      // Assert
      expect(result[0]).toBe(0); // Not active (on leave)
      console.log('✅ Employment on_leave test passed');
    });

    test('should fail to verify employment without disclosure permission', () => {
      // Arrange
      const companyId = 'COMP105';
      const employeeId = 'EMP105';
      const verifierId = 'LANDLORD005';

      // Setup
      payroll.registerCompany(companyId, 'No Disclosure Corp');
      payroll.addEmployee(companyId, employeeId);

      // Act & Assert - Try to verify without disclosure (should fail)
      expect(() => {
        payroll.verifyEmployment(employeeId, companyId, verifierId);
      }).toThrow(); // Should fail "No disclosure permission"

      console.log('✅ No disclosure permission test passed');
    });

    test('should fail to update status for non-existent employment record', () => {
      // Arrange
      const companyId = 'COMP106';
      const employeeId = 'EMP106';

      // Setup
      payroll.registerCompany(companyId, 'Test Corp');
      payroll.addEmployee(companyId, employeeId);

      // Act & Assert - Try to update status for wrong company
      expect(() => {
        payroll.updateEmploymentStatus('WRONGCOMPANY', employeeId, EmploymentStatus.INACTIVE);
      }).toThrow(); // Should fail "Company not found" or "Employment record not found"

      console.log('✅ Invalid employment update test passed');
    });

    test('should handle employment verification with expiration', () => {
      // Arrange
      const companyId = 'COMP107';
      const employeeId = 'EMP107';
      const verifierId = 'LANDLORD007';
      const currentTime = payroll.getCurrentTimestamp();
      const expirationDelta = 3600; // 1 hour in seconds

      // Setup
      payroll.registerCompany(companyId, 'Expiration Test Corp');
      payroll.addEmployee(companyId, employeeId);

      // Grant disclosure with expiration
      payroll.grantEmploymentDisclosure(employeeId, verifierId, companyId, expirationDelta);

      // Verify - should work before expiration
      let result = payroll.verifyEmployment(employeeId, companyId, verifierId);
      expect(result[0]).toBe(1); // Active

      // Act - Advance time past expiration
      payroll.updateTimestamp(currentTime + expirationDelta + 1);

      // Assert - Should fail after expiration
      expect(() => {
        payroll.verifyEmployment(employeeId, companyId, verifierId);
      }).toThrow(); // Should fail "Authorization expired"

      console.log('✅ Employment disclosure expiration test passed');
    });

    test('should handle multiple employees at same company', () => {
      // Arrange
      const companyId = 'COMP108';
      const employee1 = 'EMP108';
      const employee2 = 'EMP109';
      const verifierId = 'LANDLORD008';

      // Setup
      payroll.registerCompany(companyId, 'Multi Employee Corp');
      payroll.addEmployee(companyId, employee1);
      payroll.addEmployee(companyId, employee2);

      // Grant disclosures
      payroll.grantEmploymentDisclosure(employee1, verifierId, companyId, 0);
      payroll.grantEmploymentDisclosure(employee2, verifierId, companyId, 0);

      // Verify both employed
      let result1 = payroll.verifyEmployment(employee1, companyId, verifierId);
      let result2 = payroll.verifyEmployment(employee2, companyId, verifierId);

      expect(result1[0]).toBe(1); // Active
      expect(result2[0]).toBe(1); // Active

      // Act - Terminate employee1, keep employee2 active
      payroll.updateEmploymentStatus(companyId, employee1, EmploymentStatus.TERMINATED);

      // Assert
      result1 = payroll.verifyEmployment(employee1, companyId, verifierId);
      result2 = payroll.verifyEmployment(employee2, companyId, verifierId);

      expect(result1[0]).toBe(0); // Terminated
      expect(result2[0]).toBe(1); // Still active

      console.log('✅ Multiple employee status test passed');
    });

    test('should handle re-activation of employee', () => {
      // Arrange
      const companyId = 'COMP109';
      const employeeId = 'EMP110';
      const verifierId = 'LANDLORD009';

      // Setup
      payroll.registerCompany(companyId, 'Reactivation Test Corp');
      payroll.addEmployee(companyId, employeeId);
      payroll.grantEmploymentDisclosure(employeeId, verifierId, companyId, 0);

      // Act - Deactivate then reactivate
      payroll.updateEmploymentStatus(companyId, employeeId, EmploymentStatus.INACTIVE);
      let result = payroll.verifyEmployment(employeeId, companyId, verifierId);
      expect(result[0]).toBe(0); // Inactive

      payroll.updateEmploymentStatus(companyId, employeeId, EmploymentStatus.ACTIVE);
      result = payroll.verifyEmployment(employeeId, companyId, verifierId);

      // Assert
      expect(result[0]).toBe(1); // Active again
      console.log('✅ Employee re-activation test passed');
    });
  });
});
