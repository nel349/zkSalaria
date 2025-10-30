import { describe, test, expect, beforeEach } from 'vitest';
import { PayrollTestSetup } from './payroll-setup.js';

describe('zkSalaria Payroll Tests', () => {
  let payroll: PayrollTestSetup;

  beforeEach(() => {
    payroll = new PayrollTestSetup();
    console.log('\n🔄 Payroll system initialized\n');
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
  });

  describe('Token Operations', () => {
    test('should mint tokens for testing', () => {
      // Arrange
      const mintAmount = 1000000n;

      // Act
      payroll.mintTokens(mintAmount);

      // Assert
      expect(payroll.getTotalSupply()).toBe(mintAmount);
      console.log('✅ Token minting test passed');
    });

    test('should deposit company funds', () => {
      // Arrange
      const companyId = 'COMP003';
      const depositAmount = 50000n;

      // Setup
      payroll.registerCompany(companyId, 'Deposit Test Corp');

      // Act
      payroll.depositCompanyFunds(companyId, depositAmount);

      // Assert
      const balance = payroll.getCompanyBalance(companyId);
      expect(balance).toBe(depositAmount);
      console.log('✅ Company deposit test passed');
    });
  });

  describe('Salary Payments', () => {
    test('should pay employee salary', () => {
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

      // Assert
      const companyBalance = payroll.getCompanyBalance(companyId);
      const employeeBalance = payroll.getEmployeeBalance(employeeId);

      expect(companyBalance).toBe(depositAmount - salaryAmount);
      expect(employeeBalance).toBe(salaryAmount);
      expect(payroll.getTotalPayments()).toBe(1n);

      console.log('✅ Salary payment test passed');
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

      // Assert
      const companyBalance = payroll.getCompanyBalance(companyId);
      const emp1Balance = payroll.getEmployeeBalance(employee1);
      const emp2Balance = payroll.getEmployeeBalance(employee2);

      expect(companyBalance).toBe(depositAmount - salary1 - salary2);
      expect(emp1Balance).toBe(salary1);
      expect(emp2Balance).toBe(salary2);
      expect(payroll.getTotalPayments()).toBe(2n);

      console.log('✅ Multiple payment test passed');
    });
  });

  describe('Employee Withdrawals', () => {
    test('should allow employee to withdraw salary', () => {
      // Arrange
      const companyId = 'COMP006';
      const employeeId = 'EMP005';
      const depositAmount = 100000n;
      const salaryAmount = 7500n;
      const withdrawAmount = 5000n;

      // Setup
      payroll.registerCompany(companyId, 'Withdraw Test Corp');
      payroll.addEmployee(companyId, employeeId);
      payroll.depositCompanyFunds(companyId, depositAmount);
      payroll.payEmployee(companyId, employeeId, salaryAmount);

      // Act
      payroll.withdrawEmployeeSalary(employeeId, withdrawAmount);

      // Assert
      const employeeBalance = payroll.getEmployeeBalance(employeeId);
      expect(employeeBalance).toBe(salaryAmount - withdrawAmount);

      console.log('✅ Employee withdrawal test passed');
    });
  });

  describe('System State', () => {
    test('should maintain correct overall state', () => {
      // Arrange & Act
      const companyId = 'COMP007';
      const employeeId = 'EMP006';

      payroll.registerCompany(companyId, 'State Test Corp');
      payroll.addEmployee(companyId, employeeId);
      payroll.depositCompanyFunds(companyId, 50000n);
      payroll.payEmployee(companyId, employeeId, 7500n);

      // Assert
      expect(payroll.getTotalCompanies()).toBe(1n);
      expect(payroll.getTotalEmployees()).toBe(1n);
      expect(payroll.getTotalPayments()).toBe(1n);

      // Debug output
      payroll.printPayrollState();

      console.log('✅ System state test passed');
    });
  });
});
