import React, { useEffect } from 'react';
import { Box, Container, Typography, Button, Stack, Paper, CircularProgress, Alert } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import { usePayrollWallet } from '../contexts/PayrollWalletContext';
import { useTheme, useThemeValues, createGlassMorphism, createPrimaryCTA } from '../theme';
import { ThemeToggle } from '../components';

/**
 * Connect Wallet Page - Phase 1.2
 * Wallet detection and connection flow
 * Reference: docs/design/AUTH_ONBOARDING_FLOW.md (Page 2-3)
 */
export const ConnectWalletPage: React.FC = () => {
  const navigate = useNavigate();
  const { mode } = useTheme();
  const theme = useThemeValues();
  const { isConnected, isConnecting, error, connect, walletAddress } = usePayrollWallet();

  // If already connected, redirect to dashboard
  useEffect(() => {
    if (isConnected && walletAddress) {
      console.log('[ConnectWallet] Already connected, redirecting to dashboard');
      // TODO: Add role detection logic here (Phase 1.3)
      navigate('/dashboard');
    }
  }, [isConnected, walletAddress, navigate]);

  const handleConnect = async () => {
    try {
      await connect();
      // After successful connection, navigate to dashboard
      // Role detection will happen in Phase 1.3
      navigate('/dashboard');
    } catch (err) {
      console.error('Connection failed:', err);
      // Error is already set in the context
    }
  };

  const handleGoBack = () => {
    navigate('/');
  };

  // Check if Midnight Lace is installed
  const isWalletInstalled = typeof (window as any)?.midnight?.mnLace !== 'undefined';

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: theme.colors.background.default,
        position: 'relative',
      }}
    >
      {/* Theme Toggle - Top Right */}
      <Box sx={{ position: 'absolute', top: 24, right: 24 }}>
        <ThemeToggle size="medium" />
      </Box>

      <Container maxWidth="sm">
        <Paper
          elevation={0}
          sx={{
            ...createGlassMorphism(theme, mode),
            p: { xs: 4, md: 6 },
            borderRadius: theme.borderRadius['2xl'],
            textAlign: 'center',
            border: `1px solid ${theme.colors.border.default}`,
            bgcolor: mode === 'dark' ? `${theme.colors.background.paper}dd` : theme.colors.background.paper,
          }}
        >
          <Stack spacing={4} alignItems="center">
            {/* Icon with Status */}
            <Box sx={{ position: 'relative' }}>
              <AccountBalanceWalletIcon
                sx={{
                  fontSize: 80,
                  color: theme.colors.primary[mode === 'dark' ? 400 : 600],
                }}
              />
              {isConnected && (
                <CheckCircleIcon
                  sx={{
                    position: 'absolute',
                    bottom: -4,
                    right: -4,
                    fontSize: 32,
                    color: theme.colors.success[500],
                    bgcolor: theme.colors.background.paper,
                    borderRadius: '50%',
                  }}
                />
              )}
              {error && !isConnecting && (
                <ErrorIcon
                  sx={{
                    position: 'absolute',
                    bottom: -4,
                    right: -4,
                    fontSize: 32,
                    color: theme.colors.error[500],
                    bgcolor: theme.colors.background.paper,
                    borderRadius: '50%',
                  }}
                />
              )}
            </Box>

            {/* Title */}
            <Typography
              variant="h4"
              component="h1"
              fontWeight={theme.typography.fontWeight.bold}
              color={theme.colors.text.primary}
            >
              {!isWalletInstalled
                ? 'Midnight Wallet Required'
                : isConnected
                ? 'Wallet Connected!'
                : 'Connect Your Wallet'}
            </Typography>

            {/* Description */}
            <Typography
              variant="body1"
              color={theme.colors.text.secondary}
              sx={{ maxWidth: 400 }}
            >
              {!isWalletInstalled
                ? 'zkSalaria requires Midnight Lace Wallet to connect. Install the browser extension to continue.'
                : isConnected
                ? `Connected: ${walletAddress?.slice(0, 6)}...${walletAddress?.slice(-4)}`
                : 'Connect your Midnight Lace Wallet to access zkSalaria\'s private payroll system.'}
            </Typography>

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
              </Alert>
            )}

            {/* Instructions */}
            {!isConnected && isWalletInstalled && (
              <Box
                sx={{
                  bgcolor: mode === 'dark' ? theme.colors.background.elevated : theme.colors.background.surface,
                  p: 3,
                  borderRadius: theme.borderRadius.lg,
                  width: '100%',
                  border: `1px solid ${theme.colors.border.light}`,
                }}
              >
                <Typography
                  variant="body2"
                  color={theme.colors.text.primary}
                  align="left"
                  fontWeight={theme.typography.fontWeight.semibold}
                >
                  What we'll use your wallet for:
                </Typography>
                <Stack spacing={1} sx={{ mt: 2 }}>
                  <Typography variant="body2" color={theme.colors.text.secondary} align="left">
                    • Identify your account
                  </Typography>
                  <Typography variant="body2" color={theme.colors.text.secondary} align="left">
                    • Sign transactions (pay employees, withdraw)
                  </Typography>
                  <Typography variant="body2" color={theme.colors.text.secondary} align="left">
                    • Decrypt your encrypted salary data
                  </Typography>
                </Stack>
                <Typography
                  variant="caption"
                  color={theme.colors.text.disabled}
                  align="left"
                  sx={{ display: 'block', mt: 2 }}
                >
                  Your private keys stay secure in your wallet.
                </Typography>
              </Box>
            )}

            {/* Buttons */}
            <Stack direction="row" spacing={2} sx={{ width: '100%', mt: 2 }}>
              <Button
                variant="outlined"
                fullWidth
                onClick={handleGoBack}
                disabled={isConnecting}
                sx={{
                  py: 1.5,
                  borderRadius: theme.borderRadius.full,
                  borderColor: theme.colors.border.default,
                  color: theme.colors.text.secondary,
                  '&:hover': {
                    borderColor: theme.colors.border.strong,
                    bgcolor: theme.colors.action.hover,
                  },
                }}
              >
                Go Back
              </Button>
              {!isWalletInstalled ? (
                <Button
                  variant="contained"
                  fullWidth
                  component="a"
                  href="https://chromewebstore.google.com/detail/midnight-lace-wallet/gojdnhgbnddfaafnbnbljgpkhkfdhmgo"
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{
                    ...createPrimaryCTA(theme, mode),
                    py: 1.5,
                  }}
                >
                  Install Lace Wallet →
                </Button>
              ) : (
                <Button
                  variant="contained"
                  fullWidth
                  onClick={handleConnect}
                  disabled={isConnecting || isConnected}
                  startIcon={isConnecting ? <CircularProgress size={20} /> : undefined}
                  sx={{
                    ...createPrimaryCTA(theme, mode),
                    py: 1.5,
                  }}
                >
                  {isConnecting ? 'Connecting...' : isConnected ? 'Connected' : 'Connect Wallet'}
                </Button>
              )}
            </Stack>

            {/* Helper Text */}
            <Typography variant="caption" color={theme.colors.text.disabled}>
              Don't have a Midnight wallet?{' '}
              <Typography
                component="a"
                variant="caption"
                href="https://midnight.network/lace"
                target="_blank"
                rel="noopener noreferrer"
                sx={{
                  color: theme.colors.primary[mode === 'dark' ? 400 : 600],
                  textDecoration: 'none',
                  '&:hover': {
                    textDecoration: 'underline',
                  },
                }}
              >
                Learn more
              </Typography>
            </Typography>
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
};
