// @ts-nocheck - MUI compatibility
import React, { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Alert,
  Collapse,
  Stack,
  Tooltip,
} from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PendingIcon from '@mui/icons-material/Pending';
import ErrorIcon from '@mui/icons-material/Error';
import LockIcon from '@mui/icons-material/Lock';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VerifiedIcon from '@mui/icons-material/Verified';
import DownloadIcon from '@mui/icons-material/Download';
import ReceiptIcon from '@mui/icons-material/Receipt';
import { useTheme, useThemeValues } from '../theme';

type PaymentStatus = 'completed' | 'pending' | 'failed';
type PaymentType = 'salary' | 'bonus' | 'advance' | 'withdrawal';
type UserRole = 'company' | 'employee';

interface PaymentRecord {
  id: string;
  status: PaymentStatus;
  employeeName: string;
  employeeId: string;
  amount: bigint;
  isEncrypted: boolean;
  date: string;
  type: PaymentType;
  transactionId: string;
}

interface PaymentHistorySectionProps {
  userRole: UserRole;
  payments: PaymentRecord[];
  maxRows?: number;
}

/**
 * Payment History Section (Phase 3.3)
 * Embedded payment list for dashboard - shows recent payments
 */
export const PaymentHistorySection: React.FC<PaymentHistorySectionProps> = ({
  userRole,
  payments,
  maxRows = 10,
}) => {
  const { mode } = useTheme();
  const theme = useThemeValues();

  // Decryption state (employee view)
  const [decryptedAmounts, setDecryptedAmounts] = useState<Map<string, bigint>>(new Map());
  const [showPrivacyBanner, setShowPrivacyBanner] = useState(userRole === 'employee');

  // Actions menu
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedPayment, setSelectedPayment] = useState<PaymentRecord | null>(null);

  // Get recent payments (limited by maxRows)
  const recentPayments = useMemo(() => {
    return [...payments]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, maxRows);
  }, [payments, maxRows]);

  // Format amount
  const formatAmount = (amount: bigint, paymentId: string, isEncrypted: boolean): string => {
    if (isEncrypted && !decryptedAmounts.has(paymentId)) {
      return '••••••';
    }
    const actualAmount = decryptedAmounts.get(paymentId) || amount;
    return `$${(Number(actualAmount) / 100).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  // Decrypt amount toggle
  const handleDecryptAmount = (payment: PaymentRecord) => {
    if (decryptedAmounts.has(payment.id)) {
      const newMap = new Map(decryptedAmounts);
      newMap.delete(payment.id);
      setDecryptedAmounts(newMap);
    } else {
      const newMap = new Map(decryptedAmounts);
      newMap.set(payment.id, payment.amount);
      setDecryptedAmounts(newMap);
    }
  };

  // Decrypt all amounts
  const handleDecryptAll = () => {
    const newMap = new Map<string, bigint>();
    recentPayments.forEach((p) => {
      if (p.isEncrypted) {
        newMap.set(p.id, p.amount);
      }
    });
    setDecryptedAmounts(newMap);
  };

  // Format date
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return '1 day ago';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Status badge
  const renderStatusBadge = (status: PaymentStatus) => {
    const statusConfig = {
      completed: {
        icon: <CheckCircleIcon sx={{ fontSize: 14 }} />,
        label: 'Completed',
        color: theme.colors.success[500],
        bg: mode === 'dark' ? theme.colors.success[900] : theme.colors.success[100],
      },
      pending: {
        icon: <PendingIcon sx={{ fontSize: 14 }} />,
        label: 'Pending',
        color: theme.colors.warning[500],
        bg: mode === 'dark' ? theme.colors.warning[900] : theme.colors.warning[100],
      },
      failed: {
        icon: <ErrorIcon sx={{ fontSize: 14 }} />,
        label: 'Failed',
        color: theme.colors.error[500],
        bg: mode === 'dark' ? theme.colors.error[900] : theme.colors.error[100],
      },
    };

    const config = statusConfig[status];
    return (
      <Chip
        icon={config.icon}
        label={config.label}
        size="small"
        sx={{
          bgcolor: config.bg,
          color: config.color,
          fontWeight: theme.typography.fontWeight.semibold,
        }}
      />
    );
  };

  // Type badge
  const renderTypeBadge = (type: PaymentType) => {
    const typeLabels = {
      salary: 'Salary',
      bonus: 'Bonus',
      advance: 'Advance',
      withdrawal: 'Withdrawal',
    };
    return (
      <Chip
        label={typeLabels[type]}
        size="small"
        sx={{
          bgcolor: mode === 'dark' ? theme.colors.primary[900] : theme.colors.primary[100],
          color: theme.colors.primary[500],
        }}
      />
    );
  };

  // Actions menu
  const handleOpenMenu = (event: React.MouseEvent<HTMLElement>, payment: PaymentRecord) => {
    setAnchorEl(event.currentTarget);
    setSelectedPayment(payment);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
  };

  const handleViewDetails = () => {
    handleCloseMenu();
    // TODO: Phase 3.4 - Open payment detail modal
    console.log('[PaymentHistory] View details:', selectedPayment?.id);
  };

  const handleGenerateProof = () => {
    handleCloseMenu();
    // TODO: Phase 4 - Open proof generation
    console.log('[PaymentHistory] Generate proof:', selectedPayment?.id);
  };

  const handleDownloadReceipt = () => {
    handleCloseMenu();
    // TODO: Phase 4 - Download receipt
    console.log('[PaymentHistory] Download receipt:', selectedPayment?.id);
  };

  if (recentPayments.length === 0) {
    return (
      <Paper
        elevation={2}
        sx={{
          p: 4,
          borderRadius: 3,
          bgcolor: mode === 'dark' ? theme.colors.background.paper : '#FFFFFF',
          textAlign: 'center',
        }}
      >
        <ReceiptIcon sx={{ fontSize: 60, color: theme.colors.text.disabled, mb: 2 }} />
        <Typography variant="h6" color={theme.colors.text.secondary} sx={{ mb: 1 }}>
          No Payment History
        </Typography>
        <Typography variant="body2" color={theme.colors.text.disabled}>
          {userRole === 'company'
            ? 'Payment transactions will appear here after you pay employees'
            : 'Your salary payments will appear here'}
        </Typography>
      </Paper>
    );
  }

  return (
    <Box>
      {/* Privacy Banner (Employee View) */}
      {userRole === 'employee' && showPrivacyBanner && (
        <Collapse in={showPrivacyBanner}>
          <Alert
            severity="info"
            icon={<LockIcon />}
            onClose={() => setShowPrivacyBanner(false)}
            sx={{ mb: 2 }}
          >
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <Typography variant="body2">
                🔒 Your salary amounts are encrypted. Click 🔓 to decrypt locally.
              </Typography>
              <Typography
                variant="body2"
                onClick={handleDecryptAll}
                sx={{
                  color: theme.colors.info[500],
                  cursor: 'pointer',
                  textDecoration: 'underline',
                  ml: 2,
                }}
              >
                Decrypt All
              </Typography>
            </Stack>
          </Alert>
        </Collapse>
      )}

      {/* Payment Table */}
      <TableContainer
        component={Paper}
        elevation={2}
        sx={{
          borderRadius: 3,
          bgcolor: mode === 'dark' ? theme.colors.background.paper : '#FFFFFF',
        }}
      >
        <Table size="small">
          <TableHead>
            <TableRow
              sx={{ bgcolor: mode === 'dark' ? theme.colors.background.surface : theme.colors.primary[50] }}
            >
              <TableCell sx={{ fontWeight: theme.typography.fontWeight.bold }}>Status</TableCell>
              <TableCell sx={{ fontWeight: theme.typography.fontWeight.bold }}>
                {userRole === 'company' ? 'Employee' : 'Company'}
              </TableCell>
              <TableCell sx={{ fontWeight: theme.typography.fontWeight.bold }}>Amount</TableCell>
              <TableCell sx={{ fontWeight: theme.typography.fontWeight.bold }}>Date</TableCell>
              <TableCell sx={{ fontWeight: theme.typography.fontWeight.bold }}>Type</TableCell>
              <TableCell sx={{ fontWeight: theme.typography.fontWeight.bold }} align="center">
                Actions
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {recentPayments.map((payment) => (
              <TableRow
                key={payment.id}
                hover
                sx={{
                  '&:hover': {
                    bgcolor: mode === 'dark' ? 'rgba(0, 217, 255, 0.05)' : 'rgba(0, 217, 255, 0.05)',
                    borderLeft: `3px solid ${theme.colors.secondary[500]}`,
                  },
                }}
              >
                <TableCell>{renderStatusBadge(payment.status)}</TableCell>
                <TableCell>
                  <Typography variant="body2" fontWeight={theme.typography.fontWeight.semibold}>
                    {payment.employeeName}
                  </Typography>
                  <Typography
                    variant="caption"
                    color={theme.colors.text.disabled}
                    sx={{ fontFamily: 'monospace' }}
                  >
                    {payment.employeeId.slice(0, 8)}...
                  </Typography>
                </TableCell>
                <TableCell>
                  <Stack direction="row" alignItems="center" spacing={0.5}>
                    <Typography variant="body2" fontWeight={theme.typography.fontWeight.semibold}>
                      {formatAmount(payment.amount, payment.id, payment.isEncrypted)}
                    </Typography>
                    {payment.isEncrypted && (
                      <Tooltip title={decryptedAmounts.has(payment.id) ? 'Encrypt' : 'Decrypt'}>
                        <IconButton size="small" onClick={() => handleDecryptAmount(payment)}>
                          {decryptedAmounts.has(payment.id) ? (
                            <LockOpenIcon sx={{ fontSize: 14, color: theme.colors.success[500] }} />
                          ) : (
                            <LockIcon sx={{ fontSize: 14, color: theme.colors.text.disabled }} />
                          )}
                        </IconButton>
                      </Tooltip>
                    )}
                  </Stack>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" color={theme.colors.text.secondary}>
                    {formatDate(payment.date)}
                  </Typography>
                </TableCell>
                <TableCell>{renderTypeBadge(payment.type)}</TableCell>
                <TableCell align="center">
                  <Tooltip title="Actions">
                    <IconButton size="small" onClick={(e) => handleOpenMenu(e, payment)}>
                      <MoreVertIcon sx={{ fontSize: 18 }} />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Actions Menu */}
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleCloseMenu}>
        <MenuItem onClick={handleViewDetails}>
          <VisibilityIcon sx={{ mr: 1, fontSize: 18 }} />
          View Details
        </MenuItem>
        <MenuItem onClick={handleGenerateProof}>
          <VerifiedIcon sx={{ mr: 1, fontSize: 18 }} />
          Generate Proof
        </MenuItem>
        <MenuItem onClick={handleDownloadReceipt}>
          <DownloadIcon sx={{ mr: 1, fontSize: 18 }} />
          Download Receipt
        </MenuItem>
      </Menu>
    </Box>
  );
};
