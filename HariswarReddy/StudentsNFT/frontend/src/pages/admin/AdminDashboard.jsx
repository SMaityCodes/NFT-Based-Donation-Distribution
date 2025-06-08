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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  TextField
} from '@mui/material';
import useWeb3Store from '../../store/web3Store';
import { toast } from 'react-hot-toast';
import {
  Campaign as CampaignIcon,
  School as SchoolIcon,
  Store as StoreIcon,
  Person as PersonIcon,
  AttachMoney as MoneyIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';

const AdminDashboard = () => {
  const { contract, account } = useWeb3Store();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    campaigns: [],
    students: [],
    vendors: [],
    donations: [],
    totalDonations: '0',
    studentCount: 0,
    vendorCount: 0,
    campaignCount: 0
  });
  const [registerDialogOpen, setRegisterDialogOpen] = useState(false);
  const [vendorAddress, setVendorAddress] = useState('');
  const [registerError, setRegisterError] = useState('');

  const fetchAllData = async () => {
    if (!contract || !account) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // Fetch all campaigns
      const campaigns = await contract.getAllCampaigns();
      const formattedCampaigns = campaigns.map(campaign => ({
        id: campaign.id.toString(),
        name: campaign.name,
        exists: campaign.exists,
        allowedSchoolTypes: campaign.allowedSchoolTypes,
        allowedStandards: campaign.allowedStandards
      }));

      // Fetch student count and students
      const studentCount = await contract.studentCount();
      const studentPromises = [];
      for (let i = 0; i < studentCount; i++) {
        studentPromises.push(contract.students(i));
      }
      const studentResults = await Promise.all(studentPromises);
      const formattedStudents = studentResults.map((student, index) => ({
        id: index.toString(),
        address: student.studentAddress,
        schoolType: student.schoolType,
        standard: student.standard,
        approved: student.approved
      }));

      // Fetch vendors using VendorRegistered event
      const vendors = [];
      const filter = contract.filters.VendorRegistered();
      const events = await contract.queryFilter(filter, 0, 'latest');

      // Process each event
      for (const event of events) {
        try {
          const vendorAddress = event.args.vendorAddress;
          const isVendor = await contract.isVendor(vendorAddress);
          if (isVendor) {
            // Get vendor's NFT verification history
            const nftUsedFilter = contract.filters.NFTUsed(null, vendorAddress);
            const nftEvents = await contract.queryFilter(nftUsedFilter, 0, 'latest');
            
            vendors.push({
              id: vendorAddress,
              address: vendorAddress,
              approved: true,
              registeredAt: new Date(event.blockNumber * 1000).toLocaleDateString(),
              verifiedNFTs: nftEvents.length
            });
          }
        } catch (error) {
          console.error(`Error processing vendor event:`, error);
          continue;
        }
      }

      // Fetch total donations
      const totalDonations = await contract.getTotalDonations();

      setStats({
        campaigns: formattedCampaigns,
        students: formattedStudents,
        vendors: vendors,
        totalDonations: ethers.formatEther(totalDonations),
        studentCount: studentCount,
        vendorCount: vendors.length,
        campaignCount: formattedCampaigns.length
      });
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterVendor = async () => {
    if (!vendorAddress) {
      setRegisterError('Please enter a vendor address');
      return;
    }

    try {
      setRegisterError('');
      const tx = await contract.registerVendor(vendorAddress);
      await tx.wait();
      toast.success('Vendor registered successfully');
      setRegisterDialogOpen(false);
      setVendorAddress('');
      fetchAllData(); // Refresh data
    } catch (error) {
      console.error('Error registering vendor:', error);
      setRegisterError(error.message || 'Failed to register vendor');
    }
  };

  useEffect(() => {
    fetchAllData();
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
          background: 'linear-gradient(45deg, #1976d2 30%, #42a5f5 90%)',
          color: 'white'
        }}
      >
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Stack direction="row" spacing={2} alignItems="center">
            <PersonIcon sx={{ fontSize: 40 }} />
            <Box>
              <Typography variant="h4" fontWeight="bold">
                Admin Dashboard
              </Typography>
              <Typography variant="subtitle1" sx={{ opacity: 0.8 }}>
                Overview of campaigns, students, and vendors
              </Typography>
            </Box>
          </Stack>
          <Stack direction="row" spacing={2}>
            <Button
              variant="contained"
              color="inherit"
              onClick={() => setRegisterDialogOpen(true)}
              sx={{ 
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.3)',
                }
              }}
            >
              Register Vendor
            </Button>
            <Tooltip title="Refresh Data">
              <IconButton onClick={fetchAllData} sx={{ color: 'white' }}>
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
                <CampaignIcon color="primary" sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {stats.campaignCount}
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
                <SchoolIcon color="success" sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {stats.studentCount}
                  </Typography>
                  <Typography color="text.secondary">
                    Total Students
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
                <StoreIcon color="warning" sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {stats.vendorCount}
                  </Typography>
                  <Typography color="text.secondary">
                    Total Vendors
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
                    {stats.totalDonations} ETH
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

      {/* Recent Activity */}
      <Grid container spacing={3}>
        {/* Recent Students */}
        <Grid item xs={12} md={6}>
          <Card elevation={2}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recent Students
              </Typography>
              <List>
                {stats.students.slice(0, 5).map((student) => (
                  <React.Fragment key={student.id}>
                    <ListItem>
                      <ListItemIcon>
                        <SchoolIcon color="success" />
                      </ListItemIcon>
                      <ListItemText
                        primary={`Student #${student.id}`}
                        secondary={
                          <Stack direction="row" spacing={1} mt={1}>
                            <Chip 
                              label={student.approved ? "Approved" : "Pending"}
                              color={student.approved ? "success" : "warning"}
                              size="small"
                            />
                            <Chip 
                              label={student.schoolType}
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
            </CardContent>
          </Card>
        </Grid>

        {/* Vendors List */}
        <Grid item xs={12}>
          <Card elevation={2}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Registered Vendors
              </Typography>
              <List>
                {stats.vendors.map((vendor) => (
                  <React.Fragment key={vendor.id}>
                    <ListItem>
                      <ListItemIcon>
                        <StoreIcon color="warning" />
                      </ListItemIcon>
                      <ListItemText
                        primary={`Vendor ${vendor.address.slice(0, 6)}...${vendor.address.slice(-4)}`}
                        secondary={
                          <Stack direction="row" spacing={1} mt={1}>
                            <Chip 
                              label="Registered"
                              color="success"
                              size="small"
                            />
                            <Chip 
                              label={`Registered: ${vendor.registeredAt}`}
                              size="small"
                            />
                            <Chip 
                              label={`Verified ${vendor.verifiedNFTs} NFTs`}
                              color="info"
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
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Register Vendor Dialog */}
      <Dialog open={registerDialogOpen} onClose={() => setRegisterDialogOpen(false)}>
        <DialogTitle>Register New Vendor</DialogTitle>
        <DialogContent>
          {registerError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {registerError}
            </Alert>
          )}
          <TextField
            autoFocus
            margin="dense"
            label="Vendor Address"
            type="text"
            fullWidth
            value={vendorAddress}
            onChange={(e) => setVendorAddress(e.target.value)}
            error={!!registerError}
            helperText={registerError}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRegisterDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleRegisterVendor}
            variant="contained"
            disabled={!vendorAddress}
          >
            Register
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminDashboard; 