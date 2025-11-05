import React from 'react';
import { Container, Box, Typography, Stack, Button } from '@mui/material';
import { SectionHeader } from '../SectionHeader';
import { useThemeValues, useTheme } from '../../theme';
import ExploreIcon from '@mui/icons-material/Explore';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import CodeIcon from '@mui/icons-material/Code';

interface DeveloperColumn {
  icon: React.ReactNode;
  title: string;
  features: string[];
  buttonText: string;
  buttonColor: 'primary' | 'success' | 'secondary';
  onButtonClick: () => void;
}

/**
 * Developer Section - Section 4 of Landing Page
 * Displays 3-column developer resources with code example
 */
export const DeveloperSection: React.FC = () => {
  const theme = useThemeValues();
  const { mode } = useTheme();

  const columns: DeveloperColumn[] = [
    {
      icon: <ExploreIcon sx={{ fontSize: 48 }} />,
      title: 'Explore',
      features: [
        'Midnight Network zkApps',
        'ZKML with EZKL',
        'LLM Integration APIs',
        'Smart Contract Patterns',
      ],
      buttonText: 'Browse Examples →',
      buttonColor: 'primary',
      onButtonClick: () => window.open('https://docs.midnight.network', '_blank'),
    },
    {
      icon: <VerifiedUserIcon sx={{ fontSize: 48 }} />,
      title: 'Validate',
      features: [
        'Test Payroll Circuits',
        'Verify ZK Proofs',
        'Run Compliance Audits',
        'Simulate Transactions',
      ],
      buttonText: 'Try Sandbox →',
      buttonColor: 'success',
      onButtonClick: () => console.log('Open sandbox'),
    },
    {
      icon: <CodeIcon sx={{ fontSize: 48 }} />,
      title: 'Integrate',
      features: [
        'TypeScript SDK',
        'REST API Documentation',
        'GraphQL Queries',
        'React Components',
      ],
      buttonText: 'Read Docs →',
      buttonColor: 'secondary',
      onButtonClick: () => window.open('https://docs.midnight.network', '_blank'),
    },
  ];

  const codeExample = `import { PayrollContract, createEmployeePayment } from '@zksalaria/sdk';

// Initialize private payroll contract
const payroll = new PayrollContract({
  companyId: 'acme-corp',
  encryption: true, // Enable encrypted balances
});

// Add employee with encrypted balance
await payroll.addEmployee({
  employeeId: 'alice',
  initialBalance: 0n,
});

// Pay employee (balance stays encrypted on-chain)
await payroll.payEmployee({
  employeeId: 'alice',
  amount: 5000n, // $50.00 (in cents)
  encrypted: true,
});

// Employee generates ZK proof of income (ZKML)
const creditProof = await payroll.generateCreditProof({
  employeeId: 'alice',
  model: 'xgboost-v1',
});

// Third party verifies proof WITHOUT seeing actual salary
const isVerified = await payroll.verifyCreditProof({
  employeeId: 'alice',
  proof: creditProof,
  verifierId: 'bank-xyz',
});`;

  const getButtonColor = (colorType: 'primary' | 'success' | 'secondary') => {
    if (colorType === 'success') return theme.colors.success[500];
    if (colorType === 'secondary') return theme.colors.secondary[mode === 'dark' ? 400 : 600];
    return theme.colors.primary[mode === 'dark' ? 400 : 600];
  };

  return (
    <Box
      sx={{
        bgcolor: mode === 'dark' ? 'rgba(19, 21, 31, 0.93)' : 'transparent',
        py: { xs: theme.spacing[8], md: theme.spacing[16] },
      }}
    >
      <Container maxWidth="lg">
        {/* Section Header */}
        <SectionHeader
          title="Built for Developers"
          description="Integrate private payroll into your application with our comprehensive SDK and documentation."
        />

        {/* 3-Column Grid */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
            gap: 4,
            mt: { xs: theme.spacing[6], md: theme.spacing[8] },
          }}
        >
          {columns.map((column, index) => (
            <Box
              key={index}
              sx={{
                textAlign: 'center',
                p: 4,
              }}
            >
              {/* Icon */}
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  mb: 3,
                  color: getButtonColor(column.buttonColor),
                }}
              >
                {column.icon}
              </Box>

              {/* Title */}
              <Typography
                variant="h5"
                sx={{
                  color: theme.colors.text.primary,
                  fontWeight: theme.typography.fontWeight.semibold,
                  mb: 3,
                }}
              >
                {column.title}
              </Typography>

              {/* Features List */}
              <Stack spacing={1.5} sx={{ mb: 4, textAlign: 'left' }}>
                {column.features.map((feature, idx) => (
                  <Typography
                    key={idx}
                    variant="body2"
                    sx={{
                      color: theme.colors.text.secondary,
                      pl: 2,
                      '&::before': {
                        content: '"• "',
                        color: getButtonColor(column.buttonColor),
                        fontWeight: 'bold',
                        marginRight: 1,
                      },
                    }}
                  >
                    {feature}
                  </Typography>
                ))}
              </Stack>

              {/* Button */}
              <Button
                variant="outlined"
                onClick={column.onButtonClick}
                sx={{
                  borderColor: getButtonColor(column.buttonColor),
                  color: getButtonColor(column.buttonColor),
                  borderRadius: theme.borderRadius.md,
                  px: 3,
                  py: 1,
                  fontSize: theme.typography.fontSize.sm,
                  fontWeight: theme.typography.fontWeight.medium,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    borderColor: getButtonColor(column.buttonColor),
                    bgcolor: `${getButtonColor(column.buttonColor)}15`,
                    transform: 'translateY(-2px)',
                  },
                }}
              >
                {column.buttonText}
              </Button>
            </Box>
          ))}
        </Box>

        {/* Code Example */}
        <Box sx={{ mt: { xs: theme.spacing[8], md: theme.spacing[12] } }}>
          <Typography
            variant="h4"
            sx={{
              color: theme.colors.text.primary,
              fontWeight: theme.typography.fontWeight.semibold,
              textAlign: 'center',
              mb: 4,
            }}
          >
            Get started in minutes
          </Typography>

          <Box
            sx={{
              bgcolor: theme.colors.background.elevated,
              border: `1px solid ${theme.colors.border.default}`,
              borderRadius: theme.borderRadius.lg,
              p: 4,
              position: 'relative',
              overflow: 'auto',
            }}
          >
            <pre
              style={{
                margin: 0,
                fontFamily: theme.typography.fontFamily.mono,
                fontSize: theme.typography.fontSize.sm,
                color: theme.colors.text.secondary,
                lineHeight: 1.6,
              }}
            >
              {codeExample}
            </pre>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};
