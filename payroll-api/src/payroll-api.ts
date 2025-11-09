import { type ContractAddress } from '@midnight-ntwrk/compact-runtime';
import { type Logger } from 'pino';
import {
  type PayrollContract,
  type PayrollDerivedState,
  type PayrollProviders,
  type DeployedPayrollContract,
  emptyPayrollState,
  type UserAction,
  type AccountId,
  type CompanyInfo,
  type EmployeeInfo,
  type DetailedWithdrawalTransaction,
} from './common-types.js';
import {
  type PayrollPrivateState,
  Contract,
  createPayrollPrivateState,
  ledger,
  payrollWitnesses,
  type PaymentRecord,
  type RecurringPayment,
  RecurringPaymentFrequency,
  calculateNextPaymentDate,
  getStandardCalendarConfig,
  toUnixTimestamp,
} from '@zksalaria/payroll-contract';
import * as utils from './utils/index';
import { deployContract, findDeployedContract } from '@midnight-ntwrk/midnight-js-contracts';
import { combineLatest, concat, defer, from, map, type Observable, of, retry, scan, Subject } from 'rxjs';

const payrollContract: PayrollContract = new Contract(payrollWitnesses);

/**
 * Deployed Payroll API interface
 * Matching our 7 implemented circuits
 */
export interface DeployedPayrollAPI {
  readonly deployedContractAddress: ContractAddress;
  readonly state$: Observable<PayrollDerivedState>;
  readonly userId: string;

  // Company operations
  // Note: Company registration happens during deploy(), not via separate method
  depositCompanyFunds(companyId: string, amount: string): Promise<void>;
  getCompanyInfo(companyId: string): Promise<CompanyInfo>;

  // Employee operations
  hashEmployeeId(walletAddress: string): Promise<Uint8Array>;
  addEmployee(companyId: string, employeeWalletAddress: string): Promise<void>;
  withdrawEmployeeSalary(employeeWalletAddress: string, amount: string): Promise<void>;
  getEmployeeInfo(employeeWalletAddress: string): Promise<EmployeeInfo>;
  getEmployeeCount(): Promise<number>;
  getAllEmployeeIds(): Promise<string[]>;

  // Payment operations
  payEmployee(companyId: string, employeeWalletAddress: string, amount: string, paymentType?: number): Promise<void>;
  getEmployeePaymentHistory(employeeWalletAddress: string): Promise<PaymentRecord[]>;

  // Withdrawal history (API-layer storage)
  getWithdrawalHistory(): Promise<import('./common-types.js').DetailedWithdrawalTransaction[]>;

  // System operations
  updateTimestamp(newTimestamp: number): Promise<void>;
  // mintTokens(amount: string): Promise<void>;

  // Recurring payment operations
  createRecurringPayment(
    companyId: string,
    employeeWalletAddress: string,
    amount: string,
    frequency: bigint,
    startDate: Date,
    endDate: Date | null,
    dayOfWeek?: number
  ): Promise<void>;
  pauseRecurringPayment(recurringPaymentId: string): Promise<void>;
  resumeRecurringPayment(recurringPaymentId: string): Promise<void>;
  editRecurringPayment(recurringPaymentId: string, newAmount: string): Promise<void>;
  processRecurringPayment(recurringPaymentId: string): Promise<void>;
  getRecurringPayment(recurringPaymentId: string): Promise<RecurringPayment | null>;
  getRecurringPaymentByEmployee(employeeId: string): Promise<RecurringPayment | null>;
  getAllRecurringPayments(companyId?: string, status?: bigint): Promise<RecurringPayment[]>;

  // Batch payment operations
  batchPayEmployees(companyId: string, payments: Array<{ employeeId: string; amount: string }>): Promise<void>;

  // Disclosure management
  grantIncomeDisclosure(employeeId: string, lenderId: string, minThreshold: string, expiresIn: number): Promise<void>;
  grantEmploymentDisclosure(employeeId: string, verifierId: string, expiresIn: number): Promise<void>;
  grantAuditDisclosure(auditorId: string, expiresIn: number): Promise<void>;
  revokeDisclosure(grantorId: string, granteeId: string, permissionType: bigint): Promise<void>;

  // Employment verification
  updateEmploymentStatus(employeeId: string, newStatus: bigint): Promise<void>;
  verifyEmployment(employeeId: string, verifierId: string): Promise<boolean>;

  // ZKML Income Proofs (Phase 2.1)
  registerTrustedVerifier(verifierPubkey: string): Promise<boolean>;
  submitIncomeProof(
    employeeId: string,
    proofType: bigint,
    thresholdMin: string,
    thresholdMax: string,
    txids: Array<string>,
    historyCommitment: string,
    attestationHash: string,
    verifierPubkey: string,
    timestamp: bigint,
    expiresIn: number
  ): Promise<boolean>;
  verifyIncomeProof(employeeId: string, requiredProofType: bigint, requiredThreshold: string): Promise<boolean>;
  getIncomeProof(employeeId: string): Promise<any | null>;
  computeHistoryCommitment(employeeId: string): Promise<string>;
}

/**
 * PayrollAPI class
 * Main API layer for zkSalaria payroll system
 * Following bank-api patterns with RxJS reactive state management
 */
export class PayrollAPI implements DeployedPayrollAPI {
  private constructor(
    public readonly accountId: AccountId,
    public readonly userId: string, // User ID for this API instance
    public readonly deployedContract: DeployedPayrollContract,
    public readonly providers: PayrollProviders,
    private readonly logger: Logger,
  ) {
    const combine = (acc: PayrollDerivedState, value: PayrollDerivedState): PayrollDerivedState => {
      return {
        totalCompanies: value.totalCompanies,
        totalEmployees: value.totalEmployees,
        totalPayments: value.totalPayments,
        totalSupply: value.totalSupply,
        currentTimestamp: value.currentTimestamp,
        companyName: value.companyName,
        lastTransaction: value.lastTransaction ?? acc.lastTransaction,
        lastCancelledTransaction: value.lastCancelledTransaction,
        employees: value.employees,
        paymentHistory: value.paymentHistory,
        encryptedBalances: value.encryptedBalances,
      };
    };

    this.deployedContractAddress = deployedContract.deployTxData.public.contractAddress;
    this.transactions$ = new Subject<UserAction>();
    this.privateStates$ = new Subject<PayrollPrivateState>();

    // Initialize withdrawal history storage key (following bank-api pattern)
    this.withdrawalLogKey = `${this.deployedContractAddress}:${this.userId}:withdrawals`;

    // Reactive state stream combining ledger state, private state, and user actions
    this.state$ = combineLatest(
      [
        providers.publicDataProvider
          .contractStateObservable(this.deployedContractAddress, { type: 'all' })
          .pipe(map((contractState) => ledger(contractState.data))),
        concat(
          from(defer(() => providers.privateStateProvider.get(this.accountId) as Promise<PayrollPrivateState>)),
          this.privateStates$,
        ),
        concat(of<UserAction>({ transaction: undefined, cancelledTransaction: undefined }), this.transactions$),
      ],
      (ledgerState, privateState, userActions) => {
        const result: PayrollDerivedState = {
          // Note: One contract per company (battleship pattern), so totalCompanies always 1
          totalCompanies: 1n,
          totalEmployees: ledgerState.total_employees,
          totalPayments: ledgerState.total_payments,
          totalSupply: ledgerState.total_supply,
          currentTimestamp: Number(ledgerState.current_timestamp),
          companyName: utils.bytes64ToString(ledgerState.company_name),
          lastTransaction: userActions.transaction,
          lastCancelledTransaction: userActions.cancelledTransaction,
          // Include ledger state maps for employee/payment queries
          employees: ledgerState.employee_accounts,
          paymentHistory: ledgerState.employee_payment_history,
          encryptedBalances: ledgerState.encrypted_employee_balances,
        };
        return result;
      },
    ).pipe(
      scan(combine, emptyPayrollState),
      retry({
        delay: 500,
      }),
    );
  }

  readonly deployedContractAddress: ContractAddress;
  readonly state$: Observable<PayrollDerivedState>;
  readonly transactions$: Subject<UserAction>;
  readonly privateStates$: Subject<PayrollPrivateState>;

  // Withdrawal history tracking (API-layer storage following bank-api pattern)
  private readonly withdrawalLogKey: string;

  // Type-safe circuit calls (workaround for empty witnesses type inference)
  private get circuits() {
    return this.deployedContract.callTx as unknown as import('./common-types.js').PayrollCircuitCalls;
  }

  // ========================================
  // STATIC METHODS: Deploy & Connect
  // ========================================

  /**
   * Deploy a new payroll contract
   * Following bank-api deploy pattern with retry logic
   * @param companyId - Unique identifier for the company
   * @param companyName - Name of the company
   */
  static async deploy(
    providers: PayrollProviders,
    companyId: string,
    companyName: string,
    logger: Logger,
  ): Promise<ContractAddress> {
    logger.info({ deployPayrollContract: { companyId, companyName } });

    // Retry logic for transient failures
    const maxAttempts = 2; // Reduced from 5 - local deployments shouldn't need many retries
    let lastError: unknown;
    let deployedPayrollContract: DeployedPayrollContract | undefined;

    // Constructor parameters: companyId, companyName, initialTimestamp (no nonce in balance tracking model)
    const companyIdBytes = utils.stringToBytes32(companyId);
    const companyNameBytes = utils.stringToBytes64(companyName);
    const initialTimestamp = BigInt(Math.floor(Date.now() / 1000));

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        deployedPayrollContract = await deployContract(providers, {
          contract: payrollContract,
          privateStateId: `payroll-${companyId}` as AccountId,
          initialPrivateState: createPayrollPrivateState(),
          args: [companyIdBytes, companyNameBytes, initialTimestamp],
        });
        break;
      } catch (err) {
        lastError = err;
        const backoffMs = attempt === maxAttempts ? 0 : 1000 * Math.pow(2, attempt - 1);
        logger.warn({
          deployRetry: {
            attempt,
            maxAttempts,
            backoffMs,
            error: err instanceof Error ? err.message : String(err),
          },
        });
        if (attempt < maxAttempts) {
          await new Promise((resolve) => setTimeout(resolve, backoffMs));
        }
      }
    }

    if (!deployedPayrollContract) {
      throw lastError;
    }

    return deployedPayrollContract.deployTxData.public.contractAddress;
  }

  /**
   * Connect to an existing deployed payroll contract
   * Following bank-api connect pattern
   */
  static async connect(
    providers: PayrollProviders,
    contractAddress: ContractAddress,
    userId: string,
    logger: Logger,
  ): Promise<DeployedPayrollAPI> {
    const normalizedUserId = utils.normalizeId(userId);
    const stateKey = normalizedUserId as AccountId;

    const deployedPayrollContract = await findDeployedContract(providers as any, {
      contractAddress,
      contract: payrollContract,
      privateStateId: stateKey,
      initialPrivateState: createPayrollPrivateState(),
    }) as DeployedPayrollContract;

    const payrollAPI = new PayrollAPI(stateKey, normalizedUserId, deployedPayrollContract, providers, logger);

    return payrollAPI;
  }

  // ========================================
  // COMPANY OPERATIONS
  // ========================================

  // Note: Company registration happens during contract deployment (constructor)
  // No separate registerCompany() method needed

  async depositCompanyFunds(companyId: string, amount: string): Promise<void> {
    this.logger?.info({ depositCompanyFunds: { companyId, amount } });
    this.transactions$.next({
      transaction: {
        type: 'deposit',
        amount: utils.parseAmount(amount),
        timestamp: new Date(),
        companyId,
      },
      cancelledTransaction: undefined,
    });

    // Note: deposit_company_funds circuit only takes amount parameter
    // CompanyId is stored in contract ledger state (one contract per company)
    await this.circuits.deposit_company_funds(utils.parseAmount(amount));
  }

  async getCompanyInfo(companyId: string): Promise<CompanyInfo> {
    const normalizedId = utils.normalizeId(companyId);

    this.logger?.info({
      getCompanyInfo: {
        originalCompanyId: companyId,
        originalLength: companyId.length,
        normalizedId: normalizedId,
        normalizedLength: normalizedId.length,
        contractAddress: this.deployedContractAddress,
      }
    });

    const state = await this.providers.publicDataProvider.queryContractState(this.deployedContractAddress);
    if (!state) {
      this.logger?.warn('No contract state available for getCompanyInfo');
      return { companyId: normalizedId, exists: false };
    }

    const ledgerState = ledger(state.data);
    // Note: One contract per company - check if company_id matches
    const storedCompanyId = utils.bytes32ToString(ledgerState.company_id);
    const exists = storedCompanyId === normalizedId;

    this.logger?.info({
      companyIdComparison: {
        storedCompanyId: storedCompanyId,
        storedLength: storedCompanyId.length,
        normalizedId: normalizedId,
        normalizedLength: normalizedId.length,
        exists: exists,
        bytesHex: Array.from(ledgerState.company_id).map(b => b.toString(16).padStart(2, '0')).join(''),
      }
    });

    return {
      companyId: normalizedId,
      exists,
      companyName: exists ? utils.bytes64ToString(ledgerState.company_name) : undefined,
    };
  }

  // ========================================
  // EMPLOYEE OPERATIONS
  // ========================================

  /**
   * Hash employee wallet address to get employee ID (SHA-256)
   * This is used internally by addEmployee and other methods to convert wallet addresses to employee IDs
   * @param walletAddress - Employee wallet address
   * @returns Hashed employee ID as Uint8Array (32 bytes)
   */
  async hashEmployeeId(walletAddress: string): Promise<Uint8Array> {
    return await utils.walletAddressToEmployeeId(walletAddress);
  }

  async addEmployee(companyId: string, employeeWalletAddress: string): Promise<void> {
    this.logger?.info({ addEmployee: { companyId, employeeWalletAddress } });

    // Hash wallet address to get employee ID (SHA-256 -> 32 bytes)
    const employeeIdBytes = await utils.walletAddressToEmployeeId(employeeWalletAddress);

    // DEBUG: Log the hashed bytes
    console.log('[PayrollAPI] addEmployee DEBUG:', {
      walletAddress: employeeWalletAddress,
      hashedBytes: Array.from(employeeIdBytes),
      hashedHex: Array.from(employeeIdBytes).map(b => b.toString(16).padStart(2, '0')).join(''),
      bytesLength: employeeIdBytes.length,
    });

    // Update contract timestamp to current time before adding employee
    const currentTimestamp = Math.floor(Date.now() / 1000); // Convert to Unix timestamp (seconds)
    await this.circuits.update_timestamp(BigInt(currentTimestamp));

    this.transactions$.next({
      transaction: {
        type: 'add_employee',
        timestamp: new Date(),
        companyId,
        employeeId: employeeWalletAddress, // Store full wallet address for UI
      },
      cancelledTransaction: undefined,
    });

    // Note: add_employee circuit signature: (employee_id)
    // CompanyId comes from contract ledger state (one contract per company)
    // We pass the hashed wallet address as employee_id
    try {
      await this.circuits.add_employee(employeeIdBytes);
      console.log('[PayrollAPI] add_employee transaction submitted successfully');
    } catch (err) {
      console.error('[PayrollAPI] add_employee transaction FAILED:', err);
      console.error('[PayrollAPI] Error details:', {
        message: err instanceof Error ? err.message : 'Unknown error',
        stack: err instanceof Error ? err.stack : undefined,
        errorType: err?.constructor?.name,
        fullError: err,
      });
      throw err;
    }
  }

  async withdrawEmployeeSalary(employeeWalletAddress: string, amount: string): Promise<void> {
    this.logger?.info({ withdrawEmployeeSalary: { employeeWalletAddress, amount } });
    const withdrawalAmount = utils.parseAmount(amount);
    const withdrawalTimestamp = new Date();

    // Hash wallet address to get employee ID
    const employeeIdBytes = await utils.walletAddressToEmployeeId(employeeWalletAddress);

    this.transactions$.next({
      transaction: {
        type: 'withdraw',
        amount: withdrawalAmount,
        timestamp: withdrawalTimestamp,
        employeeId: employeeWalletAddress,
      },
      cancelledTransaction: undefined,
    });

    // Update contract timestamp to current time before withdrawal
    const currentTimestamp = Math.floor(Date.now() / 1000); // Convert to Unix timestamp (seconds)
    await this.circuits.update_timestamp(BigInt(currentTimestamp));

    await this.circuits.withdraw_employee_salary(employeeIdBytes, withdrawalAmount);

    // Get updated balance after withdrawal
    const employeeInfo = await this.getEmployeeInfo(employeeWalletAddress);
    const balanceAfter = employeeInfo.balance ?? 0n;

    // Log withdrawal to history (API-layer storage)
    const withdrawalId = `withdraw_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    await this.appendWithdrawalLog({
      withdrawal_id: withdrawalId,
      employee_id: employeeWalletAddress,
      amount: withdrawalAmount,
      balance_after: balanceAfter,
      timestamp: withdrawalTimestamp,
    });
  }

  async getEmployeeInfo(employeeWalletAddress: string): Promise<EmployeeInfo> {
    // Hash wallet address to get employee ID
    const employeeIdBytes = await utils.walletAddressToEmployeeId(employeeWalletAddress);

    const state = await this.providers.publicDataProvider.queryContractState(this.deployedContractAddress);
    if (!state) {
      return { employeeId: employeeWalletAddress, exists: false };
    }

    const ledgerState = ledger(state.data);
    const exists = ledgerState.employee_accounts.member(employeeIdBytes);

    // Get payment history count
    let paymentHistoryCount = 0;
    if (exists && ledgerState.employee_payment_history.member(employeeIdBytes)) {
      const history = ledgerState.employee_payment_history.lookup(employeeIdBytes);
      // Count non-empty payments (empty records have timestamp = 0)
      paymentHistoryCount = history.filter((record: PaymentRecord) => record.timestamp > 0).length;
    }

    return {
      employeeId: employeeWalletAddress,
      exists,
      paymentHistoryCount,
    };
  }

  async getEmployeeCount(): Promise<number> {
    const state = await this.providers.publicDataProvider.queryContractState(this.deployedContractAddress);
    if (!state) {
      return 0;
    }

    const ledgerState = ledger(state.data);

    // Try to get map size
    const mapSize = typeof ledgerState.employee_accounts?.size === 'function'
      ? ledgerState.employee_accounts.size()
      : ledgerState.employee_accounts?.size;

    if (mapSize !== undefined && mapSize !== null) {
      this.logger?.info({ getEmployeeCount: { mapSize } });
      return typeof mapSize === 'number' ? mapSize : Number(mapSize);
    }

    // Fallback to counter if map size unavailable
    const counterValue = ledgerState.total_employees;
    this.logger?.info({ getEmployeeCount: { counterValue } });
    return typeof counterValue === 'number' ? counterValue : Number(counterValue);
  }

  async getAllEmployeeIds(): Promise<string[]> {
    const state = await this.providers.publicDataProvider.queryContractState(this.deployedContractAddress);
    if (!state) {
      return [];
    }

    const ledgerState = ledger(state.data);
    const employeeIdsList = ledgerState.employee_ids;

    if (!employeeIdsList) {
      this.logger?.warn('employee_ids list not found in ledger state');
      return [];
    }

    // Lists support TypeScript iteration via Symbol.iterator
    const employeeIds: string[] = [];
    for (const employeeIdBytes of employeeIdsList) {
      if (employeeIdBytes) {
        // Convert bytes to hex string (employee ID is the wallet address hash)
        const hexId = Array.from(employeeIdBytes as Uint8Array)
          .map(b => b.toString(16).padStart(2, '0'))
          .join('');
        employeeIds.push(hexId);
      }
    }

    this.logger?.info({ getAllEmployeeIds: { count: employeeIds.length, ids: employeeIds } });
    return employeeIds;
  }

  // ========================================
  // PAYMENT OPERATIONS
  // ========================================

  async payEmployee(companyId: string, employeeWalletAddress: string, amount: string, paymentType: number = 0): Promise<void> {
    const typeLabel = paymentType === 0 ? 'SALARY' : paymentType === 1 ? 'ADVANCE' : 'BONUS';
    this.logger?.info({ payEmployee: { companyId, employeeWalletAddress, amount, paymentType, typeLabel } });

    // Hash wallet address to get employee ID
    const employeeIdBytes = await utils.walletAddressToEmployeeId(employeeWalletAddress);

    // Update contract timestamp to current time before making payment
    const currentTimestamp = Math.floor(Date.now() / 1000); // Convert to Unix timestamp (seconds)
    await this.circuits.update_timestamp(BigInt(currentTimestamp));

    this.transactions$.next({
      transaction: {
        type: 'pay_salary',
        amount: utils.parseAmount(amount),
        timestamp: new Date(),
        companyId,
        employeeId: employeeWalletAddress,
      },
      cancelledTransaction: undefined,
    });

    // Note: pay_employee circuit signature: (employee_id, salary_amount, payment_type)
    // CompanyId comes from contract ledger state (one contract per company)
    // payment_type: 0=SALARY, 1=ADVANCE, 2=BONUS, 3=COMMISSION, 4=REIMBURSEMENT, 5=ADJUSTMENT
    await this.circuits.pay_employee(employeeIdBytes, utils.parseAmount(amount), BigInt(paymentType));
  }

  async getEmployeePaymentHistory(employeeWalletAddress: string): Promise<PaymentRecord[]> {
    // Hash wallet address to get employee ID
    const employeeIdBytes = await utils.walletAddressToEmployeeId(employeeWalletAddress);

    const state = await this.providers.publicDataProvider.queryContractState(this.deployedContractAddress);
    if (!state) {
      return [];
    }

    const ledgerState = ledger(state.data);

    if (!ledgerState.employee_payment_history.member(employeeIdBytes)) {
      return [];
    }

    const history = ledgerState.employee_payment_history.lookup(employeeIdBytes);
    // Filter out empty records (timestamp = 0)
    return history.filter((record: PaymentRecord) => record.timestamp > 0);
  }

  /**
   * Get employee payment history with decrypted amounts
   * Uses the value_decryption_map to decrypt encrypted_amount fields
   * Returns payment records with plaintext amounts
   */
  async getEmployeePaymentHistoryDecrypted(employeeWalletAddress: string): Promise<Array<PaymentRecord & { decrypted_amount: bigint }>> {
    // Hash wallet address to get employee ID
    const employeeIdBytes = await utils.walletAddressToEmployeeId(employeeWalletAddress);

    const state = await this.providers.publicDataProvider.queryContractState(this.deployedContractAddress);
    if (!state) {
      return [];
    }

    const ledgerState = ledger(state.data);

    if (!ledgerState.employee_payment_history.member(employeeIdBytes)) {
      return [];
    }

    const history = ledgerState.employee_payment_history.lookup(employeeIdBytes);

    // Decrypt amounts using value_decryption_map
    const decryptedHistory = history
      .filter((record: PaymentRecord) => record.timestamp > 0)
      .map((record: PaymentRecord) => {
        // Look up decrypted amount in value_decryption_map
        const decryptedAmount = ledgerState.value_decryption_map.member(record.encrypted_amount)
          ? ledgerState.value_decryption_map.lookup(record.encrypted_amount)
          : 0n; // Default to 0 if not found

        return {
          ...record,
          decrypted_amount: decryptedAmount,
        };
      });

    return decryptedHistory;
  }

  /**
   * Get employee's decrypted balance
   * Uses the value_decryption_map to decrypt the encrypted balance
   */
  async getEmployeeBalance(employeeWalletAddress: string): Promise<bigint> {
    // Hash wallet address to get employee ID
    const employeeIdBytes = await utils.walletAddressToEmployeeId(employeeWalletAddress);

    const state = await this.providers.publicDataProvider.queryContractState(this.deployedContractAddress);
    if (!state) {
      return 0n;
    }

    const ledgerState = ledger(state.data);

    // Check if employee has a balance entry
    if (!ledgerState.encrypted_employee_balances.member(employeeIdBytes)) {
      return 0n;
    }

    // Get encrypted balance
    const encryptedBalance = ledgerState.encrypted_employee_balances.lookup(employeeIdBytes);

    // Decrypt using value_decryption_map
    const decryptedBalance = ledgerState.value_decryption_map.member(encryptedBalance)
      ? ledgerState.value_decryption_map.lookup(encryptedBalance)
      : 0n;

    return decryptedBalance;
  }

  // ========================================
  // SYSTEM OPERATIONS
  // ========================================

  async updateTimestamp(newTimestamp: number): Promise<void> {
    this.logger?.info({ updateTimestamp: { newTimestamp } });

    await this.circuits.update_timestamp(BigInt(newTimestamp));
  }

  // NOTE: mint_tokens circuit removed in balance tracking model
  // Use depositCompanyFunds() instead to add funds to company treasury

  // ========================================
  // RECURRING PAYMENT OPERATIONS
  // ========================================

  async createRecurringPayment(
    companyId: string,
    employeeWalletAddress: string,
    amount: string,
    frequency: bigint,
    startDate: Date,
    endDate: Date | null,
    dayOfWeek: number = 5 // Default to Friday for weekly
  ): Promise<void> {
    this.logger?.info({ createRecurringPayment: { companyId, employeeWalletAddress, amount, frequency, startDate, endDate } });

    // Get standard calendar configuration based on frequency
    const calendarConfig = getStandardCalendarConfig(frequency, dayOfWeek);

    // Calculate next payment date using contract's calendar utilities
    const nextPaymentDate = calculateNextPaymentDate(startDate, frequency, dayOfWeek);

    // Hash wallet address to get employee ID
    const employeeIdBytes = await utils.walletAddressToEmployeeId(employeeWalletAddress);

    const startTimestamp = toUnixTimestamp(startDate);
    const endTimestamp = endDate ? toUnixTimestamp(endDate) : 0n;
    const nextPaymentTimestamp = toUnixTimestamp(nextPaymentDate);

    await this.circuits.create_recurring_payment(
      employeeIdBytes,
      utils.parseAmount(amount),
      frequency,
      startTimestamp,
      endTimestamp,
      nextPaymentTimestamp,
      calendarConfig.paymentDayOfMonth1,
      calendarConfig.paymentDayOfMonth2,
      calendarConfig.paymentDayOfWeek
    );
  }

  async pauseRecurringPayment(recurringPaymentId: string): Promise<void> {
    this.logger?.info({ pauseRecurringPayment: { recurringPaymentId } });

    const idBytes = utils.hexToBytes32(recurringPaymentId);
    await this.circuits.pause_recurring_payment(idBytes);
  }

  async resumeRecurringPayment(recurringPaymentId: string): Promise<void> {
    this.logger?.info({ resumeRecurringPayment: { recurringPaymentId } });

    const idBytes = utils.hexToBytes32(recurringPaymentId);

    // Get the recurring payment to determine frequency and dayOfWeek
    const payment = await this.getRecurringPayment(recurringPaymentId);
    if (!payment) {
      throw new Error('Recurring payment not found');
    }

    // Calculate next payment date based on current time
    const dayOfWeek = payment.frequency === RecurringPaymentFrequency.WEEKLY ? Number(payment.payment_day_of_week) : 5;
    const nextPaymentDate = calculateNextPaymentDate(new Date(), payment.frequency, dayOfWeek);
    const nextPaymentTimestamp = toUnixTimestamp(nextPaymentDate);

    await this.circuits.resume_recurring_payment(idBytes, nextPaymentTimestamp);
  }

  async editRecurringPayment(recurringPaymentId: string, newAmount: string): Promise<void> {
    this.logger?.info({ editRecurringPayment: { recurringPaymentId, newAmount } });

    const idBytes = utils.hexToBytes32(recurringPaymentId);
    await this.circuits.edit_recurring_payment(idBytes, utils.parseAmount(newAmount));
  }

  async processRecurringPayment(recurringPaymentId: string): Promise<void> {
    this.logger?.info({ processRecurringPayment: { recurringPaymentId } });

    const idBytes = utils.hexToBytes32(recurringPaymentId);
    await this.circuits.process_recurring_payment(idBytes);
  }

  async getRecurringPayment(recurringPaymentId: string): Promise<RecurringPayment | null> {
    const idBytes = utils.hexToBytes32(recurringPaymentId);

    const state = await this.providers.publicDataProvider.queryContractState(this.deployedContractAddress);
    if (!state) {
      return null;
    }

    const ledgerState = ledger(state.data);

    if (!ledgerState.recurring_payments.member(idBytes)) {
      return null;
    }

    return ledgerState.recurring_payments.lookup(idBytes);
  }

  async getRecurringPaymentByEmployee(employeeId: string): Promise<RecurringPayment | null> {
    // Use the same hashing method as createRecurringPayment
    const employeeIdBytes = await utils.walletAddressToEmployeeId(employeeId);
    this.logger?.info({
      getRecurringPaymentByEmployee: {
        employeeId,
        employeeIdBytesHex: Array.from(employeeIdBytes).map(b => b.toString(16).padStart(2, '0')).join(''),
      }
    });

    const state = await this.providers.publicDataProvider.queryContractState(this.deployedContractAddress);
    if (!state) {
      this.logger?.warn('No contract state available');
      return null;
    }

    const ledgerState = ledger(state.data);

    // Check if employee has a recurring payment
    const hasMember = ledgerState.recurring_payment_by_employee.member(employeeIdBytes);
    this.logger?.info({
      checkRecurringPaymentByEmployee: {
        hasMember,
        mapSize: ledgerState.recurring_payment_by_employee.size || 'unknown',
      }
    });

    if (!hasMember) {
      return null;
    }

    // Get the recurring payment ID
    const recurringPaymentId = ledgerState.recurring_payment_by_employee.lookup(employeeIdBytes);
    this.logger?.info({
      recurringPaymentId: Array.from(recurringPaymentId).map(b => b.toString(16).padStart(2, '0')).join(''),
    });

    // Get the actual recurring payment
    if (!ledgerState.recurring_payments.member(recurringPaymentId)) {
      this.logger?.warn('Recurring payment ID found but payment not in map');
      return null;
    }

    const payment = ledgerState.recurring_payments.lookup(recurringPaymentId);
    this.logger?.info({ foundRecurringPayment: payment });
    return payment;
  }

  async getAllRecurringPayments(companyId?: string, status?: bigint): Promise<RecurringPayment[]> {
    const state = await this.providers.publicDataProvider.queryContractState(this.deployedContractAddress);
    if (!state) {
      return [];
    }

    const ledgerState = ledger(state.data);
    const recurringPaymentIdsList = ledgerState.recurring_payment_ids;

    if (!recurringPaymentIdsList) {
      this.logger?.warn('recurring_payment_ids list not found in ledger state');
      return [];
    }

    // Iterate through all recurring payment IDs
    const allPayments: RecurringPayment[] = [];
    for (const paymentIdBytes of recurringPaymentIdsList) {
      if (paymentIdBytes && ledgerState.recurring_payments.member(paymentIdBytes)) {
        const payment = ledgerState.recurring_payments.lookup(paymentIdBytes);

        // Apply filters if provided
        if (status !== undefined && payment.status !== status) {
          continue;
        }

        allPayments.push(payment);
      }
    }

    this.logger?.info({ getAllRecurringPayments: { count: allPayments.length } });
    return allPayments;
  }

  // ========================================
  // BATCH PAYMENT OPERATIONS
  // ========================================

  async batchPayEmployees(
    companyId: string,
    payments: Array<{ employeeId: string; amount: string }>
  ): Promise<void> {
    this.logger?.info({ batchPayEmployees: { companyId, paymentCount: payments.length } });

    // Convert to Vector<10, BatchPaymentEntry> format
    // Fill unused slots with empty entries (amount=0)
    const batchEntries: Array<{ employee_id: Uint8Array; amount: bigint }> = [];

    for (let i = 0; i < 10; i++) {
      if (i < payments.length) {
        const payment = payments[i];
        batchEntries.push({
          employee_id: utils.stringToBytes32(payment.employeeId),
          amount: utils.parseAmount(payment.amount),
        });
      } else {
        // Empty slot
        batchEntries.push({
          employee_id: new Uint8Array(32),
          amount: 0n,
        });
      }
    }

    this.transactions$.next({
      transaction: {
        type: 'pay_salary',
        timestamp: new Date(),
        companyId,
      },
      cancelledTransaction: undefined,
    });

    // NOTE: batch_pay_employees circuit is currently commented out in payroll.compact (testnet performance)
    // await this.circuits.batch_pay_employees(batchEntries);
    throw new Error('Batch payments temporarily disabled - use individual payEmployee calls');
  }

  // ========================================
  // DISCLOSURE MANAGEMENT
  // ========================================

  async grantIncomeDisclosure(
    employeeId: string,
    lenderId: string,
    minThreshold: string,
    expiresIn: number
  ): Promise<void> {
    this.logger?.info({ grantIncomeDisclosure: { employeeId, lenderId, minThreshold, expiresIn } });

    // Hash employee wallet address to get employee ID (must match add_employee hashing)
    const employeeIdBytes = await utils.walletAddressToEmployeeId(employeeId);
    const lenderIdBytes = utils.stringToBytes32(lenderId);

    await this.circuits.grant_income_disclosure(
      employeeIdBytes,
      lenderIdBytes,
      utils.parseAmount(minThreshold),
      BigInt(expiresIn)
    );
  }

  async grantEmploymentDisclosure(
    employeeId: string,
    verifierId: string,
    expiresIn: number
  ): Promise<void> {
    this.logger?.info({ grantEmploymentDisclosure: { employeeId, verifierId, expiresIn } });

    // Hash employee wallet address to get employee ID (must match add_employee hashing)
    const employeeIdBytes = await utils.walletAddressToEmployeeId(employeeId);
    const verifierIdBytes = utils.stringToBytes32(verifierId);

    await this.circuits.grant_employment_disclosure(
      employeeIdBytes,
      verifierIdBytes,
      BigInt(expiresIn)
    );
  }

  async grantAuditDisclosure(auditorId: string, expiresIn: number): Promise<void> {
    this.logger?.info({ grantAuditDisclosure: { auditorId, expiresIn } });

    const companyIdBytes = utils.stringToBytes32(this.accountId);
    const auditorIdBytes = utils.stringToBytes32(auditorId);

    await this.circuits.grant_audit_disclosure(
      companyIdBytes,
      auditorIdBytes,
      BigInt(expiresIn)
    );
  }

  async revokeDisclosure(
    grantorId: string,
    granteeId: string,
    permissionType: bigint
  ): Promise<void> {
    this.logger?.info({ revokeDisclosure: { grantorId, granteeId, permissionType } });

    // Hash grantorId if it's an employee (INCOME_RANGE=0 or EMPLOYMENT=1)
    // Don't hash if it's a company (AUDIT=3)
    const isEmployeeDisclosure = permissionType === 0n || permissionType === 1n;
    const grantorIdBytes = isEmployeeDisclosure
      ? await utils.walletAddressToEmployeeId(grantorId)
      : utils.stringToBytes32(grantorId);
    const granteeIdBytes = utils.stringToBytes32(granteeId);

    await this.circuits.revoke_disclosure(
      grantorIdBytes,
      granteeIdBytes,
      permissionType
    );
  }

  // ========================================
  // EMPLOYMENT VERIFICATION
  // ========================================

  async updateEmploymentStatus(employeeId: string, newStatus: bigint): Promise<void> {
    this.logger?.info({ updateEmploymentStatus: { employeeId, newStatus } });

    // Hash employee wallet address to get employee ID (must match add_employee hashing)
    const employeeIdBytes = await utils.walletAddressToEmployeeId(employeeId);

    await this.circuits.update_employment_status(
      employeeIdBytes,
      newStatus
    );
  }

  async verifyEmployment(employeeId: string, verifierId: string): Promise<boolean> {
    this.logger?.info({ verifyEmployment: { employeeId, verifierId } });

    // Hash employee wallet address to get employee ID (must match add_employee hashing)
    const employeeIdBytes = await utils.walletAddressToEmployeeId(employeeId);
    const verifierIdBytes = utils.stringToBytes32(verifierId);

    const result = await this.circuits.verify_employment(
      employeeIdBytes,
      verifierIdBytes
    );

    // DEBUG: Log the result to see what we actually get
    this.logger?.info({
      verifyEmployment_result: {
        result,
        resultType: typeof result,
        hasPrivate: 'private' in result,
        privateResult: result.private?.result,
        privateResultType: typeof result.private?.result,
      }
    });

    // Result is CircuitResults<T, Uint8Array> - extract bytes from private.result
    const bytes = result.private.result as Uint8Array;
    return bytes[0] === 1;
  }

  // ========================================
  // ZKML INCOME PROOFS (PHASE 2.1)
  // ========================================

  async registerTrustedVerifier(verifierPubkey: string): Promise<boolean> {
    this.logger?.info({ registerTrustedVerifier: { verifierPubkey } });

    const verifierPubkeyBytes = utils.hexToBytes32(verifierPubkey);

    const result = await this.circuits.register_trusted_verifier(verifierPubkeyBytes);
    // Extract boolean from CircuitResults - circuits returning Boolean wrap result in transaction metadata
    return result.private.result;
  }

  async submitIncomeProof(
    employeeId: string,
    proofType: bigint,
    thresholdMin: string,
    thresholdMax: string,
    txids: Array<string>,
    historyCommitment: string,
    attestationHash: string,
    verifierPubkey: string,
    timestamp: bigint,
    expiresIn: number
  ): Promise<boolean> {
    this.logger?.info({
      submitIncomeProof: {
        employeeId,
        proofType,
        thresholdMin,
        thresholdMax,
        txidsCount: txids.length,
        historyCommitment,
        expiresIn,
      },
    });

    const employeeIdBytes = await utils.walletAddressToEmployeeId(employeeId);
    const historyCommitmentBytes = utils.hexToBytes32(historyCommitment);
    const attestationHashBytes = utils.hexToBytes32(attestationHash);
    const verifierPubkeyBytes = utils.hexToBytes32(verifierPubkey);

    // Convert txids array to Vector<12, Bytes<32>>
    const txidVector: Uint8Array[] = txids.map((txid) => utils.hexToBytes32(txid));
    // Pad to 12 entries if needed
    while (txidVector.length < 12) {
      txidVector.push(new Uint8Array(32));
    }

    const result = await this.circuits.submit_income_proof(
      employeeIdBytes,
      proofType,
      utils.parseAmount(thresholdMin),
      utils.parseAmount(thresholdMax),
      txidVector,
      historyCommitmentBytes,
      attestationHashBytes,
      verifierPubkeyBytes,
      timestamp,
      BigInt(expiresIn)
    );
    // Extract boolean from CircuitResults - circuits returning Boolean wrap result in transaction metadata
    return result.private.result;
  }

  async verifyIncomeProof(
    employeeId: string,
    requiredProofType: bigint,
    requiredThreshold: string
  ): Promise<boolean> {
    this.logger?.info({ verifyIncomeProof: { employeeId, requiredProofType, requiredThreshold } });

    const employeeIdBytes = await utils.walletAddressToEmployeeId(employeeId);

    const result = await this.circuits.verify_income_proof(
      employeeIdBytes,
      requiredProofType,
      utils.parseAmount(requiredThreshold)
    );

    // Extract boolean from CircuitResults - circuits returning Boolean wrap result in transaction metadata
    return result.private.result;
  }

  async getIncomeProof(employeeId: string): Promise<any | null> {
    const employeeIdBytes = await utils.walletAddressToEmployeeId(employeeId);

    const state = await this.providers.publicDataProvider.queryContractState(this.deployedContractAddress);
    if (!state) {
      return null;
    }

    const ledgerState = ledger(state.data);

    if (!ledgerState.income_proofs.member(employeeIdBytes)) {
      return null;
    }

    return ledgerState.income_proofs.lookup(employeeIdBytes);
  }

  /**
   * Compute history commitment for employee's payment history
   * Uses the contract's compute_history_commitment circuit to ensure consistency
   * with on-chain validation: persistentHash<Vector<12, PC_PaymentRecord>>(payment_history)
   *
   * @param employeeId - Employee wallet address
   * @returns Hex-encoded hash commitment (with '0x' prefix)
   */
  async computeHistoryCommitment(employeeId: string): Promise<string> {
    const employeeIdBytes = await utils.walletAddressToEmployeeId(employeeId);

    // Call the contract's compute_history_commitment circuit
    // This ensures we get the exact same hash as the on-chain validation
    const result = await this.circuits.compute_history_commitment(employeeIdBytes);

    if (!result) {
      throw new Error(`Failed to compute history commitment for employee: ${employeeId}`);
    }

    // Extract the Bytes<32> result from the circuit
    const hashBytes = result.private.result;

    // Convert result bytes to hex with '0x' prefix
    const hex = '0x' + Array.from(hashBytes)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    this.logger?.info({
      computeHistoryCommitment: {
        employeeId,
        hashBytesLength: hashBytes.length,
        hashHex: hex
      }
    });

    return hex;
  }

  // ========================================
  // WITHDRAWAL HISTORY TRACKING (API-LAYER)
  // ========================================

  /**
   * Get withdrawal history for current user (employee)
   * Stored in privateStateProvider (following bank-api transaction history pattern)
   */
  async getWithdrawalHistory(): Promise<DetailedWithdrawalTransaction[]> {
    try {
      const raw = await this.providers.privateStateProvider.get(this.withdrawalLogKey as unknown as AccountId);
      return (raw as unknown as DetailedWithdrawalTransaction[]) ?? [];
    } catch {
      return [];
    }
  }

  /**
   * Append withdrawal to history log (private method)
   * Keeps last 100 withdrawals following bank-api pattern
   */
  private async appendWithdrawalLog(entry: DetailedWithdrawalTransaction): Promise<void> {
    try {
      const current = await this.getWithdrawalHistory();
      const updated = [...current, entry].slice(-100); // Keep last 100
      await this.providers.privateStateProvider.set(
        this.withdrawalLogKey as unknown as AccountId,
        updated as unknown as PayrollPrivateState,
      );
    } catch (error) {
      this.logger?.warn({ appendWithdrawalLog: { error } });
    }
  }
}

// Re-export types and constants
export { emptyPayrollState } from './common-types.js';
export type {
  PayrollDerivedState,
  PayrollProviders,
  PayrollCircuitKeys,
  AccountId,
  CompanyInfo,
  EmployeeInfo,
  UserAction,
  PayrollTransaction,
} from './common-types.js';
