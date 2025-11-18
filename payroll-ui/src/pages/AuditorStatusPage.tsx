import React, { useState, useEffect } from 'react';
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
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import CancelIcon from '@mui/icons-material/Cancel';
import EmailIcon from '@mui/icons-material/Email';
import { useTheme, useThemeValues, createGlassMorphism, createPrimaryCTA } from '../theme';
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

  const [applicationData, setApplicationData] = useState<ApplicationData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load application data from localStorage (mock)
    const applicationId = localStorage.getItem('auditorApplicationId');
    const status = localStorage.getItem('auditorApplicationStatus') as ApplicationStatus || 'pending';
    const storedData = localStorage.getItem('auditorApplicationData');

    if (applicationId && storedData) {
      const parsedData = JSON.parse(storedData);
      setApplicationData({
        applicationId,
        status,
        ...parsedData,
      });
    }

    setLoading(false);
  }, []);

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
                    primary="Admin Review"
                    secondary="Our team is verifying your professional credentials"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <CheckCircleIcon sx={{ color: theme.colors.success[500] }} />
                  </ListItemIcon>
                  <ListItemText
                    primary="License Validation"
                    secondary="Confirming your license is valid and in good standing"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <EmailIcon sx={{ color: theme.colors.primary[mode === "dark" ? 400 : 600] }} />
                  </ListItemIcon>
                  <ListItemText
                    primary="Email Notification"
                    secondary="You'll receive an email when your application is reviewed"
                  />
                </ListItem>
              </List>
              <Alert severity="info">
                Review typically takes 1-3 business days. You'll receive an email at{' '}
                <strong>{applicationData.email}</strong> when your application is processed.
              </Alert>
            </Stack>
          </Paper>
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
                Go to Dashboard
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
                Submit New Application
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
            Back to Auditor Home
          </Button>
        </Stack>
      </Container>
    </Box>
  );
};
