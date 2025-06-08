import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  TextField,
  Button,
  CircularProgress,
  Chip,
  Divider
} from '@mui/material';
import useWeb3Store from '../../store/web3Store';
import { toast } from 'react-hot-toast';

const VendorProfile = () => {
  const { contract, account } = useWeb3Store();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    location: ''
  });

  useEffect(() => {
    const fetchProfile = async () => {
      if (!contract || !account) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const vendor = await contract.vendors(account);
        
        if (vendor.exists) {
          setProfile({
            name: vendor.name,
            description: vendor.description,
            location: vendor.location,
            approved: vendor.approved
          });
          setFormData({
            name: vendor.name,
            description: vendor.description,
            location: vendor.location
          });
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
        toast.error('Failed to fetch profile');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [contract, account]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!contract || !account) return;

    try {
      const tx = await contract.updateVendorProfile(
        formData.name,
        formData.description,
        formData.location
      );
      await tx.wait();
      
      toast.success('Profile updated successfully');
      setEditMode(false);
      // Refresh profile data
      const vendor = await contract.vendors(account);
      setProfile({
        name: vendor.name,
        description: vendor.description,
        location: vendor.location,
        approved: vendor.approved
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (!profile) {
    return (
      <Box>
        <Typography variant="h4" gutterBottom>
          Vendor Profile
        </Typography>
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography color="text.secondary">
            No profile found. Please register as a vendor first.
          </Typography>
        </Paper>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Vendor Profile
      </Typography>

      <Paper sx={{ p: 3 }}>
        {editMode ? (
          <form onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  multiline
                  rows={4}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Location"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <Box display="flex" gap={2}>
                  <Button
                    variant="contained"
                    color="primary"
                    type="submit"
                  >
                    Save Changes
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={() => setEditMode(false)}
                  >
                    Cancel
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </form>
        ) : (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="h6">Profile Information</Typography>
                <Button
                  variant="outlined"
                  onClick={() => setEditMode(true)}
                >
                  Edit Profile
                </Button>
              </Box>
              <Divider sx={{ my: 2 }} />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle2" color="text.secondary">
                Name
              </Typography>
              <Typography variant="body1" gutterBottom>
                {profile.name}
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle2" color="text.secondary">
                Description
              </Typography>
              <Typography variant="body1" gutterBottom>
                {profile.description}
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle2" color="text.secondary">
                Location
              </Typography>
              <Typography variant="body1" gutterBottom>
                {profile.location}
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <Box mt={2}>
                <Chip
                  label={profile.approved ? 'Approved' : 'Pending Approval'}
                  color={profile.approved ? 'success' : 'warning'}
                />
              </Box>
            </Grid>
          </Grid>
        )}
      </Paper>
    </Box>
  );
};

export default VendorProfile; 