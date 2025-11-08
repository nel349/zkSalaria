import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Stack,
  CircularProgress,
  Alert,
  Typography,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Select,
  MenuItem,
  Divider,
  Autocomplete,
  Chip,
} from '@mui/material';
import PaymentIcon from '@mui/icons-material/Payment';
import PersonIcon from '@mui/icons-material/Person';
import WarningIcon from '@mui/icons-material/Warning';
import { useThemeValues } from '../theme';
import { type DeployedPayrollAPI } from '@zksalaria/payroll-api';
import { ToastNotification } from './ToastNotification';
import { type PaymentMetadata, type EmployeeMetadata } from '../types/payment';

interface PayEmployeeModalProps {
  open: boolean;
  onClose: () => void;
  api: DeployedPayrollAPI | null;
  walletAddress: string | null;
  currentCompany: string;
  employees: EmployeeMetadata[];
  onSuccess?: () => void;
}

const PAYMENT_TYPES = [
  'Regular Salary',
  'Bonus',
  'Commission',
  'Reimbursement',
  'Advance',
  'Adjustment',
];

/**
 * Pay Employee Modal (Phase 2.2)
 * Modal for one-time employee payments
 */
export const PayEmployeeModal: React.FC<PayEmployeeModalProps> = ({
  open,
  onClose,
  api,
  walletAddress,
  currentCompany,
  employees,
  onSuccess,
}) => {
  const theme = useThemeValues();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Toast notification state
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastSeverity, setToastSeverity] = useState<'success' | 'error'>('success');

  // Form state
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeMetadata | null>(null);
  const [amountType, setAmountType] = useState<'base' | 'custom'>('base');
  const [customAmount, setCustomAmount] = useState('');
  const [paymentType, setPaymentType] = useState('Regular Salary');
  const [memo, setMemo] = useState('');

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      setSelectedEmployee(null);
      setAmountType('custom');
      setCustomAmount('');
      setPaymentType('Regular Salary');
      setMemo('');
      setError(null);
    }
  }, [open]);

  // Switch to custom when employee without base salary is selected
  useEffect(() => {
    if (selectedEmployee && !selectedEmployee.baseSalary && amountType === 'base') {
      setAmountType('custom');
    }
  }, [selectedEmployee, amountType]);

  // Calculate payment amount
  const getPaymentAmount = (): string => {
    if (amountType === 'base' && selectedEmployee?.baseSalary) {
      return selectedEmployee.baseSalary;
    }
    return customAmount;
  };

  // Calculate gas fee (mock for now)
  const getGasFee = (): string => {
    return '0.01';
  };

  // Calculate total cost
  const getTotalCost = (): string => {
    const amount = parseFloat(getPaymentAmount() || '0');
    const gas = parseFloat(getGasFee());
    return (amount + gas).toFixed(2);
  };

  // Validate form
  const isFormValid = (): boolean => {
    if (!selectedEmployee) return false;
    const amount = getPaymentAmount();
    if (!amount || parseFloat(amount) <= 0) return false;
    return true;
  };

  // Map payment type to contract enum
  const mapPaymentType = (type: string): bigint => {
    switch (type) {
      case 'Regular Salary':
        return 0n; // PAYMENT_TYPE_SALARY
      case 'Advance':
        return 1n; // PAYMENT_TYPE_ADVANCE
      case 'Bonus':
        return 2n; // PAYMENT_TYPE_BONUS
      case 'Commission':
        return 3n; // PAYMENT_TYPE_COMMISSION
      case 'Reimbursement':
        return 4n; // PAYMENT_TYPE_REIMBURSEMENT
      case 'Adjustment':
        return 5n; // PAYMENT_TYPE_ADJUSTMENT
      default:
        return 0n; // Default to SALARY
    }
  };

  // Handle payment submission
  const handlePayment = async () => {
    if (!api || !selectedEmployee || !currentCompany) {
      setError('Missing required data');
      return;
    }

    const amount = getPaymentAmount();
    if (!amount || parseFloat(amount) <= 0) {
      setError('Invalid payment amount');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      console.log(`[PayEmployeeModal] Paying ${amount} to ${selectedEmployee.name}`);

      // Call smart contract (API expects string amount in dollars, will convert internally)
      await api.payEmployee(
        currentCompany,
        selectedEmployee.employeeId,
        amount,
        Number(mapPaymentType(paymentType))
      );

      // Store payment metadata in localStorage for company view (so they can see amounts)
      const paymentMetadata: PaymentMetadata = {
        employeeId: selectedEmployee.employeeId,
        employeeName: selectedEmployee.name,
        amount: parseFloat(amount),
        paymentType: paymentType,
        memo: memo,
        timestamp: Date.now(),
        companyId: currentCompany,
      };
      const paymentsKey = `payroll-ui.payments.${currentCompany}`;
      const existingPayments: PaymentMetadata[] = JSON.parse(localStorage.getItem(paymentsKey) || '[]');
      existingPayments.push(paymentMetadata);
      localStorage.setItem(paymentsKey, JSON.stringify(existingPayments));

      console.log('[PayEmployeeModal] Payment successful');

      // Show success toast
      setToastMessage(`Successfully paid $${amount} to ${selectedEmployee.name}`);
      setToastSeverity('success');
      setToastOpen(true);

      // Close modal and reset
      resetForm();
      onClose();
      onSuccess?.();
    } catch (err) {
      console.error('[PayEmployeeModal] Payment failed:', err);
      let errorMessage = err instanceof Error ? err.message : 'Failed to process payment';

      // Check for insufficient gas token error
      if (errorMessage.includes('Insufficient balance for token')) {
        errorMessage = 'Insufficient gas tokens in your wallet. Please add tokens to your wallet to pay for transaction fees, then try again.';
      }

      // Show error toast
      setToastMessage(errorMessage);
      setToastSeverity('error');
      setToastOpen(true);

      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setSelectedEmployee(null);
    setCustomAmount('');
    setMemo('');
    setAmountType('custom');
    setPaymentType('Regular Salary');
    setError(null);
  };

  const handleClose = () => {
    if (!isSubmitting) {
      resetForm();
      onClose();
    }
  };

  const handleToastClose = () => {
    setToastOpen(false);
  };

  return (
    <>
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Stack direction="row" alignItems="center" spacing={1}>
          <PaymentIcon sx={{ color: theme.colors.primary[500] }} />
          <Typography variant="h6" fontWeight={theme.typography.fontWeight.semibold}>
            Pay Employee
          </Typography>
        </Stack>
      </DialogTitle>

      <DialogContent>
        <Stack spacing={3} sx={{ mt: 2 }}>
            {error && (
              <Alert severity="error" onClose={() => setError(null)}>
                {error}
              </Alert>
            )}

            {/* Employee Selection */}
            <FormControl fullWidth>
              <FormLabel sx={{ mb: 1, color: theme.colors.text.primary }}>Select Employee *</FormLabel>
              <Autocomplete
                options={employees}
                getOptionLabel={(option) => option.name}
                value={selectedEmployee}
                onChange={(_, newValue) => setSelectedEmployee(newValue)}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    placeholder="Search employees..."
                    InputProps={{
                      ...params.InputProps,
                      startAdornment: <PersonIcon sx={{ mr: 1, color: theme.colors.text.disabled }} />,
                    }}
                  />
                )}
                renderOption={(props, option) => (
                  <li {...props}>
                    <Stack direction="row" spacing={2} alignItems="center" sx={{ width: '100%' }}>
                      <Stack flex={1}>
                        <Typography variant="body2" fontWeight={theme.typography.fontWeight.semibold}>
                          {option.name}
                        </Typography>
                        <Typography variant="caption" color={theme.colors.text.secondary}>
                          {option.role || 'No role'} • ${option.baseSalary || '0'}/month
                        </Typography>
                      </Stack>
                    </Stack>
                  </li>
                )}
                disabled={isSubmitting}
              />
            </FormControl>

            <Divider />

            {/* Amount Selection */}
            <FormControl>
              <FormLabel sx={{ mb: 2, color: theme.colors.text.primary }}>Payment Amount *</FormLabel>
              <RadioGroup value={amountType} onChange={(e) => setAmountType(e.target.value as 'base' | 'custom')}>
                {selectedEmployee?.baseSalary && (
                  <FormControlLabel
                    value="base"
                    control={<Radio />}
                    label={
                      <Typography variant="body2">
                        Use Base Salary: ${selectedEmployee.baseSalary}
                      </Typography>
                    }
                    disabled={isSubmitting}
                  />
                )}
                <FormControlLabel
                  value="custom"
                  control={<Radio />}
                  label={<Typography variant="body2">Custom Amount</Typography>}
                  disabled={isSubmitting}
                />
              </RadioGroup>

              {amountType === 'custom' && (
                <TextField
                  type="number"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  disabled={isSubmitting}
                  placeholder="Enter amount"
                  fullWidth
                  label="Amount (USD)"
                  inputProps={{ min: 0, step: 0.01 }}
                  sx={{ mt: 2 }}
                  autoFocus
                />
              )}
            </FormControl>

            {/* Payment Type */}
            <FormControl fullWidth>
              <FormLabel sx={{ mb: 1, color: theme.colors.text.primary }}>Payment Type</FormLabel>
              <Select value={paymentType} onChange={(e) => setPaymentType(e.target.value)} disabled={isSubmitting}>
                {PAYMENT_TYPES.map((type) => (
                  <MenuItem key={type} value={type}>
                    {type}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Memo */}
            <FormControl fullWidth>
              <FormLabel sx={{ mb: 1, color: theme.colors.text.primary }}>Memo (Optional)</FormLabel>
              <TextField
                multiline
                rows={2}
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                placeholder="Internal note (not visible to employee)"
                disabled={isSubmitting}
              />
            </FormControl>

            <Divider />

            {/* Summary */}
            <Stack spacing={1.5}>
              <Typography variant="body2" fontWeight={theme.typography.fontWeight.semibold}>
                Summary
              </Typography>
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2" color={theme.colors.text.secondary}>
                  Employee:
                </Typography>
                <Typography variant="body2" fontWeight={theme.typography.fontWeight.semibold}>
                  {selectedEmployee?.name || '—'}
                </Typography>
              </Stack>
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2" color={theme.colors.text.secondary}>
                  Amount:
                </Typography>
                <Typography variant="body2" fontWeight={theme.typography.fontWeight.semibold}>
                  ${getPaymentAmount() || '0.00'}
                </Typography>
              </Stack>
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2" color={theme.colors.text.secondary}>
                  Type:
                </Typography>
                <Typography variant="body2" fontWeight={theme.typography.fontWeight.semibold}>
                  {paymentType}
                </Typography>
              </Stack>
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2" color={theme.colors.text.secondary}>
                  Gas Fee:
                </Typography>
                <Typography variant="body2" color={theme.colors.text.secondary}>
                  ~${getGasFee()}
                </Typography>
              </Stack>
              <Divider />
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body1" fontWeight={theme.typography.fontWeight.bold}>
                  Total Cost:
                </Typography>
                <Typography variant="body1" fontWeight={theme.typography.fontWeight.bold} color={theme.colors.primary[500]}>
                  ${getTotalCost()}
                </Typography>
              </Stack>
            </Stack>

            <Alert severity="info" icon={<PaymentIcon />}>
              Amount will be encrypted on-chain 🔒
            </Alert>
          </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handlePayment}
          disabled={!isFormValid() || isSubmitting || !api}
          startIcon={isSubmitting ? <CircularProgress size={20} /> : <PaymentIcon />}
          sx={{
            bgcolor: theme.colors.warning[500],
            '&:hover': { bgcolor: theme.colors.warning[700] },
          }}
        >
          {isSubmitting ? 'Processing...' : 'Pay Now'}
        </Button>
      </DialogActions>
    </Dialog>

    {/* Toast Notification */}
    <ToastNotification
      open={toastOpen}
      message={toastMessage}
      severity={toastSeverity}
      onClose={handleToastClose}
    />
  </>
  );
};
