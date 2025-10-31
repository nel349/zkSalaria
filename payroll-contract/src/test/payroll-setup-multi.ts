import { type Ledger, ledger } from '../managed/payroll/contract/index.cjs';
import { Contract, type PayrollPrivateState, createPayrollPrivateState, payrollWitnesses, PaymentRecord } from '../index.js';
import {
  CircuitContext,
  constructorContext,
  sampleContractAddress,
  QueryContext,
} from '@midnight-ntwrk/compact-runtime';

// Participant represents a company or employee with their own private state
interface Participant {
  id: string;
  privateState: PayrollPrivateState;
}

// Multi-participant test setup for payroll contract
// Each participant (company/employee) has their own private state (witnesses)
// But they all share the same public ledger (encrypted balances)
export class PayrollMultiPartyTestSetup {
  private contract: Contract<PayrollPrivateState, typeof payrollWitnesses>;
  // private contractAddress: string;
  private sharedContractState: any; // Shared public ledger
  private sharedZswapState: any;
  private participants: Map<string, Participant> = new Map(); // Per-participant private state

  constructor(initNonce: string = '0'.repeat(64)) {
    this.contract = new Contract(payrollWitnesses);
    // this.contractAddress = sampleContractAddress();

    // Initialize with empty private state
    const initialPrivateState = createPayrollPrivateState();
    const nonceBytes = this.hexToBytes32(initNonce);

    // Get initial shared contract state
    const { currentPrivateState, currentContractState, currentZswapLocalState } = this.contract.initialState(
      constructorContext(initialPrivateState, initNonce),
      nonceBytes
    );

    // Store shared public ledger state
    this.sharedContractState = currentContractState;
    this.sharedZswapState = currentZswapLocalState;

    console.log('💼 Multi-party Payroll system initialized');
  }

  // Register a participant (company or employee) with their own private state
  registerParticipant(participantId: string): void {
    if (this.participants.has(participantId)) {
      console.log(`⚠️  Participant ${participantId} already registered`);
      return;
    }

    this.participants.set(participantId, {
      id: participantId,
      privateState: createPayrollPrivateState()
    });

    console.log(`👤 Registered participant ${participantId} with private state`);
  }

  // Execute a circuit as a specific participant
  private executeAsParticipant<TArgs extends any[], TResult>(
    participantId: string,
    circuitFn: (context: CircuitContext<PayrollPrivateState>, ...args: TArgs) => { context: CircuitContext<PayrollPrivateState>, result: TResult },
    ...args: TArgs
  ): TResult {
    // Get or create participant's private state
    if (!this.participants.has(participantId)) {
      this.registerParticipant(participantId);
    }

    const participant = this.participants.get(participantId)!;

    // Create turn context with participant's private state + shared public ledger
    const turnContext: CircuitContext<PayrollPrivateState> = {
      currentPrivateState: participant.privateState,
      currentZswapLocalState: this.sharedZswapState,
      originalState: this.sharedContractState,
      transactionContext: new QueryContext(this.sharedContractState.data, sampleContractAddress()),
    };

    // Execute circuit
    const result = circuitFn(turnContext, ...args);

    // Update participant's private state (witnesses)
    participant.privateState = result.context.currentPrivateState;

    // Update shared public ledger state (encrypted balances) - use transactionContext state
    const updatedContractState = {
      ...this.sharedContractState,
      data: result.context.transactionContext.state
    };
    this.sharedContractState = updatedContractState;
    this.sharedZswapState = result.context.currentZswapLocalState;

    return result.result;
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

  // Test method: Register company (executed by company participant)
  registerCompany(companyId: string, companyName: string): Ledger {
    console.log(`🏢 ${companyId} registering as company: ${companyName}`);

    const companyIdBytes = this.stringToBytes32(companyId);
    const companyNameBytes = this.stringToBytes64(companyName);

    this.executeAsParticipant(
      companyId,
      (ctx, cidBytes, cnameBytes) => this.contract.impureCircuits.register_company(ctx, cidBytes, cnameBytes),
      companyIdBytes,
      companyNameBytes
    );

    return this.getLedgerState();
  }

  // Test method: Add employee (executed by company participant)
  addEmployee(companyId: string, employeeId: string): Ledger {
    console.log(`👤 ${companyId} adding employee ${employeeId}`);

    const companyIdBytes = this.stringToBytes32(companyId);
    const employeeIdBytes = this.stringToBytes32(employeeId);

    this.executeAsParticipant(
      companyId,
      (ctx, cidBytes, eidBytes) => this.contract.impureCircuits.add_employee(ctx, cidBytes, eidBytes),
      companyIdBytes,
      employeeIdBytes
    );

    return this.getLedgerState();
  }

  // Test method: Mint tokens (executed by system/admin)
  mintTokens(amount: bigint): Ledger {
    console.log(`🪙 System minting ${amount} tokens`);

    this.executeAsParticipant(
      'SYSTEM',
      (ctx, amt) => this.contract.impureCircuits.mint_tokens(ctx, amt),
      amount
    );

    return this.getLedgerState();
  }

  // Test method: Deposit company funds (executed by company participant)
  depositCompanyFunds(companyId: string, amount: bigint): Ledger {
    console.log(`💰 ${companyId} depositing ${amount} tokens`);

    const companyIdBytes = this.stringToBytes32(companyId);

    this.executeAsParticipant(
      companyId,
      (ctx, cidBytes, amt) => this.contract.impureCircuits.deposit_company_funds(ctx, cidBytes, amt),
      companyIdBytes,
      amount
    );

    return this.getLedgerState();
  }

  // Test method: Pay employee (executed by company participant)
  payEmployee(companyId: string, employeeId: string, amount: bigint): Ledger {
    console.log(`💸 ${companyId} paying employee ${employeeId}: ${amount} tokens`);

    const companyIdBytes = this.stringToBytes32(companyId);
    const employeeIdBytes = this.stringToBytes32(employeeId);

    this.executeAsParticipant(
      companyId,
      (ctx, cidBytes, eidBytes, amt) => this.contract.impureCircuits.pay_employee(ctx, cidBytes, eidBytes, amt),
      companyIdBytes,
      employeeIdBytes,
      amount
    );

    return this.getLedgerState();
  }

  // Test method: Withdraw employee salary (executed by employee participant)
  withdrawEmployeeSalary(employeeId: string, amount: bigint): Ledger {
    console.log(`💵 ${employeeId} withdrawing ${amount} tokens`);

    const employeeIdBytes = this.stringToBytes32(employeeId);

    this.executeAsParticipant(
      employeeId,
      (ctx, eidBytes, amt) => this.contract.impureCircuits.withdraw_employee_salary(ctx, eidBytes, amt),
      employeeIdBytes,
      amount
    );

    return this.getLedgerState();
  }

  // Test method: Update timestamp
  updateTimestamp(newTimestamp: number): Ledger {
    console.log(`⏰ Updating timestamp to ${newTimestamp}`);

    this.executeAsParticipant(
      'SYSTEM',
      (ctx, ts) => this.contract.impureCircuits.update_timestamp(ctx, ts),
      BigInt(newTimestamp)
    );

    return this.getLedgerState();
  }

  // Getter methods for state inspection
  getLedgerState(): Ledger {
    return ledger(this.sharedContractState.data);
  }

  // Get participant's private state (only accessible by that participant!)
  getParticipantPrivateState(participantId: string): PayrollPrivateState | undefined {
    return this.participants.get(participantId)?.privateState;
  }

  // Helper: Get employee payment history (from PUBLIC LEDGER - not private state)
  // NOTE: Following bank.compact pattern - payment history stored on ledger, not witnesses
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

  // Helper: Decrypt payment amount from encrypted_amount field
  // Uses balance_mappings ledger to decrypt (bank.compact pattern)
  decryptPaymentAmount(encryptedAmount: Uint8Array): bigint | null {
    const ledgerState = this.getLedgerState();
    const balanceMappings = ledgerState.balance_mappings as any;

    // Check if this encrypted amount has a mapping
    if (balanceMappings.member(encryptedAmount)) {
      return balanceMappings.lookup(encryptedAmount) as bigint;
    }

    return null; // Cannot decrypt - no mapping found
  }

  // Helper: Payment history access (now on public ledger)
  // NOTE: Payment history is on PUBLIC ledger (not witnesses) following bank.compact pattern
  // This allows company to write when paying, and anyone to read for credit scoring
  // Privacy is maintained through encrypted balances - history shows amounts but not current balance
  canAccessPaymentHistory(requestorId: string, employeeId: string): boolean {
    // Payment history is on public ledger - accessible to all for credit scoring
    // This is intentional - ZKML credit scoring needs this data
    return true;
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

  // Helper: List all registered participants
  getRegisteredParticipants(): string[] {
    return Array.from(this.participants.keys());
  }

  // Debug helper: Print multi-party state
  printMultiPartyState(): void {
    console.log('\n📊 Multi-Party Payroll State:');
    console.log('├─ Total Companies:', this.getTotalCompanies().toString());
    console.log('├─ Total Employees:', this.getTotalEmployees().toString());
    console.log('├─ Total Payments:', this.getTotalPayments().toString());
    console.log('├─ Total Supply:', this.getTotalSupply().toString());
    console.log('└─ Registered Participants:', this.getRegisteredParticipants().join(', '));
    console.log('');
  }

  // Debug helper: Print participant's private state
  printParticipantState(participantId: string): void {
    const participant = this.participants.get(participantId);
    if (!participant) {
      console.log(`⚠️  Participant ${participantId} not found`);
      return;
    }

    console.log(`\n📊 Participant ${participantId} Private State:`);
    console.log('├─ Payment History Records:', participant.privateState.employeePaymentHistory.size);
    console.log('');
  }

  // ========================================
  // EMPLOYMENT VERIFICATION METHODS
  // ========================================

  // Test method: Grant employment disclosure (executed by employee participant)
  grantEmploymentDisclosure(employeeId: string, verifierId: string, companyId: string, expiresIn: number): Ledger {
    console.log(`🔐 ${employeeId} granting employment disclosure to ${verifierId} for company ${companyId}`);

    const employeeIdBytes = this.stringToBytes32(employeeId);
    const verifierIdBytes = this.stringToBytes32(verifierId);
    const companyIdBytes = this.stringToBytes32(companyId);

    this.executeAsParticipant(
      employeeId,
      (ctx, eidBytes, vidBytes, cidBytes, expiresInBigInt) =>
        this.contract.impureCircuits.grant_employment_disclosure(ctx, eidBytes, vidBytes, cidBytes, expiresInBigInt),
      employeeIdBytes,
      verifierIdBytes,
      companyIdBytes,
      BigInt(expiresIn)
    );

    return this.getLedgerState();
  }

  // Test method: Update employment status (executed by company participant)
  updateEmploymentStatus(companyId: string, employeeId: string, newStatus: number): Ledger {
    console.log(`📝 ${companyId} updating employment status for ${employeeId} to ${newStatus}`);

    const companyIdBytes = this.stringToBytes32(companyId);
    const employeeIdBytes = this.stringToBytes32(employeeId);

    this.executeAsParticipant(
      companyId,
      (ctx, cidBytes, eidBytes, statusBigInt) =>
        this.contract.impureCircuits.update_employment_status(ctx, cidBytes, eidBytes, statusBigInt),
      companyIdBytes,
      employeeIdBytes,
      BigInt(newStatus)
    );

    return this.getLedgerState();
  }

  // Test method: Verify employment (executed by verifier participant)
  verifyEmployment(employeeId: string, companyId: string, verifierId: string): Uint8Array {
    console.log(`✅ ${verifierId} checking employment of ${employeeId} at ${companyId}`);

    const employeeIdBytes = this.stringToBytes32(employeeId);
    const companyIdBytes = this.stringToBytes32(companyId);
    const verifierIdBytes = this.stringToBytes32(verifierId);

    const result = this.executeAsParticipant(
      verifierId,
      (ctx, eidBytes, cidBytes, vidBytes) =>
        this.contract.impureCircuits.verify_employment(ctx, eidBytes, cidBytes, vidBytes),
      employeeIdBytes,
      companyIdBytes,
      verifierIdBytes
    );

    return result;
  }
}
