import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Stack,
  Paper,
  Chip,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AssignmentIcon from '@mui/icons-material/Assignment';
import { useTheme, useThemeValues, createGlassMorphism, createPrimaryCTA } from '../theme';
import { usePayrollWallet } from '../contexts/PayrollWalletContext';
import { listCompanies } from '../utils/CompaniesLocalState';
import { PayrollAPI } from '@zksalaria/payroll-api';
import pino from 'pino';

// Create logger for dashboard
const logger = pino({
  name: 'auditorDashboard',
  level: 'info',
  browser: {
    asObject: false,
  },
});

type ProofType = 'INCOME_ABOVE_THRESHOLD' | 'INCOME_RANGE' | 'AVERAGE_INCOME' | 'CREDIT_SCORE';
type VerificationStatus = 'pending' | 'in_progress' | 'completed' | 'rejected';

interface VerificationRequest {
  id: string;
  employeeId: string;
  proofType: ProofType;
  submittedAt: string;
  status: VerificationStatus;
  fee: number;
  requirement?: {
    minAmount?: number;
    minRange?: number;
    maxRange?: number;
    minAverage?: number;
    minScore?: number;
  };
}

interface AuditorStats {
  reputationScore: number;
  totalEarnings: number;
  pendingCount: number;
  completedCount: number;
}

/**
 * Auditor Dashboard Page
 * Main dashboard for approved auditors to manage verification requests
 * Reference: AUDITOR_IMPLEMENTATION_COMPLETE.md - Step 4: Dashboard
 */
export const AuditorDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { mode } = useTheme();
  const theme = useThemeValues();
  const { walletAddress, providers } = usePayrollWallet();

  const [stats, setStats] = useState<AuditorStats>({
    reputationScore: 750,
    totalEarnings: 2450,
    pendingCount: 3,
    completedCount: 12,
  });

  const [requests, setRequests] = useState<VerificationRequest[]>([
    {
      id: 'VER-001',
      employeeId: '0x1234...5678',
      proofType: 'INCOME_ABOVE_THRESHOLD',
      submittedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      status: 'pending',
      fee: 50,
      requirement: { minAmount: 4000 },
    },
    {
      id: 'VER-002',
      employeeId: '0x8765...4321',
      proofType: 'INCOME_RANGE',
      submittedAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
      status: 'pending',
      fee: 75,
      requirement: { minRange: 8000, maxRange: 10000 },
    },
    {
      id: 'VER-003',
      employeeId: '0xabcd...ef12',
      proofType: 'AVERAGE_INCOME',
      submittedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      status: 'pending',
      fee: 100,
      requirement: { minAverage: 11000 },
    },
  ]);

  const [loading, setLoading] = useState(true);
  const [trustedAtCompanies, setTrustedAtCompanies] = useState<string[]>([]);

  useEffect(() => {
    const checkTrustedStatus = async () => {
      // Get auditor's public key
      const auditorPubkey = localStorage.getItem('auditorPubkey');
      const applicationStatus = localStorage.getItem('auditorApplicationStatus');

      if (!auditorPubkey) {
        logger.warn('No auditor pubkey found - user has not applied yet');
        navigate('/auditor/apply');
        return;
      }

      if (!walletAddress) {
        logger.warn('No wallet address found');
        setLoading(false);
        return;
      }

      // Check all known companies to see if this auditor is trusted
      const companies = listCompanies();
      const trustedCompanies: string[] = [];

      for (const company of companies) {
        try {
          const api = await PayrollAPI.connect(providers, company.contractAddress, walletAddress, logger);
          const isTrusted = await api.isTrustedVerifier(auditorPubkey);

          if (isTrusted) {
            logger.info(`Auditor is trusted at company: ${company.name}`);
            trustedCompanies.push(company.name);
          }
        } catch (err) {
          logger.warn(`Failed to check trusted status at ${company.name}:`, err);
        }
      }

      setTrustedAtCompanies(trustedCompanies);

      // If not trusted at any companies and still pending, redirect to status page
      if (trustedCompanies.length === 0 && applicationStatus === 'pending') {
        logger.warn('Auditor not registered at any companies yet, redirecting to status page');
        navigate('/auditor/status');
        return;
      }

      // If trusted at least one company, auto-approve the application
      if (trustedCompanies.length > 0 && applicationStatus === 'pending') {
        logger.info('Auditor is trusted at companies - auto-approving application');
        localStorage.setItem('auditorApplicationStatus', 'approved');
      }

      setLoading(false);
      logger.info('Auditor dashboard loaded');
    };

    checkTrustedStatus();
  }, [navigate, walletAddress, providers]);

  const getProofTypeLabel = (proofType: ProofType): string => {
    const labels: Record<ProofType, string> = {
      INCOME_ABOVE_THRESHOLD: 'Income Above Threshold',
      INCOME_RANGE: 'Income Range',
      AVERAGE_INCOME: 'Average Income',
      CREDIT_SCORE: 'Credit Score',
    };
    return labels[proofType];
  };

  const getProofTypeColor = (proofType: ProofType): 'primary' | 'secondary' | 'success' | 'warning' => {
    const colors: Record<ProofType, 'primary' | 'secondary' | 'success' | 'warning'> = {
      INCOME_ABOVE_THRESHOLD: 'primary',
      INCOME_RANGE: 'secondary',
      AVERAGE_INCOME: 'success',
      CREDIT_SCORE: 'warning',
    };
    return colors[proofType];
  };

  const getRequirementText = (request: VerificationRequest): string => {
    const { proofType, requirement } = request;
    if (!requirement) return 'N/A';

    switch (proofType) {
      case 'INCOME_ABOVE_THRESHOLD':
        return `Min: $${requirement.minAmount?.toLocaleString()}`;
      case 'INCOME_RANGE':
        return `$${requirement.minRange?.toLocaleString()} - $${requirement.maxRange?.toLocaleString()}`;
      case 'AVERAGE_INCOME':
        return `Avg: $${requirement.minAverage?.toLocaleString()}`;
      case 'CREDIT_SCORE':
        return `Score: ${requirement.minScore}+`;
      default:
        return 'N/A';
    }
  };

  const handleVerifyRequest = (requestId: string) => {
    logger.info(`Starting verification for request: ${requestId}`);
    // TODO: Navigate to verification detail page
    navigate(`/auditor/verify/${requestId}`);
  };

  const getReputationColor = (score: number): string => {
    if (score >= 800) return theme.colors.success[500];
    if (score >= 600) return theme.colors.primary[mode === 'dark' ? 400 : 600];
    if (score >= 400) return theme.colors.warning[500];
    return theme.colors.error[500];
  };

  const getReputationLabel = (score: number): string => {
    if (score >= 800) return 'Excellent';
    if (score >= 600) return 'Good';
    if (score >= 400) return 'Fair';
    return 'Poor';
  };

  if (loading) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <LinearProgress sx={{ width: '300px' }} />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: mode === 'dark'
          ? 'linear-gradient(135deg, #0a0e27 0%, #1a1f3a 50%, #2a2f4a 100%)'
          : 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
        py: 8,
      }}
    >
      <Container maxWidth="lg">
        {/* Header */}
        <Stack spacing={2} mb={6}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Stack direction="row" spacing={2} alignItems="center">
              <VerifiedUserIcon sx={{ fontSize: 48, color: theme.colors.primary[mode === 'dark' ? 400 : 600] }} />
              <Box>
                <Typography variant="h4" fontWeight="700">
                  Auditor Dashboard
                </Typography>
                <Typography color="text.secondary">
                  Manage verification requests and track your reputation
                </Typography>
              </Box>
            </Stack>
            <Button
              variant="outlined"
              onClick={() => navigate('/auditor')}
              sx={{
                borderColor: theme.colors.primary[mode === 'dark' ? 400 : 600],
                color: theme.colors.primary[mode === 'dark' ? 400 : 600],
              }}
            >
              Back to Home
            </Button>
          </Stack>
        </Stack>

        {/* Stats Grid */}
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr 1fr' }, gap: 3, mb: 6 }}>
          {/* Reputation Score */}
          <Paper
            sx={{
              ...createGlassMorphism(theme, mode),
              p: 3,
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: `0 8px 24px ${theme.colors.primary[mode === 'dark' ? 400 : 600]}30`,
              },
            }}
          >
            <Stack spacing={2}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <TrendingUpIcon sx={{ fontSize: 32, color: getReputationColor(stats.reputationScore) }} />
                <Chip
                  label={getReputationLabel(stats.reputationScore)}
                  size="small"
                  sx={{
                    backgroundColor: `${getReputationColor(stats.reputationScore)}20`,
                    color: getReputationColor(stats.reputationScore),
                    fontWeight: 600,
                  }}
                />
              </Stack>
              <Typography variant="h3" fontWeight="700" color={getReputationColor(stats.reputationScore)}>
                {stats.reputationScore}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Reputation Score
              </Typography>
              <LinearProgress
                variant="determinate"
                value={(stats.reputationScore / 1000) * 100}
                sx={{
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: `${getReputationColor(stats.reputationScore)}20`,
                  '& .MuiLinearProgress-bar': {
                    backgroundColor: getReputationColor(stats.reputationScore),
                  },
                }}
              />
            </Stack>
          </Paper>

          {/* Total Earnings */}
          <Paper
            sx={{
              ...createGlassMorphism(theme, mode),
              p: 3,
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: `0 8px 24px ${theme.colors.success[500]}30`,
              },
            }}
          >
            <Stack spacing={2}>
              <AttachMoneyIcon sx={{ fontSize: 32, color: theme.colors.success[500] }} />
              <Typography variant="h3" fontWeight="700" color={theme.colors.success[500]}>
                ${stats.totalEarnings}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Earnings
              </Typography>
            </Stack>
          </Paper>

          {/* Pending Verifications */}
          <Paper
            sx={{
              ...createGlassMorphism(theme, mode),
              p: 3,
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: `0 8px 24px ${theme.colors.warning[500]}30`,
              },
            }}
          >
            <Stack spacing={2}>
              <PendingActionsIcon sx={{ fontSize: 32, color: theme.colors.warning[500] }} />
              <Typography variant="h3" fontWeight="700" color={theme.colors.warning[500]}>
                {stats.pendingCount}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Pending Requests
              </Typography>
            </Stack>
          </Paper>

          {/* Completed Verifications */}
          <Paper
            sx={{
              ...createGlassMorphism(theme, mode),
              p: 3,
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: `0 8px 24px ${theme.colors.primary[mode === 'dark' ? 400 : 600]}30`,
              },
            }}
          >
            <Stack spacing={2}>
              <CheckCircleIcon sx={{ fontSize: 32, color: theme.colors.primary[mode === 'dark' ? 400 : 600] }} />
              <Typography variant="h3" fontWeight="700" color={theme.colors.primary[mode === 'dark' ? 400 : 600]}>
                {stats.completedCount}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Completed
              </Typography>
            </Stack>
          </Paper>
        </Box>

        {/* Trusted Status */}
        <Paper
          sx={{
            ...createGlassMorphism(theme, mode),
            p: 4,
            mb: 4,
          }}
        >
          <Stack spacing={3}>
            <Typography variant="h5" fontWeight="600">
              Trusted Verifier Status
            </Typography>

            {trustedAtCompanies.length === 0 ? (
              <Alert severity="info">
                You are not yet registered as a trusted verifier at any companies.
                Company admins must register your public key using the "Register Verifier" feature.
              </Alert>
            ) : (
              <Box>
                <Typography color="text.secondary" mb={2}>
                  You are registered as a trusted verifier at {trustedAtCompanies.length} {trustedAtCompanies.length === 1 ? 'company' : 'companies'}:
                </Typography>
                <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
                  {trustedAtCompanies.map((companyName, index) => (
                    <Chip
                      key={index}
                      label={companyName}
                      color="success"
                      icon={<CheckCircleIcon />}
                      sx={{ fontWeight: 600 }}
                    />
                  ))}
                </Stack>
              </Box>
            )}

            {/* Auditor Public Key */}
            <Box
              sx={{
                p: 2,
                borderRadius: 2,
                bgcolor: mode === 'dark' ? `${theme.colors.primary[500]}10` : theme.colors.primary[50],
                border: `1px dashed ${theme.colors.primary[500]}`,
              }}
            >
              <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                Your Auditor Public Key:
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  fontFamily: 'monospace',
                  wordBreak: 'break-all',
                  color: theme.colors.primary[500],
                  fontSize: '0.85rem',
                }}
              >
                {localStorage.getItem('auditorPubkey') || 'Not found'}
              </Typography>
            </Box>
          </Stack>
        </Paper>

        {/* Available Verification Requests */}
        <Alert severity="warning" sx={{ mb: 4 }}>
          <strong>Note:</strong> Verification requests listing requires a backend indexer service to query pending proofs across all employees.
          The mock data below demonstrates the UI flow.
        </Alert>

        <Paper
          sx={{
            ...createGlassMorphism(theme, mode),
            p: 4,
            mb: 4,
          }}
        >
          <Stack spacing={3}>
            <Stack direction="row" alignItems="center" spacing={2}>
              <AssignmentIcon sx={{ fontSize: 32, color: theme.colors.primary[mode === 'dark' ? 400 : 600] }} />
              <Typography variant="h5" fontWeight="600">
                Available Verification Requests
              </Typography>
            </Stack>

            {requests.length === 0 ? (
              <Alert severity="info">
                No verification requests available at the moment. Check back later!
              </Alert>
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell><strong>Request ID</strong></TableCell>
                      <TableCell><strong>Employee</strong></TableCell>
                      <TableCell><strong>Proof Type</strong></TableCell>
                      <TableCell><strong>Requirement</strong></TableCell>
                      <TableCell><strong>Submitted</strong></TableCell>
                      <TableCell><strong>Fee</strong></TableCell>
                      <TableCell align="right"><strong>Action</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {requests.map((request) => (
                      <TableRow
                        key={request.id}
                        sx={{
                          '&:hover': {
                            backgroundColor: `${theme.colors.primary[mode === 'dark' ? 400 : 600]}10`,
                          },
                        }}
                      >
                        <TableCell>
                          <Typography fontFamily="monospace" fontWeight="600">
                            {request.id}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography fontFamily="monospace" fontSize="0.9rem">
                            {request.employeeId}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={getProofTypeLabel(request.proofType)}
                            color={getProofTypeColor(request.proofType)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {getRequirementText(request)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">
                            {new Date(request.submittedAt).toLocaleString()}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography fontWeight="600" color={theme.colors.success[500]}>
                            ${request.fee}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Button
                            variant="contained"
                            size="small"
                            onClick={() => handleVerifyRequest(request.id)}
                            sx={createPrimaryCTA(theme, mode)}
                          >
                            Verify
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Stack>
        </Paper>

        {/* Info Alert */}
        <Alert severity="info" sx={{ mb: 4 }}>
          <strong>How it works:</strong> Review EZKL proofs, verify income requirements, and earn fees for each successful verification.
          Your reputation score increases with accurate verifications and decreases with rejected ones.
        </Alert>
      </Container>
    </Box>
  );
};
