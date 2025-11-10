// @ts-nocheck - MUI Grid v5/v6 compatibility issues (runtime works fine)
import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Stack,
  Paper,
  Button,
  Chip,
  CircularProgress,
  Alert,
  Divider,
  Grid,
} from '@mui/material';
import VerifiedIcon from '@mui/icons-material/Verified';
import DownloadIcon from '@mui/icons-material/Download';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useTheme, useThemeValues } from '../theme';
import { type DeployedPayrollAPI } from '@zksalaria/payroll-api';

interface IncomeProof {
  employee_id: Uint8Array;
  proof_type: bigint;
  threshold_min: bigint;
  threshold_max: bigint;
  txids: Uint8Array[];
  history_commitment: Uint8Array;
  attestation_hash: Uint8Array;
  verifier_pubkey: Uint8Array;
  submitted_at: bigint;
  expires_at: bigint;
}

const PROOF_TYPE_NAMES: Record<number, string> = {
  1: 'Income Above Threshold',
  2: 'Income Range',
  3: 'Average Income',
  4: 'First-Time Loan Eligibility',
};

const PROOF_TYPE_DESCRIPTIONS: Record<number, string> = {
  1: 'Proves minimum monthly income meets threshold',
  2: 'Proves monthly income falls within specified range',
  3: 'Proves average income over 6 months meets minimum',
  4: 'Proves income consistency for loan eligibility',
};

interface MyIncomeProofsViewProps {
  api: DeployedPayrollAPI | null;
  walletAddress: string;
  onBack: () => void;
}

/**
 * My Income Proofs View - Embedded in Employee Dashboard
 * Shows generated income proofs without navigation
 */
export const MyIncomeProofsView: React.FC<MyIncomeProofsViewProps> = ({
  api,
  walletAddress,
  onBack,
}) => {
  const { mode } = useTheme();
  const theme = useThemeValues();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [incomeProof, setIncomeProof] = useState<IncomeProof | null>(null);

  useEffect(() => {
    const loadProofData = async () => {
      if (!api || !walletAddress) {
        setLoading(false);
        return;
      }

      try {
        // Query income proof from contract
        const proof = await api.getIncomeProof(walletAddress);
        console.log('[MyIncomeProofs] Income proof:', proof);

        if (proof) {
          setIncomeProof(proof);
        }

        setLoading(false);
      } catch (err) {
        console.error('[MyIncomeProofs] Failed to load proof data:', err);
        setError(`Failed to load proof data: ${err}`);
        setLoading(false);
      }
    };

    loadProofData();
  }, [api, walletAddress]);

  const formatTimestamp = (timestamp: bigint): string => {
    if (!timestamp || timestamp === 0n) return 'Never';
    const date = new Date(Number(timestamp) * 1000);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatAmount = (amount: bigint): string => {
    return `$${(Number(amount) / 100).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const handleDownloadProof = () => {
    if (!incomeProof) return;

    const proofData = {
      employee_id: Array.from(incomeProof.employee_id),
      proof_type: Number(incomeProof.proof_type),
      threshold_min: incomeProof.threshold_min.toString(),
      threshold_max: incomeProof.threshold_max.toString(),
      attestation_hash: Array.from(incomeProof.attestation_hash),
      verifier_pubkey: Array.from(incomeProof.verifier_pubkey),
      submitted_at: incomeProof.submitted_at.toString(),
      expires_at: incomeProof.expires_at.toString(),
    };

    const blob = new Blob([JSON.stringify(proofData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `income-proof-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 400,
        }}
      >
        <CircularProgress sx={{ color: theme.colors.primary[500] }} />
      </Box>
    );
  }

  return (
    <Stack spacing={3}>
      {/* Back Button & Header */}
      <Box>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={onBack}
          sx={{
            mb: 2,
            color: theme.colors.text.secondary,
            '&:hover': { bgcolor: 'transparent', color: theme.colors.primary[500] },
          }}
        >
          Back to Dashboard
        </Button>
        <Stack direction="row" alignItems="center" spacing={2}>
          <VerifiedIcon sx={{ fontSize: 32, color: theme.colors.primary[500] }} />
          <Box>
            <Typography
              variant="h5"
              fontWeight={theme.typography.fontWeight.bold}
              color={theme.colors.text.primary}
            >
              My Income Proofs
            </Typography>
            <Typography variant="body2" color={theme.colors.text.secondary}>
              View and manage your verified income proofs
            </Typography>
          </Box>
        </Stack>
      </Box>

      {error && (
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Info Alert */}
      <Alert
        severity="info"
        icon={<InfoOutlinedIcon />}
        sx={{
          bgcolor: mode === 'dark' ? `${theme.colors.info[500]}20` : theme.colors.info[50],
          border: `1px solid ${theme.colors.info[500]}`,
        }}
      >
        <Typography variant="body2" fontWeight={theme.typography.fontWeight.medium}>
          Your income proofs are stored on-chain and verified using zero-knowledge cryptography.
          Only the proof result is visible - your actual payment amounts remain private.
        </Typography>
      </Alert>

      {/* Generated Income Proofs */}
      {!incomeProof ? (
        <Paper
          elevation={2}
          sx={{
            p: 6,
            borderRadius: 3,
            bgcolor: mode === 'dark' ? theme.colors.background.paper : '#FFFFFF',
            textAlign: 'center',
          }}
        >
          <VerifiedIcon
            sx={{
              fontSize: 64,
              color: theme.colors.text.disabled,
              mb: 2,
            }}
          />
          <Typography
            variant="h6"
            color={theme.colors.text.secondary}
            fontWeight={theme.typography.fontWeight.medium}
            sx={{ mb: 1 }}
          >
            No Income Proofs Yet
          </Typography>
          <Typography variant="body2" color={theme.colors.text.disabled}>
            Generate your first income proof to verify your earnings privately.
          </Typography>
        </Paper>
      ) : (
        <Paper
          elevation={2}
          sx={{
            borderRadius: 3,
            bgcolor: mode === 'dark' ? theme.colors.background.paper : '#FFFFFF',
            overflow: 'hidden',
          }}
        >
          {/* Proof Header */}
          <Box
            sx={{
              p: 3,
              bgcolor:
                mode === 'dark'
                  ? `${theme.colors.primary[500]}15`
                  : theme.colors.primary[50],
              borderBottom: `1px solid ${theme.colors.border.default}`,
            }}
          >
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <Stack direction="row" alignItems="center" spacing={2}>
                <VerifiedIcon sx={{ fontSize: 32, color: theme.colors.primary[500] }} />
                <Box>
                  <Typography
                    variant="h6"
                    fontWeight={theme.typography.fontWeight.semibold}
                    color={theme.colors.text.primary}
                  >
                    {PROOF_TYPE_NAMES[Number(incomeProof.proof_type)] || `Type ${incomeProof.proof_type}`}
                  </Typography>
                  <Typography variant="body2" color={theme.colors.text.secondary}>
                    {PROOF_TYPE_DESCRIPTIONS[Number(incomeProof.proof_type)] || 'Income verification proof'}
                  </Typography>
                </Box>
              </Stack>
              <Chip
                label={<Typography>Verified</Typography>}
                color="success"
                icon={<VerifiedIcon sx={{ fontSize: 22 }}/>}
                sx={{ fontWeight: theme.typography.fontWeight.semibold }}
              />
            </Stack>
          </Box>

          {/* Proof Details */}
          <Box sx={{ p: 3 }}>
            <Grid container spacing={3}>
              {/* Threshold Information */}
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
                    Proven Threshold
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
                    {Number(incomeProof.proof_type) === 2
                      ? `${formatAmount(incomeProof.threshold_min)} - ${formatAmount(incomeProof.threshold_max)}`
                      : `≥ ${formatAmount(incomeProof.threshold_min)}`}
                  </Typography>
                  <Typography variant="caption" color={theme.colors.text.disabled}>
                    {Number(incomeProof.proof_type) === 2 ? 'Income Range' : 'Minimum Income'}
                  </Typography>
                </Paper>
              </Grid>

              {/* Submission Date */}
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
                    Submission Date
                  </Typography>
                  <Typography
                    variant="h6"
                    fontWeight={theme.typography.fontWeight.semibold}
                    color={theme.colors.text.primary}
                  >
                    {formatTimestamp(incomeProof.submitted_at)}
                  </Typography>
                  <Typography variant="caption" color={theme.colors.text.disabled}>
                    {incomeProof.expires_at !== 0n
                      ? `Expires: ${formatTimestamp(incomeProof.expires_at)}`
                      : 'Never expires'}
                  </Typography>
                </Paper>
              </Grid>

              {/* Attestation Hash */}
              <Grid item xs={12}>
                <Box>
                  <Typography
                    variant="caption"
                    color={theme.colors.text.secondary}
                    sx={{ mb: 0.5, display: 'block' }}
                  >
                    Attestation Hash
                  </Typography>
                  <Typography
                    variant="body2"
                    fontFamily="monospace"
                    color={theme.colors.text.primary}
                    sx={{
                      bgcolor: mode === 'dark' ? theme.colors.background.default : theme.colors.background.paper,
                      p: 1.5,
                      borderRadius: 1,
                      wordBreak: 'break-all',
                    }}
                  >
                    {Array.from(incomeProof.attestation_hash)
                      .map((b) => b.toString(16).padStart(2, '0'))
                      .join('')}
                  </Typography>
                </Box>
              </Grid>
            </Grid>

            <Divider sx={{ my: 3 }} />

            {/* Actions */}
            <Stack direction="row" spacing={2}>
              <Button
                variant="contained"
                startIcon={<DownloadIcon />}
                onClick={handleDownloadProof}
                sx={{
                  bgcolor: theme.colors.primary[500],
                  '&:hover': { bgcolor: theme.colors.primary[700] },
                }}
              >
                Download Proof
              </Button>
            </Stack>
          </Box>
        </Paper>
      )}
    </Stack>
  );
};
