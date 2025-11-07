import React, { useState } from 'react';
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
} from '@mui/material';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useThemeValues } from '../theme';
import { type DeployedPayrollAPI } from '@zksalaria/payroll-api';
import { firstValueFrom } from 'rxjs';

interface EmployeeMetadata {
  employeeId: string;
  name: string;
  email: string;
  role?: string;
  baseSalary?: string;
  addedAt: string;
  companyContractAddress: string;
}

interface AddEmployeeModalProps {
  open: boolean;
  onClose: () => void;
  api: DeployedPayrollAPI | null;
  walletAddress: string | null;
  currentCompany: string;
  onSuccess?: () => void;
}

export const AddEmployeeModal: React.FC<AddEmployeeModalProps> = ({
  open,
  onClose,
  api,
  walletAddress,
  currentCompany,
  onSuccess,
}) => {
  const theme = useThemeValues();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Form fields
  const [employeeName, setEmployeeName] = useState('');
  const [employeeWallet, setEmployeeWallet] = useState('');
  const [employeeEmail, setEmployeeEmail] = useState('');
  const [employeeRole, setEmployeeRole] = useState('');
  const [baseSalary, setBaseSalary] = useState('');

  // Validation errors
  const [nameError, setNameError] = useState('');
  const [walletError, setWalletError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [salaryError, setSalaryError] = useState('');

  const validateForm = (): boolean => {
    let isValid = true;

    if (!employeeName.trim()) {
      setNameError('Employee name is required');
      isValid = false;
    } else if (employeeName.trim().length < 2) {
      setNameError('Name must be at least 2 characters');
      isValid = false;
    } else {
      setNameError('');
    }

    if (!employeeWallet.trim()) {
      setWalletError('Wallet address is required');
      isValid = false;
    } else if (employeeWallet.trim().length < 10) {
      setWalletError('Invalid wallet address');
      isValid = false;
    } else {
      setWalletError('');
    }

    if (!employeeEmail.trim()) {
      setEmailError('Email is required');
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(employeeEmail)) {
      setEmailError('Invalid email format');
      isValid = false;
    } else {
      setEmailError('');
    }

    if (baseSalary && (isNaN(parseFloat(baseSalary)) || parseFloat(baseSalary) <= 0)) {
      setSalaryError('Salary must be a positive number');
      isValid = false;
    } else {
      setSalaryError('');
    }

    return isValid;
  };

  const saveEmployeeMetadata = (metadata: EmployeeMetadata) => {
    const key = `payroll-ui.employees.${currentCompany}`;
    const existingEmployees = JSON.parse(localStorage.getItem(key) || '[]') as EmployeeMetadata[];
    existingEmployees.push(metadata);
    localStorage.setItem(key, JSON.stringify(existingEmployees));
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    if (!api || !walletAddress || !currentCompany) {
      setError('API not initialized');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      console.log(`[AddEmployeeModal] Adding employee ${employeeWallet} to company ${currentCompany}`);

      // DEBUG: Check contract state
      const state = await firstValueFrom(api.state$);
      console.log('[AddEmployeeModal] Current contract state:', {
        totalEmployees: state.totalEmployees,
        hasEmployeesMap: !!state.employees,
        employeesMapType: state.employees?.constructor?.name,
      });

      // Check if employee already exists
      const employeeInfo = await api.getEmployeeInfo(employeeWallet);
      console.log('[AddEmployeeModal] Employee check:', {
        wallet: employeeWallet,
        exists: employeeInfo.exists,
        info: employeeInfo
      });

      if (employeeInfo.exists) {
        setError('This employee has already been added to the company');
        setIsSubmitting(false);
        return;
      }

      // Call smart contract to add employee on-chain
      await api.addEmployee(currentCompany, employeeWallet);

      // Save metadata off-chain
      const metadata: EmployeeMetadata = {
        employeeId: employeeWallet,
        name: employeeName,
        email: employeeEmail,
        role: employeeRole || undefined,
        baseSalary: baseSalary || undefined,
        addedAt: new Date().toISOString(),
        companyContractAddress: currentCompany,
      };
      saveEmployeeMetadata(metadata);

      console.log('[AddEmployeeModal] Employee added successfully');
      setSuccess(true);

      // Reset form after short delay
      setTimeout(() => {
        resetForm();
        setSuccess(false);
        onClose();
        onSuccess?.();
      }, 2000);
    } catch (err) {
      console.error('[AddEmployeeModal] Failed to add employee:', err);
      setError(err instanceof Error ? err.message : 'Failed to add employee');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setEmployeeName('');
    setEmployeeWallet('');
    setEmployeeEmail('');
    setEmployeeRole('');
    setBaseSalary('');
    setNameError('');
    setWalletError('');
    setEmailError('');
    setSalaryError('');
    setError(null);
  };

  const handleClose = () => {
    if (!isSubmitting) {
      resetForm();
      setSuccess(false);
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Stack direction="row" alignItems="center" spacing={1}>
          <PersonAddIcon sx={{ color: theme.colors.primary[500] }} />
          <Typography variant="h6" fontWeight={theme.typography.fontWeight.semibold}>
            Add New Employee
          </Typography>
        </Stack>
      </DialogTitle>

      <DialogContent>
        {success ? (
          <Alert severity="success" icon={<CheckCircleIcon />} sx={{ mb: 2 }}>
            <Typography variant="body2" fontWeight={theme.typography.fontWeight.semibold}>
              <strong>{employeeName}</strong> has been successfully added to your payroll.
            </Typography>
            <Typography variant="caption">
              They can now connect their wallet to view their encrypted balance and payment history.
            </Typography>
          </Alert>
        ) : (
          <Stack spacing={3} sx={{ mt: 2 }}>
            {error && (
              <Alert severity="error" onClose={() => setError(null)}>
                {error}
              </Alert>
            )}

            <TextField
              fullWidth
              label="Employee Name"
              value={employeeName}
              onChange={(e) => setEmployeeName(e.target.value)}
              disabled={isSubmitting}
              error={!!nameError}
              helperText={nameError}
              required
            />

            <TextField
              fullWidth
              label="Wallet Address"
              value={employeeWallet}
              onChange={(e) => setEmployeeWallet(e.target.value)}
              disabled={isSubmitting}
              error={!!walletError}
              helperText={walletError || 'Employee must share their Midnight wallet address'}
              required
            />

            <TextField
              fullWidth
              label="Email Address"
              type="email"
              value={employeeEmail}
              onChange={(e) => setEmployeeEmail(e.target.value)}
              disabled={isSubmitting}
              error={!!emailError}
              helperText={emailError}
              required
            />

            <TextField
              fullWidth
              label="Role (Optional)"
              value={employeeRole}
              onChange={(e) => setEmployeeRole(e.target.value)}
              disabled={isSubmitting}
              placeholder="e.g., Software Engineer, Designer, Manager"
            />

            <TextField
              fullWidth
              label="Base Salary (Optional)"
              type="number"
              value={baseSalary}
              onChange={(e) => setBaseSalary(e.target.value)}
              disabled={isSubmitting}
              error={!!salaryError}
              helperText={salaryError || 'Monthly salary amount'}
              inputProps={{ min: 0, step: 0.01 }}
            />
          </Stack>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} disabled={isSubmitting || success}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={isSubmitting || !api || success}
          startIcon={isSubmitting ? <CircularProgress size={20} /> : <PersonAddIcon />}
        >
          {isSubmitting ? 'Adding...' : 'Add Employee'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
