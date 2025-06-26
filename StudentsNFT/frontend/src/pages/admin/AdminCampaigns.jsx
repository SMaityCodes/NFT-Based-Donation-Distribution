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
  InputLabel,
  CardActions
} from '@mui/material';
import {
  Campaign as CampaignIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  CheckCircle as CheckCircleIcon,
  Pending as PendingIcon,
  AttachMoney as MoneyIcon,
  School as SchoolIcon,
  Grade as GradeIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import useWeb3Store from '../../store/web3Store';
import { toast } from 'react-hot-toast';
import { ethers } from 'ethers';
import { useNavigate } from 'react-router-dom';
import { STANDARDS } from '../../utils/constants';

const AdminCampaigns = () => {
  const navigate = useNavigate();
  const { contract, account } = useWeb3Store();
  const [loading, setLoading] = useState(true);
  const [campaigns, setCampaigns] = useState([]);
  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [createFormData, setCreateFormData] = useState({
    name: '',
    allowedSchoolTypes: [],
    allowedStandards: []
  });
  const [editFormData, setEditFormData] = useState({
    name: ''
  });

  const schoolTypes = [
    { value: 0, label: 'Government' },
    { value: 1, label: 'Private' },
    { value: 2, label: 'Both' }
  ];

  const fetchCampaigns = async () => {
    if (!contract || !account) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const allCampaigns = await contract.getAllCampaigns();
      console.log("all camps", allCampaigns);
      const formattedCampaigns = allCampaigns.map((campaign, index) => ({
        id: campaign.id.toString(),
        name: campaign.name,
        allowedSchoolTypes: campaign.allowedSchoolTypes.map(type => 
          type === 0 ? 'Government' : type === 1 ? 'Private' : 'Both'
        ),
        allowedStandards: campaign.allowedStandards,
        active: campaign.exists
      }));
      setCampaigns(formattedCampaigns);
    } catch (error) {
      console.error('Error fetching campaigns:', error);
      toast.error('Failed to fetch campaigns');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, [contract, account]);

  const handleCreateClick = () => {
    setCreateFormData({
      name: '',
      allowedSchoolTypes: [],
      allowedStandards: []
    });
    setSelectedCampaign(null);
    setOpenCreateDialog(true);
  };

  const handleEditClick = (campaign) => {
    setSelectedCampaign(campaign);
    setEditFormData({
      name: campaign.name
    });
    setOpenEditDialog(true);
  };

  const handleDeleteClick = (campaign) => {
    setSelectedCampaign(campaign);
    setOpenDeleteDialog(true);
  };

  const handleCreateSubmit = async () => {
    if (!contract || !account) return;

    try {
      const tx = await contract.createCampaign(
        createFormData.name,
        createFormData.allowedSchoolTypes,
        createFormData.allowedStandards
      );
      await tx.wait();
      toast.success('Campaign created successfully');
      setOpenCreateDialog(false);
      fetchCampaigns();
    } catch (error) {
      console.error('Error creating campaign:', error);
      toast.error('Failed to create campaign');
    }
  };

  const handleEditSubmit = async () => {
    if (!contract || !account || !selectedCampaign) return;

    try {
      const tx = await contract.updateCampaign(
        selectedCampaign.id,
        editFormData.name,
        selectedCampaign.allowedStandards
      );
      await tx.wait();
      toast.success('Campaign updated successfully');
      setOpenEditDialog(false);
      fetchCampaigns();
    } catch (error) {
      console.error('Error updating campaign:', error);
      toast.error('Failed to update campaign');
    }
  };

  const handleDeleteSubmit = async () => {
    if (!contract || !account || !selectedCampaign) return;

    try {
      const tx = await contract.deleteCampaign(selectedCampaign.id);
      await tx.wait();
      toast.success('Campaign deleted successfully');
      setOpenDeleteDialog(false);
      fetchCampaigns();
    } catch (error) {
      console.error('Error deleting campaign:', error);
      toast.error('Failed to delete campaign');
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
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1">
          Campaign Management
        </Typography>
        <Stack direction="row" spacing={2}>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleCreateClick}
          >
            Create Campaign
          </Button>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={fetchCampaigns}
          >
            Refresh
          </Button>
        </Stack>
      </Box>

      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
          <CircularProgress />
        </Box>
      ) : campaigns.length === 0 ? (
        <Card elevation={2}>
          <CardContent sx={{ textAlign: 'center', py: 8 }}>
            <CampaignIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No Campaigns Found
            </Typography>
            <Typography color="text.secondary" paragraph>
              Create your first campaign to start accepting donations
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleCreateClick}
              sx={{ mt: 2 }}
            >
              Create Campaign
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={3}>
          {campaigns.map((campaign) => (
            <Grid item xs={12} md={6} lg={4} key={campaign.id}>
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
                  <Stack spacing={2}>
                    {/* Header with Actions */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Typography variant="h6" component="div">
                        {campaign.name}
                      </Typography>
                      <Stack direction="row" spacing={1}>
                        <Tooltip title="Edit Campaign">
                          <IconButton 
                            size="small" 
                            onClick={() => handleEditClick(campaign)}
                            sx={{ color: 'primary.main' }}
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete Campaign">
                          <IconButton 
                            size="small" 
                            onClick={() => handleDeleteClick(campaign)}
                            sx={{ color: 'error.main' }}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </Box>

                    {/* Campaign ID */}
                    <Box>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <InfoIcon color="info" fontSize="small" />
                        <Typography variant="subtitle2" color="text.secondary">
                          Campaign ID: {campaign.id.toString()}
                        </Typography>
                      </Stack>
                    </Box>

                    {/* School Types */}
                    <Box>
                      <Stack direction="row" spacing={1} alignItems="center" mb={1}>
                        <SchoolIcon color="primary" fontSize="small" />
                        <Typography variant="subtitle2" color="text.secondary">
                          Allowed School Types:
                        </Typography>
                      </Stack>
                      <Box display="flex" flexWrap="wrap" gap={0.5}>
                        {campaign.allowedSchoolTypes.map((type, index) => (
                          <Chip
                            key={index}
                            label={type}
                            size="small"
                            color="primary"
                            variant="outlined"
                          />
                        ))}
                      </Box>
                    </Box>

                    {/* Standards */}
                    <Box>
                      <Stack direction="row" spacing={1} alignItems="center" mb={1}>
                        <GradeIcon color="secondary" fontSize="small" />
                        <Typography variant="subtitle2" color="text.secondary">
                          Allowed Standards:
                        </Typography>
                      </Stack>
                      <Box display="flex" flexWrap="wrap" gap={0.5}>
                        {campaign.allowedStandards.map((standard, index) => (
                          <Chip
                            key={index}
                            label={STANDARDS[standard] || `Standard ${standard}`}
                            size="small"
                            color="secondary"
                            variant="outlined"
                          />
                        ))}
                      </Box>
                    </Box>

                    {/* Status */}
                    <Box>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <CampaignIcon 
                          color={campaign.active ? "success" : "error"} 
                          fontSize="small" 
                        />
                        <Typography variant="subtitle2" color="text.secondary">
                          Status:
                        </Typography>
                        <Chip
                          label={campaign.active ? 'Active' : 'Inactive'}
                          color={campaign.active ? 'success' : 'error'}
                          size="small"
                        />
                      </Stack>
                    </Box>
                  </Stack>
                </CardContent>
                <Divider />
                <CardActions>
                  <Button
                    fullWidth
                    variant="contained"
                    onClick={() => navigate(`/admin/campaigns/${campaign.id}`)}
                  >
                    View Details
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Create/Edit Dialog */}
      <Dialog 
        open={openCreateDialog} 
        onClose={() => setOpenCreateDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {selectedCampaign ? 'Edit Campaign' : 'Create New Campaign'}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 2 }}>
            <TextField
              label="Campaign Name"
              value={createFormData.name}
              onChange={(e) => setCreateFormData({ ...createFormData, name: e.target.value })}
              fullWidth
            />
            <FormControl fullWidth>
              <InputLabel>Allowed School Types</InputLabel>
              <Select
                multiple
                value={createFormData.allowedSchoolTypes}
                onChange={(e) => setCreateFormData({ ...createFormData, allowedSchoolTypes: e.target.value })}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selected.map((value) => (
                      <Chip key={value} label={value} size="small" />
                    ))}
                  </Box>
                )}
              >
                {['Government', 'Private', 'International'].map((type) => (
                  <MenuItem key={type} value={type}>
                    {type}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Allowed Standards</InputLabel>
              <Select
                multiple
                value={createFormData.allowedStandards}
                onChange={(e) => setCreateFormData({ ...createFormData, allowedStandards: e.target.value })}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selected.map((value) => (
                      <Chip 
                        key={value} 
                        label={STANDARDS[value] || `Standard ${value}`} 
                        size="small" 
                      />
                    ))}
                  </Box>
                )}
              >
                {Object.entries(STANDARDS).map(([value, label]) => (
                  <MenuItem key={value} value={parseInt(value)}>
                    {label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCreateDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleCreateSubmit} 
            variant="contained"
            disabled={!createFormData.name || createFormData.allowedSchoolTypes.length === 0 || createFormData.allowedStandards.length === 0}
          >
            {selectedCampaign ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={openDeleteDialog}
        onClose={() => setOpenDeleteDialog(false)}
      >
        <DialogTitle>Delete Campaign</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the campaign "{selectedCampaign?.name}"?
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleDeleteSubmit} 
            color="error" 
            variant="contained"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminCampaigns; 