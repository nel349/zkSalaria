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
  Alert,
  CircularProgress,
  FormHelperText,
  LinearProgress,
  Chip,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import { usePayrollWallet } from '../contexts/PayrollWalletContext';
import { useTheme, useThemeValues, createGlassMorphism, createPrimaryCTA } from '../theme';
import { computeVerifierPubkey } from '../utils/verifierPubkey';
import { saveCompany } from '../utils/CompaniesLocalState';
import pino from 'pino';

// Create logger for auditor application
const logger = pino({
  name: 'auditorApplication',
  level: 'info',
  browser: {
    asObject: false,
  },
});

interface AuditorFormData {
  fullName: string;
  email: string;
  licenseType: string;
  licenseNumber: string;
  licenseState: string;
  firmName: string;
  yearsExperience: string;
  companyContractAddress: string;
}

/**
 * Auditor Application Page
 * Form for licensed CPAs to apply to join the verification marketplace
 * Reference: AUDITOR_IMPLEMENTATION_COMPLETE.md - Step 2: Application Form
 */
export const AuditorApplicationPage: React.FC = () => {
  const navigate = useNavigate();
  const { mode } = useTheme();
  const theme = useThemeValues();
  const { walletAddress, providers } = usePayrollWallet();

  const [formData, setFormData] = useState<AuditorFormData>({
    fullName: '',
    email: '',
    licenseType: '',
    licenseNumber: '',
    licenseState: '',
    firmName: '',
    yearsExperience: '',
    companyContractAddress: '',
  });

  const [errors, setErrors] = useState<Partial<Record<keyof AuditorFormData, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [licenseFile, setLicenseFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const licenseTypes = [
    'CPA (Certified Public Accountant)',
    'CA (Chartered Accountant)',
    'ACCA (Association of Chartered Certified Accountants)',
    'CIA (Certified Internal Auditor)',
    'Other Professional License',
  ];

  const experienceLevels = [
    '0-2 years',
    '3-5 years',
    '6-10 years',
    '11-15 years',
    '16-20 years',
    '20+ years',
  ];

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof AuditorFormData, string>> = {};

    // Full name validation
    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    } else if (formData.fullName.length < 2 || formData.fullName.length > 100) {
      newErrors.fullName = 'Name must be between 2 and 100 characters';
    }

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // License type validation
    if (!formData.licenseType) {
      newErrors.licenseType = 'License type is required';
    }

    // License number validation
    if (!formData.licenseNumber.trim()) {
      newErrors.licenseNumber = 'License number is required';
    }

    // License state validation
    if (!formData.licenseState.trim()) {
      newErrors.licenseState = 'License state/jurisdiction is required';
    }

    // Years of experience validation
    if (!formData.yearsExperience) {
      newErrors.yearsExperience = 'Years of experience is required';
    }

    // Company contract address validation
    if (!formData.companyContractAddress.trim()) {
      newErrors.companyContractAddress = 'Company contract address is required';
    }

    // License file validation
    if (!licenseFile) {
      setError('Please upload a copy of your professional license');
      return false;
    }

    // Wallet validation
    if (!walletAddress) {
      setError('Please connect your Midnight wallet before applying');
      return false;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        setError('Please upload a JPEG, PNG, or PDF file');
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('File size must be less than 5MB');
        return;
      }

      setLicenseFile(file);
      setError(null);
      logger.info(`License file selected: ${file.name} (${file.size} bytes)`);
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    if (!walletAddress) {
      setError('Wallet not connected');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      logger.info('Submitting auditor application...');

      // Simulate file upload progress
      for (let i = 0; i <= 100; i += 10) {
        setUploadProgress(i);
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Compute verifier public key using domain-separated hash
      // This matches the contract's verifier_public_key circuit with domain separation
      const auditorPubkey = await computeVerifierPubkey(providers.walletProvider.coinPublicKey);

      logger.info(`Auditor public key (domain-separated hash): ${auditorPubkey}`);

      // Save the company to localStorage so the status page can check it
      saveCompany({
        contractAddress: formData.companyContractAddress.trim(),
        name: 'Applied Company', // Placeholder name
        walletAddress: walletAddress,
        createdAt: new Date().toISOString(),
      });

      // Save application data to localStorage
      const applicationId = `APP-${Date.now()}`;

      // Application starts in "pending" status
      // Company admins must review and register the auditor as a trusted verifier
      localStorage.setItem('auditorApplicationId', applicationId);
      localStorage.setItem('auditorApplicationStatus', 'pending');
      localStorage.setItem('auditorPubkey', auditorPubkey);
      localStorage.setItem('auditorApplicationData', JSON.stringify({
        ...formData,
        walletAddress,
        auditorPubkey,
        submittedAt: new Date().toISOString(),
      }));

      logger.info(`Application submitted successfully: ${applicationId}`);
      logger.info(`Auditor pubkey: ${auditorPubkey}`);
      logger.info(`Company address: ${formData.companyContractAddress}`);
      logger.info('Application is pending. Company admins must register this auditor as a trusted verifier.');

      // Navigate to status page
      navigate('/auditor/status');
    } catch (err) {
      logger.error('Failed to submit application:', err);
      setError(err instanceof Error ? err.message : 'Failed to submit application. Please try again.');
    } finally {
      setIsSubmitting(false);
      setUploadProgress(0);
    }
  };

  const handleChange = (field: keyof AuditorFormData) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value,
    }));
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined,
      }));
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: mode === 'dark'
          ? 'linear-gradient(135deg, #0a0e27 0%, #1a1f3a 50%, #2a2f4a 100%)'
          : 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
        py: 8,
      }}
    >
      <Container maxWidth="md">
        {/* Header */}
        <Stack spacing={2} alignItems="center" textAlign="center" mb={6}>
          <VerifiedUserIcon sx={{ fontSize: 60, color: theme.colors.primary[mode === "dark" ? 400 : 600] }} />
          <Typography
            variant="h3"
            fontWeight="700"
            sx={{
              background: `linear-gradient(135deg, ${theme.colors.primary[mode === "dark" ? 400 : 600]} 0%, ${theme.colors.secondary[mode === "dark" ? 400 : 600]} 100%)`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Auditor Application
          </Typography>
          <Typography variant="body1" color="text.secondary" maxWidth="600px">
            Complete the form below to apply for the zkSalaria verification marketplace
          </Typography>
          {walletAddress && (
            <Chip
              label={<Typography>{`Wallet: ${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`}</Typography>}
              color="success"
              variant="outlined"
            />
          )}
        </Stack>

        {/* Application Form */}
        <Paper
          sx={{
            ...createGlassMorphism(theme, mode),
            p: 6,
          }}
        >
          <Stack spacing={4}>
            {/* Error Alert */}
            {error && (
              <Alert severity="error" onClose={() => setError(null)}>
                {error}
              </Alert>
            )}

            {/* Wallet Connection Alert */}
            {!walletAddress && (
              <Alert severity="warning">
                Please connect your Midnight wallet to proceed with the application.
                <Button
                  size="small"
                  onClick={() => navigate('/connect')}
                  sx={{ ml: 2 }}
                >
                  Connect Wallet
                </Button>
              </Alert>
            )}

            {/* Company Information */}
            <Box>
              <Typography variant="h6" fontWeight="600" mb={3}>
                Company Information
              </Typography>
              <Stack spacing={3}>
                <TextField
                  fullWidth
                  label="Company Contract Address"
                  value={formData.companyContractAddress}
                  onChange={handleChange('companyContractAddress')}
                  error={!!errors.companyContractAddress}
                  helperText={errors.companyContractAddress || 'Paste the company\'s payroll contract address from their dashboard URL'}
                  required
                  placeholder="0x..."
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      fontFamily: 'monospace',
                      fontSize: '0.9rem',
                    },
                  }}
                />
              </Stack>
            </Box>

            {/* Personal Information */}
            <Box>
              <Typography variant="h6" fontWeight="600" mb={3}>
                Personal Information
              </Typography>
              <Stack spacing={3}>
                <TextField
                  fullWidth
                  label="Full Name"
                  value={formData.fullName}
                  onChange={handleChange('fullName')}
                  error={!!errors.fullName}
                  helperText={errors.fullName}
                  required
                />

                <TextField
                  fullWidth
                  label="Email Address"
                  type="email"
                  value={formData.email}
                  onChange={handleChange('email')}
                  error={!!errors.email}
                  helperText={errors.email}
                  required
                />
              </Stack>
            </Box>

            {/* Professional Credentials */}
            <Box>
              <Typography variant="h6" fontWeight="600" mb={3}>
                Professional Credentials
              </Typography>
              <Stack spacing={3}>
                <TextField
                  fullWidth
                  select
                  label="License Type"
                  value={formData.licenseType}
                  onChange={handleChange('licenseType')}
                  error={!!errors.licenseType}
                  helperText={errors.licenseType}
                  required
                >
                  {licenseTypes.map((type) => (
                    <MenuItem key={type} value={type}>
                      {type}
                    </MenuItem>
                  ))}
                </TextField>

                <TextField
                  fullWidth
                  label="License Number"
                  value={formData.licenseNumber}
                  onChange={handleChange('licenseNumber')}
                  error={!!errors.licenseNumber}
                  helperText={errors.licenseNumber}
                  required
                />

                <TextField
                  fullWidth
                  label="License State/Jurisdiction"
                  value={formData.licenseState}
                  onChange={handleChange('licenseState')}
                  error={!!errors.licenseState}
                  helperText={errors.licenseState || 'e.g., California, New York, Ontario, etc.'}
                  required
                />

                <TextField
                  fullWidth
                  label="Firm Name (Optional)"
                  value={formData.firmName}
                  onChange={handleChange('firmName')}
                  helperText="Enter your firm name if you're affiliated with one"
                />

                <TextField
                  fullWidth
                  select
                  label="Years of Experience"
                  value={formData.yearsExperience}
                  onChange={handleChange('yearsExperience')}
                  error={!!errors.yearsExperience}
                  helperText={errors.yearsExperience}
                  required
                >
                  {experienceLevels.map((level) => (
                    <MenuItem key={level} value={level}>
                      {level}
                    </MenuItem>
                  ))}
                </TextField>
              </Stack>
            </Box>

            {/* License Upload */}
            <Box>
              <Typography variant="h6" fontWeight="600" mb={2}>
                License Verification
              </Typography>
              <Typography variant="body2" color="text.secondary" mb={3}>
                Upload a copy of your professional license (JPEG, PNG, or PDF, max 5MB)
              </Typography>

              <Button
                variant="outlined"
                component="label"
                startIcon={<CloudUploadIcon />}
                fullWidth
                sx={{
                  py: 3,
                  borderStyle: 'dashed',
                  borderWidth: 2,
                  borderColor: licenseFile ? theme.colors.success[500] : theme.colors.primary[mode === "dark" ? 400 : 600],
                  '&:hover': {
                    borderColor: theme.colors.secondary[mode === "dark" ? 400 : 600],
                    backgroundColor: `${theme.colors.primary[mode === "dark" ? 400 : 600]}10`,
                  },
                }}
              >
                {licenseFile ? licenseFile.name : 'Choose License File'}
                <input
                  type="file"
                  hidden
                  accept="image/jpeg,image/png,image/jpg,application/pdf"
                  onChange={handleFileUpload}
                />
              </Button>

              {uploadProgress > 0 && (
                <Box sx={{ mt: 2 }}>
                  <LinearProgress variant="determinate" value={uploadProgress} />
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                    Uploading... {uploadProgress}%
                  </Typography>
                </Box>
              )}
            </Box>

            {/* Submit Button */}
            <Stack direction="row" spacing={2} justifyContent="flex-end" mt={4}>
              <Button
                variant="outlined"
                size="large"
                onClick={() => navigate('/auditor')}
                disabled={isSubmitting}
              >
                <Typography>Cancel</Typography>
              </Button>
              <Button
                variant="contained"
                size="large"
                onClick={handleSubmit}
                disabled={isSubmitting || !walletAddress}
                sx={createPrimaryCTA(theme, mode)}
                startIcon={isSubmitting ? <CircularProgress size={20} /> : undefined}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Application'}
              </Button>
            </Stack>
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
};
