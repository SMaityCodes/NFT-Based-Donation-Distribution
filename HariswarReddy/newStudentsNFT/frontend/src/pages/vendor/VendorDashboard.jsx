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

  const STANDARD_LABELS = [
    'PRIMARY_1', 'PRIMARY_2', 'PRIMARY_3', 'PRIMARY_4', 'PRIMARY_5',
    'MIDDLE_6', 'MIDDLE_7', 'MIDDLE_8',
    'HIGH_9', 'HIGH_10',
    'INTER_11', 'INTER_12',
    'BTECH_1', 'BTECH_2', 'BTECH_3', 'BTECH_4'
  ];

  const fetchAllData = async (campaignIdOverride) => {
    if (!contract || !account) return;
    setLoading(true);
    setError(null);
    try {
      // Fetch campaigns using getAllCampaigns instead of campaignCount
      const allCampaigns = await contract.getAllCampaigns();
      console.log('[VendorDashboard] Raw campaigns from getAllCampaigns:', allCampaigns);
      
      const campaignList = allCampaigns.map((campaign, index) => ({
        id: index.toString(),
        name: campaign.name
      }));
      
      const allCampaignsOption = { id: 'all', name: 'All Campaigns' };
      const campaignsWithAll = [allCampaignsOption, ...campaignList];
      setCampaigns(campaignsWithAll);
      console.log('[VendorDashboard] Processed campaigns:', campaignsWithAll);
      
      // Set selected campaign if not set
      if (!selectedCampaign || !campaignsWithAll.find(c => c.id === selectedCampaign)) {
        setSelectedCampaign(allCampaignsOption.id);
      }

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
          setLoading(false);
          return;
        }
      }

      // Get all NFTs that have been used by this vendor
      const usedNFTs = [];
      const verifiedNFTs = [];
      // Helper to process a campaign
      const processCampaign = async (campaignId) => {
        try {
          console.log(`[VendorDashboard] Processing campaign ${campaignId}`);
          // Get campaign data directly from contract to ensure we have the latest data
          const campaign = await contract.campaigns(campaignId);
          if (!campaign || !campaign.exists) {
            console.log(`[VendorDashboard] Campaign ${campaignId} not found or doesn't exist`);
            return;
          }
          console.log(`[VendorDashboard] Campaign ${campaignId} data:`, campaign);
          const students = await contract.getStudentsByCampaign(campaignId);
          console.log(`[VendorDashboard] Students in campaign ${campaignId}:`, students);
          for (const student of students) {
            if (student.approved) {
              try {
                console.log(`[VendorDashboard] Processing approved student with NFT ${student.nftId} in campaign ${campaignId}`);
                const nftDetails = await contract.getNFTDetails(student.nftId);
                console.log(`[VendorDashboard] NFT details for ${student.nftId}:`, nftDetails);
                const [standardIndex, amount, used, vendorAddress, ] = nftDetails;
                // Fetch tokenURI for this NFT
                let tokenURI = '';
                try {
                  tokenURI = await contract.tokenURI(student.nftId);
                } catch (err) {
                  tokenURI = '';
                }
                if (used && vendorAddress.toLowerCase() === account.toLowerCase()) {
                  // Fetch vendor transaction details for this NFT
                  let itemProvided = "";
                  let usedAt = "";
                  try {
                    const tx = await contract.getVendorTransaction(student.nftId);
                    itemProvided = tx[2];
                    usedAt = tx[3] ? new Date(Number(tx[3].toString()) * 1000).toLocaleDateString() : "";
                  } catch (err) {
                    itemProvided = "Unknown";
                    usedAt = "";
                  }
                  usedNFTs.push({
                    nftId: student.nftId.toString(),
                    studentAddress: student.studentAddress,
                    campaignName: campaign.name,
                    itemProvided,
                    usedAt,
                    tokenURI,
                    standard: Number(standardIndex)
                  });
                } else if (!used) {
                  verifiedNFTs.push({
                    nftId: student.nftId.toString(),
                    studentAddress: student.studentAddress,
                    campaignName: campaign.name,
                    amount: ethers.formatEther(amount),
                    tokenURI,
                    standard: Number(standardIndex)
                  });
                }
              } catch (error) {
                console.error(`[VendorDashboard] Error processing NFT ${student.nftId}:`, error);
              }
            }
          }
        } catch (error) {
          console.error(`[VendorDashboard] Error processing campaign ${campaignId}:`, error);
        }
      };
      // Determine which campaigns to process
      const campaignIdToUse = campaignIdOverride || selectedCampaign;
      if (campaignIdToUse && campaignIdToUse !== 'all') {
        await processCampaign(campaignIdToUse);
      } else {
        for (const campaign of campaignList) {
          await processCampaign(campaign.id);
        }
      }
      console.log('[VendorDashboard] Verified NFTs:', verifiedNFTs);
      console.log('[VendorDashboard] Used NFTs:', usedNFTs);
      
      // Fallback: Check global student list for any missing NFTs
      try {
        console.log('[VendorDashboard] Checking global student list for missing NFTs...');
        const studentCount = await contract.studentCount();
        console.log('[VendorDashboard] Total students in contract:', studentCount.toString());
        for (let i = 0; i < studentCount; i++) {
          try {
            const studentData = await contract.students(i);
            console.log(`[VendorDashboard] Student ${i}:`, studentData);
            if (studentData.approved && studentData.nftId.toString() !== '0') {
              // Check if this NFT is already in our lists (compare as strings)
              const nftId = studentData.nftId.toString();
              const isAlreadyProcessed = verifiedNFTs.some(nft => nft.nftId.toString() === nftId) || 
                                         usedNFTs.some(nft => nft.nftId.toString() === nftId);
              if (!isAlreadyProcessed) {
                console.log(`[VendorDashboard] Found unprocessed NFT ${nftId} for student ${i}`);
                try {
                  const nftDetails = await contract.getNFTDetails(studentData.nftId);
                  console.log(`[VendorDashboard] NFT details for ${nftId}:`, nftDetails);
                  const [standardIndex, amount, used, vendorAddress, ] = nftDetails;
                  // Fetch tokenURI for this NFT
                  let tokenURI = '';
                  try {
                    tokenURI = await contract.tokenURI(studentData.nftId);
                  } catch (err) {
                    tokenURI = '';
                  }
                  // Get campaign name
                  let campaignName = 'Unknown Campaign';
                  try {
                    if (studentData.campaignId !== undefined) {
                      const campaign = await contract.campaigns(studentData.campaignId);
                      campaignName = campaign.name;
                    }
                  } catch (error) {
                    console.log('[VendorDashboard] Could not fetch campaign name:', error);
                  }
                  if (used && vendorAddress.toLowerCase() === account.toLowerCase()) {
                    // Fetch vendor transaction details for this NFT
                    let itemProvided = "";
                    let usedAt = "";
                    try {
                      const tx = await contract.getVendorTransaction(studentData.nftId);
                      itemProvided = tx[2];
                      usedAt = tx[3] ? new Date(Number(tx[3].toString()) * 1000).toLocaleDateString() : "";
                    } catch (err) {
                      itemProvided = "Unknown";
                      usedAt = "";
                    }
                    usedNFTs.push({
                      nftId: nftId,
                      studentAddress: studentData.studentAddress,
                      campaignName: campaignName,
                      itemProvided,
                      usedAt,
                      tokenURI,
                      standard: Number(standardIndex)
                    });
                    console.log(`[VendorDashboard] Added used NFT ${nftId} for vendor.`);
                  } else if (!used) {
                    verifiedNFTs.push({
                      nftId: nftId,
                      studentAddress: studentData.studentAddress,
                      campaignName: campaignName,
                      amount: ethers.formatEther(amount),
                      tokenURI,
                      standard: Number(standardIndex)
                    });
                    console.log(`[VendorDashboard] Added verified NFT ${nftId}.`);
                  }
                } catch (error) {
                  console.error(`[VendorDashboard] Error processing global NFT ${nftId}:`, error);
                }
              } else {
                console.log(`[VendorDashboard] NFT ${nftId} already processed.`);
              }
            }
          } catch (error) {
            console.error(`[VendorDashboard] Error checking student ${i}:`, error);
          }
        }
      } catch (error) {
        console.error('[VendorDashboard] Error checking global student list:', error);
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
      console.error('Error fetching all vendor data:', error);
      setError('Failed to fetch vendor data: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
    // eslint-disable-next-line
  }, [contract, account]);

  useEffect(() => {
    // When selectedCampaign changes, refetch vendor data for that campaign
    if (selectedCampaign) {
      fetchAllData(selectedCampaign);
    }
    // eslint-disable-next-line
  }, [selectedCampaign]);

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
      // Force refresh all data after verification
      await fetchAllData();
    } catch (error) {
      console.error('Error verifying NFT:', error);
      if (error?.reason === 'NFT already used' || (error?.errorName === 'Error' && error?.errorArgs?.[0] === 'NFT already used') || (error?.data && error.data.includes('4e465420616c72656164792075736564'))) {
        toast.error('NFT already verified/used');
      } else {
        toast.error('Failed to verify NFT: ' + error.message);
      }
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
          onClick={() => fetchAllData()}
          startIcon={<RefreshIcon />}
        >
          Retry
        </Button>
      </Box>
    );
  }
  console.log("vendor data nfts", vendorData);
  // console.log("used nfts", vendorData);
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
            <FormControl sx={{ minWidth: 200, backgroundColor: 'rgba(255, 255, 255, 0.2)' }} disabled={loading}>
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
                  <MenuItem key={campaign.id} value={campaign.id}>
                    {campaign.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            {/* <Button
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
            </Button> */}
          <Tooltip title="Refresh Data">
            <IconButton onClick={() => fetchAllData()} sx={{ color: 'white' }}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          <Button
            variant="contained"
            color="inherit"
            onClick={() => fetchAllData()}
            startIcon={<RefreshIcon />}
            sx={{ 
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.3)',
              }
            }}
          >
            Refresh Data
          </Button>
          </Stack>
        </Stack>
      </Paper>

      {/* Debug Section - Remove in production */}
      {process.env.NODE_ENV === 'development' && (
        <Paper sx={{ p: 2, mb: 3, backgroundColor: '#f5f5f5' }}>
          <Typography variant="h6" gutterBottom>Debug Info</Typography>
          <Typography variant="body2" component="pre" sx={{ fontSize: '12px', overflow: 'auto' }}>
            {JSON.stringify({
              campaigns: campaigns,
              selectedCampaign: selectedCampaign,
              vendorData: vendorData
            }, (key, value) => {
              if (typeof value === 'bigint') {
                return value.toString();
              }
              return value;
            }, 2)}
          </Typography>
        </Paper>
      )}

      {/* Profile Information */}
      <Grid container spacing={3} >
        <Grid item xs={12} md={6} sx={{width:"70vw"}}>
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

        <Grid container >
          <Grid item xs={12} md={6} sx={{width:"40vw"}}>
          <Card elevation={2}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Statistics
              </Typography>
              <Stack spacing={2} direction={"row"} >
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

        </Grid>
        

        {/* Used NFTs */}
        <Grid item xs={12} sx={{width:"70vw"}}>
          <Card elevation={2} sx={{marginBottom:"1rem"}}>
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
                            <span>
                              <Typography variant="body2" component="span" display="block">
                                Campaign: {nft.campaignName}
                              </Typography>
                              <Typography variant="body2" component="span" display="block">
                                Student: {nft.studentAddress.slice(0, 6)}...{nft.studentAddress.slice(-4)}
                              </Typography>
                              <Typography variant="body2" component="span" display="block">
                                Amount: {nft.amount} ETH
                              </Typography>
                              {nft.tokenURI && (
                                <Typography variant="body2" component="span" display="block">
                                  Token URI: <a href={nft.tokenURI} target="_blank" rel="noopener noreferrer">{nft.tokenURI}</a>
                                </Typography>
                              )}
                              {nft.standard !== undefined && (
                                <Button
                                  variant="outlined"
                                  color="secondary"
                                  size="small"
                                  sx={{ mt: 1 }}
                                  onClick={() => navigate(`/token-uri/${STANDARD_LABELS[nft.standard]}`)}
                                >
                                  View Standard Token URI
                                </Button>
                              )}
                            </span>
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
                            <span>
                              <Typography variant="body2" component="span" display="block">
                                Campaign: {nft.campaignName}
                              </Typography>
                              <Typography variant="body2" component="span" display="block">
                                Student: {nft.studentAddress.slice(0, 6)}...{nft.studentAddress.slice(-4)}
                              </Typography>
                              <Typography variant="body2" component="span" display="block">
                                Item Provided: {nft.itemProvided}
                              </Typography>
                              <Typography variant="body2" component="span" display="block">
                                Used At: {nft.usedAt}
                              </Typography>
                              {nft.tokenURI && (
                                <Typography variant="body2" component="span" display="block">
                                  Token URI:
                                   {/* <a href={nft.tokenURI} target="_blank" rel="noopener noreferrer">{nft.tokenURI}</a> */}
                                </Typography>
                              )}
                              {nft.standard !== undefined && (
                                <Button
                                  variant="outlined"
                                  color="secondary"
                                  size="small"
                                  sx={{ mt: 1 }}
                                  onClick={() => navigate(`/token-uri/${STANDARD_LABELS[nft.standard]}`)}
                                >
                                  View Standard Token URI
                                </Button>
                              )}
                            </span>
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