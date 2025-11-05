import React, { ReactNode } from 'react';
import { Card, CardContent, Typography, Stack, Link as MuiLink, Box } from '@mui/material';
import { useThemeValues, useTheme, createAccentShadow } from '../theme';

export interface FeatureCardProps {
  icon: ReactNode;
  title: string;
  description: string;
  linkText?: string;
  linkHref?: string;
  onLinkClick?: () => void;
}

/**
 * Reusable feature/use case card component
 * Displays an icon, title, description, and optional CTA link
 */
export const FeatureCard: React.FC<FeatureCardProps> = ({
  icon,
  title,
  description,
  linkText = 'Learn More →',
  linkHref = '#',
  onLinkClick,
}) => {
  const theme = useThemeValues();
  const { mode } = useTheme();

  const handleLinkClick = (e: React.MouseEvent) => {
    if (onLinkClick) {
      e.preventDefault();
      onLinkClick();
    }
  };

  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: theme.colors.background.paper,
        border: `1px solid ${theme.colors.border.default}`,
        borderRadius: theme.borderRadius.lg,
        p: theme.spacing[4],
        transition: 'all 0.3s ease',
        '&:hover': {
          borderColor: theme.colors.primary[mode === 'dark' ? 400 : 600],
          transform: 'translateY(-4px)',
          boxShadow: createAccentShadow(theme, mode, 'md'),
        },
      }}
    >
      <CardContent sx={{ p: 0, '&:last-child': { pb: 0 }, flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Stack spacing={3}>
          {/* Icon */}
          <Box sx={{ fontSize: '64px' }}>
            {icon}
          </Box>

          {/* Title */}
          <Typography
            variant="h5"
            component="h3"
            sx={{
              color: theme.colors.text.primary,
              fontWeight: theme.typography.fontWeight.semibold,
            }}
          >
            {title}
          </Typography>

          {/* Description */}
          <Typography
            variant="body2"
            sx={{
              color: theme.colors.text.secondary,
              lineHeight: 1.6,
              flex: 1,
            }}
          >
            {description}
          </Typography>

          {/* CTA Link */}
          <MuiLink
            href={linkHref}
            onClick={handleLinkClick}
            underline="none"
            sx={{
              color: theme.colors.primary[mode === 'dark' ? 400 : 600],
              fontWeight: theme.typography.fontWeight.medium,
              fontSize: theme.typography.fontSize.sm,
              transition: 'color 0.2s ease',
              '&:hover': {
                color: theme.colors.primary[mode === 'dark' ? 300 : 500],
                textDecoration: 'underline',
              },
            }}
          >
            {linkText}
          </MuiLink>
        </Stack>
      </CardContent>
    </Card>
  );
};
