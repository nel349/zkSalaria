import React from 'react';
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
import {
  useTheme,
  useThemeValues,
  createMeshGradient,
  createGridPattern,
  createFloatingBadge,
  createGradientText,
  createTextShadow,
  createGlowEffect,
  createPrimaryCTA,
  createGlassMorphism,
  createAccentShadow,
} from '../theme';

/**
 * Sample Theme Playground for zkSalaria
 * Now uses the formalized theme system from @zkSalaria/payroll-ui/src/theme/
 * Based on Teal/Cyan × Charcoal color scheme
 *
 * Access via: /theme-playground
 */
export const SampleThemePage: React.FC = () => {
  const navigate = useNavigate();
  const { mode, toggleTheme } = useTheme();
  const formalTheme = useThemeValues();

  const handleGetStarted = () => {
    navigate('/connect');
  };

  const isDark = mode === 'dark';

  // Map formalized theme to component structure
  const theme = {
    bg: {
      default: formalTheme.colors.background.default,
      paper: formalTheme.colors.background.paper,
      surface: formalTheme.colors.background.surface,
      elevated: formalTheme.colors.background.elevated,
    },
    text: {
      primary: formalTheme.colors.text.primary,
      secondary: formalTheme.colors.text.secondary,
      tertiary: formalTheme.colors.text.disabled,
      inverse: formalTheme.colors.text.inverse,
    },
    border: formalTheme.colors.border.default,
    borderLight: formalTheme.colors.border.light,
    accent: {
      primary: isDark ? formalTheme.colors.primary[400] : formalTheme.colors.primary[600],
      light: isDark ? formalTheme.colors.primary[300] : formalTheme.colors.primary[500],
      lighter: isDark ? formalTheme.colors.primary[200] : formalTheme.colors.primary[400],
      dark: isDark ? formalTheme.colors.primary[500] : formalTheme.colors.primary[700],
      darker: isDark ? formalTheme.colors.primary[600] : formalTheme.colors.primary[800],
    },
    charcoal: formalTheme.colors.secondary,
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
      <Box sx={createMeshGradient(formalTheme, mode)} />

      {/* Subtle Grid Pattern - Sablier style */}
      <Box sx={createGridPattern(formalTheme, mode)} />

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
            onClick={toggleTheme}
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
            <Box sx={createFloatingBadge(formalTheme, mode)}>
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
                ...createGradientText(formalTheme, mode),
                fontSize: { xs: '3rem', md: '4.5rem' },
                textShadow: createTextShadow(formalTheme, mode, 'md'),
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
            <Box sx={createGlowEffect(formalTheme, mode)} />
            <Button
              variant="contained"
              size="large"
              onClick={handleGetStarted}
              sx={createPrimaryCTA(formalTheme, mode)}
            >
              Open App →
            </Button>
          </Box>

          {/* Color Palette Showcase */}
          <Box
            sx={{
              ...createGlassMorphism(formalTheme, mode),
              width: '100%',
              mt: 8,
              p: 6,
              borderRadius: 3,
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
                  sx={{ bgcolor: theme.charcoal[900], color: 'white', '&:hover': { bgcolor: theme.charcoal[800] } }}
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
                    boxShadow: createAccentShadow(formalTheme, mode, 'md'),
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

                {/* Dark Navy/Light Gray - Secondary */}
                <Card
                  sx={{
                    flex: 1,
                    background: isDark
                      ? `linear-gradient(135deg, ${theme.bg.paper} 0%, ${theme.bg.surface} 100%)`
                      : `linear-gradient(135deg, ${theme.charcoal[100]} 0%, ${theme.charcoal[200]} 100%)`,
                    color: isDark ? 'white' : theme.charcoal[900],
                    border: isDark ? `2px solid ${theme.border}` : 'none',
                    position: 'relative',
                    overflow: 'hidden',
                    boxShadow: isDark
                      ? `0 4px 16px rgba(0, 0, 0, 0.3), inset 0 0 0 1px rgba(255, 255, 255, 0.1)`
                      : `0 4px 16px rgba(0, 0, 0, 0.1)`,
                  }}
                >
                  <CardContent>
                    <Typography variant="h6" fontWeight="bold">
                      {isDark ? `Dark Navy (${theme.bg.paper})` : `Light Gray (${theme.charcoal[100]})`}
                    </Typography>
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
                    boxShadow: createAccentShadow(formalTheme, mode, 'md'),
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
                <Box sx={{ px: 3, py: 1.5, bgcolor: theme.charcoal[900], color: 'white', borderRadius: 1 }}>
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
                          bgcolor: theme.charcoal[600],
                          borderRadius: '50%',
                          border: `2px solid ${theme.charcoal[400]}`,
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
                        background: `linear-gradient(135deg, ${theme.charcoal[900]}, ${theme.charcoal[800]})`,
                        color: 'white',
                fontWeight: 'bold',
                        '&:hover': {
                          background: `linear-gradient(135deg, ${theme.charcoal[800]}, ${theme.charcoal[700]})`,
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
