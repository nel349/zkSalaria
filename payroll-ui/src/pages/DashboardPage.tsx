import React, { useState, useEffect, useCallback } from 'react';
import { Box, CircularProgress, Alert } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { firstValueFrom } from 'rxjs';
import { useThemeValues } from '../theme';
import { usePayrollWallet } from '../contexts/PayrollWalletContext';
import { listCompanies, getCurrentCompany, setCurrentCompany } from '../utils/CompaniesLocalState';
import { PayrollAPI, type DeployedPayrollAPI } from '@zksalaria/payroll-api';
import { CompanyDashboard } from '../components/CompanyDashboard';
import { EmployeeDashboard } from '../components/EmployeeDashboard';
import pino from 'pino';

const logger = pino({
  name: 'dashboard',
  level: 'info',
  browser: {
    asObject: false,
  },
});

type UserRole = 'company' | 'employee' | 'both' | 'none';

/**
 * Role-Aware Dashboard Router (Phase 3.1 & 3.2)
 * Detects user role and renders appropriate dashboard view
 */
export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const theme = useThemeValues();
  const { walletAddress, providers } = usePayrollWallet();

  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCompanyAddress, setSelectedCompanyAddress] = useState<string | null>(getCurrentCompany());

  const companies = listCompanies();
  const currentCompany = companies.find((c) => c.contractAddress === selectedCompanyAddress);

  // Handle company switch without page reload
  const handleCompanySwitch = useCallback((contractAddress: string) => {
    setCurrentCompany(contractAddress);
    setSelectedCompanyAddress(contractAddress);
    setLoading(true); // Trigger re-detection and reconnect
  }, []);

  // Detect user role
  useEffect(() => {
    const detectRole = async () => {
      if (!walletAddress) {
        setError('Wallet not connected');
        setLoading(false);
        return;
      }

      try {
        // Check if user is a company
        const isCompany = companies.length > 0 && selectedCompanyAddress !== null;

        // Check if user is an employee (query contract)
        let isEmployee = false;
        if (selectedCompanyAddress) {
          try {
            const api = await PayrollAPI.connect(providers, selectedCompanyAddress, walletAddress, logger);
            const state = await firstValueFrom(api.state$);

            // Check if wallet is in employee_accounts map
            const employeeInfo = state.employees?.get(walletAddress);
            isEmployee = employeeInfo !== undefined;
          } catch (err) {
            console.warn('[Dashboard] Failed to check employee status:', err);
          }
        }

        // Determine role
        if (isCompany && isEmployee) {
          setRole('both'); // Dual role - will need role switcher in Phase 3.6
        } else if (isCompany) {
          setRole('company');
        } else if (isEmployee) {
          setRole('employee');
        } else {
          setRole('none');
          setError('No company or employee role found. Please complete onboarding.');
        }

        setLoading(false);
      } catch (err) {
        console.error('[Dashboard] Role detection failed:', err);
        setError('Failed to detect user role');
        setLoading(false);
      }
    };

    detectRole();
  }, [walletAddress, providers, companies, selectedCompanyAddress]);

  // Loading state
  if (loading) {
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
        <CircularProgress sx={{ color: theme.colors.primary[500] }} />
      </Box>
    );
  }

  // Error state
  if (error || role === 'none') {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: theme.colors.background.default,
          p: 4,
        }}
      >
        <Alert severity="error" sx={{ maxWidth: 600 }}>
          {error || 'No company or employee role found. Please complete onboarding.'}
        </Alert>
      </Box>
    );
  }

  // Render appropriate dashboard based on role
  // For dual role users, default to company view (Phase 3.6 will add role switcher)
  if (role === 'company' || role === 'both') {
    if (!currentCompany) {
      return (
        <Box
          sx={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: theme.colors.background.default,
            p: 4,
          }}
        >
          <Alert severity="warning" sx={{ maxWidth: 600 }}>
            No company selected. Please select a company from the companies page.
          </Alert>
        </Box>
      );
    }

    return <CompanyDashboard currentCompany={currentCompany} companies={companies} onCompanySwitch={handleCompanySwitch} />;
  }

  // Employee view
  if (role === 'employee') {
    if (!selectedCompanyAddress || !currentCompany) {
      return (
        <Box
          sx={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: theme.colors.background.default,
            p: 4,
          }}
        >
          <Alert severity="warning" sx={{ maxWidth: 600 }}>
            No employer contract found. Please contact your employer.
          </Alert>
        </Box>
      );
    }

    return <EmployeeDashboard contractAddress={selectedCompanyAddress} companyName={currentCompany.name} />;
  }

  // Fallback (should never reach here)
  return null;
};
