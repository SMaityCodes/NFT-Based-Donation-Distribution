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

      // Fetch vendor count and vendors
      const vendorCount = await contract.vendorCount();
      const vendorPromises = [];
      for (let i = 0; i < vendorCount; i++) {
        vendorPromises.push(contract.vendors(i));
      }
      const vendorResults = await Promise.all(vendorPromises);
      const formattedVendors = vendorResults.map((vendor, index) => ({
        id: index.toString(),
        address: vendor.vendorAddress,
        approved: vendor.approved
      }));

      // Fetch total donations
      const totalDonations = await contract.getTotalDonations();

      setStats({
        campaigns: formattedCampaigns,
        students: formattedStudents,
        vendors: formattedVendors,
        totalDonations: ethers.utils.formatEther(totalDonations),
        studentCount: studentCount.toNumber(),
        vendorCount: vendorCount.toNumber(),
        campaignCount: campaigns.length
      });
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to fetch dashboard data');
    } finally {
      setLoading(false);
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
          background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
          color: 'white'
        }}
      >
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="h4" fontWeight="bold">
            Admin Dashboard
          </Typography>
          <Tooltip title="Refresh Data">
            <IconButton onClick={fetchAllData} sx={{ color: 'white' }}>
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
                <CampaignIcon color="primary" sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {stats.campaignCount}
                  </Typography>
                  <Typography color="text.secondary">
                    Active Campaigns
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
                    Registered Students
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
                    Approved Vendors
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

      {/* Detailed Lists */}
      <Grid container spacing={3}>
        {/* Campaigns List */}
        <Grid item xs={12} md={6}>
          <Card elevation={2}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recent Campaigns
              </Typography>
              <List>
                {stats.campaigns.slice(0, 5).map((campaign) => (
                  <React.Fragment key={campaign.id}>
                    <ListItem>
                      <ListItemIcon>
                        <CampaignIcon color="primary" />
                      </ListItemIcon>
                      <ListItemText
                        primary={campaign.name}
                        secondary={
                          <Stack direction="row" spacing={1} mt={1}>
                            <Chip 
                              label={campaign.exists ? "Active" : "Inactive"}
                              color={campaign.exists ? "success" : "error"}
                              size="small"
                            />
                            <Chip 
                              label={`${campaign.allowedSchoolTypes.length} School Types`}
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

        {/* Students List */}
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
                Approved Vendors
              </Typography>
              <List>
                {stats.vendors.map((vendor) => (
                  <React.Fragment key={vendor.id}>
                    <ListItem>
                      <ListItemIcon>
                        <StoreIcon color="warning" />
                      </ListItemIcon>
                      <ListItemText
                        primary={`Vendor #${vendor.id}`}
                        secondary={
                          <Stack direction="row" spacing={1} mt={1}>
                            <Chip 
                              label={vendor.approved ? "Approved" : "Pending"}
                              color={vendor.approved ? "success" : "warning"}
                              size="small"
                            />
                            <Chip 
                              label={vendor.address}
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
    </Box>
  );
};

export default AdminDashboard; 