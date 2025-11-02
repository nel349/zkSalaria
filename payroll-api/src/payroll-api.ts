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
  type PayrollCircuitKeys,
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
import { combineLatest, concat, defer, firstValueFrom, from, map, type Observable, of, retry, scan, Subject } from 'rxjs';

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
  addEmployee(companyId: string, employeeId: string): Promise<void>;
  withdrawEmployeeSalary(employeeId: string, amount: string): Promise<void>;
  getEmployeeInfo(employeeId: string): Promise<EmployeeInfo>;

  // Payment operations
  payEmployee(companyId: string, employeeId: string, amount: string): Promise<void>;
  getEmployeePaymentHistory(employeeId: string): Promise<PaymentRecord[]>;

  // System operations
  updateTimestamp(newTimestamp: number): Promise<void>;
  mintTokens(amount: string): Promise<void>;

  // Recurring payment operations
  createRecurringPayment(
    companyId: string,
    employeeId: string,
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

  // Batch payment operations
  batchPayEmployees(companyId: string, payments: Array<{ employeeId: string; amount: string }>): Promise<void>;
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
        lastTransaction: value.lastTransaction ?? acc.lastTransaction,
        lastCancelledTransaction: value.lastCancelledTransaction,
      };
    };

    this.deployedContractAddress = deployedContract.deployTxData.public.contractAddress;
    this.transactions$ = new Subject<UserAction>();
    this.privateStates$ = new Subject<PayrollPrivateState>();

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
          lastTransaction: userActions.transaction,
          lastCancelledTransaction: userActions.cancelledTransaction,
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
    const maxAttempts = 5;
    let lastError: unknown;
    let deployedPayrollContract: DeployedPayrollContract | undefined;

    // Constructor parameters: initNonce, companyId, companyName, initialTimestamp
    const initNonce = utils.randomBytes(32);
    const companyIdBytes = utils.stringToBytes32(companyId);
    const companyNameBytes = utils.stringToBytes64(companyName);
    const initialTimestamp = BigInt(Math.floor(Date.now() / 1000));

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        deployedPayrollContract = await deployContract(providers, {
          privateStateId: 'deploy' as AccountId,
          contract: payrollContract,
          initialPrivateState: createPayrollPrivateState(),
          args: [initNonce, companyIdBytes, companyNameBytes, initialTimestamp],
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

    const deployedPayrollContract = await findDeployedContract(providers, {
      contractAddress,
      contract: payrollContract,
      privateStateId: stateKey,
      initialPrivateState: createPayrollPrivateState(),
    });

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
    await this.deployedContract.callTx.deposit_company_funds(utils.parseAmount(amount));
  }

  async getCompanyInfo(companyId: string): Promise<CompanyInfo> {
    const normalizedId = utils.normalizeId(companyId);

    const state = await this.providers.publicDataProvider.queryContractState(this.deployedContractAddress);
    if (!state) {
      return { companyId: normalizedId, exists: false };
    }

    const ledgerState = ledger(state.data);
    // Note: One contract per company - check if company_id matches
    const storedCompanyId = utils.bytes32ToString(ledgerState.company_id);
    const exists = storedCompanyId === normalizedId;

    return {
      companyId: normalizedId,
      exists,
      companyName: exists ? utils.bytes64ToString(ledgerState.company_name) : undefined,
    };
  }

  // ========================================
  // EMPLOYEE OPERATIONS
  // ========================================

  async addEmployee(companyId: string, employeeId: string): Promise<void> {
    this.logger?.info({ addEmployee: { companyId, employeeId } });
    this.transactions$.next({
      transaction: {
        type: 'add_employee',
        timestamp: new Date(),
        companyId,
        employeeId,
      },
      cancelledTransaction: undefined,
    });

    const employeeIdBytes = utils.stringToBytes32(employeeId);

    // Note: add_employee circuit signature: (employee_id)
    // CompanyId comes from contract ledger state (one contract per company)
    await this.deployedContract.callTx.add_employee(employeeIdBytes);
  }

  async withdrawEmployeeSalary(employeeId: string, amount: string): Promise<void> {
    this.logger?.info({ withdrawEmployeeSalary: { employeeId, amount } });
    this.transactions$.next({
      transaction: {
        type: 'withdraw',
        amount: utils.parseAmount(amount),
        timestamp: new Date(),
        employeeId,
      },
      cancelledTransaction: undefined,
    });

    const employeeIdBytes = utils.stringToBytes32(employeeId);

    await this.deployedContract.callTx.withdraw_employee_salary(employeeIdBytes, utils.parseAmount(amount));
  }

  async getEmployeeInfo(employeeId: string): Promise<EmployeeInfo> {
    const normalizedId = utils.normalizeId(employeeId);
    const employeeIdBytes = utils.stringToBytes32(normalizedId);

    const state = await this.providers.publicDataProvider.queryContractState(this.deployedContractAddress);
    if (!state) {
      return { employeeId: normalizedId, exists: false };
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
      employeeId: normalizedId,
      exists,
      paymentHistoryCount,
    };
  }

  // ========================================
  // PAYMENT OPERATIONS
  // ========================================

  async payEmployee(companyId: string, employeeId: string, amount: string): Promise<void> {
    this.logger?.info({ payEmployee: { companyId, employeeId, amount } });
    this.transactions$.next({
      transaction: {
        type: 'pay_salary',
        amount: utils.parseAmount(amount),
        timestamp: new Date(),
        companyId,
        employeeId,
      },
      cancelledTransaction: undefined,
    });

    const employeeIdBytes = utils.stringToBytes32(employeeId);

    // Note: pay_employee circuit signature: (employee_id, salary_amount)
    // CompanyId comes from contract ledger state (one contract per company)
    await this.deployedContract.callTx.pay_employee(employeeIdBytes, utils.parseAmount(amount));
  }

  async getEmployeePaymentHistory(employeeId: string): Promise<PaymentRecord[]> {
    const normalizedId = utils.normalizeId(employeeId);
    const employeeIdBytes = utils.stringToBytes32(normalizedId);

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

  // ========================================
  // SYSTEM OPERATIONS
  // ========================================

  async updateTimestamp(newTimestamp: number): Promise<void> {
    this.logger?.info({ updateTimestamp: { newTimestamp } });

    await this.deployedContract.callTx.update_timestamp(BigInt(newTimestamp));
  }

  async mintTokens(amount: string): Promise<void> {
    this.logger?.info({ mintTokens: { amount } });
    this.transactions$.next({
      transaction: {
        type: 'mint_tokens',
        amount: utils.parseAmount(amount),
        timestamp: new Date(),
      },
      cancelledTransaction: undefined,
    });

    await this.deployedContract.callTx.mint_tokens(utils.parseAmount(amount));
  }

  // ========================================
  // RECURRING PAYMENT OPERATIONS
  // ========================================

  async createRecurringPayment(
    companyId: string,
    employeeId: string,
    amount: string,
    frequency: bigint,
    startDate: Date,
    endDate: Date | null,
    dayOfWeek: number = 5 // Default to Friday for weekly
  ): Promise<void> {
    this.logger?.info({ createRecurringPayment: { companyId, employeeId, amount, frequency, startDate, endDate } });

    // Get standard calendar configuration based on frequency
    const calendarConfig = getStandardCalendarConfig(frequency, dayOfWeek);

    // Calculate next payment date using contract's calendar utilities
    const nextPaymentDate = calculateNextPaymentDate(startDate, frequency, dayOfWeek);

    const employeeIdBytes = utils.stringToBytes32(employeeId);
    const startTimestamp = toUnixTimestamp(startDate);
    const endTimestamp = endDate ? toUnixTimestamp(endDate) : 0n;
    const nextPaymentTimestamp = toUnixTimestamp(nextPaymentDate);

    await this.deployedContract.callTx.create_recurring_payment(
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

    const idBytes = utils.stringToBytes32(recurringPaymentId);
    await this.deployedContract.callTx.pause_recurring_payment(idBytes);
  }

  async resumeRecurringPayment(recurringPaymentId: string): Promise<void> {
    this.logger?.info({ resumeRecurringPayment: { recurringPaymentId } });

    const idBytes = utils.stringToBytes32(recurringPaymentId);

    // Get the recurring payment to determine frequency and dayOfWeek
    const payment = await this.getRecurringPayment(recurringPaymentId);
    if (!payment) {
      throw new Error('Recurring payment not found');
    }

    // Calculate next payment date based on current time
    const dayOfWeek = payment.frequency === RecurringPaymentFrequency.WEEKLY ? Number(payment.payment_day_of_week) : 5;
    const nextPaymentDate = calculateNextPaymentDate(new Date(), payment.frequency, dayOfWeek);
    const nextPaymentTimestamp = toUnixTimestamp(nextPaymentDate);

    await this.deployedContract.callTx.resume_recurring_payment(idBytes, nextPaymentTimestamp);
  }

  async editRecurringPayment(recurringPaymentId: string, newAmount: string): Promise<void> {
    this.logger?.info({ editRecurringPayment: { recurringPaymentId, newAmount } });

    const idBytes = utils.stringToBytes32(recurringPaymentId);
    await this.deployedContract.callTx.edit_recurring_payment(idBytes, utils.parseAmount(newAmount));
  }

  async processRecurringPayment(recurringPaymentId: string): Promise<void> {
    this.logger?.info({ processRecurringPayment: { recurringPaymentId } });

    const idBytes = utils.stringToBytes32(recurringPaymentId);
    await this.deployedContract.callTx.process_recurring_payment(idBytes);
  }

  async getRecurringPayment(recurringPaymentId: string): Promise<RecurringPayment | null> {
    const normalizedId = utils.normalizeId(recurringPaymentId);
    const idBytes = utils.stringToBytes32(normalizedId);

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
    const normalizedId = utils.normalizeId(employeeId);
    const employeeIdBytes = utils.stringToBytes32(normalizedId);

    const state = await this.providers.publicDataProvider.queryContractState(this.deployedContractAddress);
    if (!state) {
      return null;
    }

    const ledgerState = ledger(state.data);

    // Check if employee has a recurring payment
    if (!ledgerState.recurring_payment_by_employee.member(employeeIdBytes)) {
      return null;
    }

    // Get the recurring payment ID
    const recurringPaymentId = ledgerState.recurring_payment_by_employee.lookup(employeeIdBytes);

    // Get the actual recurring payment
    if (!ledgerState.recurring_payments.member(recurringPaymentId)) {
      return null;
    }

    return ledgerState.recurring_payments.lookup(recurringPaymentId);
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

    await this.deployedContract.callTx.batch_pay_employees(batchEntries);
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
