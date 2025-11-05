import React from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CssBaseline } from '@mui/material';
import { RuntimeConfigurationProvider } from './config/RuntimeConfiguration';
import { App as RootApp } from './App';
import { ThemeProvider, ThemeStyleInjector, DynamicMuiThemeProvider } from './theme';

/**
 * Root application entry point
 * Sets up:
 * - React Query for server state management
 * - MUI theme (light/dark mode support)
 * - Runtime configuration
 */

// Create React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 2000, // 2 seconds - data stays fresh for 2 seconds
      refetchOnWindowFocus: true, // Refetch when user comes back to window
      refetchInterval: 3000, // Auto-refetch every 3 seconds
      retry: 1,
    },
  },
});

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider> {/* Midnight theme provider with automatic switching */}
        <ThemeStyleInjector />
        <DynamicMuiThemeProvider> {/* Dynamic Material-UI theme provider */}
          <CssBaseline />
          <RootApp />
        </DynamicMuiThemeProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RuntimeConfigurationProvider>
      <App />
    </RuntimeConfigurationProvider>
  </React.StrictMode>,
);


