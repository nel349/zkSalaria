import React from 'react';
import { Box, Typography, Stack } from '@mui/material';
import { useThemeValues, useTheme } from '../theme';

export interface SectionHeaderProps {
  title: string;
  description?: string;
  align?: 'left' | 'center' | 'right';
  maxWidth?: string | number;
}

/**
 * Reusable section header component
 * Used for consistent section headings throughout the app
 */
export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  description,
  align = 'center',
  maxWidth = '640px',
}) => {
  const theme = useThemeValues();
  const { mode } = useTheme();

  return (
    <Stack
      spacing={2}
      alignItems={align === 'center' ? 'center' : align === 'right' ? 'flex-end' : 'flex-start'}
      sx={{
        textAlign: align,
        maxWidth: align === 'center' ? maxWidth : '100%',
        mx: align === 'center' ? 'auto' : 0,
      }}
    >
      <Typography
        variant="h2"
        component="h2"
        sx={{
          color: theme.colors.text.primary,
          fontWeight: theme.typography.fontWeight.bold,
        }}
      >
        {title}
      </Typography>

      {description && (
        <Typography
          variant="h6"
          sx={{
            color: theme.colors.text.secondary,
            lineHeight: 1.6,
          }}
        >
          {description}
        </Typography>
      )}
    </Stack>
  );
};
