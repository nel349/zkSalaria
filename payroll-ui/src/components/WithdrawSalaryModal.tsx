import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Stack,
  Box,
  Alert,
  IconButton,
  InputAdornment,
  Divider,
  CircularProgress,
  Paper,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { useTheme, useThemeValues } from '../theme';
import type { DeployedPayrollAPI } from '@zksalaria/payroll-api';

interface WithdrawSalaryModalProps {
  open: boolean;
  onClose: () => void;
  api: DeployedPayrollAPI | null;
  walletAddress: string | null;
  currentBalance: bigint;
  onSuccess?: () => void;
}

/**
 * Withdraw Salary Modal (Phase 2.6)
 * Allows employees to withdraw their earned salary to their wallet
 */
export const WithdrawSalaryModal: React.FC<WithdrawSalaryModalProps> = ({
  open,
  onClose,
  api,
  walletAddress,
  currentBalance,
  onSuccess,
}) => {
  const { mode } = useTheme();
  const theme = useThemeValues();

  // Form state
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  // Gas estimate (fixed for now)
  const GAS_FEE = 0.01; // $0.01

  // Reset form when modal opens (set to full balance)
  useEffect(() => {
    if (open) {
      const balanceInDollars = (Number(currentBalance) / 100).toFixed(2);
      setWithdrawAmount(balanceInDollars);
      setError(null);
      setShowSuccess(false);
    }
  }, [open, currentBalance]);

  // Set to max balance
  const handleSetMax = () => {
    const balanceInDollars = (Number(currentBalance) / 100).toFixed(2);
    setWithdrawAmount(balanceInDollars);
  };

  // Calculate withdrawal amount
  const getWithdrawalAmount = (): number => {
    return parseFloat(withdrawAmount) || 0;
  };

  // Calculate total cost
  const getTotalCost = (): string => {
    const withdrawal = getWithdrawalAmount();
    const total = withdrawal + GAS_FEE;
    return total.toFixed(2);
  };

  // Format balance
  const formatBalance = (balance: bigint): string => {
    return `$${(Number(balance) / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Validate form
  const isFormValid = (): boolean => {
    if (!walletAddress) return false;
    if (currentBalance === 0n) return false;

    const withdrawal = getWithdrawalAmount();
    if (withdrawal <= 0) return false;

    const balanceInDollars = Number(currentBalance) / 100;
    if (withdrawal > balanceInDollars) return false;

    return true;
  };

  // Handle withdrawal
  const handleWithdraw = async () => {
    if (!api || !walletAddress) {
      setError('Wallet not connected');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const amount = getWithdrawalAmount().toFixed(2);
      console.log(`[WithdrawSalaryModal] Withdrawing ${amount} to ${walletAddress}`);

      await api.withdrawEmployeeSalary(walletAddress, amount);

      console.log('[WithdrawSalaryModal] Withdrawal successful');
      setShowSuccess(true);

      // Close after success
      setTimeout(() => {
        onClose();
        onSuccess?.();
      }, 2000);
    } catch (err) {
      console.error('[WithdrawSalaryModal] Withdrawal failed:', err);
      let errorMessage = err instanceof Error ? err.message : 'Failed to withdraw salary';

      // Check for insufficient gas token error
      if (errorMessage.includes('Insufficient balance for token')) {
        errorMessage = 'Insufficient gas tokens in your wallet. Please add tokens to your wallet to pay for transaction fees, then try again.';
      }

      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Success modal content
  if (showSuccess) {
    return (
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: mode === 'dark' ? theme.colors.background.paper : '#FFFFFF',
            backgroundImage: 'none',
          },
        }}
      >
        <DialogContent>
          <Stack spacing={3} alignItems="center" py={4}>
            <Box
              sx={{
                width: 80,
                height: 80,
                borderRadius: '50%',
                bgcolor: theme.colors.success[50],
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <AccountBalanceWalletIcon sx={{ fontSize: 40, color: theme.colors.success[500] }} />
            </Box>
            <Typography variant="h5" fontWeight={theme.typography.fontWeight.bold} color={theme.colors.text.primary}>
              Withdrawal Successful!
            </Typography>
            <Typography variant="body1" color={theme.colors.text.secondary} textAlign="center">
              ${getWithdrawalAmount().toFixed(2)} has been withdrawn to your wallet
            </Typography>
          </Stack>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
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
            <AccountBalanceWalletIcon sx={{ fontSize: 28, color: theme.colors.primary[500] }} />
            <Box>
              <Typography variant="h6" fontWeight={theme.typography.fontWeight.semibold} color={theme.colors.text.primary}>
                Withdraw Salary
              </Typography>
              <Typography variant="caption" color={theme.colors.text.secondary}>
                Transfer earned salary to your wallet
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
        <Stack spacing={3} sx={{ mt: 2 }}>
          {/* Current Balance */}
          <Paper
            elevation={0}
            sx={{
              p: 2,
              bgcolor: mode === 'dark' ? theme.colors.background.default : theme.colors.primary[50],
              border: `1px solid ${theme.colors.border.default}`,
              borderRadius: 2,
            }}
          >
            <Typography variant="caption" color={theme.colors.text.secondary} sx={{ mb: 0.5 }}>
              Available Balance
            </Typography>
            <Typography variant="h5" fontWeight={theme.typography.fontWeight.bold} color={theme.colors.text.primary}>
              {formatBalance(currentBalance)}
            </Typography>
          </Paper>

          {/* Withdrawal Amount Input */}
          <Box>
            <Typography variant="body2" color={theme.colors.text.primary} sx={{ mb: 1 }}>
              Withdrawal Amount
            </Typography>
            <TextField
              fullWidth
              type="number"
              value={withdrawAmount}
              onChange={(e) => setWithdrawAmount(e.target.value)}
              placeholder="0.00"
              InputProps={{
                startAdornment: <InputAdornment position="start">$</InputAdornment>,
                endAdornment: (
                  <InputAdornment position="end">
                    <Button
                      size="small"
                      onClick={handleSetMax}
                      sx={{
                        minWidth: 'auto',
                        px: 1.5,
                        py: 0.5,
                        fontSize: '0.75rem',
                        textTransform: 'uppercase',
                        fontWeight: theme.typography.fontWeight.semibold,
                      }}
                    >
                      Max
                    </Button>
                  </InputAdornment>
                ),
              }}
              inputProps={{
                min: 0,
                max: Number(currentBalance) / 100,
                step: 0.01,
              }}
              helperText={`Available: ${formatBalance(currentBalance)}`}
              disabled={isSubmitting}
              autoFocus
            />
          </Box>

          {/* Destination Wallet */}
          <Box>
            <Typography variant="body2" color={theme.colors.text.primary} sx={{ mb: 1 }}>
              Destination Wallet
            </Typography>
            <Paper
              elevation={0}
              sx={{
                p: 2,
                bgcolor: mode === 'dark' ? theme.colors.background.default : theme.colors.background.paper,
                border: `1px solid ${theme.colors.border.default}`,
                borderRadius: 2,
              }}
            >
              <Typography
                variant="body2"
                sx={{
                  fontFamily: 'monospace',
                  wordBreak: 'break-all',
                  color: theme.colors.text.primary,
                }}
              >
                {walletAddress}
              </Typography>
            </Paper>
          </Box>

          {/* Summary */}
          <Paper
            elevation={0}
            sx={{
              p: 2,
              bgcolor: mode === 'dark' ? theme.colors.background.default : theme.colors.background.paper,
              border: `1px solid ${theme.colors.border.default}`,
              borderRadius: 2,
            }}
          >
            <Stack spacing={1}>
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2" color={theme.colors.text.secondary}>
                  Withdrawal Amount
                </Typography>
                <Typography variant="body2" color={theme.colors.text.primary}>
                  ${getWithdrawalAmount().toFixed(2)}
                </Typography>
              </Stack>
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2" color={theme.colors.text.secondary}>
                  Gas Fee (est.)
                </Typography>
                <Typography variant="body2" color={theme.colors.text.primary}>
                  ${GAS_FEE.toFixed(2)}
                </Typography>
              </Stack>
              <Divider />
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body1" fontWeight={theme.typography.fontWeight.semibold} color={theme.colors.text.primary}>
                  Total
                </Typography>
                <Typography variant="body1" fontWeight={theme.typography.fontWeight.bold} color={theme.colors.primary[500]}>
                  ${getTotalCost()}
                </Typography>
              </Stack>
            </Stack>
          </Paper>

          {/* Info Alert */}
          <Alert severity="info" icon={<InfoOutlinedIcon />}>
            <Typography variant="caption">
              Funds will be transferred to your connected wallet. This action cannot be undone.
            </Typography>
          </Alert>

          {/* Error Alert */}
          {error && (
            <Alert severity="error" onClose={() => setError(null)}>
              {error}
            </Alert>
          )}
        </Stack>
      </DialogContent>

      <Divider />

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleWithdraw}
          disabled={!isFormValid() || isSubmitting}
          startIcon={isSubmitting ? <CircularProgress size={16} /> : <AccountBalanceWalletIcon />}
        >
          {isSubmitting ? 'Processing...' : 'Withdraw'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
