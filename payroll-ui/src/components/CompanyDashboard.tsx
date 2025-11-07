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
  MenuItem,
  Select,
  Alert,
  CircularProgress,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import DashboardIcon from '@mui/icons-material/Dashboard';
import BusinessIcon from '@mui/icons-material/Business';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import PaymentIcon from '@mui/icons-material/Payment';
import RepeatIcon from '@mui/icons-material/Repeat';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import PeopleIcon from '@mui/icons-material/People';
import ReceiptIcon from '@mui/icons-material/Receipt';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import SpeedIcon from '@mui/icons-material/Speed';
import { useTheme, useThemeValues } from '../theme';
import { usePayrollWallet } from '../contexts/PayrollWalletContext';
import { listCompanies, getCurrentCompany, setCurrentCompany, SavedCompany } from '../utils/CompaniesLocalState';
import { PayrollAPI, type DeployedPayrollAPI } from '@zksalaria/payroll-api';
import { AddEmployeeModal } from './AddEmployeeModal';
import { PaymentHistorySection } from './PaymentHistorySection';
import pino from 'pino';

const logger = pino({
  name: 'company-dashboard',
  level: 'info',
  browser: {
    asObject: false,
  },
});

interface DashboardStats {
  totalBalance: bigint;
  totalEmployees: bigint;
  totalPayments: bigint;
  complianceStatus: string;
}

interface CompanyDashboardProps {
  currentCompany: SavedCompany;
  companies: SavedCompany[];
  onCompanySwitch: (contractAddress: string) => void;
}

/**
 * Company Dashboard View (Phase 3.1)
 * Main hub for all company operations
 */
export const CompanyDashboard: React.FC<CompanyDashboardProps> = ({ currentCompany, companies, onCompanySwitch }) => {
  const navigate = useNavigate();
  const { mode } = useTheme();
  const theme = useThemeValues();
  const { walletAddress, providers } = usePayrollWallet();

  const [api, setApi] = useState<DeployedPayrollAPI | null>(null);
  const [stats, setStats] = useState<DashboardStats>({
    totalBalance: 0n,
    totalEmployees: 0n,
    totalPayments: 0n,
    complianceStatus: '100%',
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addEmployeeModalOpen, setAddEmployeeModalOpen] = useState(false);

  // Mock payment data (TODO: Phase 4 - load from contract)
  const mockPayments = [
    {
      id: 'pay-001',
      status: 'completed' as const,
      employeeName: 'Alice Johnson',
      employeeId: 'alice-wallet-address',
      amount: 500000n,
      isEncrypted: false,
      date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      type: 'salary' as const,
      transactionId: '0xa3f2...8b9c',
    },
    {
      id: 'pay-002',
      status: 'completed' as const,
      employeeName: 'Bob Smith',
      employeeId: 'bob-wallet-address',
      amount: 420000n,
      isEncrypted: false,
      date: new Date(Date.now() - 17 * 24 * 60 * 60 * 1000).toISOString(),
      type: 'salary' as const,
      transactionId: '0xb4e3...7c8d',
    },
    {
      id: 'pay-003',
      status: 'pending' as const,
      employeeName: 'Carol Lee',
      employeeId: 'carol-wallet-address',
      amount: 650000n,
      isEncrypted: false,
      date: new Date().toISOString(),
      type: 'salary' as const,
      transactionId: '0xc5f4...6d7e',
    },
  ];

  // Connect to contract and load stats
  useEffect(() => {
    const connectAndLoadStats = async () => {
      if (!currentCompany.contractAddress || !walletAddress) {
        setError('No company selected');
        setLoading(false);
        return;
      }

      try {
        setLoading(true); // Show loading when switching companies
        console.log(`[CompanyDashboard] Connecting to contract: ${currentCompany.contractAddress}`);
        const connectedApi = await PayrollAPI.connect(providers, currentCompany.contractAddress, walletAddress, logger);
        setApi(connectedApi);

        // Subscribe to contract state
        const subscription = connectedApi.state$.subscribe((state) => {
          console.log('[CompanyDashboard] State updated:', state);
          setStats({
            totalBalance: state.totalSupply,
            totalEmployees: state.totalEmployees,
            totalPayments: state.totalPayments,
            complianceStatus: '100%', // TODO: Calculate from audit data
          });
          setLoading(false);
        });

        return () => subscription.unsubscribe();
      } catch (err) {
        console.error('[CompanyDashboard] Failed to connect:', err);
        setError('Failed to connect to contract');
        setLoading(false);
      }
    };

    connectAndLoadStats();
  }, [currentCompany.contractAddress, walletAddress, providers]);

  const formatBalance = (balance: bigint): string => {
    return `$${(Number(balance) / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
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
            {/* Left: Company name and switcher */}
            <Stack direction="row" alignItems="center" spacing={2}>
              <BusinessIcon sx={{ fontSize: 32, color: theme.colors.primary[500] }} />
              <Box>
                <Typography variant="h5" fontWeight={theme.typography.fontWeight.bold} color={theme.colors.text.primary}>
                  {currentCompany.name || 'Company Dashboard'}
                </Typography>
                {companies.length > 1 && (
                  <Select
                    value={currentCompany.contractAddress}
                    onChange={(e) => onCompanySwitch(e.target.value)}
                    size="small"
                    sx={{ mt: 0.5, minWidth: 200 }}
                  >
                    {companies.map((company) => (
                      <MenuItem key={company.contractAddress} value={company.contractAddress}>
                        {company.name}
                      </MenuItem>
                    ))}
                  </Select>
                )}
              </Box>
            </Stack>

            {/* Right: Network badge */}
            <Stack direction="row" alignItems="center" spacing={1}>
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
              Dashboard Overview
            </Typography>
            <Typography variant="body2" color={theme.colors.text.secondary} sx={{ mt: 1 }}>
              Monitor your payroll operations and manage employees
            </Typography>
          </Box>

          {/* Stats Grid (4 columns) */}
          <Grid container spacing={3}>
            {/* Stat 1: Total Balance */}
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
                  {formatBalance(stats.totalBalance)}
                </Typography>
                <Typography variant="body2" color={theme.colors.text.secondary}>
                  Total Balance
                </Typography>
              </Paper>
            </Grid>

            {/* Stat 2: Total Employees */}
            <Grid item xs={12} sm={6} md={3}>
              <Paper
                elevation={2}
                sx={{
                  p: 3,
                  borderRadius: 3,
                  bgcolor: mode === 'dark' ? theme.colors.background.paper : '#FFFFFF',
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: theme.shadows[6],
                    borderColor: theme.colors.info[500],
                  },
                }}
                onClick={() => navigate('/employees')}
              >
                <PeopleIcon sx={{ fontSize: 40, color: theme.colors.info[500], mb: 1 }} />
                <Typography
                  variant="h4"
                  fontWeight={theme.typography.fontWeight.bold}
                  sx={{
                    background: `linear-gradient(135deg, ${theme.colors.info[500]}, ${theme.colors.primary[500]})`,
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  {stats.totalEmployees.toString()}
                </Typography>
                <Typography variant="body2" color={theme.colors.text.secondary}>
                  Active Employees
                </Typography>
                <Typography variant="caption" color={theme.colors.info[500]} sx={{ mt: 1, display: 'block' }}>
                  Click to manage →
                </Typography>
              </Paper>
            </Grid>

            {/* Stat 3: Total Payments */}
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
                  {stats.totalPayments.toString()}
                </Typography>
                <Typography variant="body2" color={theme.colors.text.secondary}>
                  Payments This Month
                </Typography>
              </Paper>
            </Grid>

            {/* Stat 4: Compliance */}
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
                  {stats.complianceStatus}
                </Typography>
                <Typography variant="body2" color={theme.colors.text.secondary}>
                  Compliant
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
                  startIcon={<PersonAddIcon />}
                  onClick={() => setAddEmployeeModalOpen(true)}
                  sx={{
                    py: 1.5,
                    bgcolor: theme.colors.primary[500],
                    '&:hover': { bgcolor: theme.colors.primary[700] },
                  }}
                >
                  Add Employee
                </Button>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Button
                  variant="contained"
                  fullWidth
                  startIcon={<PaymentIcon />}
                  onClick={() => navigate('/pay')}
                  sx={{
                    py: 1.5,
                    bgcolor: theme.colors.warning[500],
                    '&:hover': { bgcolor: theme.colors.warning[700] },
                  }}
                >
                  Pay Employee
                </Button>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Button
                  variant="contained"
                  fullWidth
                  startIcon={<RepeatIcon />}
                  onClick={() => navigate('/recurring/setup')}
                  sx={{
                    py: 1.5,
                    bgcolor: theme.colors.secondary[500],
                    '&:hover': { bgcolor: theme.colors.secondary[700] },
                  }}
                >
                  Setup Recurring
                </Button>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Button
                  variant="outlined"
                  fullWidth
                  startIcon={<PeopleIcon />}
                  onClick={() => navigate('/employees')}
                  sx={{ py: 1.5 }}
                >
                  View Employees
                </Button>
              </Grid>
            </Grid>
          </Paper>

          {/* Recent Payment Activity */}
          <Box>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
              <ReceiptIcon sx={{ color: theme.colors.primary[500] }} />
              <Typography variant="h6" fontWeight={theme.typography.fontWeight.semibold}>
                Recent Payment Activity
              </Typography>
            </Stack>
            <PaymentHistorySection userRole="company" payments={mockPayments} maxRows={5} />
          </Box>
        </Stack>
      </Container>

      {/* Add Employee Modal */}
      <AddEmployeeModal
        open={addEmployeeModalOpen}
        onClose={() => setAddEmployeeModalOpen(false)}
        api={api}
        walletAddress={walletAddress}
        currentCompany={currentCompany.contractAddress}
        onSuccess={() => {
          // Modal will auto-close, state will update via observable
          console.log('[CompanyDashboard] Employee added, state will refresh automatically');
        }}
      />
    </Box>
  );
};
