import React from 'react';
import { Box, Container, Typography, Button, Stack, Paper } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import DashboardIcon from '@mui/icons-material/Dashboard';

/**
 * Dashboard page (placeholder)
 * Will show company or employee dashboard based on role
 * TODO: Implement role detection and full dashboard
 */
export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
      }}
    >
      <Container maxWidth="md">
        <Paper
          elevation={3}
          sx={{
            p: 6,
            borderRadius: 3,
            textAlign: 'center',
          }}
        >
          <Stack spacing={4} alignItems="center">
            <DashboardIcon
              sx={{
                fontSize: 80,
                color: '#10B981',
              }}
            />

            <Typography variant="h4" component="h1" fontWeight="bold">
              Dashboard (Coming Soon)
            </Typography>

            <Typography variant="body1" color="text.secondary">
              You've successfully connected your wallet! The dashboard implementation is in progress.
            </Typography>

            <Button
              variant="outlined"
              onClick={() => navigate('/')}
              sx={{ px: 4, py: 1.5 }}
            >
              Back to Home
            </Button>
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
};
