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
  Tooltip
} from '@mui/material';
import useWeb3Store from '../../store/web3Store';
import { toast } from 'react-hot-toast';
import {
  Store as StoreIcon,
  Campaign as CampaignIcon,
  Receipt as ReceiptIcon,
  Person as PersonIcon,
  Refresh as RefreshIcon,
  CheckCircle as CheckCircleIcon,
  Pending as PendingIcon,
  AttachMoney as MoneyIcon
} from '@mui/icons-material';
import { ethers } from 'ethers';

const VendorDashboard = () => {
  const { contract, account } = useWeb3Store();
  const [loading, setLoading] = useState(true);
  const [vendorData, setVendorData] = useState({
    profile: null,
    approvedCampaigns: [],
    pendingCampaigns: [],
    totalDonations: '0',
    totalCampaigns: 0
  });

  const fetchVendorData = async () => {
    if (!contract || !account) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Fetch vendor profile
      const vendorId = await contract.getVendorId(account);
      const vendorProfile = await contract.vendors(vendorId);
      
      // Fetch all campaigns
      const allCampaigns = await contract.getAllCampaigns();
      
      // Fetch vendor's campaigns
      const approvedCampaigns = [];
      const pendingCampaigns = [];

      for (let i = 0; i < allCampaigns.length; i++) {
        try {
          const vendorCampaign = await contract.getVendorCampaign(vendorId, i);
          if (vendorCampaign.registered) {
            const campaign = allCampaigns[i];
            const campaignData = {
              id: i.toString(),
              name: campaign.name,
              status: vendorCampaign.approved ? 'Approved' : 'Pending',
              registrationDate: new Date(vendorCampaign.registrationDate.toNumber() * 1000).toLocaleDateString()
            };
            
            if (vendorCampaign.approved) {
              approvedCampaigns.push(campaignData);
            } else {
              pendingCampaigns.push(campaignData);
            }
          }
        } catch (error) {
          console.error(`Error fetching vendor campaign ${i}:`, error);
        }
      }

      // Fetch total donations
      const totalDonations = await contract.getVendorTotalDonations(vendorId);

      setVendorData({
        profile: {
          id: vendorId.toString(),
          address: vendorProfile.vendorAddress,
          approved: vendorProfile.approved
        },
        approvedCampaigns,
        pendingCampaigns,
        totalDonations: ethers.utils.formatEther(totalDonations),
        totalCampaigns: approvedCampaigns.length + pendingCampaigns.length
      });
    } catch (error) {
      console.error('Error fetching vendor data:', error);
      toast.error('Failed to fetch vendor data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVendorData();
  }, [contract, account]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
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
          background: 'linear-gradient(45deg, #FF9800 30%, #FFB74D 90%)',
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
                Manage your campaign participation
              </Typography>
            </Box>
          </Stack>
          <Tooltip title="Refresh Data">
            <IconButton onClick={fetchVendorData} sx={{ color: 'white' }}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Stack>
      </Paper>

      {/* Stats Overview */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={2}>
            <CardContent>
              <Stack direction="row" spacing={2} alignItems="center">
                <StoreIcon color="warning" sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {vendorData.profile?.id}
                  </Typography>
                  <Typography color="text.secondary">
                    Vendor ID
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={2}>
            <CardContent>
              <Stack direction="row" spacing={2} alignItems="center">
                <CampaignIcon color="primary" sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {vendorData.totalCampaigns}
                  </Typography>
                  <Typography color="text.secondary">
                    Total Campaigns
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={2}>
            <CardContent>
              <Stack direction="row" spacing={2} alignItems="center">
                <CheckCircleIcon color="success" sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {vendorData.approvedCampaigns.length}
                  </Typography>
                  <Typography color="text.secondary">
                    Approved Campaigns
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={2}>
            <CardContent>
              <Stack direction="row" spacing={2} alignItems="center">
                <MoneyIcon color="error" sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {vendorData.totalDonations} ETH
                  </Typography>
                  <Typography color="text.secondary">
                    Total Donations
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Campaign Lists */}
      <Grid container spacing={3}>
        {/* Approved Campaigns */}
        <Grid item xs={12} md={6}>
          <Card elevation={2}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Approved Campaigns
              </Typography>
              {vendorData.approvedCampaigns.length === 0 ? (
                <Typography color="text.secondary" align="center" py={2}>
                  No approved campaigns yet
                </Typography>
              ) : (
                <List>
                  {vendorData.approvedCampaigns.map((campaign) => (
                    <React.Fragment key={campaign.id}>
                      <ListItem>
                        <ListItemIcon>
                          <CheckCircleIcon color="success" />
                        </ListItemIcon>
                        <ListItemText
                          primary={campaign.name}
                          secondary={
                            <Stack direction="row" spacing={1} mt={1}>
                              <Chip 
                                label="Approved"
                                color="success"
                                size="small"
                              />
                              <Chip 
                                label={`Registered: ${campaign.registrationDate}`}
                                size="small"
                              />
                            </Stack>
                          }
                        />
                      </ListItem>
                      <Divider />
                    </React.Fragment>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Pending Campaigns */}
        <Grid item xs={12} md={6}>
          <Card elevation={2}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Pending Approvals
              </Typography>
              {vendorData.pendingCampaigns.length === 0 ? (
                <Typography color="text.secondary" align="center" py={2}>
                  No pending approvals
                </Typography>
              ) : (
                <List>
                  {vendorData.pendingCampaigns.map((campaign) => (
                    <React.Fragment key={campaign.id}>
                      <ListItem>
                        <ListItemIcon>
                          <PendingIcon color="warning" />
                        </ListItemIcon>
                        <ListItemText
                          primary={campaign.name}
                          secondary={
                            <Stack direction="row" spacing={1} mt={1}>
                              <Chip 
                                label="Pending"
                                color="warning"
                                size="small"
                              />
                              <Chip 
                                label={`Registered: ${campaign.registrationDate}`}
                                size="small"
                              />
                            </Stack>
                          }
                        />
                      </ListItem>
                      <Divider />
                    </React.Fragment>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default VendorDashboard; 