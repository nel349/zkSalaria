// @ts-nocheck - MUI Grid v5/v6 compatibility issues (runtime works fine)
import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Stack,
  Paper,
  Grid,
  Alert,
  CircularProgress,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import ReceiptIcon from '@mui/icons-material/Receipt';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import SpeedIcon from '@mui/icons-material/Speed';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import VerifiedIcon from '@mui/icons-material/Verified';
import BadgeIcon from '@mui/icons-material/Badge';
import PaymentsIcon from '@mui/icons-material/Payments';
import { useTheme, useThemeValues } from '../theme';
import { usePayrollWallet } from '../contexts/PayrollWalletContext';
import { PayrollAPI, type DeployedPayrollAPI } from '@zksalaria/payroll-api';
import { PaymentHistorySection } from './PaymentHistorySection';
import { RoleSwitcher, type ViewMode } from './RoleSwitcher';
import pino from 'pino';

const logger = pino({
  name: 'employee-dashboard',
  level: 'info',
  browser: {
    asObject: false,
  },
});

interface EmployeeDashboardStats {
  currentBalance: bigint;
  lastPaymentAmount: bigint;
  lastPaymentDate: string | null;
  totalPaymentsThisYear: bigint;
  employmentStatus: string;
  companyName: string;
}

interface EmployeeDashboardProps {
  contractAddress: string;
  companyName: string;
  isDualRole?: boolean;
  currentView?: ViewMode;
  onViewChange?: (view: ViewMode) => void;
}

/**
 * Employee Dashboard View (Phase 3.2 & 3.6)
 * Shows employee-specific stats and actions
 * Phase 3.6: Adds role switcher for dual-role users
 */
export const EmployeeDashboard: React.FC<EmployeeDashboardProps> = ({
  contractAddress,
  companyName,
  isDualRole = false,
  currentView = 'employee',
  onViewChange,
}) => {
  const navigate = useNavigate();
  const { mode } = useTheme();
  const theme = useThemeValues();
  const { walletAddress, providers } = usePayrollWallet();

  const [api, setApi] = useState<DeployedPayrollAPI | null>(null);
  const [stats, setStats] = useState<EmployeeDashboardStats>({
    currentBalance: 0n,
    lastPaymentAmount: 0n,
    lastPaymentDate: null,
    totalPaymentsThisYear: 0n,
    employmentStatus: 'Active',
    companyName: companyName,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [payments, setPayments] = useState<any[]>([]);

  // Connect to contract and load stats
  useEffect(() => {
    const connectAndLoadStats = async () => {
      if (!contractAddress || !walletAddress) {
        setError('Missing contract or wallet information');
        setLoading(false);
        return;
      }

      try {
        console.log(`[EmployeeDashboard] Connecting to contract: ${contractAddress}`);
        const connectedApi = await PayrollAPI.connect(providers, contractAddress, walletAddress, logger);
        setApi(connectedApi);

        // Subscribe to contract state
        const subscription = connectedApi.state$.subscribe((state) => {
          console.log('[EmployeeDashboard] State updated:', state);

          // TODO: Implement encrypted balance decryption (Phase 4)
          // TODO: Implement payment history queries (Phase 4)
          // For now, use placeholder values
          const employeeBalance = 0n;

          setStats({
            currentBalance: employeeBalance,
            lastPaymentAmount: 0n,
            lastPaymentDate: null,
            totalPaymentsThisYear: state.totalPayments,
            employmentStatus: 'Active',
            companyName: companyName,
          });
          setLoading(false);
        });

        // Load payment history for this employee
        loadPaymentHistory(connectedApi);

        return () => subscription.unsubscribe();
      } catch (err) {
        console.error('[EmployeeDashboard] Failed to connect:', err);
        setError('Failed to connect to contract');
        setLoading(false);
      }
    };

    connectAndLoadStats();
  }, [contractAddress, walletAddress, providers, companyName]);

  // Load payment history from contract
  const loadPaymentHistory = async (apiInstance: DeployedPayrollAPI) => {
    if (!walletAddress) return;

    try {
      const history = await apiInstance.getEmployeePaymentHistory(walletAddress);

      // Convert PaymentRecord to UI format
      const uiPayments = history.map((record: any) => ({
        id: Array.from(record.payment_id).map((b: number) => b.toString(16).padStart(2, '0')).join('').slice(0, 8),
        status: record.status === 1n ? 'completed' : record.status === 0n ? 'pending' : 'failed',
        employeeName: companyName,
        employeeId: contractAddress,
        amount: 0n, // Encrypted - employee needs to decrypt (Phase 4)
        encryptedAmount: record.encrypted_amount, // Store encrypted data for later decryption
        isEncrypted: true, // Employee view shows encrypted by default
        date: new Date(Number(record.timestamp) * 1000).toISOString(),
        type: record.payment_type === 0n ? 'salary' : record.payment_type === 1n ? 'advance' : 'bonus',
        transactionId: Array.from(record.payment_id).map((b: number) => b.toString(16).padStart(2, '0')).join('').slice(0, 12),
      }));

      setPayments(uiPayments);
      console.log(`[EmployeeDashboard] Loaded ${uiPayments.length} payments`);
    } catch (err) {
      console.error('[EmployeeDashboard] Failed to load payment history:', err);
    }
  };

  const formatBalance = (balance: bigint): string => {
    return `$${(Number(balance) / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatRelativeTime = (dateString: string | null): string => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return '1 day ago';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
  };

  if (loading) {
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
        <CircularProgress sx={{ color: theme.colors.primary[500] }} />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: theme.colors.background.default,
        pb: 8,
      }}
    >
      {/* Top Header */}
      <Box
        sx={{
          bgcolor: mode === 'dark' ? theme.colors.background.paper : '#FFFFFF',
          borderBottom: `1px solid ${theme.colors.border.default}`,
          py: 2,
        }}
      >
        <Container maxWidth="xl">
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            {/* Left: Title */}
            <Stack direction="row" alignItems="center" spacing={2}>
              <BadgeIcon sx={{ fontSize: 32, color: theme.colors.primary[500] }} />
              <Box>
                <Typography variant="h5" fontWeight={theme.typography.fontWeight.bold} color={theme.colors.text.primary}>
                  My Dashboard
                </Typography>
                <Typography variant="body2" color={theme.colors.text.secondary}>
                  {stats.companyName}
                </Typography>
              </Box>
            </Stack>

            {/* Right: Role switcher (if dual role) and Network badge */}
            <Stack direction="row" alignItems="center" spacing={2}>
              {isDualRole && onViewChange && (
                <RoleSwitcher currentView={currentView} onViewChange={onViewChange} />
              )}
              <Box
                sx={{
                  px: 2,
                  py: 1,
                  borderRadius: 2,
                  bgcolor: mode === 'dark' ? `${theme.colors.primary[500]}20` : theme.colors.primary[50],
                  border: `1px solid ${theme.colors.primary[500]}`,
                }}
              >
                <Typography variant="body2" color={theme.colors.primary[500]} fontWeight={theme.typography.fontWeight.semibold}>
                  🌙 Midnight Network
                </Typography>
              </Box>
            </Stack>
          </Stack>
        </Container>
      </Box>

      <Container maxWidth="xl" sx={{ mt: 4 }}>
        <Stack spacing={4}>
          {/* Error Alert */}
          {error && (
            <Alert severity="error" onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          {/* Page Title */}
          <Box>
            <Typography variant="h4" fontWeight={theme.typography.fontWeight.bold} color={theme.colors.text.primary}>
              Employee Overview
            </Typography>
            <Typography variant="body2" color={theme.colors.text.secondary} sx={{ mt: 1 }}>
              View your salary, payment history, and employment status
            </Typography>
          </Box>

          {/* Stats Grid (4 columns) */}
          <Grid container spacing={3}>
            {/* Stat 1: Current Balance */}
            <Grid item xs={12} sm={6} md={3}>
              <Paper
                elevation={2}
                sx={{
                  p: 3,
                  borderRadius: 3,
                  bgcolor: mode === 'dark' ? theme.colors.background.paper : '#FFFFFF',
                  textAlign: 'center',
                }}
              >
                <AccountBalanceWalletIcon sx={{ fontSize: 40, color: theme.colors.primary[500], mb: 1 }} />
                <Typography
                  variant="h4"
                  fontWeight={theme.typography.fontWeight.bold}
                  sx={{
                    background: `linear-gradient(135deg, ${theme.colors.primary[400]}, ${theme.colors.secondary[500]})`,
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  {formatBalance(stats.currentBalance)}
                </Typography>
                <Typography variant="body2" color={theme.colors.text.secondary}>
                  Current Balance
                </Typography>
              </Paper>
            </Grid>

            {/* Stat 2: Last Payment */}
            <Grid item xs={12} sm={6} md={3}>
              <Paper
                elevation={2}
                sx={{
                  p: 3,
                  borderRadius: 3,
                  bgcolor: mode === 'dark' ? theme.colors.background.paper : '#FFFFFF',
                  textAlign: 'center',
                }}
              >
                <PaymentsIcon sx={{ fontSize: 40, color: theme.colors.info[500], mb: 1 }} />
                <Typography
                  variant="h4"
                  fontWeight={theme.typography.fontWeight.bold}
                  sx={{
                    background: `linear-gradient(135deg, ${theme.colors.info[500]}, ${theme.colors.primary[500]})`,
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  {formatBalance(stats.lastPaymentAmount)}
                </Typography>
                <Typography variant="body2" color={theme.colors.text.secondary}>
                  Last Payment
                </Typography>
                <Typography variant="caption" color={theme.colors.text.disabled}>
                  {formatRelativeTime(stats.lastPaymentDate)}
                </Typography>
              </Paper>
            </Grid>

            {/* Stat 3: Payments This Year */}
            <Grid item xs={12} sm={6} md={3}>
              <Paper
                elevation={2}
                sx={{
                  p: 3,
                  borderRadius: 3,
                  bgcolor: mode === 'dark' ? theme.colors.background.paper : '#FFFFFF',
                  textAlign: 'center',
                }}
              >
                <ReceiptIcon sx={{ fontSize: 40, color: theme.colors.warning[500], mb: 1 }} />
                <Typography
                  variant="h4"
                  fontWeight={theme.typography.fontWeight.bold}
                  sx={{
                    background: `linear-gradient(135deg, ${theme.colors.warning[500]}, ${theme.colors.error[500]})`,
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  {stats.totalPaymentsThisYear.toString()}
                </Typography>
                <Typography variant="body2" color={theme.colors.text.secondary}>
                  Payments This Year
                </Typography>
              </Paper>
            </Grid>

            {/* Stat 4: Employment Status */}
            <Grid item xs={12} sm={6} md={3}>
              <Paper
                elevation={2}
                sx={{
                  p: 3,
                  borderRadius: 3,
                  bgcolor: mode === 'dark' ? theme.colors.background.paper : '#FFFFFF',
                  textAlign: 'center',
                }}
              >
                <CheckCircleIcon sx={{ fontSize: 40, color: theme.colors.success[500], mb: 1 }} />
                <Typography
                  variant="h4"
                  fontWeight={theme.typography.fontWeight.bold}
                  sx={{
                    background: `linear-gradient(135deg, ${theme.colors.success[500]}, ${theme.colors.primary[500]})`,
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  {stats.employmentStatus}
                </Typography>
                <Typography variant="body2" color={theme.colors.text.secondary}>
                  Status
                </Typography>
              </Paper>
            </Grid>
          </Grid>

          {/* Quick Actions Section */}
          <Paper
            elevation={3}
            sx={{
              p: 4,
              borderRadius: 3,
              bgcolor: mode === 'dark' ? theme.colors.background.paper : '#FFFFFF',
            }}
          >
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 3 }}>
              <SpeedIcon sx={{ color: theme.colors.primary[500] }} />
              <Typography variant="h6" fontWeight={theme.typography.fontWeight.semibold}>
                Quick Actions
              </Typography>
            </Stack>

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <Button
                  variant="contained"
                  fullWidth
                  startIcon={<MonetizationOnIcon />}
                  onClick={() => {
                    /* TODO: Open withdraw modal */
                  }}
                  sx={{
                    py: 1.5,
                    bgcolor: theme.colors.warning[500],
                    '&:hover': { bgcolor: theme.colors.warning[700] },
                  }}
                >
                  Withdraw Salary
                </Button>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Button
                  variant="contained"
                  fullWidth
                  startIcon={<VerifiedIcon />}
                  onClick={() => {
                    /* TODO: Navigate to proof generation */
                  }}
                  sx={{
                    py: 1.5,
                    bgcolor: theme.colors.secondary[500],
                    '&:hover': { bgcolor: theme.colors.secondary[700] },
                  }}
                >
                  Generate Proof
                </Button>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Button
                  variant="contained"
                  fullWidth
                  startIcon={<CheckCircleIcon />}
                  onClick={() => {
                    /* TODO: Navigate to disclosure */
                  }}
                  sx={{
                    py: 1.5,
                    bgcolor: theme.colors.primary[500],
                    '&:hover': { bgcolor: theme.colors.primary[700] },
                  }}
                >
                  Grant Disclosure
                </Button>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Button
                  variant="outlined"
                  fullWidth
                  startIcon={<ReceiptIcon />}
                  onClick={() => {
                    /* TODO: Open W-2 modal */
                  }}
                  sx={{ py: 1.5 }}
                >
                  Download W-2
                </Button>
              </Grid>
            </Grid>
          </Paper>

          {/* Payment History */}
          <Box>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
              <ReceiptIcon sx={{ color: theme.colors.primary[500] }} />
              <Typography variant="h6" fontWeight={theme.typography.fontWeight.semibold}>
                Payment History
              </Typography>
            </Stack>
            <PaymentHistorySection userRole="employee" payments={payments} maxRows={5} />
          </Box>
        </Stack>
      </Container>
    </Box>
  );
};
