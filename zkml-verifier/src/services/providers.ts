/**
 * Midnight Provider Configuration
 *
 * This module handles initialization of Midnight providers for the verifier service.
 * Creates a wallet from VERIFIER_SECRET_KEY and uses it to create providers for PayrollAPI.
 */

import { PayrollAPI, type PayrollProviders } from '@zksalaria/payroll-api';
import type { Logger } from 'pino';
import type { Wallet } from '@midnight-ntwrk/wallet-api';
import { type Resource, WalletBuilder } from '@midnight-ntwrk/wallet';
import {
  type BalancedTransaction,
  createBalancedTx,
  type MidnightProvider,
  type PrivateStateProvider,
  type UnbalancedTransaction,
  type WalletProvider,
} from '@midnight-ntwrk/midnight-js-types';
import { type ContractAddress, type SigningKey } from '@midnight-ntwrk/compact-runtime';
import { Transaction as ZswapTransaction } from '@midnight-ntwrk/zswap';
import { indexerPublicDataProvider } from '@midnight-ntwrk/midnight-js-indexer-public-data-provider';
import { NodeZkConfigProvider } from '@midnight-ntwrk/midnight-js-node-zk-config-provider';
import { httpClientProofProvider } from '@midnight-ntwrk/midnight-js-http-client-proof-provider';
import { getLedgerNetworkId, getZswapNetworkId } from '@midnight-ntwrk/midnight-js-network-id';
import { type CoinInfo, Transaction, type TransactionId } from '@midnight-ntwrk/ledger';
import * as Rx from 'rxjs';
import { config } from '../config';

/**
 * Simple in-memory private state provider for the verifier service
 */
function inMemoryPrivateStateProvider<PSI extends string = string, PS = any>(): PrivateStateProvider<PSI, PS> {
  const stateStore = new Map<PSI, PS>();
  const signingKeys = new Map<ContractAddress, SigningKey>();

  return {
    async set(privateStateId: PSI, state: PS): Promise<void> {
      stateStore.set(privateStateId, state);
    },
    async get(privateStateId: PSI): Promise<PS | null> {
      return stateStore.has(privateStateId) ? stateStore.get(privateStateId)! : null;
    },
    async remove(privateStateId: PSI): Promise<void> {
      stateStore.delete(privateStateId);
    },
    async clear(): Promise<void> {
      stateStore.clear();
    },
    async setSigningKey(address: ContractAddress, signingKey: SigningKey): Promise<void> {
      signingKeys.set(address, signingKey);
    },
    async getSigningKey(address: ContractAddress): Promise<SigningKey | null> {
      return signingKeys.has(address) ? signingKeys.get(address)! : null;
    },
    async removeSigningKey(address: ContractAddress): Promise<void> {
      signingKeys.delete(address);
    },
    async clearSigningKeys(): Promise<void> {
      signingKeys.clear();
    },
  };
}

export interface VerifierConfig {
  contractAddress: string;
}

export class ProviderService {
  private api: any = null;
  private wallet: (Wallet & Resource) | null = null;
  private logger: Logger;
  private config: VerifierConfig;

  constructor(logger: Logger, config: VerifierConfig) {
    this.logger = logger;
    this.config = config;
  }

  /**
   * Create wallet and Midnight provider from verifier secret key
   */
  private async createWalletAndMidnightProvider(wallet: Wallet): Promise<WalletProvider & MidnightProvider> {
    const state = await Rx.firstValueFrom(wallet.state());
    return {
      encryptionPublicKey: state.encryptionPublicKey,
      coinPublicKey: state.coinPublicKey,
      balanceTx(tx: UnbalancedTransaction, newCoins: CoinInfo[]): Promise<BalancedTransaction> {
        return wallet
          .balanceTransaction(
            ZswapTransaction.deserialize(tx.serialize(getZswapNetworkId()), getZswapNetworkId()),
            newCoins,
          )
          .then((tx) => wallet.proveTransaction(tx))
          .then((zswapTx) => Transaction.deserialize(zswapTx.serialize(getZswapNetworkId()), getLedgerNetworkId()))
          .then(createBalancedTx);
      },
      submitTx(tx: BalancedTransaction): Promise<TransactionId> {
        return wallet.submitTransaction(tx);
      },
    };
  }

  /**
   * Initialize Midnight providers and PayrollAPI
   */
  async initialize(): Promise<any> {
    if (this.api) {
      this.logger.warn('API already initialized');
      return this.api;
    }

    try {
      this.logger.info({
        action: 'initialize_payroll_api',
        contract_address: this.config.contractAddress,
      });

      // Create wallet from VERIFIER_SEED
      if (!config.verifierSeed) {
        throw new Error('VERIFIER_SEED not configured');
      }

      this.logger.info('Creating wallet from VERIFIER_SEED...');

      this.wallet = await WalletBuilder.buildFromSeed(
        config.midnight.indexer,
        config.midnight.indexerWS,
        config.midnight.proofServer,
        config.midnight.node,
        config.verifierSeed,
        getZswapNetworkId(),
        'warn'
      );

      // Check wallet state
      this.logger.info('Checking wallet state...');
      const state = await Rx.firstValueFrom(this.wallet.state());
      if (state && (state as any).balances) {
        this.logger.info({
          balance: (state as any).balances.unshieldedBalance?.toString() || '0'
        }, 'Wallet state retrieved');
      } else {
        this.logger.info('Wallet created (state structure may vary without blockchain connection)');
      }

      // Create providers
      const walletAndMidnightProvider = await this.createWalletAndMidnightProvider(this.wallet);
      const providers: PayrollProviders = {
        privateStateProvider: inMemoryPrivateStateProvider(),
        publicDataProvider: indexerPublicDataProvider(
          config.midnight.indexer,
          config.midnight.indexerWS
        ),
        zkConfigProvider: new NodeZkConfigProvider(
          config.zkConfigPath
        ),
        proofProvider: httpClientProofProvider(
          config.midnight.proofServer
        ),
        walletProvider: walletAndMidnightProvider,
        midnightProvider: walletAndMidnightProvider,
      };

      // Connect to PayrollAPI with proper providers
      this.api = await PayrollAPI.connect(
        providers,
        this.config.contractAddress as any,
        'zkml-verifier-service',
        this.logger
      );

      this.logger.info('✅ PayrollAPI initialized successfully');
      return this.api;
    } catch (error) {
      this.logger.error({ error }, '❌ Failed to initialize PayrollAPI');
      throw error;
    }
  }

  /**
   * Get initialized API
   */
  getAPI(): any {
    if (!this.api) {
      throw new Error('API not initialized. Call initialize() first.');
    }
    return this.api;
  }

  /**
   * Shutdown and cleanup resources
   */
  async shutdown(): Promise<void> {
    if (this.wallet) {
      await this.wallet.close();
      this.wallet = null;
    }
    this.api = null;
    this.logger.info('Provider service shut down');
  }
}

/**
 * Load verifier configuration from environment variables
 */
export function loadVerifierConfig(contractAddress: string): VerifierConfig {
  return {
    contractAddress,
  };
}
