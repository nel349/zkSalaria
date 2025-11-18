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
  TextField,
  MenuItem,
  Chip,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import VerifiedIcon from '@mui/icons-material/Verified';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
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

  // Verification requirements state
  const [requiredThreshold, setRequiredThreshold] = useState<string>('');
  const [verifying, setVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

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

  const handleVerifyRequirements = async () => {
    if (!requiredThreshold || !proof) {
      return;
    }

    setVerifying(true);
    setVerificationResult(null);

    try {
      const proofTypeNum = Number(proof.proof_type);
      const requiredThresholdNum = parseFloat(requiredThreshold);

      // Convert threshold based on proof type (same as contract logic):
      // - Types 1-4: Use 6-month data, so divide annual by 2
      // - Type 5 (Tax Bracket): Uses annual data, no conversion
      const contractThreshold = proofTypeNum === 5
        ? BigInt(Math.floor(requiredThresholdNum))
        : BigInt(Math.floor(requiredThresholdNum / 2));

      console.log('[VerifyRequirements] Client-side validation:', {
        proofType: proofTypeNum,
        requiredThreshold: contractThreshold.toString(),
        proofMin: proof.threshold_min.toString(),
        proofMax: proof.threshold_max.toString(),
        expiresAt: Number(proof.expires_at),
        now: Math.floor(Date.now() / 1000)
      });

      // Client-side validation (matches contract verify_income_proof circuit logic)
      let verified = true;
      let reason = '';

      // Step 1: Verify proof hasn't expired
      const now = BigInt(Math.floor(Date.now() / 1000));
      if (proof.expires_at !== 0n && proof.expires_at <= now) {
        verified = false;
        reason = 'Proof has expired';
      }

      // Step 2: Verify threshold based on proof type
      if (verified) {
        if (proofTypeNum === 1) {
          // INCOME_ABOVE_THRESHOLD: threshold_min >= required
          if (proof.threshold_min < contractThreshold) {
            verified = false;
            reason = `Minimum income ($${Number(proof.threshold_min).toLocaleString()}) is below required threshold ($${requiredThresholdNum.toLocaleString()})`;
          }
        } else if (proofTypeNum === 2) {
          // INCOME_RANGE: required is within [min, max]
          if (contractThreshold < proof.threshold_min || contractThreshold > proof.threshold_max) {
            verified = false;
            reason = `Required threshold ($${requiredThresholdNum.toLocaleString()}) is outside proven range ($${Number(proof.threshold_min).toLocaleString()} - $${Number(proof.threshold_max).toLocaleString()})`;
          }
        } else if (proofTypeNum === 3 || proofTypeNum === 4) {
          // AVERAGE_INCOME / CREDIT_SCORE: threshold_min >= required
          if (proof.threshold_min < contractThreshold) {
            verified = false;
            reason = `Proven value ($${Number(proof.threshold_min).toLocaleString()}) is below required threshold ($${requiredThresholdNum.toLocaleString()})`;
          }
        } else if (proofTypeNum === 5) {
          // TAX_BRACKET: threshold_max <= required (income must be at or below bracket max)
          if (proof.threshold_max > contractThreshold) {
            verified = false;
            reason = `Tax bracket maximum ($${Number(proof.threshold_max).toLocaleString()}) exceeds required threshold ($${requiredThresholdNum.toLocaleString()})`;
          }
        }
      }

      if (verified) {
        setVerificationResult({
          success: true,
          message: `✓ The employee's proof meets your requirement of $${requiredThresholdNum.toLocaleString()} (annual). The proof is valid and not expired.`
        });
      } else {
        setVerificationResult({
          success: false,
          message: `✗ Verification failed: ${reason}`
        });
      }
    } catch (err) {
      console.error('[VerifyRequirements] Error:', err);
      setVerificationResult({
        success: false,
        message: `Verification failed: ${err instanceof Error ? err.message : 'Unknown error'}`
      });
    } finally {
      setVerifying(false);
    }
  };

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
            <Typography>Connect Wallet</Typography>
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

        {/* Verification Requirements Section */}
        <Paper
          elevation={2}
          sx={{
            p: 3,
            borderRadius: 3,
            bgcolor: mode === 'dark' ? theme.colors.background.paper : '#FFFFFF',
            border: `2px solid ${theme.colors.primary[500]}`,
          }}
        >
          <Typography
            variant="h6"
            fontWeight={theme.typography.fontWeight.bold}
            color={theme.colors.text.primary}
            sx={{ mb: 1 }}
          >
            Verify Against Your Requirements
          </Typography>
          <Typography
            variant="body2"
            color={theme.colors.text.secondary}
            sx={{ mb: 3 }}
          >
            Enter your specific requirements to verify if this proof meets them. All thresholds are annual (per year).
          </Typography>

          <Stack spacing={2.5}>
            {/* Threshold Input */}
            <TextField
              fullWidth
              label={
                proof && Number(proof.proof_type) === 5
                  ? "Required Maximum Annual Income"
                  : "Required Annual Income Threshold"
              }
              value={requiredThreshold}
              onChange={(e) => setRequiredThreshold(e.target.value)}
              placeholder={
                proof && Number(proof.proof_type) === 5
                  ? "e.g., 50000 (program requires income ≤ $50k)"
                  : "e.g., 30000 for $30k per year"
              }
              helperText={
                proof && Number(proof.proof_type) === 5
                  ? "For Tax Bracket proofs: Enter the maximum income allowed for your program (in whole dollars)"
                  : "Enter your minimum annual income requirement (yearly total in whole dollars)"
              }
              type="number"
            />

            {/* Verify Button */}
            <Button
              variant="contained"
              size="large"
              fullWidth
              onClick={handleVerifyRequirements}
              disabled={!requiredThreshold || verifying}
              sx={{
                bgcolor: theme.colors.primary[500],
                '&:hover': { bgcolor: theme.colors.primary[700] },
                '&:disabled': {
                  bgcolor: theme.colors.text.disabled,
                },
                py: 1.5,
                fontSize: '1rem',
                fontWeight: theme.typography.fontWeight.bold,
              }}
            >
              {verifying ? (
                <>
                  <CircularProgress size={20} sx={{ mr: 1, color: 'white' }} />
                  Verifying...
                </>
              ) : (
                'Verify Against Requirements'
              )}
            </Button>

            {/* Verification Result */}
            {verificationResult && (
              <Paper
                elevation={3}
                sx={{
                  p: 3,
                  borderRadius: 2,
                  bgcolor: verificationResult.success
                    ? (mode === 'dark' ? `${theme.colors.success[500]}15` : theme.colors.success[50])
                    : (mode === 'dark' ? `${theme.colors.error[500]}15` : theme.colors.error[50]),
                  border: `2px solid ${verificationResult.success ? theme.colors.success[500] : theme.colors.error[500]}`,
                }}
              >
                <Stack spacing={2}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    {verificationResult.success ? (
                      <CheckCircleIcon sx={{ fontSize: 40, color: theme.colors.success[500] }} />
                    ) : (
                      <CancelIcon sx={{ fontSize: 40, color: theme.colors.error[500] }} />
                    )}
                    <Box sx={{ flex: 1 }}>
                      <Typography
                        variant="h5"
                        fontWeight={theme.typography.fontWeight.bold}
                        color={verificationResult.success ? theme.colors.success[700] : theme.colors.error[700]}
                        sx={{ mb: 0.5 }}
                      >
                        {verificationResult.success ? 'APPROVED' : 'REJECTED'}
                      </Typography>
                      <Chip
                        label={verificationResult.success ? '✓ Meets Requirements' : '✗ Does Not Meet Requirements'}
                        color={verificationResult.success ? 'success' : 'error'}
                        size="small"
                      />
                    </Box>
                  </Box>
                  <Typography variant="body1" color={theme.colors.text.primary}>
                    {verificationResult.message}
                  </Typography>
                </Stack>
              </Paper>
            )}
          </Stack>
        </Paper>

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
              • Use the verification tool above to check if the proof meets your specific requirements
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
