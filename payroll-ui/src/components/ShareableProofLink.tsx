import React from 'react';
import {
  Paper,
  Typography,
  TextField,
  IconButton,
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { useTheme, useThemeValues } from '../theme';
import { toast } from 'react-hot-toast';

interface ShareableProofLinkProps {
  link: string;
}

/**
 * Reusable shareable proof link component
 * Displays a copy-to-clipboard link for verified proofs
 */
export const ShareableProofLink: React.FC<ShareableProofLinkProps> = ({ link }) => {
  const { mode } = useTheme();
  const theme = useThemeValues();

  const handleCopy = () => {
    navigator.clipboard.writeText(link);
    toast.success('Proof link copied to clipboard!');
  };

  return (
    <Paper
      elevation={1}
      sx={{
        p: 3,
        borderRadius: 2,
        bgcolor: mode === 'dark' ? theme.colors.background.paper : theme.colors.background.default,
      }}
    >
      <Typography
        variant="body2"
        fontWeight={theme.typography.fontWeight.semibold}
        color={theme.colors.text.primary}
        sx={{ mb: 2 }}
      >
        Share Your Proof
      </Typography>
      <Typography variant="caption" color={theme.colors.text.secondary} sx={{ mb: 1.5, display: 'block' }}>
        Send this link to lenders, landlords, or anyone who needs to verify your income
      </Typography>
      <TextField
        fullWidth
        value={link}
        InputProps={{
          readOnly: true,
          endAdornment: (
            <IconButton onClick={handleCopy} size="small">
              <ContentCopyIcon sx={{ fontSize: 18 }} />
            </IconButton>
          ),
          sx: {
            fontFamily: 'monospace',
            fontSize: '0.875rem',
          }
        }}
      />
    </Paper>
  );
};
