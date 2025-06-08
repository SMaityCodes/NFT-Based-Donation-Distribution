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
  Stack,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  School as SchoolIcon,
  Grade as GradeIcon,
  Campaign as CampaignIcon,
  AttachMoney as MoneyIcon,
} from '@mui/icons-material';
import useWeb3Store from '../../store/web3Store';
import { ethers } from 'ethers';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { STANDARDS } from '../../utils/constants';

const DonorCampaigns = () => {
  const { contract, account } = useWeb3Store();
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [donationAmount, setDonationAmount] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCampaigns = async () => {
      if (!contract || !account) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const campaigns = await contract.getAllCampaigns();
        const formattedCampaigns = campaigns.map(campaign => ({
          id: campaign.id.toString(),
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

  const handleDonate = async (campaignId) => {
    if (!donationAmount[campaignId] || parseFloat(donationAmount[campaignId]) <= 0) {
      toast.error('Please enter a valid donation amount');
      return;
    }

    try {
      const amount = ethers.parseEther(donationAmount[campaignId]);
      const tx = await contract.donateToCampaign(campaignId, { value: amount });
      await tx.wait();
      toast.success('Donation successful!');
      // Clear the donation amount for this campaign
      setDonationAmount(prev => ({ ...prev, [campaignId]: '' }));
    } catch (error) {
      console.error('Error making donation:', error);
      toast.error('Failed to make donation');
    }
  };

  const handleAmountChange = (campaignId, value) => {
    setDonationAmount(prev => ({ ...prev, [campaignId]: value }));
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
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
            No campaigns are available at the moment.
          </Typography>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {campaigns.map((campaign) => (
            <Grid item xs={12} sm={6} md={4} key={campaign.id}>
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
                    {/* Campaign Name */}
                    <Typography variant="h6" gutterBottom>
                      {campaign.name}
                    </Typography>

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
                          color={campaign.exists ? "success" : "error"} 
                          fontSize="small" 
                        />
                        <Typography variant="subtitle2" color="text.secondary">
                          Status:
                        </Typography>
                        <Chip 
                          label={campaign.exists ? "Active" : "Inactive"}
                          color={campaign.exists ? "success" : "error"}
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
                    onClick={() => navigate(`/campaign/${campaign.id}`)}
                  >
                    View Details & Donate
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
};

export default DonorCampaigns; 