import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Chip,
  Tabs,
  Tab
} from '@mui/material';
import useWeb3Store from '../store/web3Store';
import { ethers } from 'ethers';
import { toast } from 'react-hot-toast';

const DonorDonations = () => {
  const { contract, account, provider } = useWeb3Store();
  const [donations, setDonations] = useState([]);
  const [allDonations, setAllDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    const checkAdmin = async () => {
      if (!contract || !account) return;
      try {
        const owner = await contract.owner();
        setIsAdmin(owner.toLowerCase() === account.toLowerCase());
      } catch (error) {
        console.error('Error checking admin status:', error);
      }
    };

    checkAdmin();
  }, [contract, account]);

  useEffect(() => {
    const fetchDonations = async () => {
      if (!contract || !account || !provider) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        // Get all campaigns first
        const campaigns = await contract.getAllCampaigns();
        
        // Get all donation events
        const filter = contract.filters.CampaignDonationReceived();
        const allEvents = await contract.queryFilter(filter);
        
        // Process all donations for admin view
        const allDonationPromises = campaigns.map(async (campaign) => {
          try {
            // Filter events for this campaign
            const campaignEvents = allEvents.filter(event => {
              const eventCampaignId = event.args.campaignId.toString();
              return eventCampaignId === campaign.id.toString();
            });
            
            // Group donations by donor
            const donationsByDonor = campaignEvents.reduce((acc, event) => {
              const donor = event.args.donor.toLowerCase();
              if (!acc[donor]) {
                acc[donor] = {
                  amount: 0,
                  timestamp: event.blockNumber
                };
              }
              acc[donor].amount += parseFloat(ethers.formatEther(event.args.amount));
              return acc;
            }, {});

            // Convert to array format
            return Object.entries(donationsByDonor).map(([donor, data]) => ({
              campaignId: campaign.id.toString(),
              campaignName: campaign.name,
              donor,
              amount: data.amount.toString(),
              timestamp: data.timestamp
            }));
          } catch (err) {
            console.error(`Error fetching donations for campaign ${campaign.id}:`, err);
            return [];
          }
        });

        const allDonationResults = await Promise.all(allDonationPromises);
        const flattenedAllDonations = allDonationResults.flat();
        
        // Get timestamps for all donations
        const donationsWithTimestamps = await Promise.all(
          flattenedAllDonations.map(async (donation) => {
            try {
              const block = await provider.getBlock(donation.timestamp);
              return {
                ...donation,
                timestamp: block ? new Date(block.timestamp * 1000).toLocaleDateString() : new Date().toLocaleDateString()
              };
            } catch (error) {
              return {
                ...donation,
                timestamp: new Date().toLocaleDateString()
              };
            }
          })
        );

        setAllDonations(donationsWithTimestamps);

        // Filter donations for current user
        const userDonations = donationsWithTimestamps.filter(
          donation => donation.donor.toLowerCase() === account.toLowerCase()
        );
        setDonations(userDonations);
      } catch (error) {
        console.error('Error fetching donations:', error);
        toast.error('Failed to fetch donation history');
      } finally {
        setLoading(false);
      }
    };

    fetchDonations();
  }, [contract, account, provider]);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  const renderDonationsTable = (donations) => (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Campaign</TableCell>
            {isAdmin && activeTab === 1 && <TableCell>Donor</TableCell>}
            <TableCell>Amount</TableCell>
            <TableCell>Date</TableCell>
            <TableCell>Status</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {donations.map((donation, index) => (
            <TableRow key={`${donation.campaignId}-${donation.donor}-${index}`}>
              <TableCell>{donation.campaignName}</TableCell>
              {isAdmin && activeTab === 1 && (
                <TableCell>
                  <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                    {donation.donor}
                  </Typography>
                </TableCell>
              )}
              <TableCell>
                <Chip 
                  label={`${donation.amount} ETH`}
                  color="success"
                  size="small"
                />
              </TableCell>
              <TableCell>{donation.timestamp}</TableCell>
              <TableCell>
                <Chip 
                  label="Completed"
                  color="success"
                  size="small"
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        {isAdmin ? 'Donation Management' : 'My Donations'}
      </Typography>

      {isAdmin && (
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={activeTab} onChange={handleTabChange}>
            <Tab label="My Donations" />
            <Tab label="All Donations" />
          </Tabs>
        </Box>
      )}
      
      {(activeTab === 0 ? donations : allDonations).length === 0 ? (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography color="text.secondary">
            {activeTab === 0 ? 'You haven\'t made any donations yet.' : 'No donations have been made yet.'}
          </Typography>
        </Paper>
      ) : (
        renderDonationsTable(activeTab === 0 ? donations : allDonations)
      )}
    </Box>
  );
};

export default DonorDonations; 