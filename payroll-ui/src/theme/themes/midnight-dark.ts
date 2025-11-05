// zkSalaria Dark Theme - Privacy-Preserving Payroll
// Modern fintech theme with teal/cyan accents and dark navy backgrounds

import type { MidnightCompleteTheme } from '../types';

export const midnightDarkTheme: MidnightCompleteTheme = {
  name: 'zkSalaria Dark',

  colors: {
    // Primary colors - Teal/Cyan (Modern Fintech Brand Color)
    primary: {
      50: '#f0fdfa',   // Very light teal tint
      100: '#ccfbf1',  // Light teal tint
      200: '#99f6e4',  // Lighter teal
      300: '#5eead4',  // Light teal
      400: '#2dd4bf',  // Medium light teal (main for dark mode)
      500: '#14b8a6',  // Main teal (Tailwind teal-500)
      600: '#0d9488',  // Darker teal
      700: '#0f766e',  // Deep teal
      800: '#115e59',  // Very dark teal
      900: '#134e4a',  // Darkest teal
      950: '#0f3d39',  // Almost black teal
    },

    // Secondary colors - Charcoal/Gray (Neutral UI Elements)
    secondary: {
      50: '#f9fafb',   // Very light gray
      100: '#f3f4f6',  // Light gray
      200: '#e5e7eb',  // Lighter gray
      300: '#d1d5db',  // Light gray
      400: '#9ca3af',  // Medium gray
      500: '#6b7280',  // Gray
      600: '#4b5563',  // Dark gray
      700: '#374151',  // Darker gray
      800: '#1f2937',  // Dark slate
      900: '#1a1d29',  // Dark navy
      950: '#13151f',  // Darkest navy (not pure black)
    },
    
    // Semantic colors - Dark theme variants
    success: {
      50: '#ecfdf5',   // Light green background
      500: '#10b981',  // Success green
      700: '#047857',  // Dark success green
    },
    
    warning: {
      50: '#fffbeb',   // Light yellow background
      500: '#f59e0b',  // Warning amber
      700: '#b45309',  // Dark warning amber
    },
    
    error: {
      50: '#fef2f2',   // Light red background
      500: '#ef4444',  // Error red
      700: '#b91c1c',  // Dark error red
    },
    
    info: {
      50: '#eff6ff',   // Light blue background
      500: '#3b82f6',  // Info blue
      700: '#1d4ed8',  // Dark info blue
    },
    
    // Background colors - Dark navy (Sablier-inspired, not pure black)
    background: {
      default: '#13151f',    // Darkest navy background (not pure black)
      paper: '#1a1d29',      // Dark navy for cards/surfaces
      surface: '#242835',    // Lighter surface elements
      elevated: '#2d3140',   // Elevated components (modals, etc.)
    },

    // Text colors - High contrast on dark navy
    text: {
      primary: '#f8f9fa',     // Very light gray for primary text
      secondary: '#a8adb7',   // Medium light gray for secondary text
      disabled: '#6b7280',    // Medium gray for disabled text
      inverse: '#13151f',     // Dark navy (for use on light backgrounds)
    },

    // Border and divider colors - Visible on dark navy
    border: {
      default: '#363b4d',     // Medium border - visible on dark navy
      light: '#2a2f3e',       // Subtle border
      strong: '#4b5563',      // Strong border - high contrast
    },

    // Action colors (hover, focus, etc.)
    action: {
      hover: 'rgba(255, 255, 255, 0.08)',           // Subtle white hover
      selected: 'rgba(45, 212, 191, 0.15)',         // Teal selected state
      disabled: 'rgba(255, 255, 255, 0.38)',        // Disabled state
      disabledBackground: 'rgba(255, 255, 255, 0.12)', // Disabled background
      focus: 'rgba(45, 212, 191, 0.4)',             // Teal focus ring
    },
  },
  
  typography: {
    fontFamily: {
      primary: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      mono: 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace',
    },
    
    fontSize: {
      xs: '0.75rem',    // 12px
      sm: '0.875rem',   // 14px
      base: '1rem',     // 16px
      lg: '1.125rem',   // 18px
      xl: '1.25rem',    // 20px
      '2xl': '1.5rem',  // 24px
      '3xl': '1.875rem', // 30px
      '4xl': '2.25rem', // 36px
      '5xl': '3rem',    // 48px
    },
    
    fontWeight: {
      light: 300,
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
      extrabold: 800,
    },
    
    lineHeight: {
      none: 1,
      tight: 1.25,
      snug: 1.375,
      normal: 1.5,
      relaxed: 1.625,
      loose: 2,
    },
  },
  
  spacing: {
    px: '1px',
    0: '0',
    1: '0.25rem',   // 4px
    2: '0.5rem',    // 8px
    3: '0.75rem',   // 12px
    4: '1rem',      // 16px
    5: '1.25rem',   // 20px
    6: '1.5rem',    // 24px
    8: '2rem',      // 32px
    10: '2.5rem',   // 40px
    12: '3rem',     // 48px
    16: '4rem',     // 64px
    20: '5rem',     // 80px
    24: '6rem',     // 96px
    32: '8rem',     // 128px
    40: '10rem',    // 160px
    48: '12rem',    // 192px
    56: '14rem',    // 224px
    64: '16rem',    // 256px
  },
  
  borderRadius: {
    none: '0',
    sm: '0.125rem',     // 2px
    default: '0.25rem', // 4px
    md: '0.375rem',     // 6px
    lg: '0.5rem',       // 8px
    xl: '0.75rem',      // 12px
    '2xl': '1rem',      // 16px
    full: '9999px',     // Fully rounded
  },
  
  shadows: {
    none: 'none',
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    default: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
  },
  
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },
  
  // Component-specific theme overrides
  components: {
    button: {
      primary: {
        background: 'linear-gradient(135deg, #2dd4bf 0%, #0d9488 100%)', // Teal gradient
        backgroundHover: 'linear-gradient(135deg, #5eead4 0%, #14b8a6 100%)', // Lighter teal on hover
        backgroundActive: 'linear-gradient(135deg, #14b8a6 0%, #0f766e 100%)', // Darker teal on active
        text: '#ffffff',              // White text
        border: '#2dd4bf',            // Teal border
      },
      secondary: {
        background: '#242835',        // Dark navy secondary
        backgroundHover: '#2d3140',   // Slightly lighter on hover
        backgroundActive: '#1a1d29',  // Darker on active
        text: '#f8f9fa',              // Light text
        border: '#363b4d',            // Medium border
      },
      outlined: {
        background: 'transparent',    // Transparent background
        backgroundHover: 'rgba(45, 212, 191, 0.08)', // Teal hover tint
        backgroundActive: 'rgba(45, 212, 191, 0.15)', // Teal active tint
        text: '#2dd4bf',              // Teal text
        border: '#2dd4bf',            // Teal border
      },
    },

    card: {
      background: '#1a1d29',          // Dark navy card background
      border: '#363b4d',              // Visible border on dark navy
      shadow: '0 8px 32px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(45, 212, 191, 0.1)', // Multi-layer shadow with teal accent
    },

    input: {
      background: '#242835',          // Slightly lighter navy for inputs
      border: '#363b4d',              // Visible border
      borderFocus: '#2dd4bf',         // Teal focus border
      text: '#f8f9fa',                // Light text
      placeholder: '#6b7280',         // Medium gray placeholder
    },
  },
};
