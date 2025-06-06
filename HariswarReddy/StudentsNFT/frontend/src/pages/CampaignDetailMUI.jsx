import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Box, Typography, Button, TextField, CircularProgress, Paper, List, ListItem, ListItemText, Chip, Grid, Link
} from '@mui/material';
import useWeb3Store from '../store/web3Store';
import { toast } from 'react-hot-toast';
import { ethers } from 'ethers';
import { STANDARDS } from '../utils/constants';

const CampaignDetailMUI = () => {
  const { id } = useParams();
  const campaignId = parseInt(id);
  const { contract, signer, isConnected, getReadOnlyContract } = useWeb3Store();
  const [campaign, setCampaign] = useState(null);
  const [donationAmount, setDonationAmount] = useState('');
  const [loading, setLoading] = useState(true);
  const [donating, setDonating] = useState(false);
  const [error, setError] = useState(null);
  const [donors, setDonors] = useState([]);
  const [campaignBalance, setCampaignBalance] = useState(0); // Display 0 if not available
  const [donationError, setDonationError] = useState(null);

  const fetchCampaignData = async () => {
    setLoading(true);
    setError(null);
    try {
      const contractInstance = contract || getReadOnlyContract();
      if (!contractInstance) {
        setError("Contract not loaded. Please connect your wallet or ensure RPC URL is set.");
        setLoading(false);
        return;
      }

      const fetchedCampaign = await contractInstance.campaigns(campaignId);
      if (!fetchedCampaign.exists) {
        setError("Campaign not found.");
        setLoading(false);
        return;
      }
      setCampaign(fetchedCampaign);

      // Fetch campaign balance (publicly callable getter)
      try {
          const balance = await contractInstance.getCampaignBalance(campaignId); // Make sure this is public in contract
          setCampaignBalance(ethers.formatEther(balance));
      } catch (balErr) {
          console.warn("Could not fetch campaign balance (might be owner-only or network issue):", balErr.message);
          setCampaignBalance(0); // Default to 0 if fetch fails
      }

      // Fetch donors (assuming getDonorsByCampaign is viewable by anyone)
      const fetchedDonors = await contractInstance.getDonorsByCampaign(campaignId);
      setDonors(fetchedDonors);

    } catch (err) {
      console.error("Failed to fetch campaign details:", err);
      setError("Failed to load campaign details: " + (err.reason || err.message));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaignData();
  }, [id, contract, getReadOnlyContract]);

  const handleDonate = async () => {
    setDonationError(null);
    if (!isConnected || !signer || !contract) {
      toast.error("Please connect your wallet.");
      return;
    }
    const amount = parseFloat(donationAmount);
    if (isNaN(amount) || amount <= 0) {
      setDonationError("Please enter a valid positive amount.");
      return;
    }

    setDonating(true);
    try {
      const amountInWei = ethers.parseEther(donationAmount);
      const tx = await contract.donateToCampaign(campaignId, { value: amountInWei });
      toast.loading("Transaction pending...", { id: 'donateTx' });
      await tx.wait();
      toast.success("Donation successful!", { id: 'donateTx' });
      setDonationAmount('');
      fetchCampaignData(); // Refresh data
    } catch (err) {
      console.error("Donation failed:", err);
      setDonationError(err.reason || err.message);
      toast.error(`Donation failed: ${err.reason || err.message}`, { id: 'donateTx' });
    } finally {
      setDonating(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
        <CircularProgress size={50} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ textAlign: 'center', color: 'error.main', mt: 4 }}>
        <Typography variant="h6">{error}</Typography>
      </Box>
    );
  }

  if (!campaign) {
    return (
      <Box sx={{ textAlign: 'center', mt: 4 }}>
        <Typography variant="h6">Campaign not found.</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>Campaign: {campaign.name}</Typography>
      <Paper sx={{ p: 3, mb: 4 }}>
        <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
                <Typography variant="body1"><strong>ID:</strong> {campaign.id.toString()}</Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
                {campaignBalance > 0 && (
                    <Typography variant="body1">
                        <strong>Current Balance:</strong> <Chip label={`${campaignBalance} ETH`} color="success" size="small" />
                    </Typography>
                )}
            </Grid>
            <Grid item xs={12}>
                <Typography variant="body1"><strong>Allowed School Types:</strong>{' '}
                    {campaign.allowedSchoolTypes.map((type, idx) => (
                        <Chip key={idx} label={type} size="small" sx={{ mr: 0.5, mb: 0.5 }} />
                    ))}
                </Typography>
            </Grid>
            <Grid item xs={12}>
                <Typography variant="body1"><strong>Allowed Standards:</strong>{' '}
                    {campaign.allowedStandards.map(s => (
                        <Chip key={s} label={STANDARDS[s]} size="small" sx={{ mr: 0.5, mb: 0.5 }} />
                    ))}
                </Typography>
            </Grid>
        </Grid>
      </Paper>

      <VStack spacing={3} sx={{ mt: 4 }}>
        <Typography variant="h5" gutterBottom>Make a Donation</Typography>
        <TextField
          label="Amount (ETH)"
          type="number"
          placeholder="e.g., 0.1"
          value={donationAmount}
          onChange={(e) => setDonationAmount(e.target.value)}
          error={!!donationError}
          helperText={donationError}
          fullWidth
        />
        <Button
          variant="contained"
          color="secondary"
          onClick={handleDonate}
          disabled={!isConnected || donating || !donationAmount || parseFloat(donationAmount) <= 0}
          startIcon={donating && <CircularProgress size={20} color="inherit" />}
          fullWidth
        >
          Donate
        </Button>
      </VStack>

      <Box sx={{ mt: 6 }}>
        <Typography variant="h5" gutterBottom>Donors to this Campaign</Typography>
        {donors.length === 0 ? (
          <Typography>No donors yet for this campaign.</Typography>
        ) : (
          <List>
            {donors.map((donor, index) => (
              <Paper component={ListItem} key={index} elevation={1} sx={{ mb: 1 }}>
                <ListItemText
                  primary={<Typography fontWeight="bold">{donor.donorAddress}</Typography>}
                  secondary={<Chip label={`${ethers.formatEther(donor.totalDonated)} ETH`} color="success" size="small" />}
                />
              </Paper>
            ))}
          </List>
        )}
      </Box>
    </Box>
  );
};

// Helper for VStack like Chakra UI
const VStack = ({ children, spacing, ...props }) => (
  <Box display="flex" flexDirection="column" gap={spacing * 8} {...props}>
    {children}
  </Box>
);

export default CampaignDetailMUI;