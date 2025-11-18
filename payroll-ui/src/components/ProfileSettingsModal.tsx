import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  TextField,
  Button,
  Stack,
  IconButton,
  Divider,
  Alert,
  Chip,
  Paper,
  Switch,
  FormControlLabel,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import PersonIcon from '@mui/icons-material/Person';
import BusinessIcon from '@mui/icons-material/Business';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import BugReportIcon from '@mui/icons-material/BugReport';
import { useTheme, useThemeValues } from '../theme';
import { usePayrollWallet } from '../contexts/PayrollWalletContext';
import { getCompany, saveCompany, type SavedCompany } from '../utils/CompaniesLocalState';
import { type EmployeeMetadata } from '../types/payment';
import { toast } from 'react-hot-toast';
import { getDeveloperSettings, saveDeveloperSettings } from '../utils/devSettings';

interface ProfileSettingsModalProps {
  open: boolean;
  onClose: () => void;
  isCompany: boolean;
  contractAddress: string;
  companyName?: string;
}

/**
 * Profile Settings Modal (Phase 4.1)
 * Unified profile management for Company and Employee roles
 */
export const ProfileSettingsModal: React.FC<ProfileSettingsModalProps> = ({
  open,
  onClose,
  isCompany,
  contractAddress,
  companyName = 'Unknown Company',
}) => {
  const { mode } = useTheme();
  const theme = useThemeValues();
  const { walletAddress } = usePayrollWallet();

  // Company metadata (localStorage)
  const [companyIndustry, setCompanyIndustry] = useState('');
  const [companySize, setCompanySize] = useState('');
  const [companyEmail, setCompanyEmail] = useState('');

  // Employee metadata (localStorage)
  const [employeeName, setEmployeeName] = useState('');
  const [employeeEmail, setEmployeeEmail] = useState('');
  const [employeeRole, setEmployeeRole] = useState('');

  // Developer settings (only for company)
  const [showDebugPanel, setShowDebugPanel] = useState(true);

  const [hasChanges, setHasChanges] = useState(false);

  // Load saved metadata
  useEffect(() => {
    if (!open) return;

    if (isCompany) {
      // Load company metadata from localStorage
      const company = getCompany(contractAddress);
      if (company) {
        setCompanyIndustry(company.industry || '');
        setCompanySize(company.size || '');
        setCompanyEmail(company.email || '');
      }

      // Load developer settings
      const devSettings = getDeveloperSettings();
      setShowDebugPanel(devSettings.showDebugPanel);
    } else {
      // Load employee metadata from localStorage
      if (walletAddress) {
        const employeesKey = `payroll-ui.employees.${contractAddress}`;
        const employees: EmployeeMetadata[] = JSON.parse(localStorage.getItem(employeesKey) || '[]');
        const employeeData = employees.find(e => e.employeeId === walletAddress);
        if (employeeData) {
          setEmployeeName(employeeData.name || '');
          setEmployeeEmail(employeeData.email || '');
          setEmployeeRole(employeeData.role || '');
        }
      }
    }
    setHasChanges(false);
  }, [open, isCompany, walletAddress, contractAddress]);

  const handleCopyAddress = (address: string, label: string) => {
    navigator.clipboard.writeText(address);
    toast.success(`${label} copied to clipboard`);
  };

  const handleSave = () => {
    try {
      if (isCompany) {
        // Save company metadata to localStorage
        const company = getCompany(contractAddress);
        if (company) {
          const updatedCompany: SavedCompany = {
            ...company,
            industry: companyIndustry,
            size: companySize,
            email: companyEmail,
          };
          saveCompany(updatedCompany);

          // Save developer settings
          saveDeveloperSettings({
            showDebugPanel: showDebugPanel,
          });

          toast.success('Company profile updated');
        }
      } else {
        // Save employee metadata to localStorage
        if (walletAddress) {
          const employeesKey = `payroll-ui.employees.${contractAddress}`;
          const employees: EmployeeMetadata[] = JSON.parse(localStorage.getItem(employeesKey) || '[]');

          // Find and update existing employee or add new
          const employeeIndex = employees.findIndex(e => e.employeeId === walletAddress);
          const employeeData: EmployeeMetadata = {
            employeeId: walletAddress,
            name: employeeName,
            email: employeeEmail,
            role: employeeRole,
            companyContractAddress: contractAddress,
            addedAt: employeeIndex >= 0 ? employees[employeeIndex].addedAt : new Date().toISOString(),
          };

          if (employeeIndex >= 0) {
            employees[employeeIndex] = employeeData;
          } else {
            employees.push(employeeData);
          }

          localStorage.setItem(employeesKey, JSON.stringify(employees));
          toast.success('Profile updated');
        }
      }
      setHasChanges(false);
      onClose();
    } catch (error) {
      toast.error('Failed to save profile');
      console.error('Save error:', error);
    }
  };

  const handleCancel = () => {
    setHasChanges(false);
    onClose();
  };

  const getNetworkName = (): string => {
    // Network name is hardcoded since we're always on Midnight
    return 'Midnight Network';
  };

  return (
    <Dialog
      open={open}
      onClose={handleCancel}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          bgcolor: mode === 'dark' ? theme.colors.background.paper : '#FFFFFF',
        },
      }}
    >
      {/* Header */}
      <DialogTitle>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Stack direction="row" alignItems="center" spacing={2}>
            {isCompany ? (
              <BusinessIcon sx={{ fontSize: 32, color: theme.colors.primary[500] }} />
            ) : (
              <PersonIcon sx={{ fontSize: 32, color: theme.colors.primary[500] }} />
            )}
            <Box>
              <Typography variant="h6" fontWeight={theme.typography.fontWeight.bold} color={theme.colors.text.primary}>
                {isCompany ? 'Company Profile' : 'Employee Profile'}
              </Typography>
              <Typography variant="body2" color={theme.colors.text.secondary}>
                {isCompany ? 'Manage company information and preferences' : 'Manage your personal information'}
              </Typography>
            </Box>
          </Stack>
          <IconButton onClick={handleCancel} size="small">
            <CloseIcon />
          </IconButton>
        </Stack>
      </DialogTitle>

      <Divider />

      <DialogContent sx={{ pt: 3 }}>
        <Stack spacing={3}>
          {/* Read-Only Information Section */}
          <Box>
            <Typography
              variant="subtitle2"
              fontWeight={theme.typography.fontWeight.semibold}
              color={theme.colors.text.secondary}
              sx={{ mb: 2 }}
            >
              Account Information
            </Typography>
            <Paper
              variant="outlined"
              sx={{
                p: 2,
                bgcolor: mode === 'dark' ? `${theme.colors.background.default}50` : theme.colors.background.default,
                borderColor: theme.colors.border.default,
              }}
            >
              <Stack spacing={2}>
                {/* Company Name / Employer */}
                <Box>
                  <Typography variant="caption" color={theme.colors.text.secondary}>
                    {isCompany ? 'Company Name' : 'Employer'}
                  </Typography>
                  <Typography variant="body2" fontWeight={theme.typography.fontWeight.medium} color={theme.colors.text.primary}>
                    {companyName}
                  </Typography>
                </Box>

                {/* Contract Address */}
                <Box>
                  <Typography variant="caption" color={theme.colors.text.secondary}>
                    Contract Address
                  </Typography>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Typography
                      variant="body2"
                      fontFamily="monospace"
                      color={theme.colors.text.primary}
                      sx={{ fontSize: '0.8rem' }}
                    >
                      {contractAddress.substring(0, 10)}...{contractAddress.substring(contractAddress.length - 8)}
                    </Typography>
                    <IconButton
                      size="small"
                      onClick={() => handleCopyAddress(contractAddress, 'Contract address')}
                      sx={{ p: 0.5 }}
                    >
                      <ContentCopyIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                  </Stack>
                </Box>

                {/* Wallet Address */}
                <Box>
                  <Typography variant="caption" color={theme.colors.text.secondary}>
                    Connected Wallet
                  </Typography>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <AccountBalanceWalletIcon sx={{ fontSize: 16, color: theme.colors.text.secondary }} />
                    <Typography
                      variant="body2"
                      fontFamily="monospace"
                      color={theme.colors.text.primary}
                      sx={{ fontSize: '0.8rem' }}
                    >
                      {walletAddress?.substring(0, 10)}...{walletAddress?.substring(walletAddress.length - 8)}
                    </Typography>
                    <IconButton
                      size="small"
                      onClick={() => walletAddress && handleCopyAddress(walletAddress, 'Wallet address')}
                      sx={{ p: 0.5 }}
                    >
                      <ContentCopyIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                  </Stack>
                </Box>

                {/* Network */}
                <Box>
                  <Typography variant="caption" color={theme.colors.text.secondary}>
                    Network
                  </Typography>
                  <Box>
                    <Chip
                      label={getNetworkName()}
                      size="small"
                      sx={{
                        bgcolor: theme.colors.primary[500],
                        color: '#FFFFFF',
                        fontWeight: theme.typography.fontWeight.medium,
                      }}
                    />
                  </Box>
                </Box>
              </Stack>
            </Paper>
          </Box>

          <Divider />

          {/* Editable Metadata Section */}
          <Box>
            <Typography
              variant="subtitle2"
              fontWeight={theme.typography.fontWeight.semibold}
              color={theme.colors.text.secondary}
              sx={{ mb: 2 }}
            >
              {isCompany ? 'Additional Information (Optional)' : 'Personal Information'}
            </Typography>

            {isCompany ? (
              <Stack spacing={2}>
                <TextField
                  label="Industry"
                  value={companyIndustry}
                  onChange={(e) => {
                    setCompanyIndustry(e.target.value);
                    setHasChanges(true);
                  }}
                  placeholder="e.g., Technology, Finance, Healthcare"
                  fullWidth
                  size="small"
                />
                <TextField
                  label="Company Size"
                  value={companySize}
                  onChange={(e) => {
                    setCompanySize(e.target.value);
                    setHasChanges(true);
                  }}
                  placeholder="e.g., 1-10, 11-50, 51-200, 200+"
                  fullWidth
                  size="small"
                />
                <TextField
                  label="Contact Email"
                  value={companyEmail}
                  onChange={(e) => {
                    setCompanyEmail(e.target.value);
                    setHasChanges(true);
                  }}
                  placeholder="contact@company.com"
                  type="email"
                  fullWidth
                  size="small"
                />
                <Alert severity="info" sx={{ fontSize: '0.875rem' }}>
                  This information is stored locally and helps organize your company profile. It is not stored on-chain.
                </Alert>
              </Stack>
            ) : (
              <Stack spacing={2}>
                <TextField
                  label="Full Name"
                  value={employeeName}
                  onChange={(e) => {
                    setEmployeeName(e.target.value);
                    setHasChanges(true);
                  }}
                  placeholder="Your full name"
                  fullWidth
                  size="small"
                />
                <TextField
                  label="Email"
                  value={employeeEmail}
                  onChange={(e) => {
                    setEmployeeEmail(e.target.value);
                    setHasChanges(true);
                  }}
                  placeholder="your.email@example.com"
                  type="email"
                  fullWidth
                  size="small"
                />
                <TextField
                  label="Role / Title"
                  value={employeeRole}
                  onChange={(e) => {
                    setEmployeeRole(e.target.value);
                    setHasChanges(true);
                  }}
                  placeholder="e.g., Software Engineer, Designer"
                  fullWidth
                  size="small"
                />
                <Alert severity="info" sx={{ fontSize: '0.875rem' }}>
                  Your personal information is stored locally for display purposes only. Employment data comes from the blockchain.
                </Alert>
              </Stack>
            )}
          </Box>

          {/* Developer Settings (Company Only) */}
          {isCompany && (
            <>
              <Divider />
              <Box>
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                  <BugReportIcon sx={{ color: theme.colors.warning[600], fontSize: 20 }} />
                  <Typography
                    variant="subtitle2"
                    fontWeight={theme.typography.fontWeight.semibold}
                    color={theme.colors.text.secondary}
                  >
                    Developer Settings
                  </Typography>
                </Stack>

                <Paper
                  variant="outlined"
                  sx={{
                    p: 2,
                    bgcolor: mode === 'dark' ? `${theme.colors.warning[500]}10` : theme.colors.warning[50],
                    borderColor: theme.colors.warning[500],
                  }}
                >
                  <FormControlLabel
                    control={
                      <Switch
                        checked={showDebugPanel}
                        onChange={(e) => {
                          setShowDebugPanel(e.target.checked);
                          setHasChanges(true);
                        }}
                        color="warning"
                      />
                    }
                    label={
                      <Box>
                        <Typography variant="body2" fontWeight={theme.typography.fontWeight.medium} color={theme.colors.text.primary}>
                          Show Debug Panel
                        </Typography>
                        <Typography variant="caption" color={theme.colors.text.secondary}>
                          Display the 6-month test data generator panel on the dashboard (development/testing only)
                        </Typography>
                      </Box>
                    }
                  />
                </Paper>
              </Box>
            </>
          )}
        </Stack>
      </DialogContent>

      <Divider />

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={handleCancel} color="inherit">
          Cancel
        </Button>
        <Button onClick={handleSave} variant="contained" disabled={!hasChanges}>
          Save Changes
        </Button>
      </DialogActions>
    </Dialog>
  );
};
