import React, { useEffect, useState } from 'react';
import { Box, Container, Typography, Stack, Button, Paper } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import AddIcon from '@mui/icons-material/Add';
import { useTheme, useThemeValues, createGlassMorphism, createPrimaryCTA } from '../theme';
import { listCompanies, getCurrentCompany, setCurrentCompany, migrateLegacyCompany } from '../utils/CompaniesLocalState';
import { CompanyCard } from '../components/CompanyCard';

/**
 * Company Selector Page
 * Shows list of all companies when user has multiple companies
 * Allows switching between companies
 */
export const CompanySelectorPage: React.FC = () => {
  const navigate = useNavigate();
  const { mode } = useTheme();
  const theme = useThemeValues();

  const [companies, setCompanies] = useState(listCompanies());
  const [currentCompany, setCurrentCompanyState] = useState<string | null>(getCurrentCompany());

  useEffect(() => {
    // Migrate legacy data
    migrateLegacyCompany();

    // Refresh companies list
    setCompanies(listCompanies());
    setCurrentCompanyState(getCurrentCompany());
  }, []);

  const handleSelectCompany = (contractAddress: string) => {
    setCurrentCompany(contractAddress);
    setCurrentCompanyState(contractAddress);
    navigate('/dashboard');
  };

  const handleCreateNewCompany = () => {
    navigate('/onboarding/company');
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: theme.colors.background.default,
        py: 4,
      }}
    >
      <Container maxWidth="lg">
        <Paper
          elevation={0}
          sx={{
            ...createGlassMorphism(theme, mode),
            p: { xs: 4, md: 6 },
            borderRadius: theme.borderRadius['2xl'],
            border: `1px solid ${theme.colors.border.default}`,
          }}
        >
          <Stack spacing={4}>
            {/* Header */}
            <Stack spacing={2} alignItems="center" textAlign="center">
              <Typography
                variant="h4"
                fontWeight={theme.typography.fontWeight.bold}
                color={theme.colors.text.primary}
              >
                Your Companies
              </Typography>
              <Typography variant="body1" color={theme.colors.text.secondary}>
                Select a company to manage or create a new one
              </Typography>
            </Stack>

            {/* Companies Grid */}
            {companies.length === 0 ? (
              <Box textAlign="center" py={8}>
                <Typography
                  variant="h5"
                  color={theme.colors.text.secondary}
                  gutterBottom
                  sx={{ opacity: 0.7, fontWeight: theme.typography.fontWeight.medium }}
                >
                  No companies yet
                </Typography>
                <Typography variant="body1" color={theme.colors.text.secondary} sx={{ opacity: 0.6, mb: 3 }}>
                  Create your first company to get started with payroll management
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={handleCreateNewCompany}
                  sx={{
                    ...createPrimaryCTA(theme, mode),
                    py: 1.5,
                    px: 4,
                  }}
                >
                  Create First Company
                </Button>
              </Box>
            ) : (
              <>
                <Box
                  display="grid"
                  gridTemplateColumns={{
                    xs: '1fr',
                    md: 'repeat(auto-fit, minmax(350px, 1fr))',
                  }}
                  gap={3}
                >
                  {companies.map((company) => (
                    <CompanyCard
                      key={company.contractAddress}
                      company={company}
                      onSelect={handleSelectCompany}
                      isSelected={currentCompany === company.contractAddress}
                    />
                  ))}
                </Box>

                {/* Create New Company Button */}
                <Box textAlign="center" pt={2}>
                  <Button
                    variant="outlined"
                    startIcon={<AddIcon />}
                    onClick={handleCreateNewCompany}
                    sx={{
                      py: 1.5,
                      px: 4,
                      borderRadius: theme.borderRadius.full,
                      borderColor: theme.colors.border.default,
                      color: theme.colors.text.secondary,
                      '&:hover': {
                        borderColor: theme.colors.border.strong,
                        bgcolor: theme.colors.action.hover,
                      },
                    }}
                  >
                    Create Another Company
                  </Button>
                </Box>
              </>
            )}
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
};
