import React from 'react';
import { Paper, Typography, Stack, Box, Button, Chip } from '@mui/material';
import BusinessIcon from '@mui/icons-material/Business';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { useTheme, useThemeValues, createGlassMorphism } from '../theme';
import type { SavedCompany } from '../utils/CompaniesLocalState';

export interface CompanyCardProps {
  company: SavedCompany;
  onSelect: (contractAddress: string) => void;
  isSelected?: boolean;
}

export const CompanyCard: React.FC<CompanyCardProps> = ({ company, onSelect, isSelected }) => {
  const { mode } = useTheme();
  const theme = useThemeValues();

  return (
    <Paper
      elevation={0}
      sx={{
        ...createGlassMorphism(theme, mode),
        p: 3,
        borderRadius: theme.borderRadius.xl,
        border: isSelected
          ? `2px solid ${theme.colors.primary[mode === 'dark' ? 400 : 600]}`
          : `1px solid ${theme.colors.border.default}`,
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: mode === 'dark'
            ? '0 8px 24px rgba(0, 0, 0, 0.4)'
            : '0 8px 24px rgba(0, 0, 0, 0.1)',
          borderColor: theme.colors.primary[mode === 'dark' ? 400 : 600],
        },
      }}
      onClick={() => onSelect(company.contractAddress)}
    >
      <Stack spacing={2}>
        {/* Header */}
        <Stack direction="row" alignItems="center" spacing={2}>
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: theme.borderRadius.lg,
              bgcolor: `${theme.colors.primary[mode === 'dark' ? 400 : 600]}20`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <BusinessIcon sx={{ color: theme.colors.primary[mode === 'dark' ? 400 : 600] }} />
          </Box>
          <Box flex={1}>
            <Typography
              variant="h6"
              fontWeight={theme.typography.fontWeight.semibold}
              color={theme.colors.text.primary}
            >
              {company.name}
            </Typography>
            {isSelected && (
              <Chip
                label="Current"
                size="small"
                sx={{
                  mt: 0.5,
                  bgcolor: `${theme.colors.primary[mode === 'dark' ? 400 : 600]}20`,
                  color: theme.colors.primary[mode === 'dark' ? 400 : 600],
                  fontWeight: theme.typography.fontWeight.medium,
                }}
              />
            )}
          </Box>
        </Stack>

        {/* Details */}
        <Stack spacing={1}>
          {company.industry && (
            <Stack direction="row" justifyContent="space-between">
              <Typography variant="body2" color={theme.colors.text.secondary}>
                Industry
              </Typography>
              <Typography variant="body2" color={theme.colors.text.primary}>
                {company.industry}
              </Typography>
            </Stack>
          )}
          {company.size && (
            <Stack direction="row" justifyContent="space-between">
              <Typography variant="body2" color={theme.colors.text.secondary}>
                Size
              </Typography>
              <Typography variant="body2" color={theme.colors.text.primary}>
                {company.size} employees
              </Typography>
            </Stack>
          )}
          <Stack direction="row" justifyContent="space-between">
            <Typography variant="body2" color={theme.colors.text.secondary}>
              Contract
            </Typography>
            <Typography
              variant="body2"
              fontFamily={theme.typography.fontFamily.mono}
              color={theme.colors.text.primary}
              sx={{ fontSize: '0.75rem' }}
            >
              {company.contractAddress.slice(0, 8)}...{company.contractAddress.slice(-6)}
            </Typography>
          </Stack>
        </Stack>

        {/* Action Button */}
        <Button
          variant="outlined"
          fullWidth
          endIcon={<ArrowForwardIcon />}
          sx={{
            mt: 1,
            borderRadius: theme.borderRadius.full,
            borderColor: theme.colors.border.default,
            color: theme.colors.text.primary,
            '&:hover': {
              borderColor: theme.colors.primary[mode === 'dark' ? 400 : 600],
              bgcolor: `${theme.colors.primary[mode === 'dark' ? 400 : 600]}10`,
            },
          }}
        >
          Open Dashboard
        </Button>
      </Stack>
    </Paper>
  );
};
