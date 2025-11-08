import React from 'react';
import { Box, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material';
import BusinessIcon from '@mui/icons-material/Business';
import PersonIcon from '@mui/icons-material/Person';
import { useThemeValues } from '../theme';

export type ViewMode = 'company' | 'employee';

interface RoleSwitcherProps {
  currentView: ViewMode;
  onViewChange: (view: ViewMode) => void;
}

/**
 * Role Switcher Component (Phase 3.6)
 * Toggle between Company and Employee views for dual-role users
 */
export const RoleSwitcher: React.FC<RoleSwitcherProps> = ({ currentView, onViewChange }) => {
  const theme = useThemeValues();

  const handleChange = (_event: React.MouseEvent<HTMLElement>, newView: ViewMode | null) => {
    if (newView !== null) {
      onViewChange(newView);
    }
  };

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
      <Typography variant="body2" color={theme.colors.text.secondary} sx={{ display: { xs: 'none', sm: 'block' } }}>
        View as:
      </Typography>
      <ToggleButtonGroup
        value={currentView}
        exclusive
        onChange={handleChange}
        aria-label="role view switcher"
        size="small"
        sx={{
          bgcolor: theme.colors.background.default,
          '& .MuiToggleButton-root': {
            px: 2,
            py: 1,
            border: `1px solid ${theme.colors.border.default}`,
            color: theme.colors.text.secondary,
            '&.Mui-selected': {
              bgcolor: theme.colors.primary[500],
              color: '#FFFFFF',
              '&:hover': {
                bgcolor: theme.colors.primary[600],
              },
            },
            '&:hover': {
              bgcolor: theme.colors.background.paper,
            },
          },
        }}
      >
        <ToggleButton value="company" aria-label="company view">
          <BusinessIcon sx={{ fontSize: 18, mr: 1 }} />
          <Typography variant="body2" fontWeight={theme.typography.fontWeight.semibold}>
            Company
          </Typography>
        </ToggleButton>
        <ToggleButton value="employee" aria-label="employee view">
          <PersonIcon sx={{ fontSize: 18, mr: 1 }} />
          <Typography variant="body2" fontWeight={theme.typography.fontWeight.semibold}>
            Employee
          </Typography>
        </ToggleButton>
      </ToggleButtonGroup>
    </Box>
  );
};
