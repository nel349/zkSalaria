/**
 * Centralized Configuration for ZKML Verifier Service
 *
 * All environment variables and defaults are defined here.
 * NEVER use process.env directly in other files - import from this module.
 */

export interface VerifierConfig {
  // Server
  port: number;
  nodeEnv: string;
  logLevel: string;

  // CORS
  allowedOrigins: string[];

  // EZKL Model Paths
  vkPath: string;
  settingsPath: string;

  // Verifier Wallet
  verifierSeed: string;

  // Blockchain
  enableBlockchainSubmission: boolean;

  // Midnight Services
  midnight: {
    indexer: string;
    indexerWS: string;
    node: string;
    proofServer: string;
  };

  // Contract
  zkConfigPath: string;
}

/**
 * Load and validate configuration from environment variables
 */
export function loadConfig(): VerifierConfig {
  // Midnight Indexer: Default matches StandaloneConfig
  const indexer = process.env.MIDNIGHT_INDEXER || 'http://127.0.0.1:8088/api/v1/graphql';
  const indexerWS = process.env.MIDNIGHT_INDEXER_WS || 'ws://127.0.0.1:8088/api/v1/graphql/ws';

  return {
    // Server Configuration
    port: parseInt(process.env.PORT || '3002', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
    logLevel: process.env.LOG_LEVEL || 'info',

    // CORS
    allowedOrigins: (process.env.ALLOWED_ORIGINS || 'http://localhost:3000,http://localhost:5173')
      .split(',')
      .map(o => o.trim()),

    // EZKL Model Paths (relative to zkml-verifier directory)
    vkPath: process.env.VK_PATH || '../zkml/payroll/vk.key',
    settingsPath: process.env.SETTINGS_PATH || '../zkml/payroll/settings.json',

    // Verifier Wallet Seed
    verifierSeed: process.env.VERIFIER_SEED || '',

    // Blockchain Submission
    enableBlockchainSubmission: process.env.ENABLE_BLOCKCHAIN_SUBMISSION === 'true',

    // Midnight Services - ALL DEFAULTS CENTRALIZED HERE
    // Defaults match StandaloneConfig from the system
    midnight: {
      indexer,
      indexerWS,
      node: process.env.MIDNIGHT_NODE || 'http://127.0.0.1:9944',
      proofServer: process.env.MIDNIGHT_PROOF_SERVER || 'http://127.0.0.1:6300',
    },

    // Contract Configuration
    zkConfigPath: process.env.ZK_CONFIG_PATH || '../payroll-contract/target/contract/payroll-contract-zk.dat',
  };
}

/**
 * Validate configuration
 * Throws error if required config is missing
 */
export function validateConfig(config: VerifierConfig): void {
  if (config.enableBlockchainSubmission && !config.verifierSeed) {
    throw new Error('VERIFIER_SEED is required when ENABLE_BLOCKCHAIN_SUBMISSION=true');
  }

  // Validate port is valid
  if (isNaN(config.port) || config.port < 1 || config.port > 65535) {
    throw new Error(`Invalid PORT: ${config.port}`);
  }
}

// Export singleton instance
export const config = loadConfig();
validateConfig(config);
