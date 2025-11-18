import React, { useEffect, useState } from 'react';
import { Box, Container, Typography, CircularProgress, Stack, Alert, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import { usePayrollWallet } from '../contexts/PayrollWalletContext';
import { useNetworkValidation } from '../hooks/useNetworkValidation';
import { detectUserRole, type UserRole } from '../services/roleDetection';
import { useTheme, useThemeValues } from '../theme';
import { listCompanies, migrateLegacyCompany } from '../utils/CompaniesLocalState';
import { listEmployers } from '../utils/EmployerContractsLocalState';

/**
 * Role Detection Page - Phase 1.3
 * Shows loading state while:
 * 1. Validating network
 * 2. Querying smart contract for user role
 * 3. Redirecting to appropriate page
 *
 * Reference: docs/design/AUTH_ONBOARDING_FLOW.md (Pages 4-5)
 */
export const RoleDetectionPage: React.FC = () => {
  const navigate = useNavigate();
  const { mode } = useTheme();
  const theme = useThemeValues();
  const { isConnected, walletAddress, providers } = usePayrollWallet();
  const { status: networkStatus, isCorrectNetwork, expectedNetwork } = useNetworkValidation();

  const [detectionStatus, setDetectionStatus] = useState<'checking' | 'complete' | 'error'>('checking');
  const [detectedRole, setDetectedRole] = useState<UserRole | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Redirect if not connected
  useEffect(() => {
    if (!isConnected || !walletAddress) {
      console.log('[RoleDetection] No wallet connected, redirecting to connect page');
      navigate('/connect');
    }
  }, [isConnected, walletAddress, navigate]);

  // Step 1: Wait for network validation
  // Step 2: Query role from smart contract
  // Step 3: Redirect based on role
  useEffect(() => {
    if (!isConnected || !walletAddress) return;

    const performRoleDetection = async () => {
      try {
        // Wait for network check to complete
        if (networkStatus === 'checking') {
          console.log('[RoleDetection] Waiting for network validation...');
          return;
        }

        // If wrong network, stop here (user needs to switch)
        if (!isCorrectNetwork) {
          console.log('[RoleDetection] Wrong network detected, waiting for user action');
          setDetectionStatus('error');
          setError(`Please switch to ${expectedNetwork} network`);
          return;
        }

        console.log('[RoleDetection] Network validated, detecting role...');
        setDetectionStatus('checking');

        // Migrate legacy company data
        migrateLegacyCompany();

        // Query smart contract for role
        const result = await detectUserRole(providers, walletAddress);
        setDetectedRole(result.role);
        setDetectionStatus('complete');

        console.log(`[RoleDetection] Role detection complete: ${result.role}`);

        // Small delay for UX (let user see the success state)
        await new Promise((resolve) => setTimeout(resolve, 800));

        // Check for existing accounts
        const companies = listCompanies();
        const employers = listEmployers(walletAddress);
        const hasCompanies = companies.length > 0;
        const hasEmployers = employers.length > 0;

        // Redirect based on role
        switch (result.role) {
          case 'new':
            // New user → Role selector page (Phase 1.4)
            console.log('[RoleDetection] Redirecting to role selector');
            navigate('/onboarding/role');
            break;

          case 'auditor':
            // Auditor → Status page to check application/registration status
            console.log('[RoleDetection] Auditor detected, redirecting to auditor status page');
            navigate('/auditor/status');
            break;

          case 'company':
            // Company only → Account selector (user must choose which company)
            console.log('[RoleDetection] Company accounts found, redirecting to account selector');
            navigate('/selector');
            break;

          case 'employee':
            // Employee only → Account selector (user must choose which employer)
            console.log('[RoleDetection] Employee accounts found, redirecting to account selector');
            navigate('/selector');
            break;

          case 'both':
            // Both roles → Account selector (user must choose company or employer)
            console.log('[RoleDetection] Multiple account types found, redirecting to account selector');
            navigate('/selector');
            break;
        }
      } catch (err) {
        console.error('[RoleDetection] Error during role detection:', err);
        setDetectionStatus('error');
        setError(err instanceof Error ? err.message : 'Failed to detect user role');
      }
    };

    performRoleDetection();
  }, [isConnected, walletAddress, networkStatus, isCorrectNetwork, expectedNetwork, providers, navigate]);

  const getStatusMessage = (): string => {
    if (networkStatus === 'checking') {
      return 'Checking network...';
    }
    if (!isCorrectNetwork) {
      return 'Wrong network detected';
    }
    if (detectionStatus === 'checking') {
      return 'Detecting your role...';
    }
    if (detectionStatus === 'complete' && detectedRole) {
      return `Role detected: ${detectedRole}`;
    }
    return 'Initializing...';
  };

  const handleRetry = () => {
    window.location.reload();
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: theme.colors.background.default,
      }}
    >
      <Container maxWidth="sm">
        <Stack spacing={4} alignItems="center" textAlign="center">
          {/* Status Icon */}
          {detectionStatus === 'checking' && (
            <CircularProgress
              size={80}
              sx={{
                color: theme.colors.primary[mode === 'dark' ? 400 : 600],
              }}
            />
          )}

          {detectionStatus === 'complete' && (
            <CheckCircleIcon
              sx={{
                fontSize: 80,
                color: theme.colors.success[500],
              }}
            />
          )}

          {detectionStatus === 'error' && (
            <ErrorIcon
              sx={{
                fontSize: 80,
                color: theme.colors.error[500],
              }}
            />
          )}

          {/* Status Text */}
          <Typography
            variant="h4"
            fontWeight={theme.typography.fontWeight.bold}
            color={theme.colors.text.primary}
          >
            {getStatusMessage()}
          </Typography>

          {/* Wallet Info */}
          {walletAddress && (
            <Typography variant="body2" color={theme.colors.text.secondary}>
              Connected: {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
            </Typography>
          )}

          {/* Error Alert */}
          {error && (
            <Alert
              severity="error"
              sx={{
                width: '100%',
                bgcolor: mode === 'dark' ? `${theme.colors.error[500]}20` : theme.colors.error[50],
                border: `1px solid ${theme.colors.error[500]}`,
              }}
            >
              <Typography variant="body2">{error}</Typography>
              <Button
                size="small"
                onClick={handleRetry}
                sx={{
                  mt: 1,
                  color: theme.colors.error[500],
                }}
              >
                Try Again
              </Button>
            </Alert>
          )}

          {/* Network Warning */}
          {!isCorrectNetwork && networkStatus !== 'checking' && (
            <Alert
              severity="warning"
              sx={{
                width: '100%',
                bgcolor: mode === 'dark' ? `${theme.colors.warning[500]}20` : theme.colors.warning[50],
                border: `1px solid ${theme.colors.warning[500]}`,
              }}
            >
              <Typography variant="body2" fontWeight={theme.typography.fontWeight.semibold}>
                Wrong Network Detected
              </Typography>
              <Typography variant="body2" sx={{ mt: 1 }}>
                Please switch your wallet to {expectedNetwork} network to continue.
              </Typography>
            </Alert>
          )}

          {/* Loading Steps */}
          {detectionStatus === 'checking' && (
            <Stack spacing={1} sx={{ mt: 2 }}>
              <Typography variant="body2" color={theme.colors.text.secondary}>
                This may take a few seconds...
              </Typography>
              <Typography variant="caption" color={theme.colors.text.disabled}>
                • Validating network
              </Typography>
              <Typography variant="caption" color={theme.colors.text.disabled}>
                • Querying smart contract
              </Typography>
              <Typography variant="caption" color={theme.colors.text.disabled}>
                • Determining your role
              </Typography>
            </Stack>
          )}
        </Stack>
      </Container>
    </Box>
  );
};
