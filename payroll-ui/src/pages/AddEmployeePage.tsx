import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  TextField,
  Button,
  Stack,
  Paper,
  Alert,
  CircularProgress,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { usePayrollWallet } from '../contexts/PayrollWalletContext';
import { useTheme, useThemeValues } from '../theme';
import { PayrollAPI, type DeployedPayrollAPI } from '@zksalaria/payroll-api';
import { getCurrentCompany, listCompanies } from '../utils/CompaniesLocalState';
import pino from 'pino';
import { firstValueFrom } from 'rxjs';

const logger = pino({
  name: 'addEmployee',
  level: 'info',
  browser: {
    asObject: false,
  },
});

// Off-chain employee metadata (stored in localStorage for MVP)
interface EmployeeMetadata {
  employeeId: string; // Wallet address
  name: string;
  email: string;
  role?: string;
  baseSalary?: string;
  addedAt: string;
  companyContractAddress: string;
}

export const AddEmployeePage: React.FC = () => {
  const navigate = useNavigate();
  const { mode } = useTheme();
  const theme = useThemeValues();
  const { walletAddress, providers } = usePayrollWallet();

  const [api, setApi] = useState<DeployedPayrollAPI | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

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

  const currentCompany = getCurrentCompany();
  const companies = listCompanies();
  const companyInfo = companies.find((c) => c.contractAddress === currentCompany);

  // Connect to contract
  useEffect(() => {
    const connectToContract = async () => {
      // Check wallet connection
      if (!walletAddress) {
        setError('Wallet not connected. Please connect your wallet first.');
        return;
      }

      // Check company selection
      if (!currentCompany) {
        setError('No company selected. Please select or create a company first.');
        return;
      }

      try {
        console.log(`[AddEmployee] Connecting to contract: ${currentCompany}`);
        const connectedApi = await PayrollAPI.connect(providers, currentCompany, walletAddress, logger);
        setApi(connectedApi);
        console.log('[AddEmployee] Successfully connected to contract');
      } catch (err) {
        console.error('[AddEmployee] Failed to connect to contract:', err);
        setError('Failed to connect to contract');
      }
    };

    connectToContract();
  }, [currentCompany, walletAddress, providers]);

  // Validate form
  const validateForm = (): boolean => {
    let isValid = true;

    // Name validation
    if (!employeeName.trim()) {
      setNameError('Employee name is required');
      isValid = false;
    } else if (employeeName.trim().length < 2) {
      setNameError('Name must be at least 2 characters');
      isValid = false;
    } else {
      setNameError('');
    }

    // Wallet validation
    if (!employeeWallet.trim()) {
      setWalletError('Wallet address is required');
      isValid = false;
    } else if (employeeWallet.trim().length < 10) {
      setWalletError('Invalid wallet address');
      isValid = false;
    } else {
      setWalletError('');
    }

    // Email validation
    if (!employeeEmail.trim()) {
      setEmailError('Email is required');
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(employeeEmail)) {
      setEmailError('Invalid email format');
      isValid = false;
    } else {
      setEmailError('');
    }

    // Salary validation (optional but if provided must be valid)
    if (baseSalary && (isNaN(parseFloat(baseSalary)) || parseFloat(baseSalary) <= 0)) {
      setSalaryError('Salary must be a positive number');
      isValid = false;
    } else {
      setSalaryError('');
    }

    return isValid;
  };

  // Save employee metadata to localStorage
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
      console.log(`[AddEmployee] Adding employee ${employeeWallet} to company ${currentCompany}`);

      // DEBUG: Check contract state
      const state = await firstValueFrom(api.state$);
      console.log('[AddEmployee] Current contract state:', {
        totalEmployees: state.totalEmployees,
        hasEmployeesMap: !!state.employees,
        employeesMapType: state.employees?.constructor?.name,
      });

      // Check if employee already exists
      const employeeInfo = await api.getEmployeeInfo(employeeWallet);
      console.log('[AddEmployee] Employee check:', {
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

      console.log('[AddEmployee] Employee added successfully');
      setShowSuccessModal(true);
    } catch (err) {
      console.error('[AddEmployee] Failed to add employee:', err);
      setError(err instanceof Error ? err.message : 'Failed to add employee');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSuccessClose = () => {
    setShowSuccessModal(false);
    // Reset form
    setEmployeeName('');
    setEmployeeWallet('');
    setEmployeeEmail('');
    setEmployeeRole('');
    setBaseSalary('');
  };

  const handleGoToDashboard = () => {
    navigate('/dashboard');
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: theme.colors.background.default,
        py: 4,
      }}
    >
      <Container maxWidth="md">
        <Stack spacing={4}>
          {/* Header */}
          <Box>
            <Typography variant="h4" fontWeight={theme.typography.fontWeight.bold} color={theme.colors.text.primary}>
              Add Employee
            </Typography>
            <Typography variant="body2" color={theme.colors.text.secondary} sx={{ mt: 1 }}>
              Add a new employee to {companyInfo?.name || 'your company'}
            </Typography>
          </Box>

          {/* Error Alert */}
          {error && (
            <Alert severity="error" onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          {/* Form */}
          <Paper
            elevation={3}
            sx={{
              p: 4,
              borderRadius: 3,
              bgcolor: mode === 'dark' ? theme.colors.background.paper : '#FFFFFF',
            }}
          >
            <Stack spacing={3}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <PersonAddIcon sx={{ color: theme.colors.primary[500] }} />
                <Typography variant="h6" fontWeight={theme.typography.fontWeight.semibold}>
                  Employee Information
                </Typography>
              </Stack>

              {/* Employee Name */}
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

              {/* Wallet Address */}
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

              {/* Email */}
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

              {/* Role (Optional) */}
              <TextField
                fullWidth
                label="Role (Optional)"
                value={employeeRole}
                onChange={(e) => setEmployeeRole(e.target.value)}
                disabled={isSubmitting}
                placeholder="e.g., Software Engineer, Designer, Manager"
              />

              {/* Base Salary (Optional) */}
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

              {/* Buttons */}
              <Stack direction="row" spacing={2}>
                <Button variant="outlined" fullWidth onClick={() => navigate('/dashboard')} disabled={isSubmitting}>
                  Cancel
                </Button>
                <Button
                  variant="contained"
                  fullWidth
                  onClick={handleSubmit}
                  disabled={isSubmitting || !api}
                  startIcon={isSubmitting ? <CircularProgress size={20} /> : <PersonAddIcon />}
                >
                  {isSubmitting ? 'Adding Employee...' : 'Add Employee'}
                </Button>
              </Stack>
            </Stack>
          </Paper>
        </Stack>
      </Container>

      {/* Success Modal */}
      <Dialog open={showSuccessModal} onClose={handleSuccessClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Stack direction="row" alignItems="center" spacing={2}>
            <CheckCircleIcon sx={{ color: theme.colors.success[500], fontSize: 40 }} />
            <Typography variant="h6" fontWeight={theme.typography.fontWeight.bold}>
              Employee Added Successfully!
            </Typography>
          </Stack>
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2}>
            <Typography variant="body1">
              <strong>{employeeName}</strong> has been successfully added to your payroll.
            </Typography>
            <Typography variant="body2" color={theme.colors.text.secondary}>
              They can now connect their wallet to view their encrypted balance and payment history.
            </Typography>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleSuccessClose} variant="outlined">
            Add Another Employee
          </Button>
          <Button onClick={handleGoToDashboard} variant="contained">
            Go to Dashboard
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
