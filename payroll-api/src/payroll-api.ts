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
  registerCompany(companyId: string, companyName: string): Promise<void>;
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
          totalCompanies: ledgerState.total_companies,
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
   */
  static async deploy(
    providers: PayrollProviders,
    logger: Logger,
  ): Promise<ContractAddress> {
    logger.info({ deployPayrollContract: {} });

    // Retry logic for transient failures
    const maxAttempts = 5;
    let lastError: unknown;
    let deployedPayrollContract: DeployedPayrollContract | undefined;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        deployedPayrollContract = await deployContract(providers, {
          privateStateId: 'deploy' as AccountId,
          contract: payrollContract,
          initialPrivateState: createPayrollPrivateState(),
          args: [utils.randomBytes(32)],
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

  async registerCompany(companyId: string, companyName: string): Promise<void> {
    this.logger?.info({ registerCompany: { companyId, companyName } });
    this.transactions$.next({
      transaction: {
        type: 'register_company',
        timestamp: new Date(),
        companyId,
        companyName,
      },
      cancelledTransaction: undefined,
    });

    const companyIdBytes = utils.stringToBytes32(companyId);
    const companyNameBytes = utils.stringToBytes64(companyName);

    await this.deployedContract.callTx.register_company(companyIdBytes, companyNameBytes);
  }

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

    const companyIdBytes = utils.stringToBytes32(companyId);

    await this.deployedContract.callTx.deposit_company_funds(companyIdBytes, utils.parseAmount(amount));
  }

  async getCompanyInfo(companyId: string): Promise<CompanyInfo> {
    const normalizedId = utils.normalizeId(companyId);
    const companyIdBytes = utils.stringToBytes32(normalizedId);

    const state = await this.providers.publicDataProvider.queryContractState(this.deployedContractAddress);
    if (!state) {
      return { companyId: normalizedId, exists: false };
    }

    const ledgerState = ledger(state.data);
    const exists = ledgerState.company_accounts.member(companyIdBytes);

    // Note: Balance is encrypted - would need decryption key to read actual value
    // For now, just return whether company exists
    return {
      companyId: normalizedId,
      exists,
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

    const companyIdBytes = utils.stringToBytes32(companyId);
    const employeeIdBytes = utils.stringToBytes32(employeeId);

    await this.deployedContract.callTx.add_employee(companyIdBytes, employeeIdBytes);
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
      // Count non-zero payments (empty records have amount = 0)
      paymentHistoryCount = history.filter((record: PaymentRecord) => record.amount > 0n).length;
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

    const companyIdBytes = utils.stringToBytes32(companyId);
    const employeeIdBytes = utils.stringToBytes32(employeeId);

    await this.deployedContract.callTx.pay_employee(companyIdBytes, employeeIdBytes, utils.parseAmount(amount));
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
    // Filter out empty records (amount = 0)
    return history.filter((record: PaymentRecord) => record.amount > 0n);
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
