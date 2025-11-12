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
import VerifiedIcon from '@mui/icons-material/Verified';
import ReceiptIcon from '@mui/icons-material/Receipt';
import SettingsIcon from '@mui/icons-material/Settings';
import PersonIcon from '@mui/icons-material/Person';
import { useTheme, useThemeValues } from '../theme';

export type DashboardView = 'main' | 'proofs' | 'history' | 'profile';

interface EmployeeDashboardDrawerProps {
  open: boolean;
  onClose: () => void;
  currentView: DashboardView;
  onViewChange: (view: DashboardView) => void;
  walletAddress: string;
  onOpenSettings: () => void;
}

interface NavItem {
  id: DashboardView;
  label: string;
  icon: React.ReactNode;
}

const NAV_ITEMS: NavItem[] = [
  {
    id: 'main',
    label: 'Dashboard',
    icon: <DashboardIcon />,
  },
  {
    id: 'proofs',
    label: 'My Income Proofs',
    icon: <VerifiedIcon />,
  },
  {
    id: 'history',
    label: 'Payment History',
    icon: <ReceiptIcon />,
  },
];

/**
 * Navigation Drawer for Employee Dashboard
 * Allows switching between different views without route changes
 */
export const EmployeeDashboardDrawer: React.FC<EmployeeDashboardDrawerProps> = ({
  open,
  onClose,
  currentView,
  onViewChange,
  walletAddress,
  onOpenSettings,
}) => {
  const { mode } = useTheme();
  const theme = useThemeValues();

  const handleViewChange = (view: DashboardView) => {
    onViewChange(view);
    onClose();
  };

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
            Employee Portal
          </Typography>
          <Typography
            variant="caption"
            color={theme.colors.text.disabled}
            sx={{ fontFamily: 'monospace' }}
          >
            {walletAddress.substring(0, 12)}...
          </Typography>
        </Box>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </Box>

      {/* Navigation Items */}
      <List sx={{ p: 2 }}>
        {NAV_ITEMS.map((item) => {
          const isActive = currentView === item.id;
          return (
            <ListItemButton
              key={item.id}
              onClick={() => handleViewChange(item.id)}
              sx={{
                borderRadius: 2,
                mb: 1,
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
                  minWidth: 40,
                }}
              >
                {React.cloneElement(item.icon as React.ReactElement<any>, {
                  sx: {
                    fontSize: 22,
                    color: isActive ? theme.colors.primary[500] : theme.colors.text.secondary,
                  }
                })}
              </ListItemIcon>
              <ListItemText
                primary={item.label}
                primaryTypographyProps={{
                  fontWeight: isActive
                    ? theme.typography.fontWeight.semibold
                    : theme.typography.fontWeight.medium,
                  color: isActive ? theme.colors.primary[500] : theme.colors.text.primary,
                }}
              />
            </ListItemButton>
          );
        })}
      </List>

      <Divider sx={{ mx: 2 }} />

      {/* Settings Section */}
      <List sx={{ p: 2 }}>
        <ListItemButton
          onClick={() => {
            onOpenSettings();
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
            <SettingsIcon sx={{ fontSize: 22 }} />
          </ListItemIcon>
          <ListItemText
            primary="Settings"
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
