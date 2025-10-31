/**
 * Test Commons - Following bank-api test pattern
 * Provides Docker Compose test environment setup for integration tests
 */

import { type PayrollProviders, type AccountId, type PayrollCircuitKeys } from '../common-types.js';
import { type ContractAddress } from '@midnight-ntwrk/compact-runtime';
import { randomBytes } from '../utils/index.js';

// Test wallet seed (deterministic for reproducible tests)
export const TEST_WALLET_SEED = 'test test test test test test test test test test test junk';

// Docker network configuration
export const INDEXER_WS_URL = process.env.INDEXER_WS_URL ?? 'ws://localhost:8088';
export const NODE_GRPC_URL = process.env.NODE_GRPC_URL ?? 'http://localhost:50051';
export const PROOF_SERVER_URL = process.env.PROOF_SERVER_URL ?? 'http://localhost:6300';

/**
 * Test Environment Configuration
 */
export interface TestConfig {
  indexerWsUrl: string;
  nodeGrpcUrl: string;
  proofServerUrl: string;
  walletSeed: string;
}

export const defaultTestConfig: TestConfig = {
  indexerWsUrl: INDEXER_WS_URL,
  nodeGrpcUrl: NODE_GRPC_URL,
  proofServerUrl: PROOF_SERVER_URL,
  walletSeed: TEST_WALLET_SEED,
};

/**
 * Test Environment
 * Manages Docker Compose lifecycle and provider initialization
 */
export class TestEnvironment {
  private providers?: PayrollProviders;
  private config: TestConfig;

  constructor(config: TestConfig = defaultTestConfig) {
    this.config = config;
  }

  /**
   * Initialize test environment
   * - Start Docker Compose services if needed
   * - Create wallet from seed
   * - Initialize providers
   */
  async start(): Promise<void> {
    // TODO: Add Docker Compose startup logic
    // For now, assume services are already running

    // Initialize providers
    this.providers = await this.createProviders();
  }

  /**
   * Clean up test environment
   * - Stop Docker Compose services
   * - Close provider connections
   */
  async stop(): Promise<void> {
    // TODO: Add Docker Compose shutdown logic
    // Close WebSocket connections
    if (this.providers) {
      // Clean up providers if they have cleanup methods
    }
  }

  /**
   * Get initialized providers
   */
  getProviders(): PayrollProviders {
    if (!this.providers) {
      throw new Error('Test environment not started. Call start() first.');
    }
    return this.providers;
  }

  /**
   * Create a new wallet account ID
   */
  createAccountId(): AccountId {
    // Generate random account ID for testing
    const randomId = randomBytes(16);
    return Buffer.from(randomId).toString('hex');
  }

  /**
   * Create providers for the test environment
   */
  private async createProviders(): Promise<PayrollProviders> {
    // TODO: Implement provider creation
    // This would involve:
    // 1. Creating wallet from seed
    // 2. Initializing DAppConnectorAPI
    // 3. Creating publicDataProvider, privateStateProvider, proofProvider, zkConfigProvider

    throw new Error('Provider creation not yet implemented. Requires Midnight SDK integration.');
  }
}

/**
 * Helper: Wait for contract deployment
 */
export async function waitForDeployment(
  providers: PayrollProviders,
  contractAddress: ContractAddress,
  timeoutMs: number = 30000,
): Promise<void> {
  const startTime = Date.now();

  while (Date.now() - startTime < timeoutMs) {
    try {
      const state = await providers.publicDataProvider.queryContractState(contractAddress);
      if (state) {
        return; // Contract deployed and state available
      }
    } catch (err) {
      // Contract not yet deployed, continue waiting
    }

    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  throw new Error(`Contract deployment timeout after ${timeoutMs}ms`);
}

/**
 * Helper: Create test logger (silent by default)
 */
export function createTestLogger(): any {
  return {
    level: 'silent',
    info: () => {},
    warn: () => {},
    error: () => {},
    debug: () => {},
    fatal: () => {},
    trace: () => {},
    silent: () => {},
    child: () => createTestLogger(),
  };
}
