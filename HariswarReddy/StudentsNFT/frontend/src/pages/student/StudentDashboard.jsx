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

      // Fetch student profile
      const studentId = await contract.getStudentId(account);
      const studentProfile = await contract.students(studentId);
      
      // Fetch all campaigns
      const allCampaigns = await contract.getAllCampaigns();
      
      // Fetch student's campaigns
      const approvedCampaigns = [];
      const pendingCampaigns = [];

      for (let i = 0; i < allCampaigns.length; i++) {
        try {
          const studentCampaign = await contract.getStudentCampaign(studentId, i);
          if (studentCampaign.registered) {
            const campaign = allCampaigns[i];
            const campaignData = {
              id: i.toString(),
              name: campaign.name,
              status: studentCampaign.approved ? 'Approved' : 'Pending',
              registrationDate: new Date(studentCampaign.registrationDate.toNumber() * 1000).toLocaleDateString()
            };
            
            if (studentCampaign.approved) {
              approvedCampaigns.push(campaignData);
            } else {
              pendingCampaigns.push(campaignData);
            }
          }
        } catch (error) {
          console.error(`Error fetching student campaign ${i}:`, error);
        }
      }

      // Fetch total donations
      const totalDonations = await contract.getStudentTotalDonations(studentId);

      setStudentData({
        profile: {
          id: studentId.toString(),
          address: studentProfile.studentAddress,
          schoolType: studentProfile.schoolType === 0 ? 'Government' : 'Private',
          standard: studentProfile.standard.toString(),
          approved: studentProfile.approved
        },
        approvedCampaigns,
        pendingCampaigns,
        totalDonations: ethers.utils.formatEther(totalDonations)
      });
    } catch (error) {
      console.error('Error fetching student data:', error);
      toast.error('Failed to fetch student data');
    } finally {
      setLoading(false);
    }
  };

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
                  <Typography variant="h4" fontWeight="bold">
                    {studentData.profile?.id}
                  </Typography>
                  <Typography color="text.secondary">
                    Student ID
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
                <SchoolIcon color="success" sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {studentData.profile?.standard}
                  </Typography>
                  <Typography color="text.secondary">
                    Standard
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
                <CampaignIcon color="warning" sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {studentData.approvedCampaigns.length}
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
              {studentData.approvedCampaigns.length === 0 ? (
                <Typography color="text.secondary" align="center" py={2}>
                  No approved campaigns yet
                </Typography>
              ) : (
                <List>
                  {studentData.approvedCampaigns.map((campaign) => (
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
              {studentData.pendingCampaigns.length === 0 ? (
                <Typography color="text.secondary" align="center" py={2}>
                  No pending approvals
                </Typography>
              ) : (
                <List>
                  {studentData.pendingCampaigns.map((campaign) => (
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

export default StudentDashboard; 