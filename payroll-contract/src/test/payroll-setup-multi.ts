import { type Ledger, ledger } from '../managed/payroll/contract/index.cjs';
import { Contract, type PayrollPrivateState, createPayrollPrivateState, payrollWitnesses, PaymentRecord } from '../index.js';
import {
  CircuitContext,
  constructorContext,
  sampleContractAddress,
  QueryContext,
} from '@midnight-ntwrk/compact-runtime';
import { stringToBytes32, stringToBytes64, hexToBytes32 } from './utils.js';
import type { RecurringPayment } from '../types.js';

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
  private allocatedToEmployeesTracker: bigint = 0n; // Track allocated_to_employees for over-commitment tests

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

    // Execute circuit first, then update trackers only on success
    this.executeAsParticipant(
      this.companyId,
      (ctx, eidBytes, amt) => this.contract.impureCircuits.pay_employee(ctx, eidBytes, amt),
      employeeIdBytes,
      amount
    );

    // Track allocation: total_supply unchanged, allocated_to_employees increases
    this.allocatedToEmployeesTracker += amount;
    const currentEmployeeBalance = this.employeeBalanceTrackers.get(employeeId) || 0n;
    this.employeeBalanceTrackers.set(employeeId, currentEmployeeBalance + amount);

    return this.getLedgerState();
  }

  // NOTE: Commented out - batch_pay_employees circuit disabled for testnet performance
  /*
  // Test method: Batch pay multiple employees in one transaction
  batchPayEmployees(payments: Array<{ employeeId: string; amount: bigint }>): Ledger {
    console.log(`💸💸 ${this.companyName} batch paying ${payments.length} employees`);

    // Convert payments to Vector<10, BatchPaymentEntry> format
    // Fill unused slots with empty entries (amount=0)
    const batchEntries: Array<{ employee_id: Uint8Array; amount: bigint }> = [];

    for (let i = 0; i < 10; i++) {
      if (i < payments.length) {
        const payment = payments[i];
        batchEntries.push({
          employee_id: stringToBytes32(payment.employeeId),
          amount: payment.amount
        });
      } else {
        // Empty slot
        batchEntries.push({
          employee_id: new Uint8Array(32),
          amount: 0n
        });
      }
    }

    // Execute batch payment circuit
    this.executeAsParticipant(
      this.companyId,
      (ctx, ...entries) => this.contract.impureCircuits.batch_pay_employees(ctx, entries),
      ...batchEntries
    );

    // Update trackers for all non-empty payments
    for (const payment of payments) {
      if (payment.amount > 0n) {
        this.allocatedToEmployeesTracker += payment.amount;
        const currentBalance = this.employeeBalanceTrackers.get(payment.employeeId) || 0n;
        this.employeeBalanceTrackers.set(payment.employeeId, currentBalance + payment.amount);
        console.log(`  ✓ Paid ${payment.employeeId}: ${payment.amount} tokens`);
      }
    }

    return this.getLedgerState();
  }
  */

  // Test method: Withdraw employee salary (executed by employee participant)
  withdrawEmployeeSalary(employeeId: string, amount: bigint): Ledger {
    console.log(`💵 ${employeeId} withdrawing ${amount} tokens`);

    const employeeIdBytes = stringToBytes32(employeeId);

    // Track withdrawal: total_supply decreases, allocated_to_employees decreases, employee balance decreases
    this.companyBalanceTracker -= amount;
    this.allocatedToEmployeesTracker -= amount;
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

  // Test method: Create recurring payment
  createRecurringPayment(
    companyId: string,
    employeeId: string,
    amount: bigint,
    frequency: bigint,
    startDate: bigint,
    endDate: bigint,
    nextPaymentDate: bigint,
    paymentDayOfMonth1: bigint = 0n,
    paymentDayOfMonth2: bigint = 0n,
    paymentDayOfWeek: bigint = 0n
  ): Ledger {
    console.log(`🔁 ${companyId} creating recurring payment for ${employeeId}: ${amount} (frequency: ${frequency})`);

    // Store current timestamp for later ID computation
    const currentTimestamp = this.getLedgerState().current_timestamp;
    this.recurringPaymentTimestamps.set(employeeId, currentTimestamp);

    const employeeIdBytes = stringToBytes32(employeeId);

    this.executeAsParticipant(
      companyId,
      (ctx, eidBytes, amt, freq, start, end, nextPmt, day1, day2, dow) =>
        this.contract.impureCircuits.create_recurring_payment(
          ctx, eidBytes, amt, freq, start, end, nextPmt, day1, day2, dow
        ),
      employeeIdBytes,
      amount,
      frequency,
      startDate,
      endDate,
      nextPaymentDate,
      paymentDayOfMonth1,
      paymentDayOfMonth2,
      paymentDayOfWeek
    );

    return this.getLedgerState();
  }

  // Pause recurring payment
  pauseRecurringPayment(companyId: string, employeeId: string): Ledger {
    console.log(`⏸️  ${companyId} pausing recurring payment for ${employeeId}`);

    // Get the recurring payment ID from the lookup map
    const employeeIdBytes = stringToBytes32(employeeId);
    const ledgerState = this.getLedgerState();
    const lookupMap = ledgerState.recurring_payment_by_employee;

    if (!lookupMap.member(employeeIdBytes)) {
      throw new Error(`No recurring payment found for employee: ${employeeId}`);
    }

    const recurringPaymentId = lookupMap.lookup(employeeIdBytes);

    this.executeAsParticipant(
      companyId,
      (ctx, rpId) => this.contract.impureCircuits.pause_recurring_payment(ctx, rpId),
      recurringPaymentId
    );

    return this.getLedgerState();
  }

  // Resume paused recurring payment
  resumeRecurringPayment(companyId: string, employeeId: string, nextPaymentDate: bigint): Ledger {
    console.log(`▶️  ${companyId} resuming recurring payment for ${employeeId}`);

    // Get the recurring payment ID from the lookup map
    const employeeIdBytes = stringToBytes32(employeeId);
    const ledgerState = this.getLedgerState();
    const lookupMap = ledgerState.recurring_payment_by_employee;

    if (!lookupMap.member(employeeIdBytes)) {
      throw new Error(`No recurring payment found for employee: ${employeeId}`);
    }

    const recurringPaymentId = lookupMap.lookup(employeeIdBytes);

    this.executeAsParticipant(
      companyId,
      (ctx, rpId, nextPmt) => this.contract.impureCircuits.resume_recurring_payment(ctx, rpId, nextPmt),
      recurringPaymentId,
      nextPaymentDate
    );

    return this.getLedgerState();
  }

  // Edit recurring payment amount
  editRecurringPayment(companyId: string, employeeId: string, newAmount: bigint): Ledger {
    console.log(`✏️  ${companyId} editing recurring payment for ${employeeId} - new amount: ${newAmount}`);

    // Get the recurring payment ID from the lookup map
    const employeeIdBytes = stringToBytes32(employeeId);
    const ledgerState = this.getLedgerState();
    const lookupMap = ledgerState.recurring_payment_by_employee;

    if (!lookupMap.member(employeeIdBytes)) {
      throw new Error(`No recurring payment found for employee: ${employeeId}`);
    }

    const recurringPaymentId = lookupMap.lookup(employeeIdBytes);

    this.executeAsParticipant(
      companyId,
      (ctx, rpId, amt) => this.contract.impureCircuits.edit_recurring_payment(ctx, rpId, amt),
      recurringPaymentId,
      newAmount
    );

    return this.getLedgerState();
  }

  // Process recurring payment (manual trigger)
  processRecurringPayment(companyId: string, employeeId: string): Ledger {
    console.log(`🔄 ${companyId} processing recurring payment for ${employeeId}`);

    // Get the recurring payment ID from the lookup map
    const employeeIdBytes = stringToBytes32(employeeId);
    const ledgerState = this.getLedgerState();
    const lookupMap = ledgerState.recurring_payment_by_employee;

    if (!lookupMap.member(employeeIdBytes)) {
      throw new Error(`No recurring payment found for employee: ${employeeId}`);
    }

    const recurringPaymentId = lookupMap.lookup(employeeIdBytes);

    // Get current payment amount for balance tracking (before execution)
    const recurringPaymentMap = ledgerState.recurring_payments;
    let amount: bigint | null = null;
    if (recurringPaymentMap.member(recurringPaymentId)) {
      const payment = recurringPaymentMap.lookup(recurringPaymentId);
      amount = this.decryptPaymentAmount(payment.encrypted_amount);
    }

    // Execute circuit first
    this.executeAsParticipant(
      companyId,
      (ctx, rpId) => this.contract.impureCircuits.process_recurring_payment(ctx, rpId),
      recurringPaymentId
    );

    // Update balance trackers only after successful execution
    if (amount !== null) {
      this.allocatedToEmployeesTracker += amount;
      const currentEmployeeBalance = this.employeeBalanceTrackers.get(employeeId) || 0n;
      this.employeeBalanceTrackers.set(employeeId, currentEmployeeBalance + amount);
    }

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
  // Uses value_decryption_map ledger to decrypt (bank.compact pattern)
  decryptPaymentAmount(encryptedAmount: Uint8Array): bigint | null {
    const ledgerState = this.getLedgerState();
    const balanceMappings = ledgerState.value_decryption_map as any;

    // Check if this encrypted amount has a mapping
    if (balanceMappings.member(encryptedAmount)) {
      return balanceMappings.lookup(encryptedAmount) as bigint;
    }

    return null; // Cannot decrypt - no mapping found
  }

  // Helper: Get ACTUAL employee balance from ledger (decrypt from encrypted balance)
  // Uses encrypted_employee_balances + value_decryption_map to decrypt
  getActualEmployeeBalance(employeeId: string): bigint | null {
    const ledgerState = this.getLedgerState();
    const employeeIdBytes = stringToBytes32(employeeId);

    const encryptedBalances = ledgerState.encrypted_employee_balances as any;
    const balanceMappings = ledgerState.value_decryption_map as any;

    // Look up employee's encrypted balance
    if (!encryptedBalances.member(employeeIdBytes)) {
      return null; // Employee has no balance entry
    }

    const encryptedBalance = encryptedBalances.lookup(employeeIdBytes);

    // Decrypt using value_decryption_map
    if (!balanceMappings.member(encryptedBalance)) {
      return null; // Cannot decrypt - no mapping found
    }

    return balanceMappings.lookup(encryptedBalance) as bigint;
  }

  // Helper: Get company balance (token reserve = company balance)
  getActualCompanyBalance(): bigint {
    return this.getTokenReserveBalance();
  }

  getAllocatedToEmployees(): bigint {
    return this.allocatedToEmployeesTracker;
  }

  getAvailableBudget(): bigint {
    return this.companyBalanceTracker - this.allocatedToEmployeesTracker;
  }

  getEmployeeBalance(employeeId: string): bigint {
    return this.employeeBalanceTrackers.get(employeeId) || 0n;
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
  getRecurringPaymentForEmployee(employeeId: string): RecurringPayment | null {
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

    // Register verifier as participant (grantee needs private state to potentially read shared data)
    this.registerParticipant(verifierId);

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
  updateEmploymentStatus(employeeId: string, newStatus: bigint): Ledger {
    console.log(`📝 Company ${this.companyId} updating employment status for ${employeeId} to ${newStatus}`);

    const employeeIdBytes = stringToBytes32(employeeId);

    this.executeAsParticipant(
      this.companyId,
      (ctx, eidBytes, statusBigInt) =>
        this.contract.impureCircuits.update_employment_status(ctx, eidBytes, statusBigInt),
      employeeIdBytes,
      newStatus
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

  // Test method: Grant income disclosure (executed by employee participant)
  grantIncomeDisclosure(employeeId: string, lenderId: string, minThreshold: bigint, expiresIn: number): Ledger {
    console.log(`🔐 Employee ${employeeId} granting income disclosure to ${lenderId} (threshold: ${minThreshold})`);

    const employeeIdBytes = stringToBytes32(employeeId);
    const lenderIdBytes = stringToBytes32(lenderId);

    // Register lender as participant (grantee needs private state to potentially read shared data)
    this.registerParticipant(lenderId);

    this.executeAsParticipant(
      employeeId,
      (ctx, eidBytes, lidBytes, threshold, expiresInBigInt) =>
        this.contract.impureCircuits.grant_income_disclosure(ctx, eidBytes, lidBytes, threshold, expiresInBigInt),
      employeeIdBytes,
      lenderIdBytes,
      minThreshold,
      BigInt(expiresIn)
    );

    return this.getLedgerState();
  }

  // Test method: Grant audit disclosure (executed by company participant)
  grantAuditDisclosure(auditorId: string, expiresIn: number): Ledger {
    console.log(`🔐 Company ${this.companyId} granting audit disclosure to ${auditorId}`);

    const companyIdBytes = stringToBytes32(this.companyId);
    const auditorIdBytes = stringToBytes32(auditorId);

    // Register auditor as participant (grantee needs private state to potentially read shared data)
    this.registerParticipant(auditorId);

    this.executeAsParticipant(
      this.companyId,
      (ctx, cidBytes, aidBytes, expiresInBigInt) =>
        this.contract.impureCircuits.grant_audit_disclosure(ctx, cidBytes, aidBytes, expiresInBigInt),
      companyIdBytes,
      auditorIdBytes,
      BigInt(expiresIn)
    );

    return this.getLedgerState();
  }

  // Test method: Revoke disclosure (executed by grantor participant)
  revokeDisclosure(grantorId: string, granteeId: string, permissionType: bigint): Ledger {
    console.log(`🔓 ${grantorId} revoking disclosure for ${granteeId} (type: ${permissionType})`);

    const grantorIdBytes = stringToBytes32(grantorId);
    const granteeIdBytes = stringToBytes32(granteeId);

    this.executeAsParticipant(
      grantorId,
      (ctx, grantor, grantee, perm) =>
        this.contract.impureCircuits.revoke_disclosure(ctx, grantor, grantee, perm),
      grantorIdBytes,
      granteeIdBytes,
      permissionType
    );

    return this.getLedgerState();
  }

  // ========================================
  // ZKML INTEGRATION TESTING METHODS
  // ========================================

  // Register a trusted ZKML verifier
  registerTrustedVerifier(verifierPubkey: string): Ledger {
    console.log(`🔐 Registering trusted verifier: ${verifierPubkey.substring(0, 16)}...`);

    const verifierPubkeyBytes = hexToBytes32(verifierPubkey);

    this.executeAsParticipant(
      this.companyId,
      (ctx, vpBytes) => this.contract.impureCircuits.register_trusted_verifier(ctx, vpBytes),
      verifierPubkeyBytes
    );

    return this.getLedgerState();
  }

  // Helper: Check if verifier is trusted
  isTrustedVerifier(verifierPubkey: string): boolean {
    const ledgerState = this.getLedgerState();
    const verifierPubkeyBytes = hexToBytes32(verifierPubkey);

    const trustedVerifiersMap = ledgerState.trusted_verifiers as any;
    return trustedVerifiersMap.member(verifierPubkeyBytes);
  }

  // Helper: Check if attestation hash has been used
  isAttestationUsed(attestationHash: string): boolean {
    const ledgerState = this.getLedgerState();
    const attestationHashBytes = hexToBytes32(attestationHash);

    const usedAttestationsMap = ledgerState.used_attestations as any;
    return usedAttestationsMap.member(attestationHashBytes);
  }

  // Helper: Get current timestamp from contract
  getCurrentTimestamp(): number {
    const ledgerState = this.getLedgerState();
    return Number(ledgerState.current_timestamp);
  }

  // Helper: Update timestamp (for testing expiry)
  updateTimestamp(newTimestamp: number): Ledger {
    console.log(`⏰ Updating timestamp to: ${newTimestamp}`);

    this.executeAsParticipant(
      this.companyId,
      (ctx, ts) => this.contract.impureCircuits.update_timestamp(ctx, ts),
      BigInt(newTimestamp)
    );

    return this.getLedgerState();
  }

  // ========================================
  // ZKML Income Proof Methods (Section 2.1)
  // ========================================

  submitIncomeProof(
    employeeId: string,
    proofType: number,
    thresholdMin: bigint,
    thresholdMax: bigint,
    txids: string[], // Array of 12 hex strings
    merkleRoot: string,
    attestationHash: string,
    verifierPubkey: string,
    timestamp: bigint,
    expiresIn: number // Seconds
  ): Ledger {
    console.log(`📝 Submitting income proof for employee ${employeeId} (type: ${proofType})`);

    const employeeIdBytes = stringToBytes32(employeeId);
    const proofTypeU8 = BigInt(proofType); // Convert to bigint for Uint<8>
    const txidsVector = txids.map(tx => hexToBytes32(tx));
    const merkleRootBytes = hexToBytes32(merkleRoot);
    const attestationHashBytes = hexToBytes32(attestationHash);
    const verifierPubkeyBytes = hexToBytes32(verifierPubkey);
    const expiresInU32 = BigInt(expiresIn); // Convert to bigint for Uint<32>

    this.executeAsParticipant(
      this.companyId,
      (ctx, empId, pType, thMin, thMax, txs, mr, attHash, vpBytes, ts, exp) =>
        this.contract.impureCircuits.submit_income_proof(
          ctx,
          empId,
          pType,
          thMin,
          thMax,
          txs,
          mr,
          attHash,
          vpBytes,
          ts,
          exp
        ),
      employeeIdBytes,
      proofTypeU8,
      thresholdMin,
      thresholdMax,
      txidsVector,
      merkleRootBytes,
      attestationHashBytes,
      verifierPubkeyBytes,
      timestamp,
      expiresInU32
    );

    return this.getLedgerState();
  }

  getIncomeProof(employeeId: string): any | null {
    const ledgerState = this.getLedgerState();
    const employeeIdBytes = stringToBytes32(employeeId);

    const incomeProofsMap = ledgerState.income_proofs as any;

    if (incomeProofsMap.member(employeeIdBytes)) {
      return incomeProofsMap.lookup(employeeIdBytes);
    }

    return null;
  }

  verifyIncomeProof(
    employeeId: string,
    requiredProofType: number,
    requiredThreshold: bigint
  ): boolean {
    console.log(`🔍 Verifying income proof for employee ${employeeId} (type: ${requiredProofType}, threshold: ${requiredThreshold})`);

    const employeeIdBytes = stringToBytes32(employeeId);
    const requiredProofTypeU8 = BigInt(requiredProofType); // Convert to bigint for Uint<8>

    this.executeAsParticipant(
      this.companyId,
      (ctx, empId, reqType, reqThreshold) =>
        this.contract.impureCircuits.verify_income_proof(
          ctx,
          empId,
          reqType,
          reqThreshold
        ),
      employeeIdBytes,
      requiredProofTypeU8,
      requiredThreshold
    );

    console.log('✅ Income proof verification succeeded');
    return true;
  }
}
