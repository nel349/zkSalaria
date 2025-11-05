import React from 'react';
import { Box, Container, Typography, Button, Stack, Paper } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';

/**
 * Connect Wallet page
 * Allows users to connect their Midnight Network wallet
 * TODO: Integrate with actual Midnight Wallet SDK
 */
export const ConnectWalletPage: React.FC = () => {
  const navigate = useNavigate();

  const handleConnect = () => {
    // TODO: Integrate Midnight Wallet connection logic
    console.log('Connecting wallet...');
    // For now, just navigate to dashboard
    navigate('/dashboard');
  };

  const handleGoBack = () => {
    navigate('/');
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
      }}
    >
      <Container maxWidth="sm">
        <Paper
          elevation={3}
          sx={{
            p: 6,
            borderRadius: 3,
            textAlign: 'center',
          }}
        >
          <Stack spacing={4} alignItems="center">
            {/* Icon */}
            <AccountBalanceWalletIcon
              sx={{
                fontSize: 80,
                color: '#FF6B35',
              }}
            />

            {/* Title */}
            <Typography variant="h4" component="h1" fontWeight="bold">
              Connect Your Wallet
            </Typography>

            {/* Description */}
            <Typography variant="body1" color="text.secondary">
              Connect your Midnight Network wallet to access zkSalaria's private payroll system.
            </Typography>

            {/* Instructions */}
            <Box
              sx={{
                bgcolor: 'background.default',
                p: 3,
                borderRadius: 2,
                width: '100%',
              }}
            >
              <Typography variant="body2" color="text.secondary" align="left">
                <strong>Requirements:</strong>
              </Typography>
              <Typography variant="body2" color="text.secondary" align="left" sx={{ mt: 1 }}>
                • Midnight Network wallet extension installed
              </Typography>
              <Typography variant="body2" color="text.secondary" align="left">
                • Connected to Midnight testnet/mainnet
              </Typography>
              <Typography variant="body2" color="text.secondary" align="left">
                • Small amount of DUST for gas fees
              </Typography>
            </Box>

            {/* Buttons */}
            <Stack direction="row" spacing={2} sx={{ width: '100%' }}>
              <Button
                variant="outlined"
                fullWidth
                onClick={handleGoBack}
                sx={{ py: 1.5 }}
              >
                Go Back
              </Button>
              <Button
                variant="contained"
                fullWidth
                onClick={handleConnect}
                sx={{
                  py: 1.5,
                  bgcolor: '#FF6B35',
                  '&:hover': {
                    bgcolor: '#ff8555',
                  },
                }}
              >
                Connect Wallet
              </Button>
            </Stack>

            {/* Helper Text */}
            <Typography variant="caption" color="text.secondary">
              Don't have a Midnight wallet?{' '}
              <Typography
                component="a"
                variant="caption"
                href="https://midnight.network"
                target="_blank"
                rel="noopener noreferrer"
                sx={{ color: '#00D9FF', textDecoration: 'none' }}
              >
                Get started here
              </Typography>
            </Typography>
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
};
