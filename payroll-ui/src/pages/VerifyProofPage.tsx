import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Stack,
  Paper,
  Button,
  CircularProgress,
  Alert,
  Container,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import VerifiedIcon from '@mui/icons-material/Verified';
import { useTheme, useThemeValues } from '../theme';
import { usePayrollWallet } from '../contexts/PayrollWalletContext';
import { PayrollAPI, type DeployedPayrollAPI } from '@zksalaria/payroll-api';
import { ProofVerificationCard } from '../components/ProofVerificationCard';
import { getCurrentEmployer } from '../utils/EmployerContractsLocalState';
import pino from 'pino';

const logger = pino({
  name: 'verify-proof',
  level: 'info',
  browser: {
    asObject: false,
  },
});

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

/**
 * Public Proof Verification Page
 * Allows anyone with a link to verify an income proof on-chain
 * URL: /verify/:employeeId/:attestationHash
 */
export const VerifyProofPage: React.FC = () => {
  const { employeeId, attestationHash } = useParams<{ employeeId: string; attestationHash: string }>();
  const navigate = useNavigate();
  const { mode } = useTheme();
  const theme = useThemeValues();
  const { walletAddress, providers, connect } = usePayrollWallet();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [proof, setProof] = useState<IncomeProof | null>(null);
  const [contractAddress, setContractAddress] = useState<string | null>(null);
  const [needsWallet, setNeedsWallet] = useState(false);

  useEffect(() => {
    const loadProof = async () => {
      if (!attestationHash || !employeeId) {
        setError('Invalid verification link: Missing employee ID or attestation hash');
        setLoading(false);
        return;
      }

      // Check if wallet is connected
      if (!walletAddress) {
        setNeedsWallet(true);
        setLoading(false);
        return;
      }

      try {
        // Get employer contract
        const employerContract = getCurrentEmployer();
        if (!employerContract) {
          setError('No employer contract found. Please ensure you have the correct configuration.');
          setLoading(false);
          return;
        }

        setContractAddress(employerContract);

        // Connect to contract
        const api = await PayrollAPI.connect(
          providers,
          employerContract,
          walletAddress,
          logger
        );

        // Query proof using employee ID from URL (not connected wallet)
        // This allows landlords/lenders to verify without needing employee's wallet
        console.log('[VerifyProof] Querying proof for employee:', employeeId);
        console.log('[VerifyProof] Expected attestation hash:', attestationHash);
        const fetchedProof = await api.getIncomeProof(employeeId);

        if (!fetchedProof) {
          setError('Proof not found. This proof may not exist or has been revoked.');
          setLoading(false);
          return;
        }

        // Verify the attestation hash matches
        const proofHashHex = (Array.from(fetchedProof.attestation_hash) as number[])
          .map((b) => b.toString(16).padStart(2, '0'))
          .join('');

        if (proofHashHex !== attestationHash) {
          setError('Proof mismatch: The attestation hash does not match the requested proof.');
          setLoading(false);
          return;
        }

        setProof(fetchedProof);
        setLoading(false);
      } catch (err) {
        console.error('[VerifyProof] Failed to load proof:', err);
        setError(`Failed to verify proof: ${err}`);
        setLoading(false);
      }
    };

    loadProof();
  }, [employeeId, attestationHash, walletAddress, providers]);

  const handleConnectWallet = async () => {
    try {
      await connect();
      setNeedsWallet(false);
      setLoading(true);
    } catch (err) {
      setError(`Failed to connect wallet: ${err}`);
    }
  };

  if (needsWallet) {
    return (
      <Container maxWidth="md" sx={{ py: 8 }}>
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
              color: theme.colors.primary[500],
              mb: 3,
            }}
          />
          <Typography
            variant="h5"
            fontWeight={theme.typography.fontWeight.bold}
            color={theme.colors.text.primary}
            sx={{ mb: 2 }}
          >
            Wallet Connection Required
          </Typography>
          <Typography
            variant="body1"
            color={theme.colors.text.secondary}
            sx={{ mb: 4 }}
          >
            To verify this income proof on-chain, please connect your wallet.
            This allows us to query the proof from the Midnight blockchain.
          </Typography>
          <Button
            variant="contained"
            size="large"
            onClick={handleConnectWallet}
            sx={{
              bgcolor: theme.colors.primary[500],
              '&:hover': { bgcolor: theme.colors.primary[700] },
              px: 4,
            }}
          >
            Connect Wallet
          </Button>
        </Paper>
      </Container>
    );
  }

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ py: 8 }}>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: 400,
          }}
        >
          <CircularProgress sx={{ color: theme.colors.primary[500], mb: 2 }} />
          <Typography variant="body1" color={theme.colors.text.secondary}>
            Verifying proof on-chain...
          </Typography>
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="md" sx={{ py: 8 }}>
        <Stack spacing={3}>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/')}
            sx={{ alignSelf: 'flex-start', color: theme.colors.text.secondary }}
          >
            Back to Home
          </Button>
          <Alert severity="error">
            <Typography variant="body1" fontWeight={theme.typography.fontWeight.semibold}>
              Verification Failed
            </Typography>
            <Typography variant="body2">{error}</Typography>
          </Alert>
        </Stack>
      </Container>
    );
  }

  if (!proof) {
    return (
      <Container maxWidth="md" sx={{ py: 8 }}>
        <Stack spacing={3}>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/')}
            sx={{ alignSelf: 'flex-start', color: theme.colors.text.secondary }}
          >
            Back to Home
          </Button>
          <Paper
            elevation={2}
            sx={{
              p: 6,
              borderRadius: 3,
              bgcolor: mode === 'dark' ? theme.colors.background.paper : '#FFFFFF',
              textAlign: 'center',
            }}
          >
            <Typography variant="h6" color={theme.colors.text.secondary}>
              Proof not found
            </Typography>
          </Paper>
        </Stack>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 8 }}>
      <Stack spacing={4}>
        {/* Header */}
        <Box>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/')}
            sx={{
              mb: 3,
              color: theme.colors.text.secondary,
              '&:hover': { bgcolor: 'transparent', color: theme.colors.primary[500] },
            }}
          >
            Back to Home
          </Button>
          <Stack direction="row" alignItems="center" spacing={2}>
            <VerifiedIcon sx={{ fontSize: 40, color: theme.colors.primary[500] }} />
            <Box>
              <Typography
                variant="h4"
                fontWeight={theme.typography.fontWeight.bold}
                color={theme.colors.text.primary}
              >
                Income Proof Verification
              </Typography>
              <Typography variant="body1" color={theme.colors.text.secondary}>
                This proof has been cryptographically verified on the Midnight blockchain
              </Typography>
            </Box>
          </Stack>
        </Box>

        {/* Info Alert */}
        <Alert
          severity="info"
          sx={{
            bgcolor: mode === 'dark' ? `${theme.colors.info[500]}20` : theme.colors.info[50],
            border: `1px solid ${theme.colors.info[500]}`,
          }}
        >
          <Typography variant="body2" fontWeight={theme.typography.fontWeight.medium}>
            This income proof uses zero-knowledge cryptography to verify income thresholds without
            revealing actual payment amounts. The proof has been validated on-chain and can be
            independently verified.
          </Typography>
        </Alert>

        {/* Proof Verification Card */}
        <ProofVerificationCard
          proof={proof}
          contractAddress={contractAddress || undefined}
          showDownloadPDF={true}
          showTechnicalDetails={true}
        />

        {/* Additional Information for Verifiers */}
        <Paper
          elevation={1}
          sx={{
            p: 3,
            borderRadius: 2,
            bgcolor: mode === 'dark' ? theme.colors.background.paper : theme.colors.background.default,
          }}
        >
          <Typography
            variant="h6"
            fontWeight={theme.typography.fontWeight.semibold}
            color={theme.colors.text.primary}
            sx={{ mb: 2 }}
          >
            For Verifiers
          </Typography>
          <Stack spacing={1.5}>
            <Typography variant="body2" color={theme.colors.text.secondary}>
              • This proof is stored on the Midnight blockchain and cannot be tampered with
            </Typography>
            <Typography variant="body2" color={theme.colors.text.secondary}>
              • The cryptographic verification ensures the employee meets the stated threshold
            </Typography>
            <Typography variant="body2" color={theme.colors.text.secondary}>
              • Actual payment amounts remain private through zero-knowledge proofs
            </Typography>
            <Typography variant="body2" color={theme.colors.text.secondary}>
              • Download the PDF report for your records or verification purposes
            </Typography>
          </Stack>
        </Paper>
      </Stack>
    </Container>
  );
};
