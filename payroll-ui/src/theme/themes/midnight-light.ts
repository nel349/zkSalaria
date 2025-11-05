// zkSalaria Light Theme - Privacy-Preserving Payroll
// Clean light theme with teal/cyan accents and crisp white backgrounds

import type { MidnightCompleteTheme } from '../types';

export const midnightLightTheme: MidnightCompleteTheme = {
  name: 'zkSalaria Light',

  colors: {
    // Primary colors - Teal/Cyan (Modern Fintech Brand Color)
    primary: {
      50: '#f0fdfa',   // Very light teal tint
      100: '#ccfbf1',  // Light teal tint
      200: '#99f6e4',  // Lighter teal
      300: '#5eead4',  // Light teal
      400: '#2dd4bf',  // Medium light teal
      500: '#14b8a6',  // Main teal (Tailwind teal-500)
      600: '#0d9488',  // Darker teal (main for light mode)
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
      950: '#13151f',  // Darkest navy
    },
    
    // Semantic colors - Dark variants for light theme
    success: {
      50: '#ecfdf5',   // Light green background
      500: '#047857',  // Dark success green
      700: '#065f46',  // Very dark success green
    },
    
    warning: {
      50: '#fffbeb',   // Light yellow background
      500: '#b45309',  // Dark warning amber
      700: '#92400e',  // Very dark warning amber
    },
    
    error: {
      50: '#fef2f2',   // Light red background
      500: '#b91c1c',  // Dark error red
      700: '#991b1b',  // Very dark error red
    },
    
    info: {
      50: '#eff6ff',   // Light blue background
      500: '#1d4ed8',  // Dark info blue
      700: '#1e40af',  // Very dark info blue
    },
    
    // Background colors - Light theme with subtle grays
    background: {
      default: '#ffffff',    // Pure white background
      paper: '#f9fafb',      // Very light gray for cards/surfaces
      surface: '#f3f4f6',    // Light gray surface elements
      elevated: '#e5e7eb',   // Elevated components (modals, etc.)
    },

    // Text colors - High contrast on light backgrounds
    text: {
      primary: '#1a1d29',     // Dark navy for primary text
      secondary: '#4b5563',   // Dark gray for secondary text
      disabled: '#9ca3af',    // Medium gray for disabled text
      inverse: '#ffffff',     // White text (for use on dark/teal elements)
    },

    // Border and divider colors - Visible on light backgrounds
    border: {
      default: '#d1d5db',     // Light gray border
      light: '#e5e7eb',       // Subtle border
      strong: '#9ca3af',      // Strong border
    },

    // Action colors (hover, focus, etc.)
    action: {
      hover: 'rgba(0, 0, 0, 0.04)',             // Subtle dark hover
      selected: 'rgba(13, 148, 136, 0.1)',      // Teal selected state
      disabled: 'rgba(0, 0, 0, 0.38)',          // Disabled state
      disabledBackground: 'rgba(0, 0, 0, 0.12)', // Disabled background
      focus: 'rgba(13, 148, 136, 0.3)',         // Teal focus ring
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
  
  // Component-specific theme overrides - Teal accents on light backgrounds
  components: {
    button: {
      primary: {
        background: 'linear-gradient(135deg, #0d9488 0%, #0f766e 100%)', // Darker teal gradient for light mode
        backgroundHover: 'linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)', // Medium teal on hover
        backgroundActive: 'linear-gradient(135deg, #0f766e 0%, #115e59 100%)', // Deep teal on active
        text: '#ffffff',              // White text
        border: '#0d9488',            // Teal border
      },
      secondary: {
        background: '#f3f4f6',        // Light gray secondary
        backgroundHover: '#e5e7eb',   // Slightly darker on hover
        backgroundActive: '#d1d5db',  // Even darker on active
        text: '#1a1d29',              // Dark text
        border: '#d1d5db',            // Gray border
      },
      outlined: {
        background: 'transparent',    // Transparent background
        backgroundHover: 'rgba(13, 148, 136, 0.04)', // Subtle teal hover
        backgroundActive: 'rgba(13, 148, 136, 0.1)', // Teal active tint
        text: '#0d9488',              // Teal text
        border: '#0d9488',            // Teal border
      },
    },

    card: {
      background: '#ffffff',          // White card background
      border: '#e5e7eb',              // Light gray border
      shadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06), 0 0 0 1px rgba(13, 148, 136, 0.05)', // Shadow with teal accent
    },

    input: {
      background: '#ffffff',          // White input background
      border: '#d1d5db',              // Light gray border
      borderFocus: '#0d9488',         // Teal focus border
      text: '#1a1d29',                // Dark text
      placeholder: '#9ca3af',         // Gray placeholder
    },
  },
};
