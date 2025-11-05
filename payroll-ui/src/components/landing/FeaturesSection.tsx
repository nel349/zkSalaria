import React, { useState } from 'react';
import { Container, Box, Typography, Stack } from '@mui/material';
import { SectionHeader } from '../SectionHeader';
import { useThemeValues, useTheme } from '../../theme';
import LockIcon from '@mui/icons-material/Lock';
import PsychologyIcon from '@mui/icons-material/Psychology';
import ReceiptIcon from '@mui/icons-material/Receipt';
import LoopIcon from '@mui/icons-material/Loop';
import LanguageIcon from '@mui/icons-material/Language';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import ShieldIcon from '@mui/icons-material/Shield';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

interface Feature {
  id: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  visualContent: React.ReactNode;
  caption: string;
}

/**
 * Features Section - Section 3 of Landing Page
 * Displays expandable accordion of features with visual representations
 */
export const FeaturesSection: React.FC = () => {
  const theme = useThemeValues();
  const { mode } = useTheme();
  const [selectedFeature, setSelectedFeature] = useState<string>('encrypted-balances');

  const features: Feature[] = [
    {
      id: 'encrypted-balances',
      icon: <LockIcon />,
      title: 'Encrypted Balances',
      description: 'Zero-knowledge salary privacy',
      visualContent: (
        <Box>
          <Typography variant="h6" sx={{ color: theme.colors.text.primary, mb: 4 }}>
            How Encryption Works
          </Typography>

          {/* Visual Flow */}
          <Stack spacing={3} alignItems="center">
            {/* Step 1: Employee Wallet */}
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                width: '100%',
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 80,
                  height: 80,
                  borderRadius: '50%',
                  bgcolor: `${theme.colors.primary[mode === 'dark' ? 400 : 600]}20`,
                  border: `2px solid ${theme.colors.primary[mode === 'dark' ? 400 : 600]}`,
                  mb: 2,
                }}
              >
                <AccountBalanceWalletIcon
                  sx={{ fontSize: 40, color: theme.colors.primary[mode === 'dark' ? 400 : 600] }}
                />
              </Box>
              <Typography variant="body2" sx={{ color: theme.colors.text.primary, fontWeight: 600 }}>
                Employee Wallet
              </Typography>
              <Typography variant="caption" sx={{ color: theme.colors.text.secondary }}>
                $5,000 salary
              </Typography>
            </Box>

            {/* Arrow Down */}
            <ArrowForwardIcon
              sx={{ transform: 'rotate(90deg)', color: theme.colors.text.disabled, fontSize: 32 }}
            />

            {/* Step 2: Encryption */}
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                width: '100%',
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 80,
                  height: 80,
                  borderRadius: '50%',
                  bgcolor: `${theme.colors.success[500]}20`,
                  border: `2px solid ${theme.colors.success[500]}`,
                  mb: 2,
                }}
              >
                <ShieldIcon sx={{ fontSize: 40, color: theme.colors.success[500] }} />
              </Box>
              <Typography variant="body2" sx={{ color: theme.colors.text.primary, fontWeight: 600 }}>
                Encrypted On-Chain
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  color: theme.colors.text.secondary,
                  fontFamily: theme.typography.fontFamily.mono,
                  fontSize: '0.7rem',
                }}
              >
                0x7f9a2b...3e5c
              </Typography>
            </Box>

            {/* Arrow Down */}
            <ArrowForwardIcon
              sx={{ transform: 'rotate(90deg)', color: theme.colors.text.disabled, fontSize: 32 }}
            />

            {/* Step 3: Privacy Protected */}
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                width: '100%',
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 80,
                  height: 80,
                  borderRadius: '50%',
                  bgcolor: `${theme.colors.warning[500]}20`,
                  border: `2px solid ${theme.colors.warning[500]}`,
                  mb: 2,
                }}
              >
                <VisibilityOffIcon sx={{ fontSize: 40, color: theme.colors.warning[500] }} />
              </Box>
              <Typography variant="body2" sx={{ color: theme.colors.text.primary, fontWeight: 600 }}>
                Private & Secure
              </Typography>
              <Typography variant="caption" sx={{ color: theme.colors.text.secondary, textAlign: 'center' }}>
                No one can see the amount
              </Typography>
            </Box>
          </Stack>
        </Box>
      ),
      caption: 'Salaries are encrypted on-chain. Only authorized parties can decrypt with ZK proofs.',
    },
    {
      id: 'zkml-verification',
      icon: <PsychologyIcon />,
      title: 'ZKML Verification',
      description: 'AI-powered proofs',
      visualContent: (
        <Box>
          <Typography variant="h6" sx={{ color: theme.colors.text.primary, mb: 3 }}>
            Machine Learning Proofs
          </Typography>
          <Stack spacing={2}>
            {['Income Verification', 'Credit Scoring', 'Fraud Detection', 'Pattern Analysis'].map((item, idx) => (
              <Box
                key={idx}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  bgcolor: theme.colors.background.elevated,
                  border: `1px solid ${theme.colors.border.default}`,
                  borderRadius: theme.borderRadius.md,
                  p: 2,
                }}
              >
                <Box
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    bgcolor: theme.colors.primary[mode === 'dark' ? 400 : 600],
                    mr: 2,
                  }}
                />
                <Typography variant="body2" sx={{ color: theme.colors.text.primary }}>
                  {item}
                </Typography>
              </Box>
            ))}
          </Stack>
        </Box>
      ),
      caption: 'Machine learning models generate zero-knowledge proofs for credit scoring and fraud detection.',
    },
    {
      id: 'tax-benefits',
      icon: <ReceiptIcon />,
      title: 'Tax & Benefits',
      description: 'Automated compliance',
      visualContent: (
        <Box>
          <Typography variant="h6" sx={{ color: theme.colors.text.primary, mb: 3 }}>
            Automated Calculations
          </Typography>
          <Stack spacing={2}>
            {[
              { label: 'Federal Tax Withholding', value: 'Automated' },
              { label: 'State Tax Compliance', value: 'Multi-State' },
              { label: '401(k) Contributions', value: 'Pre-Tax' },
              { label: 'Health Insurance', value: 'Deductible' },
            ].map((item, idx) => (
              <Box
                key={idx}
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  bgcolor: theme.colors.background.elevated,
                  border: `1px solid ${theme.colors.border.default}`,
                  borderRadius: theme.borderRadius.md,
                  p: 2,
                }}
              >
                <Typography variant="body2" sx={{ color: theme.colors.text.primary }}>
                  {item.label}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    color: theme.colors.primary[mode === 'dark' ? 400 : 600],
                    fontWeight: theme.typography.fontWeight.medium,
                  }}
                >
                  {item.value}
                </Typography>
              </Box>
            ))}
          </Stack>
        </Box>
      ),
      caption: 'Automated tax withholding and benefits tracking with encrypted reporting.',
    },
    {
      id: 'recurring-payments',
      icon: <LoopIcon />,
      title: 'Recurring Payments',
      description: 'Scheduled salary streams',
      visualContent: (
        <Box>
          <Typography variant="h6" sx={{ color: theme.colors.text.primary, mb: 3 }}>
            Payment Schedule
          </Typography>
          <Stack spacing={2}>
            {['Weekly', 'Bi-Weekly', 'Monthly', 'Custom'].map((frequency, idx) => (
              <Box
                key={idx}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  bgcolor: theme.colors.background.elevated,
                  border: `1px solid ${theme.colors.border.default}`,
                  borderRadius: theme.borderRadius.md,
                  p: 2,
                }}
              >
                <Typography variant="body2" sx={{ color: theme.colors.text.primary }}>
                  {frequency} Payments
                </Typography>
                <Box
                  sx={{
                    px: 2,
                    py: 0.5,
                    borderRadius: theme.borderRadius.sm,
                    bgcolor: `${theme.colors.primary[mode === 'dark' ? 400 : 600]}20`,
                    border: `1px solid ${theme.colors.primary[mode === 'dark' ? 400 : 600]}`,
                  }}
                >
                  <Typography
                    variant="caption"
                    sx={{
                      color: theme.colors.primary[mode === 'dark' ? 400 : 600],
                      fontWeight: theme.typography.fontWeight.medium,
                    }}
                  >
                    Available
                  </Typography>
                </Box>
              </Box>
            ))}
          </Stack>
        </Box>
      ),
      caption: 'Set up recurring salary payments with cryptographic guarantees.',
    },
    {
      id: 'multi-currency',
      icon: <LanguageIcon />,
      title: 'Multi-Currency',
      description: 'Global payroll support',
      visualContent: (
        <Box>
          <Typography variant="h6" sx={{ color: theme.colors.text.primary, mb: 3 }}>
            Global Coverage
          </Typography>
          <Stack spacing={2}>
            {[
              { currency: 'USD', flag: '🇺🇸', name: 'US Dollar' },
              { currency: 'EUR', flag: '🇪🇺', name: 'Euro' },
              { currency: 'GBP', flag: '🇬🇧', name: 'British Pound' },
              { currency: 'JPY', flag: '🇯🇵', name: 'Japanese Yen' },
            ].map((item, idx) => (
              <Box
                key={idx}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  bgcolor: theme.colors.background.elevated,
                  border: `1px solid ${theme.colors.border.default}`,
                  borderRadius: theme.borderRadius.md,
                  p: 2,
                }}
              >
                <Typography variant="h6" sx={{ mr: 2 }}>
                  {item.flag}
                </Typography>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2" sx={{ color: theme.colors.text.primary, fontWeight: theme.typography.fontWeight.medium }}>
                    {item.currency}
                  </Typography>
                  <Typography variant="caption" sx={{ color: theme.colors.text.secondary }}>
                    {item.name}
                  </Typography>
                </Box>
              </Box>
            ))}
          </Stack>
        </Box>
      ),
      caption: 'Pay employees globally with automatic currency conversion.',
    },
  ];

  const selectedFeatureData = features.find((f) => f.id === selectedFeature) || features[0];

  return (
    <Box
      sx={{
        bgcolor: mode === 'dark' ? 'rgba(19, 21, 31, 0.9)' : theme.colors.background.surface,
        py: { xs: theme.spacing[8], md: theme.spacing[16] },
      }}
    >
      <Container maxWidth="lg">
        {/* Section Header */}
        <SectionHeader
          title="Privacy-First Features"
          description="Everything you need for compliant, private, and verifiable payroll operations."
        />

        {/* Features Layout: 2 Columns */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: '40% 60%' },
            gap: 4,
            mt: { xs: theme.spacing[6], md: theme.spacing[8] },
          }}
        >
          {/* Left Column: Accordion */}
          <Stack spacing={1}>
            {features.map((feature) => {
              const isSelected = selectedFeature === feature.id;
              return (
                <Box
                  key={feature.id}
                  onClick={() => setSelectedFeature(feature.id)}
                  sx={{
                    cursor: 'pointer',
                    bgcolor: isSelected ? theme.colors.background.elevated : 'transparent',
                    borderLeft: `4px solid ${isSelected ? theme.colors.primary[mode === 'dark' ? 400 : 600] : 'transparent'}`,
                    borderRadius: theme.borderRadius.md,
                    p: 3,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      bgcolor: theme.colors.action.hover,
                    },
                  }}
                >
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        color: isSelected
                          ? theme.colors.primary[mode === 'dark' ? 400 : 600]
                          : theme.colors.text.secondary,
                        transition: 'all 0.3s ease',
                      }}
                    >
                      {feature.icon}
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography
                        variant="h6"
                        sx={{
                          color: theme.colors.text.primary,
                          fontWeight: isSelected
                            ? theme.typography.fontWeight.semibold
                            : theme.typography.fontWeight.medium,
                        }}
                      >
                        {feature.title}
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          color: theme.colors.text.secondary,
                          fontSize: theme.typography.fontSize.sm,
                        }}
                      >
                        {feature.description}
                      </Typography>
                    </Box>
                    <ExpandMoreIcon
                      sx={{
                        color: theme.colors.text.secondary,
                        transform: isSelected ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 0.3s ease',
                      }}
                    />
                  </Stack>
                </Box>
              );
            })}
          </Stack>

          {/* Right Column: Visual Content */}
          <Box
            sx={{
              bgcolor: theme.colors.background.paper,
              border: `1px solid ${theme.colors.border.default}`,
              borderRadius: theme.borderRadius.lg,
              p: 4,
              minHeight: '400px',
            }}
          >
            {selectedFeatureData.visualContent}
            <Typography
              variant="body2"
              sx={{
                color: theme.colors.text.secondary,
                mt: 4,
                fontStyle: 'italic',
              }}
            >
              {selectedFeatureData.caption}
            </Typography>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};
