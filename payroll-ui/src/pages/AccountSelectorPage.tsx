// @ts-nocheck - MUI Grid v5/v6 compatibility issues (runtime works fine)
import React from 'react';
import {
  Box,
  Container,
  Typography,
  Stack,
  Paper,
  Grid,
  Chip,
  Divider,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import BusinessIcon from '@mui/icons-material/Business';
import BadgeIcon from '@mui/icons-material/Badge';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import AddBusinessIcon from '@mui/icons-material/AddBusiness';
import { useTheme, useThemeValues, createGlassMorphism } from '../theme';
import { usePayrollWallet } from '../contexts/PayrollWalletContext';
import { listCompanies, setCurrentCompany, type SavedCompany } from '../utils/CompaniesLocalState';
import { listEmployers, setCurrentEmployer, type EmployerContract } from '../utils/EmployerContractsLocalState';

/**
 * Unified Account Selector Page
 * Shows "Add New Account" actions at top, existing accounts below
 * User must select which account to use - no default selection
 */
export const AccountSelectorPage: React.FC = () => {
  const navigate = useNavigate();
  const { mode } = useTheme();
  const theme = useThemeValues();
  const { walletAddress } = usePayrollWallet();

  const companies = listCompanies();
  const employers = walletAddress ? listEmployers(walletAddress) : [];
  const hasAccounts = companies.length > 0 || employers.length > 0;

  const handleSelectCompany = (company: SavedCompany) => {
    setCurrentCompany(company.contractAddress);
    navigate('/dashboard');
  };

  const handleSelectEmployer = (employer: EmployerContract) => {
    setCurrentEmployer(employer.contractAddress);
    navigate('/dashboard');
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: theme.colors.background.default,
        py: 6,
      }}
    >
      <Container maxWidth="lg">
        <Stack spacing={6}>
          {/* Header */}
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h3" fontWeight={theme.typography.fontWeight.bold} color={theme.colors.text.primary}>
              Select Account
            </Typography>
            <Typography variant="h6" color={theme.colors.text.secondary} sx={{ mt: 1 }}>
              Choose which account you want to access
            </Typography>
          </Box>

          {/* Add New Account Section - Large Cards (Top) */}
          <Box>
            <Typography
              variant="h5"
              fontWeight={theme.typography.fontWeight.semibold}
              color={theme.colors.text.primary}
              sx={{ mb: 3, textAlign: 'center' }}
            >
              Add New Account
            </Typography>
            <Stack
              direction={{ xs: 'column', md: 'row' }}
              spacing={4}
              sx={{ maxWidth: 900, mx: 'auto' }}
            >
              {/* Join as Employee Card */}
              <Paper
                elevation={0}
                onClick={() => navigate('/onboarding/employee')}
                sx={{
                  ...createGlassMorphism(theme, mode),
                  flex: 1,
                  p: 6,
                  borderRadius: theme.borderRadius['2xl'],
                  border: `1px solid ${theme.colors.border.default}`,
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    borderColor: theme.colors.secondary[500],
                    transform: 'translateY(-4px)',
                    boxShadow: `0 12px 24px rgba(0, 0, 0, 0.15), 0 0 0 2px ${theme.colors.secondary[500]}40`,
                  },
                }}
              >
                <Stack spacing={3} alignItems="center">
                  <PersonAddIcon
                    sx={{
                      fontSize: 64,
                      color: theme.colors.secondary[500],
                    }}
                  />
                  <Typography
                    variant="h4"
                    fontWeight={theme.typography.fontWeight.bold}
                    color={theme.colors.text.primary}
                  >
                    Join as Employee
                  </Typography>
                  <Typography
                    variant="body1"
                    color={theme.colors.text.secondary}
                    sx={{ maxWidth: 280, textAlign: 'center' }}
                  >
                    Enter your employer's contract address to connect and view your salary
                  </Typography>
                </Stack>
              </Paper>

              {/* Create New Company Card */}
              <Paper
                elevation={0}
                onClick={() => navigate('/onboarding/company')}
                sx={{
                  ...createGlassMorphism(theme, mode),
                  flex: 1,
                  p: 6,
                  borderRadius: theme.borderRadius['2xl'],
                  border: `1px solid ${theme.colors.border.default}`,
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    borderColor: theme.colors.primary[500],
                    transform: 'translateY(-4px)',
                    boxShadow: `0 12px 24px rgba(0, 0, 0, 0.15), 0 0 0 2px ${theme.colors.primary[500]}40`,
                  },
                }}
              >
                <Stack spacing={3} alignItems="center">
                  <AddBusinessIcon
                    sx={{
                      fontSize: 64,
                      color: theme.colors.primary[500],
                    }}
                  />
                  <Typography
                    variant="h4"
                    fontWeight={theme.typography.fontWeight.bold}
                    color={theme.colors.text.primary}
                  >
                    Create Company
                  </Typography>
                  <Typography
                    variant="body1"
                    color={theme.colors.text.secondary}
                    sx={{ maxWidth: 280, textAlign: 'center' }}
                  >
                    Set up a new company to manage payroll and employees
                  </Typography>
                </Stack>
              </Paper>
            </Stack>
          </Box>

          {/* Divider (only show if there are existing accounts) */}
          {hasAccounts && (
            <Divider sx={{ my: 4 }}>
              <Typography variant="body2" color={theme.colors.text.disabled}>
                OR SELECT EXISTING ACCOUNT
              </Typography>
            </Divider>
          )}

          {/* Companies Section (Owner) */}
          {companies.length > 0 && (
            <Paper
              elevation={3}
              sx={{
                p: 4,
                borderRadius: 3,
                bgcolor: mode === 'dark' ? theme.colors.background.paper : '#FFFFFF',
              }}
            >
              <Stack spacing={3}>
                <Stack direction="row" alignItems="center" spacing={2}>
                  <BusinessIcon sx={{ fontSize: 28, color: theme.colors.primary[500] }} />
                  <Typography variant="h6" fontWeight={theme.typography.fontWeight.semibold}>
                    Your Companies
                  </Typography>
                  <Chip
                    label="Owner"
                    size="small"
                    sx={{
                      bgcolor: theme.colors.primary[100],
                      color: theme.colors.primary[700],
                      fontWeight: theme.typography.fontWeight.semibold,
                    }}
                  />
                </Stack>

                <Grid container spacing={2}>
                  {companies.map((company) => (
                    <Grid item xs={12} key={company.contractAddress}>
                      <Paper
                        elevation={1}
                        sx={{
                          p: 3,
                          borderRadius: 2,
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          border: `2px solid transparent`,
                          '&:hover': {
                            borderColor: theme.colors.primary[500],
                            transform: 'translateY(-2px)',
                            boxShadow: `0 4px 12px ${theme.colors.primary[500]}40`,
                          },
                        }}
                        onClick={() => handleSelectCompany(company)}
                      >
                        <Stack direction="row" alignItems="center" justifyContent="space-between">
                          <Stack spacing={0.5}>
                            <Typography variant="h6" fontWeight={theme.typography.fontWeight.semibold}>
                              {company.name}
                            </Typography>
                            <Typography variant="caption" color={theme.colors.text.secondary} sx={{ fontFamily: 'monospace' }}>
                              {company.contractAddress.slice(0, 20)}...
                            </Typography>
                            {company.industry && (
                              <Typography variant="body2" color={theme.colors.text.secondary}>
                                {company.industry}
                              </Typography>
                            )}
                          </Stack>
                          <ArrowForwardIcon sx={{ color: theme.colors.primary[500] }} />
                        </Stack>
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
              </Stack>
            </Paper>
          )}

          {/* Employers Section (Employee) */}
          {employers.length > 0 && (
            <Paper
              elevation={3}
              sx={{
                p: 4,
                borderRadius: 3,
                bgcolor: mode === 'dark' ? theme.colors.background.paper : '#FFFFFF',
              }}
            >
              <Stack spacing={3}>
                <Stack direction="row" alignItems="center" spacing={2}>
                  <BadgeIcon sx={{ fontSize: 28, color: theme.colors.secondary[500] }} />
                  <Typography variant="h6" fontWeight={theme.typography.fontWeight.semibold}>
                    Employed At
                  </Typography>
                  <Chip
                    label="Employee"
                    size="small"
                    sx={{
                      bgcolor: theme.colors.secondary[100],
                      color: theme.colors.secondary[700],
                      fontWeight: theme.typography.fontWeight.semibold,
                    }}
                  />
                </Stack>

                <Grid container spacing={2}>
                  {employers.map((employer) => (
                    <Grid item xs={12} key={employer.contractAddress}>
                      <Paper
                        elevation={1}
                        sx={{
                          p: 3,
                          borderRadius: 2,
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          border: `2px solid transparent`,
                          '&:hover': {
                            borderColor: theme.colors.secondary[500],
                            transform: 'translateY(-2px)',
                            boxShadow: `0 4px 12px ${theme.colors.secondary[500]}40`,
                          },
                        }}
                        onClick={() => handleSelectEmployer(employer)}
                      >
                        <Stack direction="row" alignItems="center" justifyContent="space-between">
                          <Stack spacing={0.5}>
                            <Typography variant="h6" fontWeight={theme.typography.fontWeight.semibold}>
                              {employer.companyName}
                            </Typography>
                            <Typography variant="caption" color={theme.colors.text.secondary} sx={{ fontFamily: 'monospace' }}>
                              {employer.contractAddress.slice(0, 20)}...
                            </Typography>
                            <Typography variant="body2" color={theme.colors.text.secondary}>
                              Joined {new Date(employer.joinedAt).toLocaleDateString()}
                            </Typography>
                          </Stack>
                          <ArrowForwardIcon sx={{ color: theme.colors.secondary[500] }} />
                        </Stack>
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
              </Stack>
            </Paper>
          )}
        </Stack>
      </Container>
    </Box>
  );
};
