/**
 * Contract Service
 *
 * Handles interaction with the Payroll contract via the API
 * The verifier service uses this to submit income proofs to the blockchain
 */

import { PayrollAPI } from '@zksalaria/payroll-api';
import type { DeployedPayrollAPI } from '@zksalaria/payroll-api';
import { loadVerifierSecretFromEnv } from '@zksalaria/payroll-contract';
import type { Logger } from 'pino';

export class ContractService {
  private api: DeployedPayrollAPI | null = null;
  private contractAddress: string;
  private logger: Logger;
  private isInitialized: boolean = false;

  constructor(contractAddress: string, logger: Logger) {
    this.contractAddress = contractAddress;
    this.logger = logger;
  }

  /**
   * Initialize connection to the payroll contract
   * This must be called once on service startup
   */
  async initialize(providers: any): Promise<void> {
    if (this.isInitialized) {
      this.logger.warn('Contract service already initialized');
      return;
    }

    try {
      this.logger.info({
        action: 'initialize_contract_service',
        contract_address: this.contractAddress
      });

      // Connect to the deployed contract
      // The API will automatically load VERIFIER_SECRET_KEY from environment
      this.api = await PayrollAPI.connect(
        providers,
        this.contractAddress as any,
        'zkml-verifier-service',
        this.logger
      );

      this.isInitialized = true;
      this.logger.info('✅ Contract service initialized successfully');
    } catch (error) {
      this.logger.error({ error }, '❌ Failed to initialize contract service');
      throw error;
    }
  }

  /**
   * Submit an income proof to the contract
   * This proves that the verifier has validated the employee's income claim
   *
   * @param employeeId - Employee wallet address
   * @param proofType - Type of proof (INCOME_ABOVE_THRESHOLD, INCOME_RANGE, etc.)
   * @param thresholdMin - Minimum threshold value
   * @param thresholdMax - Maximum threshold value (0 for single threshold)
   * @param txids - Transaction IDs for the payment history
   * @param historyCommitment - Hash commitment of the payment history
   * @param attestationHash - Hash commitment from ZKML verification
   * @param timestamp - When the attestation was created
   * @param expiresIn - How long the proof is valid (in seconds)
   */
  async submitIncomeProof(params: {
    employeeId: string;
    proofType: bigint;
    thresholdMin: string;
    thresholdMax: string;
    txids: string[];
    historyCommitment: string;
    attestationHash: string;
    timestamp: bigint;
    expiresIn: number;
  }): Promise<{ success: boolean; error?: string }> {
    if (!this.isInitialized || !this.api) {
      return {
        success: false,
        error: 'Contract service not initialized'
      };
    }

    try {
      this.logger.info({
        action: 'submit_income_proof',
        employee_id: params.employeeId,
        proof_type: params.proofType.toString(),
        threshold_min: params.thresholdMin,
        threshold_max: params.thresholdMax
      });

      // Call the API to submit the proof
      // The API will use the witness (VERIFIER_SECRET_KEY) to prove ownership
      const result = await this.api.submitIncomeProof(
        params.employeeId,
        params.proofType,
        params.thresholdMin,
        params.thresholdMax,
        params.txids,
        params.historyCommitment,
        params.attestationHash,
        params.timestamp,
        params.expiresIn
      );

      this.logger.info({ success: result }, '✅ Income proof submitted to contract');

      return { success: result };
    } catch (error) {
      this.logger.error({ error }, '❌ Failed to submit income proof to contract');
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get the verifier's public key
   * This is derived from the VERIFIER_SECRET_KEY
   */
  getVerifierPublicKey(): string {
    try {
      const secret = loadVerifierSecretFromEnv();
      // In production, this would compute the actual hash that matches the contract
      return Buffer.from(secret).toString('hex').substring(0, 64);
    } catch (error) {
      this.logger.error({ error }, 'Failed to load verifier secret');
      throw error;
    }
  }
}
