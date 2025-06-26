import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useWeb3Store } from '../store/web3Store';
import { Typography, Chip } from '@mui/material';
import { ethers } from 'ethers';
// ... rest of the imports ...

// ... rest of the code ... 

<Typography component="span" variant="body1" sx={{ mb: 2, display: 'inline-flex', alignItems: 'center', gap: 1 }}>
  <strong>Total Donations: </strong>
  <Chip 
    label={`${ethers.utils.formatEther(campaign.totalDonations)} ETH`} 
    color="success" 
    size="small"
  />
</Typography> 