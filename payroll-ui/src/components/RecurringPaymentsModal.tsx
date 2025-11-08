import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stack,
  Typography,
  Card,
  CardContent,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Alert,
  TextField,
  CircularProgress,
  Divider,
} from '@mui/material';
import RepeatIcon from '@mui/icons-material/Repeat';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import EditIcon from '@mui/icons-material/Edit';
import CancelIcon from '@mui/icons-material/Cancel';
import { useThemeValues, useTheme } from '../theme';
import { type DeployedPayrollAPI } from '@zksalaria/payroll-api';
import { ToastNotification } from './ToastNotification';
import { walletAddressToEmployeeIdHex } from '../utils/employeeUtils';

interface RecurringPayment {
  id: string;
  employeeName: string;
  employeeId: string;
  amount: number;
  frequency: number;
  status: number;
  nextPaymentDate: number;
  startDate: number;
  endDate?: number;
}

interface RecurringPaymentsModalProps {
  open: boolean;
  onClose: () => void;
  api: DeployedPayrollAPI | null;
  currentCompany: string;
}

const FREQUENCY_LABELS: Record<number, string> = {
  0: 'Weekly',
  1: 'Bi-Weekly',
  2: 'Monthly',
};

const STATUS_LABELS: Record<number, string> = {
  0: 'Active',
  1: 'Paused',
  2: 'Cancelled',
  3: 'Completed',
};

export const RecurringPaymentsModal: React.FC<RecurringPaymentsModalProps> = ({
  open,
  onClose,
  api,
  currentCompany,
}) => {
  const theme = useThemeValues();
  const { mode } = useTheme();

  const [payments, setPayments] = useState<RecurringPayment[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<number | 'all'>('all');

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedPayment, setSelectedPayment] = useState<RecurringPayment | null>(null);

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [newAmount, setNewAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [toastOpen, setToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastSeverity, setToastSeverity] = useState<'success' | 'error'>('success');

  useEffect(() => {
    if (open && api) {
      loadRecurringPayments();
    }
  }, [open, api]);

  const loadRecurringPayments = async () => {
    if (!api) return;

    setLoading(true);
    try {
      console.log('[RecurringPayments] Loading recurring payments from on-chain...');

      // Fetch ALL recurring payments from on-chain (true recovery capability!)
      const onChainPayments = await api.getAllRecurringPayments();
      console.log(`[RecurringPayments] Fetched ${onChainPayments.length} payments from on-chain`);

      // Load metadata from localStorage for employee names and plaintext amounts
      const employeesKey = `payroll-ui.employees.${currentCompany}`;
      const storedEmployees = JSON.parse(localStorage.getItem(employeesKey) || '[]');
      console.log('[RecurringPayments] Employees metadata:', storedEmployees.length);

      const recurringKey = `payroll-ui.recurring.${currentCompany}`;
      const recurringMetadata = JSON.parse(localStorage.getItem(recurringKey) || '[]');
      console.log('[RecurringPayments] Recurring metadata:', recurringMetadata.length);

      // Create a map of hashed wallet addresses to employee metadata (async)
      const employeeHashMap = new Map<string, any>();
      for (const employee of storedEmployees) {
        const hashedId = await walletAddressToEmployeeIdHex(employee.employeeId);
        employeeHashMap.set(hashedId, employee);
      }

      const recurringHashMap = new Map<string, any>();
      for (const metadata of recurringMetadata) {
        const hashedId = await walletAddressToEmployeeIdHex(metadata.employeeId);
        recurringHashMap.set(hashedId, metadata);
      }

      // Merge on-chain data with localStorage metadata
      const allPayments: RecurringPayment[] = onChainPayments.map((payment) => {
        // Convert employee_id bytes to hex for matching
        const employeeIdHex = Array.from(payment.employee_id)
          .map((b: number) => b.toString(16).padStart(2, '0'))
          .join('');

        // Find employee metadata by hashed ID
        const employeeMetadata = employeeHashMap.get(employeeIdHex);
        const recurringMeta = recurringHashMap.get(employeeIdHex);

        return {
          id: Array.from(payment.recurring_payment_id).map((b: number) => b.toString(16).padStart(2, '0')).join(''),
          employeeName: employeeMetadata?.name || recurringMeta?.employeeName || `Employee ${employeeIdHex.substring(0, 8)}...`,
          employeeId: employeeIdHex,
          amount: recurringMeta?.amount || 0, // Fallback to 0 if metadata missing
          frequency: Number(payment.frequency),
          status: Number(payment.status),
          nextPaymentDate: Number(payment.next_payment_date),
          startDate: Number(payment.start_date),
          endDate: payment.end_date ? Number(payment.end_date) : undefined,
        };
      });

      setPayments(allPayments);
      console.log(`[RecurringPayments] Loaded ${allPayments.length} recurring payments (${onChainPayments.length} from on-chain)`);
    } catch (err) {
      console.error('[RecurringPayments] Failed to load:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenMenu = (event: React.MouseEvent<HTMLElement>, payment: RecurringPayment) => {
    setAnchorEl(event.currentTarget);
    setSelectedPayment(payment);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
  };

  const handlePause = async () => {
    if (!api || !selectedPayment) return;

    handleCloseMenu();
    setIsSubmitting(true);

    try {
      await api.pauseRecurringPayment(selectedPayment.id);

      setToastMessage('Recurring payment paused successfully');
      setToastSeverity('success');
      setToastOpen(true);

      await loadRecurringPayments();
    } catch (err) {
      console.error('[RecurringPayments] Pause failed:', err);
      setToastMessage(err instanceof Error ? err.message : 'Failed to pause payment');
      setToastSeverity('error');
      setToastOpen(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResume = async () => {
    if (!api || !selectedPayment) return;

    handleCloseMenu();
    setIsSubmitting(true);

    try {
      await api.resumeRecurringPayment(selectedPayment.id);

      setToastMessage('Recurring payment resumed successfully');
      setToastSeverity('success');
      setToastOpen(true);

      await loadRecurringPayments();
    } catch (err) {
      console.error('[RecurringPayments] Resume failed:', err);
      setToastMessage(err instanceof Error ? err.message : 'Failed to resume payment');
      setToastSeverity('error');
      setToastOpen(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditOpen = () => {
    handleCloseMenu();
    if (selectedPayment) {
      setNewAmount(selectedPayment.amount.toString());
      setEditDialogOpen(true);
    }
  };

  const handleEditSubmit = async () => {
    if (!api || !selectedPayment || !newAmount) return;

    setIsSubmitting(true);

    try {
      await api.editRecurringPayment(selectedPayment.id, newAmount);

      // Update amount in localStorage metadata
      const recurringKey = `payroll-ui.recurring.${currentCompany}`;
      const recurringMetadata = JSON.parse(localStorage.getItem(recurringKey) || '[]');
      const index = recurringMetadata.findIndex((m: any) => m.employeeId === selectedPayment.employeeId);
      if (index !== -1) {
        recurringMetadata[index].amount = parseFloat(newAmount);
        localStorage.setItem(recurringKey, JSON.stringify(recurringMetadata));
      }

      setToastMessage('Recurring payment updated successfully');
      setToastSeverity('success');
      setToastOpen(true);

      setEditDialogOpen(false);
      await loadRecurringPayments();
    } catch (err) {
      console.error('[RecurringPayments] Edit failed:', err);
      setToastMessage(err instanceof Error ? err.message : 'Failed to update payment');
      setToastSeverity('error');
      setToastOpen(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredPayments = filter === 'all'
    ? payments
    : payments.filter((p) => p.status === filter);

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogTitle>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Stack direction="row" alignItems="center" spacing={1}>
              <RepeatIcon sx={{ color: theme.colors.primary[500] }} />
              <Typography variant="h6" fontWeight={theme.typography.fontWeight.semibold}>
                Recurring Payments
              </Typography>
            </Stack>
            <Stack direction="row" spacing={1}>
              <Button
                size="small"
                variant={filter === 'all' ? 'contained' : 'outlined'}
                onClick={() => setFilter('all')}
              >
                All
              </Button>
              <Button
                size="small"
                variant={filter === 0 ? 'contained' : 'outlined'}
                onClick={() => setFilter(0)}
              >
                Active
              </Button>
              <Button
                size="small"
                variant={filter === 1 ? 'contained' : 'outlined'}
                onClick={() => setFilter(1)}
              >
                Paused
              </Button>
            </Stack>
          </Stack>
        </DialogTitle>

        <DialogContent>
          {loading && (
            <Stack alignItems="center" py={4}>
              <CircularProgress />
            </Stack>
          )}

          {!loading && filteredPayments.length === 0 && (
            <Alert severity="info">
              No recurring payments found. Set up a recurring payment from the dashboard.
            </Alert>
          )}

          {!loading && filteredPayments.length > 0 && (
            <Stack spacing={2}>
              {filteredPayments.map((payment) => (
                <Card
                  key={payment.id}
                  sx={{
                    bgcolor: mode === 'dark' ? theme.colors.background.paper : '#FFFFFF',
                    border: `1px solid ${theme.colors.border}`,
                  }}
                >
                  <CardContent>
                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                      <Stack flex={1}>
                        <Typography variant="h6" fontWeight={theme.typography.fontWeight.semibold}>
                          {payment.employeeName}
                        </Typography>
                        <Typography variant="body2" color={theme.colors.text.secondary}>
                          ${payment.amount.toFixed(2)} • {FREQUENCY_LABELS[payment.frequency]}
                        </Typography>
                      </Stack>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Chip
                          label={STATUS_LABELS[payment.status]}
                          size="small"
                          color={payment.status === 0 ? 'success' : payment.status === 1 ? 'warning' : 'default'}
                        />
                        <IconButton size="small" onClick={(e) => handleOpenMenu(e, payment)}>
                          <MoreVertIcon />
                        </IconButton>
                      </Stack>
                    </Stack>
                    <Divider sx={{ my: 1 }} />
                    <Stack direction="row" spacing={3}>
                      <Stack>
                        <Typography variant="caption" color={theme.colors.text.disabled}>
                          Next Payment
                        </Typography>
                        <Typography variant="body2">
                          {new Date(payment.nextPaymentDate * 1000).toLocaleDateString()}
                        </Typography>
                      </Stack>
                      <Stack>
                        <Typography variant="caption" color={theme.colors.text.disabled}>
                          Started
                        </Typography>
                        <Typography variant="body2">
                          {new Date(payment.startDate * 1000).toLocaleDateString()}
                        </Typography>
                      </Stack>
                      {payment.endDate && (
                        <Stack>
                          <Typography variant="caption" color={theme.colors.text.disabled}>
                            Ends
                          </Typography>
                          <Typography variant="body2">
                            {new Date(payment.endDate * 1000).toLocaleDateString()}
                          </Typography>
                        </Stack>
                      )}
                    </Stack>
                  </CardContent>
                </Card>
              ))}
            </Stack>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={onClose}>Close</Button>
        </DialogActions>
      </Dialog>

      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleCloseMenu}>
        {selectedPayment?.status === 0 && (
          <MenuItem onClick={handlePause}>
            <PauseIcon sx={{ mr: 1, fontSize: 18 }} />
            Pause
          </MenuItem>
        )}
        {selectedPayment?.status === 1 && (
          <MenuItem onClick={handleResume}>
            <PlayArrowIcon sx={{ mr: 1, fontSize: 18 }} />
            Resume
          </MenuItem>
        )}
        <MenuItem onClick={handleEditOpen}>
          <EditIcon sx={{ mr: 1, fontSize: 18 }} />
          Edit Amount
        </MenuItem>
      </Menu>

      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Edit Payment Amount</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Typography variant="body2" color={theme.colors.text.secondary}>
              Update the recurring payment amount for {selectedPayment?.employeeName}
            </Typography>
            <TextField
              fullWidth
              label="New Amount (USD)"
              type="number"
              value={newAmount}
              onChange={(e) => setNewAmount(e.target.value)}
              disabled={isSubmitting}
              inputProps={{ min: 0, step: 0.01 }}
              autoFocus
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleEditSubmit}
            disabled={!newAmount || parseFloat(newAmount) <= 0 || isSubmitting}
            startIcon={isSubmitting ? <CircularProgress size={20} /> : <EditIcon />}
          >
            {isSubmitting ? 'Updating...' : 'Update Amount'}
          </Button>
        </DialogActions>
      </Dialog>

      <ToastNotification
        open={toastOpen}
        message={toastMessage}
        severity={toastSeverity}
        onClose={() => setToastOpen(false)}
      />
    </>
  );
};
