import React from 'react';
import { Container, Box } from '@mui/material';
import { SectionHeader } from '../SectionHeader';
import { FeatureCard } from '../FeatureCard';
import { useThemeValues } from '../../theme';
import ShieldIcon from '@mui/icons-material/Shield';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import VerifiedIcon from '@mui/icons-material/Verified';
import PsychologyIcon from '@mui/icons-material/Psychology';

/**
 * Use Cases Section - Section 2 of Landing Page
 * Displays 4 use case cards explaining zkSalaria's capabilities
 */
export const UseCasesSection: React.FC = () => {
  const theme = useThemeValues();

  const useCases = [
    {
      icon: <ShieldIcon sx={{ fontSize: 64, color: theme.colors.primary[400] }} />,
      title: 'Private Payroll',
      description: 'Pay employees with fully encrypted balances. No one can see salaries, not even the blockchain validator.',
    },
    {
      icon: <TrendingUpIcon sx={{ fontSize: 64, color: theme.colors.primary[500] }} />,
      title: 'ZK Credit Scoring',
      description: 'Employees generate verifiable credit scores using ZKML proofs, without revealing actual income amounts.',
    },
    {
      icon: <VerifiedIcon sx={{ fontSize: 64, color: theme.colors.primary[600] }} />,
      title: 'Compliance Audits',
      description: 'AI-powered audits detect pay equity issues, tax irregularities, and fraud with zero-knowledge proofs.',
    },
    {
      icon: <PsychologyIcon sx={{ fontSize: 64, color: theme.colors.primary[400] }} />,
      title: 'Natural Language Reports',
      description: 'Ask questions in plain English. Get audit reports, compliance summaries, and insights from LLM.',
    },
  ];

  return (
    <Container
      maxWidth="lg"
      sx={{
        py: { xs: theme.spacing[8], md: theme.spacing[16] },
        bgcolor: theme.colors.background.default,
      }}
    >
      {/* Section Header */}
      <SectionHeader
        title="Built for Privacy"
        description="zkSalaria brings zero-knowledge proofs to payroll, enabling private verification without revealing sensitive salary data."
      />

      {/* Use Case Cards Grid */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(2, 1fr)',
            md: 'repeat(4, 1fr)',
          },
          gap: 3,
          mt: { xs: theme.spacing[6], md: theme.spacing[8] },
        }}
      >
        {useCases.map((useCase, index) => (
          <FeatureCard
            key={index}
            icon={useCase.icon}
            title={useCase.title}
            description={useCase.description}
            linkText="Learn More →"
            onLinkClick={() => {
              // TODO: Navigate to use case detail page
              console.log(`Navigate to ${useCase.title} details`);
            }}
          />
        ))}
      </Box>
    </Container>
  );
};
