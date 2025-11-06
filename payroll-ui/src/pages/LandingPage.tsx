import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Stack,
  AppBar,
  Toolbar,
  Link as MuiLink,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import LockIcon from '@mui/icons-material/Lock';
import GroupIcon from '@mui/icons-material/Group';
import {
  useTheme,
  useThemeValues,
  createMeshGradient,
  createGridPattern,
  createGradientText,
  createTextShadow,
  createGlowEffect,
  createPrimaryCTA,
  createGlassMorphism,
} from '../theme';
import { UseCasesSection } from '../components/landing/UseCasesSection';
import { FeaturesSection } from '../components/landing/FeaturesSection';
import { DeveloperSection } from '../components/landing/DeveloperSection';
import { MetricsSection } from '../components/landing/MetricsSection';
import { CTASection } from '../components/landing/CTASection';
import { Footer } from '../components/landing/Footer';
import { ThemeToggle } from '../components';

/**
 * Landing Page for zkSalaria
 * Implements Phase 1.1 from UI Implementation Roadmap
 * Reference: docs/design/1_ONBOARDING_WIREFRAME.md (v2.0)
 */
export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { mode } = useTheme();
  const theme = useThemeValues();

  const [showSplash, setShowSplash] = useState(true);
  const [scrollY, setScrollY] = useState(0);
  const [typedText, setTypedText] = useState('');
  const [showCursor, setShowCursor] = useState(true);

  const fullText = 'Private Payroll with ZKML, Verified On-Chain.';

  useEffect(() => {
    // Hide splash screen after 2 seconds
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Start typing animation after splash screen
    if (!showSplash) {
      let currentIndex = 0;
      const typingInterval = setInterval(() => {
        if (currentIndex <= fullText.length) {
          setTypedText(fullText.slice(0, currentIndex));
          currentIndex++;
        } else {
          clearInterval(typingInterval);
          // Stop cursor blinking after typing is complete
          setTimeout(() => setShowCursor(false), 500);
        }
      }, 50); // 50ms per character

      return () => clearInterval(typingInterval);
    }
  }, [showSplash]);

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Calculate video opacity based on scroll position
  // Start at 0.3, decrease to 0.05 as user scrolls down
  const videoOpacity = Math.max(0.05, 0.3 - (scrollY / 2000) * 0.25);

  const handleOpenApp = () => {
    navigate('/connect');
  };

  const handleViewDocs = () => {
    // TODO: Add documentation link
    window.open('https://docs.midnight.network', '_blank');
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: 'transparent',
        color: theme.colors.text.primary,
        position: 'relative',
      }}
    >
      {/* Splash Screen (Dark Mode Only) */}
      {mode === 'dark' && showSplash && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            zIndex: 9999,
            bgcolor: theme.colors.background.default,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'opacity 0.5s ease-out',
            opacity: showSplash ? 1 : 0,
          }}
        >
          <Box
            sx={{
              position: 'relative',
              width: 'auto',
              height: 'auto',
              maxWidth: '800px',
              maxHeight: '600px',
              '&::after': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: `radial-gradient(ellipse at center, transparent 40%, ${theme.colors.background.default} 100%)`,
                pointerEvents: 'none',
              },
            }}
          >
            <Box
              component="video"
              autoPlay
              loop
              muted
              playsInline
              sx={{
                width: 'auto',
                height: 'auto',
                maxWidth: '800px',
                maxHeight: '600px',
                opacity: 0.8,
                display: 'block',
              }}
            >
              <source src="/assets/grok-lock-fluid-b1.mp4" type="video/mp4" />
            </Box>
          </Box>
        </Box>
      )}

      {/* Video Background (Dark Mode Only) */}
      {mode === 'dark' && !showSplash && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            zIndex: 0,
            overflow: 'hidden',
            bgcolor: theme.colors.background.default,
          }}
        >
          <Box
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: 'auto',
              height: 'auto',
              maxWidth: '800px',
              maxHeight: '600px',
              '&::after': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: `radial-gradient(ellipse at center, transparent 30%, ${theme.colors.background.default} 100%)`,
                pointerEvents: 'none',
              },
            }}
          >
            <Box
              component="video"
              autoPlay
              loop
              muted
              playsInline
              sx={{
                width: 'auto',
                height: 'auto',
                maxWidth: '800px',
                maxHeight: '600px',
                opacity: videoOpacity,
                transition: 'opacity 0.3s ease',
                display: 'block',
              }}
            >
              <source src="/assets/grok-lock-fluid.mp4" type="video/mp4" />
            </Box>
          </Box>
        </Box>
      )}

      {/* Background layer for light mode */}
      {mode === 'light' && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            zIndex: 0,
            bgcolor: theme.colors.background.default,
          }}
        />
      )}

      {/* Animated Mesh Gradient Background */}
      <Box sx={{ ...createMeshGradient(theme, mode), zIndex: 1 }} />

      {/* Grid Pattern Overlay */}
      <Box sx={{ ...createGridPattern(theme, mode), zIndex: 1 }} />

      {/* Navigation Bar */}
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          ...createGlassMorphism(theme, mode),
          bgcolor: `${theme.colors.background.default}cc`,
          zIndex: 100,
        }}
      >
        <Toolbar sx={{ height: '80px', justifyContent: 'space-between', px: { xs: 2, md: 6 } }}>
          {/* zkSalaria Logo */}
          <Stack direction="row" spacing={1.5} alignItems="center">
            <LockIcon sx={{ fontSize: 32, color: theme.colors.primary[mode === 'dark' ? 400 : 600] }} />
            <Typography
              variant="h6"
              fontWeight="bold"
              sx={{
                color: theme.colors.text.primary,
                textShadow: createTextShadow(theme, mode, 'sm'),
              }}
            >
              zkSalaria
            </Typography>
          </Stack>

          {/* Nav Links - Hidden on mobile */}
          <Stack
            direction="row"
            spacing={4}
            sx={{ display: { xs: 'none', md: 'flex' } }}
          >
            {['Use Cases', 'Features', 'Developers', 'Docs'].map((label) => (
              <MuiLink
                key={label}
                href="#"
                underline="none"
                sx={{
                  color: theme.colors.text.secondary,
                  fontSize: theme.typography.fontSize.sm,
                  fontWeight: theme.typography.fontWeight.medium,
                  transition: 'color 0.2s ease',
                  '&:hover': {
                    color: theme.colors.text.primary,
                    textDecoration: 'underline',
                  },
                }}
              >
                {label}
              </MuiLink>
            ))}
          </Stack>

          {/* Right Side: Theme Toggle + Open App CTA */}
          <Stack direction="row" spacing={2} alignItems="center">
            {/* Theme Toggle */}
            <ThemeToggle size="small" />

            {/* Open App CTA */}
            <Button
              variant="contained"
              size="medium"
              onClick={handleOpenApp}
              sx={{
                ...createPrimaryCTA(theme, mode),
                px: 4,
                py: 1.5,
                fontSize: theme.typography.fontSize.sm,
              }}
            >
              Open App
            </Button>
          </Stack>
        </Toolbar>
      </AppBar>

      {/* Hero Section */}
      <Container
        maxWidth="lg"
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          position: 'relative',
          zIndex: 10,
          py: { xs: 8, md: 12 },
        }}
      >
        <Stack spacing={6} alignItems="center" maxWidth="900px">
          {/* Main Headline with Typing Animation */}
          <Typography
            variant="h1"
            component="h1"
            fontWeight="extrabold"
            sx={{
              ...createGradientText(theme, mode),
              fontSize: { xs: '2.5rem', sm: '3.5rem', md: '4.5rem' },
              textShadow: createTextShadow(theme, mode, 'lg'),
              letterSpacing: '-0.02em',
              maxWidth: '900px',
              minHeight: { xs: '120px', sm: '200px', md: '240px' },
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              filter: 'brightness(1.2) contrast(1.1)',
              '& .cursor': {
                display: showCursor ? 'inline-block' : 'none',
                width: '4px',
                height: '1em',
                backgroundColor: theme.colors.primary[mode === 'dark' ? 400 : 600],
                marginLeft: '4px',
                animation: showCursor ? 'blink 1s step-end infinite' : 'none',
              },
              '@keyframes blink': {
                '0%, 100%': { opacity: 1 },
                '50%': { opacity: 0 },
              },
            }}
          >
            {typedText}
            <Box component="span" className="cursor" />
          </Typography>

          {/* Subheadline */}
          <Typography
            variant="h5"
            color={theme.colors.text.secondary}
            sx={{
              fontSize: { xs: '1.125rem', md: '1.5rem' },
              lineHeight: 1.5,
              maxWidth: '720px',
            }}
          >
            Pay employees with encrypted balances and verify income with ZKML proofs—no salary data revealed, fully compliant.
          </Typography>

          {/* CTA Buttons */}
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mt: 4 }}>
            {/* Primary CTA with Glow */}
            <Box sx={{ position: 'relative' }}>
              <Box sx={createGlowEffect(theme, mode)} />
              <Button
                variant="contained"
                size="large"
                onClick={handleOpenApp}
                sx={createPrimaryCTA(theme, mode)}
              >
                Open App
              </Button>
            </Box>

            {/* Secondary CTA */}
            <Button
              variant="outlined"
              size="large"
              onClick={handleViewDocs}
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
              View Documentation →
            </Button>
          </Stack>

          {/* Stats */}
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={4}
            sx={{ mt: 8 }}
          >
            <Stack direction="row" spacing={1} alignItems="center">
              <LockIcon sx={{ color: theme.colors.success[500], fontSize: 20 }} />
              <Typography variant="body2" color={theme.colors.text.secondary}>
                552,800+ Private Payments
              </Typography>
            </Stack>
            <Stack direction="row" spacing={1} alignItems="center">
              <GroupIcon sx={{ color: theme.colors.success[500], fontSize: 20 }} />
              <Typography variant="body2" color={theme.colors.text.secondary}>
                297,500+ Verified Employees
              </Typography>
            </Stack>
          </Stack>

          {/* Footer Note - Built on Midnight */}
          <Stack
            direction="row"
            spacing={1}
            alignItems="center"
            justifyContent="center"
            sx={{ mt: 8 }}
          >
            <Typography
              variant="caption"
              color={theme.colors.text.disabled}
            >
              Built on
            </Typography>
            <Box
              component="img"
              src={mode === 'dark' ? '/assets/midnight-logo-white.svg' : '/assets/midnight-logo-black.svg'}
              alt="Midnight Network"
              sx={{
                height: '16px',
                width: 'auto',
                opacity: 0.7,
              }}
            />
            <Typography
              variant="caption"
              color={theme.colors.text.disabled}
            >
              • Powered by Zero-Knowledge Technology
            </Typography>
          </Stack>
        </Stack>
      </Container>

      {/* All Sections - Above Video Background */}
      <Box sx={{ position: 'relative', zIndex: 10 }}>
        {/* Section 2: Use Cases */}
        <UseCasesSection />

        {/* Section 3: Features */}
        <FeaturesSection />

        {/* Section 4: Developer
        <DeveloperSection /> */}

        {/* Section 5: Metrics */}
        <MetricsSection />

        {/* Section 6: CTA */}
        <CTASection />

        {/* Section 7: Footer */}
        <Footer />
      </Box>
    </Box>
  );
};
