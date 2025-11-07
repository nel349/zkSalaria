import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Stack,
  Paper,
  TextField,
  CircularProgress,
  Alert,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import PersonIcon from '@mui/icons-material/Person';
import BusinessIcon from '@mui/icons-material/Business';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { usePayrollWallet } from '../contexts/PayrollWalletContext';
import { useTheme, useThemeValues } from '../theme';
import { PayrollAPI, utils } from '@zksalaria/payroll-api';
import { saveEmployer, setCurrentEmployer } from '../utils/EmployerContractsLocalState';
import { firstValueFrom } from 'rxjs';
import pino from 'pino';

const logger = pino({
  name: 'employee-onboarding',
  level: 'info',
  browser: {
    asObject: false,
  },
});

/**
 * Employee Onboarding Page (Option 2: Manual Entry)
 * Employee enters company contract address shared by employer
 * We verify they're in the employee list and save the relationship
 */
export const EmployeeOnboardingPage: React.FC = () => {
  const navigate = useNavigate();
  const { mode } = useTheme();
  const theme = useThemeValues();
  const { walletAddress, providers } = usePayrollWallet();

  const [contractAddress, setContractAddress] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [companyName, setCompanyName] = useState<string | null>(null);

  const handleVerify = async () => {
    if (!walletAddress) {
      setError('Please connect your wallet first');
      return;
    }

    if (!contractAddress.trim()) {
      setError('Please enter a company contract address');
      return;
    }

    setIsVerifying(true);
    setError(null);
    setSuccess(false);

    try {
      console.log(`[EmployeeOnboarding] Verifying employment at ${contractAddress}...`);

      // Connect to the contract
      const api = await PayrollAPI.connect(providers, contractAddress.trim(), walletAddress, logger);

      // Use direct query method with retry (wait for indexer to sync)
      let retryCount = 0;
      const maxRetries = 10;
      const retryDelayMs = 2000;
      let employeeInfo = await api.getEmployeeInfo(walletAddress);

      // Retry if not found (indexer may be syncing)
      while (!employeeInfo.exists && retryCount < maxRetries) {
        console.log(`[EmployeeOnboarding] Employee not found yet, retrying in ${retryDelayMs/1000}s... (attempt ${retryCount + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, retryDelayMs));
        employeeInfo = await api.getEmployeeInfo(walletAddress);
        retryCount++;
      }

      // For debugging: Hash wallet address to show what we're looking for
      const employeeIdBytes = await utils.walletAddressToEmployeeId(walletAddress);

      console.log('[EmployeeOnboarding] Verification DEBUG:', {
        walletAddress,
        hashedBytes: Array.from(employeeIdBytes),
        hashedHex: Array.from(employeeIdBytes).map(b => b.toString(16).padStart(2, '0')).join(''),
        employeeInfo,
        retriesNeeded: retryCount,
      });

      console.log('[EmployeeOnboarding] Employee found:', employeeInfo.exists);

      if (!employeeInfo.exists) {
        setError('You are not registered as an employee at this company. Please contact your employer.');
        setIsVerifying(false);
        return;
      }

      // Get company name directly from contract state
      const state = await firstValueFrom(api.state$);
      const name = state.companyName || 'Unknown Company';

      console.log(`[EmployeeOnboarding] Successfully verified employment at ${name}`);

      // Save to employer contracts
      if (walletAddress) {
        saveEmployer(walletAddress, {
          contractAddress: contractAddress.trim(),
          companyName: name,
          joinedAt: new Date().toISOString(),
        });

        // Set as current employer
        setCurrentEmployer(contractAddress.trim());
      }

      setCompanyName(name);
      setSuccess(true);
      setIsVerifying(false);

      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } catch (err) {
      console.error('[EmployeeOnboarding] Verification failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to verify employment');
      setIsVerifying(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: theme.colors.background.default,
        py: 4,
      }}
    >
      <Container maxWidth="sm">
        <Stack spacing={4}>
          {/* Header */}
          <Box sx={{ textAlign: 'center' }}>
            <PersonIcon sx={{ fontSize: 60, color: theme.colors.primary[500], mb: 2 }} />
            <Typography variant="h4" fontWeight={theme.typography.fontWeight.bold} color={theme.colors.text.primary}>
              Join as Employee
            </Typography>
            <Typography variant="body1" color={theme.colors.text.secondary} sx={{ mt: 1 }}>
              Enter the company contract address provided by your employer
            </Typography>
          </Box>

          {/* Form */}
          <Paper
            elevation={3}
            sx={{
              p: 4,
              borderRadius: 3,
              bgcolor: mode === 'dark' ? theme.colors.background.paper : '#FFFFFF',
            }}
          >
            <Stack spacing={3}>
              {/* Wallet Address Display */}
              <Box>
                <Typography variant="caption" color={theme.colors.text.secondary} sx={{ mb: 1, display: 'block' }}>
                  Your Wallet Address
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    fontFamily: 'monospace',
                    bgcolor: theme.colors.background.surface,
                    p: 1.5,
                    borderRadius: 1,
                    wordBreak: 'break-all',
                  }}
                >
                  {walletAddress || 'Not connected'}
                </Typography>
              </Box>

              {/* Contract Address Input */}
              <TextField
                fullWidth
                label="Company Contract Address"
                placeholder="Enter contract address (e.g., 0x1234...)"
                value={contractAddress}
                onChange={(e) => setContractAddress(e.target.value)}
                disabled={isVerifying || success}
                helperText="Ask your employer for this address"
                required
              />

              {/* Error Alert */}
              {error && (
                <Alert severity="error" onClose={() => setError(null)}>
                  {error}
                </Alert>
              )}

              {/* Success Alert */}
              {success && companyName && (
                <Alert severity="success" icon={<CheckCircleIcon />}>
                  <Typography variant="body2" fontWeight={theme.typography.fontWeight.semibold}>
                    Success! You're registered as an employee at {companyName}
                  </Typography>
                  <Typography variant="caption">
                    Redirecting to dashboard...
                  </Typography>
                </Alert>
              )}

              {/* Verify Button */}
              <Button
                variant="contained"
                fullWidth
                size="large"
                onClick={handleVerify}
                disabled={isVerifying || success || !contractAddress.trim()}
                startIcon={isVerifying ? <CircularProgress size={20} /> : <BusinessIcon />}
                sx={{
                  py: 1.5,
                  bgcolor: theme.colors.primary[500],
                  '&:hover': { bgcolor: theme.colors.primary[700] },
                }}
              >
                <Typography>{isVerifying ? 'Verifying...' : success ? 'Verified!' : 'Verify & Join'}</Typography>
              </Button>

              {/* Cancel Button */}
              <Button
                variant="outlined"
                fullWidth
                onClick={() => navigate('/onboarding/role')}
                disabled={isVerifying || success}
              >
                Back
              </Button>
            </Stack>
          </Paper>

          {/* Info Box */}
          <Paper
            sx={{
              p: 3,
              borderRadius: 2,
              bgcolor: mode === 'dark' ? theme.colors.background.surface : theme.colors.primary[50],
              border: `1px solid ${theme.colors.primary[500]}`,
            }}
          >
            <Stack spacing={1}>
              <Typography variant="body2" fontWeight={theme.typography.fontWeight.semibold} color={theme.colors.primary[500]}>
                How to get the contract address?
              </Typography>
              <Typography variant="body2" color={theme.colors.text.secondary}>
                1. Contact your employer (HR or payroll admin)
              </Typography>
              <Typography variant="body2" color={theme.colors.text.secondary}>
                2. They will provide the company contract address
              </Typography>
              <Typography variant="body2" color={theme.colors.text.secondary}>
                3. Paste it above and click "Verify & Join"
              </Typography>
            </Stack>
          </Paper>
        </Stack>
      </Container>
    </Box>
  );
};
