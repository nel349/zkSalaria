import { type Ledger, ledger } from '../managed/payroll/contract/index.cjs';
import { Contract, type PayrollPrivateState, createPayrollPrivateState, payrollWitnesses, PaymentRecord } from '../index.js';
import {
  CircuitContext,
  constructorContext,
  sampleContractAddress,
  QueryContext,
} from '@midnight-ntwrk/compact-runtime';

// Test setup class for payroll contract
export class PayrollTestSetup {
  private contract: Contract<PayrollPrivateState, typeof payrollWitnesses>;
  private turnContext: CircuitContext<PayrollPrivateState>;
  private contractAddress: string;

  constructor(initNonce: string = '0'.repeat(64)) {
    // Initialize payroll contract with witnesses
    this.contract = new Contract(payrollWitnesses);
    this.contractAddress = sampleContractAddress();

    // Initialize with empty payroll private state
    const initialPrivateState = createPayrollPrivateState();

    // Convert init nonce to Uint8Array for constructor
    const nonceBytes = this.hexToBytes32(initNonce);

    // Get initial state from contract
    // Note: payroll.compact constructor takes initNonce: Bytes<32>
    // Pass constructor args separately: (context, ...constructorArgs)
    const { currentPrivateState, currentContractState, currentZswapLocalState} = this.contract.initialState(
      constructorContext(initialPrivateState, initNonce),
      nonceBytes
    );

    // Set up turn context
    this.turnContext = {
      currentPrivateState,
      currentZswapLocalState,
      originalState: currentContractState,
      transactionContext: new QueryContext(currentContractState.data, sampleContractAddress()),
    };

    console.log('💼 Payroll system initialized');
  }

  // Helper to convert string to Bytes<32>
  private stringToBytes32(str: string): Uint8Array {
    const bytes = new Uint8Array(32);
    const encoder = new TextEncoder();
    const encoded = encoder.encode(str);
    bytes.set(encoded.slice(0, Math.min(encoded.length, 32)));
    return bytes;
  }

  // Helper to convert string to Bytes<64>
  private stringToBytes64(str: string): Uint8Array {
    const bytes = new Uint8Array(64);
    const encoder = new TextEncoder();
    const encoded = encoder.encode(str);
    bytes.set(encoded.slice(0, Math.min(encoded.length, 64)));
    return bytes;
  }

  // Helper to convert hex string to Bytes<32>
  private hexToBytes32(hex: string): Uint8Array {
    const bytes = new Uint8Array(32);
    for (let i = 0; i < Math.min(hex.length, 64); i += 2) {
      bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
    }
    return bytes;
  }

  // Helper to update state and get ledger
  private updateStateAndGetLedger(circuitResults: any): Ledger {
    this.turnContext = circuitResults.context;
    return ledger(this.turnContext.transactionContext.state);
  }

  // Test method: Register company
  registerCompany(companyId: string, companyName: string): Ledger {
    console.log(`🏢 Registering company ${companyId}: ${companyName}`);

    const companyIdBytes = this.stringToBytes32(companyId);
    const companyNameBytes = this.stringToBytes64(companyName);

    const results = this.contract.impureCircuits.register_company(this.turnContext, companyIdBytes, companyNameBytes);
    return this.updateStateAndGetLedger(results);
  }

  // Test method: Add employee
  addEmployee(companyId: string, employeeId: string): Ledger {
    console.log(`👤 Adding employee ${employeeId} to company ${companyId}`);

    const companyIdBytes = this.stringToBytes32(companyId);
    const employeeIdBytes = this.stringToBytes32(employeeId);

    const results = this.contract.impureCircuits.add_employee(this.turnContext, companyIdBytes, employeeIdBytes);
    return this.updateStateAndGetLedger(results);
  }

  // Test method: Mint tokens (for testing)
  mintTokens(amount: bigint): Ledger {
    console.log(`🪙 Minting ${amount} tokens for testing`);

    const results = this.contract.impureCircuits.mint_tokens(this.turnContext, amount);
    return this.updateStateAndGetLedger(results);
  }

  // Test method: Deposit company funds
  depositCompanyFunds(companyId: string, amount: bigint): Ledger {
    console.log(`💰 Company ${companyId} depositing ${amount} tokens`);

    const companyIdBytes = this.stringToBytes32(companyId);

    const results = this.contract.impureCircuits.deposit_company_funds(this.turnContext, companyIdBytes, amount);
    return this.updateStateAndGetLedger(results);
  }

  // Test method: Pay employee
  payEmployee(companyId: string, employeeId: string, amount: bigint): Ledger {
    console.log(`💸 Company ${companyId} paying employee ${employeeId}: ${amount} tokens`);

    const companyIdBytes = this.stringToBytes32(companyId);
    const employeeIdBytes = this.stringToBytes32(employeeId);

    const results = this.contract.impureCircuits.pay_employee(this.turnContext, companyIdBytes, employeeIdBytes, amount);
    return this.updateStateAndGetLedger(results);
  }

  // Test method: Withdraw employee salary
  withdrawEmployeeSalary(employeeId: string, amount: bigint): Ledger {
    console.log(`💵 Employee ${employeeId} withdrawing ${amount} tokens`);

    const employeeIdBytes = this.stringToBytes32(employeeId);

    const results = this.contract.impureCircuits.withdraw_employee_salary(this.turnContext, employeeIdBytes, amount);
    return this.updateStateAndGetLedger(results);
  }

  // Test method: Update timestamp
  updateTimestamp(newTimestamp: number): Ledger {
    console.log(`⏰ Updating timestamp to ${newTimestamp}`);

    const results = this.contract.impureCircuits.update_timestamp(this.turnContext, BigInt(newTimestamp));
    return this.updateStateAndGetLedger(results);
  }

  // Getter methods for state inspection
  getLedgerState(): Ledger {
    return ledger(this.turnContext.transactionContext.state);
  }

  getPrivateState(): PayrollPrivateState {
    return this.turnContext.currentPrivateState;
  }

  // Helper: Get current timestamp
  getCurrentTimestamp(): number {
    return Number(this.getLedgerState().current_timestamp);
  }

  // Helper: Get total companies
  getTotalCompanies(): bigint {
    return this.getLedgerState().total_companies;
  }

  // Helper: Get total employees
  getTotalEmployees(): bigint {
    return this.getLedgerState().total_employees;
  }

  // Helper: Get total payments
  getTotalPayments(): bigint {
    return this.getLedgerState().total_payments;
  }

  // Helper: Get total supply
  getTotalSupply(): bigint {
    return this.getLedgerState().total_supply;
  }

  // NOTE: Balances are now ENCRYPTED on public ledger (bank contract pattern)
  // Cannot read balances directly from witnesses - they are encrypted with participant keys
  // In production, you would need the participant's encryption key to decrypt balances
  // For testing, we track balances through transaction flow (deposits, payments, withdrawals)

  // Helper: Get employee payment history (from PUBLIC LEDGER - not witness)
  // NOTE: Following bank.compact pattern - payment history stored on ledger
  getEmployeePaymentHistory(employeeId: string): PaymentRecord[] {
    const ledgerState = this.getLedgerState();
    const employeeIdBytes = this.stringToBytes32(employeeId);

    // The Map from Compact Runtime has methods: member(), lookup(), size, isEmpty
    const historyMap = ledgerState.employee_payment_history as any;

    // Check if employee has payment history using member() method
    if (historyMap.member(employeeIdBytes)) {
      // Use lookup() method to get the history
      const history = historyMap.lookup(employeeIdBytes);
      return history as PaymentRecord[];
    }

    return [];
  }

  // Debug helper: Print current payroll state
  printPayrollState(): void {
    console.log('\n📊 Payroll System State:');
    console.log('├─ Total Companies:', this.getTotalCompanies().toString());
    console.log('├─ Total Employees:', this.getTotalEmployees().toString());
    console.log('├─ Total Payments:', this.getTotalPayments().toString());
    console.log('├─ Total Supply:', this.getTotalSupply().toString());
    console.log('└─ Current Timestamp:', this.getCurrentTimestamp());
    console.log('');
  }

  // ========================================
  // EMPLOYMENT VERIFICATION METHODS
  // ========================================

  // Test method: Grant employment disclosure
  grantEmploymentDisclosure(employeeId: string, verifierId: string, companyId: string, expiresIn: number): Ledger {
    console.log(`🔐 Employee ${employeeId} granting employment disclosure to ${verifierId} for company ${companyId}`);

    const employeeIdBytes = this.stringToBytes32(employeeId);
    const verifierIdBytes = this.stringToBytes32(verifierId);
    const companyIdBytes = this.stringToBytes32(companyId);

    const results = this.contract.impureCircuits.grant_employment_disclosure(
      this.turnContext,
      employeeIdBytes,
      verifierIdBytes,
      companyIdBytes,
      BigInt(expiresIn)
    );
    return this.updateStateAndGetLedger(results);
  }

  // Test method: Update employment status
  updateEmploymentStatus(companyId: string, employeeId: string, newStatus: number): Ledger {
    console.log(`📝 Company ${companyId} updating employment status for ${employeeId} to ${newStatus}`);

    const companyIdBytes = this.stringToBytes32(companyId);
    const employeeIdBytes = this.stringToBytes32(employeeId);

    const results = this.contract.impureCircuits.update_employment_status(
      this.turnContext,
      companyIdBytes,
      employeeIdBytes,
      BigInt(newStatus)
    );
    return this.updateStateAndGetLedger(results);
  }

  // Test method: Verify employment
  verifyEmployment(employeeId: string, companyId: string, verifierId: string): Uint8Array {
    console.log(`✅ Verifier ${verifierId} checking employment of ${employeeId} at ${companyId}`);

    const employeeIdBytes = this.stringToBytes32(employeeId);
    const companyIdBytes = this.stringToBytes32(companyId);
    const verifierIdBytes = this.stringToBytes32(verifierId);

    const results = this.contract.impureCircuits.verify_employment(
      this.turnContext,
      employeeIdBytes,
      companyIdBytes,
      verifierIdBytes
    );

    // Update state from circuit execution
    this.turnContext = results.context;

    // Return the result (Bytes<1>: 0x01 = employed, 0x00 = not employed)
    return results.result;
  }
}
