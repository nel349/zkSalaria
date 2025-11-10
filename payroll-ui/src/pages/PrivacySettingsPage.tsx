import React from 'react';
import {
  Box,
  Typography,
  Stack,
  Paper,
  Alert,
} from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import SecurityIcon from '@mui/icons-material/Security';
import { useTheme, useThemeValues } from '../theme';

/**
 * Privacy Settings Page
 * Manage disclosure authorizations and privacy settings
 */
export const PrivacySettingsPage: React.FC = () => {
  const { mode } = useTheme();
  const theme = useThemeValues();

  return (
    <Stack spacing={3}>
      {/* Page Header */}
      <Box>
        <Stack direction="row" alignItems="center" spacing={2}>
          <SecurityIcon sx={{ fontSize: 32, color: theme.colors.primary[500] }} />
          <Box>
            <Typography
              variant="h5"
              fontWeight={theme.typography.fontWeight.bold}
              color={theme.colors.text.primary}
            >
              Privacy & Disclosure
            </Typography>
            <Typography variant="body2" color={theme.colors.text.secondary}>
              Manage your income proofs and disclosure permissions
            </Typography>
          </Box>
        </Stack>
      </Box>

      {/* Info Alert */}
      <Alert
        severity="info"
        icon={<InfoOutlinedIcon />}
        sx={{
          bgcolor: mode === 'dark' ? `${theme.colors.info[500]}20` : theme.colors.info[50],
          border: `1px solid ${theme.colors.info[500]}`,
        }}
      >
        <Typography variant="body2" fontWeight={theme.typography.fontWeight.medium}>
          Control who can access your employment and income information. Grant or revoke access to
          lenders, landlords, and other authorized parties. View your income proofs from the dashboard.
        </Typography>
      </Alert>

      {/* Disclosure Authorizations Section (Placeholder) */}
      <Box>
        <Typography
          variant="h6"
          fontWeight={theme.typography.fontWeight.semibold}
          color={theme.colors.text.primary}
          sx={{ mb: 2 }}
        >
          Disclosure Authorizations
        </Typography>
        <Paper
          elevation={2}
          sx={{
            p: 4,
            borderRadius: 3,
            bgcolor: mode === 'dark' ? theme.colors.background.paper : '#FFFFFF',
            textAlign: 'center',
          }}
        >
          <Typography variant="body2" color={theme.colors.text.disabled}>
            No active disclosure authorizations. Grant access to lenders or landlords from the dashboard.
          </Typography>
        </Paper>
      </Box>
    </Stack>
  );
};
