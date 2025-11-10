import React from 'react';
import { Box, Typography, Stack, Paper, Alert } from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import { useTheme, useThemeValues } from '../theme';

/**
 * Notification Settings Page (Phase 4 - Placeholder)
 * Will contain notification preferences and alert settings
 */
export const NotificationSettingsPage: React.FC = () => {
  const { mode } = useTheme();
  const theme = useThemeValues();

  return (
    <Stack spacing={3}>
      {/* Page Header */}
      <Box>
        <Stack direction="row" alignItems="center" spacing={2}>
          <NotificationsIcon sx={{ fontSize: 32, color: theme.colors.primary[500] }} />
          <Box>
            <Typography
              variant="h5"
              fontWeight={theme.typography.fontWeight.bold}
              color={theme.colors.text.primary}
            >
              Notification Settings
            </Typography>
            <Typography variant="body2" color={theme.colors.text.secondary}>
              Configure your notification preferences
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
          Notification settings coming soon!
        </Alert>
        <Typography variant="body2" color={theme.colors.text.disabled}>
          This section will allow you to configure email notifications, payment alerts, and other notification preferences.
        </Typography>
      </Paper>
    </Stack>
  );
};
