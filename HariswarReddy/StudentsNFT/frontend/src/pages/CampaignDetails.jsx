import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Container,
  Typography,
  Paper,
  Grid,
  Box,
  CircularProgress,
  Button,
  List,
  ListItem,
  ListItemText,
  Divider,
} from '@mui/material';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

const CampaignDetails = () => {
  const { id } = useParams();
  const [campaign, setCampaign] = useState(null);
  const [students, setStudents] = useState([]);
  const [donors, setDonors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { userRole } = useAuth();

  useEffect(() => {
    const fetchCampaignDetails = async () => {
      try {
        setLoading(true);
        const [campaignRes, studentsRes, donorsRes] = await Promise.all([
          axios.get(`/api/campaigns/${id}`),
          axios.get(`/api/campaigns/${id}/students`),
          axios.get(`/api/campaigns/${id}/donors`)
        ]);

        setCampaign(campaignRes.data);
        setStudents(studentsRes.data);
        setDonors(donorsRes.data);
        setError(null);
      } catch (err) {
        setError('Failed to fetch campaign details');
        console.error('Error fetching campaign details:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCampaignDetails();
  }, [id]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error || !campaign) {
    return (
      <Container>
        <Typography color="error" variant="h6">
          {error || 'Campaign not found'}
        </Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom>
          {campaign.title}
        </Typography>
        
        <Grid container spacing={4}>
          <Grid item xs={12} md={8}>
            <Typography variant="body1" paragraph>
              {campaign.description}
            </Typography>
            
            <Box sx={{ my: 3 }}>
              <Typography variant="h6" gutterBottom>
                Campaign Details
              </Typography>
              <List>
                <ListItem>
                  <ListItemText 
                    primary="Target Amount" 
                    secondary={`${campaign.targetAmount} ETH`} 
                  />
                </ListItem>
                <Divider />
                <ListItem>
                  <ListItemText 
                    primary="Raised Amount" 
                    secondary={`${campaign.raisedAmount} ETH`} 
                  />
                </ListItem>
                <Divider />
                <ListItem>
                  <ListItemText 
                    primary="Status" 
                    secondary={campaign.status} 
                  />
                </ListItem>
              </List>
            </Box>
          </Grid>

          <Grid item xs={12} md={4}>
            <Paper elevation={2} sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Donors ({donors.length})
              </Typography>
              <List>
                {donors.map((donor, index) => (
                  <ListItem key={index}>
                    <ListItemText
                      primary={`${donor.donorAddress.substring(0, 6)}...${donor.donorAddress.substring(donor.donorAddress.length - 4)}`}
                      secondary={`${donor.amount} ETH`}
                    />
                  </ListItem>
                ))}
              </List>
            </Paper>
          </Grid>

          {userRole === 'admin' && (
            <Grid item xs={12}>
              <Paper elevation={2} sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Registered Students ({students.length})
                </Typography>
                <List>
                  {students.map((student, index) => (
                    <ListItem key={index}>
                      <ListItemText
                        primary={student.studentAddress}
                        secondary={`Standard: ${student.standard}`}
                      />
                    </ListItem>
                  ))}
                </List>
              </Paper>
            </Grid>
          )}
        </Grid>

        {userRole === 'donor' && (
          <Box sx={{ mt: 4, textAlign: 'center' }}>
            <Button
              variant="contained"
              color="primary"
              size="large"
              component={RouterLink}
              to={`/donate/${id}`}
            >
              Donate Now
            </Button>
          </Box>
        )}

        {userRole === 'student' && !students.some(s => s.studentAddress === account) && (
          <Box sx={{ mt: 4, textAlign: 'center' }}>
            <Button
              variant="contained"
              color="primary"
              size="large"
              component={RouterLink}
              to={`/register/${id}`}
            >
              Register for this Campaign
            </Button>
          </Box>
        )}
      </Paper>
    </Container>
  );
};

export default CampaignDetails; 