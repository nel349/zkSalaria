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
  Select,
  MenuItem,
  Divider,
  Autocomplete,
} from '@mui/material';
import RepeatIcon from '@mui/icons-material/Repeat';
import PersonIcon from '@mui/icons-material/Person';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import { useThemeValues } from '../theme';
import { type DeployedPayrollAPI } from '@zksalaria/payroll-api';
import { ToastNotification } from './ToastNotification';
import { type EmployeeMetadata } from '../types/payment';

interface SetupRecurringPaymentModalProps {
  open: boolean;
  onClose: () => void;
  api: DeployedPayrollAPI | null;
  currentCompany: string;
  employees: EmployeeMetadata[];
  onSuccess?: () => void;
}

const FREQUENCIES = [
  { value: 0, label: 'Weekly', days: 7 },
  { value: 1, label: 'Bi-Weekly', days: 14 },
  { value: 2, label: 'Monthly', days: 30 },
];

const DAYS_OF_WEEK = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
];

export const SetupRecurringPaymentModal: React.FC<SetupRecurringPaymentModalProps> = ({
  open,
  onClose,
  api,
  currentCompany,
  employees,
  onSuccess,
}) => {
  const theme = useThemeValues();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const [toastOpen, setToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastSeverity, setToastSeverity] = useState<'success' | 'error'>('success');

  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeMetadata | null>(null);
  const [amount, setAmount] = useState('');
  const [frequency, setFrequency] = useState(2);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [dayOfWeek, setDayOfWeek] = useState(1);
  const [hasExistingRecurring, setHasExistingRecurring] = useState(false);
  const [checkingRecurring, setCheckingRecurring] = useState(false);

  useEffect(() => {
    if (open) {
      setSelectedEmployee(null);
      setAmount('');
      setFrequency(2);
      setStartDate('');
      setEndDate('');
      setDayOfWeek(1);
      setError(null);
      setShowPreview(false);
      setHasExistingRecurring(false);
    }
  }, [open]);

  // Check if selected employee already has a recurring payment
  useEffect(() => {
    const checkEmployeeRecurring = async () => {
      if (!selectedEmployee || !api) {
        setHasExistingRecurring(false);
        return;
      }

      setCheckingRecurring(true);
      try {
        const payment = await api.getRecurringPaymentByEmployee(selectedEmployee.employeeId);
        setHasExistingRecurring(!!payment);

        if (payment) {
          setError(`${selectedEmployee.name} already has a recurring payment. Please use "Manage Recurring" to edit it.`);
        } else {
          setError(null);
        }
      } catch (err) {
        console.warn(`[SetupRecurring] Failed to check ${selectedEmployee.name}:`, err);
        setHasExistingRecurring(false);
      } finally {
        setCheckingRecurring(false);
      }
    };

    checkEmployeeRecurring();
  }, [selectedEmployee, api]);

  const isFormValid = (): boolean => {
    if (!selectedEmployee) return false;
    if (hasExistingRecurring) return false;
    if (!amount || parseFloat(amount) <= 0) return false;
    if (!startDate) return false;
    return true;
  };

  const generatePreviewDates = (): string[] => {
    if (!startDate) return [];

    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : new Date(start.getTime() + 365 * 24 * 60 * 60 * 1000);
    const freqDays = FREQUENCIES[frequency].days;

    const dates: string[] = [];
    let current = new Date(start);

    while (dates.length < 10 && current <= end) {
      dates.push(current.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }));
      current = new Date(current.getTime() + freqDays * 24 * 60 * 60 * 1000);
    }

    return dates;
  };

  const handleSubmit = async () => {
    if (!api || !selectedEmployee || !currentCompany) {
      setError('Missing required data');
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      setError('Invalid payment amount');
      return;
    }

    if (!startDate) {
      setError('Start date is required');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      console.log(`[SetupRecurringPayment] Creating recurring payment for ${selectedEmployee.name}`);

      const startDateObj = new Date(startDate);
      const endDateObj = endDate ? new Date(endDate) : null;

      await api.createRecurringPayment(
        currentCompany,
        selectedEmployee.employeeId,
        amount,
        BigInt(frequency),
        startDateObj,
        endDateObj,
        dayOfWeek
      );

      console.log('[SetupRecurringPayment] Recurring payment created successfully');

      // Store recurring payment metadata in localStorage
      const recurringMetadata = {
        employeeId: selectedEmployee.employeeId,
        employeeName: selectedEmployee.name,
        amount: parseFloat(amount),
        frequency: frequency,
        startDate: startDateObj.getTime(),
        endDate: endDateObj ? endDateObj.getTime() : null,
        createdAt: Date.now(),
      };
      const recurringKey = `payroll-ui.recurring.${currentCompany}`;
      const existingRecurring = JSON.parse(localStorage.getItem(recurringKey) || '[]');
      existingRecurring.push(recurringMetadata);
      localStorage.setItem(recurringKey, JSON.stringify(existingRecurring));
      console.log('[SetupRecurringPayment] Stored metadata:', recurringKey, recurringMetadata);

      setToastMessage(`Successfully set up recurring payment for ${selectedEmployee.name}`);
      setToastSeverity('success');
      setToastOpen(true);

      resetForm();
      onClose();
      onSuccess?.();
    } catch (err) {
      console.error('[SetupRecurringPayment] Failed:', err);
      let errorMessage = err instanceof Error ? err.message : 'Failed to setup recurring payment';

      // Check for duplicate recurring payment error
      if (errorMessage.includes('already has a recurring payment')) {
        errorMessage = `${selectedEmployee.name} already has a recurring payment. Please use the "Manage Recurring" button to edit or cancel the existing payment.`;
      }

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
    setAmount('');
    setFrequency(2);
    setStartDate('');
    setEndDate('');
    setDayOfWeek(1);
    setError(null);
    setShowPreview(false);
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

  const previewDates = generatePreviewDates();

  return (
    <>
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Stack direction="row" alignItems="center" spacing={1}>
            <RepeatIcon sx={{ color: theme.colors.primary[500] }} />
            <Typography variant="h6" fontWeight={theme.typography.fontWeight.semibold}>
              Setup Recurring Payment
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
                      startAdornment: checkingRecurring ? (
                        <CircularProgress size={20} sx={{ mr: 1 }} />
                      ) : (
                        <PersonIcon sx={{ mr: 1, color: theme.colors.text.disabled }} />
                      ),
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
                disabled={isSubmitting || checkingRecurring}
              />
            </FormControl>

            <TextField
              fullWidth
              label="Amount (USD) *"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              disabled={isSubmitting}
              inputProps={{ min: 0, step: 0.01 }}
            />

            <FormControl fullWidth>
              <FormLabel sx={{ mb: 1, color: theme.colors.text.primary }}>Frequency *</FormLabel>
              <Select value={frequency} onChange={(e) => setFrequency(Number(e.target.value))} disabled={isSubmitting}>
                {FREQUENCIES.map((freq) => (
                  <MenuItem key={freq.value} value={freq.value}>
                    {freq.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {frequency !== 2 && (
              <FormControl fullWidth>
                <FormLabel sx={{ mb: 1, color: theme.colors.text.primary }}>Day of Week</FormLabel>
                <Select value={dayOfWeek} onChange={(e) => setDayOfWeek(Number(e.target.value))} disabled={isSubmitting}>
                  {DAYS_OF_WEEK.map((day) => (
                    <MenuItem key={day.value} value={day.value}>
                      {day.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}

            <TextField
              fullWidth
              label="Start Date *"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              disabled={isSubmitting}
              InputLabelProps={{ shrink: true }}
              InputProps={{
                startAdornment: <CalendarMonthIcon sx={{ mr: 1, color: theme.colors.text.disabled }} />,
              }}
            />

            <TextField
              fullWidth
              label="End Date (Optional)"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              disabled={isSubmitting}
              InputLabelProps={{ shrink: true }}
              helperText="Leave empty for ongoing payments"
            />

            <Divider />

            {previewDates.length > 0 && (
              <Stack spacing={1.5}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="body2" fontWeight={theme.typography.fontWeight.semibold}>
                    Payment Schedule Preview
                  </Typography>
                  <Button size="small" onClick={() => setShowPreview(!showPreview)}>
                    {showPreview ? 'Hide' : 'Show'} Preview
                  </Button>
                </Stack>
                {showPreview && (
                  <Stack spacing={0.5} sx={{ maxHeight: 200, overflow: 'auto', p: 1, bgcolor: theme.colors.background.surface, borderRadius: 1 }}>
                    {previewDates.map((date, idx) => (
                      <Typography key={idx} variant="caption" color={theme.colors.text.secondary}>
                        {idx + 1}. {date} - ${parseFloat(amount || '0').toFixed(2)}
                      </Typography>
                    ))}
                  </Stack>
                )}
              </Stack>
            )}

            <Alert severity="info" icon={<RepeatIcon />}>
              Recurring payments will be processed automatically on schedule
            </Alert>
          </Stack>
        </DialogContent>

        <DialogActions>
          <Button onClick={handleClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={!isFormValid() || isSubmitting || !api}
            startIcon={isSubmitting ? <CircularProgress size={20} /> : <RepeatIcon />}
            sx={{
              bgcolor: theme.colors.primary[500],
              '&:hover': { bgcolor: theme.colors.primary[700] },
            }}
          >
            {isSubmitting ? 'Setting up...' : 'Setup Recurring Payment'}
          </Button>
        </DialogActions>
      </Dialog>

      <ToastNotification
        open={toastOpen}
        message={toastMessage}
        severity={toastSeverity}
        onClose={handleToastClose}
      />
    </>
  );
};
