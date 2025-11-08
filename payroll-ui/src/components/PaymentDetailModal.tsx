import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Stack,
  Paper,
  Divider,
  Chip,
  IconButton,
  Tabs,
  Tab,
  Grid,
  Table,
  TableBody,
  TableRow,
  TableCell,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PendingIcon from '@mui/icons-material/Pending';
import ErrorIcon from '@mui/icons-material/Error';
import DownloadIcon from '@mui/icons-material/Download';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import PersonIcon from '@mui/icons-material/Person';
import BusinessIcon from '@mui/icons-material/Business';
import { useTheme, useThemeValues } from '../theme';

interface PaymentDetailModalProps {
  open: boolean;
  onClose: () => void;
  payment: {
    id: string;
    status: string;
    employeeName: string;
    employeeId: string;
    amount: number | bigint;
    isEncrypted?: boolean;
    encryptedAmount?: Uint8Array;
    date: string;
    type: string;
    transactionId: string;
    companyName?: string;
  } | null;
  userRole: 'company' | 'employee';
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`payment-detail-tabpanel-${index}`}
      aria-labelledby={`payment-detail-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

/**
 * Payment Detail Modal (Phase 3.4)
 * Detailed view of a payment with tabbed information
 */
export const PaymentDetailModal: React.FC<PaymentDetailModalProps> = ({
  open,
  onClose,
  payment,
  userRole,
}) => {
  const { mode } = useTheme();
  const theme = useThemeValues();
  const [currentTab, setCurrentTab] = useState(0);

  if (!payment) return null;

  const isWithdrawal = payment.type.toLowerCase() === 'withdrawal';

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

  const formatAmount = (amount: number | bigint, showSign = false): string => {
    const numAmount = typeof amount === 'bigint' ? Number(amount) / 100 : amount;
    const sign = showSign && isWithdrawal ? '-' : '';
    return `${sign}$${numAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusIcon = () => {
    switch (payment.status) {
      case 'completed':
        return <CheckCircleIcon sx={{ color: theme.colors.success[500] }} />;
      case 'pending':
        return <PendingIcon sx={{ color: theme.colors.warning[500] }} />;
      case 'failed':
        return <ErrorIcon sx={{ color: theme.colors.error[500] }} />;
      default:
        return <CheckCircleIcon sx={{ color: theme.colors.text.disabled }} />;
    }
  };

  const getStatusColor = (): 'success' | 'warning' | 'error' | 'default' => {
    switch (payment.status) {
      case 'completed':
        return 'success';
      case 'pending':
        return 'warning';
      case 'failed':
        return 'error';
      default:
        return 'default';
    }
  };

  const getTypeLabel = (type: string): string => {
    const types: Record<string, string> = {
      salary: 'Regular Salary',
      regularsalary: 'Regular Salary',
      advance: 'Salary Advance',
      bonus: 'Bonus',
      commission: 'Commission',
      reimbursement: 'Reimbursement',
      adjustment: 'Adjustment',
      withdrawal: 'Withdrawal',
    };
    return types[type.toLowerCase()] || type;
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          bgcolor: mode === 'dark' ? theme.colors.background.paper : '#FFFFFF',
          backgroundImage: 'none',
        },
      }}
    >
      <DialogTitle>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Stack direction="row" alignItems="center" spacing={2}>
            <ReceiptLongIcon sx={{ fontSize: 28, color: theme.colors.primary[500] }} />
            <Box>
              <Typography variant="h6" fontWeight={theme.typography.fontWeight.semibold} color={theme.colors.text.primary}>
                {isWithdrawal ? 'Withdrawal Details' : 'Payment Details'}
              </Typography>
              <Typography variant="caption" color={theme.colors.text.secondary}>
                Transaction #{payment.transactionId}
              </Typography>
            </Box>
          </Stack>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Stack>
      </DialogTitle>

      <Divider />

      <DialogContent>
        <Stack spacing={3}>
          {/* Visual Payment Card */}
          <Paper
            elevation={3}
            sx={{
              p: 4,
              borderRadius: 3,
              background: `linear-gradient(135deg, ${theme.colors.primary[500]}, ${theme.colors.secondary[500]})`,
              color: '#FFFFFF',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <Box
              sx={{
                position: 'absolute',
                top: -50,
                right: -50,
                width: 200,
                height: 200,
                borderRadius: '50%',
                bgcolor: 'rgba(255, 255, 255, 0.1)',
              }}
            />
            <Stack spacing={2} position="relative" zIndex={1}>
              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Stack direction="row" alignItems="center" spacing={1}>
                  {getStatusIcon()}
                  <Chip
                    label={<Typography>{payment.status.toUpperCase()}</Typography>}
                    size="small"
                    sx={{
                      bgcolor: 'rgba(255, 255, 255, 0.2)',
                      color: '#FFFFFF',
                      fontWeight: theme.typography.fontWeight.bold,
                    }}
                  />
                </Stack>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  {formatDate(payment.date)}
                </Typography>
              </Stack>

              <Box>
                <Typography
                  variant="h3"
                  fontWeight={theme.typography.fontWeight.bold}
                  sx={{ color: isWithdrawal ? '#ffcccc' : '#FFFFFF' }}
                >
                  {payment.isEncrypted ? '********' : formatAmount(payment.amount, true)}
                </Typography>
                <Typography variant="body1" sx={{ mt: 0.5, opacity: 0.9 }}>
                  {getTypeLabel(payment.type)}
                </Typography>
              </Box>

              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Stack>
                  <Typography variant="caption" sx={{ opacity: 0.8 }}>
                    {isWithdrawal ? 'Destination' : (userRole === 'company' ? 'Employee' : 'From')}
                  </Typography>
                  <Typography variant="body2" fontWeight={theme.typography.fontWeight.semibold}>
                    {isWithdrawal
                      ? 'Your Wallet'
                      : (userRole === 'company' ? payment.employeeName : (payment.companyName || 'N/A'))
                    }
                  </Typography>
                </Stack>
                <AccountBalanceWalletIcon sx={{ fontSize: 32, opacity: 0.3 }} />
              </Stack>
            </Stack>
          </Paper>

          {/* Tabbed Details */}
          <Box>
            <Tabs
              value={currentTab}
              onChange={handleTabChange}
              aria-label="payment detail tabs"
              sx={{
                borderBottom: `1px solid ${theme.colors.border.default}`,
                '& .MuiTab-root': {
                  color: theme.colors.text.secondary,
                  '&.Mui-selected': {
                    color: theme.colors.primary[500],
                  },
                },
              }}
            >
              <Tab label="Overview" />
              <Tab label="Transaction Details" />
              <Tab label="History" />
            </Tabs>

            {/* Tab 1: Overview */}
            <TabPanel value={currentTab} index={0}>
              <Grid container spacing={2}>
                <Grid size={{ xs: 6 }}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2,
                      bgcolor: mode === 'dark' ? theme.colors.background.default : theme.colors.background.paper,
                      border: `1px solid ${theme.colors.border.default}`,
                      borderRadius: 2,
                    }}
                  >
                    <Stack direction="row" alignItems="center" spacing={1} mb={1}>
                      {isWithdrawal ? (
                        <AccountBalanceWalletIcon sx={{ fontSize: 20, color: theme.colors.text.secondary }} />
                      ) : (
                        <PersonIcon sx={{ fontSize: 20, color: theme.colors.text.secondary }} />
                      )}
                      <Typography variant="caption" color={theme.colors.text.secondary}>
                        {isWithdrawal ? 'Destination' : (userRole === 'company' ? 'Employee' : 'From')}
                      </Typography>
                    </Stack>
                    <Typography variant="body1" fontWeight={theme.typography.fontWeight.semibold} color={theme.colors.text.primary}>
                      {isWithdrawal ? 'Your Wallet' : payment.employeeName}
                    </Typography>
                    <Typography variant="caption" color={theme.colors.text.disabled}>
                      {isWithdrawal ? 'Transferred to connected wallet' : `${payment.employeeId.substring(0, 12)}...`}
                    </Typography>
                  </Paper>
                </Grid>

                <Grid size={{ xs: 6 }}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2,
                      bgcolor: mode === 'dark' ? theme.colors.background.default : theme.colors.background.paper,
                      border: `1px solid ${theme.colors.border.default}`,
                      borderRadius: 2,
                    }}
                  >
                    <Stack direction="row" alignItems="center" spacing={1} mb={1}>
                      <CalendarTodayIcon sx={{ fontSize: 20, color: theme.colors.text.secondary }} />
                      <Typography variant="caption" color={theme.colors.text.secondary}>
                        {isWithdrawal ? 'Withdrawal Date' : 'Payment Date'}
                      </Typography>
                    </Stack>
                    <Typography variant="body1" fontWeight={theme.typography.fontWeight.semibold} color={theme.colors.text.primary}>
                      {new Date(payment.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </Typography>
                    <Typography variant="caption" color={theme.colors.text.disabled}>
                      {new Date(payment.date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    </Typography>
                  </Paper>
                </Grid>

                <Grid size={{ xs: 12 }}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2,
                      bgcolor: mode === 'dark' ? theme.colors.background.default : theme.colors.background.paper,
                      border: `1px solid ${theme.colors.border.default}`,
                      borderRadius: 2,
                    }}
                  >
                    <Stack direction="row" alignItems="center" spacing={1} mb={1}>
                      <VerifiedUserIcon sx={{ fontSize: 20, color: theme.colors.success[500] }} />
                      <Typography variant="caption" color={theme.colors.text.secondary}>
                        {isWithdrawal ? 'Withdrawal Status' : 'Payment Status'}
                      </Typography>
                    </Stack>
                    <Chip
                      label={<Typography>{payment.status.toUpperCase()}</Typography>}
                      color={getStatusColor()}
                      size="small"
                      sx={{ fontWeight: theme.typography.fontWeight.semibold }}
                    />
                    {payment.status === 'completed' && (
                      <Typography variant="caption" color={theme.colors.text.secondary} sx={{ ml: 2 }}>
                        {isWithdrawal ? 'Withdrawal successfully processed' : 'Payment successfully processed'}
                      </Typography>
                    )}
                  </Paper>
                </Grid>
              </Grid>
            </TabPanel>

            {/* Tab 2: Transaction Details */}
            <TabPanel value={currentTab} index={1}>
              <Table>
                <TableBody>
                  <TableRow>
                    <TableCell sx={{ color: theme.colors.text.secondary, border: 'none' }}>
                      Transaction ID
                    </TableCell>
                    <TableCell sx={{ fontFamily: 'monospace', border: 'none', color: theme.colors.text.primary }}>
                      {payment.transactionId}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell sx={{ color: theme.colors.text.secondary, border: 'none' }}>
                      {isWithdrawal ? 'Transaction Type' : 'Payment Type'}
                    </TableCell>
                    <TableCell sx={{ border: 'none', color: theme.colors.text.primary }}>
                      {getTypeLabel(payment.type)}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell sx={{ color: theme.colors.text.secondary, border: 'none' }}>
                      Amount
                    </TableCell>
                    <TableCell sx={{ border: 'none', color: theme.colors.text.primary }}>
                      {payment.isEncrypted ? (
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <Typography>********</Typography>
                          <Chip label="Encrypted" size="small" color="warning" />
                        </Stack>
                      ) : (
                        <Typography
                          fontWeight={theme.typography.fontWeight.bold}
                          sx={{ color: isWithdrawal ? theme.colors.error[500] : theme.colors.text.primary }}
                        >
                          {formatAmount(payment.amount, true)}
                        </Typography>
                      )}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell sx={{ color: theme.colors.text.secondary, border: 'none' }}>
                      Status
                    </TableCell>
                    <TableCell sx={{ border: 'none' }}>
                      <Chip label={payment.status.toUpperCase()} color={getStatusColor()} size="small" />
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell sx={{ color: theme.colors.text.secondary, border: 'none' }}>
                      Timestamp
                    </TableCell>
                    <TableCell sx={{ border: 'none', color: theme.colors.text.primary }}>
                      {formatDate(payment.date)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TabPanel>

            {/* Tab 3: History */}
            <TabPanel value={currentTab} index={2}>
              <Stack spacing={2}>
                <Box>
                  <Typography variant="body2" color={theme.colors.text.secondary} mb={2}>
                    {isWithdrawal ? 'Withdrawal Timeline' : 'Payment Timeline'}
                  </Typography>
                  <Stack spacing={2}>
                    <Box
                      sx={{
                        p: 2,
                        bgcolor: mode === 'dark' ? theme.colors.background.default : theme.colors.background.paper,
                        border: `1px solid ${theme.colors.border.default}`,
                        borderRadius: 2,
                        borderLeft: `4px solid ${theme.colors.success[500]}`,
                      }}
                    >
                      <Stack direction="row" alignItems="center" justifyContent="space-between">
                        <Typography variant="body2" fontWeight={theme.typography.fontWeight.semibold} color={theme.colors.text.primary}>
                          {isWithdrawal
                            ? `Withdrawal ${payment.status === 'completed' ? 'Completed' : 'Initiated'}`
                            : `Payment ${payment.status === 'completed' ? 'Completed' : 'Initiated'}`
                          }
                        </Typography>
                        <Typography variant="caption" color={theme.colors.text.disabled}>
                          {formatDate(payment.date)}
                        </Typography>
                      </Stack>
                      <Typography variant="caption" color={theme.colors.text.secondary} sx={{ mt: 0.5 }}>
                        {isWithdrawal
                          ? 'Funds transferred to your wallet on Midnight Network'
                          : 'Transaction processed on Midnight Network'
                        }
                      </Typography>
                    </Box>
                  </Stack>
                </Box>
              </Stack>
            </TabPanel>
          </Box>
        </Stack>
      </DialogContent>

      <Divider />

      <DialogActions sx={{ p: 2 }}>
        <Button
          variant="outlined"
          startIcon={<DownloadIcon />}
          onClick={() => {
            // TODO: Implement download receipt functionality (Phase 2.8)
            console.log('[PaymentDetail] Download receipt for payment:', payment.id);
          }}
        >
          Download Receipt
        </Button>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};
