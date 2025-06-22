import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Card, CardContent, Grid, Chip, CircularProgress, Button, Paper, Divider, List, ListItem, ListItemText, Stack, Alert
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { ethers } from 'ethers';
import useWeb3Store from '../store/web3Store';

const DonorDashboard = () => {
  const { contract, account, isConnected } = useWeb3Store();
  const [campaigns, setCampaigns] = useState([]);
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalDonated, setTotalDonated] = useState('0');
  const navigate = useNavigate();

  // Fetch all campaigns
  const fetchCampaigns = async () => {
    if (!contract) return [];
    try {
      const allCampaigns = await contract.getAllCampaigns();
      return allCampaigns.map((c) => ({
        id: c.id.toString(),
        name: c.name,
        targetAmount: ethers.formatEther(c.targetAmount),
        raisedAmount: ethers.formatEther(c.raisedAmount),
        exists: c.exists
      }));
    } catch (err) {
      setError('Failed to fetch campaigns');
      return [];
    }
  };

  // Fetch all donations by this donor
  const fetchDonations = async () => {
    if (!contract || !account) return [];
    try {
      // Try to use a view function if available
      if (contract.getDonationsByDonor) {
        const donorDonations = await contract.getDonationsByDonor(account);
        return donorDonations.map((d) => ({
          campaignId: d.campaignId.toString(),
          amount: ethers.formatEther(d.amount),
          timestamp: d.timestamp ? new Date(d.timestamp.toNumber() * 1000).toLocaleString() : '',
        }));
      } else {
        // Fallback: filter CampaignDonationReceived events
        const filter = contract.filters.CampaignDonationReceived(null, account);
        const events = await contract.queryFilter(filter, 0, 'latest');
        return events.map((e) => ({
          campaignId: e.args.campaignId.toString(),
          amount: ethers.formatEther(e.args.amount),
          timestamp: e.blockNumber // Could fetch block timestamp if needed
        }));
      }
    } catch (err) {
      setError('Failed to fetch donations');
      return [];
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [camps, dons] = await Promise.all([
          fetchCampaigns(),
          fetchDonations()
        ]);
        setCampaigns(camps);
        setDonations(dons);
        // Calculate total donated
        const total = dons.reduce((sum, d) => sum + parseFloat(d.amount), 0);
        setTotalDonated(total.toFixed(4));
      } catch (err) {
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };
    if (isConnected && account) {
      loadData();
    }
  }, [contract, account, isConnected]);

  if (loading) {
    return <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px"><CircularProgress /></Box>;
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  return (
    <Box sx={{ p: 3, maxWidth: '1400px', margin: '0 auto' }}>
      <Typography variant="h4" fontWeight="bold" gutterBottom>Donor Dashboard</Typography>
      <Divider sx={{ mb: 3 }} />
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card elevation={2}>
            <CardContent>
              <Typography variant="h6" gutterBottom>Profile</Typography>
              <Typography variant="body2" color="text.secondary">Wallet Address</Typography>
              <Typography variant="body1" sx={{ wordBreak: 'break-all' }}>{account}</Typography>
              <Box mt={2}>
                <Typography variant="subtitle2" color="text.secondary">Total Donated</Typography>
                <Chip label={`${totalDonated} ETH`} color="success" size="medium" />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={8}>
          <Card elevation={2}>
            <CardContent>
              <Typography variant="h6" gutterBottom>Donation History</Typography>
              {donations.length === 0 ? (
                <Typography color="text.secondary">No donations found.</Typography>
              ) : (
                <List>
                  {donations.map((don, idx) => (
                    <ListItem key={idx} divider>
                      <ListItemText
                        primary={`Campaign #${don.campaignId}`}
                        secondary={`Amount: ${don.amount} ETH${don.timestamp ? ` | Time: ${don.timestamp}` : ''}`}
                      />
                    </ListItem>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12}>
          <Paper elevation={2} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>All Campaigns</Typography>
            {campaigns.length === 0 ? (
              <Typography color="text.secondary">No campaigns found.</Typography>
            ) : (
              <Grid container spacing={2}>
                {campaigns.map((c) => (
                  <Grid item xs={12} md={6} lg={4} key={c.id}>
                    <Card elevation={1} sx={{ height: '100%' }}>
                      <CardContent>
                        <Typography variant="h6">{c.name}</Typography>
                        <Typography variant="body2" color="text.secondary">ID: {c.id}</Typography>
                        <Typography variant="body2">Target: {c.targetAmount} ETH</Typography>
                        <Typography variant="body2">Raised: {c.raisedAmount} ETH</Typography>
                        <Chip label={c.exists ? 'Active' : 'Inactive'} color={c.exists ? 'success' : 'error'} size="small" sx={{ mt: 1 }} />
                        <Button
                          variant="outlined"
                          size="small"
                          sx={{ mt: 2 }}
                          onClick={() => navigate(`/campaigns/${c.id}`)}
                        >
                          View Details
                        </Button>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default DonorDashboard;
