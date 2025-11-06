import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  TextField,
  Button,
  Stack,
  Paper,
  Stepper,
  Step,
  StepLabel,
  Alert,
  CircularProgress,
  MenuItem,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { usePayrollWallet } from '../contexts/PayrollWalletContext';
import { useTheme, useThemeValues, createGlassMorphism, createPrimaryCTA } from '../theme';

interface QuickStartProgress {
  funded: boolean;
  fundedAmount?: number;
  employeeAdded: boolean;
  employeeName?: string;
  recurringSetup: boolean;
}

/**
 * Company Quick Start Wizard - Phase 1.4
 * Optional 3-step wizard after company registration
 * Reference: docs/design/AUTH_ONBOARDING_FLOW.md (Page 7c)
 */
export const CompanyQuickStartPage: React.FC = () => {
  const navigate = useNavigate();
  const { mode } = useTheme();
  const theme = useThemeValues();
  const { walletAddress, providers } = usePayrollWallet();

  const [activeStep, setActiveStep] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step 1: Fund Account
  const [fundAmount, setFundAmount] = useState('10000');
  const [token, setToken] = useState('USDC');

  // Step 2: Add Employee
  const [employeeName, setEmployeeName] = useState('');
  const [employeeWallet, setEmployeeWallet] = useState('');
  const [baseSalary, setBaseSalary] = useState('');
  const [salaryFrequency, setSalaryFrequency] = useState('Monthly');
  const [employeeRole, setEmployeeRole] = useState('');

  // Step 3: Recurring Payment
  const [recurringFrequency, setRecurringFrequency] = useState('Monthly');
  const [startDate, setStartDate] = useState('');

  // Progress tracking
  const [progress, setProgress] = useState<QuickStartProgress>({
    funded: false,
    employeeAdded: false,
    recurringSetup: false,
  });

  const steps = ['Fund Account', 'Add First Employee', 'Setup Recurring Payment'];

  const handleFundAccount = async () => {
    setIsProcessing(true);
    setError(null);

    try {
      console.log('[QuickStart] Funding account:', fundAmount, token);

      // TODO: Actual funding logic
      // await depositCompanyFunds(walletAddress, parseFloat(fundAmount));

      // Mock delay
      await new Promise((resolve) => setTimeout(resolve, 1500));

      setProgress({ ...progress, funded: true, fundedAmount: parseFloat(fundAmount) });
      setActiveStep(1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fund account');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSkipFunding = () => {
    setActiveStep(1);
  };

  const handleAddEmployee = async () => {
    setIsProcessing(true);
    setError(null);

    try {
      console.log('[QuickStart] Adding employee:', employeeName);

      // TODO: Actual add employee logic
      // await addEmployee(walletAddress, employeeWallet);

      // Mock delay
      await new Promise((resolve) => setTimeout(resolve, 1500));

      setProgress({ ...progress, employeeAdded: true, employeeName });
      setActiveStep(2);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add employee');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSkipEmployee = () => {
    setActiveStep(2);
  };

  const handleSetupRecurring = async () => {
    setIsProcessing(true);
    setError(null);

    try {
      console.log('[QuickStart] Setting up recurring payment');

      // TODO: Actual recurring payment logic
      // await createRecurringPayment(...);

      // Mock delay
      await new Promise((resolve) => setTimeout(resolve, 1500));

      setProgress({ ...progress, recurringSetup: true });

      // Wizard complete, navigate to dashboard
      localStorage.setItem('quickstart_completed', 'true');
      navigate('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to setup recurring payment');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSkipRecurring = () => {
    // Skip and go to dashboard
    navigate('/dashboard');
  };

  const handleSkipWizard = () => {
    navigate('/dashboard');
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: theme.colors.background.default,
        py: 4,
      }}
    >
      <Container maxWidth="md">
        <Paper
          elevation={0}
          sx={{
            ...createGlassMorphism(theme, mode),
            p: { xs: 4, md: 6 },
            borderRadius: theme.borderRadius['2xl'],
            border: `1px solid ${theme.colors.border.default}`,
          }}
        >
          <Stack spacing={4}>
            {/* Header */}
            <Stack spacing={2} textAlign="center">
              <Typography
                variant="h4"
                fontWeight={theme.typography.fontWeight.bold}
                color={theme.colors.text.primary}
              >
                Quick Start
              </Typography>
              <Typography variant="body1" color={theme.colors.text.secondary}>
                Get your payroll system up and running in 3 optional steps
              </Typography>
              <Button
                size="small"
                onClick={handleSkipWizard}
                sx={{ color: theme.colors.text.disabled }}
              >
                Skip Wizard →
              </Button>
            </Stack>

            {/* Stepper */}
            <Stepper activeStep={activeStep} alternativeLabel>
              {steps.map((label, index) => (
                <Step key={label} completed={
                  (index === 0 && progress.funded) ||
                  (index === 1 && progress.employeeAdded) ||
                  (index === 2 && progress.recurringSetup)
                }>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>

            {/* Error Alert */}
            {error && (
              <Alert
                severity="error"
                sx={{
                  bgcolor: mode === 'dark' ? `${theme.colors.error[500]}20` : theme.colors.error[50],
                  border: `1px solid ${theme.colors.error[500]}`,
                }}
              >
                {error}
              </Alert>
            )}

            {/* Step Content */}
            {activeStep === 0 && (
              <Stack spacing={3}>
                <Typography variant="h6" fontWeight={theme.typography.fontWeight.semibold}>
                  Step 1: Fund Your Payroll Account
                </Typography>
                <Typography variant="body2" color={theme.colors.text.secondary}>
                  Deposit funds to pay your employees. You can always add more later.
                </Typography>

                <Stack direction="row" spacing={2}>
                  <TextField
                    fullWidth
                    label="Amount"
                    type="number"
                    value={fundAmount}
                    onChange={(e) => setFundAmount(e.target.value)}
                    disabled={isProcessing}
                  />
                  <TextField
                    select
                    label="Token"
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    disabled={isProcessing}
                    sx={{ minWidth: 120 }}
                  >
                    <MenuItem value="USDC">USDC</MenuItem>
                    <MenuItem value="DUST">DUST</MenuItem>
                    <MenuItem value="DAI">DAI</MenuItem>
                  </TextField>
                </Stack>

                <Stack direction="row" spacing={2}>
                  <Button
                    variant="outlined"
                    fullWidth
                    onClick={handleSkipFunding}
                    disabled={isProcessing}
                    sx={{
                      py: 1.5,
                      borderRadius: theme.borderRadius.full,
                    }}
                  >
                    Skip for Now
                  </Button>
                  <Button
                    variant="contained"
                    fullWidth
                    onClick={handleFundAccount}
                    disabled={isProcessing}
                    startIcon={isProcessing ? <CircularProgress size={20} /> : undefined}
                    sx={{
                      ...createPrimaryCTA(theme, mode),
                      py: 1.5,
                    }}
                  >
                    {isProcessing ? 'Processing...' : 'Deposit Now'}
                  </Button>
                </Stack>
              </Stack>
            )}

            {activeStep === 1 && (
              <Stack spacing={3}>
                <Typography variant="h6" fontWeight={theme.typography.fontWeight.semibold}>
                  Step 2: Add Your First Employee
                </Typography>
                <Typography variant="body2" color={theme.colors.text.secondary}>
                  Add an employee to your payroll system.
                </Typography>

                <TextField
                  fullWidth
                  label="Employee Name"
                  value={employeeName}
                  onChange={(e) => setEmployeeName(e.target.value)}
                  disabled={isProcessing}
                />

                <TextField
                  fullWidth
                  label="Wallet Address"
                  value={employeeWallet}
                  onChange={(e) => setEmployeeWallet(e.target.value)}
                  disabled={isProcessing}
                  helperText="The employee's Midnight wallet address"
                />

                <Stack direction="row" spacing={2}>
                  <TextField
                    fullWidth
                    label="Base Salary"
                    type="number"
                    value={baseSalary}
                    onChange={(e) => setBaseSalary(e.target.value)}
                    disabled={isProcessing}
                  />
                  <TextField
                    select
                    label="Frequency"
                    value={salaryFrequency}
                    onChange={(e) => setSalaryFrequency(e.target.value)}
                    disabled={isProcessing}
                    sx={{ minWidth: 150 }}
                  >
                    <MenuItem value="Weekly">Weekly</MenuItem>
                    <MenuItem value="Bi-weekly">Bi-weekly</MenuItem>
                    <MenuItem value="Monthly">Monthly</MenuItem>
                  </TextField>
                </Stack>

                <TextField
                  fullWidth
                  label="Role (Optional)"
                  value={employeeRole}
                  onChange={(e) => setEmployeeRole(e.target.value)}
                  disabled={isProcessing}
                />

                <Stack direction="row" spacing={2}>
                  <Button
                    variant="outlined"
                    fullWidth
                    onClick={handleSkipEmployee}
                    disabled={isProcessing}
                    sx={{
                      py: 1.5,
                      borderRadius: theme.borderRadius.full,
                    }}
                  >
                    Skip for Now
                  </Button>
                  <Button
                    variant="contained"
                    fullWidth
                    onClick={handleAddEmployee}
                    disabled={isProcessing || !employeeName || !employeeWallet}
                    startIcon={isProcessing ? <CircularProgress size={20} /> : undefined}
                    sx={{
                      ...createPrimaryCTA(theme, mode),
                      py: 1.5,
                    }}
                  >
                    {isProcessing ? 'Adding...' : 'Add Employee'}
                  </Button>
                </Stack>
              </Stack>
            )}

            {activeStep === 2 && (
              <Stack spacing={3}>
                <Typography variant="h6" fontWeight={theme.typography.fontWeight.semibold}>
                  Step 3: Setup Recurring Payment
                </Typography>
                <Typography variant="body2" color={theme.colors.text.secondary}>
                  {progress.employeeAdded
                    ? `Setup automatic payments for ${progress.employeeName}`
                    : 'Setup automatic recurring payments (requires an employee to be added first)'}
                </Typography>

                {progress.employeeAdded ? (
                  <>
                    <Alert
                      severity="info"
                      sx={{
                        bgcolor: mode === 'dark' ? `${theme.colors.info[500]}20` : theme.colors.info[50],
                      }}
                    >
                      <Typography variant="body2">
                        Employee: {progress.employeeName}
                        <br />
                        Amount: ${baseSalary} per {salaryFrequency.toLowerCase()}
                      </Typography>
                    </Alert>

                    <TextField
                      select
                      fullWidth
                      label="Frequency"
                      value={recurringFrequency}
                      onChange={(e) => setRecurringFrequency(e.target.value)}
                      disabled={isProcessing}
                    >
                      <MenuItem value="Weekly">Weekly</MenuItem>
                      <MenuItem value="Bi-weekly">Bi-weekly</MenuItem>
                      <MenuItem value="Monthly">Monthly</MenuItem>
                    </TextField>

                    <TextField
                      fullWidth
                      label="Start Date"
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      disabled={isProcessing}
                      InputLabelProps={{ shrink: true }}
                    />

                    <Stack direction="row" spacing={2}>
                      <Button
                        variant="outlined"
                        fullWidth
                        onClick={handleSkipRecurring}
                        disabled={isProcessing}
                        sx={{
                          py: 1.5,
                          borderRadius: theme.borderRadius.full,
                        }}
                      >
                        Skip for Now
                      </Button>
                      <Button
                        variant="contained"
                        fullWidth
                        onClick={handleSetupRecurring}
                        disabled={isProcessing || !startDate}
                        startIcon={isProcessing ? <CircularProgress size={20} /> : undefined}
                        sx={{
                          ...createPrimaryCTA(theme, mode),
                          py: 1.5,
                        }}
                      >
                        {isProcessing ? 'Setting up...' : 'Setup Recurring'}
                      </Button>
                    </Stack>
                  </>
                ) : (
                  <Alert severity="warning">
                    You need to add an employee first to setup recurring payments.
                    <Button
                      size="small"
                      onClick={handleSkipRecurring}
                      sx={{ mt: 1, display: 'block' }}
                    >
                      Go to Dashboard →
                    </Button>
                  </Alert>
                )}
              </Stack>
            )}

            {/* Summary (if any steps completed) */}
            {(progress.funded || progress.employeeAdded || progress.recurringSetup) && (
              <Box
                sx={{
                  p: 3,
                  borderRadius: theme.borderRadius.lg,
                  bgcolor: mode === 'dark' ? theme.colors.background.elevated : theme.colors.background.surface,
                  border: `1px solid ${theme.colors.border.light}`,
                }}
              >
                <Typography
                  variant="subtitle2"
                  fontWeight={theme.typography.fontWeight.semibold}
                  sx={{ mb: 2 }}
                >
                  Progress Summary
                </Typography>
                <Stack spacing={1}>
                  {progress.funded && (
                    <Stack direction="row" spacing={1} alignItems="center">
                      <CheckCircleIcon sx={{ fontSize: 20, color: theme.colors.success[500] }} />
                      <Typography variant="body2">
                        Funded: ${progress.fundedAmount?.toLocaleString()}
                      </Typography>
                    </Stack>
                  )}
                  {progress.employeeAdded && (
                    <Stack direction="row" spacing={1} alignItems="center">
                      <CheckCircleIcon sx={{ fontSize: 20, color: theme.colors.success[500] }} />
                      <Typography variant="body2">
                        Employee: {progress.employeeName} added
                      </Typography>
                    </Stack>
                  )}
                  {progress.recurringSetup && (
                    <Stack direction="row" spacing={1} alignItems="center">
                      <CheckCircleIcon sx={{ fontSize: 20, color: theme.colors.success[500] }} />
                      <Typography variant="body2">
                        Recurring: {recurringFrequency} payment setup
                      </Typography>
                    </Stack>
                  )}
                </Stack>
              </Box>
            )}
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
};
