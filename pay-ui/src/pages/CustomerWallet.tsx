import React, { useEffect, useState } from 'react';
import {
  Typography,
  Box,
  Alert,
  CircularProgress,
  Container,
  Stack,
  Chip,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Card,
  CardContent,
  Grid,
  CardActions,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
} from '@mui/material';
import {
  AccountBalanceWallet,
  Add,
  Remove,
  TrendingDown,
  Subscriptions,
  History,
  Payment,
  CheckCircle,
  ShoppingCart,
} from '@mui/icons-material';
import { usePaymentWallet } from '../components/PaymentWallet';
import { PaymentAPI, SUBSCRIPTION_STATUS } from '../../../payroll-api/dist';
import { usePaymentContract } from '../hooks/usePaymentContract';
import { findExistingCustomer, savePaymentUser } from '../utils/PaymentLocalState';
import { take } from 'rxjs/operators';
import { useNotification } from '../contexts/NotificationContext';
import {
  ThemedButton,
  GradientBackground,
  AppHeader,
  ThemedCard,
  ThemedCardContent,
} from '../components';

interface CustomerStats {
  availableBalance: string;
  totalSpent: string;
  activeSubscriptions: number;
  lastActivity: string;
}

export const CustomerWallet: React.FC = () => {
  const { isConnected, connect } = usePaymentWallet();
  const { showSuccess, showError } = useNotification();
  const {
    contractAddress,
    paymentAPI,
    entityId: customerId,
    isInitializing,
    error: contractError,
    setEntity
  } = usePaymentContract();
  const [connecting, setConnecting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<CustomerStats>({
    availableBalance: '456.78',
    totalSpent: '1,234.56',
    activeSubscriptions: 3,
    lastActivity: 'Today',
  });

  // Dialog states
  const [depositDialog, setDepositDialog] = useState(false);
  const [withdrawDialog, setWithdrawDialog] = useState(false);
  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');

  // Subscription states
  const [subscribeDialog, setSubscribeDialog] = useState(false);
  const [subscriptionId, setSubscriptionId] = useState('');
  const [maxSpendingLimit, setMaxSpendingLimit] = useState('100.00');
  const [subscribing, setSubscribing] = useState(false);

  // Mock transaction history
  const [recentTransactions] = useState([
    { id: 'txn-001', merchant: 'TechFlow Solutions', amount: '-$29.99', type: 'Subscription Payment', date: '2 hours ago', status: 'Completed' },
    { id: 'txn-002', merchant: 'Wallet', amount: '+$500.00', type: 'Deposit', date: '1 day ago', status: 'Completed' },
    { id: 'txn-003', merchant: 'CloudServe Pro', amount: '-$49.99', type: 'Subscription Payment', date: '3 days ago', status: 'Completed' },
    { id: 'txn-004', merchant: 'DataSync Inc', amount: '-$19.99', type: 'Subscription Payment', date: '5 days ago', status: 'Completed' },
    { id: 'txn-005', merchant: 'Wallet', amount: '-$100.00', type: 'Withdrawal', date: '1 week ago', status: 'Completed' },
  ]);

  // Mock active subscriptions
  const [activeSubscriptions] = useState([
    { id: 'sub-001', merchant: 'TechFlow Solutions', plan: 'Pro Plan', amount: '$29.99', frequency: 'Monthly', nextPayment: 'Dec 15, 2024', status: 'Active', maxLimit: '$50.00' },
    { id: 'sub-002', merchant: 'CloudServe Pro', plan: 'Premium', amount: '$49.99', frequency: 'Monthly', nextPayment: 'Dec 20, 2024', status: 'Active', maxLimit: '$100.00' },
    { id: 'sub-003', merchant: 'DataSync Inc', plan: 'Basic', amount: '$19.99', frequency: 'Monthly', nextPayment: 'Dec 25, 2024', status: 'Active', maxLimit: '$30.00' },
  ]);

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

  // Set up customer entity when connected but not set
  useEffect(() => {
    if (isConnected && contractAddress && !customerId && !isInitializing) {
      const setupCustomer = async () => {
        try {
          // Check if a customer already exists for this gateway
          const existingCustomer = findExistingCustomer(contractAddress);

          if (existingCustomer) {
            console.log('🔄 Using existing customer:', existingCustomer.entityId);
            await setEntity(existingCustomer.entityId, 'customer');
          } else {
            console.log('🆕 Creating new customer account');
            const generatedCustomerId = `customer-${Date.now()}`;
            await setEntity(generatedCustomerId, 'customer');

            // Save the new customer to cache
            savePaymentUser({
              paymentContractAddress: contractAddress,
              entityId: generatedCustomerId,
              entityType: 'customer',
              label: 'Customer Account',
              createdAt: new Date().toISOString()
            });
          }
        } catch (error) {
          console.error('Failed to set up customer entity:', error);
        }
      };

      setupCustomer();
    }
  }, [isConnected, contractAddress, customerId, isInitializing, setEntity]);

  // Mock data is set in state initialization - no need to fetch from API

  const handleDeposit = async () => {
    if (!paymentAPI || !depositAmount || !customerId) return;

    const amount = parseFloat(depositAmount);
    if (isNaN(amount) || amount <= 0) {
      showError('Please enter a valid deposit amount greater than $0.00');
      return;
    }

    if (amount > 10000) {
      showError('Maximum deposit amount is $10,000.00');
      return;
    }

    try {
      setLoading(true);
      await paymentAPI.depositCustomerFunds(customerId, depositAmount);
      console.log('✅ Deposit successful');
      showSuccess(`Successfully deposited $${depositAmount} to your wallet!`);
      setDepositDialog(false);
      setDepositAmount('');
    } catch (error) {
      console.error('❌ Deposit failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown deposit error';
      showError(`Deposit failed: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async () => {
    if (!paymentAPI || !withdrawAmount || !customerId) return;

    const amount = parseFloat(withdrawAmount);
    const availableBalance = parseFloat(stats.availableBalance);

    if (isNaN(amount) || amount <= 0) {
      showError('Please enter a valid withdrawal amount greater than $0.00');
      return;
    }

    if (amount > availableBalance) {
      showError(`Insufficient funds. Available balance: $${stats.availableBalance}`);
      return;
    }

    try {
      setLoading(true);
      await paymentAPI.withdrawCustomerFunds(customerId, withdrawAmount);
      console.log('✅ Withdrawal successful');
      showSuccess(`Successfully withdrew $${withdrawAmount} from your wallet!`);
      setWithdrawDialog(false);
      setWithdrawAmount('');
    } catch (error) {
      console.error('❌ Withdrawal failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown withdrawal error';
      showError(`Withdrawal failed: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async () => {
    if (!subscriptionId.trim() || !customerId) {
      showError('Please enter a valid subscription ID');
      return;
    }

    try {
      setSubscribing(true);

      // Simulate fetching subscription details from merchant
      console.log('🔍 Looking up subscription:', subscriptionId);
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Mock subscription data based on ID
      const mockSubscription = {
        id: subscriptionId,
        merchantName: 'TechFlow Solutions',
        planName: 'Professional Plan',
        amount: '$39.99',
        frequency: 'Monthly'
      };

      console.log('✅ Subscription found:', mockSubscription);

      const subscriptionPrice = parseFloat(mockSubscription.amount.replace('$', ''));
      const availableBalance = parseFloat(stats.availableBalance);

      if (subscriptionPrice > availableBalance) {
        showError(`Insufficient funds! You need ${mockSubscription.amount} but only have $${stats.availableBalance}. Please deposit more funds.`);
        return;
      }

      // Simulate payment processing
      console.log('🔏 Requesting wallet signature...');
      await new Promise(resolve => setTimeout(resolve, 1500));

      console.log('💳 Processing subscription payment...');
      await new Promise(resolve => setTimeout(resolve, 2000));

      console.log('✅ Subscription activated');
      showSuccess(`Successfully subscribed to ${mockSubscription.planName} from ${mockSubscription.merchantName}! First payment of ${mockSubscription.amount} processed.`);

      // Update stats (simulate payment)
      setStats(prev => ({
        ...prev,
        availableBalance: (availableBalance - subscriptionPrice).toFixed(2),
        totalSpent: (parseFloat(prev.totalSpent) + subscriptionPrice).toFixed(2),
        activeSubscriptions: prev.activeSubscriptions + 1,
        lastActivity: new Date().toLocaleDateString()
      }));

      setSubscribeDialog(false);
      setSubscriptionId('');
    } catch (error) {
      console.error('❌ Subscription failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown subscription error';
      showError(`Subscription failed: ${errorMessage}`);
    } finally {
      setSubscribing(false);
    }
  };

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
  if (!isConnected || !contractAddress || !customerId) {
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
                ? 'To access your customer wallet and manage payments, please connect your Lace wallet. Enjoy private, secure transactions on the Midnight Network.'
                : isInitializing
                ? 'Initializing your payment gateway connection and customer account...'
                : 'Setting up your customer profile...'
              }
            </Typography>
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
                Customer Wallet
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
                <Typography variant="body2" color="textSecondary">
                  Manage your funds and subscriptions securely
                </Typography>
              </Stack>
            </Box>
            <Stack direction="row" spacing={2}>
              <ThemedButton
                variant="outlined"
                startIcon={<Remove />}
                size="small"
                onClick={() => setWithdrawDialog(true)}
                disabled={loading}
              >
                Withdraw
              </ThemedButton>
              <ThemedButton
                variant="outlined"
                startIcon={<Subscriptions />}
                size="small"
                onClick={() => setSubscribeDialog(true)}
                disabled={loading}
              >
                Subscribe to Merchant
              </ThemedButton>
              <ThemedButton
                variant="primary"
                startIcon={<Add />}
                size="small"
                onClick={() => setDepositDialog(true)}
                disabled={loading}
              >
                Deposit Funds
              </ThemedButton>
            </Stack>
          </Stack>
        </Box>

        {/* Stats Cards */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mb: 4 }}>
          <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 45%', md: '1 1 22%' }, minWidth: 250 }}>
            <StatCard
              title="Available Balance"
              value={`$${stats.availableBalance}`}
              icon={<AccountBalanceWallet />}
              color="success"
            />
          </Box>
          <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 45%', md: '1 1 22%' }, minWidth: 250 }}>
            <StatCard
              title="Total Spent"
              value={`$${stats.totalSpent}`}
              icon={<TrendingDown />}
              color="info"
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
              title="Last Activity"
              value={stats.lastActivity}
              icon={<History />}
              color="secondary"
            />
          </Box>
        </Box>

        {/* Quick Actions */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mb: 4 }}>
          <Box sx={{ flex: { xs: '1 1 100%', md: '1 1 65%' } }}>
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
                      onClick={() => setDepositDialog(true)}
                      disabled={loading}
                    >
                      Deposit Funds
                    </ThemedButton>
                  </Box>
                  <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 45%', md: '1 1 30%' } }}>
                    <ThemedButton
                      variant="outlined"
                      fullWidth
                      startIcon={<Subscriptions />}
                      sx={{ py: 2 }}
                      onClick={() => setSubscribeDialog(true)}
                      disabled={loading}
                    >
                      Subscribe to Merchant
                    </ThemedButton>
                  </Box>
                  <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 45%', md: '1 1 30%' } }}>
                    <ThemedButton
                      variant="outlined"
                      fullWidth
                      startIcon={<History />}
                      sx={{ py: 2 }}
                    >
                      Transaction History
                    </ThemedButton>
                  </Box>
                </Box>
              </ThemedCardContent>
            </ThemedCard>
          </Box>

          <Box sx={{ flex: { xs: '1 1 100%', md: '1 1 32%' } }}>
            <ThemedCard>
              <ThemedCardContent>
                <Typography variant="h6" component="h2" sx={{ mb: 3, fontWeight: 'bold' }}>
                  Account Info
                </Typography>
                <Stack spacing={2}>
                  <Box>
                    <Typography variant="body2" color="textSecondary">
                      Customer ID
                    </Typography>
                    <Typography variant="body1" sx={{ fontFamily: 'monospace', fontSize: '0.9rem' }}>
                      {customerId.slice(0, 20)}...
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="textSecondary">
                      Privacy Status
                    </Typography>
                    <Chip
                      label="ZK Protected"
                      color="success"
                      size="small"
                      sx={{
                        fontSize: '0.875rem',
                        fontWeight: 500,
                        px: 1.5,
                        py: 0.5
                      }}
                    />
                  </Box>
                  <Box>
                    <Typography variant="body2" color="textSecondary">
                      Network
                    </Typography>
                    <Typography variant="body1">
                      Midnight Network
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
                onClick={() => showSuccess('Subscription management coming soon!')}
              >
                Manage All
              </ThemedButton>
            </Box>
            <TableContainer component={Paper} sx={{ boxShadow: 'none', backgroundColor: 'transparent' }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold' }}>Merchant</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Plan</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Amount</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Max Limit</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Next Payment</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {activeSubscriptions.map((subscription) => (
                    <TableRow key={subscription.id} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                          {subscription.merchant}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {subscription.plan}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 'medium', color: 'error.main' }}>
                          {subscription.amount}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="textSecondary">
                          {subscription.maxLimit}
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
                          color="success"
                          size="small"
                          sx={{ fontSize: '0.75rem', height: 24 }}
                        />
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={1}>
                          <Button size="small" onClick={() => showSuccess('Pause feature coming soon!')}>
                            Pause
                          </Button>
                          <Button size="small" color="error" onClick={() => showSuccess('Cancel feature coming soon!')}>
                            Cancel
                          </Button>
                        </Stack>
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
                onClick={() => showSuccess('Transaction history page coming soon!')}
              >
                View All
              </ThemedButton>
            </Box>
            <TableContainer component={Paper} sx={{ boxShadow: 'none', backgroundColor: 'transparent' }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold' }}>Merchant</TableCell>
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
                        <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                          {transaction.merchant}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: 'medium',
                            color: transaction.amount.startsWith('+') ? 'success.main' : 'error.main'
                          }}
                        >
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

      {/* Deposit Dialog */}
      <Dialog open={depositDialog} onClose={() => setDepositDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Deposit Funds</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
            Add funds to your wallet to enable payments and subscriptions.
          </Typography>
          <TextField
            autoFocus
            margin="dense"
            label="Amount (USD)"
            type="number"
            fullWidth
            variant="outlined"
            value={depositAmount}
            onChange={(e) => setDepositAmount(e.target.value)}
            placeholder="10.00"
            inputProps={{ min: 0, step: 0.01 }}
          />
        </DialogContent>
        <DialogActions>
          <ThemedButton onClick={() => setDepositDialog(false)} variant="outlined">
            Cancel
          </ThemedButton>
          <ThemedButton
            onClick={handleDeposit}
            variant="primary"
            disabled={!depositAmount || loading}
            startIcon={loading ? <CircularProgress size={20} /> : <Add />}
          >
            {loading ? 'Processing...' : 'Deposit'}
          </ThemedButton>
        </DialogActions>
      </Dialog>

      {/* Withdraw Dialog */}
      <Dialog open={withdrawDialog} onClose={() => setWithdrawDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Withdraw Funds</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
            Withdraw funds from your wallet. Available balance: ${stats.availableBalance}
          </Typography>
          <TextField
            autoFocus
            margin="dense"
            label="Amount (USD)"
            type="number"
            fullWidth
            variant="outlined"
            value={withdrawAmount}
            onChange={(e) => setWithdrawAmount(e.target.value)}
            placeholder="10.00"
            inputProps={{ min: 0, step: 0.01, max: parseFloat(stats.availableBalance) }}
          />
        </DialogContent>
        <DialogActions>
          <ThemedButton onClick={() => setWithdrawDialog(false)} variant="outlined">
            Cancel
          </ThemedButton>
          <ThemedButton
            onClick={handleWithdraw}
            variant="primary"
            disabled={!withdrawAmount || loading}
            startIcon={loading ? <CircularProgress size={20} /> : <Remove />}
          >
            {loading ? 'Processing...' : 'Withdraw'}
          </ThemedButton>
        </DialogActions>
      </Dialog>

      {/* Subscribe to Merchant Dialog */}
      <Dialog open={subscribeDialog} onClose={() => setSubscribeDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ textAlign: 'center', pb: 1, fontWeight: 'bold' }}>
          🔐 Authorize Subscription
        </DialogTitle>
        <DialogContent sx={{ py: 3 }}>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 3, textAlign: 'center' }}>
            Enter the subscription code and set your spending limits for this merchant.
          </Typography>

          <Stack spacing={3}>
            <TextField
              autoFocus
              label="Subscription ID / Code"
              type="text"
              fullWidth
              variant="outlined"
              value={subscriptionId}
              onChange={(e) => setSubscriptionId(e.target.value)}
              placeholder="e.g., SUB-ABC123"
              helperText="Provided by the merchant"
              disabled={subscribing}
            />

            <TextField
              label="Maximum Spending Limit (USD)"
              type="number"
              fullWidth
              variant="outlined"
              value={maxSpendingLimit}
              onChange={(e) => setMaxSpendingLimit(e.target.value)}
              placeholder="100.00"
              helperText="Maximum amount the merchant can charge per payment cycle"
              inputProps={{ min: 0, step: 0.01 }}
              disabled={subscribing}
            />
          </Stack>

          <Alert severity="warning" sx={{ mt: 3, mb: 2 }}>
            <Typography variant="body2">
              <strong>Authorization:</strong> You are authorizing this merchant to charge up to ${maxSpendingLimit} per payment cycle.
              You can pause or cancel this subscription at any time.
            </Typography>
          </Alert>

          <Alert severity="info">
            <Typography variant="body2">
              <strong>Current Balance:</strong> ${stats.availableBalance}
            </Typography>
          </Alert>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'space-between', px: 3, pb: 3 }}>
          <ThemedButton
            onClick={() => setSubscribeDialog(false)}
            variant="outlined"
            disabled={subscribing}
          >
            Cancel
          </ThemedButton>
          <ThemedButton
            onClick={handleSubscribe}
            variant="primary"
            disabled={!subscriptionId.trim() || !maxSpendingLimit || subscribing}
            startIcon={subscribing ? <CircularProgress size={20} /> : <Subscriptions />}
            size="large"
            sx={{ minWidth: 200 }}
          >
            {subscribing ? 'Processing...' : 'Authorize & Subscribe'}
          </ThemedButton>
        </DialogActions>
      </Dialog>
    </GradientBackground>
  );
};