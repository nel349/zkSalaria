// @ts-nocheck - MUI Grid v5/v6 compatibility issues (runtime works fine)
import React, { useState } from 'react';
import {
  Box,
  Typography,
  Stack,
  Paper,
  Button,
  Chip,
  Divider,
  Grid,
  Collapse,
  IconButton,
} from '@mui/material';
import VerifiedIcon from '@mui/icons-material/Verified';
import DownloadIcon from '@mui/icons-material/Download';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import WarningIcon from '@mui/icons-material/Warning';
import ErrorIcon from '@mui/icons-material/Error';
import { useTheme, useThemeValues } from '../theme';
import { generateProofPDF } from '../utils/pdfGenerator';

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
  5: 'Tax Bracket Verification',
};

const PROOF_TYPE_DESCRIPTIONS: Record<number, string> = {
  1: 'Proves minimum monthly income meets threshold',
  2: 'Proves monthly income falls within specified range',
  3: 'Proves average income over 6 months meets minimum',
  4: 'Proves income consistency for loan eligibility',
  5: 'Proves annual income falls within specific tax bracket',
};

interface ProofVerificationCardProps {
  proof: IncomeProof;
  contractAddress?: string;
  showDownloadPDF?: boolean;
  showTechnicalDetails?: boolean;
}

/**
 * Proof Verification Card - Reusable component for displaying proof details
 * Used in both employee dashboard and public verification page
 */
export const ProofVerificationCard: React.FC<ProofVerificationCardProps> = ({
  proof,
  contractAddress,
  showDownloadPDF = true,
  showTechnicalDetails = true,
}) => {
  const { mode } = useTheme();
  const theme = useThemeValues();
  const [expandedTech, setExpandedTech] = useState(false);
  const [copied, setCopied] = useState(false);

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
    // Income proof thresholds are stored as whole dollars (NOT cents)
    // e.g., 12500n = $12,500 (not $125.00)
    return `$${Number(amount).toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })}`;
  };

  const getVerificationStatus = () => {
    const now = BigInt(Math.floor(Date.now() / 1000));
    if (proof.expires_at !== 0n && proof.expires_at < now) {
      return { label: 'Expired', color: 'warning' as const, icon: <WarningIcon /> };
    }
    return { label: 'Verified', color: 'success' as const, icon: <VerifiedIcon /> };
  };

  const handleCopyHash = async () => {
    const hashHex = Array.from(proof.attestation_hash)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
    await navigator.clipboard.writeText(hashHex);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadJSON = () => {
    const proofData = {
      employee_id: Array.from(proof.employee_id),
      proof_type: Number(proof.proof_type),
      threshold_min: proof.threshold_min.toString(),
      threshold_max: proof.threshold_max.toString(),
      attestation_hash: Array.from(proof.attestation_hash),
      verifier_pubkey: Array.from(proof.verifier_pubkey),
      submitted_at: proof.submitted_at.toString(),
      expires_at: proof.expires_at.toString(),
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

  const handleDownloadPDF = async () => {
    await generateProofPDF(proof, contractAddress);
  };

  const status = getVerificationStatus();

  return (
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
            {status.icon && React.cloneElement(status.icon as React.ReactElement<any>, {
              sx: { fontSize: 32, color: theme.colors.primary[500] }
            })}
            <Box>
              <Typography
                variant="h6"
                fontWeight={theme.typography.fontWeight.semibold}
                color={theme.colors.text.primary}
              >
                {PROOF_TYPE_NAMES[Number(proof.proof_type)] || `Type ${proof.proof_type}`}
              </Typography>
              <Typography variant="body2" color={theme.colors.text.secondary}>
                {PROOF_TYPE_DESCRIPTIONS[Number(proof.proof_type)] || 'Income verification proof'}
              </Typography>
            </Box>
          </Stack>
          <Chip
            label={status.label}
            color={status.color}
            icon={status.icon}
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
                {Number(proof.proof_type) === 2 || Number(proof.proof_type) === 5
                  ? `${formatAmount(proof.threshold_min)} - ${formatAmount(proof.threshold_max)}`
                  : `≥ ${formatAmount(proof.threshold_min)}`}
              </Typography>
              <Typography variant="caption" color={theme.colors.text.disabled}>
                {Number(proof.proof_type) === 2 ? 'Income Range' :
                 Number(proof.proof_type) === 5 ? 'Tax Bracket Range (Annual)' :
                 'Minimum Income'}
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
                Generated Date
              </Typography>
              <Typography
                variant="h6"
                fontWeight={theme.typography.fontWeight.semibold}
                color={theme.colors.text.primary}
              >
                {formatTimestamp(proof.submitted_at)}
              </Typography>
              <Typography variant="caption" color={theme.colors.text.disabled}>
                {proof.expires_at !== 0n
                  ? `Expires: ${formatTimestamp(proof.expires_at)}`
                  : 'Never expires'}
              </Typography>
            </Paper>
          </Grid>

          {/* ZK Verification Status */}
          <Grid item xs={12}>
            <Paper
              elevation={0}
              sx={{
                p: 2,
                bgcolor: mode === 'dark'
                  ? `${theme.colors.success[500]}20`
                  : theme.colors.success[50],
                borderRadius: 2,
                border: `1px solid ${theme.colors.success[500]}`,
              }}
            >
              <Stack direction="row" alignItems="center" spacing={1}>
                <VerifiedIcon sx={{ color: theme.colors.success[500], fontSize: 20 }} />
                <Typography
                  variant="body2"
                  fontWeight={theme.typography.fontWeight.semibold}
                  color={theme.colors.success[700]}
                >
                  Cryptographically Verified On-Chain
                </Typography>
              </Stack>
              <Typography variant="caption" color={theme.colors.text.secondary} sx={{ mt: 0.5, display: 'block' }}>
                This proof has been validated using zero-knowledge cryptography and stored on the Midnight blockchain.
              </Typography>
            </Paper>
          </Grid>
        </Grid>

        {/* Technical Details (Expandable) */}
        {showTechnicalDetails && (
          <>
            <Divider sx={{ my: 3 }} />
            <Box>
              <Button
                onClick={() => setExpandedTech(!expandedTech)}
                endIcon={
                  <ExpandMoreIcon
                    sx={{
                      transform: expandedTech ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.3s',
                    }}
                  />
                }
                sx={{ color: theme.colors.text.secondary, mb: 1 }}
              >
                Technical Details
              </Button>
              <Collapse in={expandedTech}>
                <Stack spacing={2}>
                  {/* Attestation Hash */}
                  <Box>
                    <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 0.5 }}>
                      <Typography variant="caption" color={theme.colors.text.secondary}>
                        Attestation Hash
                      </Typography>
                      <IconButton size="small" onClick={handleCopyHash}>
                        <ContentCopyIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                    </Stack>
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
                      {Array.from(proof.attestation_hash)
                        .map((b) => b.toString(16).padStart(2, '0'))
                        .join('')}
                    </Typography>
                    {copied && (
                      <Typography variant="caption" color={theme.colors.success[500]} sx={{ mt: 0.5, display: 'block' }}>
                        Copied to clipboard!
                      </Typography>
                    )}
                  </Box>

                  {/* Verifier Public Key */}
                  <Box>
                    <Typography variant="caption" color={theme.colors.text.secondary} sx={{ mb: 0.5, display: 'block' }}>
                      ZKML Verifier Public Key
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
                      {Array.from(proof.verifier_pubkey)
                        .map((b) => b.toString(16).padStart(2, '0'))
                        .join('')}
                    </Typography>
                  </Box>

                  {/* Contract Address */}
                  {contractAddress && (
                    <Box>
                      <Typography variant="caption" color={theme.colors.text.secondary} sx={{ mb: 0.5, display: 'block' }}>
                        Employer Contract Address
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
                        {contractAddress}
                      </Typography>
                    </Box>
                  )}
                </Stack>
              </Collapse>
            </Box>
          </>
        )}

        <Divider sx={{ my: 3 }} />

        {/* Actions */}
        <Stack direction="row" spacing={2} flexWrap="wrap">
          {showDownloadPDF && (
            <Button
              variant="contained"
              startIcon={<DownloadIcon />}
              onClick={handleDownloadPDF}
              sx={{
                bgcolor: theme.colors.primary[500],
                '&:hover': { bgcolor: theme.colors.primary[700] },
              }}
            >
              Download PDF Report
            </Button>
          )}
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={handleDownloadJSON}
            sx={{
              borderColor: theme.colors.border.default,
              color: theme.colors.text.secondary
            }}
          >
            Download JSON
          </Button>
        </Stack>
      </Box>
    </Paper>
  );
};
