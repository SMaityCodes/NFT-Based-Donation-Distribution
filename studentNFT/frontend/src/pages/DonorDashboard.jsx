import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Container,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  TextField,
  CircularProgress,
  Alert,
  Chip,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Tabs,
  Tab,
  Avatar,
  Stack,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  LinearProgress,
  Badge
} from '@mui/material';
import {
  Campaign as CampaignIcon,
  AccountBalanceWallet as WalletIcon,
  History as HistoryIcon,
  TrendingUp as TrendingIcon,
  School as SchoolIcon,
  Grade as GradeIcon,
  AttachMoney as MoneyIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Refresh as RefreshIcon,
  Visibility as ViewIcon,
  Favorite as FavoriteIcon
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '../utils/constants';
import { ethers } from 'ethers';

const DonorDashboard = () => {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState(0);
  const [campaigns, setCampaigns] = useState([]);
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [donatingStates, setDonatingStates] = useState({}); // Per-campaign donating states
  const [walletConnected, setWalletConnected] = useState(false);
  const [currentAccount, setCurrentAccount] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [message, setMessage] = useState('');
  const [donationAmount, setDonationAmount] = useState({});
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [donationDialogOpen, setDonationDialogOpen] = useState(false);
  const [totalDonated, setTotalDonated] = useState(0);
  const [campaignCount, setCampaignCount] = useState(0);

  // Contract instance
  const [contract, setContract] = useState(null);

  useEffect(() => {
    checkWalletConnection();
  }, []);

  useEffect(() => {
    if (walletConnected && currentAccount) {
      initializeContract();
    }
  }, [walletConnected, currentAccount]);

  useEffect(() => {
    if (contract && walletConnected && currentAccount) {
      fetchData();
    }
  }, [contract, walletConnected, currentAccount]);

  const checkWalletConnection = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const accounts = await provider.listAccounts();
        if (accounts.length > 0) {
          setWalletConnected(true);
          setCurrentAccount(accounts[0].address);
          setMessage('Wallet connected successfully!');
        } else {
          setWalletConnected(false);
          setCurrentAccount(null);
          setMessage('Please connect your wallet to start donating.');
        }

        // Listen for account changes
        window.ethereum.on('accountsChanged', (newAccounts) => {
          if (newAccounts.length > 0) {
            setCurrentAccount(newAccounts[0]);
            setWalletConnected(true);
            setMessage('Wallet account changed.');
          } else {
            setCurrentAccount(null);
            setWalletConnected(false);
            setMessage('Wallet disconnected. Please reconnect.');
          }
        });

      } catch (error) {
        console.error("Error checking wallet connection:", error);
        setMessage("Error checking wallet connection. Please ensure MetaMask is installed.");
        setWalletConnected(false);
      }
    } else {
      setMessage('MetaMask not detected. Please install MetaMask to use this application.');
      setWalletConnected(false);
    }
  };

  const connectWallet = async () => {
    setIsConnecting(true);
    setMessage('');
    try {
      if (typeof window.ethereum === 'undefined') {
        setMessage('MetaMask not detected. Please install MetaMask.');
        return;
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.send("eth_requestAccounts", []);
      if (accounts.length > 0) {
        setWalletConnected(true);
        setCurrentAccount(accounts[0]);
        setMessage('Wallet connected successfully!');
      } else {
        setMessage('No accounts found. Please connect an account in your wallet.');
      }
    } catch (error) {
      console.error("Wallet connection error:", error);
      if (error.code === 4001) {
        setMessage('Wallet connection rejected by the user.');
      } else {
        setMessage(`Failed to connect wallet: ${error.message || 'An unexpected error occurred.'}`);
      }
      setWalletConnected(false);
      setCurrentAccount(null);
    } finally {
      setIsConnecting(false);
    }
  };

  const initializeContract = async () => {
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contractInstance = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
      setContract(contractInstance);
    } catch (error) {
      console.error('Error initializing contract:', error);
      setMessage('Error connecting to smart contract.');
    }
  };

  const fetchData = async () => {
    if (!contract) return;

    try {
      setLoading(true);
      
      // Fetch campaigns
      const campaignsData = await contract.getAllCampaigns();
      const formattedCampaigns = campaignsData.map(campaign => ({
        id: campaign.id.toString(),
        name: campaign.name,
        exists: campaign.exists,
        allowedSchoolTypes: campaign.allowedSchoolTypes,
        allowedStandards: campaign.allowedStandards
      }));
      setCampaigns(formattedCampaigns);
      setCampaignCount(formattedCampaigns.length);

      // Fetch donation events
      const filter = contract.filters.CampaignDonationReceived();
      const events = await contract.queryFilter(filter);
      
      // Process donations
      const userDonations = events
        .filter(event => event.args.donor.toLowerCase() === currentAccount.toLowerCase())
        .map(event => ({
          campaignId: event.args.campaignId.toString(),
          amount: parseFloat(ethers.formatEther(event.args.amount)),
          timestamp: event.blockNumber,
          txHash: event.transactionHash
        }));

      setDonations(userDonations);
      
      // Calculate total donated
      const total = userDonations.reduce((sum, donation) => sum + donation.amount, 0);
      setTotalDonated(total);

    } catch (error) {
      console.error('Error fetching data:', error);
      setMessage('Error loading data. Please try refreshing the page.');
    } finally {
      setLoading(false);
    }
  };

  const handleDonate = async (campaignId) => {
    if (!donationAmount[campaignId] || parseFloat(donationAmount[campaignId]) <= 0) {
      setMessage('Please enter a valid donation amount');
      return;
    }

    // Set donating state for this specific campaign
    setDonatingStates(prev => ({ ...prev, [campaignId]: true }));
    setMessage('Processing donation...');

    try {
      const amount = ethers.parseEther(donationAmount[campaignId]);
      const tx = await contract.donateToCampaign(campaignId, { value: amount });
      
      setMessage(`Transaction sent! Waiting for confirmation... (Tx Hash: ${tx.hash})`);
      await tx.wait();

      setMessage(`🎉 Successfully donated ${donationAmount[campaignId]} ETH!`);
      
      // Clear the donation amount for this campaign
      setDonationAmount(prev => ({ ...prev, [campaignId]: '' }));
      
      // Update donations immediately without refetching all data
      const newDonation = {
        campaignId: campaignId,
        amount: parseFloat(donationAmount[campaignId]),
        timestamp: Date.now(),
        txHash: tx.hash
      };
      
      setDonations(prev => [newDonation, ...prev]);
      setTotalDonated(prev => prev + parseFloat(donationAmount[campaignId]));

    } catch (error) {
      console.error('Error making donation:', error);
      if (error.code === 4001) {
        setMessage('Transaction rejected by the user.');
      } else {
        setMessage(`Donation failed: ${error.reason || error.message || 'An unexpected error occurred.'}`);
      }
    } finally {
      // Clear donating state for this specific campaign
      setDonatingStates(prev => ({ ...prev, [campaignId]: false }));
    }
  };

  const handleAmountChange = (campaignId, value) => {
    setDonationAmount(prev => ({ ...prev, [campaignId]: value }));
  };

  const openDonationDialog = (campaign) => {
    setSelectedCampaign(campaign);
    setDonationDialogOpen(true);
  };

  const closeDonationDialog = () => {
    setDonationDialogOpen(false);
    setSelectedCampaign(null);
  };

  const getCampaignName = (campaignId) => {
    const campaign = campaigns.find(c => c.id === campaignId);
    return campaign ? campaign.name : `Campaign ${campaignId}`;
  };

  const formatAddress = (address) => {
    return `${address.substring(0, 6)}...${address.slice(-4)}`;
  };

  const formatDate = (timestamp) => {
    return new Date(timestamp * 1000).toLocaleDateString();
  };

  if (!walletConnected) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Paper elevation={3} sx={{ p: 4, textAlign: 'center' }}>
          <WalletIcon sx={{ fontSize: 64, color: theme.palette.primary.main, mb: 2 }} />
          <Typography variant="h4" gutterBottom>
            Connect Your Wallet
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            To access the donor dashboard and make donations, please connect your MetaMask wallet.
          </Typography>
          <Button
            variant="contained"
            size="large"
            onClick={connectWallet}
            disabled={isConnecting}
            startIcon={isConnecting ? <CircularProgress size={20} /> : <WalletIcon />}
            sx={{ mt: 2 }}
          >
            {isConnecting ? 'Connecting...' : 'Connect Wallet'}
          </Button>
          {message && (
            <Alert severity="info" sx={{ mt: 2 }}>
              {message}
            </Alert>
          )}
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h3" gutterBottom sx={{ fontWeight: 'bold' }}>
          Donor Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Welcome back! Manage your donations and explore campaigns.
        </Typography>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={2}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    Total Donated
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 'bold', color: theme.palette.primary.main }}>
                    {totalDonated.toFixed(4)} ETH
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: theme.palette.primary.main }}>
                  <MoneyIcon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={2}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    Donations Made
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                    {donations.length}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: theme.palette.secondary.main }}>
                  <HistoryIcon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={2}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    Active Campaigns
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                    {campaignCount}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'success.main' }}>
                  <CampaignIcon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={2}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    Wallet Address
                  </Typography>
                  <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                    {formatAddress(currentAccount)}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'info.main' }}>
                  <WalletIcon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Paper elevation={2} sx={{ mb: 3 }}>
        <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
          <Tab label="Available Campaigns" icon={<CampaignIcon />} />
          <Tab label="My Donations" icon={<HistoryIcon />} />
        </Tabs>
      </Paper>

      {/* Tab Content */}
      {activeTab === 0 && (
        <Box>
          <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
            <Typography variant="h5">
              Available Campaigns ({campaigns.length})
            </Typography>
            <Button
              startIcon={<RefreshIcon />}
              onClick={fetchData}
              disabled={loading}
            >
              Refresh
            </Button>
          </Box>

          {loading ? (
            <Box display="flex" justifyContent="center" py={4}>
              <CircularProgress />
            </Box>
          ) : campaigns.length === 0 ? (
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <CampaignIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary">
                No campaigns available
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Check back later for new campaigns.
              </Typography>
            </Paper>
          ) : (
            <Grid container spacing={3}>
              {campaigns.map((campaign) => {
                const isDonating = donatingStates[campaign.id] || false;
                return (
                  <Grid item xs={12} md={6} lg={4} key={campaign.id}>
                    <Card elevation={3} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                      <CardContent sx={{ flexGrow: 1 }}>
                        <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                            {campaign.name}
                          </Typography>
                          <Chip label={`ID: ${campaign.id}`} size="small" />
                        </Box>
                        
                        <Stack spacing={1} mb={2}>
                          <Box display="flex" alignItems="center" gap={1}>
                            <SchoolIcon fontSize="small" color="action" />
                            <Typography variant="body2" color="text.secondary">
                              School Types: {campaign.allowedSchoolTypes.join(', ')}
                            </Typography>
                          </Box>
                          <Box display="flex" alignItems="center" gap={1}>
                            <GradeIcon fontSize="small" color="action" />
                            <Typography variant="body2" color="text.secondary">
                              Standards: {campaign.allowedStandards.join(', ')}
                            </Typography>
                          </Box>
                        </Stack>

                        <TextField
                          label="Donation Amount (ETH)"
                          type="number"
                          value={donationAmount[campaign.id] || ''}
                          onChange={(e) => handleAmountChange(campaign.id, e.target.value)}
                          fullWidth
                          size="small"
                          inputProps={{ min: "0.001", step: "0.001" }}
                          sx={{ mb: 2 }}
                          disabled={isDonating}
                        />
                      </CardContent>
                      
                      <CardActions>
                        <Button
                          fullWidth
                          variant="contained"
                          onClick={() => handleDonate(campaign.id)}
                          disabled={isDonating || !donationAmount[campaign.id] || parseFloat(donationAmount[campaign.id]) <= 0}
                          startIcon={isDonating ? <CircularProgress size={16} /> : <MoneyIcon />}
                        >
                          {isDonating ? 'Processing...' : 'Donate'}
                        </Button>
                      </CardActions>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>
          )}
        </Box>
      )}

      {activeTab === 1 && (
        <Box>
          <Typography variant="h5" sx={{ mb: 3 }}>
            My Donation History
          </Typography>

          {donations.length === 0 ? (
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <HistoryIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary">
                No donations yet
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Start by donating to a campaign!
              </Typography>
            </Paper>
          ) : (
            <List>
              {donations.map((donation, index) => (
                <React.Fragment key={index}>
                  <ListItem>
                    <ListItemIcon>
                      <Avatar sx={{ bgcolor: 'success.main' }}>
                        <CheckIcon />
                      </Avatar>
                    </ListItemIcon>
                    <ListItemText
                      primary={getCampaignName(donation.campaignId)}
                      secondary={
                        <span>
                          <span style={{ color: 'rgba(0,0,0,0.6)', fontSize: '0.875rem' }}>
                            Amount: <span style={{ display: 'inline-block', verticalAlign: 'middle' }}>
                              <Chip label={`${donation.amount} ETH`} size="small" color="success" component="span" />
                            </span>
                          </span>
                          <br />
                          <span style={{ color: 'rgba(0,0,0,0.6)', fontSize: '0.75rem' }}>
                            Transaction: {formatAddress(donation.txHash)}
                          </span>
                        </span>
                      }
                    />
                    <Chip label="Completed" color="success" size="small" />
                  </ListItem>
                  {index < donations.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          )}
        </Box>
      )}

      {/* Messages */}
      {message && (
        <Alert 
          severity={message.includes('Successfully') || message.includes('connected') ? 'success' : 'info'}
          sx={{ mt: 3 }}
          onClose={() => setMessage('')}
        >
          {message}
        </Alert>
      )}

      {/* Donation Dialog */}
      <Dialog open={donationDialogOpen} onClose={closeDonationDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          Donate to {selectedCampaign?.name}
        </DialogTitle>
        <DialogContent>
          <TextField
            label="Donation Amount (ETH)"
            type="number"
            value={donationAmount[selectedCampaign?.id] || ''}
            onChange={(e) => handleAmountChange(selectedCampaign?.id, e.target.value)}
            fullWidth
            margin="normal"
            inputProps={{ min: "0.001", step: "0.001" }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDonationDialog}>Cancel</Button>
          <Button
            variant="contained"
            onClick={() => {
              handleDonate(selectedCampaign?.id);
              closeDonationDialog();
            }}
            disabled={donatingStates[selectedCampaign?.id] || !donationAmount[selectedCampaign?.id] || parseFloat(donationAmount[selectedCampaign?.id]) <= 0}
          >
            {donatingStates[selectedCampaign?.id] ? 'Processing...' : 'Donate'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default DonorDashboard;
