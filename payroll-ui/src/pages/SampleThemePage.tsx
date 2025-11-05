import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Stack,
  Card,
  CardContent,
  IconButton,
  Chip,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import LockIcon from '@mui/icons-material/Lock';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import AssessmentIcon from '@mui/icons-material/Assessment';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';

/**
 * Deep Red Color Palette (#800517 base)
 */
const DEEP_RED = {
  50: '#fef2f2',   // Very light red tint
  100: '#fee2e2',  // Light red tint
  200: '#fecaca',  // Lighter red
  300: '#fca5a5',  // Light red
  400: '#f87171',  // Medium light red
  500: '#c70039',  // Brighter red for better contrast
  600: '#a0071e',  // Medium red
  700: '#800517',  // Base deep red (Venetian Red)
  800: '#600412',  // Darker deep red
  900: '#400310',  // Very dark red
};

const CHARCOAL = {
  50: '#f9fafb',   // Very light gray
  100: '#f3f4f6',  // Light gray
  200: '#e5e7eb',  // Lighter gray
  300: '#d1d5db',  // Light gray
  400: '#9ca3af',  // Medium gray
  500: '#6b7280',  // Gray
  600: '#4b5563',  // Dark gray
  700: '#374151',  // Darker gray
  800: '#1f2937',  // Dark slate (like Sablier)
  900: '#1a1d29',  // Dark navy (Sablier-inspired)
  950: '#13151f',  // Darkest navy (not pure black)
};

/**
 * Sample Theme Playground for zkSalaria
 * Used to test and showcase different theme variations
 * Based on Deep Red (#800517) × Charcoal color scheme
 *
 * Access via: /theme-playground
 */
export const SampleThemePage: React.FC = () => {
  const navigate = useNavigate();
  const [isDark, setIsDark] = useState(true);

  const handleGetStarted = () => {
    navigate('/connect');
  };

  // Theme colors based on mode - Better contrast for red
  const theme = {
    bg: {
      default: isDark ? '#13151f' : '#ffffff',        // Dark navy instead of black
      paper: isDark ? '#1a1d29' : CHARCOAL[50],       // Slightly lighter navy
      surface: isDark ? '#242835' : CHARCOAL[100],    // Lighter for better contrast with red
      elevated: isDark ? '#2d3140' : CHARCOAL[200],   // Elevated elements
    },
    text: {
      primary: isDark ? '#f8f9fa' : CHARCOAL[900],
      secondary: isDark ? '#a8adb7' : CHARCOAL[600],
      tertiary: isDark ? '#6b7280' : CHARCOAL[500],
      inverse: isDark ? CHARCOAL[900] : '#ffffff',
    },
    border: isDark ? '#363b4d' : CHARCOAL[300],       // Lighter borders for visibility
    borderLight: isDark ? '#2a2f3e' : CHARCOAL[200],
    red: {
      primary: isDark ? DEEP_RED[500] : DEEP_RED[700],     // Brighter red for dark mode
      light: isDark ? DEEP_RED[400] : DEEP_RED[600],
      lighter: isDark ? DEEP_RED[300] : DEEP_RED[500],
      dark: isDark ? DEEP_RED[600] : DEEP_RED[800],
      darker: isDark ? DEEP_RED[700] : DEEP_RED[900],
    },
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: theme.bg.default,
        color: theme.text.primary,
        position: 'relative',
        overflow: 'hidden',
        transition: 'all 0.5s ease',
      }}
    >
      {/* Animated Mesh Gradient Background - Sablier style */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 0,
          opacity: isDark ? 0.3 : 0.25,
          background: isDark
            ? `radial-gradient(ellipse at 20% 20%, ${theme.red.primary}25 0%, transparent 50%),
               radial-gradient(ellipse at 80% 80%, ${theme.red.dark}20 0%, transparent 50%),
               radial-gradient(ellipse at 50% 100%, #2d314060 0%, transparent 50%)`
            : `radial-gradient(ellipse at 20% 20%, ${theme.red.lighter}20 0%, transparent 50%),
               radial-gradient(ellipse at 80% 80%, ${theme.red.light}15 0%, transparent 50%),
               radial-gradient(ellipse at 50% 50%, ${CHARCOAL[200]}30 0%, transparent 50%)`,
          filter: 'blur(100px)',
          animation: 'meshGradient 20s ease infinite',
          '@keyframes meshGradient': {
            '0%, 100%': { transform: 'scale(1) rotate(0deg)' },
            '50%': { transform: 'scale(1.05) rotate(3deg)' },
          },
        }}
      />

      {/* Subtle Grid Pattern - Sablier style */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 1,
          opacity: isDark ? 0.02 : 0.015,
          backgroundImage: isDark
            ? `linear-gradient(${theme.border} 1px, transparent 1px),
               linear-gradient(90deg, ${theme.border} 1px, transparent 1px)`
            : `linear-gradient(${CHARCOAL[200]} 1px, transparent 1px),
               linear-gradient(90deg, ${CHARCOAL[200]} 1px, transparent 1px)`,
          backgroundSize: '50px 50px',
          pointerEvents: 'none',
        }}
      />

      {/* Theme Toggle */}
      <Box sx={{ position: 'fixed', top: 20, right: 20, zIndex: 1000 }}>
        <Stack direction="row" spacing={1} alignItems="center">
          <Chip
            label={isDark ? 'Dark Mode' : 'Light Mode'}
            size="small"
            sx={{
              bgcolor: isDark ? `${theme.bg.surface}cc` : `${theme.bg.paper}cc`,
              backdropFilter: 'blur(10px)',
              border: `1px solid ${theme.border}40`,
              color: theme.text.primary,
              fontWeight: 'medium',
            }}
          />
          <IconButton
            onClick={() => setIsDark(!isDark)}
            sx={{
              bgcolor: isDark ? `${theme.bg.surface}cc` : `${theme.bg.paper}cc`,
              backdropFilter: 'blur(10px)',
              border: `1px solid ${theme.border}40`,
              color: theme.text.primary,
              '&:hover': {
                bgcolor: theme.bg.elevated,
                transform: 'rotate(180deg)',
              },
              transition: 'all 0.3s ease',
            }}
          >
            {isDark ? <LightModeIcon /> : <DarkModeIcon />}
          </IconButton>
        </Stack>
      </Box>

      {/* Hero Section */}
      <Container maxWidth="lg" sx={{ py: 12, flex: 1, position: 'relative', zIndex: 2 }}>
        <Stack spacing={8} alignItems="center" textAlign="center">
          {/* Hero Text */}
          <Stack spacing={4} maxWidth="md">
            {/* Floating Badge */}
            <Box
              sx={{
                display: 'inline-flex',
                alignSelf: 'center',
                px: 3,
                py: 1,
                borderRadius: '50px',
                bgcolor: isDark ? `${theme.red.primary}15` : `${theme.red.primary}10`,
                border: `1px solid ${theme.red.primary}40`,
                backdropFilter: 'blur(10px)',
                animation: 'float 3s ease-in-out infinite',
                '@keyframes float': {
                  '0%, 100%': { transform: 'translateY(0px)' },
                  '50%': { transform: 'translateY(-10px)' },
                },
              }}
            >
              <Typography
                variant="caption"
                sx={{
                  fontWeight: 'bold',
                  letterSpacing: '0.1em',
                  background: `linear-gradient(135deg, ${theme.red.primary}, ${theme.red.light})`,
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                POWERED BY MIDNIGHT NETWORK
              </Typography>
            </Box>

            <Typography
              variant="h1"
              component="h1"
              fontWeight="extrabold"
              sx={{
                fontSize: { xs: '3rem', md: '4.5rem' },
                background: `linear-gradient(135deg, ${theme.red.light} 0%, ${theme.red.primary} 50%, ${theme.red.darker} 100%)`,
                backgroundSize: '200% 200%',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                animation: 'gradientShift 8s ease infinite',
                '@keyframes gradientShift': {
                  '0%, 100%': { backgroundPosition: '0% 50%' },
                  '50%': { backgroundPosition: '100% 50%' },
                },
                textShadow: `0 0 80px ${theme.red.primary}40`,
                letterSpacing: '-0.02em',
              }}
            >
              zkSalaria
            </Typography>
            <Typography
              variant="h4"
              color={theme.text.primary}
              fontWeight="medium"
              sx={{
                fontSize: { xs: '1.5rem', md: '2rem' },
                lineHeight: 1.3,
              }}
            >
              Privacy-Preserving Payroll for the Midnight Network
            </Typography>
            <Typography
              variant="h6"
              color={theme.text.secondary}
              sx={{
                maxWidth: 'sm',
                mx: 'auto',
                fontSize: { xs: '1rem', md: '1.25rem' },
                lineHeight: 1.6,
              }}
            >
              Pay your employees with complete privacy. Encrypted salaries, zero-knowledge proofs, and
              compliance built-in.
            </Typography>
          </Stack>

          {/* CTA Button with Glow */}
          <Box sx={{ position: 'relative' }}>
            {/* Glow effect */}
            <Box
              sx={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '120%',
                height: '120%',
                background: `radial-gradient(circle, ${theme.red.primary}60, transparent 70%)`,
                filter: 'blur(20px)',
                opacity: 0.6,
                animation: 'pulse 2s ease-in-out infinite',
                '@keyframes pulse': {
                  '0%, 100%': { opacity: 0.6, transform: 'translate(-50%, -50%) scale(1)' },
                  '50%': { opacity: 0.8, transform: 'translate(-50%, -50%) scale(1.1)' },
                },
              }}
            />
            <Button
              variant="contained"
              size="large"
              onClick={handleGetStarted}
              sx={{
                position: 'relative',
                px: 8,
                py: 2.5,
                fontSize: '1.2rem',
                fontWeight: 'bold',
                borderRadius: '50px',
                background: `linear-gradient(135deg, ${theme.red.primary} 0%, ${theme.red.dark} 100%)`,
                color: 'white',
                boxShadow: `0 10px 40px ${theme.red.primary}60, 0 0 0 1px ${theme.red.primary}40`,
                border: `1px solid ${theme.red.light}60`,
                '&:hover': {
                  background: `linear-gradient(135deg, ${theme.red.lighter} 0%, ${theme.red.primary} 100%)`,
                  transform: 'translateY(-4px) scale(1.02)',
                  boxShadow: `0 20px 60px ${theme.red.primary}80, 0 0 20px ${theme.red.primary}40`,
                },
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
            >
              Open App →
            </Button>
          </Box>

          {/* Color Palette Showcase */}
          <Box
            sx={{
              width: '100%',
              mt: 8,
              p: 6,
              borderRadius: 3,
              bgcolor: isDark ? theme.bg.paper : `${theme.bg.paper}cc`,
              backdropFilter: 'blur(20px)',
              border: `1px solid ${theme.border}`,
              boxShadow: isDark
                ? `0 4px 24px rgba(0, 0, 0, 0.4), 0 0 0 1px ${theme.borderLight}`
                : `0 4px 24px rgba(0, 0, 0, 0.06), 0 0 0 1px ${theme.border}`,
            }}
          >
            <Typography
              variant="h5"
              fontWeight="bold"
              gutterBottom
              sx={{
                mb: 4,
                background: `linear-gradient(135deg, ${theme.text.primary}, ${theme.text.secondary})`,
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Deep Red (#800517) × Charcoal Theme
            </Typography>

            {/* Button Variations */}
            <Stack spacing={3} sx={{ mb: 6 }}>
              <Typography variant="subtitle1" fontWeight="medium" color={theme.text.secondary}>
                Button Variations
              </Typography>
              <Stack direction="row" spacing={2} flexWrap="wrap" gap={2}>
                {/* Primary - Deep Red */}
                <Button
                  variant="contained"
                  sx={{ bgcolor: theme.red.primary, color: 'white', '&:hover': { bgcolor: theme.red.dark } }}
                >
                  Pay Employee
                </Button>

                {/* Lighter Red */}
                <Button
                  variant="contained"
                  sx={{ bgcolor: theme.red.light, color: 'white', '&:hover': { bgcolor: theme.red.primary } }}
                >
                  Withdraw Salary
                </Button>

                {/* Charcoal */}
                <Button
                  variant="contained"
                  sx={{ bgcolor: CHARCOAL[900], color: 'white', '&:hover': { bgcolor: CHARCOAL[800] } }}
                >
                  Generate ZK Proof
                </Button>

                {/* Outlined Red */}
                <Button
                  variant="outlined"
                  sx={{
                    borderColor: theme.red.primary,
                    color: theme.red.primary,
                    '&:hover': { borderColor: theme.red.dark, bgcolor: `${theme.red.primary}10` }
                  }}
                >
                  Cancel Payment
                </Button>

                {/* Outlined Charcoal */}
                <Button
                  variant="outlined"
                  sx={{
                    borderColor: theme.border,
                    color: theme.text.primary,
                    '&:hover': { borderColor: theme.text.primary, bgcolor: theme.bg.surface }
                  }}
                >
                  View Details
                </Button>
              </Stack>
            </Stack>

            {/* Color Cards */}
            <Stack spacing={3}>
              <Typography variant="subtitle1" fontWeight="medium" color={theme.text.secondary}>
                Color Swatches
              </Typography>
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={3}>
                {/* Bright Red - Primary */}
                <Card
                  sx={{
                    flex: 1,
                    background: `linear-gradient(135deg, ${theme.red.primary} 0%, ${theme.red.dark} 100%)`,
                    color: 'white',
                    border: 'none',
                    position: 'relative',
                    overflow: 'hidden',
                    boxShadow: `0 8px 32px ${theme.red.primary}50, 0 0 0 1px ${theme.red.primary}30`,
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      background: 'linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.15) 50%, transparent 70%)',
                      backgroundSize: '200% 200%',
                      animation: 'shimmer 3s ease infinite',
                      '@keyframes shimmer': {
                        '0%, 100%': { backgroundPosition: '200% 0' },
                        '50%': { backgroundPosition: '0% 0' },
                      },
                    },
                  }}
                >
                  <CardContent sx={{ position: 'relative', zIndex: 1 }}>
                    <Typography variant="h6" fontWeight="bold">Bright Red ({theme.red.primary})</Typography>
                    <Typography variant="body2" sx={{ opacity: 0.95 }}>Primary Actions • Payments • CTAs</Typography>
                  </CardContent>
                </Card>

                {/* Dark Navy - Secondary */}
                <Card
                  sx={{
                    flex: 1,
                    background: `linear-gradient(135deg, #1a1d29 0%, #20232e 100%)`,
                    color: 'white',
                    border: 'none',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  <CardContent>
                    <Typography variant="h6" fontWeight="bold">Dark Navy (#1a1d29)</Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>Backgrounds • Cards • Depth</Typography>
                  </CardContent>
                </Card>

                {/* Light Red - Accent */}
                <Card
                  sx={{
                    flex: 1,
                    background: `linear-gradient(135deg, ${theme.red.lighter} 0%, ${theme.red.primary} 100%)`,
                    color: 'white',
                    border: 'none',
                    position: 'relative',
                    overflow: 'hidden',
                    boxShadow: `0 8px 32px ${theme.red.lighter}40`,
                  }}
                >
                  <CardContent>
                    <Typography variant="h6" fontWeight="bold">Light Red ({theme.red.lighter})</Typography>
                    <Typography variant="body2" sx={{ opacity: 0.95 }}>Highlights • Hovers • Accents</Typography>
                  </CardContent>
                </Card>
              </Stack>
            </Stack>

            {/* Status States */}
            <Stack spacing={3} sx={{ mt: 4 }}>
              <Typography variant="subtitle1" fontWeight="medium" color={theme.text.secondary}>
                Status Indicators
              </Typography>
              <Stack direction="row" spacing={2} flexWrap="wrap" gap={2}>
                <Box sx={{ px: 3, py: 1.5, bgcolor: '#10b981', color: 'white', borderRadius: 1 }}>
                  ✓ Payment Successful
                </Box>
                <Box sx={{ px: 3, py: 1.5, bgcolor: theme.red.primary, color: 'white', borderRadius: 1 }}>
                  ✗ Payment Failed
                </Box>
                <Box sx={{ px: 3, py: 1.5, bgcolor: '#f59e0b', color: 'white', borderRadius: 1 }}>
                  ⚠ Pending Approval
                </Box>
                <Box sx={{ px: 3, py: 1.5, bgcolor: CHARCOAL[900], color: 'white', borderRadius: 1 }}>
                  🔒 Encrypted
                </Box>
              </Stack>
            </Stack>

            {/* Usage Examples */}
            <Stack spacing={3} sx={{ mt: 4 }}>
              <Typography variant="subtitle1" fontWeight="medium" color={theme.text.secondary}>
                Real-World Usage
              </Typography>
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                {/* Payment Card Example - Better contrast */}
                <Card
                  sx={{
                    flex: 1,
                    bgcolor: isDark ? theme.bg.surface : theme.bg.paper,
                    border: `1px solid ${isDark ? theme.red.primary : theme.border}`,
                    color: theme.text.primary,
                    position: 'relative',
                    overflow: 'hidden',
                    boxShadow: isDark
                      ? `0 4px 16px rgba(0, 0, 0, 0.4), 0 0 0 1px ${theme.red.primary}60, inset 0 1px 0 0 ${theme.red.primary}20`
                      : `0 2px 8px rgba(0, 0, 0, 0.08)`,
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: isDark
                        ? `0 12px 32px rgba(0, 0, 0, 0.5), 0 0 0 1px ${theme.red.primary}, 0 0 20px ${theme.red.primary}30`
                        : `0 8px 24px rgba(0, 0, 0, 0.12)`,
                      borderColor: theme.red.lighter,
                    },
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: -50,
                      right: -50,
                      width: '150px',
                      height: '150px',
                      background: `radial-gradient(circle, ${theme.red.primary}25, transparent 70%)`,
                      filter: 'blur(40px)',
                    },
                  }}
                >
                  <CardContent sx={{ position: 'relative', zIndex: 1 }}>
                    <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                      <Box
                        sx={{
                          width: 10,
                          height: 10,
                          bgcolor: theme.red.primary,
                          borderRadius: '50%',
                          boxShadow: `0 0 10px ${theme.red.primary}`,
                          animation: 'pulse 2s ease-in-out infinite',
                        }}
                      />
                      <Typography variant="caption" fontWeight="bold" color={theme.text.secondary}>
                        ACTIVE
                      </Typography>
                    </Stack>
                    <Typography variant="h5" fontWeight="bold" color={theme.text.primary}>
                      $5,000.00
                    </Typography>
                    <Typography variant="body2" color={theme.text.secondary} sx={{ mb: 2 }}>
                      Monthly Salary
                    </Typography>
                    <Button
                      fullWidth
                      variant="contained"
                      size="small"
                      sx={{
                        mt: 2,
                        background: `linear-gradient(135deg, ${theme.red.primary}, ${theme.red.dark})`,
                        color: 'white',
                        fontWeight: 'bold',
                        boxShadow: `0 4px 12px ${theme.red.primary}40`,
                        border: `1px solid ${theme.red.lighter}30`,
                        '&:hover': {
                          background: `linear-gradient(135deg, ${theme.red.lighter}, ${theme.red.primary})`,
                          transform: 'scale(1.02)',
                          boxShadow: `0 6px 20px ${theme.red.primary}60`,
                        },
                        transition: 'all 0.2s ease',
                      }}
                    >
                      Pay Now
                    </Button>
                  </CardContent>
                </Card>

                {/* ZK Proof Card Example - Sablier-inspired */}
                <Card
                  sx={{
                    flex: 1,
                    bgcolor: isDark ? theme.bg.surface : theme.bg.paper,
                    border: `1px solid ${theme.border}`,
                    color: theme.text.primary,
                    position: 'relative',
                    overflow: 'hidden',
                    boxShadow: isDark
                      ? `0 2px 8px rgba(0, 0, 0, 0.3), inset 0 0 0 1px ${theme.borderLight}`
                      : `0 2px 8px rgba(0, 0, 0, 0.08)`,
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: isDark
                        ? `0 8px 24px rgba(0, 0, 0, 0.4), inset 0 0 0 1px ${theme.border}`
                        : `0 8px 24px rgba(0, 0, 0, 0.12)`,
                    },
                  }}
                >
                  <CardContent sx={{ position: 'relative', zIndex: 1 }}>
                    <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                      <Box
                        sx={{
                          width: 10,
                          height: 10,
                          bgcolor: CHARCOAL[600],
                          borderRadius: '50%',
                          border: `2px solid ${CHARCOAL[400]}`,
                        }}
                      />
                      <Typography variant="caption" fontWeight="bold" color={theme.text.secondary}>
                        ENCRYPTED
                      </Typography>
                    </Stack>
                    <Typography variant="h5" fontWeight="bold" color={theme.text.primary}>
                      Income Proof
                    </Typography>
                    <Typography variant="body2" color={theme.text.secondary} sx={{ mb: 2 }}>
                      Zero-Knowledge Verification
                    </Typography>
                    <Button
                      fullWidth
                      variant="contained"
                      size="small"
                      sx={{
                        mt: 2,
                        background: `linear-gradient(135deg, ${CHARCOAL[900]}, ${CHARCOAL[800]})`,
                        color: 'white',
                        fontWeight: 'bold',
                        '&:hover': {
                          background: `linear-gradient(135deg, ${CHARCOAL[800]}, ${CHARCOAL[700]})`,
                          transform: 'scale(1.02)',
                        },
                        transition: 'all 0.2s ease',
                      }}
                    >
                      Generate Proof
                    </Button>
                  </CardContent>
                </Card>
              </Stack>
            </Stack>
          </Box>

          {/* Feature Cards */}
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            spacing={3}
            sx={{ mt: 8, width: '100%' }}
          >
            <FeatureCard
              icon={<LockIcon sx={{ fontSize: 48, color: theme.red.primary }} />}
              title="Private Payroll"
              description="Manage encrypted employee payments on-chain. Only you and your employees can see salary amounts."
              theme={theme}
            />
            <FeatureCard
              icon={<VerifiedUserIcon sx={{ fontSize: 48, color: theme.red.primary }} />}
              title="ZK Verification"
              description="Employees generate zero-knowledge proofs of income without revealing exact amounts to lenders or landlords."
              theme={theme}
            />
            <FeatureCard
              icon={<AssessmentIcon sx={{ fontSize: 48, color: theme.red.light }} />}
              title="Compliance Ready"
              description="Built-in audit disclosures and employment verification for regulatory requirements."
              theme={theme}
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
          bgcolor: theme.bg.paper,
          borderTop: 1,
          borderColor: theme.border,
        }}
      >
        <Container maxWidth="lg">
          <Typography variant="body2" color={theme.text.secondary} align="center">
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
  theme: any;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon, title, description, theme }) => {
  const isDark = theme.bg.default === '#13151f';

  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: isDark ? theme.bg.surface : theme.bg.paper,
        border: `1px solid ${theme.border}`,
        color: theme.text.primary,
        position: 'relative',
        overflow: 'hidden',
        boxShadow: isDark
          ? `0 2px 8px rgba(0, 0, 0, 0.3), inset 0 0 0 1px ${theme.borderLight}`
          : `0 2px 8px rgba(0, 0, 0, 0.06)`,
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: '-50%',
          left: '-50%',
          width: '200%',
          height: '200%',
          background: `radial-gradient(circle, ${theme.red.primary}12, transparent 50%)`,
          opacity: 0,
          transition: 'opacity 0.3s ease',
        },
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: isDark
            ? `0 12px 32px rgba(0, 0, 0, 0.5), 0 0 0 1px ${theme.red.primary}80, 0 0 20px ${theme.red.primary}25`
            : `0 12px 32px rgba(0, 0, 0, 0.12)`,
          borderColor: isDark ? theme.red.primary : theme.red.primary,
          '&::before': {
            opacity: 1,
          },
        },
      }}
    >
      <CardContent sx={{ flexGrow: 1, textAlign: 'center', p: 4, position: 'relative', zIndex: 1 }}>
        <Box
          sx={{
            mb: 3,
            display: 'inline-flex',
            p: 2,
            borderRadius: '16px',
            bgcolor: `${theme.red.primary}15`,
            border: `1px solid ${theme.red.primary}30`,
          }}
        >
          {icon}
        </Box>
        <Typography variant="h6" component="h3" gutterBottom fontWeight="bold" color={theme.text.primary}>
          {title}
        </Typography>
        <Typography variant="body2" color={theme.text.secondary} sx={{ lineHeight: 1.7 }}>
          {description}
        </Typography>
      </CardContent>
    </Card>
  );
};
