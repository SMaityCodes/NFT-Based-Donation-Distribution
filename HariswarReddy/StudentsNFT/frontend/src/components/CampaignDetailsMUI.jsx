import React, { useState, useEffect } from 'react';
import {
  Box, Typography, CircularProgress, Select, MenuItem, Paper, Grid, Chip
} from '@mui/material';
import useWeb3Store from '../store/web3Store';
import { STANDARDS } from '../utils/constants';
import { toast } from 'react-hot-toast';
import { ethers } from 'ethers';

const CampaignDetailsMUI = ({ campaigns = [] }) => {
  const { contract } = useWeb3Store();
  const [selectedCampaignId, setSelectedCampaignId] = useState('');
  const [selectedCampaignDetails, setSelectedCampaignDetails] = useState(null);
  const [loadingCampaignDetails, setLoadingCampaignDetails] = useState(false);

  const fetchCampaignDetails = async (campaignId) => {
    if (!contract || !campaignId) {
      setSelectedCampaignDetails(null);
      return;
    }
    setLoadingCampaignDetails(true);
    try {
      const campaign = await contract.campaigns(parseInt(campaignId));
      const balance = await contract.getCampaignBalance(parseInt(campaignId));
      
      // Get the number of minted NFTs for this campaign
      let mintedNfts = 0;
      try {
        const students = await contract.getStudentsByCampaign(parseInt(campaignId));
        // Count students that have an NFT (nftId > 0)
        mintedNfts = students.filter(student => student.nftId > 0).length;
      } catch (err) {
        console.error("Error fetching minted NFTs:", err);
        mintedNfts = 0;
      }
      
      // Format the campaign data
      const formattedCampaign = {
        id: campaign.id.toString(),
        name: campaign.name,
        exists: campaign.exists,
        balance: ethers.formatEther(balance),
        allowedSchoolTypes: campaign.allowedSchoolTypes || [],
        allowedStandards: campaign.allowedStandards || [],
        mintedNfts: mintedNfts.toString()
      };

      setSelectedCampaignDetails(formattedCampaign);
    } catch (err) {
      console.error("Failed to fetch campaign details:", err);
      toast.error(`Failed to fetch campaign details: ${err.reason || err.message}`);
      setSelectedCampaignDetails(null);
    } finally {
      setLoadingCampaignDetails(false);
    }
  };

  useEffect(() => {
    if (selectedCampaignId) {
      fetchCampaignDetails(selectedCampaignId);
    } else {
      setSelectedCampaignDetails(null);
    }
  }, [selectedCampaignId, contract]);

  if (!Array.isArray(campaigns)) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography color="error">No campaigns data available</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h5" gutterBottom>View Campaign Details</Typography>
      <Select
        value={selectedCampaignId}
        onChange={(e) => setSelectedCampaignId(e.target.value)}
        displayEmpty
        inputProps={{ 'aria-label': 'Select Campaign for Details' }}
        sx={{ minWidth: 250, mb: 3 }}
      >
        <MenuItem value="" disabled>
          Select campaign
        </MenuItem>
        {campaigns.map((camp) => (
          <MenuItem key={camp.id.toString()} value={camp.id.toString()}>
            {camp.name} (ID: {camp.id.toString()})
          </MenuItem>
        ))}
      </Select>

      {loadingCampaignDetails ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : selectedCampaignDetails ? (
        <Paper elevation={3} sx={{ mt: 3, p: 3 }}>
          <Typography variant="h6" gutterBottom>{selectedCampaignDetails.name}</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Typography><strong>ID:</strong> {selectedCampaignDetails.id}</Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography><strong>Status:</strong> {selectedCampaignDetails.exists ? 'Active' : 'Inactive'}</Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 1 }}>
                <strong>Current Balance:</strong> <Chip label={`${selectedCampaignDetails.balance} ETH`} color="success" size="small" />
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 1 }}>
                <strong>NFTs Minted:</strong> <Chip label={selectedCampaignDetails.mintedNfts} color="info" size="small" />
              </Typography>
            </Grid>
            {selectedCampaignDetails.allowedSchoolTypes && selectedCampaignDetails.allowedSchoolTypes.length > 0 && (
              <Grid item xs={12}>
                <Typography component="span" sx={{ display: 'block', mb: 1 }}>
                  <strong>Allowed School Types:</strong>
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {selectedCampaignDetails.allowedSchoolTypes.map((type, idx) => (
                    <Chip key={idx} label={type} size="small" />
                  ))}
                </Box>
              </Grid>
            )}
            {selectedCampaignDetails.allowedStandards && selectedCampaignDetails.allowedStandards.length > 0 && (
              <Grid item xs={12}>
                <Typography component="span" sx={{ display: 'block', mb: 1 }}>
                  <strong>Allowed Standards:</strong>
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {selectedCampaignDetails.allowedStandards.map((s, idx) => (
                    <Chip key={idx} label={STANDARDS[s] || `Standard ${s}`} size="small" />
                  ))}
                </Box>
              </Grid>
            )}
          </Grid>
        </Paper>
      ) : selectedCampaignId && !selectedCampaignDetails ? (
        <Typography sx={{ mt: 4, color: 'error.main' }}>No details found for the selected campaign, or an error occurred.</Typography>
      ) : (
        <Typography sx={{ mt: 4, color: 'text.secondary' }}>Select a campaign to view its details.</Typography>
      )}
    </Box>
  );
};

export default CampaignDetailsMUI;