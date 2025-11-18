import React from 'react';
import { Box, Container, Typography, Stack, Paper } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import BusinessIcon from '@mui/icons-material/Business';
import PersonIcon from '@mui/icons-material/Person';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import { useTheme, useThemeValues, createGlassMorphism } from '../theme';

/**
 * Role Selector Page - Phase 1.4 (Placeholder)
 * New users choose between Company, Employee, or Auditor onboarding
 * Reference: docs/design/AUTH_ONBOARDING_FLOW.md (Page 6)
 */
export const RoleSelectorPage: React.FC = () => {
  const navigate = useNavigate();
  const { mode } = useTheme();
  const theme = useThemeValues();

  const handleCompanySelect = () => {
    console.log('[RoleSelector] User selected: Company');
    navigate('/onboarding/company');
  };

  const handleEmployeeSelect = () => {
    console.log('[RoleSelector] User selected: Employee');
    navigate('/onboarding/employee');
  };

  const handleAuditorSelect = () => {
    console.log('[RoleSelector] User selected: Auditor');
    navigate('/auditor');
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: theme.colors.background.default,
      }}
    >
      <Container maxWidth="md">
        <Stack spacing={6} alignItems="center" textAlign="center">
          {/* Header */}
          <Stack spacing={2}>
            <Typography
              variant="h3"
              fontWeight={theme.typography.fontWeight.bold}
              color={theme.colors.text.primary}
            >
              Welcome to zkSalaria! 👋
            </Typography>
            <Typography
              variant="h6"
              color={theme.colors.text.secondary}
              sx={{ maxWidth: 600 }}
            >
              Are you here as a company, an employee, or an auditor?
            </Typography>
          </Stack>

          {/* Role Cards */}
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            spacing={4}
            sx={{ width: '100%', maxWidth: 800 }}
          >
            {/* Company Card */}
            <Paper
              elevation={0}
              onClick={handleCompanySelect}
              sx={{
                ...createGlassMorphism(theme, mode),
                flex: 1,
                p: 6,
                borderRadius: theme.borderRadius['2xl'],
                border: `1px solid ${theme.colors.border.default}`,
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                '&:hover': {
                  borderColor: theme.colors.primary[mode === 'dark' ? 400 : 600],
                  transform: 'translateY(-4px)',
                  boxShadow: `0 12px 24px rgba(0, 0, 0, 0.15), 0 0 0 2px ${theme.colors.primary[mode === 'dark' ? 400 : 600]}40`,
                },
              }}
            >
              <Stack spacing={3} alignItems="center">
                <BusinessIcon
                  sx={{
                    fontSize: 64,
                    color: theme.colors.primary[mode === 'dark' ? 400 : 600],
                  }}
                />
                <Typography
                  variant="h4"
                  fontWeight={theme.typography.fontWeight.bold}
                  color={theme.colors.text.primary}
                >
                  Company
                </Typography>
                <Typography
                  variant="body1"
                  color={theme.colors.text.secondary}
                  sx={{ maxWidth: 280 }}
                >
                  I want to pay my employees with private, encrypted payroll
                </Typography>
              </Stack>
            </Paper>

            {/* Employee Card */}
            <Paper
              elevation={0}
              onClick={handleEmployeeSelect}
              sx={{
                ...createGlassMorphism(theme, mode),
                flex: 1,
                p: 6,
                borderRadius: theme.borderRadius['2xl'],
                border: `1px solid ${theme.colors.border.default}`,
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                '&:hover': {
                  borderColor: theme.colors.primary[mode === 'dark' ? 400 : 600],
                  transform: 'translateY(-4px)',
                  boxShadow: `0 12px 24px rgba(0, 0, 0, 0.15), 0 0 0 2px ${theme.colors.primary[mode === 'dark' ? 400 : 600]}40`,
                },
              }}
            >
              <Stack spacing={3} alignItems="center">
                <PersonIcon
                  sx={{
                    fontSize: 64,
                    color: theme.colors.primary[mode === 'dark' ? 400 : 600],
                  }}
                />
                <Typography
                  variant="h4"
                  fontWeight={theme.typography.fontWeight.bold}
                  color={theme.colors.text.primary}
                >
                  Employee
                </Typography>
                <Typography
                  variant="body1"
                  color={theme.colors.text.secondary}
                  sx={{ maxWidth: 280 }}
                >
                  I receive salary from my employer and want to verify my income
                </Typography>
              </Stack>
            </Paper>

            {/* Auditor Card */}
            <Paper
              elevation={0}
              onClick={handleAuditorSelect}
              sx={{
                ...createGlassMorphism(theme, mode),
                flex: 1,
                p: 6,
                borderRadius: theme.borderRadius['2xl'],
                border: `1px solid ${theme.colors.border.default}`,
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                '&:hover': {
                  borderColor: theme.colors.primary[mode === 'dark' ? 400 : 600],
                  transform: 'translateY(-4px)',
                  boxShadow: `0 12px 24px rgba(0, 0, 0, 0.15), 0 0 0 2px ${theme.colors.primary[mode === 'dark' ? 400 : 600]}40`,
                },
              }}
            >
              <Stack spacing={3} alignItems="center">
                <VerifiedUserIcon
                  sx={{
                    fontSize: 64,
                    color: theme.colors.primary[mode === 'dark' ? 400 : 600],
                  }}
                />
                <Typography
                  variant="h4"
                  fontWeight={theme.typography.fontWeight.bold}
                  color={theme.colors.text.primary}
                >
                  Auditor
                </Typography>
                <Typography
                  variant="body1"
                  color={theme.colors.text.secondary}
                  sx={{ maxWidth: 280 }}
                >
                  I'm a licensed CPA and want to verify income proofs
                </Typography>
              </Stack>
            </Paper>
          </Stack>

          {/* Helper Text */}
          <Typography variant="caption" color={theme.colors.text.disabled}>
            Don't worry, you can access all views if you need to
          </Typography>
        </Stack>
      </Container>
    </Box>
  );
};
