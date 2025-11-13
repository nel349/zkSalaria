import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  Alert,
  CircularProgress,
  Stack,
  InputAdornment,
} from '@mui/material';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import { useTheme, useThemeValues } from '../theme';
import type { DeployedPayrollAPI } from '@zksalaria/payroll-api';

interface FundAccountModalProps {
  open: boolean;
  onClose: () => void;
  api: DeployedPayrollAPI | null;
  currentCompany: string;
  onSuccess?: () => void;
}

/**
 * Fund Account Modal (Company Admin Only)
 *
 * Allows companies to deposit funds into their payroll account.
 * Funds are used to pay employees and must be deposited before making payments.
 */
export const FundAccountModal: React.FC<FundAccountModalProps> = ({
  open,
  onClose,
  api,
  currentCompany,
  onSuccess,
}) => {
  const { mode } = useTheme();
  const theme = useThemeValues();

  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleFund = async () => {
    if (!api) {
      setError('API not connected');
      return;
    }

    const amountNum = parseFloat(amount);
    if (!amount.trim() || isNaN(amountNum) || amountNum <= 0) {
      setError('Please enter a valid positive amount');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      console.log('[FundAccount] Depositing funds:', {
        companyId: currentCompany,
        amount: amountNum,
      });

      await api.depositCompanyFunds(currentCompany, amount);

      console.log('[FundAccount] ✅ Funds deposited successfully');
      setSuccess(true);
      setAmount('');

      // Auto-close after 2 seconds
      setTimeout(() => {
        setSuccess(false);
        onClose();
        onSuccess?.();
      }, 2000);
    } catch (err: any) {
      console.error('[FundAccount] Failed to deposit funds:', err);
      setError(err.message || 'Failed to deposit funds');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setAmount('');
      setError(null);
      setSuccess(false);
      onClose();
    }
  };

  // Suggested amounts for quick selection
  const suggestedAmounts = [1000, 5000, 10000, 25000, 50000, 100000];

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          bgcolor: mode === 'dark' ? theme.colors.background.paper : '#FFFFFF',
        },
      }}
    >
      <DialogTitle>
        <Stack direction="row" alignItems="center" spacing={1}>
          <AccountBalanceWalletIcon sx={{ color: theme.colors.primary[500] }} />
          <Typography variant="h6" fontWeight={theme.typography.fontWeight.semibold}>
            Fund Payroll Account
          </Typography>
        </Stack>
        <Typography variant="body2" color={theme.colors.text.secondary} sx={{ mt: 1 }}>
          Deposit funds to pay your employees
        </Typography>
      </DialogTitle>

      <DialogContent>
        <Stack spacing={3} sx={{ mt: 2 }}>
          {/* Info Alert */}
          <Alert severity="info" sx={{ borderRadius: 2 }}>
            <Typography variant="body2">
              <strong>Note:</strong> Deposited funds will be added to your payroll account balance
              and can be used to pay employees. Amounts are in dollars (USD).
            </Typography>
          </Alert>

          {/* Amount Input */}
          <TextField
            label="Amount"
            placeholder="Enter amount in dollars"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            fullWidth
            type="number"
            disabled={loading || success}
            error={!!error && !success}
            helperText={
              error && !success
                ? error
                : 'Enter the amount you want to deposit into your payroll account'
            }
            InputProps={{
              startAdornment: <InputAdornment position="start">$</InputAdornment>,
            }}
            sx={{
              '& input::-webkit-outer-spin-button, & input::-webkit-inner-spin-button': {
                display: 'none',
              },
              '& input[type=number]': {
                MozAppearance: 'textfield',
              },
            }}
          />

          {/* Suggested Amounts */}
          <Box>
            <Typography
              variant="caption"
              color={theme.colors.text.secondary}
              sx={{ mb: 1, display: 'block' }}
            >
              Quick amounts:
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              {suggestedAmounts.map((suggested) => (
                <Button
                  key={suggested}
                  size="small"
                  variant="outlined"
                  disabled={loading || success}
                  onClick={() => setAmount(suggested.toString())}
                  sx={{
                    borderRadius: 2,
                    textTransform: 'none',
                    fontSize: '0.875rem',
                    px: 2,
                    borderColor: theme.colors.primary[500],
                    color: theme.colors.primary[500],
                    '&:hover': {
                      borderColor: theme.colors.primary[700],
                      bgcolor: `${theme.colors.primary[500]}10`,
                    },
                  }}
                >
                  ${suggested.toLocaleString()}
                </Button>
              ))}
            </Stack>
          </Box>

          {/* Success Alert */}
          {success && (
            <Alert severity="success" sx={{ borderRadius: 2 }}>
              ✅ Funds deposited successfully! Closing...
            </Alert>
          )}

          {/* Error Alert */}
          {error && !success && (
            <Alert severity="error" sx={{ borderRadius: 2 }}>
              {error}
            </Alert>
          )}
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleFund}
          disabled={loading || success || !amount.trim()}
          startIcon={loading ? <CircularProgress size={16} /> : <AccountBalanceWalletIcon />}
          sx={{
            bgcolor: theme.colors.primary[500],
            '&:hover': { bgcolor: theme.colors.primary[700] },
          }}
        >
          {loading ? 'Depositing...' : 'Deposit Funds'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
