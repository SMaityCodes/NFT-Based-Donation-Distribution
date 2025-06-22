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
      console.log('[StudentDashboard] Fetching data for address:', account);

      // First, let's check the global student list to see if the student exists
      console.log('[StudentDashboard] Checking global student list first...');
      let globalStudentFound = null;
      let globalStudentIndex = -1;
      
      // Also check for recent events that might have been missed
      try {
        console.log('[StudentDashboard] Checking for recent events...');
        const fromBlock = Math.max(0, (await contract.provider.getBlockNumber()) - 1000); // Last 1000 blocks
        const toBlock = 'latest';
        
        const studentRegisteredFilter = contract.filters.StudentRegistered();
        const studentApprovedFilter = contract.filters.StudentApproved();
        
        const [registeredEvents, approvedEvents] = await Promise.all([
          contract.queryFilter(studentRegisteredFilter, fromBlock, toBlock),
          contract.queryFilter(studentApprovedFilter, fromBlock, toBlock)
        ]);
        
        console.log('[StudentDashboard] Recent StudentRegistered events:', registeredEvents.length);
        console.log('[StudentDashboard] Recent StudentApproved events:', approvedEvents.length);
        
        // Check if any of these events are for the current user
        const relevantRegisteredEvents = registeredEvents.filter(event => 
          event.args.studentAddress.toLowerCase() === account.toLowerCase()
        );
        const relevantApprovedEvents = approvedEvents.filter(event => {
          // For approved events, we need to check if the student ID corresponds to our user
          // This is more complex, so we'll just log all approved events
          return true;
        });
        
        console.log('[StudentDashboard] Relevant registered events for current user:', relevantRegisteredEvents.length);
        console.log('[StudentDashboard] All approved events:', relevantApprovedEvents.length);
        
        if (relevantRegisteredEvents.length > 0) {
          console.log('[StudentDashboard] Found recent registration events for current user');
        }
      } catch (error) {
        console.error('[StudentDashboard] Error checking recent events:', error);
      }
      
      try {
        const studentCount = await contract.studentCount();
        console.log('[StudentDashboard] Total students in contract:', studentCount.toString());
        
        for (let i = 0; i < studentCount; i++) {
          try {
            const studentData = await contract.students(i);
            console.log(`[StudentDashboard] Global student ${i}:`, {
              address: studentData.studentAddress,
              approved: studentData.approved,
              nftId: studentData.nftId.toString(),
              campaignId: studentData.campaignId?.toString()
            });
            
            if (studentData.studentAddress.toLowerCase() === account.toLowerCase()) {
              console.log(`[StudentDashboard] Found student in global list at index ${i}`);
              globalStudentFound = studentData;
              globalStudentIndex = i;
              break;
            }
          } catch (error) {
            console.error(`[StudentDashboard] Error checking global student ${i}:`, error);
          }
        }
      } catch (error) {
        console.error('[StudentDashboard] Error checking global student list:', error);
      }

      // Fetch all campaigns
      const allCampaigns = await contract.getAllCampaigns();
      console.log('[StudentDashboard] All campaigns:', allCampaigns);
      
      // Fetch student's campaigns
      const approvedCampaigns = [];
      const pendingCampaigns = [];

      // Process campaigns
      for (let i = 0; i < allCampaigns.length; i++) {
        try {
          const students = await contract.getStudentsByCampaign(i);
          console.log(`[StudentDashboard] Students in campaign ${i}:`, students);
          
          // Log the structure of the first student to understand the data format
          if (students.length > 0) {
            console.log(`[StudentDashboard] First student structure in campaign ${i}:`, {
              raw: students[0],
              type: typeof students[0],
              isArray: Array.isArray(students[0]),
              keys: students[0] ? Object.keys(students[0]) : 'no keys',
              length: students[0] ? students[0].length : 'no length',
              '0': students[0] ? students[0][0] : 'no index 0',
              '1': students[0] ? students[0][1] : 'no index 1',
              '2': students[0] ? students[0][2] : 'no index 2',
              '3': students[0] ? students[0][3] : 'no index 3',
              '4': students[0] ? students[0][4] : 'no index 4',
              '5': students[0] ? students[0][5] : 'no index 5',
              '6': students[0] ? students[0][6] : 'no index 6'
            });
          }
          
          // Find the current user in this campaign
          let student = null;
          let studentIndex = -1;
          
          for (let j = 0; j < students.length; j++) {
            const studentData = students[j];
            console.log(`[StudentDashboard] Checking student ${j} in campaign ${i}:`, studentData);
            
            // Access student address correctly - it might be studentData[0] or studentData.studentAddress
            const studentAddress = studentData[0] || studentData.studentAddress;
            console.log(`[StudentDashboard] Student ${j} address:`, studentAddress);
            
            if (studentAddress && studentAddress.toLowerCase() === account.toLowerCase()) {
              console.log(`[StudentDashboard] Found student in campaign ${i} at index ${j}`);
              student = studentData;
              studentIndex = j;
              break;
            }
          }
          
          if (student) {
            console.log(`[StudentDashboard] Processing found student in campaign ${i}:`, student);
            const campaign = allCampaigns[i];
            
            // Access student properties correctly
            const studentAddress = student[0] || student.studentAddress;
            const isApproved = student[4] || student.approved; // approved is at index 4
            const nftId = student[5] || student.nftId; // nftId is at index 5
            
            console.log(`[StudentDashboard] Student data:`, {
              address: studentAddress,
              approved: isApproved,
              nftId: nftId.toString()
            });
            
            // Get the global student ID for this student in this campaign
            let globalStudentId = null;
            try {
              globalStudentId = await contract.studentIdsByCampaign(i, studentIndex);
              console.log(`[StudentDashboard] Global student ID for campaign ${i}:`, globalStudentId.toString());
            } catch (error) {
              console.log('[StudentDashboard] Could not get global student ID:', error);
            }
            
            const campaignData = {
              id: i.toString(),
              name: campaign.name,
              status: isApproved ? 'Approved' : 'Pending',
              nftId: nftId.toString(),
              amount: campaign.amount.toString(),
              globalStudentId: globalStudentId ? globalStudentId.toString() : null
            };
            
            if (isApproved) {
              approvedCampaigns.push(campaignData);
            } else {
              pendingCampaigns.push(campaignData);
            }
          }
        } catch (error) {
          console.error(`[StudentDashboard] Error fetching student campaign ${i}:`, error);
        }
      }

      console.log('[StudentDashboard] Initial approved campaigns:', approvedCampaigns);
      console.log('[StudentDashboard] Initial pending campaigns:', pendingCampaigns);

      // If we found the student in global list but not in campaigns, add them
      if (globalStudentFound && approvedCampaigns.length === 0 && pendingCampaigns.length === 0) {
        console.log('[StudentDashboard] Student found in global list but not in campaigns, adding...');
        
        if (globalStudentFound.approved && globalStudentFound.nftId.toString() !== '0') {
          // Try to get the actual campaign name
          let campaignName = 'Unknown Campaign';
          try {
            if (globalStudentFound.campaignId !== undefined) {
              const campaign = await contract.campaigns(globalStudentFound.campaignId);
              campaignName = campaign.name;
            }
          } catch (error) {
            console.log('[StudentDashboard] Could not fetch campaign name:', error);
          }
          
          const campaignData = {
            id: globalStudentFound.campaignId ? globalStudentFound.campaignId.toString() : 'global',
            name: campaignName,
            status: 'Approved',
            nftId: globalStudentFound.nftId.toString(),
            amount: '0',
            globalStudentId: globalStudentIndex.toString()
          };
          approvedCampaigns.push(campaignData);
        }
      }

      // If we have approved campaigns, ensure we have the most recent NFT data
      if (approvedCampaigns.length > 0) {
        console.log('[StudentDashboard] Processing approved campaigns for latest data...');
        
        for (let i = 0; i < approvedCampaigns.length; i++) {
          const campaign = approvedCampaigns[i];
          
          if (campaign.globalStudentId) {
            try {
              console.log(`[StudentDashboard] Fetching latest data for student ${campaign.globalStudentId}`);
              
              // Get the latest student data from the global list
              const latestStudentData = await contract.students(campaign.globalStudentId);
              console.log('[StudentDashboard] Latest student data:', latestStudentData);
              
              // Update the campaign data with the latest information
              campaign.nftId = latestStudentData.nftId.toString();
              campaign.approved = latestStudentData.approved;
            } catch (error) {
              console.error(`[StudentDashboard] Error updating campaign ${i} with latest data:`, error);
            }
          }
        }
      }

      // Get the first approved campaign's NFT details if available
      let nftId = '0';
      let totalDonations = '0';
      if (approvedCampaigns.length > 0) {
        const firstApproved = approvedCampaigns[0];
        nftId = firstApproved.nftId;
        try {
          console.log(`[StudentDashboard] Fetching NFT details for ${firstApproved.nftId}`);
          const nftDetails = await contract.getNFTDetails(firstApproved.nftId);
          totalDonations = ethers.formatEther(nftDetails.amount);
          console.log('[StudentDashboard] NFT details:', nftDetails);
        } catch (error) {
          console.error('[StudentDashboard] Error fetching NFT details:', error);
        }
      }

      console.log('[StudentDashboard] Final data:', {
        globalStudentFound: globalStudentFound ? {
          address: globalStudentFound.studentAddress,
          approved: globalStudentFound.approved,
          nftId: globalStudentFound.nftId.toString(),
          campaignId: globalStudentFound.campaignId?.toString()
        } : null,
        approvedCampaigns,
        pendingCampaigns,
        nftId,
        totalDonations
      });

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
      console.error('[StudentDashboard] Error fetching student data:', error);
      toast.error('Failed to fetch student data');
    } finally {
      setLoading(false);
    }
  };

  // Add event listener for approval events
  useEffect(() => {
    if (!contract || !account) return;

    const handleStudentApproved = (studentId, nftId) => {
      console.log('[StudentDashboard] StudentApproved event received:', { studentId: studentId.toString(), nftId: nftId.toString() });
      // Refresh data when any student is approved (we'll filter in fetchStudentData)
      fetchStudentData();
    };

    const handleStudentRegistered = (studentId, studentAddress, campaignId) => {
      console.log('[StudentDashboard] StudentRegistered event received:', { 
        studentId: studentId.toString(), 
        studentAddress: studentAddress,
        campaignId: campaignId.toString()
      });
      // Refresh data when any student is registered
      fetchStudentData();
    };

    contract.on('StudentApproved', handleStudentApproved);
    contract.on('StudentRegistered', handleStudentRegistered);

    return () => {
      contract.off('StudentApproved', handleStudentApproved);
      contract.off('StudentRegistered', handleStudentRegistered);
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
            <Button
              variant="contained"
              color="inherit"
              onClick={fetchStudentData}
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
            {JSON.stringify(studentData, (key, value) => {
              if (typeof value === 'bigint') {
                return value.toString();
              }
              return value;
            }, 2)}
          </Typography>
        </Paper>
      )}

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