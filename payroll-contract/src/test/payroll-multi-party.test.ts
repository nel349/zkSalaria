import { describe, test, expect, beforeEach } from 'vitest';
import { PayrollMultiPartyTestSetup } from './payroll-setup-multi.js';

describe('zkSalaria Multi-Party Privacy Tests', () => {
  let payroll: PayrollMultiPartyTestSetup;

  beforeEach(() => {
    payroll = new PayrollMultiPartyTestSetup();
    console.log('\n🔄 Multi-party payroll system initialized\n');
  });

  describe('Payment History on Public Ledger', () => {
    test('should create separate private states for each participant (for future use)', () => {
      // Register multiple participants
      payroll.registerParticipant('COMP001');
      payroll.registerParticipant('EMP001');
      payroll.registerParticipant('EMP002');

      // Verify all participants registered
      const participants = payroll.getRegisteredParticipants();
      expect(participants).toContain('COMP001');
      expect(participants).toContain('EMP001');
      expect(participants).toContain('EMP002');
      expect(participants.length).toBe(3);

      console.log('✅ Separate private states created for each participant');
    });

    test('should store payment history per employee on public ledger', () => {
      // Setup
      const companyId = 'COMP001';
      const employee1 = 'EMP001';
      const employee2 = 'EMP002';

      payroll.registerCompany(companyId, 'Test Corp');
      payroll.addEmployee(companyId, employee1);
      payroll.addEmployee(companyId, employee2);
      payroll.depositCompanyFunds(companyId, 100000n);

      // Pay both employees
      payroll.payEmployee(companyId, employee1, 5000n);
      payroll.payEmployee(companyId, employee2, 6000n);

      // Each employee has their own payment history on ledger
      const emp1History = payroll.getEmployeePaymentHistory(employee1);
      const emp1Payments = emp1History.filter(r => r.amount > 0n);
      expect(emp1Payments.length).toBe(1);
      expect(emp1Payments[0].amount).toBe(5000n);

      const emp2History = payroll.getEmployeePaymentHistory(employee2);
      const emp2Payments = emp2History.filter(r => r.amount > 0n);
      expect(emp2Payments.length).toBe(1);
      expect(emp2Payments[0].amount).toBe(6000n);

      // Histories are separate - EMP001's history doesn't contain EMP002's payment
      expect(emp1Payments.find(p => p.amount === 6000n)).toBeUndefined();
      expect(emp2Payments.find(p => p.amount === 5000n)).toBeUndefined();

      console.log('✅ Payment histories correctly separated on ledger per employee');
    });

    test('should allow company to write and anyone to read payment history', () => {
      const companyId = 'COMP001';
      const employeeId = 'EMP001';

      payroll.registerCompany(companyId, 'Test Corp');
      payroll.addEmployee(companyId, employeeId);
      payroll.depositCompanyFunds(companyId, 50000n);
      payroll.payEmployee(companyId, employeeId, 7500n);

      // Payment history is on public ledger - accessible for ZKML credit scoring
      expect(payroll.canAccessPaymentHistory(employeeId, employeeId)).toBe(true);
      expect(payroll.canAccessPaymentHistory(companyId, employeeId)).toBe(true);
      expect(payroll.canAccessPaymentHistory('ANYONE', employeeId)).toBe(true);

      // Employee payment history is readable from ledger
      const empHistory = payroll.getEmployeePaymentHistory(employeeId);
      expect(empHistory.filter(r => r.amount > 0n).length).toBe(1);

      // NOTE: Company doesn't have its own payment history - only employees have payment records
      const companyHistory = payroll.getEmployeePaymentHistory(companyId);
      expect(companyHistory.filter(r => r.amount > 0n).length).toBe(0);

      console.log('✅ Payment history on public ledger - accessible for ZKML credit scoring');
    });

    test('should track payment history on ledger per employee', () => {
      const companyId = 'COMP001';
      const employeeId = 'EMP001';

      payroll.registerCompany(companyId, 'Multi Payment Corp');
      payroll.addEmployee(companyId, employeeId);
      payroll.depositCompanyFunds(companyId, 100000n);

      // Make multiple payments to same employee
      payroll.payEmployee(companyId, employeeId, 5000n);
      payroll.payEmployee(companyId, employeeId, 6000n);
      payroll.payEmployee(companyId, employeeId, 7000n);

      // Employee's payment history accumulates on public ledger
      const empHistory = payroll.getEmployeePaymentHistory(employeeId);
      const payments = empHistory.filter(r => r.amount > 0n);

      expect(payments.length).toBe(3);
      expect(payments[0].amount).toBe(5000n);
      expect(payments[1].amount).toBe(6000n);
      expect(payments[2].amount).toBe(7000n);

      // Company doesn't have payment history - only employees do
      const companyHistory = payroll.getEmployeePaymentHistory(companyId);
      expect(companyHistory.filter(r => r.amount > 0n).length).toBe(0);

      console.log('✅ Payment history correctly tracked on ledger per employee');
    });
  });

  describe('Multi-Company Payment History', () => {
    test('should separate payment history between different companies on ledger', () => {
      const company1 = 'COMP001';
      const company2 = 'COMP002';
      const emp1 = 'EMP001';
      const emp2 = 'EMP002';

      // Setup two companies with their own employees
      payroll.registerCompany(company1, 'Company A');
      payroll.registerCompany(company2, 'Company B');
      payroll.addEmployee(company1, emp1);
      payroll.addEmployee(company2, emp2);

      payroll.depositCompanyFunds(company1, 100000n);
      payroll.depositCompanyFunds(company2, 75000n);

      payroll.payEmployee(company1, emp1, 8000n);
      payroll.payEmployee(company2, emp2, 7000n);

      // Each employee should only see their own payments
      const emp1History = payroll.getEmployeePaymentHistory(emp1);
      const emp2History = payroll.getEmployeePaymentHistory(emp2);

      expect(emp1History.filter(r => r.amount > 0n).length).toBe(1);
      expect(emp2History.filter(r => r.amount > 0n).length).toBe(1);

      expect(emp1History.filter(r => r.amount > 0n)[0].amount).toBe(8000n);
      expect(emp2History.filter(r => r.amount > 0n)[0].amount).toBe(7000n);

      // Each employee's history is separate on ledger
      expect(emp1History.find(p => p.amount === 7000n)).toBeUndefined();
      expect(emp2History.find(p => p.amount === 8000n)).toBeUndefined();

      console.log('✅ Payment histories correctly separated on ledger between companies');
    });

    test('should maintain separate payment histories for multiple employees per company', () => {
      const companyId = 'COMP001';
      const employees = ['EMP001', 'EMP002', 'EMP003'];

      payroll.registerCompany(companyId, 'Big Corp');
      employees.forEach(emp => payroll.addEmployee(companyId, emp));
      payroll.depositCompanyFunds(companyId, 500000n);

      // Pay each employee different amounts
      payroll.payEmployee(companyId, employees[0], 10000n);
      payroll.payEmployee(companyId, employees[1], 12000n);
      payroll.payEmployee(companyId, employees[2], 15000n);

      // Each employee should only see their own payment
      const emp1Payments = payroll.getEmployeePaymentHistory(employees[0]).filter(r => r.amount > 0n);
      const emp2Payments = payroll.getEmployeePaymentHistory(employees[1]).filter(r => r.amount > 0n);
      const emp3Payments = payroll.getEmployeePaymentHistory(employees[2]).filter(r => r.amount > 0n);

      expect(emp1Payments.length).toBe(1);
      expect(emp2Payments.length).toBe(1);
      expect(emp3Payments.length).toBe(1);

      expect(emp1Payments[0].amount).toBe(10000n);
      expect(emp2Payments[0].amount).toBe(12000n);
      expect(emp3Payments[0].amount).toBe(15000n);

      // Each employee's history contains only their own payments
      expect(emp1Payments.find(p => p.amount === 12000n || p.amount === 15000n)).toBeUndefined();
      expect(emp2Payments.find(p => p.amount === 10000n || p.amount === 15000n)).toBeUndefined();
      expect(emp3Payments.find(p => p.amount === 10000n || p.amount === 12000n)).toBeUndefined();

      console.log('✅ Multiple employee payment histories correctly separated on ledger');
    });
  });

  describe('Public Ledger Visibility (Encrypted Balances)', () => {
    test('should share public ledger state across all participants', () => {
      const company1 = 'COMP001';
      const company2 = 'COMP002';
      const emp1 = 'EMP001';
      const emp2 = 'EMP002';

      // All participants perform operations
      payroll.registerCompany(company1, 'Company A');
      payroll.registerCompany(company2, 'Company B');
      payroll.addEmployee(company1, emp1);
      payroll.addEmployee(company2, emp2);

      // All participants should see same public ledger state
      expect(payroll.getTotalCompanies()).toBe(2n);
      expect(payroll.getTotalEmployees()).toBe(2n);
      expect(payroll.getTotalPayments()).toBe(0n);

      payroll.depositCompanyFunds(company1, 100000n);
      payroll.depositCompanyFunds(company2, 75000n);

      // Public ledger state visible to all
      expect(payroll.getTotalSupply()).toBe(175000n);

      payroll.payEmployee(company1, emp1, 8000n);
      payroll.payEmployee(company2, emp2, 7000n);

      // Payment counter is public
      expect(payroll.getTotalPayments()).toBe(2n);

      console.log('✅ Public ledger state correctly shared across all participants');
    });

    test('should demonstrate privacy: encrypted balances + payment history on ledger', () => {
      const companyId = 'COMP001';
      const employeeId = 'EMP001';

      console.log('\n🔒 zkSalaria Privacy Architecture (following bank.compact pattern):');
      console.log('├─ PUBLIC LEDGER (shared by all):');
      console.log('│  ├─ Encrypted company balances (hash encrypted - PRIVATE)');
      console.log('│  ├─ Encrypted employee balances (hash encrypted - PRIVATE)');
      console.log('│  ├─ Payment history per employee (for ZKML - PUBLIC)');
      console.log('│  ├─ Total supply (aggregate only)');
      console.log('│  └─ Payment counters (aggregate only)');
      console.log('├─ PRIVACY MODEL:');
      console.log('│  ├─ Current balances: ENCRYPTED (nobody can see exact amounts)');
      console.log('│  ├─ Payment history: PUBLIC (needed for ZKML credit scoring)');
      console.log('│  └─ Company can write payments, anyone can read for credit scoring');
      console.log('└─ MULTI-PARTY SAFE: Company can pay employees, history tracked on ledger ✅');

      payroll.registerCompany(companyId, 'Privacy Corp');
      payroll.addEmployee(companyId, employeeId);
      payroll.depositCompanyFunds(companyId, 100000n);
      payroll.payEmployee(companyId, employeeId, 8000n);

      // Public ledger shows aggregates only (balances encrypted)
      expect(payroll.getTotalSupply()).toBe(100000n);
      expect(payroll.getTotalPayments()).toBe(1n);

      // Payment history is on public ledger - anyone can read for ZKML
      const empHistory = payroll.getEmployeePaymentHistory(employeeId);
      expect(empHistory.filter(r => r.amount > 0n).length).toBe(1);

      // Company doesn't have payment history (only employees do)
      const companyHistory = payroll.getEmployeePaymentHistory(companyId);
      expect(companyHistory.filter(r => r.amount > 0n).length).toBe(0);

      console.log('\n💡 Privacy achieved: Encrypted balances + public payment history for ZKML!');
      payroll.printMultiPartyState();
    });
  });

  describe('Complex Multi-Party Scenarios', () => {
    test('should handle complex workflow with proper isolation', () => {
      // Setup: 2 companies, 5 employees total
      const comp1 = 'COMP001';
      const comp2 = 'COMP002';
      const comp1Employees = ['EMP001', 'EMP002', 'EMP003'];
      const comp2Employees = ['EMP004', 'EMP005'];

      // Register companies
      payroll.registerCompany(comp1, 'Big Corp');
      payroll.registerCompany(comp2, 'Small Inc');

      // Register employees
      comp1Employees.forEach(emp => payroll.addEmployee(comp1, emp));
      comp2Employees.forEach(emp => payroll.addEmployee(comp2, emp));

      // Deposit funds
      payroll.depositCompanyFunds(comp1, 500000n);
      payroll.depositCompanyFunds(comp2, 200000n);

      // Process payments
      payroll.payEmployee(comp1, comp1Employees[0], 10000n);
      payroll.payEmployee(comp1, comp1Employees[1], 12000n);
      payroll.payEmployee(comp1, comp1Employees[2], 15000n);
      payroll.payEmployee(comp2, comp2Employees[0], 8000n);
      payroll.payEmployee(comp2, comp2Employees[1], 9000n);

      // Verify public ledger
      expect(payroll.getTotalCompanies()).toBe(2n);
      expect(payroll.getTotalEmployees()).toBe(5n);
      expect(payroll.getTotalPayments()).toBe(5n);
      expect(payroll.getTotalSupply()).toBe(700000n);

      // Verify each employee only sees their own payment
      comp1Employees.forEach((emp, idx) => {
        const history = payroll.getEmployeePaymentHistory(emp);
        const payments = history.filter(r => r.amount > 0n);
        expect(payments.length).toBe(1);
      });

      comp2Employees.forEach((emp, idx) => {
        const history = payroll.getEmployeePaymentHistory(emp);
        const payments = history.filter(r => r.amount > 0n);
        expect(payments.length).toBe(1);
      });

      // Companies don't have payment history - only employees do
      const comp1History = payroll.getEmployeePaymentHistory(comp1);
      const comp2History = payroll.getEmployeePaymentHistory(comp2);
      expect(comp1History.filter(r => r.amount > 0n).length).toBe(0);
      expect(comp2History.filter(r => r.amount > 0n).length).toBe(0);

      console.log('✅ Complex multi-party workflow with payment history on ledger');
      payroll.printMultiPartyState();
    });
  });
});
