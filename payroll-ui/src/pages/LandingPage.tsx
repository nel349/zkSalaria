import React from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Stack,
  Card,
  CardContent,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import LockIcon from '@mui/icons-material/Lock';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import AssessmentIcon from '@mui/icons-material/Assessment';

/**
 * Landing page component for zkSalaria
 * First page users see - explains value proposition and provides CTA to connect wallet
 */
export const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  const handleGetStarted = () => {
    navigate('/connect');
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: 'background.default',
      }}
    >
      {/* Hero Section */}
      <Container maxWidth="lg" sx={{ py: 8, flex: 1 }}>
        <Stack spacing={6} alignItems="center" textAlign="center">
          {/* Hero Text */}
          <Stack spacing={3} maxWidth="md">
            <Typography
              variant="h2"
              component="h1"
              fontWeight="bold"
              sx={{
                background: 'linear-gradient(45deg, #FF6B35 30%, #00D9FF 90%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              zkSalaria
            </Typography>
            <Typography variant="h4" color="text.primary" fontWeight="medium">
              Privacy-Preserving Payroll for the Midnight Network
            </Typography>
            <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 'sm', mx: 'auto' }}>
              Pay your employees with complete privacy. Encrypted salaries, zero-knowledge proofs, and
              compliance built-in.
            </Typography>
          </Stack>

          {/* CTA Button */}
          <Button
            variant="contained"
            size="large"
            onClick={handleGetStarted}
            sx={{
              px: 6,
              py: 2,
              fontSize: '1.1rem',
              borderRadius: 2,
              bgcolor: '#FF6B35',
              '&:hover': {
                bgcolor: '#ff8555',
              },
            }}
          >
            Open App
          </Button>

          {/* Feature Cards */}
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            spacing={3}
            sx={{ mt: 4, width: '100%' }}
          >
            <FeatureCard
              icon={<LockIcon sx={{ fontSize: 48, color: '#FF6B35' }} />}
              title="Private Payroll"
              description="Manage encrypted employee payments on-chain. Only you and your employees can see salary amounts."
            />
            <FeatureCard
              icon={<VerifiedUserIcon sx={{ fontSize: 48, color: '#00D9FF' }} />}
              title="ZK Verification"
              description="Employees generate zero-knowledge proofs of income without revealing exact amounts to lenders or landlords."
            />
            <FeatureCard
              icon={<AssessmentIcon sx={{ fontSize: 48, color: '#10B981' }} />}
              title="Compliance Ready"
              description="Built-in audit disclosures and employment verification for regulatory requirements."
            />
          </Stack>
        </Stack>
      </Container>

      {/* Footer */}
      <Box
        component="footer"
        sx={{
          py: 3,
          px: 2,
          mt: 'auto',
          bgcolor: 'background.paper',
          borderTop: 1,
          borderColor: 'divider',
        }}
      >
        <Container maxWidth="lg">
          <Typography variant="body2" color="text.secondary" align="center">
            Built on Midnight Network • Powered by Zero-Knowledge Technology
          </Typography>
        </Container>
      </Box>
    </Box>
  );
};

/**
 * Reusable feature card component
 */
interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon, title, description }) => {
  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: 4,
        },
      }}
    >
      <CardContent sx={{ flexGrow: 1, textAlign: 'center', p: 3 }}>
        <Box sx={{ mb: 2 }}>{icon}</Box>
        <Typography variant="h6" component="h3" gutterBottom fontWeight="medium">
          {title}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {description}
        </Typography>
      </CardContent>
    </Card>
  );
};
