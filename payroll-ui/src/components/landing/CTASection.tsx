import React from 'react';
import { Container, Box, Typography, Button, Stack } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useThemeValues, useTheme, createPrimaryCTA } from '../../theme';

/**
 * CTA Section - Section 6 of Landing Page
 * Final call-to-action before footer
 */
export const CTASection: React.FC = () => {
  const theme = useThemeValues();
  const { mode } = useTheme();
  const navigate = useNavigate();

  const handleOpenApp = () => {
    navigate('/connect');
  };

  const handleScheduleDemo = () => {
    // TODO: Implement demo scheduling
    window.open('https://calendly.com/zksalaria/demo', '_blank');
  };

  return (
    <Box
      sx={{
        bgcolor: mode === 'dark' ? 'rgba(19, 21, 31, 0.97)' : 'transparent',
        py: { xs: theme.spacing[12], md: theme.spacing[16] },
      }}
    >
      <Container maxWidth="md">
        <Box sx={{ textAlign: 'center' }}>
          {/* Title */}
          <Typography
            variant="h2"
            sx={{
              color: theme.colors.text.primary,
              fontWeight: theme.typography.fontWeight.bold,
              mb: 2,
            }}
          >
            Ready to go private?
          </Typography>

          {/* Description */}
          <Typography
            variant="h6"
            sx={{
              color: theme.colors.text.secondary,
              mb: 6,
              maxWidth: '600px',
              mx: 'auto',
            }}
          >
            Start paying employees with encrypted balances and zero-knowledge proofs today.
          </Typography>

          {/* CTA Buttons */}
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={2}
            justifyContent="center"
          >
            {/* Primary CTA */}
            <Button
              variant="contained"
              size="large"
              onClick={handleOpenApp}
              sx={createPrimaryCTA(theme, mode)}
            >
              Open App
            </Button>

            {/* Secondary CTA */}
            <Button
              variant="outlined"
              size="large"
              onClick={handleScheduleDemo}
              sx={{
                borderRadius: '50px',
                px: 4,
                py: 2,
                fontSize: theme.typography.fontSize.base,
                fontWeight: theme.typography.fontWeight.medium,
                borderColor: theme.colors.primary[mode === 'dark' ? 400 : 600],
                color: theme.colors.primary[mode === 'dark' ? 400 : 600],
                '&:hover': {
                  borderColor: theme.colors.primary[mode === 'dark' ? 300 : 500],
                  bgcolor: `${theme.colors.primary[mode === 'dark' ? 400 : 600]}10`,
                },
              }}
            >
              Schedule Demo →
            </Button>
          </Stack>
        </Box>
      </Container>
    </Box>
  );
};
