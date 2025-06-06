import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  CircularProgress,
  Alert,
  Chip,
  Stack,
  Button,
  Divider
} from '@mui/material';
import {
  School as SchoolIcon,
  Grade as GradeIcon,
  Campaign as CampaignIcon,
  CheckCircle as CheckCircleIcon,
  Pending as PendingIcon,
  Error as ErrorIcon
} from '@mui/icons-material';
import useWeb3Store from '../../store/web3Store';
import { toast } from 'react-hot-toast';

const StudentProfile = () => {
  const { contract, account } = useWeb3Store();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [studentData, setStudentData] = useState(null);

  const fetchStudentData = async () => {
    if (!contract || !account) {
      setError('Please connect your wallet first');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`http://localhost:3001/api/students/${account}`);
      if (!response.ok) {
        throw new Error('Failed to fetch student data');
      }
      const data = await response.json();
      setStudentData(data);
    } catch (err) {
      console.error('Error fetching student data:', err);
      setError(err.message);
      toast.error('Failed to fetch student data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudentData();
  }, [contract, account]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 4, maxWidth: '600px', mx: 'auto' }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  if (!studentData) {
    return (
      <Box sx={{ p: 4, maxWidth: '600px', mx: 'auto' }}>
        <Alert severity="info">
          You haven't registered yet. Please complete the registration process.
        </Alert>
        <Button
          variant="contained"
          color="primary"
          sx={{ mt: 2 }}
          onClick={() => window.location.href = '/register-student'}
        >
          Register Now
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 4, maxWidth: '800px', mx: 'auto' }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom align="center">
          Student Profile
        </Typography>

        <Stack spacing={3}>
          <Box>
            <Typography variant="h6" gutterBottom>
              Registration Status
            </Typography>
            <Chip
              icon={studentData.approved ? <CheckCircleIcon /> : <PendingIcon />}
              label={studentData.approved ? 'Approved' : 'Pending Approval'}
              color={studentData.approved ? 'success' : 'warning'}
              sx={{ mb: 2 }}
            />
          </Box>

          <Divider />

          <Box>
            <Typography variant="h6" gutterBottom>
              Student Details
            </Typography>
            <Stack spacing={2}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <SchoolIcon color="primary" />
                <Typography>
                  School Type: {studentData.schoolType}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <GradeIcon color="primary" />
                <Typography>
                  Standard: {studentData.standard}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CampaignIcon color="primary" />
                <Typography>
                  Campaign ID: {studentData.campaignId}
                </Typography>
              </Box>
            </Stack>
          </Box>

          <Divider />

          {studentData.approved && (
            <Box>
              <Typography variant="h6" gutterBottom>
                NFT Details
              </Typography>
              <Stack spacing={2}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CheckCircleIcon color="success" />
                  <Typography>
                    NFT ID: {studentData.nftId}
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  Transaction Hash: {studentData.nftTransactionHash}
                </Typography>
              </Stack>
            </Box>
          )}

          <Box>
            <Typography variant="h6" gutterBottom>
              Admission Letter
            </Typography>
            <Button
              variant="outlined"
              href={studentData.admissionLetterUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              View Admission Letter
            </Button>
          </Box>
        </Stack>
      </Paper>
    </Box>
  );
};

export default StudentProfile; 