#!/usr/bin/env node

/**
 * Wallet Generation Script for zkSalaria
 *
 * Generates a new wallet with a random seed and outputs the secret key
 * for use as a witness in Compact contract authentication.
 *
 * Usage:
 *   node scripts/generate-wallet.js
 *   node scripts/generate-wallet.js testnet
 */

import { createHash, randomBytes } from 'crypto';
import { WalletBuilder } from '@midnight-ntwrk/wallet';
import { getZswapNetworkId } from '@midnight-ntwrk/midnight-js-network-id';
import { firstValueFrom } from 'rxjs';

// Network configuration
const CONFIGS = {
  local: {
    indexerUrl: 'http://localhost:8088/api/v1/graphql',
    indexerWsUrl: 'ws://localhost:8088/api/v1/graphql/ws',
    provingServerUrl: 'http://localhost:6300',
    nodeUrl: 'http://127.0.0.1:8080',
  },
  testnet: {
    indexerUrl: 'https://indexer.testnet-02.midnight.network/api/v1/graphql',
    indexerWsUrl: 'wss://indexer.testnet-02.midnight.network/api/v1/graphql/ws',
    provingServerUrl: 'https://lace-dev.proof-pub.stg.midnight.tools',
    nodeUrl: 'https://rpc.testnet-02.midnight.network',
  },
};

function generateRandomSeed() {
  return randomBytes(32);
}

function bytesToHex(bytes) {
  return Buffer.from(bytes).toString('hex');
}

function deriveSecretKey(seed, domainSeparator = 'zkSalaria:auth:sk') {
  // Create a deterministic secret key from the seed using domain separation
  const hash = createHash('sha256');
  hash.update(domainSeparator);
  hash.update(seed);
  return hash.digest('hex');
}

async function generateWallet() {
  const environment = process.argv[2] || 'local';

  if (!['local', 'testnet'].includes(environment)) {
    console.error('Invalid environment. Use "local" or "testnet"');
    process.exit(1);
  }

  const config = CONFIGS[environment];

  console.log('═══════════════════════════════════════════════════════');
  console.log('  zkSalaria Wallet Generator');
  console.log('═══════════════════════════════════════════════════════');
  console.log(`Environment: ${environment}`);
  console.log('───────────────────────────────────────────────────────\n');

  try {
    // Generate random seed
    const seed = generateRandomSeed();
    const seedHex = bytesToHex(seed);

    console.log('✅ Generated new wallet seed\n');
    console.log('SEED (32 bytes):');
    console.log(seedHex);
    console.log('');

    // Derive secret key for Compact contract authentication
    const secretKey = deriveSecretKey(seed);

    console.log('SECRET KEY for Compact Witness (32 bytes):');
    console.log(secretKey);
    console.log('');

    // Build wallet to get address
    console.log('Building wallet to generate address...');
    const wallet = await WalletBuilder.buildFromSeed(
      config.indexerUrl,
      config.indexerWsUrl,
      config.provingServerUrl,
      config.nodeUrl,
      seedHex,
      getZswapNetworkId(),
      'warn'
    );

    wallet.start();
    const state = await firstValueFrom(wallet.state());
    const address = state.address;

    console.log('✅ Wallet created successfully\n');
    console.log('WALLET ADDRESS:');
    console.log(address);
    console.log('');

    // Clean up wallet
    await wallet.close();

    console.log('═══════════════════════════════════════════════════════');
    console.log('  Usage in Compact Contract');
    console.log('═══════════════════════════════════════════════════════');
    console.log('');
    console.log('1. In your contract witness, use:');
    console.log('   witness secretKey(): Bytes<32>;');
    console.log('');
    console.log('2. When calling the circuit, provide the secret key:');
    console.log('   const witness = {');
    console.log(`     secretKey: () => "${secretKey}"`);
    console.log('   };');
    console.log('');
    console.log('3. The contract can verify ownership with:');
    console.log('   circuit publicKey(sk: Bytes<32>): Bytes<32> {');
    console.log('     return persistentHash<Vector<2, Bytes<32>>>([');
    console.log('       pad(32, "zkSalaria:auth:sk"),');
    console.log('       sk');
    console.log('     ]);');
    console.log('   }');
    console.log('');
    console.log('   assert(organizer == publicKey(secretKey()), "not authorized");');
    console.log('');
    console.log('═══════════════════════════════════════════════════════');
    console.log('  IMPORTANT: Save These Values!');
    console.log('═══════════════════════════════════════════════════════');
    console.log('');
    console.log('⚠️  SEED: Store securely - needed to restore wallet');
    console.log('⚠️  SECRET KEY: Keep private - proves wallet ownership');
    console.log('⚠️  ADDRESS: Public - use to receive funds');
    console.log('');
    console.log('Recommended: Save to environment variables or secure vault');
    console.log('');
    console.log('Example .env file:');
    console.log(`WALLET_SEED="${seedHex}"`);
    console.log(`WALLET_SECRET_KEY="${secretKey}"`);
    console.log(`WALLET_ADDRESS="${address}"`);
    console.log('');
    console.log('═══════════════════════════════════════════════════════');
    console.log('  Restoring Wallet from Seed');
    console.log('═══════════════════════════════════════════════════════');
    console.log('');
    console.log('To restore this wallet in your application:');
    console.log('');
    console.log('  import { WalletBuilder } from "@midnight-ntwrk/wallet";');
    console.log('  import { getZswapNetworkId } from "@midnight-ntwrk/midnight-js-network-id";');
    console.log('  import { firstValueFrom } from "rxjs";');
    console.log('');
    console.log('  const wallet = await WalletBuilder.buildFromSeed(');
    console.log(`    "${config.indexerUrl}",`);
    console.log(`    "${config.indexerWsUrl}",`);
    console.log(`    "${config.provingServerUrl}",`);
    console.log(`    "${config.nodeUrl}",`);
    console.log(`    "${seedHex}",`);
    console.log('    getZswapNetworkId(),');
    console.log('    "warn"');
    console.log('  );');
    console.log('  wallet.start();');
    console.log('  const state = await firstValueFrom(wallet.state());');
    console.log(`  console.log("Address:", state.address); // ${address}`);
    console.log('');

  } catch (error) {
    console.error('❌ Error generating wallet:', error);
    process.exit(1);
  }
}

generateWallet().catch(console.error);
