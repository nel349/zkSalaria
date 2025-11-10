import React from 'react';
import { Box, Typography, Stack, Paper, Alert } from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import { useTheme, useThemeValues } from '../theme';

/**
 * Profile Settings Page (Phase 4 - Placeholder)
 * Will contain user profile and account settings
 */
export const ProfileSettingsPage: React.FC = () => {
  const { mode } = useTheme();
  const theme = useThemeValues();

  return (
    <Stack spacing={3}>
      {/* Page Header */}
      <Box>
        <Stack direction="row" alignItems="center" spacing={2}>
          <PersonIcon sx={{ fontSize: 32, color: theme.colors.primary[500] }} />
          <Box>
            <Typography
              variant="h5"
              fontWeight={theme.typography.fontWeight.bold}
              color={theme.colors.text.primary}
            >
              Profile Settings
            </Typography>
            <Typography variant="body2" color={theme.colors.text.secondary}>
              Manage your account information and preferences
            </Typography>
          </Box>
        </Stack>
      </Box>

      <Paper
        elevation={2}
        sx={{
          p: 6,
          borderRadius: 3,
          bgcolor: mode === 'dark' ? theme.colors.background.paper : '#FFFFFF',
          textAlign: 'center',
        }}
      >
        <Alert severity="info" sx={{ mb: 2 }}>
          Profile settings coming soon!
        </Alert>
        <Typography variant="body2" color={theme.colors.text.disabled}>
          This section will allow you to manage your profile information, wallet addresses, and account preferences.
        </Typography>
      </Paper>
    </Stack>
  );
};
