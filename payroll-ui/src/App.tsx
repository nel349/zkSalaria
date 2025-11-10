import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import {
  LandingPage,
  SampleThemePage,
  ConnectWalletPage,
  RoleDetectionPage,
  RoleSelectorPage,
  AccountSelectorPage,
  CompanyOnboardingPage,
  CompanyQuickStartPage,
  EmployeeOnboardingPage,
  DashboardPage,
  CompanySelectorPage,
  EmployeeListPage,
  ProfileSettingsPage,
  PrivacySettingsPage,
  NotificationSettingsPage,
} from './pages';
import { SettingsLayout } from './components/SettingsLayout';
import { useRuntimeConfiguration } from './config/RuntimeConfiguration';
import { NetworkId, setNetworkId } from '@midnight-ntwrk/midnight-js-network-id';
import { PayrollWalletProvider } from './contexts/PayrollWalletContext';

/**
 * Main App component with routing configuration
 * Phase 3.1: Unified account selection
 *
 * Routing Flow:
 * / → Landing Page
 * /connect → Connect Wallet
 * /loading → Network Validation & Role Detection
 * /selector → Account Selector (existing users with companies/employers)
 * /onboarding/role → Role Selector (new users)
 * /onboarding/company → Company Registration Form
 * /onboarding/company/quickstart → Quick Start Wizard (3 steps)
 * /onboarding/employee → Employee Onboarding (added or pending)
 * /dashboard → Dashboard (company or employee based on role)
 *
 * Follows best practice:
 * - Centralized routing in one place
 * - Clean separation of concerns
 * - Wallet context wraps the entire app for global access
 */
export const App: React.FC = () => {
  const cfg = useRuntimeConfiguration();
  setNetworkId((cfg.NETWORK_ID as NetworkId) ?? NetworkId.Undeployed);

  return (
    <PayrollWalletProvider>
      <BrowserRouter basename="/">
        <Routes>
          {/* Landing page */}
          <Route path="/" element={<LandingPage />} />

          {/* Theme Playground */}
          <Route path="/theme-playground" element={<SampleThemePage />} />

          {/* Wallet connection */}
          <Route path="/connect" element={<ConnectWalletPage />} />

          {/* Network validation & role detection */}
          <Route path="/loading" element={<RoleDetectionPage />} />

          {/* Account selector (existing users) */}
          <Route path="/selector" element={<AccountSelectorPage />} />

          {/* Role selector (new users) */}
          <Route path="/onboarding/role" element={<RoleSelectorPage />} />

          {/* Company selector (multiple companies) */}
          <Route path="/companies" element={<CompanySelectorPage />} />

          {/* Company onboarding */}
          <Route path="/onboarding/company" element={<CompanyOnboardingPage />} />
          <Route path="/onboarding/company/quickstart" element={<CompanyQuickStartPage />} />

          {/* Employee onboarding */}
          <Route path="/onboarding/employee" element={<EmployeeOnboardingPage />} />

          {/* Employee management */}
          <Route path="/employees" element={<EmployeeListPage />} />

          {/* Dashboard (company or employee) */}
          <Route path="/dashboard" element={<DashboardPage />} />

          {/* Settings (Phase 4) */}
          <Route
            path="/settings"
            element={<Navigate to="/settings/profile" replace />}
          />
          <Route
            path="/settings/profile"
            element={
              <SettingsLayout>
                <ProfileSettingsPage />
              </SettingsLayout>
            }
          />
          <Route
            path="/settings/privacy"
            element={
              <SettingsLayout>
                <PrivacySettingsPage />
              </SettingsLayout>
            }
          />
          <Route
            path="/settings/notifications"
            element={
              <SettingsLayout>
                <NotificationSettingsPage />
              </SettingsLayout>
            }
          />

          {/* Catch all - redirect to home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </PayrollWalletProvider>
  );
};


