import React, { useState, useEffect } from 'react';
import { Box, Container, Typography, Button, Stack, Paper, TextField, Alert, CircularProgress, Divider } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import DashboardIcon from '@mui/icons-material/Dashboard';
import BusinessIcon from '@mui/icons-material/Business';
import AddIcon from '@mui/icons-material/Add';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import { listCompanies, getCurrentCompany } from '../utils/CompaniesLocalState';
import { usePayrollWallet } from '../contexts/PayrollWalletContext';
import { PayrollAPI, type DeployedPayrollAPI } from '@zksalaria/payroll-api';
import pino from 'pino';

// Create logger for dashboard
const logger = pino({
  name: 'dashboard',
  level: 'info',
  browser: {
    asObject: false,
  },
});

/**
 * Dashboard page (placeholder)
 * Will show company or employee dashboard based on role
 * TODO: Implement role detection and full dashboard
 */
export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { walletAddress, providers } = usePayrollWallet();
  const companies = listCompanies();
  const currentCompany = getCurrentCompany();
  const hasMultipleCompanies = companies.length > 1;

  const [api, setApi] = useState<DeployedPayrollAPI | null>(null);
  const [depositAmount, setDepositAmount] = useState('');
  const [isDepositing, setIsDepositing] = useState(false);
  const [depositSuccess, setDepositSuccess] = useState<string | null>(null);
  const [depositError, setDepositError] = useState<string | null>(null);

  const currentCompanyInfo = companies.find(c => c.contractAddress === currentCompany);

  // Connect to the deployed contract on mount
  useEffect(() => {
    const connectToContract = async () => {
      if (!currentCompany || !walletAddress) {
        console.log('[Dashboard] Missing contract address or wallet address');
        return;
      }

      try {
        console.log(`[Dashboard] Connecting to contract: ${currentCompany}`);
        const connectedApi = await PayrollAPI.connect(providers, currentCompany, walletAddress, logger);
        setApi(connectedApi);
        console.log('[Dashboard] Successfully connected to contract');
      } catch (err) {
        console.error('[Dashboard] Failed to connect to contract:', err);
        setDepositError('Failed to connect to contract');
      }
    };

    connectToContract();
  }, [currentCompany, walletAddress, providers]);

  const handleDeposit = async () => {
    console.log('[Dashboard] Deposit attempt:', {
      depositAmount,
      walletAddress,
      hasApi: !!api,
      currentCompany,
    });

    if (!depositAmount || !walletAddress || !api || !currentCompany) {
      const missing = [];
      if (!depositAmount) missing.push('depositAmount');
      if (!walletAddress) missing.push('walletAddress');
      if (!api) missing.push('api');
      if (!currentCompany) missing.push('currentCompany');

      const errorMsg = `Missing required information: ${missing.join(', ')}`;
      console.error('[Dashboard]', errorMsg);
      setDepositError(errorMsg);
      return;
    }

    const amount = parseFloat(depositAmount);
    if (isNaN(amount) || amount <= 0) {
      setDepositError('Please enter a valid amount');
      return;
    }

    setIsDepositing(true);
    setDepositError(null);
    setDepositSuccess(null);

    try {
      console.log(`[Dashboard] Depositing ${amount} to company ${currentCompany}`);
      await api.depositCompanyFunds(walletAddress, depositAmount);

      setDepositSuccess(`Successfully deposited ${amount} tokens!`);
      setDepositAmount('');
    } catch (err) {
      console.error('[Dashboard] Deposit failed:', err);
      setDepositError(err instanceof Error ? err.message : 'Failed to deposit funds');
    } finally {
      setIsDepositing(false);
    }
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
      <Container maxWidth="md">
        <Paper
          elevation={3}
          sx={{
            p: 6,
            borderRadius: 3,
            textAlign: 'center',
          }}
        >
          <Stack spacing={4} alignItems="center">
            <DashboardIcon
              sx={{
                fontSize: 80,
                color: '#10B981',
              }}
            />

            <Typography variant="h4" component="h1" fontWeight="bold">
              Company Dashboard
            </Typography>

            {currentCompanyInfo && (
              <Box textAlign="center">
                <Typography variant="h6" fontWeight="bold">
                  {currentCompanyInfo.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {currentCompanyInfo.contractAddress.slice(0, 8)}...{currentCompanyInfo.contractAddress.slice(-6)}
                </Typography>
              </Box>
            )}

            <Divider sx={{ width: '100%' }} />

            {/* Deposit Funds Section */}
            <Box sx={{ width: '100%', maxWidth: 400 }}>
              <Typography variant="h6" fontWeight="bold" mb={2}>
                Deposit Funds
              </Typography>

              <Stack spacing={2}>
                <TextField
                  label="Amount"
                  type="number"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  disabled={isDepositing}
                  fullWidth
                  placeholder="Enter amount to deposit"
                  inputProps={{ min: 0, step: 0.01 }}
                />

                <Button
                  variant="contained"
                  startIcon={isDepositing ? <CircularProgress size={20} /> : <AccountBalanceWalletIcon />}
                  onClick={handleDeposit}
                  disabled={isDepositing || !depositAmount}
                  fullWidth
                  sx={{ py: 1.5 }}
                >
                  {isDepositing ? 'Depositing...' : 'Deposit Funds'}
                </Button>

                {depositSuccess && (
                  <Alert severity="success" onClose={() => setDepositSuccess(null)}>
                    {depositSuccess}
                  </Alert>
                )}

                {depositError && (
                  <Alert severity="error" onClose={() => setDepositError(null)}>
                    {depositError}
                  </Alert>
                )}
              </Stack>
            </Box>

            <Divider sx={{ width: '100%' }} />

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              {hasMultipleCompanies && (
                <Button
                  variant="outlined"
                  startIcon={<BusinessIcon />}
                  onClick={() => navigate('/companies')}
                  sx={{ px: 4, py: 1.5 }}
                >
                  Switch Company
                </Button>
              )}

              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => navigate('/onboarding/company')}
                sx={{ px: 4, py: 1.5 }}
              >
                Create New Company
              </Button>

              <Button
                variant="outlined"
                onClick={() => navigate('/')}
                sx={{ px: 4, py: 1.5 }}
              >
                Back to Home
              </Button>
            </Stack>
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
};
