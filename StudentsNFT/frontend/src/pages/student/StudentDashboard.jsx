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
  Button
} from '@mui/material';
import useWeb3Store from '../../store/web3Store';
import { toast } from 'react-hot-toast';
import {
  School as SchoolIcon,
  Campaign as CampaignIcon,
  Refresh as RefreshIcon,
  CheckCircle as CheckCircleIcon,
  Pending as PendingIcon,
  AttachMoney as MoneyIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import { ethers } from 'ethers';
import { useNavigate } from 'react-router-dom';

const StudentDashboard = () => {
  const navigate = useNavigate();
  const { contract, account } = useWeb3Store();
  const [loading, setLoading] = useState(true);
  const [studentData, setStudentData] = useState({
    profile: null,
    approvedCampaigns: [],
    pendingCampaigns: [],
    totalDonations: '0'
  });

  const fetchStudentData = async () => {
    if (!contract || !account) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Fetch all campaigns
      const allCampaigns = await contract.getAllCampaigns();
      
      // Fetch student's campaigns
      const approvedCampaigns = [];
      const pendingCampaigns = [];

      for (let i = 0; i < allCampaigns.length; i++) {
        try {
          const students = await contract.getStudentsByCampaign(i);
          const student = students.find(s => s.studentAddress.toLowerCase() === account.toLowerCase());
          
          if (student) {
            const campaign = allCampaigns[i];
            const isApproved = student.approved;
            const campaignData = {
              id: i.toString(),
              name: campaign.name,
              status: isApproved ? 'Approved' : 'Pending',
              nftId: student.nftId.toString(),
              amount: campaign.amount.toString()
            };
            
            if (isApproved) {
              approvedCampaigns.push(campaignData);
            } else {
              pendingCampaigns.push(campaignData);
            }
          }
        } catch (error) {
          console.error(`Error fetching student campaign ${i}:`, error);
        }
      }

      // Get the first approved campaign's NFT details if available
      let nftId = '0';
      let totalDonations = '0';
      if (approvedCampaigns.length > 0) {
        const firstApproved = approvedCampaigns[0];
        nftId = firstApproved.nftId;
        try {
          const nftDetails = await contract.getNFTDetails(firstApproved.nftId);
          totalDonations = ethers.formatEther(nftDetails.amount);
        } catch (error) {
          console.error('Error fetching NFT details:', error);
        }
      }

      setStudentData({
        profile: {
          address: account,
          nftId: nftId
        },
        approvedCampaigns,
        pendingCampaigns,
        totalDonations
      });
    } catch (error) {
      console.error('Error fetching student data:', error);
      toast.error('Failed to fetch student data');
    } finally {
      setLoading(false);
    }
  };

  // Add event listener for approval events
  useEffect(() => {
    if (!contract || !account) return;

    const handleStudentApproved = (studentAddress, campaignId, nftId) => {
      if (studentAddress.toLowerCase() === account.toLowerCase()) {
        fetchStudentData(); // Refresh data when student is approved
      }
    };

    contract.on('StudentApproved', handleStudentApproved);

    return () => {
      contract.off('StudentApproved', handleStudentApproved);
    };
  }, [contract, account]);

  useEffect(() => {
    fetchStudentData();
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
          background: 'linear-gradient(45deg, #0288d1 30%, #26c6da 90%)',
          color: 'white'
        }}
      >
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Stack direction="row" spacing={2} alignItems="center">
            <SchoolIcon sx={{ fontSize: 40 }} />
            <Box>
              <Typography variant="h4" fontWeight="bold">
                Student Dashboard
              </Typography>
              <Typography variant="subtitle1" sx={{ opacity: 0.8 }}>
                View your campaign registrations and donations
              </Typography>
            </Box>
          </Stack>
          <Stack direction="row" spacing={2}>
            <Button
              variant="contained"
              color="inherit"
              onClick={() => navigate('/student/campaigns')}
              startIcon={<CampaignIcon />}
              sx={{ 
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.3)',
                }
              }}
            >
              View Campaigns
            </Button>
            <Tooltip title="Refresh Data">
              <IconButton onClick={fetchStudentData} sx={{ color: 'white' }}>
                <RefreshIcon />
              </IconButton>
            </Tooltip>
          </Stack>
        </Stack>
      </Paper>

      {/* Stats Overview */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={2}>
            <CardContent>
              <Stack direction="row" spacing={2} alignItems="center">
                <PersonIcon color="primary" sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="h6" fontWeight="bold" noWrap>
                    {studentData.profile?.address.slice(0, 6)}...{studentData.profile?.address.slice(-4)}
                  </Typography>
                  <Typography color="text.secondary">
                    Wallet Address
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
                <CampaignIcon color="success" sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {studentData.approvedCampaigns.length + studentData.pendingCampaigns.length}
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
                <MoneyIcon color="primary" sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {studentData.totalDonations} ETH
                  </Typography>
                  <Typography color="text.secondary">
                    Total Donations
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
                    {studentData.profile?.nftId !== '0' ? `#${studentData.profile?.nftId}` : 'N/A'}
                  </Typography>
                  <Typography color="text.secondary">
                    NFT ID
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
              <List>
                {studentData.approvedCampaigns.map((campaign) => (
                  <ListItem key={campaign.id}>
                    <ListItemIcon>
                      <CheckCircleIcon color="success" />
                    </ListItemIcon>
                    <ListItemText
                      primary={campaign.name}
                      secondary={`NFT ID: #${campaign.nftId}`}
                    />
                  </ListItem>
                ))}
                {studentData.approvedCampaigns.length === 0 && (
                  <ListItem>
                    <ListItemText primary="No approved campaigns" />
                  </ListItem>
                )}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Pending Campaigns */}
        <Grid item xs={12} md={6}>
          <Card elevation={2}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Pending Campaigns
              </Typography>
              <List>
                {studentData.pendingCampaigns.map((campaign) => (
                  <ListItem key={campaign.id}>
                    <ListItemIcon>
                      <PendingIcon color="warning" />
                    </ListItemIcon>
                    <ListItemText
                      primary={campaign.name}
                      secondary="Waiting for approval"
                    />
                  </ListItem>
                ))}
                {studentData.pendingCampaigns.length === 0 && (
                  <ListItem>
                    <ListItemText primary="No pending campaigns" />
                  </ListItem>
                )}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default StudentDashboard; 