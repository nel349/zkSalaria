import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  Alert,
  CircularProgress,
  Stack,
} from '@mui/material';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import { useTheme, useThemeValues } from '../theme';
import type { DeployedPayrollAPI } from '@zksalaria/payroll-api';

interface RegisterVerifierModalProps {
  open: boolean;
  onClose: () => void;
  api: DeployedPayrollAPI | null;
  currentCompany: string;
  onSuccess?: () => void;
}

/**
 * Register Trusted ZKML Verifier Modal (Company Admin Only)
 *
 * Security: Only company admin can register trusted verifiers for income proofs.
 * Employees cannot register verifiers (prevents malicious verifier registration).
 */
export const RegisterVerifierModal: React.FC<RegisterVerifierModalProps> = ({
  open,
  onClose,
  api,
  currentCompany,
  onSuccess,
}) => {
  const { mode } = useTheme();
  const theme = useThemeValues();

  const [verifierPubkey, setVerifierPubkey] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleRegister = async () => {
    if (!api) {
      setError('API not connected');
      return;
    }

    if (!verifierPubkey.trim()) {
      setError('Please enter verifier public key');
      return;
    }

    // Basic validation for hex format
    if (!/^(0x)?[0-9a-fA-F]{64}$/.test(verifierPubkey.trim())) {
      setError('Invalid public key format. Must be 64 hex characters (32 bytes)');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Normalize pubkey (remove 0x prefix if present)
      const normalizedPubkey = verifierPubkey.trim().replace(/^0x/, '');

      console.log('[RegisterVerifier] Registering trusted verifier:', normalizedPubkey);

      const result = await api.registerTrustedVerifier(normalizedPubkey);

      if (result) {
        console.log('[RegisterVerifier] ✅ Verifier registered successfully');
        setSuccess(true);
        setVerifierPubkey('');

        // Auto-close after 2 seconds
        setTimeout(() => {
          setSuccess(false);
          onClose();
          onSuccess?.();
        }, 2000);
      } else {
        setError('Verifier already registered');
      }
    } catch (err: any) {
      console.error('[RegisterVerifier] Failed to register verifier:', err);
      setError(err.message || 'Failed to register verifier');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setVerifierPubkey('');
      setError(null);
      setSuccess(false);
      onClose();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          bgcolor: mode === 'dark' ? theme.colors.background.paper : '#FFFFFF',
        },
      }}
    >
      <DialogTitle>
        <Stack direction="row" alignItems="center" spacing={1}>
          <VerifiedUserIcon sx={{ color: theme.colors.primary[500] }} />
          <Typography variant="h6" fontWeight={theme.typography.fontWeight.semibold}>
            Register Trusted ZKML Verifier
          </Typography>
        </Stack>
        <Typography variant="body2" color={theme.colors.text.secondary} sx={{ mt: 1 }}>
          Add a trusted verifier for employee income proofs
        </Typography>
      </DialogTitle>

      <DialogContent>
        <Stack spacing={3} sx={{ mt: 2 }}>
          {/* Info Alert */}
          <Alert severity="info" sx={{ borderRadius: 2 }}>
            <Typography variant="body2">
              <strong>Security:</strong> Only trusted verifiers can sign income proofs.
              Make sure you trust the verifier service before registering.
            </Typography>
          </Alert>

          {/* Verifier Public Key Input */}
          <TextField
            label="Verifier Public Key"
            placeholder="Enter 64-character hex public key (32 bytes)"
            value={verifierPubkey}
            onChange={(e) => setVerifierPubkey(e.target.value)}
            fullWidth
            multiline
            rows={3}
            disabled={loading || success}
            error={!!error && !success}
            helperText={
              error && !success
                ? error
                : 'Public key of the ZKML verifier service (e.g., 0xa0cb1aac7c3e2b15...)'
            }
            sx={{
              '& .MuiOutlinedInput-root': {
                fontFamily: 'monospace',
                fontSize: '0.9rem',
              },
            }}
          />

          {/* Example Public Key */}
          <Box
            sx={{
              p: 2,
              borderRadius: 2,
              bgcolor: mode === 'dark' ? `${theme.colors.primary[500]}10` : theme.colors.primary[50],
              border: `1px dashed ${theme.colors.primary[500]}`,
            }}
          >
            <Typography variant="caption" color={theme.colors.text.secondary} sx={{ mb: 1, display: 'block' }}>
              Example verifier public key:
            </Typography>
            <Typography
              variant="caption"
              sx={{
                fontFamily: 'monospace',
                wordBreak: 'break-all',
                color: theme.colors.primary[500],
              }}
            >
              a0cb1aac7c3e2b15d4f8e6a3b9c5d7e2f1a4b8c6d9e3f7a1b5c8d2e6f9a3b7c1
            </Typography>
          </Box>

          {/* Success Alert */}
          {success && (
            <Alert severity="success" sx={{ borderRadius: 2 }}>
              ✅ Verifier registered successfully! Closing...
            </Alert>
          )}

          {/* Error Alert */}
          {error && !success && (
            <Alert severity="error" sx={{ borderRadius: 2 }}>
              {error}
            </Alert>
          )}
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleRegister}
          disabled={loading || success || !verifierPubkey.trim()}
          startIcon={loading ? <CircularProgress size={16} /> : <VerifiedUserIcon />}
          sx={{
            bgcolor: theme.colors.primary[500],
            '&:hover': { bgcolor: theme.colors.primary[700] },
          }}
        >
          {loading ? 'Registering...' : 'Register Verifier'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
