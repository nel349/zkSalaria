import React from 'react';
import { Fab, Badge, Tooltip } from '@mui/material';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import { useThemeValues } from '../theme';

interface AIFloatingButtonProps {
  onClick: () => void;
  hasUnreadMessages?: boolean;
}

/**
 * Floating AI Assistant Button
 * Fixed position in bottom-right corner
 */
export const AIFloatingButton: React.FC<AIFloatingButtonProps> = ({
  onClick,
  hasUnreadMessages = false,
}) => {
  const theme = useThemeValues();

  return (
    <Tooltip title="AI Assistant" placement="left">
      <Fab
        color="primary"
        aria-label="AI Assistant"
        onClick={onClick}
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          zIndex: 1000,
          bgcolor: theme.colors.primary[500],
          '&:hover': {
            bgcolor: theme.colors.primary[700],
            transform: 'scale(1.1)',
          },
          transition: 'all 0.3s ease',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
        }}
      >
        <Badge
          badgeContent={hasUnreadMessages ? '!' : 0}
          color="error"
          sx={{
            '& .MuiBadge-badge': {
              fontSize: '0.7rem',
              fontWeight: 'bold',
            },
          }}
        >
          <SmartToyIcon sx={{ fontSize: 28 }} />
        </Badge>
      </Fab>
    </Tooltip>
  );
};
