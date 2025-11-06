import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { LandingPage, SampleThemePage, ConnectWalletPage, RoleDetectionPage, RoleSelectorPage, DashboardPage } from './pages';
import { useRuntimeConfiguration } from './config/RuntimeConfiguration';
import { NetworkId, setNetworkId } from '@midnight-ntwrk/midnight-js-network-id';
import { PayrollWalletProvider } from './contexts/PayrollWalletContext';

/**
 * Main App component with routing configuration
 * Phase 1.3: Added role detection flow
 *
 * Routing Flow:
 * / → Landing Page
 * /connect → Connect Wallet
 * /loading → Network Validation & Role Detection
 * /onboarding/role → Role Selector (new users)
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

          {/* Role selector (new users) */}
          <Route path="/onboarding/role" element={<RoleSelectorPage />} />

          {/* Dashboard (company or employee) */}
          <Route path="/dashboard" element={<DashboardPage />} />

          {/* Catch all - redirect to home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </PayrollWalletProvider>
  );
};


