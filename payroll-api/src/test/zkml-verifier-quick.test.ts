/**
 * Quick ZKML Verifier Integration Test
 *
 * Tests only the verifier service integration without full E2E setup.
 * This test focuses on:
 * 1. ZKML proof generation (annualization)
 * 2. Verifier service initialization (NetworkId, PayrollAPI.connect)
 * 3. Blockchain submission
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { StandaloneConfig, type Config } from './config.js';
import { PayrollAPI, type PayrollProviders } from '../payroll-api.js';
import { type Wallet } from '@midnight-ntwrk/wallet-api';
import { type Resource, WalletBuilder } from '@midnight-ntwrk/wallet';
import { indexerPublicDataProvider } from '@midnight-ntwrk/midnight-js-indexer-public-data-provider';
import { NodeZkConfigProvider } from '@midnight-ntwrk/midnight-js-node-zk-config-provider';
import { httpClientProofProvider } from '@midnight-ntwrk/midnight-js-http-client-proof-provider';
import { getZswapNetworkId } from '@midnight-ntwrk/midnight-js-network-id';
import { nativeToken } from '@midnight-ntwrk/ledger';
import pino from 'pino';
import * as Rx from 'rxjs';
import { GENESIS_MINT_WALLET_SEED } from './commons.js';
import { computeVerifierPubkeyFromString } from '@zksalaria/payroll-contract';
import {
  type BalancedTransaction,
  createBalancedTx,
  type MidnightProvider,
  type PrivateStateProvider,
  type UnbalancedTransaction,
  type WalletProvider,
} from '@midnight-ntwrk/midnight-js-types';
import { type CoinInfo, Transaction, type TransactionId } from '@midnight-ntwrk/ledger';
import { Transaction as ZswapTransaction } from '@midnight-ntwrk/zswap';
import { getLedgerNetworkId } from '@midnight-ntwrk/midnight-js-network-id';
import { type ContractAddress, type SigningKey } from '@midnight-ntwrk/compact-runtime';

const logger = pino({
  level: 'info',
  transport: {
    target: 'pino-pretty',
    options: { colorize: true }
  }
});

// Simple in-memory private state provider
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

async function createWalletAndMidnightProvider(wallet: Wallet): Promise<WalletProvider & MidnightProvider> {
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

// Helper function to build wallet and wait for funds
async function buildWalletAndWaitForFunds(
  config: Config,
  seed: string,
): Promise<Wallet & Resource> {
  const wallet = await WalletBuilder.buildFromSeed(
    config.indexer,
    config.indexerWS,
    config.proofServer,
    config.node,
    seed,
    getZswapNetworkId(),
    'warn',
  );

  wallet.start();
  logger.info('Wallet started, syncing with indexer...');

  const state = await Rx.firstValueFrom(wallet.state());
  logger.info({ event: 'wallet_created', address: state.address });

  let balance = state.balances[nativeToken()];
  if (balance === undefined || balance === 0n) {
    logger.info('Waiting for wallet funds (this may take 10-30 seconds)...');
    balance = await Rx.firstValueFrom(
      wallet.state().pipe(
        Rx.throttleTime(2_000), // Check every 2 seconds
        Rx.map((s) => s.balances[nativeToken()] ?? 0n),
        Rx.filter((balance) => balance > 0n),
        Rx.timeout(60000), // 60 second timeout
      ),
    );
  }
  logger.info({ event: 'wallet_funded', balance: balance?.toString() });

  return wallet;
}

describe('ZKML Verifier Quick Integration Test', () => {
  const config = new StandaloneConfig();
  let wallet: (Wallet & Resource) | null = null;
  let providers: PayrollProviders | null = null;
  let contractAddress: string | null = null;

  // This is the VERIFIER_SEED from zkml-verifier/.env - the verifier service uses this
  const VERIFIER_SEED = 'cea7f2f583a968169bcbf3cdac958160db7de83643d9c94c346e37779d6232b3';

  beforeAll(async () => {
    logger.info('='.repeat(60));
    logger.info('ZKML Verifier Quick Test - Setup');
    logger.info('='.repeat(60));

    // Build wallet with proper fund-waiting (for deployment)
    wallet = await buildWalletAndWaitForFunds(config, GENESIS_MINT_WALLET_SEED);

    const walletAndMidnightProvider = await createWalletAndMidnightProvider(wallet);
    providers = {
      privateStateProvider: inMemoryPrivateStateProvider(),
      publicDataProvider: indexerPublicDataProvider(config.indexer, config.indexerWS),
      zkConfigProvider: new NodeZkConfigProvider(config.payrollZkConfigPath),
      proofProvider: httpClientProofProvider(config.proofServer),
      walletProvider: walletAndMidnightProvider,
      midnightProvider: walletAndMidnightProvider,
    };

    const companyId = `quick-test-company-${Date.now()}`;
    const companyName = 'Quick Test Corp';

    logger.info('Deploying contract...');
    contractAddress = await PayrollAPI.deploy(providers, companyId, companyName, logger);
    logger.info(`✅ Contract deployed at: ${contractAddress}`);

    // Derive the verifier pubkey from VERIFIER_SEED using the same hash function the contract uses
    logger.info('Deriving verifier pubkey from VERIFIER_SEED...');
    const verifierPubkey = '0x' + computeVerifierPubkeyFromString(VERIFIER_SEED);
    logger.info({ verifierPubkey }, 'Verifier pubkey derived (matches witness derivation)');

    // Connect to API and register the ACTUAL verifier pubkey
    const api = await PayrollAPI.connect(providers, contractAddress, 'quick-test-user', logger);

    logger.info('Registering trusted verifier (matches zkml-verifier service)...');
    await api.registerTrustedVerifier(verifierPubkey);
    logger.info('✅ Verifier registered');
    logger.info('='.repeat(60));
  }, 180000); // 3 min timeout for setup (includes wallet funding wait)

  afterAll(async () => {
    if (wallet) {
      logger.info('Closing wallet...');
      await wallet.close();
    }
  });

  it('should call zkml-verifier service and test PayrollAPI initialization', async () => {
    if (!contractAddress) {
      throw new Error('Contract not deployed');
    }

    logger.info('Testing verifier service call...');

    const employeeId = 'test-employee-quick';
    const payments = [1.0, 1.0, 1.0, 1.0, 1.0, 1.0]; // 6 months @ $10k = $60k → annualized = $120k
    const thresholdMin = 8.0;  // $80k yearly (normalized)
    const thresholdMax = 12.0; // $120k yearly (normalized)

    // Call verifier service
    const response = await fetch('http://localhost:3002/api/zkml/generate-proof', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        proof_type: 2, // INCOME_RANGE
        payments,
        threshold_min: thresholdMin,
        threshold_max: thresholdMax,
        employee_id: employeeId,
        txids: ['tx1', 'tx2', 'tx3', 'tx4', 'tx5', 'tx6'],
        history_commitment: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        contract_address: contractAddress, // Enables blockchain submission
      }),
    });

    expect(response.ok).toBe(true);

    const result = await response.json() as {
      success: boolean;
      proof_json?: string;
      attestation?: {
        attestation_hash: string;
        timestamp: number;
      };
      error?: string;
      message?: string;
    };
    logger.info({ result }, 'Verifier service response');

    // Verify response structure
    expect(result.success).toBe(true);
    expect(result.proof_json).toBeDefined();
    expect(result.attestation).toBeDefined();
    expect(result.attestation?.attestation_hash).toBeDefined();

    logger.info('✅ Verifier service successfully generated proof and submitted to blockchain');

    // Verify the proof was stored on-chain by connecting to API
    if (!providers) {
      throw new Error('Providers not initialized');
    }

    logger.info('Verifying proof was stored on blockchain...');
    const api = await PayrollAPI.connect(providers, contractAddress, 'quick-test-verifier', logger);
    const storedProof = await api.verifyIncomeProof(
      employeeId,
      2n, // INCOME_RANGE (bigint)
      '8.0' // Required threshold (string)
    );

    expect(storedProof).toBe(true);
    logger.info('✅ Proof verified on blockchain');
  }, 60000); // 1 min timeout
});
