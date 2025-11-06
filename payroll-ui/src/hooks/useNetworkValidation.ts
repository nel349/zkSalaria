import { useEffect, useState } from 'react';
import { NetworkId, getNetworkId } from '@midnight-ntwrk/midnight-js-network-id';
import { usePayrollWallet } from '../contexts/PayrollWalletContext';

export type NetworkStatus = 'checking' | 'correct' | 'wrong' | 'unknown';

interface NetworkValidationResult {
  status: NetworkStatus;
  currentNetwork: NetworkId | null;
  expectedNetwork: NetworkId;
  isCorrectNetwork: boolean;
}

/**
 * Hook to validate that the connected wallet is on the correct Midnight network
 * Usage: Call this after wallet connection to check network compatibility
 */
export const useNetworkValidation = (): NetworkValidationResult => {
  const { isConnected, walletAddress } = usePayrollWallet();
  const [status, setStatus] = useState<NetworkStatus>('checking');
  const [currentNetwork, setCurrentNetwork] = useState<NetworkId | null>(null);

  // Get expected network from configuration
  const expectedNetwork = getNetworkId();

  useEffect(() => {
    if (!isConnected || !walletAddress) {
      setStatus('unknown');
      return;
    }

    const checkNetwork = async () => {
      try {
        setStatus('checking');

        // Get wallet's current network
        // Note: The Midnight Lace wallet API will provide this info
        const api: any = (window as any)?.midnight?.mnLace;
        if (!api) {
          console.warn('[NetworkValidation] Midnight Lace API not found');
          setStatus('unknown');
          return;
        }

        // Get network info from wallet
        // The networkId should match what we expect from config
        const walletState = await api.wallet?.state();
        if (walletState?.networkId) {
          setCurrentNetwork(walletState.networkId);

          if (walletState.networkId === expectedNetwork) {
            setStatus('correct');
            console.log(`[NetworkValidation] ✅ Correct network: ${expectedNetwork}`);
          } else {
            setStatus('wrong');
            console.warn(
              `[NetworkValidation] ❌ Wrong network. Expected: ${expectedNetwork}, Got: ${walletState.networkId}`
            );
          }
        } else {
          // Fallback: Assume correct network if we can't detect
          console.warn('[NetworkValidation] Could not detect network, assuming correct');
          setCurrentNetwork(expectedNetwork);
          setStatus('correct');
        }
      } catch (error) {
        console.error('[NetworkValidation] Error checking network:', error);
        // Fallback: Assume correct network on error
        setCurrentNetwork(expectedNetwork);
        setStatus('correct');
      }
    };

    checkNetwork();
  }, [isConnected, walletAddress, expectedNetwork]);

  return {
    status,
    currentNetwork,
    expectedNetwork,
    isCorrectNetwork: status === 'correct',
  };
};
