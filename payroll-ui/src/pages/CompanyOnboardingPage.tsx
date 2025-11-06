import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  TextField,
  Button,
  Stack,
  Paper,
  MenuItem,
  Checkbox,
  FormControlLabel,
  Alert,
  CircularProgress,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import BusinessIcon from '@mui/icons-material/Business';
import { usePayrollWallet } from '../contexts/PayrollWalletContext';
import { useTheme, useThemeValues, createGlassMorphism, createPrimaryCTA } from '../theme';

interface CompanyFormData {
  companyName: string;
  industry: string;
  companySize: string;
  adminEmail: string;
  agreedToTerms: boolean;
}

/**
 * Company Onboarding Page - Phase 1.4
 * Company registration form with smart contract deployment
 * Reference: docs/design/AUTH_ONBOARDING_FLOW.md (Page 7)
 */
export const CompanyOnboardingPage: React.FC = () => {
  const navigate = useNavigate();
  const { mode } = useTheme();
  const theme = useThemeValues();
  const { walletAddress, providers } = usePayrollWallet();

  const [formData, setFormData] = useState<CompanyFormData>({
    companyName: '',
    industry: '',
    companySize: '',
    adminEmail: '',
    agreedToTerms: false,
  });

  const [errors, setErrors] = useState<Partial<Record<keyof CompanyFormData, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const industries = [
    'Technology',
    'Finance',
    'Healthcare',
    'Education',
    'Retail',
    'Manufacturing',
    'Real Estate',
    'Other',
  ];

  const companySizes = ['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+'];

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof CompanyFormData, string>> = {};

    // Company name validation
    if (!formData.companyName.trim()) {
      newErrors.companyName = 'Company name is required';
    } else if (formData.companyName.length < 2 || formData.companyName.length > 100) {
      newErrors.companyName = 'Company name must be between 2 and 100 characters';
    }

    // Email validation
    if (!formData.adminEmail.trim()) {
      newErrors.adminEmail = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.adminEmail)) {
      newErrors.adminEmail = 'Please enter a valid email address';
    }

    // Terms validation
    if (!formData.agreedToTerms) {
      newErrors.agreedToTerms = 'You must agree to the Terms of Service';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      console.log('[CompanyOnboarding] Deploying payroll contract...');
      console.log('Form data:', formData);
      console.log('Wallet address:', walletAddress);

      // TODO: Deploy actual contract
      // const result = await PayrollAPI.deploy(
      //   providers,
      //   walletAddress,
      //   formData.companyName
      // );

      // Mock deployment for now
      await new Promise((resolve) => setTimeout(resolve, 2000));

      console.log('[CompanyOnboarding] Contract deployed successfully');

      // Save company data to localStorage (temporary until we have proper state management)
      localStorage.setItem('user_role', 'company');
      localStorage.setItem(
        'company_data',
        JSON.stringify({
          name: formData.companyName,
          industry: formData.industry,
          size: formData.companySize,
          email: formData.adminEmail,
          walletAddress,
        })
      );

      // Navigate to quick start wizard
      navigate('/onboarding/company/quickstart');
    } catch (err) {
      console.error('[CompanyOnboarding] Error deploying contract:', err);
      setError(err instanceof Error ? err.message : 'Failed to create company');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate('/onboarding/role');
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
            <Stack spacing={2} alignItems="center" textAlign="center">
              <BusinessIcon
                sx={{
                  fontSize: 64,
                  color: theme.colors.primary[mode === 'dark' ? 400 : 600],
                }}
              />
              <Typography
                variant="h4"
                fontWeight={theme.typography.fontWeight.bold}
                color={theme.colors.text.primary}
              >
                Setup Your Company
              </Typography>
              <Typography variant="body1" color={theme.colors.text.secondary}>
                Let's get your company registered on the zkSalaria payroll system
              </Typography>
            </Stack>

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

            {/* Form */}
            <Box component="form" onSubmit={handleSubmit}>
              <Stack spacing={3}>
                {/* Company Name */}
                <TextField
                  fullWidth
                  label="Company Name"
                  required
                  value={formData.companyName}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  error={!!errors.companyName}
                  helperText={errors.companyName}
                  disabled={isSubmitting}
                />

                {/* Industry */}
                <TextField
                  fullWidth
                  select
                  label="Industry"
                  value={formData.industry}
                  onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                  disabled={isSubmitting}
                >
                  {industries.map((industry) => (
                    <MenuItem key={industry} value={industry}>
                      {industry}
                    </MenuItem>
                  ))}
                </TextField>

                {/* Company Size */}
                <TextField
                  fullWidth
                  select
                  label="Company Size"
                  value={formData.companySize}
                  onChange={(e) => setFormData({ ...formData, companySize: e.target.value })}
                  disabled={isSubmitting}
                >
                  {companySizes.map((size) => (
                    <MenuItem key={size} value={size}>
                      {size} employees
                    </MenuItem>
                  ))}
                </TextField>

                {/* Admin Email */}
                <TextField
                  fullWidth
                  label="Admin Email"
                  type="email"
                  required
                  value={formData.adminEmail}
                  onChange={(e) => setFormData({ ...formData, adminEmail: e.target.value })}
                  error={!!errors.adminEmail}
                  helperText={errors.adminEmail}
                  disabled={isSubmitting}
                />

                {/* Connected Wallet (Read-only) */}
                <TextField
                  fullWidth
                  label="Connected Wallet"
                  value={walletAddress ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}` : ''}
                  disabled
                  helperText="Your company will be associated with this wallet address"
                />

                {/* Terms Agreement */}
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.agreedToTerms}
                      onChange={(e) => setFormData({ ...formData, agreedToTerms: e.target.checked })}
                      disabled={isSubmitting}
                      sx={{
                        color: theme.colors.text.secondary,
                        '&.Mui-checked': {
                          color: theme.colors.primary[mode === 'dark' ? 400 : 600],
                        },
                        '& .MuiSvgIcon-root': {
                          fontSize: 20,
                        },
                      }}
                    />
                  }
                  label={
                    <Typography variant="body2" color={theme.colors.text.secondary}>
                      I agree to the{' '}
                      <Typography
                        component="a"
                        variant="body2"
                        href="https://midnight.network/terms"
                        target="_blank"
                        rel="noopener noreferrer"
                        sx={{
                          color: theme.colors.primary[mode === 'dark' ? 400 : 600],
                          textDecoration: 'none',
                          '&:hover': { textDecoration: 'underline' },
                        }}
                      >
                        Terms of Service
                      </Typography>
                    </Typography>
                  }
                />
                {errors.agreedToTerms && (
                  <Typography variant="caption" color="error">
                    {errors.agreedToTerms}
                  </Typography>
                )}

                {/* Action Buttons */}
                <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
                  <Button
                    variant="outlined"
                    fullWidth
                    onClick={handleCancel}
                    disabled={isSubmitting}
                    sx={{
                      py: 1.5,
                      borderRadius: theme.borderRadius.full,
                      borderColor: theme.colors.border.default,
                      color: theme.colors.text.secondary,
                      '&:hover': {
                        borderColor: theme.colors.border.strong,
                        bgcolor: theme.colors.action.hover,
                      },
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="contained"
                    fullWidth
                    disabled={isSubmitting}
                    startIcon={isSubmitting ? <CircularProgress size={20} /> : undefined}
                    sx={{
                      ...createPrimaryCTA(theme, mode),
                      py: 1.5,
                    }}
                  >
                    {isSubmitting ? 'Creating Company...' : 'Create Company →'}
                  </Button>
                </Stack>
              </Stack>
            </Box>
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
};
