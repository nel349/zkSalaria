import React, { useState } from 'react';
import { Button, Tooltip, Typography } from '@mui/material';
import GroupsIcon from '@mui/icons-material/Groups';
import { useThemeValues } from '../theme';

export const BatchPayrollButton: React.FC = () => {
  const theme = useThemeValues();
  const [showTooltip, setShowTooltip] = useState(false);

  const handleClick = () => {
    setShowTooltip(true);
    setTimeout(() => setShowTooltip(false), 2000);
  };

  return (
    <Tooltip
      title={<Typography>Coming Soon</Typography>}
      open={showTooltip}
      onClose={() => setShowTooltip(false)}
      placement="top"
    >
      <Button
        variant="outlined"
        fullWidth
        startIcon={<GroupsIcon />}
        onClick={handleClick}
        sx={{
          py: 1.5,
          borderColor: theme.colors.border,
          color: theme.colors.text.secondary,
          '&:hover': {
            borderColor: theme.colors.primary[500],
            bgcolor: theme.colors.background.surface,
          },
        }}
      >
        Batch Payroll
      </Button>
    </Tooltip>
  );
};
