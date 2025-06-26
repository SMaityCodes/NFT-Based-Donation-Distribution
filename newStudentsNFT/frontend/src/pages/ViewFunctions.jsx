import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Card, CardContent, Divider, CircularProgress, Alert, Stack, Chip, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper
} from '@mui/material';
import useWeb3Store from '../store/web3Store';

const isBigNumber = (v) => v && typeof v === 'object' && v._isBigNumber;
const toDisplay = (v) => (typeof v === 'bigint' || isBigNumber(v)) ? v.toString() : v;

function renderTable(data) {
  if (!Array.isArray(data) || data.length === 0) return <Typography>No data found.</Typography>;
  // If array of primitives
  if (typeof data[0] !== 'object') {
    return (
      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow><TableCell>Value</TableCell></TableRow>
          </TableHead>
          <TableBody>
            {data.map((item, idx) => (
              <TableRow key={idx}><TableCell>{toDisplay(item)}</TableCell></TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  }
  // Array of objects
  const columns = Object.keys(data[0]);
  return (
    <TableContainer component={Paper}>
      <Table size="small">
        <TableHead>
          <TableRow>
            {columns.map(col => <TableCell key={col}>{col}</TableCell>)}
          </TableRow>
        </TableHead>
        <TableBody>
          {data.map((row, idx) => (
            <TableRow key={idx}>
              {columns.map(col => <TableCell key={col}>{toDisplay(row[col])}</TableCell>)}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

function renderObject(obj) {
  if (!obj || typeof obj !== 'object') return <Typography>{toDisplay(obj)}</Typography>;
  return (
    <Box>
      {Object.entries(obj).map(([k, v]) => (
        <Box key={k} sx={{ mb: 1 }}>
          <Chip label={k} size="small" sx={{ mr: 1 }} />
          <span>{toDisplay(v)}</span>
        </Box>
      ))}
    </Box>
  );
}

const ViewFunctions = () => {
  const { contract } = useWeb3Store();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [results, setResults] = useState({});

  // List of public view functions to expose
  const functions = [
    {
      name: 'getAllCampaigns',
      label: 'Get All Campaigns',
      args: [],
      mapResult: (data) => {
        const typeMap = { 0: 'Government', 1: 'Private' };
        return Array.isArray(data) && data.length > 0 && Array.isArray(data[0])
          ? data.map(c => {
              // Log for debugging
              console.log('Campaign structure:', c);

              // Safe access for donations and types
              let donations = c.length > 3 ? (typeof c[3] === 'bigint' || (c[3] && c[3]._isBigNumber)) ? c[3].toString() : c[3] : '-';
              let schoolTypes = '';
              if (c.length > 5) {
                if (Array.isArray(c[5])) {
                  schoolTypes = c[5].map(t => typeMap[t] || t).join(', ');
                } else if (typeof c[5] !== 'undefined') {
                  schoolTypes = typeMap[c[5]] || c[5];
                }
              } else {
                schoolTypes = '-';
              }
              return {
                id: c[0] ?? '-',
                name: c[1] ?? '-',
                types: schoolTypes,
                donations,
              };
            })
          : data;
      }
    },
    {
      name: 'campaignCount',
      label: 'Campaign Count',
      args: []
    },
    {
      name: 'getStudentsByCampaign',
      label: 'Get Students By Campaign (campaignId=0)',
      args: [0],
      note: 'If this returns empty, try a valid campaignId.'
    },
    {
      name: 'getNFTDetails',
      label: 'Get NFT Details (nftId=0)',
      args: [0],
      note: 'If this errors, try a valid nftId.'
    },
    // The following are commented out because they are not found in the contract
    // {
    //   name: 'getVendorTransactions',
    //   label: 'Get Vendor Transactions (vendorAddress=0x000...000)',
    //   args: ['0x0000000000000000000000000000000000000000']
    // },
    // {
    //   name: 'getDonationsByDonor',
    //   label: 'Get Donations By Donor (donorAddress=0x000...000)',
    //   args: ['0x0000000000000000000000000000000000000000']
    // },
  ];

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      setError('');
      const newResults = {};
      try {
        for (const fn of functions) {
          if (!contract[fn.name]) {
            newResults[fn.name] = { error: 'Function not found in contract' };
            continue;
          }
          try {
            let result = await contract[fn.name](...(fn.args || []));
            if (fn.mapResult) result = fn.mapResult(result);
            newResults[fn.name] = { data: result };
          } catch (err) {
            newResults[fn.name] = { error: err.message };
          }
        }
        setResults(newResults);
      } catch (err) {
        setError('Failed to load view functions: ' + err.message);
      } finally {
        setLoading(false);
      }
    };
    if (contract) fetchAll();
  }, [contract]);

  return (
    <Box sx={{ p: 3, maxWidth: '900px', margin: '0 auto' }}>
      <Typography variant="h4" fontWeight="bold" gutterBottom>Smart Contract View Functions</Typography>
      <Divider sx={{ mb: 3 }} />
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px"><CircularProgress /></Box>
      ) : (
        <Stack spacing={3}>
          {functions.map(fn => (
            <Card key={fn.name} elevation={2}>
              <CardContent>
                <Typography variant="h6" gutterBottom>{fn.label}</Typography>
                {fn.note && (
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>{fn.note}</Typography>
                )}
                {results[fn.name]?.error ? (
                  <Alert severity="error">{results[fn.name].error}</Alert>
                ) : (
                  <Box sx={{ mt: 2 }}>
                    {Array.isArray(results[fn.name]?.data)
                      ? renderTable(results[fn.name].data)
                      : typeof results[fn.name]?.data === 'object'
                        ? renderObject(results[fn.name].data)
                        : <Chip label={toDisplay(results[fn.name]?.data)} color="primary" />
                    }
                  </Box>
                )}
              </CardContent>
            </Card>
          ))}
        </Stack>
      )}
    </Box>
  );
};

export default ViewFunctions; 