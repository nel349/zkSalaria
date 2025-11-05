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
 * Teal/Cyan Color Palette (Modern Fintech)
 */
const TEAL = {
  50: '#f0fdfa',   // Very light teal tint
  100: '#ccfbf1',  // Light teal tint
  200: '#99f6e4',  // Lighter teal
  300: '#5eead4',  // Light teal
  400: '#2dd4bf',  // Medium light teal
  500: '#14b8a6',  // Main teal (Tailwind teal-500)
  600: '#0d9488',  // Darker teal
  700: '#0f766e',  // Deep teal
  800: '#115e59',  // Very dark teal
  900: '#134e4a',  // Darkest teal
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
 * Based on Teal/Cyan × Charcoal color scheme
 *
 * Access via: /theme-playground
 */
export const SampleThemePage: React.FC = () => {
  const navigate = useNavigate();
  const [isDark, setIsDark] = useState(true);

  const handleGetStarted = () => {
    navigate('/connect');
  };

  // Theme colors based on mode - Teal/Cyan for modern fintech
  const theme = {
    bg: {
      default: isDark ? '#13151f' : '#ffffff',        // Dark navy instead of black
      paper: isDark ? '#1a1d29' : CHARCOAL[50],       // Slightly lighter navy
      surface: isDark ? '#242835' : CHARCOAL[100],    // Lighter for better contrast
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
    accent: {
      primary: isDark ? TEAL[400] : TEAL[600],     // Bright teal for dark mode
      light: isDark ? TEAL[300] : TEAL[500],
      lighter: isDark ? TEAL[200] : TEAL[400],
      dark: isDark ? TEAL[500] : TEAL[700],
      darker: isDark ? TEAL[600] : TEAL[800],
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
            ? `radial-gradient(ellipse at 20% 20%, ${theme.accent.primary}25 0%, transparent 50%),
               radial-gradient(ellipse at 80% 80%, ${theme.accent.dark}20 0%, transparent 50%),
               radial-gradient(ellipse at 50% 100%, #2d314060 0%, transparent 50%)`
            : `radial-gradient(ellipse at 20% 20%, ${theme.accent.lighter}20 0%, transparent 50%),
               radial-gradient(ellipse at 80% 80%, ${theme.accent.light}15 0%, transparent 50%),
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
            label={ <Typography> {isDark ? "Dark Mode": "Light Mode" } </Typography> }
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
            {isDark ? <LightModeIcon sx={{ fontSize: '1rem', color: 'white' }} /> : <DarkModeIcon sx={{ fontSize: '1rem', color: 'dark' }} />}
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
                bgcolor: isDark ? `${theme.accent.primary}15` : `${theme.accent.primary}10`,
                border: `1px solid ${theme.accent.primary}40`,
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
                  background: `linear-gradient(135deg, ${theme.accent.primary}, ${theme.accent.light})`,
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
                background: `linear-gradient(135deg, ${theme.accent.light} 0%, ${theme.accent.primary} 50%, ${theme.accent.darker} 100%)`,
                backgroundSize: '200% 200%',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                animation: 'gradientShift 8s ease infinite',
                '@keyframes gradientShift': {
                  '0%, 100%': { backgroundPosition: '0% 50%' },
                  '50%': { backgroundPosition: '100% 50%' },
                },
                textShadow: `0 0 80px ${theme.accent.primary}40`,
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
                background: `radial-gradient(circle, ${theme.accent.primary}60, transparent 70%)`,
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
                background: `linear-gradient(135deg, ${theme.accent.primary} 0%, ${theme.accent.dark} 100%)`,
                color: 'white',
                boxShadow: `0 10px 40px ${theme.accent.primary}60, 0 0 0 1px ${theme.accent.primary}40`,
                border: `1px solid ${theme.accent.light}60`,
                '&:hover': {
                  background: `linear-gradient(135deg, ${theme.accent.lighter} 0%, ${theme.accent.primary} 100%)`,
                  transform: 'translateY(-4px) scale(1.02)',
                  boxShadow: `0 20px 60px ${theme.accent.primary}80, 0 0 20px ${theme.accent.primary}40`,
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
              Teal/Cyan × Charcoal Theme
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
                  sx={{ bgcolor: theme.accent.primary, color: 'white', '&:hover': { bgcolor: theme.accent.dark } }}
                >
                  Pay Employee
                </Button>

                {/* Lighter Red */}
                <Button
                  variant="contained"
                  sx={{ bgcolor: theme.accent.light, color: 'white', '&:hover': { bgcolor: theme.accent.primary } }}
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
                    borderColor: theme.accent.primary,
                    color: theme.accent.primary,
                    '&:hover': { borderColor: theme.accent.dark, bgcolor: `${theme.accent.primary}10` }
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
                {/* Teal - Primary */}
                <Card
                  sx={{
                    flex: 1,
                    background: `linear-gradient(135deg, ${theme.accent.primary} 0%, ${theme.accent.dark} 100%)`,
                    color: 'white',
                    border: 'none',
                    position: 'relative',
                    overflow: 'hidden',
                    boxShadow: `0 8px 32px ${theme.accent.primary}50, 0 0 0 1px ${theme.accent.primary}30`,
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
                    <Typography variant="h6" fontWeight="bold">Teal ({theme.accent.primary})</Typography>
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

                {/* Light Teal - Accent */}
                <Card
                  sx={{
                    flex: 1,
                    background: `linear-gradient(135deg, ${theme.accent.lighter} 0%, ${theme.accent.primary} 100%)`,
                    color: 'white',
                    border: 'none',
                    position: 'relative',
                    overflow: 'hidden',
                    boxShadow: `0 8px 32px ${theme.accent.lighter}40`,
                  }}
                >
                  <CardContent>
                    <Typography variant="h6" fontWeight="bold">Light Teal ({theme.accent.lighter})</Typography>
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
                <Box sx={{ px: 3, py: 1.5, bgcolor: '#ef4444', color: 'white', borderRadius: 1 }}>
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
                    border: `1px solid ${isDark ? theme.accent.primary : theme.border}`,
                    color: theme.text.primary,
                    position: 'relative',
                    overflow: 'hidden',
                    boxShadow: isDark
                      ? `0 4px 16px rgba(0, 0, 0, 0.4), 0 0 0 1px ${theme.accent.primary}60, inset 0 1px 0 0 ${theme.accent.primary}20`
                      : `0 2px 8px rgba(0, 0, 0, 0.08)`,
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: isDark
                        ? `0 12px 32px rgba(0, 0, 0, 0.5), 0 0 0 1px ${theme.accent.primary}, 0 0 20px ${theme.accent.primary}30`
                        : `0 8px 24px rgba(0, 0, 0, 0.12)`,
                      borderColor: theme.accent.lighter,
                    },
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: -50,
                      right: -50,
                      width: '150px',
                      height: '150px',
                      background: `radial-gradient(circle, ${theme.accent.primary}25, transparent 70%)`,
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
                          bgcolor: theme.accent.primary,
                          borderRadius: '50%',
                          boxShadow: `0 0 10px ${theme.accent.primary}`,
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
                        background: `linear-gradient(135deg, ${theme.accent.primary}, ${theme.accent.dark})`,
                        color: 'white',
                        fontWeight: 'bold',
                        boxShadow: `0 4px 12px ${theme.accent.primary}40`,
                        border: `1px solid ${theme.accent.lighter}30`,
                        '&:hover': {
                          background: `linear-gradient(135deg, ${theme.accent.lighter}, ${theme.accent.primary})`,
                          transform: 'scale(1.02)',
                          boxShadow: `0 6px 20px ${theme.accent.primary}60`,
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
              icon={<LockIcon sx={{ fontSize: 48, color: theme.accent.primary }} />}
              title="Private Payroll"
              description="Manage encrypted employee payments on-chain. Only you and your employees can see salary amounts."
              theme={theme}
            />
            <FeatureCard
              icon={<VerifiedUserIcon sx={{ fontSize: 48, color: theme.accent.primary }} />}
              title="ZK Verification"
              description="Employees generate zero-knowledge proofs of income without revealing exact amounts to lenders or landlords."
              theme={theme}
            />
            <FeatureCard
              icon={<AssessmentIcon sx={{ fontSize: 48, color: theme.accent.light }} />}
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
          background: `radial-gradient(circle, ${theme.accent.primary}12, transparent 50%)`,
          opacity: 0,
          transition: 'opacity 0.3s ease',
        },
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: isDark
            ? `0 12px 32px rgba(0, 0, 0, 0.5), 0 0 0 1px ${theme.accent.primary}80, 0 0 20px ${theme.accent.primary}25`
            : `0 12px 32px rgba(0, 0, 0, 0.12)`,
          borderColor: isDark ? theme.accent.primary : theme.accent.primary,
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
            bgcolor: `${theme.accent.primary}15`,
            border: `1px solid ${theme.accent.primary}30`,
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
