import React from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Stack,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';

/**
 * Landing page component for zkSalaria
 * TODO: Implement proper landing page based on final design
 * For now, this is a simple placeholder
 */
export const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: 'background.default',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Container maxWidth="md">
        <Stack spacing={4} alignItems="center" textAlign="center">
          <Typography variant="h2" component="h1" fontWeight="bold">
            zkSalaria
          </Typography>

          <Typography variant="h5" color="text.secondary">
            Privacy-Preserving Payroll for the Midnight Network
          </Typography>

          <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 'sm' }}>
            Pay your employees with complete privacy. Encrypted salaries, zero-knowledge proofs, and
            compliance built-in.
          </Typography>

          <Stack direction="row" spacing={2} sx={{ mt: 4 }}>
            <Button
              variant="contained"
              size="large"
              onClick={() => navigate('/connect')}
            >
              <Typography>
                Open App
              </Typography>
            </Button>

            <Button
              variant="outlined"
              size="large"
              onClick={() => navigate('/theme-playground')}
            >
              <Typography>
                View Theme Playground
              </Typography>
            </Button>
          </Stack>

          <Typography variant="caption" color="text.secondary" sx={{ mt: 8 }}>
            Built on Midnight Network • Powered by Zero-Knowledge Technology
          </Typography>
        </Stack>
      </Container>
    </Box>
  );
};
