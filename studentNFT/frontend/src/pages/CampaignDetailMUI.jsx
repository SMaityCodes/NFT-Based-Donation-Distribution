import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Box, Typography, Button, TextField, CircularProgress, Paper, List, ListItem, ListItemText, Chip, Grid, Link
} from '@mui/material';
import useWeb3Store from '../store/web3Store';
import { toast } from 'react-toastify';
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
      console.log("fetchedCamp", fetchedCampaign);
      console.log("camps", contractInstance);


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
  console.log("campaign", campaign);
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
        </Grid>
      </Paper>

      <Box sx={{ mt: 6 }}>
        <Typography variant="h5" gutterBottom>Donors to this Campaign</Typography>
        {donors.length === 0 ? (
          <Typography>No donors yet for this campaign.</Typography>
        ) : (
          <List>
            {donors.map((donor, index) => (
              <Paper component={ListItem} key={index} elevation={1} sx={{ mb: 1 }}>
                <ListItemText
                  primary={<Typography fontWeight="bold" fontSize={20} width={60}>{donor.donorAddress}</Typography>}
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