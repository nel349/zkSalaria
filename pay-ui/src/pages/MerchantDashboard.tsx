import React, { useEffect, useState } from 'react';
import {
  Typography,
  Box,
  CircularProgress,
  Container,
  Stack,
  Chip,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material';
import {
  AccountBalanceWallet,
  Add,
  TrendingUp,
  Subscriptions,
  People,
  Download,
} from '@mui/icons-material';
import { usePaymentWallet } from '../components/PaymentWallet';
import { PaymentAPI, MERCHANT_TIER } from '../../../payroll-api/dist';
import { usePaymentContract } from '../hooks/usePaymentContract';
import { take } from 'rxjs/operators';
import {
  ThemedButton,
  GradientBackground,
  AppHeader,
  ThemedCard,
  ThemedCardContent,
} from '../components';
import { useTheme } from '../theme';
import { findExistingMerchant, savePaymentUser, listPaymentUsers, removeMerchantFromStorage } from '../utils/PaymentLocalState';
import { useNotification } from '../contexts/NotificationContext';

interface MerchantStats {
  totalEarnings: string;
  activeSubscriptions: number;
  totalCustomers: number;
  thisMonthRevenue: string;
  availableBalance: string;
  merchantTier: MERCHANT_TIER;
}

interface MerchantDetails {
  businessName: string;
  tier: MERCHANT_TIER;
  transactionCount: string;
  totalVolume: string;
  isActive: boolean;
  createdAt: string;
}

export const MerchantDashboard: React.FC = () => {
  const { isConnected, connect } = usePaymentWallet();
  const {
    contractAddress,
    paymentAPI,
    entityId: merchantId,
    isInitializing,
    error: contractError,
    setEntity
  } = usePaymentContract();
  const { showSuccess, showError } = useNotification();

  const [connecting, setConnecting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [registrationOpen, setRegistrationOpen] = useState(false);
  const [businessName, setBusinessName] = useState('');
  const [isRegistered, setIsRegistered] = useState(true);
  const [registering, setRegistering] = useState(false);

  // Subscription creation states
  const [subscriptionDialog, setSubscriptionDialog] = useState(false);
  const [subscriptionData, setSubscriptionData] = useState({
    customerId: '',
    amount: '',
    maxAmount: '',
    frequencyDays: 30,
  });
  const [creatingSubscription, setCreatingSubscription] = useState(false);

  // Customer management states
  const [customersDialog, setCustomersDialog] = useState(false);

  // Withdrawal states
  const [withdrawalDialog, setWithdrawalDialog] = useState(false);
  const [withdrawalAmount, setWithdrawalAmount] = useState('');
  const [withdrawing, setWithdrawing] = useState(false);

  // Mock transaction data
  const [recentTransactions] = useState([
    { id: 'txn-001', customer: 'alice-crypto', amount: '$29.99', type: 'Subscription Payment', date: '2 hours ago', status: 'Completed' },
    { id: 'txn-002', customer: 'bob-trader', amount: '$15.50', type: 'One-time Payment', date: '5 hours ago', status: 'Completed' },
    { id: 'txn-003', customer: 'carol-dev', amount: '$49.99', type: 'Subscription Payment', date: '1 day ago', status: 'Completed' },
    { id: 'txn-004', customer: 'dave-analyst', amount: '$19.99', type: 'Subscription Payment', date: '1 day ago', status: 'Completed' },
    { id: 'txn-005', customer: 'eve-designer', amount: '$89.99', type: 'Premium Upgrade', date: '2 days ago', status: 'Completed' },
  ]);

  // Mock active subscriptions data
  const [activeSubscriptions] = useState([
    { id: 'sub-001', customer: 'alice-crypto', plan: 'Pro Plan', amount: '$29.99', frequency: 'Monthly', nextPayment: 'Dec 15, 2024', status: 'Active' },
    { id: 'sub-002', customer: 'carol-dev', plan: 'Premium Plan', amount: '$49.99', frequency: 'Monthly', nextPayment: 'Dec 18, 2024', status: 'Active' },
    { id: 'sub-003', customer: 'dave-analyst', plan: 'Basic Plan', amount: '$19.99', frequency: 'Monthly', nextPayment: 'Dec 20, 2024', status: 'Active' },
    { id: 'sub-004', customer: 'frank-investor', plan: 'Enterprise', amount: '$199.99', frequency: 'Monthly', nextPayment: 'Dec 22, 2024', status: 'Active' },
    { id: 'sub-005', customer: 'grace-startup', plan: 'Pro Plan', amount: '$29.99', frequency: 'Monthly', nextPayment: 'Dec 25, 2024', status: 'Paused' },
  ]);

  // Mock customer data
  const [mockCustomers] = useState([
    { id: 'alice-crypto', email: 'alice@crypto.com', totalSpent: '$459.87', subscriptions: 2, joinDate: 'Nov 15, 2024', status: 'Active' },
    { id: 'bob-trader', email: 'bob@trader.io', totalSpent: '$315.50', subscriptions: 1, joinDate: 'Nov 20, 2024', status: 'Active' },
    { id: 'carol-dev', email: 'carol@devstudio.com', totalSpent: '$849.99', subscriptions: 3, joinDate: 'Oct 28, 2024', status: 'Active' },
    { id: 'dave-analyst', email: 'dave@analytics.pro', totalSpent: '$239.88', subscriptions: 1, joinDate: 'Nov 25, 2024', status: 'Active' },
    { id: 'eve-designer', email: 'eve@design.agency', totalSpent: '$189.99', subscriptions: 1, joinDate: 'Nov 30, 2024', status: 'Active' },
    { id: 'frank-investor', email: 'frank@investment.fund', totalSpent: '$1,299.95', subscriptions: 2, joinDate: 'Oct 15, 2024', status: 'Premium' },
    { id: 'grace-startup', email: 'grace@startup.tech', totalSpent: '$59.98', subscriptions: 1, joinDate: 'Dec 1, 2024', status: 'Paused' },
    { id: 'henry-founder', email: 'henry@founder.com', totalSpent: '$99.99', subscriptions: 1, joinDate: 'Dec 3, 2024', status: 'Active' },
  ]);
  const [stats, setStats] = useState<MerchantStats>({
    totalEarnings: '2,847.50',
    activeSubscriptions: 127,
    totalCustomers: 89,
    thisMonthRevenue: '1,285.25',
    availableBalance: '847.30',
    merchantTier: MERCHANT_TIER.verified,
  });
  const [merchantDetails, setMerchantDetails] = useState<MerchantDetails>({
    businessName: 'TechFlow Solutions',
    tier: MERCHANT_TIER.verified,
    transactionCount: '342',
    totalVolume: '15,920.75',
    isActive: true,
    createdAt: new Date(Date.now() - 86400000 * 45).toLocaleDateString(), // 45 days ago
  });

  const handleConnect = async () => {
    setConnecting(true);
    try {
      await connect();
    } catch (error) {
      console.error('Connection failed:', error);
    } finally {
      setConnecting(false);
    }
  };

  // Set up merchant entity when connected but not set OR when we need to verify existing merchant
  useEffect(() => {
    if (isConnected && contractAddress && !isInitializing) {
      // Always run setup to verify merchant state, even if merchantId exists
      const setupMerchant = async () => {
        try {
          console.log('🔄 SETUP MERCHANT - Starting setup process');
          console.log('🔄 SETUP MERCHANT - Contract address:', contractAddress);
          console.log('🔄 SETUP MERCHANT - Current merchant ID:', merchantId);

          // DEBUG: Check what's in localStorage
          const allUsers = listPaymentUsers();
          console.log('🔍 SETUP MERCHANT - All users in localStorage:', allUsers);

          const contractUsers = allUsers.filter(u => u.paymentContractAddress === contractAddress);
          console.log('🔍 SETUP MERCHANT - Users for this contract:', contractUsers);

          const existingMerchants = contractUsers.filter(u => u.entityType === 'merchant');
          console.log('🔍 SETUP MERCHANT - Existing merchants for this contract:', existingMerchants);

          // Check if a merchant ID already exists for this gateway (for persistence only)
          const existingMerchant = findExistingMerchant(contractAddress);
          console.log('🔍 SETUP MERCHANT - findExistingMerchant result:', existingMerchant);

          if (merchantId) {
            console.log('🔄 SETUP MERCHANT - Merchant ID already set from session:', merchantId);
            console.log('🔄 SETUP MERCHANT - Will verify if this matches localStorage and blockchain');

            // Check if the sessionStorage merchant ID has a corresponding localStorage entry
            if (existingMerchant && existingMerchant.entityId === merchantId) {
              console.log('✅ SETUP MERCHANT - SessionStorage matches localStorage merchant');
            } else if (existingMerchant) {
              console.log('⚠️  SETUP MERCHANT - SessionStorage merchant differs from localStorage');
              console.log('⚠️  SETUP MERCHANT - Session:', merchantId, 'vs localStorage:', existingMerchant.entityId);
            } else {
              console.log('⚠️  SETUP MERCHANT - SessionStorage merchant has no localStorage entry');
            }
          } else if (existingMerchant) {
            console.log('🔄 SETUP MERCHANT - Using existing merchant ID from localStorage:', existingMerchant.entityId);
            console.log('🔄 SETUP MERCHANT - Business name from localStorage:', existingMerchant.label);
            console.log('⚠️  SETUP MERCHANT - Will verify blockchain registration after setting entity');
            await setEntity(existingMerchant.entityId, 'merchant');
          } else {
            console.log('🆕 SETUP MERCHANT - No existing merchant found, creating new merchant ID');
            const generatedMerchantId = `merchant-${Date.now()}`;
            console.log('🆕 SETUP MERCHANT - Generated new ID:', generatedMerchantId);
            await setEntity(generatedMerchantId, 'merchant');
            console.log('⏳ SETUP MERCHANT - New merchant entity created, will save to localStorage after blockchain registration');
          }
        } catch (error) {
          console.error('❌ SETUP MERCHANT - Failed to set up merchant entity:', error);
        }
      };

      setupMerchant();
    }
  }, [isConnected, contractAddress, isInitializing, setEntity]);

  // Check merchant registration status - BLOCKCHAIN IS SINGLE SOURCE OF TRUTH
  useEffect(() => {
    if (paymentAPI && merchantId && contractAddress) {
      const checkRegistration = async () => {
        try {
          console.log('🔍 REGISTRATION CHECK - Starting blockchain verification');
          console.log('🔍 REGISTRATION CHECK - Merchant ID:', merchantId);
          console.log('🔍 REGISTRATION CHECK - Contract address:', contractAddress);

          // Wait for PaymentAPI state to be properly synced using the state observable
          console.log('⏳ REGISTRATION CHECK - Waiting for PaymentAPI state sync...');
          await new Promise<void>((resolve) => {
            let stateUpdateCount = 0;
            const subscription = paymentAPI.state$.subscribe((state) => {
              stateUpdateCount++;
              console.log(`📡 REGISTRATION CHECK - PaymentAPI state updated (${stateUpdateCount}):`, state);

              // Wait for a few state updates to ensure private state is fully loaded
              if (stateUpdateCount >= 2) {
                subscription.unsubscribe();
                resolve();
              }
            });
            // Fallback timeout in case state doesn't update enough
            setTimeout(() => {
              subscription.unsubscribe();
              resolve();
            }, 5000); // Increased timeout to 5 seconds
          });

          // Check blockchain for merchant registration - this is the ONLY truth
          const merchantInfo = await paymentAPI.getMerchantInfo(merchantId);
          console.log('✅ REGISTRATION CHECK - Merchant found on blockchain:', merchantInfo);
          console.log('✅ REGISTRATION CHECK - Business name:', merchantInfo.businessName);
          console.log('✅ REGISTRATION CHECK - Merchant tier:', merchantInfo.tier);
          console.log('✅ REGISTRATION CHECK - Is active:', merchantInfo.isActive);
          setIsRegistered(true);
        } catch (error) {
          console.log('❌ REGISTRATION CHECK - Merchant not found on blockchain');
          console.log('❌ REGISTRATION CHECK - Error:', error);

          // Check if merchant exists in localStorage
          const existingMerchant = findExistingMerchant(contractAddress);
          console.log('🔍 REGISTRATION CHECK - Checking localStorage:', existingMerchant);

          if (existingMerchant && existingMerchant.entityId === merchantId) {
            console.log('⚠️  REGISTRATION CHECK - Merchant exists in localStorage but not found on blockchain');
            console.log('⚠️  REGISTRATION CHECK - This could be a private state sync issue or registration failure');
            console.log('⚠️  REGISTRATION CHECK - NOT removing localStorage data to preserve merchant ID consistency');
          } else {
            console.log('🔍 REGISTRATION CHECK - No localStorage entry found');
          }

          // CRITICAL: Only clear sessionStorage if NO localStorage entry exists
          // If localStorage entry exists, the merchant was registered but private state might need time to sync
          if (!existingMerchant) {
            console.log('🧹 REGISTRATION CHECK - No localStorage entry, clearing sessionStorage for fresh start');
            try {
              window.sessionStorage.removeItem('current-entity-id');
              window.sessionStorage.removeItem('current-entity-type');
              console.log('🧹 REGISTRATION CHECK - SessionStorage cleared');
            } catch (error) {
              console.error('Failed to clear sessionStorage:', error);
            }
          } else {
            console.log('⚠️  REGISTRATION CHECK - Merchant exists in localStorage, keeping sessionStorage for consistency');
            console.log('⚠️  REGISTRATION CHECK - This might be a temporary private state sync issue');
          }

          console.log('📝 REGISTRATION CHECK - Showing registration form');
          setIsRegistered(false);
          setRegistrationOpen(true);
        }
      };

      checkRegistration();
    }
  }, [paymentAPI, merchantId, contractAddress]);

  // Handle merchant registration
  // Helper function to format merchant tier
  const getTierLabel = (tier: MERCHANT_TIER): string => {
    switch (tier) {
      case MERCHANT_TIER.unverified:
        return 'Unverified';
      case MERCHANT_TIER.basic:
        return 'Basic';
      case MERCHANT_TIER.verified:
        return 'Verified';
      case MERCHANT_TIER.premium:
        return 'Premium';
      default:
        return 'Unknown';
    }
  };

  const getTierColor = (tier: MERCHANT_TIER): 'default' | 'primary' | 'secondary' | 'success' | 'info' | 'warning' | 'error' => {
    switch (tier) {
      case MERCHANT_TIER.unverified:
        return 'warning';
      case MERCHANT_TIER.basic:
        return 'info';
      case MERCHANT_TIER.verified:
        return 'success';
      case MERCHANT_TIER.premium:
        return 'secondary';
      default:
        return 'default';
    }
  };

  const handleCreateSubscription = async () => {
    if (!subscriptionData.customerId || !subscriptionData.amount) return;

    const amount = parseFloat(subscriptionData.amount);
    const maxAmount = parseFloat(subscriptionData.maxAmount || subscriptionData.amount);

    if (isNaN(amount) || amount <= 0) {
      showError('Please enter a valid subscription amount greater than $0.00');
      return;
    }

    if (isNaN(maxAmount) || maxAmount < amount) {
      showError('Maximum amount must be greater than or equal to the subscription amount');
      return;
    }

    if (subscriptionData.frequencyDays < 1 || subscriptionData.frequencyDays > 365) {
      showError('Frequency must be between 1 and 365 days');
      return;
    }

    try {
      setCreatingSubscription(true);

      // 🎭 MOCK: Simulate API call with delay
      console.log('🎭 MOCK: Creating subscription...', subscriptionData);
      await new Promise(resolve => setTimeout(resolve, 1500));

      console.log('🎭 Subscription created successfully');
      showSuccess(`🎭 Subscription created for customer ${subscriptionData.customerId}! Amount: $${subscriptionData.amount} every ${subscriptionData.frequencyDays} days`);

      setSubscriptionDialog(false);
      setSubscriptionData({
        customerId: '',
        amount: '',
        maxAmount: '',
        frequencyDays: 30,
      });
    } catch (error) {
      console.error('❌ Failed to create subscription:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown subscription creation error';
      showError(`Failed to create subscription: ${errorMessage}`);
    } finally {
      setCreatingSubscription(false);
    }
  };

  const handleRegisterMerchant = async () => {
    if (!merchantId || !businessName.trim()) return;

    console.log('📝 Starting merchant registration');
    console.log('📝 Merchant ID:', merchantId);
    console.log('📝 Business name:', businessName.trim());

    try {
      setRegistering(true);

      // Simulate registration delay
      console.log('🔄 Registering merchant...');
      await new Promise(resolve => setTimeout(resolve, 2000));

      console.log('✅ Merchant registration completed');

      // Save merchant record to localStorage
      const merchantRecord = {
        paymentContractAddress: contractAddress!,
        entityId: merchantId,
        entityType: 'merchant' as const,
        label: businessName.trim(),
        createdAt: new Date().toISOString()
      };
      savePaymentUser(merchantRecord);
      console.log('💾 Merchant ID saved to localStorage');

      showSuccess(`Business "${businessName.trim()}" registered successfully!`);
      setIsRegistered(true);
      setRegistrationOpen(false);
      setBusinessName('');
    } catch (error) {
      console.error('❌ Failed to register merchant:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown registration error';
      showError(`Registration failed: ${errorMessage}`);
    } finally {
      setRegistering(false);
    }
  };

  const handleWithdrawEarnings = () => {
    if (!stats.availableBalance || parseFloat(stats.availableBalance.replace(',', '')) <= 0) {
      showError('No earnings available for withdrawal');
      return;
    }
    setWithdrawalAmount(stats.availableBalance);
    setWithdrawalDialog(true);
  };

  const processWithdrawal = async () => {
    if (!withdrawalAmount || parseFloat(withdrawalAmount.replace(',', '')) <= 0) {
      showError('Please enter a valid withdrawal amount');
      return;
    }

    try {
      setWithdrawing(true);

      // Simulate signature request
      console.log('🔏 Requesting wallet signature for withdrawal...');
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Simulate withdrawal processing
      console.log('🔄 Processing withdrawal...');
      await new Promise(resolve => setTimeout(resolve, 2000));

      console.log('✅ Withdrawal completed');
      showSuccess(`Successfully withdrew $${withdrawalAmount} to your Lace wallet!`);

      // Update stats to show reduced available balance
      const currentBalance = parseFloat(stats.availableBalance.replace(',', ''));
      const withdrawnAmount = parseFloat(withdrawalAmount.replace(',', ''));
      const newBalance = Math.max(0, currentBalance - withdrawnAmount);

      setStats(prev => ({
        ...prev,
        availableBalance: newBalance.toFixed(2)
      }));

      setWithdrawalDialog(false);
      setWithdrawalAmount('');
    } catch (error) {
      console.error('❌ Failed to withdraw earnings:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown withdrawal error';
      showError(`Withdrawal failed: ${errorMessage}`);
    } finally {
      setWithdrawing(false);
    }
  };

  const handleExportData = async () => {
    try {
      // Simulate export processing delay
      console.log('📊 Generating export data...');
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Create mock CSV data
      const csvData = `Business Name,Merchant ID,Total Earnings,Active Subscriptions,Total Customers,Member Since
"${merchantDetails.businessName || 'My Business'}","${merchantId}","$${stats.totalEarnings}","${stats.activeSubscriptions}","${stats.totalCustomers}","${merchantDetails.createdAt || new Date().toLocaleDateString()}"`;

      // Create and download file
      const blob = new Blob([csvData], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `merchant-data-${merchantId}-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      console.log('✅ Export completed');
      showSuccess('Merchant data exported successfully!');
    } catch (error) {
      console.error('❌ Failed to export data:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown export error';
      showError(`Export failed: ${errorMessage}`);
    }
  };

  const handleCreateSubscriptionPlan = () => {
    setSubscriptionDialog(true);
  };

  const handleViewCustomers = () => {
    setCustomersDialog(true);
  };

  const handleViewAllTransactions = () => {
    showSuccess('Transaction history page is coming soon!');
  };

  // Mock data is set in state initialization - no need to fetch from API

  const StatCard: React.FC<{
    title: string;
    value: string;
    icon: React.ReactNode;
    color?: 'primary' | 'secondary' | 'success' | 'info';
  }> = ({ title, value, icon, color = 'primary' }) => (
    <ThemedCard>
      <ThemedCardContent>
        <Stack direction="row" alignItems="center" spacing={2}>
          <Box sx={{ color: `${color}.main`, fontSize: 40 }}>
            {icon}
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h4" component="h3" sx={{ fontWeight: 'bold', mb: 1 }}>
              {value}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              {title}
            </Typography>
          </Box>
        </Stack>
      </ThemedCardContent>
    </ThemedCard>
  );

  // Show setup flow if no contract or entity is set
  if (!isConnected || !contractAddress || !merchantId) {
    return (
      <GradientBackground>
        <AppHeader />
        <Container maxWidth="md">
          <Box textAlign="center" sx={{ py: 8 }}>
            <AccountBalanceWallet sx={{ fontSize: 80, color: 'primary.main', mb: 3 }} />
            <Typography variant="h4" component="h1" sx={{ mb: 3, fontWeight: 'bold' }}>
              {!isConnected ? 'Connect Your Lace Wallet' : 'Setting Up Payment Gateway'}
            </Typography>
            <Typography variant="body1" color="textSecondary" sx={{ mb: 4, maxWidth: 500, mx: 'auto' }}>
              {!isConnected
                ? 'To access your merchant dashboard and manage payments, please connect your Lace wallet.'
                : isInitializing
                ? 'Creating your merchant account on the blockchain. This requires a wallet signature to establish your secure merchant identity.'
                : !contractAddress
                ? 'Please connect to a payment gateway first.'
                : 'Setting up your merchant profile. You may need to sign a transaction to create your merchant account.'
              }
            </Typography>
            {isInitializing && (
              <Alert severity="info" sx={{ mb: 3, maxWidth: 500, mx: 'auto' }}>
                <Typography variant="body2">
                  🔐 <strong>Wallet Signature Required:</strong> Creating your merchant account requires a blockchain transaction. This is a one-time setup to establish your secure identity.
                </Typography>
              </Alert>
            )}
            {contractError && (
              <Alert severity="error" sx={{ mb: 3, maxWidth: 500, mx: 'auto' }}>
                Contract Error: {contractError.message}
              </Alert>
            )}
            <ThemedButton
              variant="primary"
              size="large"
              onClick={handleConnect}
              disabled={connecting || isInitializing}
              startIcon={
                connecting || isInitializing
                  ? <CircularProgress size={20} />
                  : <AccountBalanceWallet />
              }
              sx={{ px: 4, py: 2 }}
            >
              {connecting
                ? 'Connecting...'
                : isInitializing
                ? 'Setting Up...'
                : 'Connect Lace Wallet'
              }
            </ThemedButton>
          </Box>
        </Container>
      </GradientBackground>
    );
  }

  return (
    <GradientBackground>
      <AppHeader />
      <Container maxWidth="xl" sx={{ py: 4 }}>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
            <Box>
              <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', mb: 1 }}>
                {merchantDetails.businessName || 'Merchant Dashboard'}
              </Typography>
              <Stack direction="row" alignItems="center" spacing={1}>
                <Chip
                  label="Connected"
                  color="success"
                  size="small"
                  sx={{
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    px: 1.5,
                    py: 0.5
                  }}
                />
                <Chip
                  label={getTierLabel(merchantDetails.tier)}
                  color={getTierColor(merchantDetails.tier)}
                  size="small"
                  sx={{
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    px: 1.5,
                    py: 0.5
                  }}
                />
                <Typography variant="body2" color="textSecondary">
                  {merchantDetails.isActive ? 'Active merchant account' : 'Inactive account'}
                </Typography>
              </Stack>
            </Box>
            <Stack direction="row" spacing={2}>
              <ThemedButton
                variant="outlined"
                startIcon={<Download />}
                size="small"
                onClick={handleExportData}
                disabled={loading}
              >
                Export Data
              </ThemedButton>
              <ThemedButton
                variant="primary"
                startIcon={<Add />}
                size="small"
                onClick={handleCreateSubscriptionPlan}
                disabled={loading}
              >
                Create Subscription Plan
              </ThemedButton>
            </Stack>
          </Stack>
        </Box>

        {/* Stats Cards */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mb: 4 }}>
          <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 45%', md: '1 1 22%' }, minWidth: 250 }}>
            <StatCard
              title="Total Earnings"
              value={`$${stats.totalEarnings}`}
              icon={<TrendingUp />}
              color="success"
            />
          </Box>
          <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 45%', md: '1 1 22%' }, minWidth: 250 }}>
            <StatCard
              title="Active Subscriptions"
              value={stats.activeSubscriptions.toString()}
              icon={<Subscriptions />}
              color="primary"
            />
          </Box>
          <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 45%', md: '1 1 22%' }, minWidth: 250 }}>
            <StatCard
              title="Total Customers"
              value={stats.totalCustomers.toString()}
              icon={<People />}
              color="info"
            />
          </Box>
          <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 45%', md: '1 1 22%' }, minWidth: 250 }}>
            <StatCard
              title="This Month"
              value={`$${stats.thisMonthRevenue}`}
              icon={<TrendingUp />}
              color="secondary"
            />
          </Box>
        </Box>

        {/* Quick Actions */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mb: 4 }}>
          <Box sx={{ flex: { xs: '1 1 100%', md: '1 1 30%' } }}>
            <ThemedCard>
              <ThemedCardContent>
                <Typography variant="h6" component="h2" sx={{ mb: 3, fontWeight: 'bold' }}>
                  Quick Actions
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                  <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 45%', md: '1 1 30%' } }}>
                    <ThemedButton
                      variant="outlined"
                      fullWidth
                      startIcon={<Add />}
                      sx={{ py: 2 }}
                      onClick={() => setSubscriptionDialog(true)}
                      disabled={loading}
                    >
                      New Subscription
                    </ThemedButton>
                  </Box>
                  <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 45%', md: '1 1 30%' } }}>
                    <ThemedButton
                      variant="outlined"
                      fullWidth
                      startIcon={<AccountBalanceWallet />}
                      sx={{ py: 2 }}
                      onClick={handleWithdrawEarnings}
                      disabled={loading || !stats.availableBalance || parseFloat(stats.availableBalance) <= 0}
                    >
                      Withdraw Earnings
                    </ThemedButton>
                  </Box>
                  <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 45%', md: '1 1 30%' } }}>
                    <ThemedButton
                      variant="outlined"
                      fullWidth
                      startIcon={<People />}
                      sx={{ py: 2 }}
                      onClick={handleViewCustomers}
                      disabled={loading}
                    >
                      View Customers
                    </ThemedButton>
                  </Box>
                </Box>
              </ThemedCardContent>
            </ThemedCard>
          </Box>

          <Box sx={{ flex: { xs: '1 1 100%', md: '1 1 48%' } }}>
            <ThemedCard>
              <ThemedCardContent>
                <Typography variant="h6" component="h2" sx={{ mb: 3, fontWeight: 'bold' }}>
                  Business Information
                </Typography>
                <Stack spacing={2}>
                  <Box>
                    <Typography variant="body2" color="textSecondary">
                      Business Name
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                      {merchantDetails.businessName || 'Not Set'}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="textSecondary">
                      Merchant Tier
                    </Typography>
                    <Chip
                      label={getTierLabel(merchantDetails.tier)}
                      color={getTierColor(merchantDetails.tier)}
                      size="small"
                      sx={{
                        fontSize: '0.875rem',
                        fontWeight: 500,
                        px: 1.5,
                        py: 0.5,
                        height: 'auto'
                      }}
                    />
                  </Box>
                  <Box>
                    <Typography variant="body2" color="textSecondary">
                      Total Transactions
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                      {merchantDetails.transactionCount}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="textSecondary">
                      Total Volume
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                      ${merchantDetails.totalVolume}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="textSecondary">
                      Member Since
                    </Typography>
                    <Typography variant="body1">
                      {merchantDetails.createdAt || 'Unknown'}
                    </Typography>
                  </Box>
                </Stack>
              </ThemedCardContent>
            </ThemedCard>
          </Box>
        </Box>

        {/* Active Subscriptions */}
        <ThemedCard sx={{ mb: 4 }}>
          <ThemedCardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6" component="h2" sx={{ fontWeight: 'bold' }}>
                Active Subscriptions ({activeSubscriptions.length})
              </Typography>
              <ThemedButton
                variant="outlined"
                size="small"
                onClick={() => showSuccess('Subscription management page is coming soon!')}
                disabled={loading}
              >
                Manage All
              </ThemedButton>
            </Box>
            <TableContainer component={Paper} sx={{ boxShadow: 'none', backgroundColor: 'transparent' }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold' }}>Customer</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Plan</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Amount</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Frequency</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Next Payment</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {activeSubscriptions.slice(0, 5).map((subscription) => (
                    <TableRow key={subscription.id} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.875rem' }}>
                          {subscription.customer}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                          {subscription.plan}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 'medium', color: 'success.main' }}>
                          {subscription.amount}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="textSecondary">
                          {subscription.frequency}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="textSecondary">
                          {subscription.nextPayment}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={subscription.status}
                          color={subscription.status === 'Active' ? 'success' : 'warning'}
                          size="small"
                          sx={{ fontSize: '0.75rem', height: 24 }}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </ThemedCardContent>
        </ThemedCard>

        {/* Recent Transactions */}
        <ThemedCard>
          <ThemedCardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6" component="h2" sx={{ fontWeight: 'bold' }}>
                Recent Transactions
              </Typography>
              <ThemedButton
                variant="outlined"
                size="small"
                onClick={handleViewAllTransactions}
                disabled={loading}
              >
                View All
              </ThemedButton>
            </Box>
            <TableContainer component={Paper} sx={{ boxShadow: 'none', backgroundColor: 'transparent' }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold' }}>Customer</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Amount</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Type</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Date</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {recentTransactions.map((transaction) => (
                    <TableRow key={transaction.id} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.875rem' }}>
                          {transaction.customer}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 'medium', color: 'success.main' }}>
                          {transaction.amount}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="textSecondary">
                          {transaction.type}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="textSecondary">
                          {transaction.date}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={transaction.status}
                          color="success"
                          size="small"
                          sx={{ fontSize: '0.75rem', height: 24 }}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </ThemedCardContent>
        </ThemedCard>
      </Container>

      {/* Merchant Registration Modal */}
      <Dialog
        open={registrationOpen}
        onClose={() => {}} // Prevent closing - registration is required
        maxWidth="sm"
        fullWidth
        disableEscapeKeyDown
      >
        <DialogTitle sx={{ textAlign: 'center', pb: 1, fontWeight: 'bold' }}>
          🏪 Register Your Business
        </DialogTitle>
        <DialogContent sx={{ py: 3 }}>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3, textAlign: 'center' }}>
            To start accepting payments, please register your business with the payment gateway.
          </Typography>

          <TextField
            autoFocus
            label="Business Name"
            placeholder="e.g., My Coffee Shop, Tech Solutions LLC"
            fullWidth
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            helperText="Enter your business or organization name"
            disabled={registering}
            sx={{ mb: 2 }}
          />

          <Alert severity="info" sx={{ mt: 2 }}>
            <Typography variant="body2">
              <strong>Note:</strong> This will create your merchant account on the blockchain.
              You may need to sign a transaction to complete registration.
            </Typography>
          </Alert>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', pb: 3 }}>
          <ThemedButton
            variant="primary"
            onClick={handleRegisterMerchant}
            disabled={!businessName.trim() || registering}
            startIcon={registering ? <CircularProgress size={20} /> : <Add />}
            size="large"
            sx={{ minWidth: 200 }}
          >
            {registering ? 'Registering...' : 'Register Business'}
          </ThemedButton>
        </DialogActions>
      </Dialog>

      {/* Subscription Creation Dialog */}
      <Dialog open={subscriptionDialog} onClose={() => setSubscriptionDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ textAlign: 'center', pb: 1, fontWeight: 'bold' }}>
          📋 Create New Subscription
        </DialogTitle>
        <DialogContent sx={{ py: 3 }}>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
            Create a recurring subscription for a customer. They'll be charged automatically based on the frequency you set.
          </Typography>
          <Stack spacing={3}>
            <TextField
              autoFocus
              label="Customer ID"
              type="text"
              fullWidth
              variant="outlined"
              value={subscriptionData.customerId}
              onChange={(e) => setSubscriptionData(prev => ({ ...prev, customerId: e.target.value }))}
              placeholder="customer-123456"
              helperText="Enter the customer's unique identifier"
            />
            <TextField
              label="Subscription Amount (USD)"
              type="number"
              fullWidth
              variant="outlined"
              value={subscriptionData.amount}
              onChange={(e) => setSubscriptionData(prev => ({ ...prev, amount: e.target.value }))}
              placeholder="9.99"
              inputProps={{ min: 0, step: 0.01 }}
              helperText="Amount to charge per billing cycle"
            />
            <TextField
              label="Maximum Amount (USD) - Optional"
              type="number"
              fullWidth
              variant="outlined"
              value={subscriptionData.maxAmount}
              onChange={(e) => setSubscriptionData(prev => ({ ...prev, maxAmount: e.target.value }))}
              placeholder="99.99"
              inputProps={{ min: 0, step: 0.01 }}
              helperText="Maximum amount that can be charged (defaults to subscription amount)"
            />
            <TextField
              label="Billing Frequency (Days)"
              type="number"
              fullWidth
              variant="outlined"
              value={subscriptionData.frequencyDays}
              onChange={(e) => setSubscriptionData(prev => ({ ...prev, frequencyDays: parseInt(e.target.value) || 30 }))}
              inputProps={{ min: 1, max: 365 }}
              helperText="How often to charge (1-365 days). 30 = monthly, 7 = weekly"
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'space-between', px: 3, pb: 3 }}>
          <ThemedButton
            onClick={() => setSubscriptionDialog(false)}
            variant="outlined"
          >
            Cancel
          </ThemedButton>
          <ThemedButton
            onClick={handleCreateSubscription}
            variant="primary"
            disabled={!subscriptionData.customerId.trim() || !subscriptionData.amount || creatingSubscription}
            startIcon={creatingSubscription ? <CircularProgress size={20} /> : <Add />}
            size="large"
            sx={{ minWidth: 200 }}
          >
            {creatingSubscription ? 'Creating...' : 'Create Subscription'}
          </ThemedButton>
        </DialogActions>
      </Dialog>

      {/* View Customers Dialog */}
      <Dialog open={customersDialog} onClose={() => setCustomersDialog(false)} maxWidth="lg" fullWidth>
        <DialogTitle sx={{ textAlign: 'center', pb: 1, fontWeight: 'bold' }}>
          👥 Customer Management
        </DialogTitle>
        <DialogContent sx={{ py: 3 }}>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 3, textAlign: 'center' }}>
            Manage your customer base and view subscription details.
          </Typography>
          <TableContainer component={Paper} sx={{ boxShadow: 1 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold' }}>Customer ID</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Email</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Total Spent</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Subscriptions</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Join Date</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {mockCustomers.map((customer) => (
                  <TableRow key={customer.id} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.875rem' }}>
                        {customer.id}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {customer.email}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 'medium', color: 'success.main' }}>
                        {customer.totalSpent}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {customer.subscriptions}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="textSecondary">
                        {customer.joinDate}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={customer.status}
                        color={customer.status === 'Active' ? 'success' : customer.status === 'Premium' ? 'secondary' : 'warning'}
                        size="small"
                        sx={{ fontSize: '0.75rem', height: 24 }}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', pb: 3 }}>
          <ThemedButton
            variant="outlined"
            onClick={() => setCustomersDialog(false)}
          >
            Close
          </ThemedButton>
          <ThemedButton
            variant="primary"
            onClick={() => showSuccess('Customer export feature coming soon!')}
          >
            Export Customer List
          </ThemedButton>
        </DialogActions>
      </Dialog>

      {/* Withdrawal Dialog */}
      <Dialog open={withdrawalDialog} onClose={() => setWithdrawalDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ textAlign: 'center', pb: 1, fontWeight: 'bold' }}>
          💰 Withdraw Earnings
        </DialogTitle>
        <DialogContent sx={{ py: 3 }}>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 3, textAlign: 'center' }}>
            Enter the amount you want to withdraw to your Lace wallet. This will require a wallet signature.
          </Typography>
          <TextField
            autoFocus
            label="Withdrawal Amount (USD)"
            type="number"
            fullWidth
            variant="outlined"
            value={withdrawalAmount}
            onChange={(e) => setWithdrawalAmount(e.target.value)}
            placeholder="847.30"
            inputProps={{ min: 0, step: 0.01, max: parseFloat(stats.availableBalance.replace(',', '')) }}
            helperText={`Available balance: $${stats.availableBalance}`}
            disabled={withdrawing}
            sx={{ mb: 2 }}
          />
          <Alert severity="info" sx={{ mt: 2 }}>
            <Typography variant="body2">
              <strong>Note:</strong> This withdrawal requires a Lace wallet signature to authorize the transaction.
              Funds will be transferred to your connected wallet address.
            </Typography>
          </Alert>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'space-between', px: 3, pb: 3 }}>
          <ThemedButton
            onClick={() => setWithdrawalDialog(false)}
            variant="outlined"
            disabled={withdrawing}
          >
            Cancel
          </ThemedButton>
          <ThemedButton
            onClick={processWithdrawal}
            variant="primary"
            disabled={!withdrawalAmount || withdrawing}
            startIcon={withdrawing ? <CircularProgress size={20} /> : <AccountBalanceWallet />}
            size="large"
            sx={{ minWidth: 200 }}
          >
            {withdrawing ? 'Processing...' : 'Sign & Withdraw'}
          </ThemedButton>
        </DialogActions>
      </Dialog>
    </GradientBackground>
  );
};