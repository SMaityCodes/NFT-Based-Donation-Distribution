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

const StudentProfile = () => {
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
          // Get all students in this campaign
          const students = await contract.getStudentsByCampaign(i);
          
          // Find if the current user is registered in this campaign
          const student = students.find(s => s.studentAddress.toLowerCase() === account.toLowerCase());
          
          if (student) {
            const campaign = allCampaigns[i];
            const isApproved = student.approved;
            
            // Get campaign details
            const campaignData = {
              id: i.toString(),
              name: campaign.name,
              status: isApproved ? 'Approved' : 'Pending',
              nftId: student.nftId.toString(),
              amount: campaign.amount.toString(),
              schoolType: student.schoolType,
              standard: student.standard,
              registrationDate: new Date(student.registrationDate.toNumber() * 1000).toLocaleDateString(),
              admissionLetterHash: student.admissionLetterHash
            };
            
            if (isApproved) {
              // For approved campaigns, get NFT details
              try {
                const nftDetails = await contract.getNFTDetails(student.nftId);
                campaignData.nftDetails = {
                  amount: ethers.formatEther(nftDetails.amount),
                  mintedAt: new Date(nftDetails.mintedAt.toNumber() * 1000).toLocaleDateString(),
                  used: nftDetails.used
                };
              } catch (error) {
                console.error('Error fetching NFT details:', error);
              }
              approvedCampaigns.push(campaignData);
            } else {
              pendingCampaigns.push(campaignData);
            }
          }
        } catch (error) {
          console.error(`Error fetching student campaign ${i}:`, error);
        }
      }

      // Calculate total donations from all approved campaigns
      const totalDonations = approvedCampaigns.reduce((total, campaign) => {
        return total + (campaign.nftDetails ? parseFloat(campaign.nftDetails.amount) : 0);
      }, 0);

      setStudentData({
        profile: {
          address: account,
          nftId: approvedCampaigns.length > 0 ? approvedCampaigns[0].nftId : '0'
        },
        approvedCampaigns,
        pendingCampaigns,
        totalDonations: totalDonations.toString()
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
            <PersonIcon sx={{ fontSize: 40 }} />
            <Box>
              <Typography variant="h4" fontWeight="bold">
                Student Profile
              </Typography>
              <Typography variant="subtitle1" sx={{ opacity: 0.8 }}>
                View your profile and campaign details
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
                    {studentData.profile?.address}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    NFT ID
                  </Typography>
                  <Typography variant="body1">
                    {studentData.profile?.nftId !== '0' ? `#${studentData.profile?.nftId}` : 'Not Assigned'}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Total Donations
                  </Typography>
                  <Typography variant="body1">
                    {studentData.totalDonations} ETH
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card elevation={2}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Campaign Statistics
              </Typography>
              <Stack spacing={2}>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Total Campaigns
                  </Typography>
                  <Typography variant="body1">
                    {studentData.approvedCampaigns.length + studentData.pendingCampaigns.length}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Approved Campaigns
                  </Typography>
                  <Typography variant="body1">
                    {studentData.approvedCampaigns.length}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Pending Campaigns
                  </Typography>
                  <Typography variant="body1">
                    {studentData.pendingCampaigns.length}
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Campaign Lists */}
        <Grid item xs={12}>
          <Card elevation={2}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Approved Campaigns
              </Typography>
              {studentData.approvedCampaigns.length === 0 ? (
                <Typography color="text.secondary">
                  No approved campaigns yet
                </Typography>
              ) : (
                <List>
                  {studentData.approvedCampaigns.map((campaign) => (
                    <ListItem key={campaign.id}>
                      <ListItemIcon>
                        <CheckCircleIcon color="success" />
                      </ListItemIcon>
                      <ListItemText
                        primary={campaign.name}
                        secondary={
                          <Stack spacing={0.5}>
                            <Typography variant="body2">
                              NFT ID: #{campaign.nftId}
                            </Typography>
                            <Typography variant="body2">
                              School Type: {campaign.schoolType}
                            </Typography>
                            <Typography variant="body2">
                              Standard: {campaign.standard}
                            </Typography>
                            <Typography variant="body2">
                              Registered: {campaign.registrationDate}
                            </Typography>
                            {campaign.nftDetails && (
                              <Typography variant="body2">
                                Minted: {campaign.nftDetails.mintedAt}
                              </Typography>
                            )}
                          </Stack>
                        }
                      />
                      <Stack spacing={1} alignItems="flex-end">
                        <Chip 
                          label={`${campaign.nftDetails?.amount || '0'} ETH`}
                          color="success"
                          size="small"
                        />
                        {campaign.nftDetails?.used && (
                          <Chip 
                            label="Used"
                            color="warning"
                            size="small"
                          />
                        )}
                      </Stack>
                    </ListItem>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card elevation={2}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Pending Campaigns
              </Typography>
              {studentData.pendingCampaigns.length === 0 ? (
                <Typography color="text.secondary">
                  No pending campaigns
                </Typography>
              ) : (
                <List>
                  {studentData.pendingCampaigns.map((campaign) => (
                    <ListItem key={campaign.id}>
                      <ListItemIcon>
                        <PendingIcon color="warning" />
                      </ListItemIcon>
                      <ListItemText
                        primary={campaign.name}
                        secondary={
                          <Stack spacing={0.5}>
                            <Typography variant="body2">
                              School Type: {campaign.schoolType}
                            </Typography>
                            <Typography variant="body2">
                              Standard: {campaign.standard}
                            </Typography>
                            <Typography variant="body2">
                              Registered: {campaign.registrationDate}
                            </Typography>
                          </Stack>
                        }
                      />
                      <Chip 
                        label={`${ethers.formatEther(campaign.amount)} ETH`}
                        color="warning"
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
    </Box>
  );
};

export default StudentProfile; 