import React from 'react';
import { Snackbar, Alert, IconButton } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import CloseIcon from '@mui/icons-material/Close';
import { useThemeValues } from '../theme';

export type ToastSeverity = 'success' | 'error';

interface ToastNotificationProps {
  open: boolean;
  message: string;
  severity: ToastSeverity;
  onClose: () => void;
  autoHideDuration?: number;
}

/**
 * Reusable Toast Notification Component
 * Shows prominent success/error messages at the bottom of the screen
 * Follows zkSalaria design patterns with theme colors
 */
export const ToastNotification: React.FC<ToastNotificationProps> = ({
  open,
  message,
  severity,
  onClose,
  autoHideDuration = 6000,
}) => {
  const theme = useThemeValues();

  return (
    <Snackbar
      open={open}
      autoHideDuration={autoHideDuration}
      onClose={onClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
    >
      <Alert
        onClose={onClose}
        severity={severity}
        variant="filled"
        icon={severity === 'success' ? <CheckCircleIcon /> : <ErrorIcon />}
        sx={{
          width: '100%',
          fontSize: '1rem',
          fontWeight: theme.typography.fontWeight.semibold,
          bgcolor: severity === 'success' ? theme.colors.success[500] : theme.colors.error[500],
          color: '#FFFFFF',
          '& .MuiAlert-icon': {
            fontSize: '1.5rem',
          },
          boxShadow: '0px 8px 16px rgba(0, 0, 0, 0.3)',
        }}
        action={
          <IconButton
            size="small"
            aria-label="close"
            color="inherit"
            onClick={onClose}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        }
      >
        {message}
      </Alert>
    </Snackbar>
  );
};
