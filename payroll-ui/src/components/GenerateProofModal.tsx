import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stack,
  Typography,
  FormControl,
  FormLabel,
  Select,
  MenuItem,
  TextField,
  Checkbox,
  FormControlLabel,
  Box,
  Divider,
  IconButton,
  Alert,
  CircularProgress,
  LinearProgress,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import VerifiedIcon from '@mui/icons-material/Verified';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import EmailIcon from '@mui/icons-material/Email';
import DownloadIcon from '@mui/icons-material/Download';
import ShareIcon from '@mui/icons-material/Share';
import { useTheme, useThemeValues } from '../theme';
import { toast } from 'react-hot-toast';
import { type DeployedPayrollAPI, utils } from '@zksalaria/payroll-api';
import { generateProofPDF, generateFailureReport } from '../utils/pdfGenerator';
import { getCurrentEmployer } from '../utils/EmployerContractsLocalState';
import { storeProofAttempt } from './MyIncomeProofsModal';

interface GenerateProofModalProps {
  open: boolean;
  onClose: () => void;
  employeeId: string;
  employeeName: string;
  companyName?: string;
  api: DeployedPayrollAPI | null;
}

type ProofType = 'income_above' | 'income_range' | 'average_income' | 'first_time_loan';

// Verifier service configuration
const VERIFIER_SERVICE_URL = import.meta.env.VITE_VERIFIER_SERVICE_URL || 'http://localhost:3002';

enum ErrorCode {
  THRESHOLD_NOT_MET = 'THRESHOLD_NOT_MET',
  PROOF_GENERATION_FAILED = 'PROOF_GENERATION_FAILED',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INTERNAL_ERROR = 'INTERNAL_ERROR'
}

interface AttestationResponse {
  success: boolean;
  proof_json?: string;  // The actual EZKL proof
  attestation?: {
    employee_id: string;
    threshold: string;
    txids: string[];
    history_commitment: string;
    timestamp: number;
    attestation_hash: string;
    verifier_pubkey: string;
  };
  duration?: number;
  error?: string;
  error_code?: ErrorCode;  // Specific error code from verifier
  message?: string;
}

/**
 * Generate Proof Modal (Phase 2.7)
 * Allows employees to generate zero-knowledge proofs of income for lenders/verifiers
 */
export const GenerateProofModal: React.FC<GenerateProofModalProps> = ({
  open,
  onClose,
  employeeId,
  employeeName,
  companyName,
  api,
}) => {
  const { mode } = useTheme();
  const theme = useThemeValues();

  // Form state
  const [proofType, setProofType] = useState<ProofType>('income_above');
  const [minThreshold, setMinThreshold] = useState('60000'); // Annual for most, monthly for average_income
  const [maxThreshold, setMaxThreshold] = useState('120000'); // Annual for most, monthly for average_income
  const [includeEmployment, setIncludeEmployment] = useState(true);
  const [includeCompany, setIncludeCompany] = useState(true);
  const [expirationDays, setExpirationDays] = useState('30');
  const [verifierEmail, setVerifierEmail] = useState('');

  // Processing state
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showFailure, setShowFailure] = useState(false);
  const [generatedProofId, setGeneratedProofId] = useState('');
  const [proofLink, setProofLink] = useState('');
  const [generatedProofData, setGeneratedProofData] = useState<any | null>(null);
  const [contractAddr, setContractAddr] = useState<string | null>(null);
  const [failureData, setFailureData] = useState<{
    proofType: number;
    employeeName: string;
    payments: number[];
    actualValue: number;
    thresholdMin: number;
    thresholdMax?: number;
    companyName?: string;
    message: string;
  } | null>(null);

  const proofTypes = [
    {
      value: 'income_above' as ProofType,
      label: 'Income Above Threshold (yearly)',
      description: 'Prove you earn at least $X per year',
      example: 'I earn at least $40,000/year',
    },
    {
      value: 'income_range' as ProofType,
      label: 'Income Range (yearly)',
      description: 'Prove you earn between $X and $Y per year',
      example: 'I earn between $80,000 and $100,000/year',
    },
    {
      value: 'average_income' as ProofType,
      label: 'Average Income (monthly)',
      description: 'Prove your average income over time',
      example: 'My average income is at least $11,000/month',
    },
    {
      value: 'first_time_loan' as ProofType,
      label: 'Loan Eligibility (Stable Income)',
      description: 'Prove 6 months of stable, consistent salary history',
      example: 'I qualify for a loan with my stable income history',
    },
  ];

  const expirationOptions = [
    { value: '7', label: '7 days' },
    { value: '30', label: '30 days' },
    { value: '60', label: '60 days' },
    { value: '90', label: '90 days' },
    { value: '0', label: 'No expiration' },
  ];

  const selectedProofType = proofTypes.find((pt) => pt.value === proofType);

  const getProofStatement = (): string => {
    const employmentText = includeEmployment ? ' and is currently employed' : '';
    const companyText = includeCompany && companyName ? ` at ${companyName}` : '';

    switch (proofType) {
      case 'income_above':
        return `${employeeName} earns at least $${Number(minThreshold).toLocaleString()}/year${employmentText}${companyText}.`;
      case 'income_range':
        return `${employeeName} earns between $${Number(minThreshold).toLocaleString()} and $${Number(maxThreshold).toLocaleString()}/year${employmentText}${companyText}.`;
      case 'average_income':
        return `${employeeName}'s average monthly income is at least $${Number(minThreshold).toLocaleString()}/month${employmentText}${companyText}.`;
      case 'first_time_loan':
        return `${employeeName} has 6 consecutive months of consistent salary${employmentText}${companyText}.`;
      default:
        return '';
    }
  };

  const handleGenerateProof = async () => {
    // Validation
    if (!api) {
      toast.error('API not available. Please connect your wallet.');
      return;
    }

    if (!minThreshold || Number(minThreshold) <= 0) {
      toast.error('Please enter a valid threshold');
      return;
    }

    if (proofType === 'income_range' && (!maxThreshold || Number(maxThreshold) <= Number(minThreshold))) {
      toast.error('Maximum threshold must be greater than minimum');
      return;
    }

    setIsGenerating(true);
    setProgress(0);

    // Progress simulation for UX (runs in background while API calls execute)
    const duration = 15000; // 15 seconds for demo
    const interval = 100;
    const increment = (interval / duration) * 100;

    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        const next = prev + increment;
        if (next >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return next;
      });
    }, interval);

    // Declare variables that need to be accessible in catch block
    let proofData: AttestationResponse | undefined;
    let paymentAmounts: number[] = [];

    try {
      console.log('[GenerateProof] Starting real proof generation...');

      // Map UI proof types to contract types (1-4)
      const proofTypeNum =
        proofType === 'income_above' ? 1n :
        proofType === 'income_range' ? 2n :
        proofType === 'average_income' ? 3n :
        4n; // first_time_loan

      // Fetch employee payment history with decrypted amounts
      console.log('[GenerateProof] Fetching payment history...');
      const paymentHistory = await api.getEmployeePaymentHistoryDecrypted(employeeId);
      console.log(`[GenerateProof] Found ${paymentHistory.length} payments`);

      // Extract payment amounts (need exactly 6 for ZKML)
      if (paymentHistory.length < 6) {
        throw new Error(`Need at least 6 payments for ZK proof. Found: ${paymentHistory.length}`);
      }

      // Get the last 6 payments and extract amounts + txids
      const last6Payments = paymentHistory.slice(-6);
      paymentAmounts = last6Payments.map(p => Number(p.decrypted_amount) / 100); // Convert from atomic units to dollars
      const txids = last6Payments.map(p => Buffer.from(p.payment_id).toString('hex'));

      console.log(`[GenerateProof] Payment amounts (last 6): [$${paymentAmounts[0]}, ..., $${paymentAmounts[5]}]`);
      console.log(`[GenerateProof] Selected proof type: "${proofType}"`);

      // Compute history commitment
      console.log('[GenerateProof] Computing history commitment...');
      const historyCommitment = await api.computeHistoryCommitment(employeeId);
      console.log(`[GenerateProof] History commitment: ${historyCommitment}`);

      // CRITICAL: ALL models now use input_scale:14 and require normalization
      // All payment amounts and thresholds must be divided by 10000
      // Precision: 2^-14 ≈ 0.000061 (~$0.61 resolution after denormalization)
      const NORMALIZATION_FACTOR = 10000;

      let thresholdMinDollars: number;
      let thresholdMaxDollars: number | undefined;
      let normalizedPayments: number[];

      // Normalize ALL payment amounts for EZKL (input_scale: 7)
      normalizedPayments = paymentAmounts.map(p => p / NORMALIZATION_FACTOR);

      // Threshold conversion and normalization
      if (proofType === 'first_time_loan') {
        // Threshold is already a ratio (0-1), no conversion needed
        thresholdMinDollars = Number(minThreshold);
        thresholdMaxDollars = maxThreshold ? Number(maxThreshold) : undefined;
      } else if (proofType === 'income_above' || proofType === 'income_range') {
        // Convert annual threshold to 6-month total, then normalize
        thresholdMinDollars = (Number(minThreshold) / 2) / NORMALIZATION_FACTOR;
        thresholdMaxDollars = maxThreshold ? (Number(maxThreshold) / 2) / NORMALIZATION_FACTOR : undefined;
      } else {
        // average_income: normalize threshold directly
        thresholdMinDollars = Number(minThreshold) / NORMALIZATION_FACTOR;
        thresholdMaxDollars = maxThreshold ? Number(maxThreshold) / NORMALIZATION_FACTOR : undefined;
      }

      console.log(`[GenerateProof] Normalized for ${proofType}: payments=[${normalizedPayments[0].toFixed(4)}...${normalizedPayments[5].toFixed(4)}], threshold=${thresholdMinDollars.toFixed(4)}`);

      // Call verifier service to generate ZKML proof + attestation
      console.log('[GenerateProof] Generating ZKML proof (this may take 10-30 seconds)...');
      const proofResponse = await fetch(`${VERIFIER_SERVICE_URL}/api/zkml/generate-proof`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          proof_type: Number(proofTypeNum),
          payments: normalizedPayments,
          threshold_min: thresholdMinDollars,
          threshold_max: thresholdMaxDollars,
          employee_id: employeeId,
          txids: txids,
          history_commitment: historyCommitment
        })
      });

      if (!proofResponse.ok) {
        throw new Error(`Verifier service error: ${proofResponse.statusText}`);
      }

      proofData = await proofResponse.json();
      console.log('[GenerateProof] Verifier response:', {
        success: proofData?.success,
        error_code: proofData?.error_code,
        message: proofData?.message
      });

      // Check if it's a threshold failure (legitimate result, not an error)
      if (!proofData?.success) {
        if (proofData?.error_code === ErrorCode.THRESHOLD_NOT_MET) {
          // This is a legitimate threshold failure, throw to catch block with proofData available
          console.log('[GenerateProof] Threshold failure detected, will generate PDF report');
          throw new Error(proofData?.message || 'Income does not meet the specified threshold');
        } else {
          // Technical error
          console.log('[GenerateProof] Technical error detected:', proofData?.error_code);
          throw new Error(proofData?.message || 'Failed to generate proof');
        }
      }

      if (!proofData.attestation) {
        throw new Error('No attestation returned from verifier');
      }

      const { attestation_hash, verifier_pubkey, timestamp, threshold: thresholdStr } = proofData.attestation;
      const attestationHash = '0x' + attestation_hash;
      const verifierPubkey = '0x' + verifier_pubkey;

      console.log('[GenerateProof] ✅ ZKML Proof generated successfully!');
      console.log(`  - Attestation Hash: ${attestationHash.substring(0, 18)}...`);
      console.log(`  - Verifier Pubkey: ${verifierPubkey.substring(0, 18)}...`);
      console.log(`  - Duration: ${proofData.duration}ms`);

      // NOTE: Verifier registration is done by company admin, not employees
      // Only company can register trusted verifiers (security requirement)

      // Update contract timestamp to current time (prevents "timestamp in future" rejection)
      console.log('[GenerateProof] Syncing contract timestamp...');
      const currentTimestamp = Math.floor(Date.now() / 1000);
      await api.updateTimestamp(currentTimestamp);
      console.log(`[GenerateProof] ✓ Contract timestamp updated to ${currentTimestamp}`);

      console.log('[GenerateProof] Submitting income proof to contract...');
      const expiresInSeconds = expirationDays === '0' ? 0 : Number(expirationDays) * 24 * 60 * 60;

      // Contract expects thresholds as dollar strings (will be parsed to atomic units by API)
      const submitted = await api.submitIncomeProof(
        employeeId,
        proofTypeNum,
        minThreshold, // Original threshold in dollars
        maxThreshold || '0',
        txids,
        historyCommitment,
        attestationHash,
        BigInt(timestamp),
        expiresInSeconds
      );

      if (!submitted) {
        throw new Error('Proof submission failed - contract returned false');
      }

      console.log('[GenerateProof] Proof submitted successfully!');
      clearInterval(progressInterval);
      setProgress(100);

      // Generate proof ID and shareable link using full attestation hash
      const hashWithout0x = attestationHash.substring(2); // Remove 0x prefix
      const proofId = `PROOF-${hashWithout0x.substring(0, 8).toUpperCase()}`;
      const link = `${window.location.origin}/verify/${hashWithout0x}`;

      // Calculate actual total for display
      const actualTotal = paymentAmounts.reduce((sum, p) => sum + p, 0);

      // Store successful proof attempt in localStorage with full details
      storeProofAttempt({
        id: attestationHash,
        timestamp: Date.now(),
        success: true,
        proofType: Number(proofTypeNum),
        employeeId: employeeId,
        attestationHash: attestationHash,
        payments: paymentAmounts,
        actualValue: actualTotal,
        thresholdMin: Number(minThreshold),
        thresholdMax: maxThreshold ? Number(maxThreshold) : undefined,
      });

      // Query the submitted proof from contract to get full data for PDF
      const submittedProof = await api.getIncomeProof(employeeId);

      // Get current employer contract address
      const employerContract = getCurrentEmployer();

      setGeneratedProofId(proofId);
      setProofLink(link);
      setGeneratedProofData(submittedProof);
      setContractAddr(employerContract);
      setShowSuccess(true);

      toast.success('Proof generated and submitted successfully!');
    } catch (error) {
      console.error('[GenerateProof] Failed:', error);
      clearInterval(progressInterval);
      setIsGenerating(false);
      setProgress(0);

      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      // Distinguish between threshold failures and technical failures using error_code
      // Threshold failure: The proof was generated successfully but income doesn't meet requirements
      // Technical failure: EZKL error, network error, validation error, etc.
      console.log('[GenerateProof] Error handler - proofData:', proofData);
      console.log('[GenerateProof] Error handler - paymentAmounts.length:', paymentAmounts.length);
      const isThresholdFailure = proofData?.error_code === ErrorCode.THRESHOLD_NOT_MET;
      console.log('[GenerateProof] Error handler - isThresholdFailure:', isThresholdFailure, 'error_code:', proofData?.error_code);

      if (isThresholdFailure && paymentAmounts.length === 6) {
        // Category A: Legitimate threshold failure → Show failure modal with PDF option
        console.log('[GenerateProof] ✅ Confirmed threshold failure - preparing failure display...');

        // Calculate actual value based on proof type
        let actualValue: number;
        const total = paymentAmounts.reduce((sum, p) => sum + p, 0);
        const average = total / 6;

        switch (proofType) {
          case 'average_income':
          case 'first_time_loan':
            actualValue = average;
            break;
          case 'income_above':
          case 'income_range':
          default:
            actualValue = total;
            break;
        }

        // Map UI proof type to contract type number
        const proofTypeNum =
          proofType === 'income_above' ? 1 :
          proofType === 'income_range' ? 2 :
          proofType === 'average_income' ? 3 :
          4; // first_time_loan

        // Store failed proof attempt in localStorage
        console.log('[GenerateProof] About to store failed proof attempt...');
        console.log('[GenerateProof] Data to store:', {
          proofType: proofTypeNum,
          employeeId,
          paymentsLength: paymentAmounts.length,
          actualValue,
          thresholdMin: Number(minThreshold)
        });

        storeProofAttempt({
          id: `FAILED_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          timestamp: Date.now(),
          success: false,
          proofType: proofTypeNum,
          employeeId: employeeId,
          error_code: 'THRESHOLD_NOT_MET',
          message: proofData?.message || 'Income does not meet the specified threshold',
          payments: paymentAmounts,
          actualValue,
          thresholdMin: Number(minThreshold),
          thresholdMax: maxThreshold ? Number(maxThreshold) : undefined,
          employeeName,
          companyName: companyName || undefined,
        });

        console.log('[GenerateProof] storeProofAttempt() called successfully');

        // Set failure state to display failure modal
        clearInterval(progressInterval);
        setProgress(0);
        setIsGenerating(false);
        setFailureData({
          proofType: proofTypeNum,
          employeeName,
          payments: paymentAmounts,
          actualValue,
          thresholdMin: Number(minThreshold),
          thresholdMax: maxThreshold ? Number(maxThreshold) : undefined,
          companyName: companyName || undefined,
          message: proofData?.message || 'Income does not meet the specified threshold'
        });
        setShowFailure(true);
      } else {
        // Category B: Technical failure → Show error reason with troubleshooting guidance
        console.error('[GenerateProof] Technical error:', errorMessage);

        // Provide specific guidance based on error type
        let userFriendlyMessage = 'Failed to generate proof: ';
        let troubleshooting = '';

        if (errorMessage.includes('Exactly 6 monthly payments required')) {
          userFriendlyMessage += 'Not enough payment history.';
          troubleshooting = ' You need at least 6 months of payment records to generate a proof.';
        } else if (errorMessage.includes('Verifier service error') || errorMessage.includes('fetch')) {
          userFriendlyMessage += 'Unable to reach verification service.';
          troubleshooting = ' Please check your internet connection and try again in a few moments.';
        } else if (errorMessage.includes('decomposition error') || errorMessage.includes('overflow')) {
          userFriendlyMessage += 'Proof generation encountered a mathematical overflow.';
          troubleshooting = ' This is a system issue. Please contact support.';
        } else if (errorMessage.includes('timeout') || errorMessage.includes('timed out')) {
          userFriendlyMessage += 'Proof generation timed out.';
          troubleshooting = ' The verification service may be busy. Please try again.';
        } else {
          userFriendlyMessage += errorMessage;
          troubleshooting = ' If this error persists, please contact support.';
        }

        toast.error(userFriendlyMessage + troubleshooting, { duration: 8000 });
      }
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(proofLink);
    toast.success('Proof link copied to clipboard');
  };

  const handleEmailProof = () => {
    const subject = encodeURIComponent('zkSalaria Income Proof');
    const body = encodeURIComponent(`Please verify my income proof:\n\n${proofLink}\n\nProof Statement: ${getProofStatement()}`);
    window.open(`mailto:${verifierEmail}?subject=${subject}&body=${body}`);
  };

  const handleDownloadPDF = async () => {
    if (!generatedProofData) {
      toast.error('Proof data not available');
      return;
    }

    try {
      await generateProofPDF(generatedProofData, contractAddr || undefined);
      toast.success('PDF report downloaded successfully');
    } catch (error) {
      console.error('PDF generation failed:', error);
      toast.error('Failed to generate PDF report');
    }
  };

  const handleReset = () => {
    setIsGenerating(false);
    setProgress(0);
    setShowSuccess(false);
    setShowFailure(false);
    setGeneratedProofId('');
    setProofLink('');
    setGeneratedProofData(null);
    setContractAddr(null);
    setFailureData(null);
    setProofType('income_above');
    setMinThreshold('4000');
    setMaxThreshold('10000');
    setIncludeEmployment(true);
    setIncludeCompany(true);
    setExpirationDays('30');
    setVerifierEmail('');
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  // Success Modal
  if (showSuccess) {
    return (
      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: mode === 'dark' ? theme.colors.background.paper : '#FFFFFF',
            backgroundImage: 'none',
          },
        }}
      >
        <DialogTitle>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Stack direction="row" alignItems="center" spacing={2}>
              <CheckCircleIcon sx={{ fontSize: 32, color: theme.colors.success[500] }} />
              <Box>
                <Typography variant="h6" fontWeight={theme.typography.fontWeight.semibold} color={theme.colors.text.primary}>
                  Proof Generated ✅
                </Typography>
                <Typography variant="caption" color={theme.colors.text.secondary}>
                  Your zero-knowledge proof has been created
                </Typography>
              </Box>
            </Stack>
            <IconButton onClick={handleClose} size="small">
              <CloseIcon />
            </IconButton>
          </Stack>
        </DialogTitle>

        <Divider />

        <DialogContent>
          <Stack spacing={3} sx={{ mt: 2 }}>
            {/* Proof Details */}
            <Box>
              <Typography variant="body2" color={theme.colors.text.secondary} sx={{ mb: 1 }}>
                Proof ID
              </Typography>
              <Typography variant="h6" fontWeight={theme.typography.fontWeight.semibold} color={theme.colors.text.primary}>
                {generatedProofId}
              </Typography>
            </Box>

            {expirationDays !== '0' && (
              <Box>
                <Typography variant="body2" color={theme.colors.text.secondary} sx={{ mb: 1 }}>
                  Valid Until
                </Typography>
                <Typography variant="body1" color={theme.colors.text.primary}>
                  {new Date(Date.now() + Number(expirationDays) * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </Typography>
              </Box>
            )}

            <Divider />

            {/* Share Proof */}
            <Box>
              <Typography variant="body2" fontWeight={theme.typography.fontWeight.semibold} color={theme.colors.text.primary} sx={{ mb: 2 }}>
                Share Proof
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
                }}
                sx={{ mb: 2 }}
              />

              <Stack direction="row" spacing={2}>
                <Button
                  variant="outlined"
                  startIcon={<EmailIcon />}
                  onClick={handleEmailProof}
                  disabled={!verifierEmail}
                  fullWidth
                >
                  Email
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<DownloadIcon />}
                  onClick={handleDownloadPDF}
                  fullWidth
                >
                  Download PDF
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<ShareIcon />}
                  onClick={handleCopyLink}
                  fullWidth
                >
                  Copy Link
                </Button>
              </Stack>
            </Box>

            {/* Proof Statement */}
            <Alert severity="info">
              <Typography variant="caption">
                <strong>Proof Statement:</strong> {getProofStatement()}
              </Typography>
            </Alert>
          </Stack>
        </DialogContent>

        <Divider />

        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleReset} variant="outlined">
            Generate Another
          </Button>
          <Button onClick={handleClose} variant="contained">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    );
  }

  // Failure Modal (RED themed)
  if (showFailure && failureData) {
    const handleDownloadFailurePDF = async () => {
      await generateFailureReport(
        failureData.proofType,
        failureData.employeeName,
        failureData.payments,
        failureData.actualValue,
        failureData.thresholdMin,
        failureData.thresholdMax,
        failureData.companyName
      );
      toast.success('Failure report downloaded');
    };

    const proofTypeLabels: Record<number, string> = {
      1: 'Income Above Threshold',
      2: 'Income Range',
      3: 'Average Income',
      4: 'First-Time Loan Eligibility'
    };

    return (
      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: mode === 'dark' ? theme.colors.background.paper : '#FFFFFF',
            backgroundImage: 'none',
          },
        }}
      >
        <DialogTitle>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Stack direction="row" alignItems="center" spacing={2}>
              <CancelIcon sx={{ fontSize: 32, color: theme.colors.error[500] }} />
              <Box>
                <Typography variant="h6" fontWeight={theme.typography.fontWeight.semibold} color={theme.colors.error[500]}>
                  Threshold Not Met ❌
                </Typography>
                <Typography variant="caption" color={theme.colors.text.secondary}>
                  Income does not meet the specified requirement
                </Typography>
              </Box>
            </Stack>
            <IconButton onClick={handleClose} size="small">
              <CloseIcon />
            </IconButton>
          </Stack>
        </DialogTitle>

        <Divider />

        <DialogContent>
          <Stack spacing={3} sx={{ mt: 2 }}>
            {/* Failure Details */}
            <Box>
              <Typography variant="body2" color={theme.colors.text.secondary} sx={{ mb: 1 }}>
                Proof Type
              </Typography>
              <Typography variant="h6" fontWeight={theme.typography.fontWeight.semibold} color={theme.colors.text.primary}>
                {proofTypeLabels[failureData.proofType]}
              </Typography>
            </Box>

            <Box>
              <Typography variant="body2" color={theme.colors.text.secondary} sx={{ mb: 1 }}>
                Verification Result
              </Typography>
              <Typography variant="body1" fontWeight={theme.typography.fontWeight.semibold} color={theme.colors.error[500]}>
                Requirements Not Met
              </Typography>
              <Typography variant="caption" color={theme.colors.text.secondary} sx={{ mt: 0.5 }}>
                (Specific amounts not disclosed - privacy preserved)
              </Typography>
            </Box>

            <Divider />

            {/* Failure Message */}
            <Alert severity="error">
              <Typography variant="caption">
                {failureData.message}
              </Typography>
            </Alert>

            {/* Download Failure Report */}
            <Box>
              <Typography variant="body2" fontWeight={theme.typography.fontWeight.semibold} color={theme.colors.text.primary} sx={{ mb: 2 }}>
                Download Detailed Report
              </Typography>

              <Button
                variant="outlined"
                color="error"
                startIcon={<DownloadIcon />}
                onClick={handleDownloadFailurePDF}
                fullWidth
              >
                Download Failure Report PDF
              </Button>
            </Box>
          </Stack>
        </DialogContent>

        <Divider />

        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={handleClose} variant="contained" color="primary" fullWidth>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    );
  }

  // Processing Modal
  if (isGenerating) {
    return (
      <Dialog
        open={open}
        onClose={() => {}} // Prevent closing during generation
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: mode === 'dark' ? theme.colors.background.paper : '#FFFFFF',
            backgroundImage: 'none',
          },
        }}
      >
        <DialogContent>
          <Stack spacing={3} alignItems="center" sx={{ py: 4 }}>
            <CircularProgress size={60} sx={{ color: theme.colors.primary[500] }} />

            <Box textAlign="center">
              <Typography variant="h6" fontWeight={theme.typography.fontWeight.semibold} color={theme.colors.text.primary} sx={{ mb: 1 }}>
                Generating ZKML Proof...
              </Typography>
              <Typography variant="body2" color={theme.colors.text.secondary}>
                Creating zero-knowledge proof of your income. This may take 15-45 seconds.
              </Typography>
              <Typography variant="caption" color={theme.colors.text.secondary} sx={{ display: 'block', mt: 1 }}>
                Please don't close this window.
              </Typography>
            </Box>

            <Box sx={{ width: '100%' }}>
              <LinearProgress variant="determinate" value={progress} sx={{ height: 8, borderRadius: 4 }} />
              <Typography variant="caption" color={theme.colors.text.secondary} sx={{ mt: 1, display: 'block', textAlign: 'center' }}>
                {Math.round(progress)}% complete
              </Typography>
            </Box>

            <Alert severity="info" sx={{ width: '100%' }}>
              <Typography variant="caption">
                We're using zero-knowledge machine learning (ZKML) to generate a cryptographic proof of your income without revealing your exact salary.
              </Typography>
            </Alert>
          </Stack>
        </DialogContent>
      </Dialog>
    );
  }

  // Main Form
  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          bgcolor: mode === 'dark' ? theme.colors.background.paper : '#FFFFFF',
          backgroundImage: 'none',
        },
      }}
    >
      <DialogTitle>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Stack direction="row" alignItems="center" spacing={2}>
            <VerifiedIcon sx={{ fontSize: 28, color: theme.colors.primary[500] }} />
            <Box>
              <Typography variant="h6" fontWeight={theme.typography.fontWeight.semibold} color={theme.colors.text.primary}>
                Generate Income Proof (ZK)
              </Typography>
              <Typography variant="caption" color={theme.colors.text.secondary}>
                Create a zero-knowledge proof without revealing exact amounts
              </Typography>
            </Box>
          </Stack>
          <IconButton onClick={handleClose} size="small">
            <CloseIcon />
          </IconButton>
        </Stack>
      </DialogTitle>

      <Divider />

      <DialogContent>
        <Stack spacing={3} sx={{ mt: 2 }}>
          {/* Proof Type Selection */}
          <FormControl fullWidth>
            <FormLabel>
              <Typography variant="body2" fontWeight={theme.typography.fontWeight.semibold} color={theme.colors.text.primary}>
                Proof Type *
              </Typography>
            </FormLabel>
            <Select
              value={proofType}
              onChange={(e) => {
                const newType = e.target.value as ProofType;
                setProofType(newType);
                // Update default thresholds based on proof type
                if (newType === 'average_income') {
                  setMinThreshold('5000'); // Monthly
                  setMaxThreshold('10000'); // Monthly
                } else if (newType === 'first_time_loan') {
                  setMinThreshold('0.3'); // Fixed: 30% variation allowed
                  setMaxThreshold('');
                } else {
                  setMinThreshold('60000'); // Annual
                  setMaxThreshold('120000'); // Annual
                }
              }}
              sx={{ mt: 1 }}
            >
              {proofTypes.map((pt) => (
                <MenuItem key={pt.value} value={pt.value}>
                  <Box>
                    <Typography variant="body2" fontWeight={theme.typography.fontWeight.medium}>
                      {pt.label}
                    </Typography>
                    <Typography variant="caption" color={theme.colors.text.secondary}>
                      {pt.description}
                    </Typography>
                  </Box>
                </MenuItem>
              ))}
            </Select>
            <Typography variant="caption" color={theme.colors.text.secondary} sx={{ mt: 0.5 }}>
              Example: {selectedProofType?.example}
            </Typography>
          </FormControl>

          <Divider />

          {/* Threshold Inputs */}
          <Box>
            <Typography variant="body2" fontWeight={theme.typography.fontWeight.semibold} color={theme.colors.text.primary} sx={{ mb: 2 }}>
              Proof Parameters
            </Typography>

            <Stack spacing={2}>
              {proofType === 'first_time_loan' ? (
                <Box sx={{ p: 2, bgcolor: theme.colors.background.surface, borderRadius: 1 }}>
                  <Typography variant="body2" color={theme.colors.text.primary}>
                    This proof demonstrates you have 6 consecutive months of consistent salary payments, which qualifies you for first-time loan eligibility.
                  </Typography>
                  <Typography variant="caption" color={theme.colors.text.secondary} sx={{ mt: 1, display: 'block' }}>
                    No additional parameters needed - we'll verify your salary has been stable over the past 6 months.
                  </Typography>
                </Box>
              ) : (
                <>
                  <TextField
                    fullWidth
                    label={
                      proofType === 'average_income'
                        ? 'Monthly Income Threshold ($/month)'
                        : proofType === 'income_range'
                        ? 'Minimum Annual Income ($/year)'
                        : 'Annual Income Threshold ($/year)'
                    }
                    type="number"
                    value={minThreshold}
                    onChange={(e) => setMinThreshold(e.target.value)}
                    helperText={
                      proofType === 'average_income'
                        ? 'Prove your average monthly income is at least this amount'
                        : `Prove you earn ${proofType === 'income_range' ? 'at least' : 'more than'} this amount per year`
                    }
                    InputProps={{
                      startAdornment: <Typography sx={{ mr: 1 }}>$</Typography>,
                    }}
                    inputProps={{ min: 0 }}
                  />

                  {proofType === 'income_range' && (
                    <TextField
                      fullWidth
                      label="Maximum Annual Income ($/year)"
                      type="number"
                      value={maxThreshold}
                      onChange={(e) => setMaxThreshold(e.target.value)}
                      helperText="Prove you earn less than this amount per year"
                      InputProps={{
                        startAdornment: <Typography sx={{ mr: 1 }}>$</Typography>,
                      }}
                      inputProps={{ min: Number(minThreshold) + 1 }}
                    />
                  )}
                </>
              )}
            </Stack>
          </Box>

          <Divider />

          {/* Additional Options */}
          <Box>
            <Typography variant="body2" fontWeight={theme.typography.fontWeight.semibold} color={theme.colors.text.primary} sx={{ mb: 2 }}>
              Additional Information (Optional)
            </Typography>

            <Stack spacing={1}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={includeEmployment}
                    onChange={(e) => setIncludeEmployment(e.target.checked)}
                    sx={{
                      color: '#fff',
                      '& .MuiSvgIcon-root': { fontSize: 20, color: 'rgba(255, 255, 255, 0.7)' },
                      '&.Mui-checked': { color: theme.colors.primary[500], '& .MuiSvgIcon-root': { color: theme.colors.primary[500] } },
                    }}
                  />
                }
                label={<Typography variant="body2">Include employment status (currently employed)</Typography>}
              />

              {companyName && (
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={includeCompany}
                      onChange={(e) => setIncludeCompany(e.target.checked)}
                      sx={{
                        color: '#fff',
                        '& .MuiSvgIcon-root': { fontSize: 20, color: 'rgba(255, 255, 255, 0.7)' },
                        '&.Mui-checked': { color: theme.colors.primary[500], '& .MuiSvgIcon-root': { color: theme.colors.primary[500] } },
                      }}
                    />
                  }
                  label={<Typography variant="body2">Include company name ({companyName})</Typography>}
                />
              )}
            </Stack>
          </Box>

          <Divider />

          {/* Expiration */}
          <FormControl fullWidth>
            <FormLabel>
              <Typography variant="body2" fontWeight={theme.typography.fontWeight.semibold} color={theme.colors.text.primary}>
                Proof Validity
              </Typography>
            </FormLabel>
            <Select
              value={expirationDays}
              onChange={(e) => setExpirationDays(e.target.value)}
              sx={{ mt: 1 }}
            >
              {expirationOptions.map((opt) => (
                <MenuItem key={opt.value} value={opt.value}>
                  {opt.label}
                </MenuItem>
              ))}
            </Select>
            <Typography variant="caption" color={theme.colors.text.secondary} sx={{ mt: 0.5 }}>
              How long should this proof remain valid?
            </Typography>
          </FormControl>

          {/* Verifier (Optional) */}
          <TextField
            fullWidth
            label="Verifier Email or Wallet (Optional)"
            value={verifierEmail}
            onChange={(e) => setVerifierEmail(e.target.value)}
            helperText="Who can verify this proof? Leave empty for anyone to verify."
            placeholder="verifier@example.com or 0x..."
          />

          <Divider />

          {/* Proof Preview */}
          <Box
            sx={{
              p: 3,
              borderRadius: 2,
              bgcolor: mode === 'dark' ? theme.colors.background.surface : theme.colors.primary[50],
              border: `1px solid ${theme.colors.primary[500]}`,
            }}
          >
            <Typography variant="caption" color={theme.colors.text.secondary} sx={{ mb: 1, display: 'block' }}>
              Proof Preview
            </Typography>
            <Typography variant="body2" color={theme.colors.text.primary} fontStyle="italic">
              "{getProofStatement()}"
            </Typography>
          </Box>

          {/* Info Alert */}
          <Alert severity="info">
            <Typography variant="caption">
              <strong>Privacy Guarantee:</strong> This proof uses zero-knowledge cryptography to verify your statement without revealing your exact salary or transaction history.
            </Typography>
          </Alert>
        </Stack>
      </DialogContent>

      <Divider />

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={handleClose} disabled={isGenerating}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleGenerateProof}
          disabled={isGenerating}
          startIcon={<VerifiedIcon />}
        >
          Generate Proof
        </Button>
      </DialogActions>
    </Dialog>
  );
};
