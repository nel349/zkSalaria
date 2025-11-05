import type { SxProps, Theme as MuiTheme } from '@mui/material/styles';
import type { MidnightCompleteTheme } from './types';

/**
 * Helper function to convert Midnight theme values to Material-UI sx props
 */
export const createMuiSxFromTheme = (
  theme: MidnightCompleteTheme,
  overrides: Partial<SxProps<MuiTheme>> = {}
): SxProps<MuiTheme> => {
  return {
    fontFamily: theme.typography.fontFamily.primary as any,
    color: theme.colors.text.primary as any,
    backgroundColor: theme.colors.background.default as any,
    ...overrides,
  } as SxProps<MuiTheme>;
};

/**
 * Helper to create button styles from theme
 */
export const createButtonStyles = (
  theme: MidnightCompleteTheme,
  variant: 'primary' | 'secondary' | 'outlined' = 'primary'
): SxProps<MuiTheme> => {
  const buttonTheme = theme.components.button[variant];
  
  return {
    backgroundColor: buttonTheme.background,
    color: buttonTheme.text,
    border: `1px solid ${buttonTheme.border}`,
    borderRadius: theme.borderRadius.md,
    fontFamily: theme.typography.fontFamily.primary,
    fontWeight: theme.typography.fontWeight.medium,
    fontSize: theme.typography.fontSize.sm,
    padding: `${theme.spacing[2]} ${theme.spacing[4]}`,
    textTransform: 'none',
    boxShadow: 'none',
    '&:hover': {
      backgroundColor: buttonTheme.backgroundHover,
      boxShadow: 'none',
    },
    '&:active': {
      backgroundColor: buttonTheme.backgroundActive,
      boxShadow: 'none',
    },
    '&:focus': {
      boxShadow: `0 0 0 2px ${theme.colors.action.focus}`,
    },
    '&.Mui-disabled': {
      backgroundColor: theme.colors.action.disabledBackground,
      color: theme.colors.action.disabled,
      border: `1px solid ${theme.colors.border.light}`,
    },
  };
};

/**
 * Helper to create card styles from theme
 */
export const createCardStyles = (theme: MidnightCompleteTheme): SxProps<MuiTheme> => ({
  backgroundColor: theme.components.card.background,
  border: `1px solid ${theme.components.card.border}`,
  borderRadius: theme.borderRadius.lg,
  boxShadow: theme.components.card.shadow,
  color: theme.colors.text.primary,
  padding: theme.spacing[6],
});

/**
 * Helper to create input styles from theme
 */
export const createInputStyles = (theme: MidnightCompleteTheme): SxProps<MuiTheme> => ({
  backgroundColor: theme.components.input.background,
  border: `1px solid ${theme.components.input.border}`,
  borderRadius: theme.borderRadius.md,
  color: theme.components.input.text,
  fontFamily: theme.typography.fontFamily.primary,
  fontSize: theme.typography.fontSize.sm,
  padding: `${theme.spacing[2]} ${theme.spacing[3]}`,
  '&:focus': {
    borderColor: theme.components.input.borderFocus,
    outline: 'none',
    boxShadow: `0 0 0 1px ${theme.components.input.borderFocus}`,
  },
  '&::placeholder': {
    color: theme.components.input.placeholder,
  },
  '& .MuiInputBase-root': {
    backgroundColor: theme.components.input.background,
    color: theme.components.input.text,
    '&:before, &:after': {
      display: 'none',
    },
    '&.Mui-focused': {
      backgroundColor: theme.components.input.background,
    },
  },
  '& .MuiInputLabel-root': {
    color: theme.colors.text.secondary,
    '&.Mui-focused': {
      color: theme.components.input.borderFocus,
    },
  },
  '& .MuiOutlinedInput-root': {
    backgroundColor: theme.components.input.background,
    '& fieldset': {
      borderColor: theme.components.input.border,
    },
    '&:hover fieldset': {
      borderColor: theme.components.input.border,
    },
    '&.Mui-focused fieldset': {
      borderColor: theme.components.input.borderFocus,
    },
  },
});

/**
 * Helper to create consistent spacing using theme values
 */
export const spacing = (theme: MidnightCompleteTheme) => ({
  xs: theme.spacing[1],
  sm: theme.spacing[2],
  md: theme.spacing[4],
  lg: theme.spacing[6],
  xl: theme.spacing[8],
  xxl: theme.spacing[12],
});

/**
 * Helper to create consistent typography styles
 */
export const createTypographyStyles = (
  theme: MidnightCompleteTheme,
  variant: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'body1' | 'body2' | 'caption' | 'subtitle1' | 'subtitle2' = 'body1'
): SxProps<MuiTheme> => {
  const fontSizeMap = {
    h1: theme.typography.fontSize['5xl'],
    h2: theme.typography.fontSize['4xl'],
    h3: theme.typography.fontSize['3xl'],
    h4: theme.typography.fontSize['2xl'],
    h5: theme.typography.fontSize.xl,
    h6: theme.typography.fontSize.lg,
    subtitle1: theme.typography.fontSize.base,
    subtitle2: theme.typography.fontSize.sm,
    body1: theme.typography.fontSize.base,
    body2: theme.typography.fontSize.sm,
    caption: theme.typography.fontSize.xs,
  };

  const fontWeightMap = {
    h1: theme.typography.fontWeight.bold,
    h2: theme.typography.fontWeight.bold,
    h3: theme.typography.fontWeight.semibold,
    h4: theme.typography.fontWeight.semibold,
    h5: theme.typography.fontWeight.medium,
    h6: theme.typography.fontWeight.medium,
    subtitle1: theme.typography.fontWeight.medium,
    subtitle2: theme.typography.fontWeight.normal,
    body1: theme.typography.fontWeight.normal,
    body2: theme.typography.fontWeight.normal,
    caption: theme.typography.fontWeight.normal,
  };

  return {
    fontSize: fontSizeMap[variant],
    fontWeight: fontWeightMap[variant],
    fontFamily: theme.typography.fontFamily.primary,
    lineHeight: theme.typography.lineHeight.normal,
    color: theme.colors.text.primary,
  };
};

/**
 * Helper to create responsive breakpoint styles
 */
export const createBreakpointStyles = (theme: MidnightCompleteTheme) => ({
  up: {
    sm: `@media (min-width: ${theme.breakpoints.sm})`,
    md: `@media (min-width: ${theme.breakpoints.md})`,
    lg: `@media (min-width: ${theme.breakpoints.lg})`,
    xl: `@media (min-width: ${theme.breakpoints.xl})`,
    '2xl': `@media (min-width: ${theme.breakpoints['2xl']})`,
  },
  down: {
    sm: `@media (max-width: calc(${theme.breakpoints.sm} - 1px))`,
    md: `@media (max-width: calc(${theme.breakpoints.md} - 1px))`,
    lg: `@media (max-width: calc(${theme.breakpoints.lg} - 1px))`,
    xl: `@media (max-width: calc(${theme.breakpoints.xl} - 1px))`,
    '2xl': `@media (max-width: calc(${theme.breakpoints['2xl']} - 1px))`,
  },
});

/**
 * Helper to create consistent elevation/shadow styles
 */
export const createElevationStyles = (
  theme: MidnightCompleteTheme,
  elevation: keyof typeof theme.shadows = 'default'
): SxProps<MuiTheme> => ({
  boxShadow: theme.shadows[elevation],
});

/**
 * Quick color accessors for common theme colors
 */
export const colors = (theme: MidnightCompleteTheme) => ({
  primary: theme.colors.primary[500],
  primaryHover: theme.colors.primary[600],
  secondary: theme.colors.secondary[500],
  secondaryHover: theme.colors.secondary[600],
  success: theme.colors.success[500],
  warning: theme.colors.warning[500],
  error: theme.colors.error[500],
  info: theme.colors.info[500],
  background: theme.colors.background.default,
  surface: theme.colors.background.paper,
  elevated: theme.colors.background.elevated,
  textPrimary: theme.colors.text.primary,
  textSecondary: theme.colors.text.secondary,
  textDisabled: theme.colors.text.disabled,
  border: theme.colors.border.default,
  borderLight: theme.colors.border.light,
  borderStrong: theme.colors.border.strong,
});

/**
 * Helper to apply focus ring styles consistently
 */
export const createFocusRingStyles = (theme: MidnightCompleteTheme): SxProps<MuiTheme> => ({
  '&:focus': {
    outline: 'none',
    boxShadow: `0 0 0 2px ${theme.colors.action.focus}`,
  },
});

/**
 * Helper to apply hover states consistently
 */
export const createHoverStyles = (
  theme: MidnightCompleteTheme,
  backgroundColor?: string
): SxProps<MuiTheme> => ({
  '&:hover': {
    backgroundColor: backgroundColor || theme.colors.action.hover,
    cursor: 'pointer',
  },
});

/**
 * Helper to create gradient backgrounds (primary accent color)
 */
export const createGradientBackground = (
  theme: MidnightCompleteTheme,
  mode: 'light' | 'dark' = 'dark',
  angle: number = 135
): string => {
  if (mode === 'dark') {
    // Brighter gradient for dark mode
    return `linear-gradient(${angle}deg, ${theme.colors.primary[400]} 0%, ${theme.colors.primary[500]} 100%)`;
  } else {
    // Darker gradient for light mode
    return `linear-gradient(${angle}deg, ${theme.colors.primary[600]} 0%, ${theme.colors.primary[700]} 100%)`;
  }
};

/**
 * Helper to create animated gradient backgrounds
 */
export const createAnimatedGradient = (
  theme: MidnightCompleteTheme,
  mode: 'light' | 'dark' = 'dark'
): SxProps<MuiTheme> => {
  const [start, mid, end] = mode === 'dark'
    ? [theme.colors.primary[300], theme.colors.primary[400], theme.colors.primary[600]]
    : [theme.colors.primary[500], theme.colors.primary[600], theme.colors.primary[800]];

  return {
    background: `linear-gradient(135deg, ${start} 0%, ${mid} 50%, ${end} 100%)`,
    backgroundSize: '200% 200%',
    animation: 'gradientShift 8s ease infinite',
    '@keyframes gradientShift': {
      '0%, 100%': { backgroundPosition: '0% 50%' },
      '50%': { backgroundPosition: '100% 50%' },
    },
  };
};

/**
 * Helper to create gradient text effect
 */
export const createGradientText = (
  theme: MidnightCompleteTheme,
  mode: 'light' | 'dark' = 'dark'
): SxProps<MuiTheme> => {
  const [start, mid, end] = mode === 'dark'
    ? [theme.colors.primary[300], theme.colors.primary[400], theme.colors.primary[600]]
    : [theme.colors.primary[500], theme.colors.primary[600], theme.colors.primary[800]];

  return {
    background: `linear-gradient(135deg, ${start} 0%, ${mid} 50%, ${end} 100%)`,
    backgroundSize: '200% 200%',
    backgroundClip: 'text',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    animation: 'gradientShift 8s ease infinite',
    '@keyframes gradientShift': {
      '0%, 100%': { backgroundPosition: '0% 50%' },
      '50%': { backgroundPosition: '100% 50%' },
    },
  };
};

/**
 * Helper to create multi-layer shadows with accent color
 */
export const createAccentShadow = (
  theme: MidnightCompleteTheme,
  mode: 'light' | 'dark' = 'dark',
  intensity: 'sm' | 'md' | 'lg' = 'md'
): string => {
  const accentColor = mode === 'dark' ? theme.colors.primary[400] : theme.colors.primary[600];

  const shadows = {
    sm: `0 4px 12px ${accentColor}40, 0 0 0 1px ${accentColor}20`,
    md: `0 8px 32px ${accentColor}50, 0 0 0 1px ${accentColor}30`,
    lg: `0 10px 40px ${accentColor}60, 0 0 0 1px ${accentColor}40`,
  };

  return shadows[intensity];
};

/**
 * Helper to create glass morphism effect
 */
export const createGlassMorphism = (
  theme: MidnightCompleteTheme,
  mode: 'light' | 'dark' = 'dark'
): SxProps<MuiTheme> => ({
  bgcolor: mode === 'dark' ? `${theme.colors.background.paper}cc` : `${theme.colors.background.paper}cc`,
  backdropFilter: 'blur(20px)',
  border: `1px solid ${theme.colors.border.default}`,
  boxShadow: mode === 'dark'
    ? `0 4px 24px rgba(0, 0, 0, 0.4), 0 0 0 1px ${theme.colors.border.light}`
    : `0 4px 24px rgba(0, 0, 0, 0.06), 0 0 0 1px ${theme.colors.border.default}`,
});

/**
 * Helper to create glow effect (for CTA buttons, etc.)
 */
export const createGlowEffect = (
  theme: MidnightCompleteTheme,
  mode: 'light' | 'dark' = 'dark'
): SxProps<MuiTheme> => {
  const accentColor = mode === 'dark' ? theme.colors.primary[400] : theme.colors.primary[600];

  return {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '120%',
    height: '120%',
    background: `radial-gradient(circle, ${accentColor}60, transparent 70%)`,
    filter: 'blur(20px)',
    opacity: 0.6,
    animation: 'pulse 2s ease-in-out infinite',
    '@keyframes pulse': {
      '0%, 100%': { opacity: 0.6, transform: 'translate(-50%, -50%) scale(1)' },
      '50%': { opacity: 0.8, transform: 'translate(-50%, -50%) scale(1.1)' },
    },
    pointerEvents: 'none',
  };
};

/**
 * Helper to create text shadow with accent color
 */
export const createTextShadow = (
  theme: MidnightCompleteTheme,
  mode: 'light' | 'dark' = 'dark',
  intensity: 'sm' | 'md' | 'lg' = 'md'
): string => {
  const accentColor = mode === 'dark' ? theme.colors.primary[400] : theme.colors.primary[600];

  const shadows = {
    sm: `0 0 40px ${accentColor}30`,
    md: `0 0 80px ${accentColor}40`,
    lg: `0 0 120px ${accentColor}50`,
  };

  return shadows[intensity];
};

/**
 * Helper to create primary CTA button with all effects
 */
export const createPrimaryCTA = (
  theme: MidnightCompleteTheme,
  mode: 'light' | 'dark' = 'dark'
): SxProps<MuiTheme> => {
  const accentPrimary = mode === 'dark' ? theme.colors.primary[400] : theme.colors.primary[600];
  const accentDark = mode === 'dark' ? theme.colors.primary[500] : theme.colors.primary[700];
  const accentLighter = mode === 'dark' ? theme.colors.primary[200] : theme.colors.primary[500];
  const accentLight = mode === 'dark' ? theme.colors.primary[300] : theme.colors.primary[600];

  return {
    position: 'relative',
    px: 8,
    py: 2.5,
    fontSize: '1.2rem',
    fontWeight: 'bold',
    borderRadius: '50px',
    background: `linear-gradient(135deg, ${accentPrimary} 0%, ${accentDark} 100%)`,
    color: 'white',
    boxShadow: `0 10px 40px ${accentPrimary}60, 0 0 0 1px ${accentPrimary}40`,
    border: `1px solid ${accentLight}60`,
    '&:hover': {
      background: `linear-gradient(135deg, ${accentLighter} 0%, ${accentPrimary} 100%)`,
      transform: 'translateY(-4px) scale(1.02)',
      boxShadow: `0 20px 60px ${accentPrimary}80, 0 0 20px ${accentPrimary}40`,
    },
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  };
};

/**
 * Helper to create floating badge effect
 */
export const createFloatingBadge = (
  theme: MidnightCompleteTheme,
  mode: 'light' | 'dark' = 'dark'
): SxProps<MuiTheme> => {
  const accentPrimary = mode === 'dark' ? theme.colors.primary[400] : theme.colors.primary[600];

  return {
    px: 3,
    py: 1,
    borderRadius: '50px',
    bgcolor: mode === 'dark' ? `${accentPrimary}15` : `${accentPrimary}10`,
    border: `1px solid ${accentPrimary}40`,
    backdropFilter: 'blur(10px)',
    animation: 'float 3s ease-in-out infinite',
    '@keyframes float': {
      '0%, 100%': { transform: 'translateY(0px)' },
      '50%': { transform: 'translateY(-10px)' },
    },
  };
};

/**
 * Helper to create mesh gradient background
 */
export const createMeshGradient = (
  theme: MidnightCompleteTheme,
  mode: 'light' | 'dark' = 'dark'
): SxProps<MuiTheme> => {
  const accentPrimary = mode === 'dark' ? theme.colors.primary[400] : theme.colors.primary[400];
  const accentDark = mode === 'dark' ? theme.colors.primary[500] : theme.colors.primary[500];
  const secondary = mode === 'dark' ? '#2d3140' : theme.colors.secondary[200];

  return {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
    opacity: mode === 'dark' ? 0.3 : 0.25,
    background: mode === 'dark'
      ? `radial-gradient(ellipse at 20% 20%, ${accentPrimary}25 0%, transparent 50%),
         radial-gradient(ellipse at 80% 80%, ${accentDark}20 0%, transparent 50%),
         radial-gradient(ellipse at 50% 100%, ${secondary}60 0%, transparent 50%)`
      : `radial-gradient(ellipse at 20% 20%, ${theme.colors.primary[200]}20 0%, transparent 50%),
         radial-gradient(ellipse at 80% 80%, ${theme.colors.primary[300]}15 0%, transparent 50%),
         radial-gradient(ellipse at 50% 50%, ${secondary}30 0%, transparent 50%)`,
    filter: 'blur(100px)',
    animation: 'meshGradient 20s ease infinite',
    '@keyframes meshGradient': {
      '0%, 100%': { transform: 'scale(1) rotate(0deg)' },
      '50%': { transform: 'scale(1.2) rotate(5deg)' },
    },
    pointerEvents: 'none',
  };
};

/**
 * Helper to create subtle grid pattern background
 */
export const createGridPattern = (
  theme: MidnightCompleteTheme,
  mode: 'light' | 'dark' = 'dark'
): SxProps<MuiTheme> => ({
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  zIndex: 1,
  opacity: mode === 'dark' ? 0.02 : 0.015,
  backgroundImage: mode === 'dark'
    ? `linear-gradient(${theme.colors.border.default} 1px, transparent 1px),
       linear-gradient(90deg, ${theme.colors.border.default} 1px, transparent 1px)`
    : `linear-gradient(${theme.colors.secondary[200]} 1px, transparent 1px),
       linear-gradient(90deg, ${theme.colors.secondary[200]} 1px, transparent 1px)`,
  backgroundSize: '50px 50px',
  pointerEvents: 'none',
});
