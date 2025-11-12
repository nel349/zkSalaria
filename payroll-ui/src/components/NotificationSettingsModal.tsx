import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Button,
  Stack,
  IconButton,
  Divider,
  Paper,
  Switch,
  FormControlLabel,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import NotificationsIcon from '@mui/icons-material/Notifications';
import EmailIcon from '@mui/icons-material/Email';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import VolumeOffIcon from '@mui/icons-material/VolumeOff';
import { useTheme, useThemeValues } from '../theme';
import { toast } from 'react-hot-toast';

interface NotificationPreferences {
  // Email Notifications
  emailPaymentReceived: boolean;
  emailPaymentSent: boolean;
  emailRecurringProcessed: boolean;
  emailLowBalance: boolean;
  emailProofVerified: boolean;
  emailProofExpiring: boolean;

  // In-App Notifications
  inAppPaymentReceived: boolean;
  inAppPaymentSent: boolean;
  inAppRecurringProcessed: boolean;
  inAppLowBalance: boolean;
  inAppProofVerified: boolean;
  inAppProofExpiring: boolean;

  // Notification Settings
  frequency: 'instant' | 'daily' | 'weekly';
  quietHoursEnabled: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
  soundEnabled: boolean;
  browserNotifications: boolean;
}

const DEFAULT_PREFERENCES: NotificationPreferences = {
  emailPaymentReceived: true,
  emailPaymentSent: true,
  emailRecurringProcessed: true,
  emailLowBalance: true,
  emailProofVerified: true,
  emailProofExpiring: true,

  inAppPaymentReceived: true,
  inAppPaymentSent: true,
  inAppRecurringProcessed: true,
  inAppLowBalance: true,
  inAppProofVerified: true,
  inAppProofExpiring: true,

  frequency: 'instant',
  quietHoursEnabled: false,
  quietHoursStart: '22:00',
  quietHoursEnd: '08:00',
  soundEnabled: true,
  browserNotifications: true,
};

interface NotificationSettingsModalProps {
  open: boolean;
  onClose: () => void;
  isCompany: boolean;
  walletAddress?: string;
}

/**
 * Notification Settings Modal (Phase 4.3)
 * Manage email and in-app notification preferences
 */
export const NotificationSettingsModal: React.FC<NotificationSettingsModalProps> = ({
  open,
  onClose,
  isCompany,
  walletAddress,
}) => {
  const { mode } = useTheme();
  const theme = useThemeValues();

  const [preferences, setPreferences] = useState<NotificationPreferences>(DEFAULT_PREFERENCES);
  const [hasChanges, setHasChanges] = useState(false);

  // Load saved preferences from localStorage
  useEffect(() => {
    if (!open || !walletAddress) return;

    const storageKey = `payroll-ui.notifications.${walletAddress}`;
    const saved = localStorage.getItem(storageKey);

    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setPreferences({ ...DEFAULT_PREFERENCES, ...parsed });
      } catch (error) {
        console.error('Failed to parse notification preferences:', error);
      }
    }
    setHasChanges(false);
  }, [open, walletAddress]);

  const handleToggle = (key: keyof NotificationPreferences) => {
    setPreferences((prev) => ({ ...prev, [key]: !prev[key] }));
    setHasChanges(true);
  };

  const handleChange = (key: keyof NotificationPreferences, value: any) => {
    setPreferences((prev) => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleSave = () => {
    if (!walletAddress) return;

    try {
      const storageKey = `payroll-ui.notifications.${walletAddress}`;
      localStorage.setItem(storageKey, JSON.stringify(preferences));
      toast.success('Notification preferences saved');
      setHasChanges(false);
      onClose();
    } catch (error) {
      toast.error('Failed to save preferences');
      console.error('Save error:', error);
    }
  };

  const handleCancel = () => {
    setHasChanges(false);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleCancel}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          bgcolor: mode === 'dark' ? theme.colors.background.paper : '#FFFFFF',
        },
      }}
    >
      {/* Header */}
      <DialogTitle>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Stack direction="row" alignItems="center" spacing={2}>
            <NotificationsIcon sx={{ fontSize: 32, color: theme.colors.primary[500] }} />
            <Box>
              <Typography variant="h6" fontWeight={theme.typography.fontWeight.bold} color={theme.colors.text.primary}>
                Notification Preferences
              </Typography>
              <Typography variant="body2" color={theme.colors.text.secondary}>
                Manage how and when you receive notifications
              </Typography>
            </Box>
          </Stack>
          <IconButton onClick={handleCancel} size="small">
            <CloseIcon />
          </IconButton>
        </Stack>
      </DialogTitle>

      <Divider />

      <DialogContent sx={{ pt: 3 }}>
        <Stack spacing={3}>
          {/* Email Notifications */}
          <Box>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
              <EmailIcon sx={{ color: theme.colors.primary[500] }} />
              <Typography
                variant="subtitle2"
                fontWeight={theme.typography.fontWeight.semibold}
                color={theme.colors.text.secondary}
              >
                Email Notifications
              </Typography>
            </Stack>
            <Paper
              variant="outlined"
              sx={{
                p: 2,
                bgcolor: mode === 'dark' ? `${theme.colors.background.default}50` : theme.colors.background.default,
                borderColor: theme.colors.border.default,
              }}
            >
              <Stack spacing={1}>
                {!isCompany && (
                  <FormControlLabel
                    control={
                      <Switch
                        checked={preferences.emailPaymentReceived}
                        onChange={() => handleToggle('emailPaymentReceived')}
                        size="small"
                      />
                    }
                    label="Payment received"
                  />
                )}
                {isCompany && (
                  <FormControlLabel
                    control={
                      <Switch
                        checked={preferences.emailPaymentSent}
                        onChange={() => handleToggle('emailPaymentSent')}
                        size="small"
                      />
                    }
                    label="Payment sent to employee"
                  />
                )}
                <FormControlLabel
                  control={
                    <Switch
                      checked={preferences.emailRecurringProcessed}
                      onChange={() => handleToggle('emailRecurringProcessed')}
                      size="small"
                    />
                  }
                  label="Recurring payment processed"
                />
                {isCompany && (
                  <FormControlLabel
                    control={
                      <Switch
                        checked={preferences.emailLowBalance}
                        onChange={() => handleToggle('emailLowBalance')}
                        size="small"
                      />
                    }
                    label="Low balance warning"
                  />
                )}
                {!isCompany && (
                  <>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={preferences.emailProofVerified}
                          onChange={() => handleToggle('emailProofVerified')}
                          size="small"
                        />
                      }
                      label="Income proof verified"
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={preferences.emailProofExpiring}
                          onChange={() => handleToggle('emailProofExpiring')}
                          size="small"
                        />
                      }
                      label="Proof expiration reminder"
                    />
                  </>
                )}
              </Stack>
            </Paper>
          </Box>

          <Divider />

          {/* In-App Notifications */}
          <Box>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
              <NotificationsActiveIcon sx={{ color: theme.colors.primary[500] }} />
              <Typography
                variant="subtitle2"
                fontWeight={theme.typography.fontWeight.semibold}
                color={theme.colors.text.secondary}
              >
                In-App Notifications
              </Typography>
            </Stack>
            <Paper
              variant="outlined"
              sx={{
                p: 2,
                bgcolor: mode === 'dark' ? `${theme.colors.background.default}50` : theme.colors.background.default,
                borderColor: theme.colors.border.default,
              }}
            >
              <Stack spacing={1}>
                {!isCompany && (
                  <FormControlLabel
                    control={
                      <Switch
                        checked={preferences.inAppPaymentReceived}
                        onChange={() => handleToggle('inAppPaymentReceived')}
                        size="small"
                      />
                    }
                    label="Payment received"
                  />
                )}
                {isCompany && (
                  <FormControlLabel
                    control={
                      <Switch
                        checked={preferences.inAppPaymentSent}
                        onChange={() => handleToggle('inAppPaymentSent')}
                        size="small"
                      />
                    }
                    label="Payment sent to employee"
                  />
                )}
                <FormControlLabel
                  control={
                    <Switch
                      checked={preferences.inAppRecurringProcessed}
                      onChange={() => handleToggle('inAppRecurringProcessed')}
                      size="small"
                    />
                  }
                  label="Recurring payment processed"
                />
                {isCompany && (
                  <FormControlLabel
                    control={
                      <Switch
                        checked={preferences.inAppLowBalance}
                        onChange={() => handleToggle('inAppLowBalance')}
                        size="small"
                      />
                    }
                    label="Low balance warning"
                  />
                )}
                {!isCompany && (
                  <>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={preferences.inAppProofVerified}
                          onChange={() => handleToggle('inAppProofVerified')}
                          size="small"
                        />
                      }
                      label="Income proof verified"
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={preferences.inAppProofExpiring}
                          onChange={() => handleToggle('inAppProofExpiring')}
                          size="small"
                        />
                      }
                      label="Proof expiration reminder"
                    />
                  </>
                )}
              </Stack>
            </Paper>
          </Box>

          <Divider />

          {/* Notification Settings */}
          <Box>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
              <VolumeOffIcon sx={{ color: theme.colors.primary[500] }} />
              <Typography
                variant="subtitle2"
                fontWeight={theme.typography.fontWeight.semibold}
                color={theme.colors.text.secondary}
              >
                Notification Settings
              </Typography>
            </Stack>
            <Paper
              variant="outlined"
              sx={{
                p: 2,
                bgcolor: mode === 'dark' ? `${theme.colors.background.default}50` : theme.colors.background.default,
                borderColor: theme.colors.border.default,
              }}
            >
              <Stack spacing={2}>
                <FormControl fullWidth size="small">
                  <InputLabel>Notification Frequency</InputLabel>
                  <Select
                    value={preferences.frequency}
                    onChange={(e) => handleChange('frequency', e.target.value)}
                    label="Notification Frequency"
                  >
                    <MenuItem value="instant">Instant (real-time)</MenuItem>
                    <MenuItem value="daily">Daily Digest</MenuItem>
                    <MenuItem value="weekly">Weekly Summary</MenuItem>
                  </Select>
                </FormControl>

                <FormControlLabel
                  control={
                    <Switch
                      checked={preferences.soundEnabled}
                      onChange={() => handleToggle('soundEnabled')}
                      size="small"
                    />
                  }
                  label="Notification sounds"
                />

                <FormControlLabel
                  control={
                    <Switch
                      checked={preferences.browserNotifications}
                      onChange={() => handleToggle('browserNotifications')}
                      size="small"
                    />
                  }
                  label="Browser notifications"
                />

                <Divider />

                <Box>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={preferences.quietHoursEnabled}
                        onChange={() => handleToggle('quietHoursEnabled')}
                        size="small"
                      />
                    }
                    label="Enable quiet hours"
                  />
                  {preferences.quietHoursEnabled && (
                    <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
                      <FormControl size="small" sx={{ flex: 1 }}>
                        <InputLabel>Start Time</InputLabel>
                        <Select
                          value={preferences.quietHoursStart}
                          onChange={(e) => handleChange('quietHoursStart', e.target.value)}
                          label="Start Time"
                        >
                          {Array.from({ length: 24 }, (_, i) => {
                            const hour = i.toString().padStart(2, '0');
                            return (
                              <MenuItem key={`start-${hour}`} value={`${hour}:00`}>
                                {hour}:00
                              </MenuItem>
                            );
                          })}
                        </Select>
                      </FormControl>
                      <FormControl size="small" sx={{ flex: 1 }}>
                        <InputLabel>End Time</InputLabel>
                        <Select
                          value={preferences.quietHoursEnd}
                          onChange={(e) => handleChange('quietHoursEnd', e.target.value)}
                          label="End Time"
                        >
                          {Array.from({ length: 24 }, (_, i) => {
                            const hour = i.toString().padStart(2, '0');
                            return (
                              <MenuItem key={`end-${hour}`} value={`${hour}:00`}>
                                {hour}:00
                              </MenuItem>
                            );
                          })}
                        </Select>
                      </FormControl>
                    </Stack>
                  )}
                </Box>
              </Stack>
            </Paper>
          </Box>

          <Alert severity="info" sx={{ fontSize: '0.875rem' }}>
            Notification preferences are stored locally on your device. Email notifications require email configuration in your profile settings.
          </Alert>
        </Stack>
      </DialogContent>

      <Divider />

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={handleCancel} color="inherit">
          Cancel
        </Button>
        <Button onClick={handleSave} variant="contained" disabled={!hasChanges}>
          Save Changes
        </Button>
      </DialogActions>
    </Dialog>
  );
};
