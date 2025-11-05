import React from 'react';
import { Container, Box, Typography } from '@mui/material';
import { useThemeValues, useTheme, createGradientText } from '../../theme';

interface Metric {
  value: string;
  label: string;
}

/**
 * Metrics Section - Section 5 of Landing Page
 * Displays social proof metrics
 */
export const MetricsSection: React.FC = () => {
  const theme = useThemeValues();
  const { mode } = useTheme();

  const metrics: Metric[] = [
    { value: '$12.5M', label: 'Total Paid' },
    { value: '552,800+', label: 'Payments' },
    { value: '297,500+', label: 'Employees' },
    { value: '99.9%', label: 'Uptime' },
  ];

  return (
    <Box
      sx={{
        bgcolor: mode === 'dark' ? 'rgba(19, 21, 31, 0.95)' : theme.colors.background.surface,
        py: { xs: theme.spacing[8], md: theme.spacing[12] },
      }}
    >
      <Container maxWidth="lg">
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: 'repeat(2, 1fr)',
              sm: 'repeat(4, 1fr)',
            },
            gap: 4,
            textAlign: 'center',
          }}
        >
          {metrics.map((metric, index) => (
            <Box key={index}>
              <Typography
                variant="h2"
                sx={{
                  ...createGradientText(theme, mode),
                  fontWeight: theme.typography.fontWeight.bold,
                  mb: 1,
                }}
              >
                {metric.value}
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  color: theme.colors.text.secondary,
                }}
              >
                {metric.label}
              </Typography>
            </Box>
          ))}
        </Box>
      </Container>
    </Box>
  );
};
