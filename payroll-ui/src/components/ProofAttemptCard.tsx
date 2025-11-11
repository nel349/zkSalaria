// @ts-nocheck - MUI Grid v5/v6 compatibility issues (runtime works fine)
import React from 'react';
import {
  Box,
  Typography,
  Stack,
  Paper,
  Chip,
  Divider,
  Button,
  Grid,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import VerifiedIcon from '@mui/icons-material/Verified';
import DownloadIcon from '@mui/icons-material/Download';
import { useTheme, useThemeValues } from '../theme';

interface ProofAttemptCardProps {
  proofType: number;
  timestamp: number;
  success: boolean;
  message?: string;
  onDownloadFailureReport?: () => void;
  // Test data
  payments?: number[];
  actualValue?: number;
  thresholdMin?: number;
  thresholdMax?: number;
}

const PROOF_TYPE_NAMES: Record<number, string> = {
  1: 'Income Above Threshold',
  2: 'Income Range',
  3: 'Average Income',
  4: 'First-Time Loan Eligibility',
};

/**
 * Reusable card for displaying proof attempts (both successful and failed)
 * Used for localStorage-only proofs that don't have full on-chain data
 */
export const ProofAttemptCard: React.FC<ProofAttemptCardProps> = ({
  proofType,
  timestamp,
  success,
  message,
  onDownloadFailureReport,
  payments,
  actualValue,
  thresholdMin,
  thresholdMax,
}) => {
  const { mode } = useTheme();
  const theme = useThemeValues();

  const formatTimestamp = (ts: number): string => {
    const date = new Date(ts);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Paper
      elevation={2}
      sx={{
        borderRadius: 3,
        bgcolor: mode === 'dark' ? theme.colors.background.paper : '#FFFFFF',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <Box
        sx={{
          p: 3,
          bgcolor: success
            ? mode === 'dark'
              ? `${theme.colors.success[500]}15`
              : theme.colors.success[50]
            : mode === 'dark'
              ? `${theme.colors.error[500]}15`
              : theme.colors.error[50],
          borderBottom: `1px solid ${theme.colors.border.default}`,
        }}
      >
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Stack direction="row" alignItems="center" spacing={2}>
            {success ? (
              <CheckCircleIcon sx={{ fontSize: 32, color: theme.colors.success[500] }} />
            ) : (
              <CancelIcon sx={{ fontSize: 32, color: theme.colors.error[500] }} />
            )}
            <Box>
              <Typography
                variant="h6"
                fontWeight={theme.typography.fontWeight.semibold}
                color={theme.colors.text.primary}
              >
                {PROOF_TYPE_NAMES[proofType] || `Type ${proofType}`}
              </Typography>
              <Typography variant="body2" color={theme.colors.text.secondary}>
                {formatTimestamp(timestamp)}
              </Typography>
            </Box>
          </Stack>
          <Chip
            label={success ? 'SUCCESS' : 'FAILED'}
            color={success ? 'success' : 'error'}
            sx={{ fontWeight: theme.typography.fontWeight.semibold }}
          />
        </Stack>
      </Box>

      {/* Details */}
      <Box sx={{ p: 3 }}>
        <Grid container spacing={3}>
          {/* Proof Type */}
          <Grid item xs={12} md={6}>
            <Paper
              elevation={0}
              sx={{
                p: 2,
                bgcolor: mode === 'dark' ? theme.colors.background.default : theme.colors.background.paper,
                borderRadius: 2,
              }}
            >
              <Typography
                variant="caption"
                color={theme.colors.text.secondary}
                sx={{ mb: 0.5, display: 'block' }}
              >
                Proof Type
              </Typography>
              <Typography
                variant="h5"
                fontWeight={theme.typography.fontWeight.bold}
                sx={{
                  background: `linear-gradient(135deg, ${theme.colors.primary[400]}, ${theme.colors.secondary[500]})`,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                {PROOF_TYPE_NAMES[proofType]}
              </Typography>
              <Typography variant="caption" color={theme.colors.text.disabled}>
                {success ? 'Verification Successful' : 'Verification Failed'}
              </Typography>
            </Paper>
          </Grid>

          {/* Attempt Date */}
          <Grid item xs={12} md={6}>
            <Paper
              elevation={0}
              sx={{
                p: 2,
                bgcolor: mode === 'dark' ? theme.colors.background.default : theme.colors.background.paper,
                borderRadius: 2,
              }}
            >
              <Typography
                variant="caption"
                color={theme.colors.text.secondary}
                sx={{ mb: 0.5, display: 'block' }}
              >
                Attempt Date
              </Typography>
              <Typography
                variant="h6"
                fontWeight={theme.typography.fontWeight.semibold}
                color={theme.colors.text.primary}
              >
                {formatTimestamp(timestamp)}
              </Typography>
              <Typography variant="caption" color={theme.colors.text.disabled}>
                {success ? 'Stored in browser' : 'Not submitted to blockchain'}
              </Typography>
            </Paper>
          </Grid>

          {/* Test Values - show actual amounts tested */}
          {actualValue !== undefined && thresholdMin !== undefined && (
            <Grid item xs={12}>
              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  bgcolor: mode === 'dark' ? theme.colors.background.default : theme.colors.background.paper,
                  borderRadius: 2,
                  border: `1px solid ${theme.colors.border.default}`,
                }}
              >
                <Typography
                  variant="caption"
                  color={theme.colors.text.secondary}
                  sx={{ mb: 1, display: 'block' }}
                >
                  Test Values
                </Typography>

                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color={theme.colors.text.secondary}>
                      6-Month Total:
                    </Typography>
                    <Typography
                      variant="h6"
                      fontWeight={theme.typography.fontWeight.bold}
                      color={theme.colors.text.primary}
                    >
                      ${actualValue.toLocaleString()}
                    </Typography>
                    {payments && payments.length === 6 && (
                      <Typography variant="caption" color={theme.colors.text.disabled}>
                        (${payments.map(p => p.toLocaleString()).join(', $')})
                      </Typography>
                    )}
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color={theme.colors.text.secondary}>
                      {proofType === 2 ? 'Range:' : proofType === 3 ? 'Avg Threshold:' : 'Threshold:'}
                    </Typography>
                    <Typography
                      variant="h6"
                      fontWeight={theme.typography.fontWeight.bold}
                      color={success ? theme.colors.success[600] : theme.colors.error[600]}
                    >
                      {proofType === 2 && thresholdMax
                        ? `$${thresholdMin.toLocaleString()} - $${thresholdMax.toLocaleString()}`
                        : `$${thresholdMin.toLocaleString()}`
                      }
                    </Typography>
                    <Typography variant="caption" color={theme.colors.text.disabled}>
                      {proofType === 1 || proofType === 2 ? '(6-month)' : proofType === 3 ? '(monthly)' : '(consistency)'}
                    </Typography>
                  </Grid>
                </Grid>
              </Paper>
            </Grid>
          )}

          {/* Status Badge */}
          <Grid item xs={12}>
            <Paper
              elevation={0}
              sx={{
                p: 2,
                bgcolor: success
                  ? mode === 'dark'
                    ? `${theme.colors.success[500]}20`
                    : theme.colors.success[50]
                  : mode === 'dark'
                    ? `${theme.colors.error[500]}20`
                    : theme.colors.error[50],
                borderRadius: 2,
                border: success
                  ? `1px solid ${theme.colors.success[500]}`
                  : `1px solid ${theme.colors.error[500]}`,
              }}
            >
              <Stack direction="row" alignItems="center" spacing={1}>
                {success ? (
                  <VerifiedIcon sx={{ color: theme.colors.success[500], fontSize: 20 }} />
                ) : (
                  <CancelIcon sx={{ color: theme.colors.error[500], fontSize: 20 }} />
                )}
                <Typography
                  variant="body2"
                  fontWeight={theme.typography.fontWeight.semibold}
                  color={success ? theme.colors.success[700] : theme.colors.error[700]}
                >
                  {success ? 'Stored Locally - Previously Verified' : 'Local Record - Not Submitted to Blockchain'}
                </Typography>
              </Stack>
              {!success && message && (
                <Typography variant="caption" color={theme.colors.text.secondary} sx={{ mt: 0.5, display: 'block' }}>
                  {message}
                </Typography>
              )}
            </Paper>
          </Grid>
        </Grid>

        {!success && onDownloadFailureReport && (
          <>
            <Divider sx={{ my: 3 }} />
            <Stack direction="row" spacing={2} flexWrap="wrap">
              <Button
                variant="contained"
                startIcon={<DownloadIcon />}
                onClick={onDownloadFailureReport}
                sx={{
                  bgcolor: theme.colors.error[500],
                  '&:hover': { bgcolor: theme.colors.error[700] },
                }}
              >
                Download Failure Report
              </Button>
            </Stack>
          </>
        )}
      </Box>
    </Paper>
  );
};
