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
import SettingsIcon from '@mui/icons-material/Settings';
import MenuIcon from '@mui/icons-material/Menu';
import IconButton from '@mui/material/IconButton';
import { useTheme, useThemeValues } from '../theme';
import { usePayrollWallet } from '../contexts/PayrollWalletContext';
import { PayrollAPI, type DeployedPayrollAPI } from '@zksalaria/payroll-api';
import { PaymentHistorySection } from './PaymentHistorySection';
import { RoleSwitcher, type ViewMode } from './RoleSwitcher';
import { WithdrawSalaryModal } from './WithdrawSalaryModal';
import { GenerateProofModal } from './GenerateProofModal';
import { EmployeeDashboardDrawer, type DashboardView } from './EmployeeDashboardDrawer';
import { MyIncomeProofsModal } from './MyIncomeProofsModal';
import { ProfileSettingsModal } from './ProfileSettingsModal';
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
  const [withdrawModalOpen, setWithdrawModalOpen] = useState(false);
  const [generateProofOpen, setGenerateProofOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [dashboardView, setDashboardView] = useState<DashboardView>('main');
  const [profileSettingsOpen, setProfileSettingsOpen] = useState(false);

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
        const subscription = connectedApi.state$.subscribe(async (state) => {
          // console.log('[EmployeeDashboard] State updated:', state);

          // Get decrypted balance from blockchain
          let employeeBalance = 0n;
          if (walletAddress) {
            try {
              employeeBalance = await connectedApi.getEmployeeBalance(walletAddress);
              // console.log('[EmployeeDashboard] Employee balance:', employeeBalance);
            } catch (err) {
              console.error('[EmployeeDashboard] Failed to get balance:', err);
            }
          }

          setStats((prev) => ({
            ...prev,
            currentBalance: employeeBalance,
            totalPaymentsThisYear: state.totalPayments,
            employmentStatus: 'Active',
            companyName: companyName,
          }));
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
      // Get payment history with decrypted amounts from blockchain
      const history = await apiInstance.getEmployeePaymentHistoryDecrypted(walletAddress);

      console.log(`[EmployeeDashboard] Payment history (on-chain decrypted):`, {
        contractPayments: history.length,
        walletAddress,
      });

      // Optional: Get payment metadata from localStorage for enhanced type labels
      const paymentsKey = `payroll-ui.payments.${contractAddress}`;
      const paymentMetadata = JSON.parse(localStorage.getItem(paymentsKey) || '[]');

      console.log(`[EmployeeDashboard] Looking for metadata:`, {
        key: paymentsKey,
        totalMetadata: paymentMetadata.length,
        walletAddress,
        allEmployeeIds: paymentMetadata.map((m: any) => m.employeeId),
      });

      const employeeMetas = paymentMetadata
        .filter((m: any) => m.employeeId === walletAddress)
        .sort((a: any, b: any) => a.timestamp - b.timestamp);

      console.log(`[EmployeeDashboard] Filtered metadata for employee:`, {
        matchedMetadata: employeeMetas.length,
        metadataDetails: employeeMetas.map((m: any) => ({
          paymentType: m.paymentType,
          amount: m.amount,
          employeeName: m.employeeName
        })),
      });

      // Map blockchain payment records to UI format
      const uiPayments = history.map((record: any, index: number) => {
        // Use decrypted amount from blockchain (primary source)
        const amount = record.decrypted_amount || 0n;

        // Use blockchain timestamp (convert from seconds to milliseconds)
        const timestamp = Number(record.timestamp) * 1000;
        const dateStr = new Date(timestamp).toISOString();

        // console.log(`[EmployeeDashboard] Payment ${index} timestamp:`, {
        //   rawTimestamp: record.timestamp,
        //   timestampType: typeof record.timestamp,
        //   timestampNumber: Number(record.timestamp),
        //   timestampMs: timestamp,
        //   dateISO: dateStr,
        //   dateObject: new Date(timestamp),
        // });

        const paymentId = Array.from(record.payment_id).map((b: number) => b.toString(16).padStart(2, '0')).join('').slice(0, 8);

        // Map blockchain payment_type to display string
        // 0=SALARY, 1=ADVANCE, 2=BONUS, 3=COMMISSION, 4=REIMBURSEMENT, 5=ADJUSTMENT, 6=WITHDRAWAL
        const getPaymentTypeLabel = (type: bigint): string => {
          switch (Number(type)) {
            case 0: return 'regularsalary';
            case 1: return 'advance';
            case 2: return 'bonus';
            case 3: return 'commission';
            case 4: return 'reimbursement';
            case 5: return 'adjustment';
            case 6: return 'withdrawal';
            default: return 'salary';
          }
        };

        const metadata = employeeMetas[index];
        const paymentType = getPaymentTypeLabel(record.payment_type);

        // console.log(`[EmployeeDashboard] Payment ${index}:`, {
        //   type: paymentType,
        //   metadataType: metadata?.paymentType,
        //   blockchainType: record.payment_type,
        //   amount,
        //   hasMetadata: !!metadata,
        // });

        return {
          id: `${walletAddress}-${index}`,
          status: record.status === 1n ? 'completed' : record.status === 0n ? 'pending' : 'failed',
          employeeName: metadata?.employeeName || walletAddress.substring(0, 12) + '...',
          employeeId: walletAddress,
          amount: amount, // Already in base units from blockchain
          encryptedAmount: record.encrypted_amount,
          isEncrypted: false, // Showing decrypted amounts from blockchain
          date: dateStr,
          type: paymentType,
          transactionId: Array.from(record.payment_id).map((b: number) => b.toString(16).padStart(2, '0')).join('').slice(0, 12),
          companyName: companyName,
        };
      });

      setPayments(uiPayments);
      console.log(`[EmployeeDashboard] Loaded ${uiPayments.length} payments from blockchain`);

      // Update stats with last payment info (most recent payment)
      if (uiPayments.length > 0) {
        // Sort by date descending to get most recent first
        const sortedPayments = [...uiPayments].sort((a, b) =>
          new Date(b.date).getTime() - new Date(a.date).getTime()
        );
        const lastPayment = sortedPayments[0];
        setStats((prev) => ({
          ...prev,
          lastPaymentAmount: lastPayment.amount,
          lastPaymentDate: lastPayment.date,
        }));
        console.log(`[EmployeeDashboard] Last payment:`, {
          amount: lastPayment.amount,
          date: lastPayment.date,
        });
      }
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
            {/* Left: Hamburger Menu & Title */}
            <Stack direction="row" alignItems="center" spacing={2}>
              <Button
                onClick={() => setDrawerOpen(true)}
                sx={{
                  minWidth: 'auto',
                  p: 1,
                  borderRadius: 2,
                  color: theme.colors.primary[500],
                  '&:hover': {
                    bgcolor: mode === 'dark' ? `${theme.colors.primary[500]}20` : theme.colors.primary[50],
                  },
                }}
              >
                <MenuIcon sx={{ fontSize: 28 }} />
              </Button>
              <BadgeIcon sx={{ fontSize: 32, color: theme.colors.primary[500] }} />
              <Box>
                <Typography variant="h5" fontWeight={theme.typography.fontWeight.bold} color={theme.colors.text.primary}>
                  {dashboardView === 'main' ? 'My Dashboard' : dashboardView === 'proofs' ? 'My Income Proofs' : 'Payment History'}
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
        {/* Error Alert */}
        {error && (
          <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Render different views based on dashboardView */}
        {dashboardView === 'main' ? (
          <Stack spacing={4}>
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
              <Grid item xs={12} sm={6} md={4}>
                <Button
                  variant="contained"
                  fullWidth
                  startIcon={<MonetizationOnIcon />}
                  onClick={() => setWithdrawModalOpen(true)}
                  disabled={stats.currentBalance === 0n}
                  sx={{
                    py: 1.5,
                    bgcolor: theme.colors.warning[500],
                    '&:hover': { bgcolor: theme.colors.warning[700] },
                  }}
                >
                  Withdraw Salary
                </Button>
              </Grid>

              <Grid item xs={12} sm={6} md={4}>
                <Button
                  variant="contained"
                  fullWidth
                  startIcon={<VerifiedIcon />}
                  onClick={() => setGenerateProofOpen(true)}
                  sx={{
                    py: 1.5,
                    bgcolor: theme.colors.secondary[500],
                    '&:hover': { bgcolor: theme.colors.secondary[700] },
                  }}
                >
                  Generate Proof
                </Button>
              </Grid>

              <Grid item xs={12} sm={6} md={4}>
                <Button
                  variant="contained"
                  fullWidth
                  startIcon={<VerifiedIcon />}
                  onClick={() => setDashboardView('proofs')}
                  sx={{
                    py: 1.5,
                    bgcolor: theme.colors.primary[500],
                    '&:hover': { bgcolor: theme.colors.primary[700] },
                  }}
                >
                  View My Proofs
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
            <PaymentHistorySection userRole="employee" payments={payments} maxRows={20} />
          </Box>
        </Stack>
        ) : null}
      </Container>

      {/* Navigation Drawer */}
      <EmployeeDashboardDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        currentView={dashboardView}
        onViewChange={setDashboardView}
        walletAddress={walletAddress || ''}
        onOpenSettings={() => setProfileSettingsOpen(true)}
      />

      {/* Withdraw Salary Modal */}
      <WithdrawSalaryModal
        open={withdrawModalOpen}
        onClose={() => setWithdrawModalOpen(false)}
        api={api}
        walletAddress={walletAddress}
        currentBalance={stats.currentBalance}
        onSuccess={() => {
          // Reload balance after successful withdrawal
          if (api && walletAddress) {
            api.getEmployeeBalance(walletAddress).then((balance) => {
              setStats((prev) => ({ ...prev, currentBalance: balance }));
            });
          }
        }}
      />

      {/* Generate Proof Modal (Phase 2.7 - Employee ZKML Income Verification) */}
      <GenerateProofModal
        open={generateProofOpen}
        onClose={() => setGenerateProofOpen(false)}
        employeeId={walletAddress || ''}
        employeeName={walletAddress ? `${walletAddress.substring(0, 12)}...` : 'Employee'}
        companyName={stats.companyName}
        api={api}
      />

      {/* My Income Proofs Modal - Shows all proof attempts (success + failure) */}
      <MyIncomeProofsModal
        open={dashboardView === 'proofs'}
        onClose={() => setDashboardView('main')}
        api={api}
        walletAddress={walletAddress || ''}
        employeeName={walletAddress ? `${walletAddress.substring(0, 12)}...` : 'Employee'}
      />

      {/* Profile Settings Modal */}
      <ProfileSettingsModal
        open={profileSettingsOpen}
        onClose={() => setProfileSettingsOpen(false)}
        isCompany={false}
        contractAddress={contractAddress}
        companyName={companyName}
      />
    </Box>
  );
};
