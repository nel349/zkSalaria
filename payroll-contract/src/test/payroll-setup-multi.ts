import { type Ledger, ledger } from '../managed/payroll/contract/index.cjs';
import { Contract, type PayrollPrivateState, createPayrollPrivateState, payrollWitnesses, PaymentRecord } from '../index.js';
import {
  CircuitContext,
  constructorContext,
  sampleContractAddress,
  QueryContext,
} from '@midnight-ntwrk/compact-runtime';
import { stringToBytes32, stringToBytes64, hexToBytes32 } from './utils.js';

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
  private sharedContractState: any; // Shared public ledger
  private sharedZswapState: any;
  private participants: Map<string, Participant> = new Map(); // Per-participant private state
  private companyId: string;
  private companyName: string;

  // Manual balance tracking (since actual balances are encrypted on ledger)
  private companyBalanceTracker: bigint = 0n;
  private employeeBalanceTrackers: Map<string, bigint> = new Map();

  // Track recurring payment data for testing
  private recurringPaymentTimestamps: Map<string, bigint> = new Map(); // employeeId -> timestamp when created

  constructor(
    companyId: string,
    companyName: string,
    initNonce: string = '0'.repeat(64)
  ) {
    this.companyId = companyId;
    this.companyName = companyName;
    this.contract = new Contract(payrollWitnesses);

    // Initialize with empty private state
    const initialPrivateState = createPayrollPrivateState();

    // Convert parameters for constructor
    const nonceBytes = hexToBytes32(initNonce);
    const companyIdBytes = stringToBytes32(companyId);
    const companyNameBytes = stringToBytes64(companyName);
    const initialTimestamp = BigInt(Math.floor(Date.now() / 1000));

    // Get initial shared contract state
    const { currentContractState, currentZswapLocalState } = this.contract.initialState(
      constructorContext(initialPrivateState, initNonce),
      nonceBytes,
      companyIdBytes,
      companyNameBytes,
      initialTimestamp
    );

    // Store shared public ledger state
    this.sharedContractState = currentContractState;
    this.sharedZswapState = currentZswapLocalState;

    console.log(`💼 Multi-party Payroll contract initialized for company: ${companyName} (${companyId})`);
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

  // Test method: Add employee (executed by company participant)
  addEmployee(employeeId: string): Ledger {
    console.log(`👤 ${this.companyName} adding employee ${employeeId}`);

    const employeeIdBytes = stringToBytes32(employeeId);

    // Initialize employee balance tracker
    this.employeeBalanceTrackers.set(employeeId, 0n);

    this.executeAsParticipant(
      this.companyId,
      (ctx, eidBytes) => this.contract.impureCircuits.add_employee(ctx, eidBytes),
      employeeIdBytes
    );

    return this.getLedgerState();
  }

  // Test method: Deposit company funds (executed by company participant)
  depositCompanyFunds(amount: bigint): Ledger {
    console.log(`💰 ${this.companyName} depositing ${amount} tokens`);

    // Track company balance increase
    this.companyBalanceTracker += amount;

    this.executeAsParticipant(
      this.companyId,
      (ctx, amt) => this.contract.impureCircuits.deposit_company_funds(ctx, amt),
      amount
    );

    return this.getLedgerState();
  }

  // Test method: Pay employee (executed by company participant)
  payEmployee(employeeId: string, amount: bigint): Ledger {
    console.log(`💸 ${this.companyName} paying employee ${employeeId}: ${amount} tokens`);

    const employeeIdBytes = stringToBytes32(employeeId);

    // Track balance transfer: company -> employee
    this.companyBalanceTracker -= amount;
    const currentEmployeeBalance = this.employeeBalanceTrackers.get(employeeId) || 0n;
    this.employeeBalanceTrackers.set(employeeId, currentEmployeeBalance + amount);

    this.executeAsParticipant(
      this.companyId,
      (ctx, eidBytes, amt) => this.contract.impureCircuits.pay_employee(ctx, eidBytes, amt),
      employeeIdBytes,
      amount
    );

    return this.getLedgerState();
  }

  // Test method: Withdraw employee salary (executed by employee participant)
  withdrawEmployeeSalary(employeeId: string, amount: bigint): Ledger {
    console.log(`💵 ${employeeId} withdrawing ${amount} tokens`);

    const employeeIdBytes = stringToBytes32(employeeId);

    // Track employee balance decrease
    const currentEmployeeBalance = this.employeeBalanceTrackers.get(employeeId) || 0n;
    this.employeeBalanceTrackers.set(employeeId, currentEmployeeBalance - amount);

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

  // Test method: Create recurring payment
  createRecurringPayment(
    companyId: string,
    employeeId: string,
    amount: bigint,
    frequency: bigint,
    startDate: bigint,
    endDate: bigint
  ): Ledger {
    console.log(`🔁 ${companyId} creating recurring payment for ${employeeId}: ${amount} (frequency: ${frequency})`);

    // Store current timestamp for later ID computation
    const currentTimestamp = this.getLedgerState().current_timestamp;
    this.recurringPaymentTimestamps.set(employeeId, currentTimestamp);

    const employeeIdBytes = stringToBytes32(employeeId);

    this.executeAsParticipant(
      companyId,
      (ctx, eidBytes, amt, freq, start, end) =>
        this.contract.impureCircuits.create_recurring_payment(ctx, eidBytes, amt, freq, start, end),
      employeeIdBytes,
      amount,
      frequency,
      startDate,
      endDate
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
    const employeeIdBytes = stringToBytes32(employeeId);

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

  // Helper: Get ACTUAL employee balance from ledger (decrypt from encrypted balance)
  // Uses encrypted_employee_balances + balance_mappings to decrypt
  getActualEmployeeBalance(employeeId: string): bigint | null {
    const ledgerState = this.getLedgerState();
    const employeeIdBytes = stringToBytes32(employeeId);

    const encryptedBalances = ledgerState.encrypted_employee_balances as any;
    const balanceMappings = ledgerState.balance_mappings as any;

    // Look up employee's encrypted balance
    if (!encryptedBalances.member(employeeIdBytes)) {
      return null; // Employee has no balance entry
    }

    const encryptedBalance = encryptedBalances.lookup(employeeIdBytes);

    // Decrypt using balance_mappings
    if (!balanceMappings.member(encryptedBalance)) {
      return null; // Cannot decrypt - no mapping found
    }

    return balanceMappings.lookup(encryptedBalance) as bigint;
  }

  // Helper: Get company balance (token reserve = company balance)
  getActualCompanyBalance(): bigint {
    return this.getTokenReserveBalance();
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

  // Helper: Get total companies (always 1 for single-company-per-contract architecture)
  getTotalCompanies(): bigint {
    return 1n; // Each contract represents exactly one company
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

  // Helper: Get recurring payment for employee
  // Uses the helper map to lookup the payment ID, then retrieves the full payment
  getRecurringPaymentForEmployee(employeeId: string): any {
    const ledgerState = this.getLedgerState();
    const lookupMap = ledgerState.recurring_payment_by_employee;
    const paymentsMap = ledgerState.recurring_payments;

    const employeeIdBytes = stringToBytes32(employeeId);

    // First, get the recurring_payment_id from the lookup map
    if (!lookupMap.member(employeeIdBytes)) {
      console.error(`❌ No recurring payment found for employee: ${employeeId}`);
      return null;
    }

    const recurringPaymentId = lookupMap.lookup(employeeIdBytes);

    // Then, get the full payment from the main map
    if (paymentsMap.member(recurringPaymentId)) {
      return paymentsMap.lookup(recurringPaymentId);
    }

    console.error(`❌ Payment ID found but payment not in main map`);
    return null;
  }

  // Helper: Get token reserve balance (actual tokens in reserve)
  getTokenReserveBalance(): bigint {
    const ledgerState = this.getLedgerState();
    // QualifiedCoinInfo has a 'value' field with the token amount
    return ledgerState.token_reserve.value;
  }

  // Helper: Get expected company balance (tracked through transaction flow)
  getExpectedCompanyBalance(): bigint {
    return this.companyBalanceTracker;
  }

  // Helper: Get expected employee balance (tracked through transaction flow)
  getExpectedEmployeeBalance(employeeId: string): bigint {
    return this.employeeBalanceTrackers.get(employeeId) || 0n;
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
  grantEmploymentDisclosure(employeeId: string, verifierId: string, expiresIn: number): Ledger {
    console.log(`🔐 Employee ${employeeId} granting employment disclosure to ${verifierId} for company ${this.companyId}`);

    const employeeIdBytes = stringToBytes32(employeeId);
    const verifierIdBytes = stringToBytes32(verifierId);

    this.executeAsParticipant(
      employeeId,
      (ctx, eidBytes, vidBytes, expiresInBigInt) =>
        this.contract.impureCircuits.grant_employment_disclosure(ctx, eidBytes, vidBytes, expiresInBigInt),
      employeeIdBytes,
      verifierIdBytes,
      BigInt(expiresIn)
    );

    return this.getLedgerState();
  }

  // Test method: Update employment status (executed by company participant)
  updateEmploymentStatus(employeeId: string, newStatus: number): Ledger {
    console.log(`📝 Company ${this.companyId} updating employment status for ${employeeId} to ${newStatus}`);

    const employeeIdBytes = stringToBytes32(employeeId);

    this.executeAsParticipant(
      this.companyId,
      (ctx, eidBytes, statusBigInt) =>
        this.contract.impureCircuits.update_employment_status(ctx, eidBytes, statusBigInt),
      employeeIdBytes,
      BigInt(newStatus)
    );

    return this.getLedgerState();
  }

  // Test method: Verify employment (executed by verifier participant)
  verifyEmployment(employeeId: string, verifierId: string): Uint8Array {
    console.log(`✅ Verifier ${verifierId} checking employment of ${employeeId} at ${this.companyId}`);

    const employeeIdBytes = stringToBytes32(employeeId);
    const verifierIdBytes = stringToBytes32(verifierId);

    const result = this.executeAsParticipant(
      verifierId,
      (ctx, eidBytes, vidBytes) =>
        this.contract.impureCircuits.verify_employment(ctx, eidBytes, vidBytes),
      employeeIdBytes,
      verifierIdBytes
    );

    return result;
  }
}
