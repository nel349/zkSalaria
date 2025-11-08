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
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import EmailIcon from '@mui/icons-material/Email';
import DownloadIcon from '@mui/icons-material/Download';
import ShareIcon from '@mui/icons-material/Share';
import { useTheme, useThemeValues } from '../theme';
import { toast } from 'react-hot-toast';

interface GenerateProofModalProps {
  open: boolean;
  onClose: () => void;
  employeeId: string;
  employeeName: string;
  companyName?: string;
}

type ProofType = 'income_above' | 'income_range' | 'average_income' | 'credit_score';

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
}) => {
  const { mode } = useTheme();
  const theme = useThemeValues();

  // Form state
  const [proofType, setProofType] = useState<ProofType>('income_above');
  const [minThreshold, setMinThreshold] = useState('4000');
  const [maxThreshold, setMaxThreshold] = useState('10000');
  const [includeEmployment, setIncludeEmployment] = useState(true);
  const [includeCompany, setIncludeCompany] = useState(true);
  const [expirationDays, setExpirationDays] = useState('30');
  const [verifierEmail, setVerifierEmail] = useState('');

  // Processing state
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);
  const [generatedProofId, setGeneratedProofId] = useState('');
  const [proofLink, setProofLink] = useState('');

  const proofTypes = [
    {
      value: 'income_above' as ProofType,
      label: 'Income Above Threshold',
      description: 'Prove you earn at least $X per month',
      example: 'I earn at least $4,000/month',
    },
    {
      value: 'income_range' as ProofType,
      label: 'Income Range',
      description: 'Prove you earn between $X and $Y per month',
      example: 'I earn between $8,000 and $10,000/month',
    },
    {
      value: 'average_income' as ProofType,
      label: 'Average Income',
      description: 'Prove your average income over time',
      example: 'My average income is at least $11,000/month',
    },
    {
      value: 'credit_score' as ProofType,
      label: 'Payment Consistency Score',
      description: 'Prove your payment history score (ZKML)',
      example: 'My payment consistency score is at least 600',
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
        return `${employeeName} earns at least $${Number(minThreshold).toLocaleString()}/month${employmentText}${companyText}.`;
      case 'income_range':
        return `${employeeName} earns between $${Number(minThreshold).toLocaleString()} and $${Number(maxThreshold).toLocaleString()}/month${employmentText}${companyText}.`;
      case 'average_income':
        return `${employeeName}'s average income is at least $${Number(minThreshold).toLocaleString()}/month${employmentText}${companyText}.`;
      case 'credit_score':
        return `${employeeName}'s payment consistency score is at least ${minThreshold}${employmentText}${companyText}.`;
      default:
        return '';
    }
  };

  const handleGenerateProof = async () => {
    // Validation
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

    // Simulate ZKML proof generation (10-30 seconds)
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

    try {
      // TODO: Call actual API when ZKML service is integrated
      // const proofTypeNum = proofType === 'income_above' ? 0n : proofType === 'income_range' ? 1n : proofType === 'average_income' ? 2n : 3n;
      // await api.submitIncomeProof(
      //   employeeId,
      //   proofTypeNum,
      //   minThreshold,
      //   maxThreshold || '0',
      //   [], // txids (mock for now)
      //   '0x0000000000000000000000000000000000000000000000000000000000000000', // merkleRoot (mock)
      //   '0x0000000000000000000000000000000000000000000000000000000000000000', // attestationHash (mock)
      //   verifierEmail || '0x0000000000000000000000000000000000000000000000000000000000000000', // verifierPubkey
      //   BigInt(Math.floor(Date.now() / 1000)),
      //   Number(expirationDays) * 24 * 60 * 60
      // );

      await new Promise(resolve => setTimeout(resolve, duration));

      // Generate proof ID and link
      const proofId = `PROOF-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      const link = `https://zksalaria.app/verify/${proofId}`;

      setGeneratedProofId(proofId);
      setProofLink(link);
      setShowSuccess(true);

      toast.success('Proof generated successfully!');
    } catch (error) {
      console.error('[GenerateProof] Failed:', error);
      toast.error('Failed to generate proof. Please try again.');
      setIsGenerating(false);
      setProgress(0);
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

  const handleDownloadPDF = () => {
    // TODO: Generate PDF with proof details
    toast.success('PDF download started (feature coming soon)');
  };

  const handleReset = () => {
    setIsGenerating(false);
    setProgress(0);
    setShowSuccess(false);
    setGeneratedProofId('');
    setProofLink('');
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
                Generating ZK Proof...
              </Typography>
              <Typography variant="body2" color={theme.colors.text.secondary}>
                This may take 10-30 seconds. Please don't close this window.
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
              onChange={(e) => setProofType(e.target.value as ProofType)}
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
              {proofType === 'credit_score' ? (
                <TextField
                  fullWidth
                  label="Minimum Score"
                  type="number"
                  value={minThreshold}
                  onChange={(e) => setMinThreshold(e.target.value)}
                  helperText="Prove your payment consistency score is at least this value (0-1000)"
                  inputProps={{ min: 0, max: 1000 }}
                />
              ) : (
                <>
                  <TextField
                    fullWidth
                    label={proofType === 'income_range' ? 'Minimum Amount ($/month)' : 'Threshold Amount ($/month)'}
                    type="number"
                    value={minThreshold}
                    onChange={(e) => setMinThreshold(e.target.value)}
                    helperText={`Prove you earn ${proofType === 'income_range' ? 'at least' : proofType === 'average_income' ? 'on average at least' : 'more than'} this amount per month`}
                    InputProps={{
                      startAdornment: <Typography sx={{ mr: 1 }}>$</Typography>,
                    }}
                    inputProps={{ min: 0 }}
                  />

                  {proofType === 'income_range' && (
                    <TextField
                      fullWidth
                      label="Maximum Amount ($/month)"
                      type="number"
                      value={maxThreshold}
                      onChange={(e) => setMaxThreshold(e.target.value)}
                      helperText="Prove you earn less than this amount per month"
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
