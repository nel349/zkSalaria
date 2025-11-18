import React, { useState } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  Stack,
  Alert,
  Collapse,
  IconButton,
  CircularProgress,
  Autocomplete,
  FormControl,
  FormLabel,
} from '@mui/material';
import BugReportIcon from '@mui/icons-material/BugReport';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { useThemeValues } from '../theme';
import { toast } from 'react-hot-toast';
import { type DeployedPayrollAPI } from '@zksalaria/payroll-api';
import { type PaymentMetadata } from '../types/payment';
import { shouldShowDebugPanel } from '../utils/devSettings';

interface DebugPanelProps {
  api: DeployedPayrollAPI | null;
  employees: Array<{ id: string; name: string }>;
  contractAddress: string;
}

/**
 * Debug Panel - Development/Testing Tools
 * Provides quick access to debug functions like creating 6 monthly payments at once
 */
export const DebugPanel: React.FC<DebugPanelProps> = ({ api, employees, contractAddress }) => {
  const theme = useThemeValues();
  const [expanded, setExpanded] = useState(true);
  const [selectedEmployee, setSelectedEmployee] = useState<{ id: string; name: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleCreate6Payments = async () => {
    if (!api) {
      toast.error('API not available');
      return;
    }

    if (!selectedEmployee) {
      toast.error('Please select an employee');
      return;
    }

    setIsLoading(true);

    // Use fixed defaults: $5000/month base with $500 variance for realistic variation
    const baseAmount = '5000.00';
    const varianceAmount = '500.00';
    const base = parseFloat(baseAmount);
    const variance = parseFloat(varianceAmount);

    try {
      const success = await api.debugCreate6MonthlyPayments(
        selectedEmployee.id,
        baseAmount,
        varianceAmount
      );

      if (success) {
        // Calculate the 6 payment amounts (matching the circuit logic)
        // Circuit creates: base, base+var, base, base-var, base+var, base
        const paymentAmounts = [
          base,                // amount_0 = base
          base + variance,     // amount_1 = base + variance
          base,                // amount_2 = base
          base - variance,     // amount_3 = base - variance
          base + variance,     // amount_4 = base + variance
          base                 // amount_5 = base
        ];

        // Save 6 payment metadata entries to localStorage
        const paymentsKey = `payroll-ui.payments.${contractAddress}`;
        const existingPayments: PaymentMetadata[] = JSON.parse(localStorage.getItem(paymentsKey) || '[]');

        const baseTimestamp = Date.now();
        paymentAmounts.forEach((amount, index) => {
          const paymentMetadata: PaymentMetadata = {
            employeeId: selectedEmployee.id,
            employeeName: selectedEmployee.name,
            amount: amount,
            paymentType: 'Regular Salary',
            memo: `Debug: Auto-generated payment ${index + 1}/6`,
            timestamp: baseTimestamp + index, // Ensure unique timestamps
            companyId: contractAddress,
          };
          existingPayments.push(paymentMetadata);
        });

        localStorage.setItem(paymentsKey, JSON.stringify(existingPayments));

        console.log(`[DebugPanel] Saved 6 payment metadata entries:`, paymentAmounts);
        toast.success('✅ Created 6 monthly payments with metadata!');
      } else {
        toast.error('Failed to create payments');
      }
    } catch (error) {
      console.error('Failed to create 6 payments:', error);
      toast.error(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Don't show debug panel if API not available or if disabled in settings
  if (!api || !shouldShowDebugPanel()) {
    return null;
  }

  return (
    <Paper
      elevation={3}
      sx={{
        p: 2,
        mb: 3,
        border: `2px solid ${theme.colors.warning[500]}`,
        bgcolor: theme.colors.warning[50],
      }}
    >
      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <Stack direction="row" alignItems="center" spacing={1}>
          <BugReportIcon sx={{ color: theme.colors.warning[700] }} />
          <Typography variant="h6" fontWeight={theme.typography.fontWeight.semibold} color={theme.colors.warning[700]}>
            Debug Panel (Development Only)
          </Typography>
        </Stack>
        <IconButton onClick={() => setExpanded(!expanded)} size="small">
          {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        </IconButton>
      </Stack>

      <Collapse in={expanded}>
        <Box sx={{ mt: 2 }}>
          <Alert severity="warning" sx={{ mb: 2 }}>
            <Typography variant="caption">
              <strong>Warning:</strong> This panel creates backdated test data. Use only in development/testing environments!
            </Typography>
          </Alert>

          <Stack spacing={2}>
            <FormControl fullWidth>
              <FormLabel sx={{ mb: 1, color: theme.colors.text.primary }}>Select Employee</FormLabel>
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
                      sx: {
                        bgcolor: 'white',
                        color: theme.colors.text.primary,
                      },
                    }}
                  />
                )}
                sx={{
                  '& .MuiAutocomplete-popupIndicator': {
                    color: theme.colors.text.secondary,
                  },
                }}
              />
            </FormControl>

            <Alert severity="info">
              <Typography variant="body2">
                <strong>Quick Test Data:</strong> Creates 6 backdated monthly payments (~$5,000/month ± $500) spanning the last 6 months.
                Perfect for testing ZKML income proofs without manual data entry.
              </Typography>
            </Alert>

            <Button
              variant="contained"
              color="warning"
              fullWidth
              size="large"
              onClick={handleCreate6Payments}
              disabled={isLoading || !selectedEmployee}
              startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : <BugReportIcon />}
              sx={{
                mt: 1,
                fontWeight: theme.typography.fontWeight.bold,
                py: 1.5,
                fontSize: '1rem',
              }}
            >
              {isLoading ? 'Creating 6 Payments...' : '⚡ Generate 6 Months of Test Data'}
            </Button>
          </Stack>
        </Box>
      </Collapse>
    </Paper>
  );
};
