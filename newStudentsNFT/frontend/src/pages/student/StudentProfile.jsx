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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Select,
  MenuItem,
  FormControl,
  InputLabel
} from '@mui/material';
import useWeb3Store from '../../store/web3Store';
import { toast } from 'react-toastify';
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
import { fetchNFTMetadata, formatNFTMetadata } from '../../utils/nftUtils';

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
  const [metaOpen, setMetaOpen] = useState(false);
  const [metaDetails, setMetaDetails] = useState(null);
  const [vendors, setVendors] = useState([]);
  const [selectedVendor, setSelectedVendor] = useState('');
  const [vendorLoading, setVendorLoading] = useState(false);
  const [vendorSelected, setVendorSelected] = useState(false);

  const fetchStudentData = async () => {
    if (!contract || !account) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      console.log('[StudentProfile] Fetching data for address:', account);
      
      // Get auth token for backend API calls
      const token = localStorage.getItem('token');
      
      // Fetch student data from backend API
      let backendStudentData = null;
      try {
        const response = await fetch(
          `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001'}/api/student/${account.toLowerCase()}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );
        if (response.ok) {
          const result = await response.json();
          backendStudentData = result.data;
          console.log('[StudentProfile] Backend student data:', backendStudentData);
        } else {
          console.warn('[StudentProfile] Failed to fetch backend student data:', response.status);
        }
      } catch (error) {
        console.error('[StudentProfile] Error fetching backend student data:', error);
      }
      
      // Fetch all campaigns
      const allCampaigns = await contract.getAllCampaigns();
      const approvedCampaigns = [];
      const pendingCampaigns = [];
      let bestNFT = null;
      let bestCampaign = null;

      // 1. Check all campaigns for this student
      for (let i = 0; i < allCampaigns.length; i++) {
        try {
          const students = await contract.getStudentsByCampaign(i);
          const student = students.find(s => s.studentAddress.toLowerCase() === account.toLowerCase());
          
          if (student) {
            console.log(`[StudentProfile] Found student in campaign ${i}:`, student);
            
            // Get the student's global ID
            const studentIndex = students.findIndex(s => s.studentAddress.toLowerCase() === account.toLowerCase());
            let globalStudentId = null;
            
            if (studentIndex !== -1) {
              try {
                globalStudentId = await contract.studentIdsByCampaign(i, studentIndex);
                console.log(`[StudentProfile] Global student ID for campaign ${i}:`, globalStudentId.toString());
              } catch (error) {
                console.log('[StudentProfile] Could not get global student ID:', error);
              }
            }

            // Get detailed student data from contract
            let studentData = null;
            if (globalStudentId) {
              try {
                studentData = await contract.students(globalStudentId);
                console.log(`[StudentProfile] Detailed student data:`, studentData);
              } catch (error) {
                console.log('[StudentProfile] Could not get detailed student data:', error);
              }
            }

            const campaign = allCampaigns[i];
            const isApproved = studentData ? studentData.approved : student.approved;
            const nftId = studentData ? studentData.nftId : student.nftId;
            
            // Try to fetch admission letter from backend
            let admissionLetter = null;
            try {
              const response = await fetch(
                `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001'}/api/admission-letters/${account.toLowerCase()}`,
                {
                  headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                  }
                }
              );
              if (response.ok) {
                admissionLetter = await response.json();
                console.log('[StudentProfile] Admission letter data:', admissionLetter);
              } else {
                console.warn(`[StudentProfile] Failed to fetch admission letter:`, response.status);
              }
            } catch (err) {
              console.error('[StudentProfile] Error fetching admission letter:', err);
            }

            const campaignData = {
              id: i.toString(),
              name: campaign.name,
              status: isApproved ? 'Approved' : 'Pending',
              nftId: nftId.toString(),
              amount: '0', // Will be updated with NFT details
              schoolType: student.schoolType,
              standard: student.standard,
              registrationDate: new Date().toLocaleDateString(), // Default date
              admissionLetterHash: student.admissionLetterHash,
              globalStudentId: globalStudentId ? globalStudentId.toString() : null,
              admissionLetter: admissionLetter
            };

            if (isApproved) {
              approvedCampaigns.push(campaignData);
              if (nftId.toString() !== '0' && (!bestNFT || Number(nftId) > Number(bestNFT))) {
                bestNFT = nftId.toString();
                bestCampaign = { ...campaignData };
              }
            } else {
              pendingCampaigns.push(campaignData);
            }
          }
        } catch (error) {
          console.error(`[StudentProfile] Error processing campaign ${i}:`, error);
        }
      }

      // 2. Check global student list for any missed students
      try {
        const studentCount = await contract.studentCount();
        console.log(`[StudentProfile] Total students in contract: ${studentCount}`);
        
        for (let i = 1; i <= studentCount; i++) {
          try {
            const studentData = await contract.students(i);
            
            if (studentData.studentAddress.toLowerCase() === account.toLowerCase()) {
              console.log(`[StudentProfile] Found student in global list at index ${i}:`, studentData);
              
              if (studentData.approved && studentData.nftId.toString() !== '0') {
                let campaignName = 'Unknown Campaign';
                try {
                  if (studentData.campaignId !== undefined) {
                    const campaign = await contract.campaigns(studentData.campaignId);
                    campaignName = campaign.name;
                  }
                } catch (error) {
                  console.log('[StudentProfile] Could not fetch campaign name:', error);
                }

                // Check if this NFT is already processed
                const isAlreadyProcessed = approvedCampaigns.some(c => c.nftId.toString() === studentData.nftId.toString());
                
                if (!isAlreadyProcessed) {
                  const campaignData = {
                    id: studentData.campaignId ? studentData.campaignId.toString() : 'global',
                    name: campaignName,
                    status: 'Approved',
                    nftId: studentData.nftId.toString(),
                    amount: '0',
                    schoolType: studentData.schoolType,
                    standard: studentData.standard,
                    registrationDate: 'Unknown',
                    admissionLetterHash: studentData.admissionLetterHash,
                    globalStudentId: i.toString(),
                  };
                  
                  approvedCampaigns.push(campaignData);
                  console.log(`[StudentProfile] Added approved campaign for NFT ${campaignData.nftId}`);
                  
                  if (!bestNFT || Number(studentData.nftId) > Number(bestNFT)) {
                    bestNFT = studentData.nftId.toString();
                    bestCampaign = { ...campaignData };
                    console.log(`[StudentProfile] Updated bestNFT to ${bestNFT}`);
                  }
                } else {
                  console.log(`[StudentProfile] NFT ${studentData.nftId} already processed in approvedCampaigns.`);
                }
              }
              break;
            }
          } catch (err) {
            console.error(`[StudentProfile] Error checking student ${i}:`, err);
          }
        }
      } catch (err) {
        console.error('[StudentProfile] Error checking global student list:', err);
      }

      // 3. Fetch NFT details for the best NFT/campaign
      if (bestNFT && bestCampaign) {
        try {
          let nftDetails = null;
          try {
            nftDetails = await contract.getNFTDetails(bestNFT);
            console.log('[StudentProfile] NFT details:', nftDetails);
          } catch (error) {
            console.log('[StudentProfile] Could not fetch NFT details:', error);
          }
          
          if (nftDetails) {
            bestCampaign.nftDetails = {
              amount: ethers.formatEther(nftDetails.amount),
              mintedAt: bestCampaign.registrationDate,
              used: nftDetails.used || false,
              owner: nftDetails.owner || account
            };
          } else {
            bestCampaign.nftDetails = {
              amount: '0',
              mintedAt: bestCampaign.registrationDate,
              used: false,
              owner: account
            };
          }
        } catch (error) {
          console.error('[StudentProfile] Error processing NFT details:', error);
        }
      }

      // 4. Update state with combined data
      setStudentData({
        profile: {
          address: account,
          nftId: bestNFT || '0',
          backendData: backendStudentData
        },
        approvedCampaigns,
        pendingCampaigns,
        totalDonations: approvedCampaigns.reduce((total, campaign) => {
          return total + (campaign.nftDetails ? parseFloat(campaign.nftDetails.amount) : 0);
        }, 0).toString()
      });
      
      console.log('[StudentProfile] Final data:', {
        profile: { address: account, nftId: bestNFT || '0' },
        approvedCampaigns: approvedCampaigns.length,
        pendingCampaigns: pendingCampaigns.length,
        totalDonations: approvedCampaigns.reduce((total, campaign) => {
          return total + (campaign.nftDetails ? parseFloat(campaign.nftDetails.amount) : 0);
        }, 0).toString()
      });
      
      setLoading(false);
    } catch (error) {
      console.error('[StudentProfile] Error fetching student data:', error);
      setLoading(false);
      toast.error('Failed to fetch student data');
    }
  };

  // Add event listener for approval events
  useEffect(() => {
    if (!contract || !account) return;

    const handleStudentApproved = (studentId, nftId) => {
      console.log('StudentApproved event received:', { studentId: studentId.toString(), nftId: nftId.toString() });
      // Refresh data when any student is approved (we'll filter in fetchStudentData)
      fetchStudentData();
    };

    contract.on('StudentApproved', handleStudentApproved);

    return () => {
      contract.off('StudentApproved', handleStudentApproved);
    };
  }, [contract, account]);

  useEffect(() => {
    fetchStudentData();
  }, [contract, account]);

  useEffect(() => {
    const fetchVendors = async () => {
      if (!contract) return;
      setVendorLoading(true);
      try {
        const filter = contract.filters.VendorRegistered();
        const events = await contract.queryFilter(filter, 0, 'latest');
        const vendorAddresses = [];
        for (const event of events) {
          const vendorAddr = event.args.vendorAddress;
          const vendor = await contract.vendors(vendorAddr);
          if (vendor.approved) {
            vendorAddresses.push(vendorAddr);
          }
        }
        setVendors(vendorAddresses);
      } catch (err) {
        setVendors([]);
      }
      setVendorLoading(false);
    };
    fetchVendors();
  }, [contract]);

  useEffect(() => {
    // Check if vendor is already selected for this NFT
    const checkVendorSelected = async () => {
      if (!contract || !studentData.profile?.nftId || studentData.profile.nftId === '0') return;
      try {
        const selected = await contract.nftToSelectedVendor(studentData.profile.nftId);
        setVendorSelected(selected && selected !== ethers.ZeroAddress);
      } catch {
        setVendorSelected(false);
      }
    };
    checkVendorSelected();
  }, [contract, studentData.profile?.nftId]);

  const handleSelectVendor = async () => {
    if (!contract || !studentData.profile?.nftId || !selectedVendor) return;
    try {
      const tx = await contract.selectVendorForNFT(studentData.profile.nftId, selectedVendor);
      await tx.wait();
      toast.success('Vendor selected successfully!');
      setVendorSelected(true);
    } catch (err) {
      toast.error('Failed to select vendor');
    }
  };

  // Add this function to map standard number to label
  const STANDARD_LABELS = [
    'PRIMARY_1', 'PRIMARY_2', 'PRIMARY_3', 'PRIMARY_4', 'PRIMARY_5',
    'MIDDLE_6', 'MIDDLE_7', 'MIDDLE_8',
    'HIGH_9', 'HIGH_10',
    'INTER_11', 'INTER_12',
    'BTECH_1', 'BTECH_2', 'BTECH_3', 'BTECH_4'
  ];

  const handleViewMetadata = async () => {
    if (!contract || !studentData.profile?.nftId || studentData.profile.nftId === '0') return;
    
    const nftId = studentData.profile.nftId;
    setMetaOpen(true);
    setMetaDetails(null); // Reset to show loading
    
    try {
      console.log('[StudentProfile] Fetching metadata for NFT:', nftId);
      
      // Fetch NFT metadata from backend API
      const nftMetadata = await fetchNFTMetadata(nftId);
      console.log('[StudentProfile] NFT metadata from backend:', nftMetadata);
      
      // Fetch NFT details from smart contract
      let contractDetails = {};
      try {
        const nftDetails = await contract.getNFTDetails(nftId);
        console.log('[StudentProfile] NFT details from contract:', nftDetails);
        
        contractDetails = {
          standard: nftDetails[0],
          amount: ethers.formatEther(nftDetails[1]),
          used: nftDetails[2],
          owner: nftDetails[3]
        };
      } catch (error) {
        console.error('[StudentProfile] Error fetching contract details:', error);
      }
      
      // Fetch vendor transaction if NFT is used
      let vendorTransaction = null;
      if (contractDetails.used) {
        try {
          const tx = await contract.getVendorTransaction(nftId);
          vendorTransaction = {
            nftId: tx[0].toString(),
            studentAddress: tx[1],
            itemProvided: tx[2],
            timestamp: new Date(tx[3].toNumber() * 1000).toLocaleString()
          };
          console.log('[StudentProfile] Vendor transaction:', vendorTransaction);
        } catch (error) {
          console.error('[StudentProfile] Error fetching vendor transaction:', error);
        }
      }
      
      // Combine all data
      const combinedDetails = {
        // Backend metadata
        ...nftMetadata,
        formattedMetadata: nftMetadata ? formatNFTMetadata(nftMetadata) : null,
        
        // Contract details
        ...contractDetails,
        
        // Vendor transaction
        vendorTransaction,
        
        // Additional info
        tokenId: nftId,
        tokenURI: nftMetadata?.metadataUrl || 'N/A'
      };
      
      console.log('[StudentProfile] Combined metadata details:', combinedDetails);
      setMetaDetails(combinedDetails);
      
    } catch (error) {
      console.error('[StudentProfile] Error fetching NFT metadata:', error);
      toast.error('Failed to fetch NFT metadata');
      setMetaDetails({ error: 'Failed to fetch metadata' });
    }
  };

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
            {/* <Tooltip title="Refresh Data">
              <IconButton onClick={fetchStudentData} sx={{ color: 'white' }}>
                <RefreshIcon />
              </IconButton>
            </Tooltip> */}
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
              Refresh Profile
            </Button>
          </Stack>
        </Stack>
      </Paper>

      {/* Debug Section - Remove in production */}
      {/* {process.env.NODE_ENV === 'development' && (
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
      )} */}

      {/* Profile Information */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6} sx={{width:"73vw"}}>
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

        <Grid item xs={12} md={6} sx={{width:"40vw"}}>
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
        <Grid item xs={12} sx={{width:"73vw",minHeight:"10vw"}}>
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
                            {/* <Typography variant="body2">
                              Registered: {campaign.registrationDate}
                            </Typography> */}
                            {campaign.nftDetails && (
                              <>
                                <Typography variant="body2">
                                  Minted: {campaign.nftDetails.mintedAt}
                                </Typography>
                                <Typography variant="body2">
                                  Owner: {campaign.nftDetails.owner}
                                </Typography>
                              </>
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

        <Grid item xs={12} sx={{width:"73vw",minHeight:"10vw"}}>
          <Card elevation={2}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Pending Campaigns
              </Typography>
              {studentData.pendingCampaigns.length === 0 ? (
                <Typography color="text.secondary" >
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
                            {/* <Typography variant="body2">
                              Registered: {campaign.registrationDate}
                            </Typography> */}
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

      <Box>
        <Typography variant="subtitle2" color="text.secondary">
          Standard
        </Typography>
        <Typography variant="body1">
          {studentData.approvedCampaigns.length > 0 ?
            (STANDARD_LABELS[studentData.approvedCampaigns[0].standard] || studentData.approvedCampaigns[0].standard)
            : ''}
        </Typography>
        {studentData.approvedCampaigns.length > 0 && (
          <Button
            variant="contained"
            color="primary"
            sx={{ mt: 2 }}
            onClick={() => {
              const std = studentData.approvedCampaigns[0].standard;
              if (std !== undefined) {
                navigate(`/token-uri/${STANDARD_LABELS[Number(std)]}`);
              }
            }}
          >
            View Standard Token URI
          </Button>
        )}
        {/* {studentData.profile?.nftId && studentData.profile.nftId !== '0' && !vendorSelected && (
          <Box sx={{ mt: 2 }}>
            <FormControl fullWidth>
              <InputLabel>Select Vendor</InputLabel>
              <Select
                value={selectedVendor}
                onChange={e => setSelectedVendor(e.target.value)}
                label="Select Vendor"
                disabled={vendorLoading}
              >
                {vendors.map(addr => (
                  <MenuItem key={addr} value={addr}>{addr}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <Button
              variant="contained"
              color="primary"
              sx={{ mt: 2 }}
              onClick={handleSelectVendor}
              disabled={!selectedVendor}
            >
              Confirm Vendor
            </Button>
          </Box>
        )} */}
        {studentData.profile?.nftId && studentData.profile.nftId !== '0' && (
          <Button
            variant="outlined"
            color="primary"
            sx={{ mt: 2, ml: 2 }}
            onClick={handleViewMetadata}
          >
            View My NFT Metadata
          </Button>
        )}
        
        {/* Debug button for testing NFT metadata */}
        {/* {process.env.NODE_ENV === 'development' && studentData.profile?.nftId && studentData.profile.nftId !== '0' && (
          <Button
            variant="outlined"
            color="secondary"
            sx={{ mt: 2, ml: 2 }}
            onClick={async () => {
              try {
                console.log('[StudentProfile] Testing NFT metadata fetch for token:', studentData.profile.nftId);
                const token = localStorage.getItem('token');
                const response = await fetch(
                  `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001'}/api/nft/metadata/${studentData.profile.nftId}`,
                  {
                    headers: {
                      'Authorization': `Bearer ${token}`,
                      'Content-Type': 'application/json'
                    }
                  }
                );
                console.log('[StudentProfile] NFT metadata API response status:', response.status);
                if (response.ok) {
                  const data = await response.json();
                  console.log('[StudentProfile] NFT metadata API response data:', data);
                  toast.success('NFT metadata found!');
                } else {
                  const errorData = await response.json();
                  console.log('[StudentProfile] NFT metadata API error:', errorData);
                  toast.error(`NFT metadata not found: ${errorData.message}`);
                }
              } catch (error) {
                console.error('[StudentProfile] Error testing NFT metadata:', error);
                toast.error('Error testing NFT metadata');
              }
            }}
          >
            Test NFT Metadata API
          </Button>
        )} */}
      </Box>
      <Dialog open={metaOpen} onClose={() => setMetaOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>NFT Metadata - Token #{metaDetails?.tokenId}</DialogTitle>
        <DialogContent>
          {metaDetails ? (
            metaDetails.error ? (
              <Typography color="error">{metaDetails.error}</Typography>
            ) : (
              <Stack spacing={2}>
                {/* Basic NFT Information */}
                <Box>
                  <Typography variant="h6" gutterBottom>Basic Information</Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="subtitle2" color="text.secondary">Token ID</Typography>
                      <Typography variant="body1">#{metaDetails.tokenId}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="subtitle2" color="text.secondary">Status</Typography>
                      <Chip 
                        label={metaDetails.used ? 'Used' : 'Available'} 
                        color={metaDetails.used ? 'warning' : 'success'} 
                        size="small" 
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="subtitle2" color="text.secondary">Amount</Typography>
                      <Typography variant="body1">{metaDetails.amount} ETH</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="subtitle2" color="text.secondary">Current Owner</Typography>
                      <Typography variant="body1" sx={{ wordBreak: 'break-all' }}>
                        {metaDetails.owner}
                      </Typography>
                    </Grid>
                  </Grid>
                </Box>

                {/* Formatted Metadata */}
                {metaDetails.formattedMetadata && (
                  <Box>
                    <Typography variant="h6" gutterBottom>NFT Details</Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12}>
                        <Typography variant="subtitle2" color="text.secondary">Name</Typography>
                        <Typography variant="body1">{metaDetails.formattedMetadata.name}</Typography>
                      </Grid>
                      <Grid item xs={12}>
                        <Typography variant="subtitle2" color="text.secondary">Description</Typography>
                        <Typography variant="body1">{metaDetails.formattedMetadata.description}</Typography>
                      </Grid>
                      {metaDetails.formattedMetadata.image && (
                        <Grid item xs={12}>
                          <Typography variant="subtitle2" color="text.secondary">Image</Typography>
                          <Box sx={{ mt: 1 }}>
                            <img 
                              src={metaDetails.formattedMetadata.image} 
                              alt="NFT" 
                              style={{ maxWidth: '200px', maxHeight: '200px', borderRadius: '8px' }}
                            />
                          </Box>
                        </Grid>
                      )}
                    </Grid>
                  </Box>
                )}

                {/* Attributes */}
                {metaDetails.attributes && metaDetails.attributes.length > 0 && (
                  <Box>
                    <Typography variant="h6" gutterBottom>Attributes</Typography>
                    <Grid container spacing={1}>
                      {metaDetails.attributes.map((attr, index) => (
                        <Grid item xs={6} key={index}>
                          <Chip 
                            label={`${attr.trait_type}: ${attr.value}`}
                            variant="outlined"
                            size="small"
                          />
                        </Grid>
                      ))}
                    </Grid>
                  </Box>
                )}

                {/* Vendor Transaction */}
                {metaDetails.vendorTransaction && (
                  <Box>
                    <Typography variant="h6" gutterBottom>Vendor Transaction</Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Typography variant="subtitle2" color="text.secondary">Item Provided</Typography>
                        <Typography variant="body1">{metaDetails.vendorTransaction.itemProvided}</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="subtitle2" color="text.secondary">Transaction Date</Typography>
                        <Typography variant="body1">{metaDetails.vendorTransaction.timestamp}</Typography>
                      </Grid>
                      <Grid item xs={12}>
                        <Typography variant="subtitle2" color="text.secondary">Student Address</Typography>
                        <Typography variant="body1" sx={{ wordBreak: 'break-all' }}>
                          {metaDetails.vendorTransaction.studentAddress}
                        </Typography>
                      </Grid>
                    </Grid>
                  </Box>
                )}

                {/* Token URI */}
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">Token URI</Typography>
                  <Typography variant="body2" sx={{ wordBreak: 'break-all', fontFamily: 'monospace' }}>
                    {metaDetails.tokenURI}
                  </Typography>
                </Box>
              </Stack>
            )
          ) : (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="100px">
              <CircularProgress />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMetaOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default StudentProfile;