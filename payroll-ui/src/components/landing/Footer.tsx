import React from 'react';
import { Container, Box, Typography, Stack, Link as MuiLink, IconButton } from '@mui/material';
import { useThemeValues, useTheme } from '../../theme';
import LockIcon from '@mui/icons-material/Lock';
import TwitterIcon from '@mui/icons-material/Twitter';
import GitHubIcon from '@mui/icons-material/GitHub';
import { SiDiscord } from 'react-icons/si';

interface FooterColumn {
  title: string;
  links: { label: string; href: string }[];
}

/**
 * Footer - Section 7 of Landing Page
 * Footer navigation and copyright
 */
export const Footer: React.FC = () => {
  const theme = useThemeValues();
  const { mode } = useTheme();

  const footerColumns: FooterColumn[] = [
    {
      title: 'Product',
      links: [
        { label: 'Features', href: '#' },
        { label: 'Pricing', href: '#' },
        { label: 'Use Cases', href: '#' },
        { label: 'Roadmap', href: '#' },
      ],
    },
    {
      title: 'Developers',
      links: [
        { label: 'Documentation', href: 'https://docs.midnight.network' },
        { label: 'SDK', href: '#' },
        { label: 'API', href: '#' },
        { label: 'GitHub', href: 'https://github.com' },
      ],
    },
    {
      title: 'Company',
      links: [
        { label: 'About', href: '#' },
        { label: 'Blog', href: '#' },
        { label: 'Careers', href: '#' },
        { label: 'Contact', href: '#' },
      ],
    },
  ];

  const socialLinks = [
    { icon: <TwitterIcon />, href: 'https://twitter.com', label: 'Twitter' },
    { icon: <GitHubIcon />, href: 'https://github.com', label: 'GitHub' },
    { icon: <SiDiscord size={24} />, href: 'https://discord.com', label: 'Discord' },
  ];

  return (
    <Box
      sx={{
        bgcolor: mode === 'dark' ? 'rgba(19, 21, 31, 0.98)' : theme.colors.background.surface,
        borderTop: `1px solid ${theme.colors.border.default}`,
        py: theme.spacing[8],
      }}
    >
      <Container maxWidth="lg">
        {/* Main Footer Content */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(2, 1fr)',
              md: '2fr repeat(3, 1fr)',
            },
            gap: 4,
            mb: 6,
          }}
        >
          {/* Brand Column */}
          <Box sx={{ maxWidth: '240px' }}>
            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
              <LockIcon
                sx={{
                  fontSize: 32,
                  color: theme.colors.primary[mode === 'dark' ? 400 : 600],
                }}
              />
              <Typography
                variant="h6"
                sx={{
                  color: theme.colors.text.primary,
                  fontWeight: theme.typography.fontWeight.bold,
                }}
              >
                zkSalaria
              </Typography>
            </Stack>
            <Typography
              variant="body2"
              sx={{
                color: theme.colors.text.secondary,
                lineHeight: 1.6,
              }}
            >
              Private payroll powered by zero-knowledge proofs.
            </Typography>
          </Box>

          {/* Link Columns */}
          {footerColumns.map((column, index) => (
            <Box key={index}>
              <Typography
                variant="subtitle2"
                sx={{
                  color: theme.colors.text.primary,
                  fontWeight: theme.typography.fontWeight.semibold,
                  mb: 2,
                }}
              >
                {column.title}
              </Typography>
              <Stack spacing={1.5}>
                {column.links.map((link, idx) => (
                  <MuiLink
                    key={idx}
                    href={link.href}
                    underline="none"
                    sx={{
                      color: theme.colors.text.secondary,
                      fontSize: theme.typography.fontSize.sm,
                      transition: 'color 0.2s ease',
                      '&:hover': {
                        color: theme.colors.primary[mode === 'dark' ? 400 : 600],
                        textDecoration: 'underline',
                      },
                    }}
                  >
                    {link.label}
                  </MuiLink>
                ))}
              </Stack>
            </Box>
          ))}
        </Box>

        {/* Bottom Bar */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 2,
            pt: 4,
            borderTop: `1px solid ${theme.colors.border.default}`,
          }}
        >
          {/* Copyright */}
          <Typography
            variant="caption"
            sx={{
              color: theme.colors.text.secondary,
            }}
          >
            © 2025 zkSalaria. All rights reserved.
          </Typography>

          {/* Social Links */}
          <Stack direction="row" spacing={1}>
            {socialLinks.map((social, index) => (
              <IconButton
                key={index}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={social.label}
                sx={{
                  color: theme.colors.text.secondary,
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    color: theme.colors.primary[mode === 'dark' ? 400 : 600],
                    transform: 'scale(1.1)',
                  },
                }}
              >
                {social.icon}
              </IconButton>
            ))}
          </Stack>
        </Box>
      </Container>
    </Box>
  );
};
