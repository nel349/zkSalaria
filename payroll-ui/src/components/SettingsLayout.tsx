import React from 'react';
import {
  Box,
  Container,
  Typography,
  Stack,
  Paper,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import SettingsIcon from '@mui/icons-material/Settings';
import PersonIcon from '@mui/icons-material/Person';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import NotificationsIcon from '@mui/icons-material/Notifications';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useTheme, useThemeValues } from '../theme';

interface SettingsLayoutProps {
  children: React.ReactNode;
}

interface SettingsTab {
  id: string;
  label: string;
  icon: React.ReactNode;
  path: string;
}

const SETTINGS_TABS: SettingsTab[] = [
  {
    id: 'profile',
    label: 'Profile',
    icon: <PersonIcon />,
    path: '/settings/profile',
  },
  {
    id: 'privacy',
    label: 'Privacy & Disclosure',
    icon: <VerifiedUserIcon />,
    path: '/settings/privacy',
  },
  {
    id: 'notifications',
    label: 'Notifications',
    icon: <NotificationsIcon />,
    path: '/settings/notifications',
  },
];

/**
 * Settings Layout with Sidebar Navigation (Phase 4)
 * Provides consistent layout for all settings pages
 */
export const SettingsLayout: React.FC<SettingsLayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { mode } = useTheme();
  const theme = useThemeValues();

  const currentTab = SETTINGS_TABS.find((tab) => location.pathname === tab.path)?.id || 'profile';

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: theme.colors.background.default,
        pb: 8,
      }}
    >
      {/* Top Header */}
      <Box
        sx={{
          bgcolor: mode === 'dark' ? theme.colors.background.paper : '#FFFFFF',
          borderBottom: `1px solid ${theme.colors.border.default}`,
          py: 2,
        }}
      >
        <Container maxWidth="xl">
          <Stack direction="row" alignItems="center" spacing={2}>
            <SettingsIcon sx={{ fontSize: 32, color: theme.colors.primary[500] }} />
            <Box>
              <Typography variant="h5" fontWeight={theme.typography.fontWeight.bold} color={theme.colors.text.primary}>
                Settings
              </Typography>
              <Typography variant="body2" color={theme.colors.text.secondary}>
                Manage your account preferences and privacy
              </Typography>
            </Box>
          </Stack>
        </Container>
      </Box>

      <Container maxWidth="xl" sx={{ mt: 4 }}>
        <Stack direction="row" spacing={3}>
          {/* Sidebar Navigation */}
          <Box sx={{ width: 280, flexShrink: 0 }}>
            <Paper
              elevation={2}
              sx={{
                borderRadius: 3,
                bgcolor: mode === 'dark' ? theme.colors.background.paper : '#FFFFFF',
                overflow: 'hidden',
              }}
            >
              <List sx={{ p: 1 }}>
                {SETTINGS_TABS.map((tab) => {
                  const isActive = currentTab === tab.id;
                  return (
                    <ListItemButton
                      key={tab.id}
                      onClick={() => navigate(tab.path)}
                      sx={{
                        borderRadius: 2,
                        mb: 0.5,
                        bgcolor: isActive
                          ? mode === 'dark'
                            ? `${theme.colors.primary[500]}20`
                            : theme.colors.primary[50]
                          : 'transparent',
                        '&:hover': {
                          bgcolor: isActive
                            ? mode === 'dark'
                              ? `${theme.colors.primary[500]}30`
                              : theme.colors.primary[100]
                            : mode === 'dark'
                            ? `${theme.colors.primary[500]}10`
                            : theme.colors.background.default,
                        },
                      }}
                    >
                      <ListItemIcon
                        sx={{
                          color: isActive ? theme.colors.primary[500] : theme.colors.text.secondary,
                          minWidth: 40,
                        }}
                      >
                        {tab.icon}
                      </ListItemIcon>
                      <ListItemText
                        primary={tab.label}
                        primaryTypographyProps={{
                          fontWeight: isActive ? theme.typography.fontWeight.semibold : theme.typography.fontWeight.medium,
                          color: isActive ? theme.colors.primary[500] : theme.colors.text.primary,
                        }}
                      />
                    </ListItemButton>
                  );
                })}

                {/* Back to Dashboard Button */}
                <Box sx={{ mt: 2, pt: 2, borderTop: `1px solid ${theme.colors.border.default}` }}>
                  <ListItemButton
                    onClick={() => navigate('/dashboard')}
                    sx={{
                      borderRadius: 2,
                      '&:hover': {
                        bgcolor: mode === 'dark'
                          ? `${theme.colors.primary[500]}10`
                          : theme.colors.background.default,
                      },
                    }}
                  >
                    <ListItemIcon sx={{ color: theme.colors.text.secondary, minWidth: 40 }}>
                      <ArrowBackIcon />
                    </ListItemIcon>
                    <ListItemText
                      primary="Back to Dashboard"
                      primaryTypographyProps={{
                        fontWeight: theme.typography.fontWeight.medium,
                        color: theme.colors.text.secondary,
                      }}
                    />
                  </ListItemButton>
                </Box>
              </List>
            </Paper>
          </Box>

          {/* Main Content Area */}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            {children}
          </Box>
        </Stack>
      </Container>
    </Box>
  );
};
