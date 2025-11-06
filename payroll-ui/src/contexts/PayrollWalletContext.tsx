import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { levelPrivateStateProvider } from '@midnight-ntwrk/midnight-js-level-private-state-provider';
import { indexerPublicDataProvider } from '@midnight-ntwrk/midnight-js-indexer-public-data-provider';
import { FetchZkConfigProvider } from '@midnight-ntwrk/midnight-js-fetch-zk-config-provider';
import { httpClientProofProvider } from '@midnight-ntwrk/midnight-js-http-client-proof-provider';
import type { PayrollProviders, PayrollCircuitKeys } from '@zksalaria/payroll-api';
import type { PayrollPrivateState } from '@zksalaria/payroll-contract';
import type { PrivateStateProvider } from '@midnight-ntwrk/midnight-js-types/dist/private-state-provider';
import type { PublicDataProvider } from '@midnight-ntwrk/midnight-js-types/dist/public-data-provider';
import type { ProofProvider } from '@midnight-ntwrk/midnight-js-types/dist/proof-provider';
import type { ZKConfigProvider } from '@midnight-ntwrk/midnight-js-types/dist/zk-config-provider';
import type { WalletProvider } from '@midnight-ntwrk/midnight-js-types/dist/wallet-provider';
import type { MidnightProvider } from '@midnight-ntwrk/midnight-js-types/dist/midnight-provider';
import { connectToWallet } from '../utils/connectToWallet';
import { Transaction as ZswapTransaction } from '@midnight-ntwrk/zswap';
import { Transaction, type CoinInfo, type TransactionId } from '@midnight-ntwrk/ledger';
import { createBalancedTx, type BalancedTransaction, type UnbalancedTransaction } from '@midnight-ntwrk/midnight-js-types';
import { getLedgerNetworkId, getZswapNetworkId } from '@midnight-ntwrk/midnight-js-network-id';

type AccountId = string;

interface PayrollWalletState {
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  walletAddress?: string;
  providers: PayrollProviders;
  connect: () => Promise<void>;
  disconnect: () => void;
}

const PayrollWalletContext = createContext<PayrollWalletState | null>(null);

export const usePayrollWallet = (): PayrollWalletState => {
  const context = useContext(PayrollWalletContext);
  if (!context) {
    throw new Error('usePayrollWallet must be used within PayrollWalletProvider');
  }
  return context;
};

// Configuration - these should come from env variables in production
const config = {
  INDEXER_URI: import.meta.env.VITE_INDEXER_URI || 'https://indexer.testnet.midnight.network',
  INDEXER_WS_URI: import.meta.env.VITE_INDEXER_WS_URI || 'wss://indexer.testnet.midnight.network',
  PROOF_SERVER_URL: import.meta.env.VITE_PROOF_SERVER_URL || 'http://127.0.0.1:6300',
};

// Proof client using Midnight SDK
const proofClient = (uri: string): ProofProvider<PayrollCircuitKeys> => {
  console.log(`[ProofClient] Initializing proof provider at ${uri}`);
  return httpClientProofProvider(uri);
};

export const PayrollWalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Providers (readonly baseline; connect Lace later to replace wallet/midnight providers)
  const privateStateProvider: PrivateStateProvider<AccountId, PayrollPrivateState> = useMemo(
    () => levelPrivateStateProvider({ privateStateStoreName: 'payroll-private-state' }),
    [],
  );
  const publicDataProvider: PublicDataProvider = useMemo(
    () => indexerPublicDataProvider(config.INDEXER_URI, config.INDEXER_WS_URI),
    [config.INDEXER_URI, config.INDEXER_WS_URI],
  );
  const zkConfigProvider: ZKConfigProvider<PayrollCircuitKeys> = useMemo(
    () => new FetchZkConfigProvider(window.location.origin, fetch.bind(window)),
    [],
  );

  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [walletAddress, setWalletAddress] = useState<string | undefined>(undefined);
  const [walletAPI, setWalletAPI] = useState<any>(null);

  const proofProvider: ProofProvider<PayrollCircuitKeys> = useMemo(() => {
    // Priority 1: Use proof server from Lace wallet (best CORS compatibility)
    if (walletAPI?.uris?.proverServerUri) {
      console.log(`[ProofProvider] Using Lace wallet proof server: ${walletAPI.uris.proverServerUri}`);
      return proofClient(walletAPI.uris.proverServerUri);
    }

    // Priority 2: Use configured proof server from config
    if (config.PROOF_SERVER_URL) {
      console.log(`[ProofProvider] Using configured proof server: ${config.PROOF_SERVER_URL}`);
      return proofClient(config.PROOF_SERVER_URL);
    }

    // Priority 3: Fallback to localhost
    console.log(`[ProofProvider] Using localhost fallback proof server`);
    return proofClient('http://127.0.0.1:6300');
  }, [walletAPI?.uris?.proverServerUri]);

  const [walletProvider, setWalletProvider] = useState<WalletProvider>({
    coinPublicKey: '',
    encryptionPublicKey: '',
    balanceTx: async () => Promise.reject(new Error('Wallet not connected')),
  });

  const [midnightProvider, setMidnightProvider] = useState<MidnightProvider>({
    submitTx: async () => Promise.reject(new Error('Wallet not connected')),
  });

  const connect = useMemo(
    () => async () => {
      try {
        setIsConnecting(true);
        setError(null);

        const { wallet, uris } = await connectToWallet();
        const state = await wallet.state();

        // Store wallet API with URIs for proof provider
        setWalletAPI({ wallet, uris });
        console.log(`[WalletAPI] Connected with URIs:`, uris);

        // Set wallet address (short format for display)
        const address = state.coinPublicKey;
        setWalletAddress(address);

        setWalletProvider({
          coinPublicKey: state.coinPublicKey,
          encryptionPublicKey: state.encryptionPublicKey,
          balanceTx(tx: UnbalancedTransaction, newCoins: CoinInfo[]): Promise<BalancedTransaction> {
            return wallet
              .balanceAndProveTransaction(
                ZswapTransaction.deserialize(tx.serialize(getLedgerNetworkId()), getZswapNetworkId()),
                newCoins,
              )
              .then((zswapTx) => Transaction.deserialize(zswapTx.serialize(getZswapNetworkId()), getLedgerNetworkId()))
              .then(createBalancedTx);
          },
        });

        setMidnightProvider({
          submitTx(tx: BalancedTransaction): Promise<TransactionId> {
            return wallet.submitTransaction(tx);
          },
        });

        setIsConnected(true);
        console.log(`Lace wallet connected: ${address.slice(0, 8)}...`);

        // Store connection status in localStorage for persistence
        localStorage.setItem('wallet_connected', 'true');
        localStorage.setItem('wallet_address', address);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to connect wallet';
        setError(errorMessage);
        console.error('Wallet connection error:', err);
        throw err;
      } finally {
        setIsConnecting(false);
      }
    },
    [],
  );

  const disconnect = useMemo(
    () => () => {
      setIsConnected(false);
      setWalletAddress(undefined);
      setWalletAPI(null);
      setError(null);

      // Reset wallet providers to readonly state
      setWalletProvider({
        coinPublicKey: '',
        encryptionPublicKey: '',
        balanceTx: async () => Promise.reject(new Error('Wallet not connected')),
      });
      setMidnightProvider({
        submitTx: async () => Promise.reject(new Error('Wallet not connected')),
      });

      // Clear localStorage
      localStorage.removeItem('wallet_connected');
      localStorage.removeItem('wallet_address');

      console.log('Wallet disconnected');
    },
    [],
  );

  const payrollProviders: PayrollProviders = useMemo(
    () => ({
      privateStateProvider,
      publicDataProvider,
      zkConfigProvider,
      proofProvider,
      walletProvider,
      midnightProvider,
    }),
    [privateStateProvider, publicDataProvider, zkConfigProvider, proofProvider, walletProvider, midnightProvider],
  );

  const state: PayrollWalletState = {
    isConnected,
    isConnecting,
    error,
    walletAddress,
    providers: payrollProviders,
    connect,
    disconnect,
  };

  // Auto-connect silently if Lace previously authorized this origin
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const api: any = (window as any)?.midnight?.mnLace;
        if (api && typeof api.isEnabled === 'function') {
          const enabled = await api.isEnabled();
          const wasConnected = localStorage.getItem('wallet_connected') === 'true';
          if (enabled && wasConnected && !cancelled && !isConnected && !isConnecting) {
            console.log('[AutoConnect] Attempting to reconnect wallet...');
            await connect();
          }
        }
      } catch (err) {
        console.warn(`Auto-connect failed: ${(err as Error)?.message}`);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [connect, isConnected, isConnecting]);

  return <PayrollWalletContext.Provider value={state}>{children}</PayrollWalletContext.Provider>;
};
