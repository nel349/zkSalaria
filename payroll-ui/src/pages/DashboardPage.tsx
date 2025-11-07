import React, { useState, useEffect, useCallback } from 'react';
import { Box, CircularProgress, Alert } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useThemeValues } from '../theme';
import { usePayrollWallet } from '../contexts/PayrollWalletContext';
import { listCompanies, getCurrentCompany, setCurrentCompany } from '../utils/CompaniesLocalState';
import { listEmployers, getCurrentEmployer, setCurrentEmployer } from '../utils/EmployerContractsLocalState';
import { PayrollAPI } from '@zksalaria/payroll-api';
import { CompanyDashboard } from '../components/CompanyDashboard';
import { EmployeeDashboard } from '../components/EmployeeDashboard';
import { WalletConnectionPrompt } from '../components/WalletConnectionPrompt';
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
  const { walletAddress, isConnecting, isConnected, connect, providers } = usePayrollWallet();

  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize with either current company (if owner) or current employer (if employee)
  // Prefer company for dual-role users
  const initialAddress = getCurrentCompany() || getCurrentEmployer();
  const [selectedCompanyAddress, setSelectedCompanyAddress] = useState<string | null>(initialAddress);

  const companies = listCompanies();
  const employers = walletAddress ? listEmployers(walletAddress) : [];

  // Look for company info in both lists and normalize to SavedCompany shape
  const companyMatch = companies.find((c) => c.contractAddress === selectedCompanyAddress);
  const employerMatch = employers.find((e) => e.contractAddress === selectedCompanyAddress);

  const currentCompany = companyMatch || (employerMatch ? {
    name: employerMatch.companyName,
    contractAddress: selectedCompanyAddress!,
    walletAddress: walletAddress || '',
    createdAt: employerMatch.joinedAt,
  } : undefined);

  // Handle company switch without page reload
  const handleCompanySwitch = useCallback((contractAddress: string) => {
    setCurrentCompany(contractAddress);
    setSelectedCompanyAddress(contractAddress);
    setLoading(true);
  }, []);

  useEffect(() => {
    const detectRole = async () => {
      if (!walletAddress) {
        if (!isConnecting) {
          setLoading(false);
        }
        return;
      }

      try {
        // Check if user is a company owner
        const isCompanyOwner = companies.length > 0;

        // Check if user has employer contracts
        const hasEmployers = employers.length > 0;

        // If we have a selected address, verify the role at that contract
        let isEmployeeAtContract = false;
        let isOwnerAtContract = false;

        if (selectedCompanyAddress) {
          try {
            // Check if this address is in the company list (user is owner)
            isOwnerAtContract = companies.some((c) => c.contractAddress === selectedCompanyAddress);

            // Query contract to see if wallet is an employee
            const api = await PayrollAPI.connect(providers, selectedCompanyAddress, walletAddress, logger);

            // Use API method to check employee status
            const employeeInfo = await api.getEmployeeInfo(walletAddress);
            isEmployeeAtContract = employeeInfo.exists;
          } catch (err) {
            console.warn('[Dashboard] Failed to check contract status:', err);
          }
        }

        // Determine overall role (can own companies AND be employee elsewhere)
        const isCompany = isCompanyOwner || isOwnerAtContract;
        const isEmployee = hasEmployers || isEmployeeAtContract;

        // Determine role
        if (isCompany && isEmployee) {
          setRole('both');
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
  }, [walletAddress, isConnecting, providers, companies, employers, selectedCompanyAddress]);

  if (!isConnected && !isConnecting) {
    return <WalletConnectionPrompt onConnect={connect} />;
  }

  if (loading || isConnecting) {
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

  // For dual role users, default to company view
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
