import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  Chip,
  Stack,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Tooltip,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Select,
  MenuItem,
  FormControl,
  InputLabel
} from '@mui/material';
import useWeb3Store from '../../store/web3Store';
import { toast } from 'react-hot-toast';
import {
  Store as StoreIcon,
  Refresh as RefreshIcon,
  CheckCircle as CheckCircleIcon,
  Pending as PendingIcon,
  AttachMoney as MoneyIcon,
  Person as PersonIcon,
  QrCode as QrCodeIcon
} from '@mui/icons-material';
import { ethers } from 'ethers';
import { useNavigate } from 'react-router-dom';

const VendorDashboard = () => {
  const navigate = useNavigate();
  const { contract, account } = useWeb3Store();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [campaigns, setCampaigns] = useState([]);
  const [selectedCampaign, setSelectedCampaign] = useState('');
  const [vendorData, setVendorData] = useState({
    profile: null,
    verifiedNFTs: [],
    usedNFTs: []
  });
  const [verifyDialogOpen, setVerifyDialogOpen] = useState(false);
  const [nftId, setNftId] = useState('');
  const [itemProvided, setItemProvided] = useState('');

  const fetchCampaigns = async () => {
    if (!contract) return;

    try {
      const campaignCount = await contract.campaignCount();
      const campaignList = [];

      for (let i = 0; i < campaignCount; i++) {
        const campaign = await contract.campaigns(i);
        if (campaign.exists) {
          campaignList.push({
            id: i,
            name: campaign.name
          });
        }
      }

      setCampaigns(campaignList);
      if (campaignList.length > 0 && !selectedCampaign) {
        setSelectedCampaign(campaignList[0].id.toString());
      }
    } catch (error) {
      console.error('Error fetching campaigns:', error);
      setError('Failed to fetch campaigns: ' + error.message);
    }
  };

  const fetchVendorData = async () => {
    if (!contract || !account) {
      setError('Contract or account not available');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Check if address is registered as vendor using VendorRegistered event
      const filter = contract.filters.VendorRegistered();
      const events = await contract.queryFilter(filter, 0, 'latest');
      const isVendor = events.some(event => 
        event.args.vendorAddress.toLowerCase() === account.toLowerCase()
      );
      
      if (!isVendor) {
        try {
          const tx = await contract.registerVendor(account);
          await tx.wait();
          toast.success('Successfully registered as vendor');
        } catch (error) {
          console.error('Error registering as vendor:', error);
          setError('Failed to register as vendor: ' + error.message);
          return;
        }
      }

      // Get all NFTs that have been used by this vendor
      const usedNFTs = [];
      const verifiedNFTs = [];

      if (selectedCampaign !== '') {
        try {
          const campaign = await contract.campaigns(selectedCampaign);
          if (!campaign.exists) {
            console.log(`Campaign ${selectedCampaign} does not exist`);
            return;
          }

          const students = await contract.getStudentsByCampaign(selectedCampaign);
          console.log(`Found ${students.length} students in campaign ${selectedCampaign}`);
          
          for (const student of students) {
            if (student.approved) {
              try {
                const nftDetails = await contract.getNFTDetails(student.nftId);
                
                if (nftDetails.used && nftDetails.vendorAddress.toLowerCase() === account.toLowerCase()) {
                  usedNFTs.push({
                    nftId: student.nftId.toString(),
                    studentAddress: student.studentAddress,
                    campaignName: campaign.name,
                    itemProvided: nftDetails.itemProvided,
                    usedAt: new Date(nftDetails.usedAt.toNumber() * 1000).toLocaleDateString()
                  });
                } else if (!nftDetails.used) {
                  verifiedNFTs.push({
                    nftId: student.nftId.toString(),
                    studentAddress: student.studentAddress,
                    campaignName: campaign.name,
                    amount: ethers.formatEther(nftDetails.amount)
                  });
                }
              } catch (error) {
                console.error(`Error processing NFT ${student.nftId}:`, error);
              }
            }
          }
        } catch (error) {
          console.error(`Error processing campaign ${selectedCampaign}:`, error);
        }
      }

      setVendorData({
        profile: {
          address: account,
          isRegistered: true
        },
        verifiedNFTs,
        usedNFTs
      });
    } catch (error) {
      console.error('Error fetching vendor data:', error);
      setError('Failed to fetch vendor data: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, [contract]);

  useEffect(() => {
    if (selectedCampaign) {
      fetchVendorData();
    }
  }, [contract, account, selectedCampaign]);

  const handleVerifyNFT = async () => {
    if (!contract || !nftId || !itemProvided) {
      toast.error('Please provide NFT ID and item details');
      return;
    }

    try {
      const tx = await contract.verifyAndUseNFT(nftId, itemProvided);
      await tx.wait();
      toast.success('NFT verified and used successfully');
      setVerifyDialogOpen(false);
      setNftId('');
      setItemProvided('');
      fetchVendorData();
    } catch (error) {
      console.error('Error verifying NFT:', error);
      toast.error('Failed to verify NFT: ' + error.message);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3, maxWidth: '1400px', margin: '0 auto' }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button 
          variant="contained" 
          color="primary" 
          onClick={fetchVendorData}
          startIcon={<RefreshIcon />}
        >
          Retry
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <Paper 
        elevation={0} 
        sx={{ 
          p: 3, 
          mb: 4, 
          borderRadius: 2,
          background: 'linear-gradient(45deg, #2e7d32 30%, #66bb6a 90%)',
          color: 'white'
        }}
      >
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Stack direction="row" spacing={2} alignItems="center">
            <StoreIcon sx={{ fontSize: 40 }} />
            <Box>
              <Typography variant="h4" fontWeight="bold">
                Vendor Dashboard
              </Typography>
              <Typography variant="subtitle1" sx={{ opacity: 0.8 }}>
                Verify and use student NFTs
              </Typography>
            </Box>
          </Stack>
          <Stack direction="row" spacing={2}>
            <FormControl sx={{ minWidth: 200, backgroundColor: 'rgba(255, 255, 255, 0.2)' }}>
              <InputLabel sx={{ color: 'white' }}>Select Campaign</InputLabel>
              <Select
                value={selectedCampaign}
                onChange={(e) => setSelectedCampaign(e.target.value)}
                label="Select Campaign"
                sx={{ 
                  color: 'white',
                  '.MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255, 255, 255, 0.3)' },
                  '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255, 255, 255, 0.5)' },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: 'white' },
                  '.MuiSvgIcon-root': { color: 'white' }
                }}
              >
                {campaigns.map((campaign) => (
                  <MenuItem key={campaign.id} value={campaign.id.toString()}>
                    {campaign.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Button
              variant="contained"
              color="inherit"
              onClick={() => setVerifyDialogOpen(true)}
              startIcon={<QrCodeIcon />}
              sx={{ 
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.3)',
                }
              }}
            >
              Verify NFT
            </Button>
            <Tooltip title="Refresh Data">
              <IconButton onClick={fetchVendorData} sx={{ color: 'white' }}>
                <RefreshIcon />
              </IconButton>
            </Tooltip>
          </Stack>
        </Stack>
      </Paper>

      {/* Profile Information */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card elevation={2}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Profile Information
              </Typography>
              <Stack spacing={2}>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Wallet Address
                  </Typography>
                  <Typography variant="body1">
                    {vendorData.profile?.address}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Status
                  </Typography>
                  <Chip 
                    label={vendorData.profile?.isRegistered ? 'Registered' : 'Not Registered'}
                    color={vendorData.profile?.isRegistered ? 'success' : 'warning'}
                    size="small"
                  />
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card elevation={2}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Statistics
              </Typography>
              <Stack spacing={2}>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Total NFTs Used
                  </Typography>
                  <Typography variant="body1">
                    {vendorData.usedNFTs.length}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Available NFTs
                  </Typography>
                  <Typography variant="body1">
                    {vendorData.verifiedNFTs.length}
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Available NFTs */}
        <Grid item xs={12}>
          <Card elevation={2}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Available NFTs
              </Typography>
              {vendorData.verifiedNFTs.length === 0 ? (
                <Typography color="text.secondary">
                  No available NFTs
                </Typography>
              ) : (
                <List>
                  {vendorData.verifiedNFTs.map((nft) => (
                    <ListItem key={nft.nftId}>
                      <ListItemIcon>
                        <CheckCircleIcon color="success" />
                      </ListItemIcon>
                      <ListItemText
                        primary={`NFT #${nft.nftId}`}
                        secondary={
                          <Stack spacing={0.5}>
                            <Typography variant="body2">
                              Campaign: {nft.campaignName}
                            </Typography>
                            <Typography variant="body2">
                              Student: {nft.studentAddress.slice(0, 6)}...{nft.studentAddress.slice(-4)}
                            </Typography>
                            <Typography variant="body2">
                              Amount: {nft.amount} ETH
                            </Typography>
                          </Stack>
                        }
                      />
                      <Button
                        variant="outlined"
                        color="primary"
                        size="small"
                        onClick={() => {
                          setNftId(nft.nftId);
                          setVerifyDialogOpen(true);
                        }}
                      >
                        Verify & Use
                      </Button>
                    </ListItem>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Used NFTs */}
        <Grid item xs={12}>
          <Card elevation={2}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Used NFTs ({vendorData.usedNFTs.length})
              </Typography>
              {vendorData.usedNFTs.length === 0 ? (
                <Typography color="text.secondary">
                  No used NFTs found. NFTs will appear here after you verify and use them.
                </Typography>
              ) : (
                <List>
                  {vendorData.usedNFTs.map((nft) => (
                    <ListItem key={nft.nftId}>
                      <ListItemIcon>
                        <CheckCircleIcon color="success" />
                      </ListItemIcon>
                      <ListItemText
                        primary={`NFT #${nft.nftId}`}
                        secondary={
                          <Stack spacing={0.5}>
                            <Typography variant="body2">
                              Campaign: {nft.campaignName}
                            </Typography>
                            <Typography variant="body2">
                              Student: {nft.studentAddress.slice(0, 6)}...{nft.studentAddress.slice(-4)}
                            </Typography>
                            <Typography variant="body2">
                              Item Provided: {nft.itemProvided}
                            </Typography>
                            <Typography variant="body2">
                              Used At: {nft.usedAt}
                            </Typography>
                          </Stack>
                        }
                      />
                      <Chip 
                        label="Used"
                        color="success"
                        size="small"
                      />
                    </ListItem>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Verify NFT Dialog */}
      <Dialog open={verifyDialogOpen} onClose={() => setVerifyDialogOpen(false)}>
        <DialogTitle>Verify and Use NFT</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="NFT ID"
              value={nftId}
              onChange={(e) => setNftId(e.target.value)}
              fullWidth
            />
            <TextField
              label="Item Provided"
              value={itemProvided}
              onChange={(e) => setItemProvided(e.target.value)}
              fullWidth
              multiline
              rows={3}
              placeholder="Describe the item or service provided to the student"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setVerifyDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleVerifyNFT} variant="contained" color="primary">
            Verify & Use
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default VendorDashboard; 