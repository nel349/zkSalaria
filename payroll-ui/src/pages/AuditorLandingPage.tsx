import React from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Stack,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import FlexibleIcon from '@mui/icons-material/Schedule';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import GavelIcon from '@mui/icons-material/Gavel';
import { useTheme, useThemeValues, createGlassMorphism, createPrimaryCTA } from '../theme';

/**
 * Auditor Landing Page
 * Marketing page for licensed CPAs/auditors to join the verification marketplace
 * Reference: AUDITOR_IMPLEMENTATION_COMPLETE.md - Step 1: Landing Page
 */
export const AuditorLandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { mode } = useTheme();
  const theme = useThemeValues();

  const benefits = [
    {
      icon: <AttachMoneyIcon sx={{ fontSize: 40, color: theme.colors.primary[mode === "dark" ? 400 : 600] }} />,
      title: 'New Revenue Stream',
      description: 'Earn fees for verification services with flexible, remote work opportunities',
    },
    {
      icon: <FlexibleIcon sx={{ fontSize: 40, color: theme.colors.primary[mode === "dark" ? 400 : 600] }} />,
      title: 'Automated Workflow',
      description: 'EZKL handles computation - you verify proofs from anywhere',
    },
    {
      icon: <TrendingUpIcon sx={{ fontSize: 40, color: theme.colors.primary[mode === "dark" ? 400 : 600] }} />,
      title: 'Build Reputation',
      description: 'On-chain reputation score (0-1000) drives your visibility and earnings',
    },
    {
      icon: <GavelIcon sx={{ fontSize: 40, color: theme.colors.primary[mode === "dark" ? 400 : 600] }} />,
      title: 'Low Overhead',
      description: 'Use your existing credentials - no additional infrastructure required',
    },
  ];

  const requirements = [
    'Licensed CPA or equivalent professional certification',
    'Valid professional license in good standing',
    'Midnight wallet for receiving payments',
    'Reliable internet connection for proof verification',
  ];

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
        <Stack spacing={3} alignItems="center" textAlign="center" mb={8}>
          <Chip
            label="Auditor Program"
            color="primary"
            sx={{ fontSize: '0.9rem', fontWeight: 600 }}
          />
          <Typography
            variant="h2"
            fontWeight="700"
            sx={{
              background: `linear-gradient(135deg, ${theme.colors.primary[mode === "dark" ? 400 : 600]} 0%, ${theme.colors.secondary[mode === "dark" ? 400 : 600]} 100%)`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              mb: 2,
            }}
          >
            Join the zkSalaria Verification Marketplace
          </Typography>
          <Typography
            variant="h5"
            color="text.secondary"
            maxWidth="800px"
            sx={{ lineHeight: 1.6 }}
          >
            Licensed CPAs and auditors: Earn fees by verifying ZKML income proofs.
            Build your on-chain reputation in the decentralized ecosystem.
          </Typography>
        </Stack>

        {/* Benefits Grid */}
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 4, mb: 8 }}>
          {benefits.map((benefit, index) => (
            <Paper
              key={index}
              sx={{
                ...createGlassMorphism(theme, mode),
                p: 4,
                height: '100%',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-8px)',
                  boxShadow: `0 12px 40px ${theme.colors.primary[mode === "dark" ? 400 : 600]}30`,
                },
              }}
            >
              <Stack spacing={2}>
                <Box>{benefit.icon}</Box>
                <Typography variant="h5" fontWeight="600">
                  {benefit.title}
                </Typography>
                <Typography color="text.secondary" sx={{ lineHeight: 1.6 }}>
                  {benefit.description}
                </Typography>
              </Stack>
            </Paper>
          ))}
        </Box>

        {/* Requirements Section */}
        <Paper
          sx={{
            ...createGlassMorphism(theme, mode),
            p: 6,
            mb: 8,
          }}
        >
          <Stack spacing={4}>
            <Stack direction="row" alignItems="center" spacing={2}>
              <VerifiedUserIcon sx={{ fontSize: 40, color: theme.colors.primary[mode === "dark" ? 400 : 600] }} />
              <Typography variant="h4" fontWeight="600">
                Requirements
              </Typography>
            </Stack>

            <List>
              {requirements.map((req, index) => (
                <ListItem key={index} sx={{ py: 1.5 }}>
                  <ListItemIcon>
                    <CheckCircleIcon sx={{ color: theme.colors.success[500], fontSize: 28 }} />
                  </ListItemIcon>
                  <ListItemText
                    primary={req}
                    primaryTypographyProps={{
                      fontSize: '1.1rem',
                      color: 'text.primary',
                    }}
                  />
                </ListItem>
              ))}
            </List>
          </Stack>
        </Paper>

        {/* How It Works */}
        <Paper
          sx={{
            ...createGlassMorphism(theme, mode),
            p: 6,
            mb: 8,
          }}
        >
          <Typography variant="h4" fontWeight="600" mb={4} textAlign="center">
            How It Works
          </Typography>

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr' }, gap: 4 }}>
            <Stack spacing={2} alignItems="center" textAlign="center">
              <Box
                sx={{
                  width: 80,
                  height: 80,
                  borderRadius: '50%',
                  background: `linear-gradient(135deg, ${theme.colors.primary[mode === "dark" ? 400 : 600]} 0%, ${theme.colors.secondary[mode === "dark" ? 400 : 600]} 100%)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '2rem',
                  fontWeight: 700,
                  color: 'white',
                }}
              >
                1
              </Box>
              <Typography variant="h6" fontWeight="600">
                Apply
              </Typography>
              <Typography color="text.secondary">
                Submit your application with professional license verification
              </Typography>
            </Stack>

            <Stack spacing={2} alignItems="center" textAlign="center">
              <Box
                sx={{
                  width: 80,
                  height: 80,
                  borderRadius: '50%',
                  background: `linear-gradient(135deg, ${theme.colors.primary[mode === "dark" ? 400 : 600]} 0%, ${theme.colors.secondary[mode === "dark" ? 400 : 600]} 100%)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '2rem',
                  fontWeight: 700,
                  color: 'white',
                }}
              >
                2
              </Box>
              <Typography variant="h6" fontWeight="600">
                Get Approved
              </Typography>
              <Typography color="text.secondary">
                Admin reviews credentials and adds you to the trusted verifier set
              </Typography>
            </Stack>

            <Stack spacing={2} alignItems="center" textAlign="center">
              <Box
                sx={{
                  width: 80,
                  height: 80,
                  borderRadius: '50%',
                  background: `linear-gradient(135deg, ${theme.colors.primary[mode === "dark" ? 400 : 600]} 0%, ${theme.colors.secondary[mode === "dark" ? 400 : 600]} 100%)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '2rem',
                  fontWeight: 700,
                  color: 'white',
                }}
              >
                3
              </Box>
              <Typography variant="h6" fontWeight="600">
                Start Earning
              </Typography>
              <Typography color="text.secondary">
                Verify EZKL proofs, build reputation, and earn fees per verification
              </Typography>
            </Stack>
          </Box>
        </Paper>

        {/* CTA Section */}
        <Stack spacing={4} alignItems="center" textAlign="center">
          <Typography variant="h4" fontWeight="600">
            Ready to Join?
          </Typography>
          <Typography variant="body1" color="text.secondary" maxWidth="600px">
            Start your application today and join the future of decentralized
            financial verification.
          </Typography>
          <Stack direction="row" spacing={3}>
            <Button
              variant="contained"
              size="large"
              onClick={() => navigate('/auditor/apply')}
              sx={{
                ...createPrimaryCTA(theme, mode),
                px: 6,
                py: 2,
                fontSize: '1.1rem',
                fontWeight: 600,
              }}
            >
              Apply Now
            </Button>
            <Button
              variant="outlined"
              size="large"
              onClick={() => navigate('/')}
              sx={{
                px: 6,
                py: 2,
                fontSize: '1.1rem',
                fontWeight: 600,
                borderColor: theme.colors.primary[mode === "dark" ? 400 : 600],
                color: theme.colors.primary[mode === "dark" ? 400 : 600],
                '&:hover': {
                  borderColor: theme.colors.secondary[mode === "dark" ? 400 : 600],
                  backgroundColor: `${theme.colors.primary[mode === "dark" ? 400 : 600]}10`,
                },
              }}
            >
              Back to Home
            </Button>
          </Stack>
        </Stack>
      </Container>
    </Box>
  );
};
