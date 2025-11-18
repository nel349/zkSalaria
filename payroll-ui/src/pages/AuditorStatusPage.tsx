import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Stack,
  Paper,
  Alert,
  Chip,
  LinearProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
  Tooltip,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import CancelIcon from '@mui/icons-material/Cancel';
import EmailIcon from '@mui/icons-material/Email';
import RefreshIcon from '@mui/icons-material/Refresh';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { useTheme, useThemeValues, createGlassMorphism, createPrimaryCTA } from '../theme';
import { usePayrollWallet } from '../contexts/PayrollWalletContext';
import { PayrollAPI } from '@zksalaria/payroll-api';
import { listCompanies } from '../utils/CompaniesLocalState';
import pino from 'pino';

// Create logger for status page
const logger = pino({
  name: 'auditorStatus',
  level: 'info',
  browser: {
    asObject: false,
  },
});

type ApplicationStatus = 'pending' | 'approved' | 'rejected';

interface ApplicationData {
  applicationId: string;
  status: ApplicationStatus;
  fullName: string;
  email: string;
  licenseType: string;
  submittedAt: string;
  reviewedAt?: string;
  rejectionReason?: string;
}

/**
 * Auditor Application Status Page
 * Shows current status of auditor application
 * Reference: AUDITOR_IMPLEMENTATION_COMPLETE.md - Step 3: Application Review Status
 */
export const AuditorStatusPage: React.FC = () => {
  const navigate = useNavigate();
  const { mode } = useTheme();
  const theme = useThemeValues();
  const { walletAddress, providers } = usePayrollWallet();

  const [applicationData, setApplicationData] = useState<ApplicationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [trustedAtCompanies, setTrustedAtCompanies] = useState<string[]>([]);
  const [auditorPubkey, setAuditorPubkey] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);

  const checkRegistrationStatus = useCallback(async () => {
    const pubkey = localStorage.getItem('auditorPubkey');

    if (!pubkey) {
      logger.warn('No auditor pubkey found, skipping registration check');
      return;
    }

    if (!walletAddress) {
      logger.warn('No wallet address, skipping registration check');
      return;
    }

    if (!providers) {
      logger.warn('Providers not available, skipping registration check');
      return;
    }

    setChecking(true);
    logger.info('[checkRegistrationStatus] Checking for auditor:', { pubkey, walletAddress });

    try {
      const companies = listCompanies();
      logger.info(`[checkRegistrationStatus] Checking ${companies.length} companies`);

      const trustedCompanies: string[] = [];

      for (const company of companies) {
        try {
          logger.info(`[checkRegistrationStatus] Checking company: ${company.name} at ${company.contractAddress}`);
          const api = await PayrollAPI.connect(providers, company.contractAddress, walletAddress, logger);
          const isTrusted = await api.isTrustedVerifier(pubkey);

          logger.info(`[checkRegistrationStatus] ${company.name} - isTrusted: ${isTrusted}`);

          if (isTrusted) {
            logger.info(`✅ Auditor IS TRUSTED at company: ${company.name}`);
            trustedCompanies.push(company.name);
          }
        } catch (err) {
          logger.error(`❌ Failed to check trusted status at ${company.name}:`, err);
        }
      }

      logger.info(`[checkRegistrationStatus] Total trusted companies: ${trustedCompanies.length}`, trustedCompanies);
      setTrustedAtCompanies(trustedCompanies);

      // If registered at any company, update status to approved
      if (trustedCompanies.length > 0) {
        logger.info('🎉 Auditor registered at companies - updating status to approved');
        localStorage.setItem('auditorApplicationStatus', 'approved');
        setApplicationData(prev => prev ? { ...prev, status: 'approved' } : null);
      } else {
        logger.info('⏳ Auditor not yet registered at any companies');
      }
    } catch (err) {
      logger.error('Failed to check registration status:', err);
    } finally {
      setChecking(false);
    }
  }, [walletAddress, providers]);

  useEffect(() => {
    // Load application data from localStorage
    const applicationId = localStorage.getItem('auditorApplicationId');
    const status = localStorage.getItem('auditorApplicationStatus') as ApplicationStatus || 'pending';
    const storedData = localStorage.getItem('auditorApplicationData');
    const pubkey = localStorage.getItem('auditorPubkey');

    setAuditorPubkey(pubkey);

    if (applicationId && storedData) {
      const parsedData = JSON.parse(storedData);
      setApplicationData({
        applicationId,
        status,
        ...parsedData,
      });
    }

    setLoading(false);

    // Check registration status on mount
    if (pubkey && walletAddress && providers) {
      checkRegistrationStatus();
    }

    // Poll every 10 seconds to check for registration
    const pollInterval = setInterval(() => {
      // Always check current status from localStorage
      const currentStatus = localStorage.getItem('auditorApplicationStatus');
      const currentPubkey = localStorage.getItem('auditorPubkey');

      if (currentPubkey && walletAddress && providers && currentStatus === 'pending') {
        logger.info('Polling: Checking registration status...');
        checkRegistrationStatus();
      }
    }, 10000); // 10 seconds

    return () => clearInterval(pollInterval);
  }, [walletAddress, providers, checkRegistrationStatus]);

  const handleCopyPubkey = () => {
    if (auditorPubkey) {
      navigator.clipboard.writeText(auditorPubkey);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
  };

  if (loading) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <LinearProgress sx={{ width: '300px' }} />
      </Box>
    );
  }

  if (!applicationData) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: mode === 'dark'
            ? 'linear-gradient(135deg, #0a0e27 0%, #1a1f3a 50%, #2a2f4a 100%)'
            : 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
        }}
      >
        <Container maxWidth="sm">
          <Paper sx={{ ...createGlassMorphism(theme, mode), p: 6, textAlign: 'center' }}>
            <Typography variant="h5" fontWeight="600" mb={3}>
              No Application Found
            </Typography>
            <Typography color="text.secondary" mb={4}>
              You haven't submitted an auditor application yet.
            </Typography>
            <Button
              variant="contained"
              size="large"
              onClick={() => navigate('/auditor/apply')}
              sx={createPrimaryCTA(theme, mode)}
            >
              Apply Now
            </Button>
          </Paper>
        </Container>
      </Box>
    );
  }

  const getStatusIcon = () => {
    switch (applicationData.status) {
      case 'approved':
        return <CheckCircleIcon sx={{ fontSize: 80, color: theme.colors.success[500] }} />;
      case 'rejected':
        return <CancelIcon sx={{ fontSize: 80, color: theme.colors.error[500] }} />;
      case 'pending':
      default:
        return <HourglassEmptyIcon sx={{ fontSize: 80, color: theme.colors.primary[mode === "dark" ? 400 : 600] }} />;
    }
  };

  const getStatusColor = () => {
    switch (applicationData.status) {
      case 'approved':
        return 'success';
      case 'rejected':
        return 'error';
      case 'pending':
      default:
        return 'warning';
    }
  };

  const getStatusMessage = () => {
    switch (applicationData.status) {
      case 'approved':
        return 'Congratulations! Your application has been approved.';
      case 'rejected':
        return 'Unfortunately, your application was not approved at this time.';
      case 'pending':
      default:
        return 'Your application is currently under review.';
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
        <Stack spacing={3} alignItems="center" textAlign="center" mb={6}>
          {getStatusIcon()}
          <Typography
            variant="h3"
            fontWeight="700"
            sx={{
              background: `linear-gradient(135deg, ${theme.colors.primary[mode === "dark" ? 400 : 600]} 0%, ${theme.colors.secondary[mode === "dark" ? 400 : 600]} 100%)`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Application Status
          </Typography>
          <Chip
            label={applicationData.status.toUpperCase()}
            color={getStatusColor()}
            sx={{ fontSize: '1rem', fontWeight: 600, px: 2 }}
          />
        </Stack>

        {/* Status Alert */}
        <Alert severity={getStatusColor() as any} sx={{ mb: 4, fontSize: '1.1rem' }}>
          {getStatusMessage()}
        </Alert>

        {/* Application Details */}
        <Paper
          sx={{
            ...createGlassMorphism(theme, mode),
            p: 6,
            mb: 4,
          }}
        >
          <Typography variant="h5" fontWeight="600" mb={4}>
            Application Details
          </Typography>

          <List>
            <ListItem>
              <ListItemText
                primary="Application ID"
                secondary={applicationData.applicationId}
                primaryTypographyProps={{ fontWeight: 600 }}
              />
            </ListItem>
            <ListItem>
              <ListItemText
                primary="Full Name"
                secondary={applicationData.fullName}
                primaryTypographyProps={{ fontWeight: 600 }}
              />
            </ListItem>
            <ListItem>
              <ListItemText
                primary="Email"
                secondary={applicationData.email}
                primaryTypographyProps={{ fontWeight: 600 }}
              />
            </ListItem>
            <ListItem>
              <ListItemText
                primary="License Type"
                secondary={applicationData.licenseType}
                primaryTypographyProps={{ fontWeight: 600 }}
              />
            </ListItem>
            <ListItem>
              <ListItemText
                primary="Submitted At"
                secondary={new Date(applicationData.submittedAt).toLocaleString()}
                primaryTypographyProps={{ fontWeight: 600 }}
              />
            </ListItem>
            {applicationData.reviewedAt && (
              <ListItem>
                <ListItemText
                  primary="Reviewed At"
                  secondary={new Date(applicationData.reviewedAt).toLocaleString()}
                  primaryTypographyProps={{ fontWeight: 600 }}
                />
              </ListItem>
            )}
          </List>
        </Paper>

        {/* Status-Specific Content */}
        {applicationData.status === 'pending' && (
          <>
            {/* Auditor Public Key Card */}
            <Paper
              sx={{
                ...createGlassMorphism(theme, mode),
                p: 6,
                mb: 4,
              }}
            >
              <Stack spacing={3}>
                <Stack direction="row" alignItems="center" justifyContent="space-between">
                  <Typography variant="h6" fontWeight="600">
                    Your Auditor Public Key
                  </Typography>
                  <Stack direction="row" spacing={1}>
                    <Tooltip title={copySuccess ? "Copied!" : "Copy to clipboard"}>
                      <IconButton size="small" onClick={handleCopyPubkey} color="primary">
                        <ContentCopyIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Refresh status">
                      <IconButton
                        size="small"
                        onClick={checkRegistrationStatus}
                        disabled={checking}
                        color="primary"
                      >
                        <RefreshIcon className={checking ? 'spinning' : ''} />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                </Stack>

                <Box
                  sx={{
                    p: 3,
                    borderRadius: 2,
                    bgcolor: mode === 'dark' ? `${theme.colors.primary[500]}10` : theme.colors.primary[50],
                    border: `1px dashed ${theme.colors.primary[500]}`,
                  }}
                >
                  <Typography
                    variant="body2"
                    sx={{
                      fontFamily: 'monospace',
                      wordBreak: 'break-all',
                      color: theme.colors.primary[500],
                      fontSize: '0.9rem',
                    }}
                  >
                    {auditorPubkey || 'Not found'}
                  </Typography>
                </Box>

                <Alert severity="info">
                  <Typography variant="body2">
                    <strong>Share this public key with company admins</strong> so they can register you as a trusted verifier.
                    Company admins use the "Register Verifier" feature in their dashboard.
                  </Typography>
                </Alert>

                {/* Registration Status */}
                {checking && (
                  <Alert severity="info" icon={<RefreshIcon className="spinning" />}>
                    Checking registration status across companies...
                  </Alert>
                )}

                {!checking && trustedAtCompanies.length > 0 && (
                  <Alert severity="success">
                    <Typography variant="body2" fontWeight="600" mb={1}>
                      Registered at {trustedAtCompanies.length} {trustedAtCompanies.length === 1 ? 'company' : 'companies'}:
                    </Typography>
                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                      {trustedAtCompanies.map((companyName, index) => (
                        <Chip
                          key={index}
                          label={companyName}
                          size="small"
                          color="success"
                          variant="outlined"
                        />
                      ))}
                    </Stack>
                  </Alert>
                )}

                {!checking && trustedAtCompanies.length === 0 && (
                  <Alert severity="warning">
                    Not yet registered at any companies. Waiting for company admin approval...
                  </Alert>
                )}
              </Stack>
            </Paper>

            {/* What Happens Next */}
            <Paper
              sx={{
                ...createGlassMorphism(theme, mode),
                p: 6,
                mb: 4,
              }}
            >
              <Stack spacing={3}>
                <Typography variant="h6" fontWeight="600">
                  What Happens Next?
                </Typography>
                <List>
                  <ListItem>
                    <ListItemIcon>
                      <CheckCircleIcon sx={{ color: theme.colors.success[500] }} />
                    </ListItemIcon>
                    <ListItemText
                      primary="Share Your Public Key"
                      secondary="Send your auditor public key (shown above) to company admins via email or secure channel"
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <CheckCircleIcon sx={{ color: theme.colors.success[500] }} />
                    </ListItemIcon>
                    <ListItemText
                      primary="Company Registration"
                      secondary="Company admin registers your public key using the 'Register Verifier' feature"
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <CheckCircleIcon sx={{ color: theme.colors.success[500] }} />
                    </ListItemIcon>
                    <ListItemText
                      primary="Automatic Approval"
                      secondary="Once registered by any company, your status automatically updates to 'approved'"
                    />
                  </ListItem>
                </List>
                <Alert severity="info">
                  This page automatically checks your registration status every 10 seconds.
                  You can also manually refresh using the button above.
                </Alert>
              </Stack>
            </Paper>
          </>
        )}

        {applicationData.status === 'approved' && (
          <Paper
            sx={{
              ...createGlassMorphism(theme, mode),
              p: 6,
              mb: 4,
            }}
          >
            <Stack spacing={3}>
              <Typography variant="h6" fontWeight="600">
                Welcome to zkSalaria!
              </Typography>
              <Typography color="text.secondary">
                Your auditor account is now active. You can start verifying EZKL proofs
                and earning fees through the verification marketplace.
              </Typography>
              <Button
                variant="contained"
                size="large"
                onClick={() => navigate('/auditor/dashboard')}
                sx={createPrimaryCTA(theme, mode)}
              >
                <Typography>Go to Dashboard</Typography>
              </Button>
            </Stack>
          </Paper>
        )}

        {applicationData.status === 'rejected' && applicationData.rejectionReason && (
          <Paper
            sx={{
              ...createGlassMorphism(theme, mode),
              p: 6,
              mb: 4,
            }}
          >
            <Stack spacing={3}>
              <Typography variant="h6" fontWeight="600">
                Reason for Rejection
              </Typography>
              <Typography color="text.secondary">
                {applicationData.rejectionReason}
              </Typography>
              <Alert severity="info">
                If you believe this decision was made in error or if you've addressed the
                concerns, you may submit a new application.
              </Alert>
              <Button
                variant="outlined"
                size="large"
                onClick={() => navigate('/auditor/apply')}
              >
                <Typography>Submit New Application</Typography>
              </Button>
            </Stack>
          </Paper>
        )}

        {/* Back Button */}
        <Stack direction="row" justifyContent="center">
          <Button
            variant="outlined"
            size="large"
            onClick={() => navigate('/auditor')}
          >
            <Typography>Back to Auditor Home</Typography>
          </Button>
        </Stack>
      </Container>
    </Box>
  );
};
