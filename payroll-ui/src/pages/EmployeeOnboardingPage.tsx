import React, { useEffect, useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Stack,
  Paper,
  CircularProgress,
  Alert,
  IconButton,
  Tooltip,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import PersonIcon from '@mui/icons-material/Person';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import EmailIcon from '@mui/icons-material/Email';
import { usePayrollWallet } from '../contexts/PayrollWalletContext';
import { useTheme, useThemeValues, createGlassMorphism, createPrimaryCTA } from '../theme';

type EmployeeStatus = 'checking' | 'added' | 'pending';

interface EmployeeData {
  companyName?: string;
  role?: string;
  salary?: string;
  salaryFrequency?: string;
  balance?: string; // Encrypted balance
}

/**
 * Employee Onboarding Page - Phase 1.5
 * Two states: Added (by company) or Pending (not yet added)
 * Reference: docs/design/AUTH_ONBOARDING_FLOW.md (Page 10)
 */
export const EmployeeOnboardingPage: React.FC = () => {
  const navigate = useNavigate();
  const { mode } = useTheme();
  const theme = useThemeValues();
  const { walletAddress, providers } = usePayrollWallet();

  const [status, setStatus] = useState<EmployeeStatus>('checking');
  const [employeeData, setEmployeeData] = useState<EmployeeData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [balanceDecrypted, setBalanceDecrypted] = useState(false);
  const [copied, setCopied] = useState(false);

  // Check if employee has been added by a company
  useEffect(() => {
    const checkEmployeeStatus = async () => {
      if (!walletAddress) return;

      try {
        setStatus('checking');
        console.log('[EmployeeOnboarding] Checking employee status...');

        // TODO: Query smart contract
        // const employeeInfo = await getEmployeeInfo(walletAddress, providers);

        // Mock implementation - simulate checking
        await new Promise((resolve) => setTimeout(resolve, 1500));

        // Mock: Check localStorage for demo purposes
        // In production, this would query the actual smart contract
        const mockEmployeeAdded = localStorage.getItem('employee_added') === 'true';

        if (mockEmployeeAdded) {
          // Employee has been added by a company
          setStatus('added');
          setEmployeeData({
            companyName: 'Acme Corporation',
            role: 'Software Engineer',
            salary: '5,000',
            salaryFrequency: 'Monthly',
            balance: '••••••', // Encrypted
          });
          localStorage.setItem('user_role', 'employee');
        } else {
          // Employee not yet added
          setStatus('pending');
        }
      } catch (err) {
        console.error('[EmployeeOnboarding] Error checking employee status:', err);
        setError(err instanceof Error ? err.message : 'Failed to check employee status');
        setStatus('pending');
      }
    };

    checkEmployeeStatus();
  }, [walletAddress, providers]);

  const handleCopyAddress = () => {
    if (walletAddress) {
      navigator.clipboard.writeText(walletAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDecryptBalance = () => {
    // TODO: Actual decryption logic
    setBalanceDecrypted(!balanceDecrypted);
  };

  const handleEmailEmployer = () => {
    const subject = encodeURIComponent('zkSalaria - Add Me as Employee');
    const body = encodeURIComponent(
      `Hello,\n\nI've set up my zkSalaria wallet and would like to be added to the payroll system.\n\nMy wallet address is:\n${walletAddress}\n\nThank you!`
    );
    window.open(`mailto:?subject=${subject}&body=${body}`);
  };

  const handleGoToDashboard = () => {
    navigate('/dashboard');
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: theme.colors.background.default,
        py: 4,
      }}
    >
      <Container maxWidth="md">
        <Paper
          elevation={0}
          sx={{
            ...createGlassMorphism(theme, mode),
            p: { xs: 4, md: 6 },
            borderRadius: theme.borderRadius['2xl'],
            border: `1px solid ${theme.colors.border.default}`,
          }}
        >
          {/* Checking State */}
          {status === 'checking' && (
            <Stack spacing={4} alignItems="center" textAlign="center">
              <CircularProgress
                size={80}
                sx={{ color: theme.colors.primary[mode === 'dark' ? 400 : 600] }}
              />
              <Typography
                variant="h5"
                fontWeight={theme.typography.fontWeight.semibold}
                color={theme.colors.text.primary}
              >
                Checking your status...
              </Typography>
              <Typography variant="body2" color={theme.colors.text.secondary}>
                Querying the payroll system to see if you've been added by a company
              </Typography>
            </Stack>
          )}

          {/* Error State */}
          {error && (
            <Alert
              severity="error"
              sx={{
                bgcolor: mode === 'dark' ? `${theme.colors.error[500]}20` : theme.colors.error[50],
                border: `1px solid ${theme.colors.error[500]}`,
              }}
            >
              {error}
            </Alert>
          )}

          {/* Added State - Employee has been added by company */}
          {status === 'added' && employeeData && (
            <Stack spacing={4}>
              {/* Header */}
              <Stack spacing={2} alignItems="center" textAlign="center">
                <Box
                  sx={{
                    width: 80,
                    height: 80,
                    borderRadius: '50%',
                    bgcolor: `${theme.colors.success[500]}20`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <CheckCircleIcon
                    sx={{
                      fontSize: 48,
                      color: theme.colors.success[500],
                    }}
                  />
                </Box>
                <Typography
                  variant="h4"
                  fontWeight={theme.typography.fontWeight.bold}
                  color={theme.colors.text.primary}
                >
                  Welcome! 🎉
                </Typography>
                <Typography variant="body1" color={theme.colors.text.secondary}>
                  You've been added to the zkSalaria payroll system
                </Typography>
              </Stack>

              {/* Company Info */}
              <Box
                sx={{
                  p: 3,
                  borderRadius: theme.borderRadius.lg,
                  bgcolor: mode === 'dark' ? theme.colors.background.elevated : theme.colors.background.surface,
                  border: `1px solid ${theme.colors.border.light}`,
                }}
              >
                <Stack spacing={2}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="body2" color={theme.colors.text.secondary}>
                      Company
                    </Typography>
                    <Typography
                      variant="body1"
                      fontWeight={theme.typography.fontWeight.semibold}
                      color={theme.colors.text.primary}
                    >
                      🏢 {employeeData.companyName}
                    </Typography>
                  </Stack>

                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="body2" color={theme.colors.text.secondary}>
                      Role
                    </Typography>
                    <Typography variant="body1" color={theme.colors.text.primary}>
                      {employeeData.role}
                    </Typography>
                  </Stack>

                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="body2" color={theme.colors.text.secondary}>
                      Salary
                    </Typography>
                    <Typography variant="body1" color={theme.colors.text.primary}>
                      ${employeeData.salary}/{employeeData.salaryFrequency?.toLowerCase()}
                    </Typography>
                  </Stack>

                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="body2" color={theme.colors.text.secondary}>
                      Current Balance
                    </Typography>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Typography
                        variant="body1"
                        fontWeight={theme.typography.fontWeight.semibold}
                        color={theme.colors.text.primary}
                      >
                        {balanceDecrypted ? `$${employeeData.salary}` : employeeData.balance}
                      </Typography>
                      <Tooltip title={balanceDecrypted ? 'Encrypt balance' : 'Decrypt balance'}>
                        <IconButton size="small" onClick={handleDecryptBalance}>
                          {balanceDecrypted ? (
                            <VisibilityOffIcon fontSize="small" />
                          ) : (
                            <VisibilityIcon fontSize="small" />
                          )}
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </Stack>
                </Stack>
              </Box>

              {/* Info Alert */}
              <Alert
                severity="info"
                sx={{
                  bgcolor: mode === 'dark' ? `${theme.colors.info[500]}20` : theme.colors.info[50],
                }}
              >
                <Typography variant="body2">
                  Your salary is encrypted on-chain. Only you can decrypt it with your private key.
                </Typography>
              </Alert>

              {/* Action Button */}
              <Button
                variant="contained"
                fullWidth
                onClick={handleGoToDashboard}
                sx={{
                  ...createPrimaryCTA(theme, mode),
                  py: 1.5,
                }}
              >
                Go to Dashboard →
              </Button>
            </Stack>
          )}

          {/* Pending State - Employee not yet added */}
          {status === 'pending' && (
            <Stack spacing={4}>
              {/* Header */}
              <Stack spacing={2} alignItems="center" textAlign="center">
                <Box
                  sx={{
                    width: 80,
                    height: 80,
                    borderRadius: '50%',
                    bgcolor: `${theme.colors.warning[500]}20`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <AccessTimeIcon
                    sx={{
                      fontSize: 48,
                      color: theme.colors.warning[500],
                    }}
                  />
                </Box>
                <Typography
                  variant="h4"
                  fontWeight={theme.typography.fontWeight.bold}
                  color={theme.colors.text.primary}
                >
                  Not Yet Added
                </Typography>
                <Typography variant="body1" color={theme.colors.text.secondary} sx={{ maxWidth: 500 }}>
                  Your employer hasn't added you to their payroll system yet. Share your wallet address with them to get started.
                </Typography>
              </Stack>

              {/* Wallet Address */}
              <Box
                sx={{
                  p: 3,
                  borderRadius: theme.borderRadius.lg,
                  bgcolor: mode === 'dark' ? theme.colors.background.elevated : theme.colors.background.surface,
                  border: `1px solid ${theme.colors.border.light}`,
                }}
              >
                <Typography
                  variant="caption"
                  color={theme.colors.text.secondary}
                  sx={{ display: 'block', mb: 1 }}
                >
                  Your Wallet Address
                </Typography>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Typography
                    variant="body2"
                    fontFamily={theme.typography.fontFamily.mono}
                    color={theme.colors.text.primary}
                    sx={{
                      flex: 1,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {walletAddress}
                  </Typography>
                  <Tooltip title={copied ? 'Copied!' : 'Copy address'}>
                    <IconButton size="small" onClick={handleCopyAddress}>
                      <ContentCopyIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Stack>
              </Box>

              {/* Instructions */}
              <Alert
                severity="info"
                sx={{
                  bgcolor: mode === 'dark' ? `${theme.colors.info[500]}20` : theme.colors.info[50],
                }}
              >
                <Typography variant="body2" fontWeight={theme.typography.fontWeight.semibold} sx={{ mb: 1 }}>
                  Next Steps:
                </Typography>
                <Typography variant="body2" component="div">
                  1. Copy your wallet address above
                  <br />
                  2. Share it with your employer
                  <br />
                  3. Wait for them to add you to their payroll system
                  <br />
                  4. You'll be able to access your dashboard once added
                </Typography>
              </Alert>

              {/* Action Buttons */}
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <Button
                  variant="outlined"
                  fullWidth
                  onClick={handleCopyAddress}
                  startIcon={<ContentCopyIcon />}
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
                  {copied ? 'Copied!' : 'Copy Address'}
                </Button>
                <Button
                  variant="contained"
                  fullWidth
                  onClick={handleEmailEmployer}
                  startIcon={<EmailIcon />}
                  sx={{
                    ...createPrimaryCTA(theme, mode),
                    py: 1.5,
                  }}
                >
                  Email Employer
                </Button>
              </Stack>

              {/* Help Text */}
              <Typography variant="caption" color={theme.colors.text.disabled} textAlign="center">
                Don't have an employer? You can't use zkSalaria as an individual employee. Companies must add you to their payroll system.
              </Typography>
            </Stack>
          )}
        </Paper>
      </Container>
    </Box>
  );
};
