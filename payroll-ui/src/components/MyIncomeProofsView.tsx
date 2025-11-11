import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Stack,
  Paper,
  Button,
  CircularProgress,
  Alert,
  TextField,
  IconButton,
} from '@mui/material';
import VerifiedIcon from '@mui/icons-material/Verified';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { useTheme, useThemeValues } from '../theme';
import { type DeployedPayrollAPI } from '@zksalaria/payroll-api';
import { ProofVerificationCard } from './ProofVerificationCard';
import { toast } from 'react-hot-toast';
import { getCurrentEmployer } from '../utils/EmployerContractsLocalState';

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
  const [contractAddress, setContractAddress] = useState<string | null>(null);
  const [proofLink, setProofLink] = useState<string>('');

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

          // Get contract address
          const employerContract = getCurrentEmployer();
          setContractAddress(employerContract);

          // Generate shareable link
          const hashHex = (Array.from(proof.attestation_hash) as number[])
            .map((b) => b.toString(16).padStart(2, '0'))
            .join('');
          const link = `${window.location.origin}/verify/${hashHex}`;
          setProofLink(link);
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

  const handleCopyLink = () => {
    if (proofLink) {
      navigator.clipboard.writeText(proofLink);
      toast.success('Proof link copied to clipboard!');
    }
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
        <Stack spacing={3}>
          {/* Shareable Link Section */}
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
              value={proofLink}
              InputProps={{
                readOnly: true,
                endAdornment: (
                  <IconButton onClick={handleCopyLink} size="small">
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

          {/* Proof Verification Card */}
          <ProofVerificationCard
            proof={incomeProof}
            contractAddress={contractAddress || undefined}
            showDownloadPDF={true}
            showTechnicalDetails={true}
          />
        </Stack>
      )}
    </Stack>
  );
};
