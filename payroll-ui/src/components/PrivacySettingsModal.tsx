import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Button,
  Stack,
  IconButton,
  Divider,
  Paper,
  Alert,
  Link,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import SecurityIcon from '@mui/icons-material/Security';
import LockIcon from '@mui/icons-material/Lock';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import PowerSettingsNewIcon from '@mui/icons-material/PowerSettingsNew';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import VerifiedIcon from '@mui/icons-material/Verified';
import { useTheme, useThemeValues } from '../theme';
import { usePayrollWallet } from '../contexts/PayrollWalletContext';

interface PrivacySettingsModalProps {
  open: boolean;
  onClose: () => void;
  isCompany: boolean;
  contractAddress: string;
  companyName?: string;
  onOpenIncomeProofs?: () => void; // Only for employees
}

/**
 * Privacy Settings Modal (Phase 4.2)
 * Privacy and security settings for Company and Employee roles
 */
export const PrivacySettingsModal: React.FC<PrivacySettingsModalProps> = ({
  open,
  onClose,
  isCompany,
  contractAddress,
  companyName = 'Unknown Company',
  onOpenIncomeProofs,
}) => {
  const { mode } = useTheme();
  const theme = useThemeValues();
  const { walletAddress, isConnected, disconnect } = usePayrollWallet();

  const handleDisconnect = () => {
    disconnect();
    onClose();
  };

  const getBlockchainExplorerUrl = () => {
    // TODO: Replace with actual Midnight explorer URL when available
    return `https://explorer.midnight.network/contract/${contractAddress}`;
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
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
            <SecurityIcon sx={{ fontSize: 32, color: theme.colors.primary[500] }} />
            <Box>
              <Typography variant="h6" fontWeight={theme.typography.fontWeight.bold} color={theme.colors.text.primary}>
                Privacy & Security
              </Typography>
              <Typography variant="body2" color={theme.colors.text.secondary}>
                {isCompany ? 'Manage company data privacy settings' : 'Manage your data privacy and security'}
              </Typography>
            </Box>
          </Stack>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Stack>
      </DialogTitle>

      <Divider />

      <DialogContent sx={{ pt: 3 }}>
        <Stack spacing={3}>
          {/* Employee: Income Proofs Section */}
          {!isCompany && onOpenIncomeProofs && (
            <>
              <Box>
                <Typography
                  variant="subtitle2"
                  fontWeight={theme.typography.fontWeight.semibold}
                  color={theme.colors.text.secondary}
                  sx={{ mb: 2 }}
                >
                  Income Proofs
                </Typography>
                <Paper
                  variant="outlined"
                  sx={{
                    p: 3,
                    bgcolor: mode === 'dark' ? `${theme.colors.background.default}50` : theme.colors.background.default,
                    borderColor: theme.colors.border.default,
                  }}
                >
                  <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
                    <VerifiedIcon sx={{ color: theme.colors.primary[500], fontSize: 24 }} />
                    <Box flex={1}>
                      <Typography variant="body1" fontWeight={theme.typography.fontWeight.semibold} color={theme.colors.text.primary}>
                        My Income Proofs
                      </Typography>
                      <Typography variant="body2" color={theme.colors.text.secondary}>
                        View and manage your zero-knowledge income verification proofs
                      </Typography>
                    </Box>
                  </Stack>
                  <Button
                    variant="contained"
                    onClick={() => {
                      onOpenIncomeProofs();
                      onClose();
                    }}
                    sx={{
                      bgcolor: theme.colors.primary[500],
                      '&:hover': { bgcolor: theme.colors.primary[700] },
                    }}
                  >
                    View Income Proofs
                  </Button>
                </Paper>
              </Box>
              <Divider />
            </>
          )}

          {/* Data Encryption Section */}
          <Box>
            <Typography
              variant="subtitle2"
              fontWeight={theme.typography.fontWeight.semibold}
              color={theme.colors.text.secondary}
              sx={{ mb: 2 }}
            >
              {isCompany ? 'Employee Data Access' : 'Data Encryption'}
            </Typography>
            <Paper
              variant="outlined"
              sx={{
                p: 3,
                bgcolor: mode === 'dark' ? `${theme.colors.background.default}50` : theme.colors.background.default,
                borderColor: theme.colors.border.default,
              }}
            >
              <Stack spacing={2}>
                <Stack direction="row" alignItems="flex-start" spacing={2}>
                  <LockIcon sx={{ color: theme.colors.success[500], fontSize: 20, mt: 0.3 }} />
                  <Box>
                    <Typography variant="body2" fontWeight={theme.typography.fontWeight.semibold} color={theme.colors.text.primary}>
                      {isCompany ? 'Encrypted Employee Balances' : 'Your Balance is Encrypted'}
                    </Typography>
                    <Typography variant="body2" color={theme.colors.text.secondary} sx={{ mt: 0.5 }}>
                      {isCompany
                        ? 'All employee balances are encrypted on-chain. Only the employee can decrypt their balance using their private key.'
                        : 'Your current balance is encrypted on the blockchain. Only you can decrypt it using your wallet\'s private key.'
                      }
                    </Typography>
                  </Box>
                </Stack>

                <Stack direction="row" alignItems="flex-start" spacing={2}>
                  <LockIcon sx={{ color: theme.colors.success[500], fontSize: 20, mt: 0.3 }} />
                  <Box>
                    <Typography variant="body2" fontWeight={theme.typography.fontWeight.semibold} color={theme.colors.text.primary}>
                      {isCompany ? 'Payment History Privacy' : 'Encrypted Payment Amounts'}
                    </Typography>
                    <Typography variant="body2" color={theme.colors.text.secondary} sx={{ mt: 0.5 }}>
                      {isCompany
                        ? 'Payment amounts in history are encrypted. Employees decrypt locally for ZK-ML proof generation.'
                        : 'All payment amounts are encrypted on-chain and stored in your private payment history.'
                      }
                    </Typography>
                  </Box>
                </Stack>

                <Stack direction="row" alignItems="flex-start" spacing={2}>
                  <VerifiedUserIcon sx={{ color: theme.colors.primary[500], fontSize: 20, mt: 0.3 }} />
                  <Box>
                    <Typography variant="body2" fontWeight={theme.typography.fontWeight.semibold} color={theme.colors.text.primary}>
                      Zero-Knowledge Proofs
                    </Typography>
                    <Typography variant="body2" color={theme.colors.text.secondary} sx={{ mt: 0.5 }}>
                      {isCompany
                        ? 'Employees can prove income thresholds without revealing exact amounts to verifiers.'
                        : 'Prove your income meets requirements without revealing exact salary amounts.'
                      }
                    </Typography>
                  </Box>
                </Stack>
              </Stack>
            </Paper>
          </Box>

          <Divider />

          {/* Contract Transparency */}
          <Box>
            <Typography
              variant="subtitle2"
              fontWeight={theme.typography.fontWeight.semibold}
              color={theme.colors.text.secondary}
              sx={{ mb: 2 }}
            >
              Contract Transparency
            </Typography>
            <Paper
              variant="outlined"
              sx={{
                p: 3,
                bgcolor: mode === 'dark' ? `${theme.colors.background.default}50` : theme.colors.background.default,
                borderColor: theme.colors.border.default,
              }}
            >
              <Stack spacing={2}>
                <Box>
                  <Typography variant="caption" color={theme.colors.text.secondary}>
                    {isCompany ? 'Company Contract Address' : 'Employer Contract Address'}
                  </Typography>
                  <Typography
                    variant="body2"
                    fontFamily="monospace"
                    color={theme.colors.text.primary}
                    sx={{ fontSize: '0.8rem', mt: 0.5 }}
                  >
                    {contractAddress}
                  </Typography>
                </Box>
                <Link
                  href={getBlockchainExplorerUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 0.5,
                    color: theme.colors.primary[500],
                    textDecoration: 'none',
                    '&:hover': { textDecoration: 'underline' },
                  }}
                >
                  View on Midnight Explorer
                  <OpenInNewIcon sx={{ fontSize: 16 }} />
                </Link>
              </Stack>
            </Paper>
          </Box>

          <Divider />

          {/* Session Security */}
          <Box>
            <Typography
              variant="subtitle2"
              fontWeight={theme.typography.fontWeight.semibold}
              color={theme.colors.text.secondary}
              sx={{ mb: 2 }}
            >
              Session Security
            </Typography>
            <Paper
              variant="outlined"
              sx={{
                p: 3,
                bgcolor: mode === 'dark' ? `${theme.colors.background.default}50` : theme.colors.background.default,
                borderColor: theme.colors.border.default,
              }}
            >
              <Stack spacing={2}>
                <Box>
                  <Typography variant="body2" fontWeight={theme.typography.fontWeight.semibold} color={theme.colors.text.primary}>
                    Wallet Connection Status
                  </Typography>
                  <Stack direction="row" alignItems="center" spacing={1} sx={{ mt: 1 }}>
                    <Box
                      sx={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        bgcolor: isConnected ? theme.colors.success[500] : theme.colors.error[500],
                      }}
                    />
                    <Typography variant="body2" color={theme.colors.text.secondary}>
                      {isConnected ? 'Connected' : 'Disconnected'}
                    </Typography>
                  </Stack>
                  {walletAddress && (
                    <Typography
                      variant="caption"
                      fontFamily="monospace"
                      color={theme.colors.text.disabled}
                      sx={{ display: 'block', mt: 0.5 }}
                    >
                      {walletAddress.substring(0, 16)}...{walletAddress.substring(walletAddress.length - 8)}
                    </Typography>
                  )}
                </Box>

                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<PowerSettingsNewIcon />}
                  onClick={handleDisconnect}
                  disabled={!isConnected}
                  sx={{ alignSelf: 'flex-start' }}
                >
                  Disconnect Wallet
                </Button>
              </Stack>
            </Paper>
          </Box>

          {/* Help & Documentation */}
          <Alert severity="info" sx={{ fontSize: '0.875rem' }}>
            <Typography variant="body2" fontWeight={theme.typography.fontWeight.semibold} sx={{ mb: 1 }}>
              Privacy Best Practices
            </Typography>
            <Typography variant="body2" component="div">
              • Never share your wallet private key or seed phrase
              <br />
              • Verify contract addresses before transactions
              <br />
              • Only grant income proof access to trusted verifiers
              <br />• Always disconnect wallet when finished
            </Typography>
          </Alert>
        </Stack>
      </DialogContent>

      <Divider />

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} variant="contained">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};
