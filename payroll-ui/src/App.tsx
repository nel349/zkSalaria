import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { LandingPage, SampleThemePage, ConnectWalletPage, DashboardPage } from './pages';
import { useRuntimeConfiguration } from './config/RuntimeConfiguration';
import { NetworkId, setNetworkId } from '@midnight-ntwrk/midnight-js-network-id';

/**
 * Main App component with routing configuration
 * Follows best practice:
 * - Centralized routing in one place
 * - Clean separation of concerns
 * - Minimal setup for now (providers to be added later)
 */
export const App: React.FC = () => {
  const cfg = useRuntimeConfiguration();
  setNetworkId((cfg.NETWORK_ID as NetworkId) ?? NetworkId.Undeployed);

  return (
    <BrowserRouter basename="/">
      <Routes>
        {/* Landing page */}
        <Route path="/" element={<LandingPage />} />

        {/* Theme Playground */}
        <Route path="/theme-playground" element={<SampleThemePage />} />

        {/* Wallet connection */}
        <Route path="/connect" element={<ConnectWalletPage />} />

        {/* Dashboard (company or employee) */}
        <Route path="/dashboard" element={<DashboardPage />} />

        {/* Catch all - redirect to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};


