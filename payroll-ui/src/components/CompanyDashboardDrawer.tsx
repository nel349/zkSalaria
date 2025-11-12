import React from 'react';
import {
  Drawer,
  Box,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Typography,
  IconButton,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import RepeatIcon from '@mui/icons-material/Repeat';
import ReceiptIcon from '@mui/icons-material/Receipt';
import SettingsIcon from '@mui/icons-material/Settings';
import SecurityIcon from '@mui/icons-material/Security';
import NotificationsIcon from '@mui/icons-material/Notifications';
import { useTheme, useThemeValues } from '../theme';
import { useNavigate } from 'react-router-dom';

interface CompanyDashboardDrawerProps {
  open: boolean;
  onClose: () => void;
  onOpenSettings: () => void;
  onOpenPrivacy: () => void;
  onOpenNotifications: () => void;
  companyName: string;
}

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  action: () => void;
}

/**
 * Navigation Drawer for Company Dashboard
 * Provides quick navigation to key company features
 */
export const CompanyDashboardDrawer: React.FC<CompanyDashboardDrawerProps> = ({
  open,
  onClose,
  onOpenSettings,
  onOpenPrivacy,
  onOpenNotifications,
  companyName,
}) => {
  const { mode } = useTheme();
  const theme = useThemeValues();
  const navigate = useNavigate();

  const NAV_ITEMS: NavItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: <DashboardIcon />,
      action: () => {
        navigate('/dashboard');
        onClose();
      },
    },
    {
      id: 'employees',
      label: 'Employee List',
      icon: <PeopleIcon />,
      action: () => {
        navigate('/employees');
        onClose();
      },
    },
    {
      id: 'payments',
      label: 'Payment History',
      icon: <ReceiptIcon />,
      action: () => {
        navigate('/payments');
        onClose();
      },
    },
  ];

  return (
    <Drawer
      anchor="left"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: 280,
          bgcolor: mode === 'dark' ? theme.colors.background.paper : '#FFFFFF',
          borderRight: `1px solid ${theme.colors.border.default}`,
        },
      }}
    >
      {/* Drawer Header */}
      <Box
        sx={{
          p: 2,
          borderBottom: `1px solid ${theme.colors.border.default}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Box>
          <Typography
            variant="h6"
            fontWeight={theme.typography.fontWeight.bold}
            color={theme.colors.text.primary}
          >
            Company Portal
          </Typography>
          <Typography
            variant="caption"
            color={theme.colors.text.disabled}
          >
            {companyName}
          </Typography>
        </Box>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </Box>

      {/* Navigation Items */}
      <List sx={{ p: 2 }}>
        {NAV_ITEMS.map((item) => (
          <ListItemButton
            key={item.id}
            onClick={item.action}
            sx={{
              borderRadius: 2,
              mb: 1,
              '&:hover': {
                bgcolor: mode === 'dark'
                  ? `${theme.colors.primary[500]}10`
                  : theme.colors.background.default,
              },
            }}
          >
            <ListItemIcon
              sx={{
                minWidth: 40,
              }}
            >
              {React.cloneElement(item.icon as React.ReactElement<any>, {
                sx: {
                  fontSize: 22,
                  color: theme.colors.text.secondary,
                }
              })}
            </ListItemIcon>
            <ListItemText
              primary={item.label}
              primaryTypographyProps={{
                fontWeight: theme.typography.fontWeight.medium,
                color: theme.colors.text.primary,
              }}
            />
          </ListItemButton>
        ))}
      </List>

      <Divider sx={{ mx: 2 }} />

      {/* Settings Section */}
      <List sx={{ p: 2 }}>
        <Typography
          variant="caption"
          color={theme.colors.text.disabled}
          sx={{ px: 2, mb: 1, display: 'block' }}
        >
          SETTINGS
        </Typography>

        <ListItemButton
          onClick={() => {
            onOpenSettings();
            onClose();
          }}
          sx={{
            borderRadius: 2,
            mb: 1,
            '&:hover': {
              bgcolor: mode === 'dark'
                ? `${theme.colors.primary[500]}10`
                : theme.colors.background.default,
            },
          }}
        >
          <ListItemIcon sx={{ color: theme.colors.text.secondary, minWidth: 40 }}>
            <SettingsIcon sx={{ fontSize: 22 }} />
          </ListItemIcon>
          <ListItemText
            primary="Profile"
            primaryTypographyProps={{
              fontWeight: theme.typography.fontWeight.medium,
              color: theme.colors.text.secondary,
            }}
          />
        </ListItemButton>

        <ListItemButton
          onClick={() => {
            onOpenPrivacy();
            onClose();
          }}
          sx={{
            borderRadius: 2,
            mb: 1,
            '&:hover': {
              bgcolor: mode === 'dark'
                ? `${theme.colors.primary[500]}10`
                : theme.colors.background.default,
            },
          }}
        >
          <ListItemIcon sx={{ color: theme.colors.text.secondary, minWidth: 40 }}>
            <SecurityIcon sx={{ fontSize: 22 }} />
          </ListItemIcon>
          <ListItemText
            primary="Privacy & Security"
            primaryTypographyProps={{
              fontWeight: theme.typography.fontWeight.medium,
              color: theme.colors.text.secondary,
            }}
          />
        </ListItemButton>

        <ListItemButton
          onClick={() => {
            onOpenNotifications();
            onClose();
          }}
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
            <NotificationsIcon sx={{ fontSize: 22 }} />
          </ListItemIcon>
          <ListItemText
            primary="Notifications"
            primaryTypographyProps={{
              fontWeight: theme.typography.fontWeight.medium,
              color: theme.colors.text.secondary,
            }}
          />
        </ListItemButton>
      </List>
    </Drawer>
  );
};
