import { useState, useEffect, useCallback } from 'react';
import type { ContractAddress } from '@midnight-ntwrk/compact-runtime';
import { PaymentAPI } from '@midnight-pay/pay-api';
import { usePaymentWallet } from '../components/PaymentWallet';
import {
  getCurrentPaymentGateway,
  setCurrentPaymentGateway,
  getCurrentEntityId,
  setCurrentEntityId,
  getCurrentEntityType,
  setCurrentEntityType,
  savePaymentGateway,
  savePaymentUser
} from '../utils/PaymentLocalState';

export interface PaymentContractState {
  // Contract state
  contractAddress: string | null;
  paymentAPI: PaymentAPI | null;

  // Current user context
  entityId: string | null;
  entityType: 'merchant' | 'customer' | null;

  // Loading states
  isInitializing: boolean;
  isDeploying: boolean;
  error: Error | null;

  // Actions
  deployNewGateway: (label?: string) => Promise<string>;
  connectToGateway: (contractAddress: string, label?: string) => Promise<void>;
  setEntity: (entityId: string, entityType: 'merchant' | 'customer') => Promise<void>;
  clearContract: () => void;
}

export const usePaymentContract = (): PaymentContractState => {
  const { isConnected, providers } = usePaymentWallet();

  const [contractAddress, setContractAddress] = useState<string | null>(getCurrentPaymentGateway());
  const [entityId, setEntityIdState] = useState<string | null>(getCurrentEntityId());
  const [entityType, setEntityTypeState] = useState<'merchant' | 'customer' | null>(getCurrentEntityType());
  const [paymentAPI, setPaymentAPI] = useState<PaymentAPI | null>(null);

  const [isInitializing, setIsInitializing] = useState(false);
  const [isDeploying, setIsDeploying] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Initialize PaymentAPI when we have all required pieces
  useEffect(() => {
    if (!isConnected || !providers || !contractAddress || !entityId || paymentAPI) {
      return;
    }

    const initializeAPI = async () => {
      try {
        setIsInitializing(true);
        setError(null);

        console.log('🔄 Initializing PaymentAPI with:', { contractAddress, entityId, entityType });

        const api = await PaymentAPI.build(entityId, providers, contractAddress as ContractAddress);
        setPaymentAPI(api);

        console.log('✅ PaymentAPI initialized successfully');
      } catch (err) {
        console.error('❌ Failed to initialize PaymentAPI:', err);
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        setIsInitializing(false);
      }
    };

    initializeAPI();
  }, [isConnected, providers, contractAddress, entityId, paymentAPI]);

  // Force clear paymentAPI for debugging by clicking browser console command
  if (typeof window !== 'undefined') {
    (window as any).clearPaymentAPI = () => {
      console.log('🔄 Manually clearing PaymentAPI for debugging');
      setPaymentAPI(null);
    };
  }

  const deployNewGateway = useCallback(async (label?: string): Promise<string> => {
    if (!isConnected || !providers) {
      throw new Error('Wallet not connected. Please connect your Lace wallet first.');
    }

    // Validate wallet providers
    if (!providers.walletProvider || !providers.midnightProvider) {
      throw new Error('Wallet providers not properly initialized. Please reconnect your wallet.');
    }

    try {
      setIsDeploying(true);
      setError(null);

      console.log('🚀 Deploying new payment gateway...');
      console.log('📋 Using providers:', {
        walletConnected: !!providers.walletProvider,
        midnightConnected: !!providers.midnightProvider,
        proofProvider: !!providers.proofProvider,
        publicDataProvider: !!providers.publicDataProvider
      });

      const newContractAddress = await PaymentAPI.deploy(providers);

      console.log('✅ Payment gateway deployed:', newContractAddress);

      // Save to storage
      savePaymentGateway({
        contractAddress: newContractAddress,
        label: label || 'Payment Gateway',
        createdAt: new Date().toISOString()
      });

      // Set as current
      setCurrentPaymentGateway(newContractAddress);
      setContractAddress(newContractAddress);

      return newContractAddress;
    } catch (err) {
      console.error('❌ Failed to deploy payment gateway:', err);

      // Provide more specific error messages
      let errorMessage = 'Unknown deployment error';
      if (err instanceof Error) {
        errorMessage = err.message;

        // Check for common errors and provide helpful messages
        if (errorMessage.includes('insufficient funds')) {
          errorMessage = 'Insufficient funds for deployment. Please ensure your wallet has enough balance.';
        } else if (errorMessage.includes('network')) {
          errorMessage = 'Network connection error. Please check your connection and try again.';
        } else if (errorMessage.includes('proof')) {
          errorMessage = 'Proof generation failed. Please try again or check your proof server connection.';
        }
      }

      const error = new Error(errorMessage);
      setError(error);
      throw error;
    } finally {
      setIsDeploying(false);
    }
  }, [isConnected, providers]);

  const connectToGateway = useCallback(async (address: string, label?: string): Promise<void> => {
    try {
      setIsInitializing(true);
      setError(null);

      console.log('🔗 Connecting to payment gateway:', address);

      // Basic validation
      if (!address || address.length < 10) {
        throw new Error('Invalid contract address');
      }

      // Save to storage
      savePaymentGateway({
        contractAddress: address,
        label: label || 'Payment Gateway',
        createdAt: new Date().toISOString()
      });

      // Set as current
      setCurrentPaymentGateway(address);
      setContractAddress(address);

      console.log('✅ Connected to payment gateway:', address);
    } catch (err) {
      console.error('❌ Failed to connect to payment gateway:', err);
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      throw error;
    } finally {
      setIsInitializing(false);
    }
  }, []);

  const setEntity = useCallback(async (newEntityId: string, newEntityType: 'merchant' | 'customer'): Promise<void> => {
    try {
      setError(null);

      console.log('👤 Setting entity:', { entityId: newEntityId, entityType: newEntityType });

      // Clear existing API
      setPaymentAPI(null);

      // Update entity info
      setCurrentEntityId(newEntityId);
      setCurrentEntityType(newEntityType);
      setEntityIdState(newEntityId);
      setEntityTypeState(newEntityType);

      // ⚠️  DO NOT SAVE TO LOCALSTORAGE HERE!
      // localStorage should only be updated AFTER successful blockchain registration
      // This prevents the mismatch between localStorage and blockchain state
      console.log('🔄 Entity set in session, localStorage will be updated after blockchain registration');

      console.log('✅ Entity set successfully');
    } catch (err) {
      console.error('❌ Failed to set entity:', err);
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      throw error;
    }
  }, [contractAddress]);

  const clearContract = useCallback(() => {
    console.log('🧹 Clearing payment contract state');

    setPaymentAPI(null);
    setContractAddress(null);
    setEntityIdState(null);
    setEntityTypeState(null);
    setError(null);

    // Clear session storage
    try {
      window.sessionStorage.removeItem('current-payment-gateway');
      window.sessionStorage.removeItem('current-entity-id');
      window.sessionStorage.removeItem('current-entity-type');
    } catch {
      // Ignore storage errors
    }
  }, []);

  return {
    contractAddress,
    paymentAPI,
    entityId,
    entityType,
    isInitializing,
    isDeploying,
    error,
    deployNewGateway,
    connectToGateway,
    setEntity,
    clearContract
  };
};