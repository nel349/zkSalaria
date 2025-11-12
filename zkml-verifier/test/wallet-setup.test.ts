/**
 * Simple test to verify wallet creation from VERIFIER_SEED
 */
import { describe, it, expect } from 'vitest';
import { WalletBuilder } from '@midnight-ntwrk/wallet';
import { getZswapNetworkId } from '@midnight-ntwrk/midnight-js-network-id';
import * as Rx from 'rxjs';
import pino from 'pino';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

describe('Wallet Setup Test', () => {
  const logger = pino({ level: 'info' });

  it('should create wallet from VERIFIER_SEED', async () => {
    logger.info('Testing wallet creation from VERIFIER_SEED...');

    // Verify required env vars are set
    expect(process.env.VERIFIER_SEED).toBeDefined();
    expect(process.env.MIDNIGHT_INDEXER).toBeDefined();
    expect(process.env.MIDNIGHT_NODE).toBeDefined();

    const seed = process.env.VERIFIER_SEED!;
    const indexer = process.env.MIDNIGHT_INDEXER || 'http://localhost:8080';
    const indexerWS = indexer.replace('http:', 'ws:');
    const proofServer = process.env.MIDNIGHT_PROOF_SERVER || 'http://localhost:6565';
    const node = process.env.MIDNIGHT_NODE || 'http://localhost:8082';

    // Create wallet from VERIFIER_SEED
    const wallet = await WalletBuilder.buildFromSeed(
      indexer,
      indexerWS,
      proofServer,
      node,
      seed,
      getZswapNetworkId(),
      'warn'
    );

    // Verify wallet was created
    expect(wallet).toBeDefined();

    // Get wallet state
    const state = await Rx.firstValueFrom(wallet.state());
    expect(state).toBeDefined();
    expect(state.coinPublicKey).toBeDefined();
    expect(state.encryptionPublicKey).toBeDefined();
    expect(state.address).toBeDefined();

    logger.info({
      address: state.address,
      coinPublicKey: state.coinPublicKey,
      encryptionPublicKey: state.encryptionPublicKey
    }, '✅ Wallet created successfully!');

    // Verify the address matches the expected one from generator
    const expectedAddressSuffix = 'mlhgv89xcc';
    expect(state.address.endsWith(expectedAddressSuffix),
      `Address should end with ${expectedAddressSuffix}, got: ${state.address}`
    ).toBe(true);

    // Cleanup
    await wallet.close();
  }, 120000);
});
