import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  CircularProgress,
  Chip,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import useWeb3Store from '../../store/web3Store';
import { ethers } from 'ethers';
import { toast } from 'react-hot-toast';

const StudentCampaigns = () => {
  const { contract, account } = useWeb3Store();
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [requestAmount, setRequestAmount] = useState('');

  useEffect(() => {
    const fetchCampaigns = async () => {
      if (!contract || !account) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const campaigns = await contract.getAllCampaigns();
        const formattedCampaigns = campaigns.map((campaign, index) => ({
          id: index,
          name: campaign.name,
          exists: campaign.exists,
          allowedSchoolTypes: campaign.allowedSchoolTypes,
          allowedStandards: campaign.allowedStandards
        }));

        setCampaigns(formattedCampaigns);
      } catch (error) {
        console.error('Error fetching campaigns:', error);
        toast.error('Failed to fetch campaigns');
      } finally {
        setLoading(false);
      }
    };

    fetchCampaigns();
  }, [contract, account]);

  const handleRequestFunds = async () => {
    if (!selectedCampaign || !requestAmount) return;

    try {
      const amount = ethers.parseEther(requestAmount);
      const tx = await contract.requestFunds(selectedCampaign.id, amount);
      await tx.wait();
      
      toast.success('Fund request submitted successfully');
      setOpenDialog(false);
      setSelectedCampaign(null);
      setRequestAmount('');
    } catch (error) {
      console.error('Error requesting funds:', error);
      toast.error('Failed to request funds');
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
    <Box>
      <Typography variant="h4" gutterBottom>
        Available Campaigns
      </Typography>

      {campaigns.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography color="text.secondary">
            No campaigns available at the moment.
          </Typography>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {campaigns.map((campaign) => (
            <Grid item xs={12} sm={6} md={4} key={campaign.id}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    {campaign.name}
                  </Typography>
                  <Box mb={2}>
                    <Typography variant="subtitle2" gutterBottom>
                      Allowed School Types:
                    </Typography>
                    <Box display="flex" flexWrap="wrap" gap={0.5}>
                      {campaign.allowedSchoolTypes.map((type, index) => (
                        <Chip key={index} label={type} size="small" />
                      ))}
                    </Box>
                  </Box>
                  <Box mb={2}>
                    <Typography variant="subtitle2" gutterBottom>
                      Allowed Standards:
                    </Typography>
                    <Box display="flex" flexWrap="wrap" gap={0.5}>
                      {campaign.allowedStandards.map((standard, index) => (
                        <Chip key={index} label={standard} size="small" />
                      ))}
                    </Box>
                  </Box>
                </CardContent>
                <CardActions>
                  <Button 
                    size="small" 
                    color="primary"
                    onClick={() => {
                      setSelectedCampaign(campaign);
                      setOpenDialog(true);
                    }}
                  >
                    Request Funds
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle>Request Funds</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Amount (ETH)"
            type="number"
            fullWidth
            value={requestAmount}
            onChange={(e) => setRequestAmount(e.target.value)}
            InputProps={{
              inputProps: { min: 0, step: 0.01 }
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button onClick={handleRequestFunds} color="primary">
            Submit Request
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default StudentCampaigns; 