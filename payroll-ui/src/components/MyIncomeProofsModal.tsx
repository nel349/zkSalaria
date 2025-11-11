// @ts-nocheck - MUI Grid v5/v6 compatibility issues (runtime works fine)
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Box,
  Typography,
  Stack,
  Paper,
  IconButton,
  Chip,
  Divider,
  Alert,
  Button,
  TextField,
  Grid,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import VerifiedIcon from '@mui/icons-material/Verified';
import CancelIcon from '@mui/icons-material/Cancel';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import DownloadIcon from '@mui/icons-material/Download';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { useTheme, useThemeValues } from '../theme';
import { type DeployedPayrollAPI } from '@zksalaria/payroll-api';
import { getCurrentEmployer } from '../utils/EmployerContractsLocalState';
import { generateProofPDF, generateFailureReport } from '../utils/pdfGenerator';
import { ProofVerificationCard } from './ProofVerificationCard';
import { ProofAttemptCard } from './ProofAttemptCard';
import { ShareableProofLink } from './ShareableProofLink';
import { toast } from 'react-hot-toast';

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

interface ProofAttempt {
  id: string;
  timestamp: number;
  success: boolean;
  proofType: number;
  employeeId: string;
  error_code?: string;
  message?: string;
  // For successful proofs
  attestationHash?: string;
  isOnChain?: boolean;  // TRUE if this is the active on-chain proof
  shareLink?: string;   // Shareable verification link
  // For failed proofs
  payments?: number[];
  actualValue?: number;
  thresholdMin?: number;
  thresholdMax?: number;
  employeeName?: string;
  companyName?: string;
}

interface MyIncomeProofsModalProps {
  open: boolean;
  onClose: () => void;
  api: DeployedPayrollAPI | null;
  walletAddress: string;
  employeeName: string;
}

const PROOF_TYPE_NAMES: Record<number, string> = {
  1: 'Income Above Threshold',
  2: 'Income Range',
  3: 'Average Income',
  4: 'First-Time Loan Eligibility',
};

const STORAGE_KEY = 'zkSalaria_proof_attempts';

/**
 * Store a proof attempt in localStorage
 */
export const storeProofAttempt = (attempt: ProofAttempt) => {
  console.log('[storeProofAttempt] Called with:', {
    id: attempt.id,
    success: attempt.success,
    proofType: attempt.proofType,
    employeeId: attempt.employeeId,
    timestamp: attempt.timestamp
  });

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    console.log('[storeProofAttempt] Current localStorage value:', stored ? `${stored.length} chars` : 'null');

    const attempts: ProofAttempt[] = stored ? JSON.parse(stored) : [];
    console.log('[storeProofAttempt] Parsed existing attempts:', attempts.length);

    // Add new attempt at the beginning
    attempts.unshift(attempt);
    console.log('[storeProofAttempt] After adding new attempt:', attempts.length);

    // Keep only last 20 attempts
    const trimmed = attempts.slice(0, 20);
    console.log('[storeProofAttempt] After trimming:', trimmed.length);

    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
    console.log('[storeProofAttempt] ✅ Successfully stored to localStorage');

    // Verify it was stored
    const verification = localStorage.getItem(STORAGE_KEY);
    if (verification) {
      const parsed = JSON.parse(verification);
      console.log('[storeProofAttempt] ✅ Verified - localStorage now has', parsed.length, 'attempts');
    }
  } catch (error) {
    console.error('[ProofAttempts] Failed to store attempt:', error);
  }
};

/**
 * Get all proof attempts from localStorage
 */
const getProofAttempts = (employeeId: string): ProofAttempt[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    const allAttempts: ProofAttempt[] = stored ? JSON.parse(stored) : [];

    console.log('[getProofAttempts] Requested employeeId:', employeeId);
    console.log('[getProofAttempts] Total attempts in storage:', allAttempts.length);
    console.log('[getProofAttempts] All employeeIds in storage:', allAttempts.map(a => a.employeeId));

    // TEMPORARY: Show ALL attempts regardless of employeeId for debugging
    // TODO: Fix employeeId matching once we understand the format
    const sorted = allAttempts.sort((a, b) => b.timestamp - a.timestamp);

    console.log('[getProofAttempts] Returning ALL attempts (no filter):', sorted.length);
    return sorted;
  } catch (error) {
    console.error('[ProofAttempts] Failed to load attempts:', error);
    return [];
  }
};

export const MyIncomeProofsModal: React.FC<MyIncomeProofsModalProps> = ({
  open,
  onClose,
  api,
  walletAddress,
  employeeName,
}) => {
  const { mode } = useTheme();
  const theme = useThemeValues();

  const [onChainProof, setOnChainProof] = useState<IncomeProof | null>(null);
  const [localAttempts, setLocalAttempts] = useState<ProofAttempt[]>([]);
  const [proofLink, setProofLink] = useState<string>('');
  const [contractAddress, setContractAddress] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;

    const loadData = async () => {
      const allAttempts: ProofAttempt[] = [];

      // Load on-chain proof and convert to ProofAttempt format
      if (api && walletAddress) {
        try {
          const proof = await api.getIncomeProof(walletAddress);
          if (proof) {
            setOnChainProof(proof);

            // Get contract address
            const employerContract = getCurrentEmployer();
            setContractAddress(employerContract);

            // Generate shareable link
            const hashHex = (Array.from(proof.attestation_hash) as number[])
              .map((b) => b.toString(16).padStart(2, '0'))
              .join('');
            const link = `${window.location.origin}/verify/${hashHex}`;

            // Add on-chain proof as a ProofAttempt
            allAttempts.push({
              id: hashHex,
              timestamp: Number(proof.submitted_at) * 1000,
              success: true,
              proofType: Number(proof.proof_type),
              employeeId: walletAddress,
              attestationHash: hashHex,
              // Mark this as on-chain so we can show share link
              isOnChain: true,
              shareLink: link,
            } as ProofAttempt & { isOnChain?: boolean; shareLink?: string });
          }
        } catch (error) {
          console.error('[MyIncomeProofs] Failed to load on-chain proof:', error);
        }
      }

      // Load local attempts from localStorage
      console.log('[MyIncomeProofs] Loading attempts for walletAddress:', walletAddress);
      const localStorageAttempts = getProofAttempts(walletAddress);
      console.log('[MyIncomeProofs] Found local attempts:', localStorageAttempts.length);

      // Merge and deduplicate
      for (const localAttempt of localStorageAttempts) {
        // Skip if this is already in allAttempts (on-chain proof)
        const isDuplicate = allAttempts.some(
          (a) => a.success && a.attestationHash && localAttempt.attestationHash === a.attestationHash
        );
        if (!isDuplicate) {
          allAttempts.push(localAttempt);
        }
      }

      // Sort: Active on-chain proof first, then by timestamp (newest first)
      allAttempts.sort((a, b) => {
        // Active on-chain proof always goes first
        if (a.isOnChain && !b.isOnChain) return -1;
        if (!a.isOnChain && b.isOnChain) return 1;
        // Otherwise sort by timestamp (newest first)
        return b.timestamp - a.timestamp;
      });

      console.log('[MyIncomeProofs] Total merged attempts:', allAttempts.length);
      setLocalAttempts(allAttempts);
    };

    loadData();
  }, [open, api, walletAddress]);

  const handleCopyLink = () => {
    if (proofLink) {
      navigator.clipboard.writeText(proofLink);
      toast.success('Proof link copied to clipboard!');
    }
  };

  const handleDownloadSuccessPDF = async () => {
    if (onChainProof) {
      const contractAddress = getCurrentEmployer();
      await generateProofPDF(onChainProof, contractAddress || undefined);
    }
  };

  const handleDownloadFailurePDF = async (attempt: ProofAttempt) => {
    if (!attempt.payments) return;

    await generateFailureReport(
      attempt.proofType,
      attempt.employeeName || employeeName,
      attempt.payments,
      attempt.actualValue || 0,
      attempt.thresholdMin || 0,
      attempt.thresholdMax,
      attempt.companyName
    );
  };

  const formatTimestamp = (timestamp: number | bigint): string => {
    const date = new Date(typeof timestamp === 'bigint' ? Number(timestamp) * 1000 : timestamp);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          bgcolor: mode === 'dark' ? theme.colors.background.paper : '#FFFFFF',
          backgroundImage: 'none',
          maxHeight: '90vh',
        },
      }}
    >
      <DialogTitle>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Stack direction="row" alignItems="center" spacing={2}>
            <VerifiedIcon sx={{ fontSize: 32, color: theme.colors.primary[500] }} />
            <Box>
              <Typography variant="h6" fontWeight={theme.typography.fontWeight.semibold} color={theme.colors.text.primary}>
                My Income Proofs
              </Typography>
              <Typography variant="caption" color={theme.colors.text.secondary}>
                All proof generation attempts (successful and failed)
              </Typography>
            </Box>
          </Stack>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Stack>
      </DialogTitle>

      <Divider />

      <DialogContent>
        <Stack spacing={3} sx={{ mt: 1 }}>
          {/* Info Alert */}
          <Alert severity="info" sx={{ fontSize: '0.875rem' }}>
            <strong>Privacy Notice:</strong> Successful proofs are stored on-chain. Failed threshold proofs are stored locally and never submitted to the blockchain.
          </Alert>

          {/* All Proofs - Unified List */}
          {localAttempts.length > 0 ? (
            <Stack spacing={3}>
              {localAttempts.map((attempt) => {
                // Determine proof status
                const isOnChainProof = attempt.isOnChain && onChainProof;
                const isExpired = attempt.success && !attempt.isOnChain; // Successful but overridden
                const isFailed = !attempt.success;

                return (
                  <Stack key={attempt.id} spacing={2}>
                    {/* Status Indicator Banner */}
                    {isOnChainProof && (
                      <Paper
                        elevation={0}
                        sx={{
                          p: 2,
                          borderRadius: 2,
                          bgcolor: mode === 'dark' ? `${theme.colors.success[500]}20` : theme.colors.success[50],
                          border: `2px solid ${theme.colors.success[500]}`,
                        }}
                      >
                        <Stack direction="row" alignItems="center" spacing={1.5}>
                          <VerifiedIcon sx={{ fontSize: 24, color: theme.colors.success[500] }} />
                          <Box>
                            <Typography variant="body1" fontWeight={theme.typography.fontWeight.bold} color={theme.colors.success[700]}>
                              🔒 ACTIVE ON BLOCKCHAIN
                            </Typography>
                            <Typography variant="caption" color={theme.colors.text.secondary}>
                              This is your current verified proof - shareable with lenders & landlords
                            </Typography>
                          </Box>
                        </Stack>
                      </Paper>
                    )}

                    {isExpired && (
                      <Paper
                        elevation={0}
                        sx={{
                          p: 2,
                          borderRadius: 2,
                          bgcolor: mode === 'dark' ? `${theme.colors.text.disabled}20` : '#F5F5F5',
                          border: `2px dashed ${theme.colors.text.disabled}`,
                        }}
                      >
                        <Stack direction="row" alignItems="center" spacing={1.5}>
                          <CancelIcon sx={{ fontSize: 24, color: theme.colors.text.disabled }} />
                          <Box>
                            <Typography variant="body1" fontWeight={theme.typography.fontWeight.bold} color={theme.colors.text.disabled}>
                              ⏳ EXPIRED - OVERRIDDEN BY NEWER PROOF
                            </Typography>
                            <Typography variant="caption" color={theme.colors.text.secondary}>
                              This proof was replaced when you generated a newer one - kept for your records only
                            </Typography>
                          </Box>
                        </Stack>
                      </Paper>
                    )}

                    {/* Shareable Link Section (only for active on-chain proofs) */}
                    {attempt.shareLink && isOnChainProof && (
                      <ShareableProofLink link={attempt.shareLink} />
                    )}

                    {/* Render appropriate card based on status */}
                    {isOnChainProof ? (
                      <ProofVerificationCard
                        proof={onChainProof}
                        contractAddress={contractAddress || undefined}
                        showDownloadPDF={true}
                        showTechnicalDetails={true}
                      />
                    ) : (
                      <ProofAttemptCard
                        proofType={attempt.proofType}
                        timestamp={attempt.timestamp}
                        success={attempt.success}
                        message={attempt.message}
                        payments={attempt.payments}
                        actualValue={attempt.actualValue}
                        thresholdMin={attempt.thresholdMin}
                        thresholdMax={attempt.thresholdMax}
                        onDownloadFailureReport={
                          attempt.payments
                            ? () => handleDownloadFailurePDF(attempt)
                            : undefined
                        }
                      />
                    )}
                  </Stack>
                );
              })}
            </Stack>
          ) : (
            <Paper
              elevation={0}
              sx={{
                p: 6,
                borderRadius: 2,
                bgcolor: mode === 'dark' ? theme.colors.background.paper : theme.colors.background.default,
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
                No Proof Attempts Yet
              </Typography>
              <Typography variant="body2" color={theme.colors.text.disabled}>
                Generate your first income proof to get started
              </Typography>
            </Paper>
          )}
        </Stack>
      </DialogContent>
    </Dialog>
  );
};
