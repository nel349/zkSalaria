import { describe, test, expect, beforeEach } from 'vitest';
import { PayrollMultiPartyTestSetup } from './payroll-setup-multi.js';
import { walletAddressToEmployeeId } from './utils.js';

describe('Debug: Wallet Address Hashing for add_employee', () => {
  let payroll: PayrollMultiPartyTestSetup;
  const companyId = 'COMP001';
  const companyName = 'Test Company';

  // This is the EXACT wallet address from the UI debug logs
  const employeeWalletAddress = 'mn_shield-addr_undeployed1ykhufwetshq2ukrmkreu5nnp0f7qrr0cj20xn3gznx5ky0qpq0z0xhzg8nqh54eyzh2w3pz93gdw4t7esr9pkjxlp95k5zar0eep2fzfkhq';

  beforeEach(() => {
    payroll = new PayrollMultiPartyTestSetup(companyId, companyName);
    console.log('\n🔄 Debug test initialized\n');
  });

  test('should successfully add employee using SHA-256 hashed wallet address', async () => {
    console.log('\n📝 Testing add_employee with real wallet address from UI');
    console.log('Wallet address:', employeeWalletAddress);
    console.log('Wallet address length:', employeeWalletAddress.length, 'characters');

    // Hash the wallet address (same as API does)
    const employeeIdBytes = await walletAddressToEmployeeId(employeeWalletAddress);

    console.log('Hashed employee ID (bytes):', Array.from(employeeIdBytes));
    console.log('Hashed employee ID (hex):', Array.from(employeeIdBytes).map(b => b.toString(16).padStart(2, '0')).join(''));
    console.log('Hashed bytes length:', employeeIdBytes.length);

    // Get ledger state BEFORE adding employee
    const ledgerBefore = payroll.getLedgerState();
    console.log('\n📊 Ledger state BEFORE add_employee:');
    console.log('Total employees:', ledgerBefore.total_employees);
    console.log('Employee accounts size:', ledgerBefore.employee_accounts?.size || 0);

    // Try to add employee using the hashed bytes directly
    console.log('\n🔧 Calling add_employee circuit with hashed wallet address...');

    try {
      // Call the circuit directly with hashed bytes (bypass the helper method)
      payroll.registerParticipant(companyId);
      const result = payroll.executeCircuitDirectly(
        companyId,
        (ctx) => payroll.getContract().impureCircuits.add_employee(ctx, employeeIdBytes)
      );

      console.log('✅ add_employee circuit executed successfully!');

      // Get ledger state AFTER adding employee
      const ledgerAfter = payroll.getLedgerState();
      console.log('\n📊 Ledger state AFTER add_employee:');
      console.log('Total employees:', ledgerAfter.total_employees);
      console.log('Employee accounts size:', ledgerAfter.employee_accounts?.size || 0);

      // Verify employee was added
      expect(ledgerAfter.total_employees).toBe(1n);

      // Check employee_accounts Map size (it's a function, not a property)
      const employeeAccountsSize = typeof ledgerAfter.employee_accounts?.size === 'function'
        ? ledgerAfter.employee_accounts.size()
        : ledgerAfter.employee_accounts?.size;
      console.log('Employee accounts Map size:', employeeAccountsSize);
      expect(employeeAccountsSize).toBeGreaterThan(0);

      console.log('\n✅ Test PASSED - Employee successfully added using hashed wallet address!');
    } catch (error) {
      console.error('\n❌ add_employee circuit FAILED with error:');
      console.error('Error:', error);
      console.error('Error message:', error instanceof Error ? error.message : 'Unknown error');
      console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');

      // Re-throw to fail the test
      throw error;
    }
  });

  test('should compare stringToBytes32 vs SHA-256 hash', async () => {
    console.log('\n🔬 Comparing stringToBytes32 vs SHA-256 hash');

    // Method 1: Simple truncation (old test method)
    const simpleBytes = new Uint8Array(32);
    const encoder = new TextEncoder();
    const encoded = encoder.encode(employeeWalletAddress);
    simpleBytes.set(encoded.slice(0, Math.min(encoded.length, 32)));

    console.log('\nMethod 1 - stringToBytes32 (truncation):');
    console.log('Bytes:', Array.from(simpleBytes));
    console.log('Hex:', Array.from(simpleBytes).map(b => b.toString(16).padStart(2, '0')).join(''));

    // Method 2: SHA-256 hash (API method)
    const hashedBytes = await walletAddressToEmployeeId(employeeWalletAddress);

    console.log('\nMethod 2 - SHA-256 hash:');
    console.log('Bytes:', Array.from(hashedBytes));
    console.log('Hex:', Array.from(hashedBytes).map(b => b.toString(16).padStart(2, '0')).join(''));

    // They should be different
    expect(simpleBytes).not.toEqual(hashedBytes);
    console.log('\n✅ Methods produce different results (as expected)');
  });
});
