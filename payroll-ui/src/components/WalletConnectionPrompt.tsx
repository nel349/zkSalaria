import React, { useState } from 'react';
import { Box, Container, Alert, Typography, Button, CircularProgress } from '@mui/material';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import { useThemeValues } from '../theme';

interface WalletConnectionPromptProps {
  onConnect: () => Promise<void>;
}

export const WalletConnectionPrompt: React.FC<WalletConnectionPromptProps> = ({ onConnect }) => {
  const theme = useThemeValues();
  const [connecting, setConnecting] = useState(false);

  const handleConnect = async () => {
    try {
      setConnecting(true);
      await onConnect();
    } catch (err) {
      console.error('Failed to connect wallet:', err);
    } finally {
      setConnecting(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: theme.colors.background.default,
        p: 4,
      }}
    >
      <Container maxWidth="sm">
        <Alert
          severity="warning"
          sx={{
            p: 3,
            borderRadius: 2,
          }}
        >
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
            Wallet Not Connected
          </Typography>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Connect your Lace wallet to access the dashboard
          </Typography>
          <Button
            variant="contained"
            startIcon={connecting ? <CircularProgress size={20} /> : <AccountBalanceWalletIcon />}
            onClick={handleConnect}
            disabled={connecting}
            sx={{
              bgcolor: theme.colors.primary[500],
              '&:hover': { bgcolor: theme.colors.primary[700] },
            }}
          >
            {connecting ? 'Connecting...' : 'Connect Lace Wallet'}
          </Button>
        </Alert>
      </Container>
    </Box>
  );
};
