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
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel
} from '@mui/material';
import useWeb3Store from '../../store/web3Store';
import { toast } from 'react-hot-toast';
import {
  Store as StoreIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  CheckCircle as CheckCircleIcon,
  Pending as PendingIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import { ethers } from 'ethers';
import { useNavigate } from 'react-router-dom';

const AdminVendors = () => {
  const navigate = useNavigate();
  const { contract, account } = useWeb3Store();
  const [loading, setLoading] = useState(true);
  const [vendors, setVendors] = useState([]);
  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [createFormData, setCreateFormData] = useState({
    address: '',
    name: '',
    description: ''
  });
  const [editFormData, setEditFormData] = useState({
    name: '',
    description: ''
  });

  const fetchVendors = async () => {
    if (!contract || !account) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const vendors = [];

      // Get all VendorRegistered events
      const filter = contract.filters.VendorRegistered();
      const events = await contract.queryFilter(filter, 0, 'latest');

      // Process each event
      for (const event of events) {
        try {
          const vendorAddress = event.args.vendorAddress;
          const vendor = await contract.vendors(vendorAddress);
          if (vendor && vendor.vendorAddress !== ethers.ZeroAddress) {
            vendors.push({
              id: vendorAddress,
              address: vendor.vendorAddress,
              approved: vendor.approved,
              registeredAt: new Date(event.blockNumber * 1000).toLocaleDateString() // Use block timestamp as registration date
            });
          }
        } catch (error) {
          console.error(`Error processing vendor event:`, error);
          continue;
        }
      }

      setVendors(vendors);
    } catch (error) {
      console.error('Error fetching vendors:', error);
      toast.error('Failed to fetch vendors');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVendors();
  }, [contract, account]);

  const handleCreateClick = () => {
    setCreateFormData({
      address: '',
      name: '',
      description: ''
    });
    setOpenCreateDialog(true);
  };

  const handleEditClick = (vendor) => {
    setSelectedVendor(vendor);
    setEditFormData({
      name: vendor.name,
      description: vendor.description
    });
    setOpenEditDialog(true);
  };

  const handleDeleteClick = (vendor) => {
    setSelectedVendor(vendor);
    setOpenDeleteDialog(true);
  };

  const handleCreateSubmit = async () => {
    if (!contract || !account) return;

    try {
      const tx = await contract.registerVendor(createFormData.address);
      await tx.wait();
      toast.success('Vendor registered successfully');
      setOpenCreateDialog(false);
      fetchVendors();
    } catch (error) {
      console.error('Error registering vendor:', error);
      toast.error('Failed to register vendor');
    }
  };

  const handleEditSubmit = async () => {
    if (!contract || !account || !selectedVendor) return;

    try {
      toast.info('Vendor details cannot be updated after registration');
      setOpenEditDialog(false);
    } catch (error) {
      console.error('Error updating vendor:', error);
      toast.error('Failed to update vendor');
    }
  };

  const handleDeleteSubmit = async () => {
    if (!contract || !account || !selectedVendor) return;

    try {
      toast.info('Vendors cannot be deleted after registration');
      setOpenDeleteDialog(false);
    } catch (error) {
      console.error('Error deleting vendor:', error);
      toast.error('Failed to delete vendor');
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
          background: 'linear-gradient(45deg, #ed6c02 30%, #ff9800 90%)',
          color: 'white'
        }}
      >
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Stack direction="row" spacing={2} alignItems="center">
            <StoreIcon sx={{ fontSize: 40 }} />
            <Box>
              <Typography variant="h4" fontWeight="bold">
                Vendor Management
              </Typography>
              <Typography variant="subtitle1" sx={{ opacity: 0.8 }}>
                Manage vendor registrations and approvals
              </Typography>
            </Box>
          </Stack>
          <Stack direction="row" spacing={2}>
            <Button
              variant="contained"
              color="inherit"
              onClick={() => navigate('/admin/dashboard')}
              startIcon={<PersonIcon />}
              sx={{ 
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.3)',
                }
              }}
            >
              Go to Dashboard
            </Button>
            <Button
              variant="contained"
              color="inherit"
              onClick={handleCreateClick}
              startIcon={<AddIcon />}
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
              <IconButton onClick={fetchVendors} sx={{ color: 'white' }}>
                <RefreshIcon />
              </IconButton>
            </Tooltip>
          </Stack>
        </Stack>
      </Paper>

      {/* Vendors Grid */}
      <Grid container spacing={3}>
        {vendors.length === 0 ? (
          <Grid item xs={12}>
            <Card elevation={2}>
              <CardContent sx={{ textAlign: 'center', py: 8 }}>
                <StoreIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No Vendors Found
                </Typography>
                <Typography color="text.secondary" paragraph>
                  Register your first vendor to get started
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={handleCreateClick}
                  sx={{ mt: 2 }}
                >
                  Register Vendor
                </Button>
              </CardContent>
            </Card>
          </Grid>
        ) : (
          vendors.map((vendor) => (
            <Grid item xs={12} md={6} lg={4} key={vendor.id}>
              <Card 
                elevation={2}
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 4
                  }
                }}
              >
                <CardContent sx={{ flexGrow: 1 }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={2}>
                    <Typography variant="h6" component="div" gutterBottom>
                      {vendor.name}
                    </Typography>
                    <Stack direction="row" spacing={1}>
                      <Tooltip title="Edit Vendor">
                        <IconButton 
                          size="small" 
                          onClick={() => handleEditClick(vendor)}
                          sx={{ color: 'primary.main' }}
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete Vendor">
                        <IconButton 
                          size="small" 
                          onClick={() => handleDeleteClick(vendor)}
                          sx={{ color: 'error.main' }}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </Stack>
                  <Stack spacing={2}>
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Address
                      </Typography>
                      <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>
                        {vendor.address}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Description
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {vendor.description}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Status
                      </Typography>
                      <Chip
                        label={vendor.approved ? 'Approved' : 'Pending'}
                        color={vendor.approved ? 'success' : 'warning'}
                        size="small"
                      />
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          ))
        )}
      </Grid>

      {/* Create Vendor Dialog */}
      <Dialog open={openCreateDialog} onClose={() => setOpenCreateDialog(false)}>
        <DialogTitle>Register New Vendor</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Vendor Address"
            value={createFormData.address}
            onChange={(e) => setCreateFormData({ ...createFormData, address: e.target.value })}
            margin="normal"
            required
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCreateDialog(false)}>Cancel</Button>
          <Button onClick={handleCreateSubmit} variant="contained" color="primary">
            Register
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Vendor Dialog */}
      <Dialog open={openEditDialog} onClose={() => setOpenEditDialog(false)}>
        <DialogTitle>Edit Vendor</DialogTitle>
        <DialogContent>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
            Vendor details cannot be updated after registration.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenEditDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Delete Vendor Dialog */}
      <Dialog open={openDeleteDialog} onClose={() => setOpenDeleteDialog(false)}>
        <DialogTitle>Delete Vendor</DialogTitle>
        <DialogContent>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
            Vendors cannot be deleted after registration.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminVendors; 