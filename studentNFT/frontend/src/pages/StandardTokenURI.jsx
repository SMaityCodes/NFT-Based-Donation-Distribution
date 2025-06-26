import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import useWeb3Store from '../store/web3Store';
import { Box, Typography, CircularProgress, Paper } from '@mui/material';

const STANDARD_LABELS = [
  'PRIMARY_1', 'PRIMARY_2', 'PRIMARY_3', 'PRIMARY_4', 'PRIMARY_5',
  'MIDDLE_6', 'MIDDLE_7', 'MIDDLE_8',
  'HIGH_9', 'HIGH_10',
  'INTER_11', 'INTER_12',
  'BTECH_1', 'BTECH_2', 'BTECH_3', 'BTECH_4'
];

const STANDARD_MATTER = {
  PRIMARY_1: 'Welcome to Primary 1! This NFT supports the youngest learners.',
  PRIMARY_2: 'Primary 2: Building strong foundations.',
  PRIMARY_3: 'Primary 3: Advancing knowledge.',
  PRIMARY_4: 'Primary 4: Preparing for the next step.',
  PRIMARY_5: 'Primary 5: Ready for middle school.',
  MIDDLE_6: 'Middle 6: Entering a new phase of learning.',
  MIDDLE_7: 'Middle 7: Growing skills and confidence.',
  MIDDLE_8: 'Middle 8: Ready for high school.',
  HIGH_9: 'High 9: High school journey begins.',
  HIGH_10: 'High 10: Preparing for board exams.',
  INTER_11: 'Inter 1st Year: Stepping into intermediate.',
  INTER_12: 'Inter 2nd Year: Graduation year!',
  BTECH_1: 'BTech 1st Year: Welcome to engineering.',
  BTECH_2: 'BTech 2nd Year: Building technical skills.',
  BTECH_3: 'BTech 3rd Year: Advanced engineering studies.',
  BTECH_4: 'BTech 4th Year: Final year, ready for the world.'
};

const StandardTokenURI = () => {
  const { standard } = useParams();
  const { contract } = useWeb3Store();
  const [tokenURI, setTokenURI] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError('');
      try {
        if (!contract) throw new Error('Contract not loaded');
        // Find the enum index for the standard
        const standardIndex = STANDARD_LABELS.indexOf(standard);
        if (standardIndex === -1) throw new Error('Invalid standard');
        // Get a sample tokenURI for this standard (template)
        const uriTemplate = await contract.standardTokenURITemplates(standardIndex);
        setTokenURI(uriTemplate);
        // Get the amount for this standard
        const amt = await contract.standardAmount(standardIndex);
        setAmount(amt.toString());
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [contract, standard]);

  return (
    <Box sx={{ p: 4, maxWidth: 600, margin: '0 auto' }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Token URI for {standard.replace('_', ' ')}
        </Typography>
        {loading ? (
          <CircularProgress />
        ) : error ? (
          <Typography color="error">{error}</Typography>
        ) : (
          <>
            <Typography variant="body1" sx={{ mb: 2 }}>
              <strong>Token URI Template:</strong> {tokenURI}
            </Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>
              <strong>Amount for this Standard:</strong> {amount}
            </Typography>
            <Typography variant="body2" sx={{ mb: 2 }}>
              <strong>About this Standard:</strong> {STANDARD_MATTER[standard] || 'No description.'}
            </Typography>
          </>
        )}
      </Paper>
    </Box>
  );
};

export default StandardTokenURI; 