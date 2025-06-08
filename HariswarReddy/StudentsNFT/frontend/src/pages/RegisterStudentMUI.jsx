import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Button, Select, MenuItem,
  CircularProgress, Paper, Link, Chip, Stack, FormControl, InputLabel, FormHelperText
} from '@mui/material';
import useWeb3Store from '../store/web3Store';
import { STANDARDS } from '../utils/constants';
import { uploadFileToIPFS, getIPFSGatewayUrl } from '../utils/ipfs';
import { toast } from 'react-hot-toast';
import { ethers, id } from 'ethers';
import { useNavigate } from 'react-router-dom';
import { Upload } from '@mui/icons-material';
import axios from 'axios';

const BACKEND_URL = 'http://localhost:3001';

const RegisterStudentMUI = () => {
  const { contract, isConnected, signer, account, getReadOnlyContract } = useWeb3Store();
  const [campaigns, setCampaigns] = useState([]);
  const [selectedCampaignId, setSelectedCampaignId] = useState('');
  const [schoolType, setSchoolType] = useState('');
  const [standard, setStandard] = useState('');
  const [admissionLetterId, setAdmissionLetterId] = useState('');
  const [loadingCampaigns, setLoadingCampaigns] = useState(true);
  const [isRegistering, setIsRegistering] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [currentStudentStatus, setCurrentStudentStatus] = useState(null);
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();

  const fetchCampaigns = async () => {
    setLoadingCampaigns(true);
    try {
      const contractInstance = contract || getReadOnlyContract();
      if (!contractInstance) {
        toast.error("Contract not loaded. Please connect your wallet or ensure RPC URL is set.");
        setLoadingCampaigns(false);
        return;
      }

      console.log("Fetching campaigns from contract...");
      const fetchedCampaigns = await contractInstance.getAllCampaigns();
      console.log("Raw campaigns data:", fetchedCampaigns);

      // Ensure we have an array of campaigns
      if (!Array.isArray(fetchedCampaigns)) {
        console.error("Campaigns data is not an array:", fetchedCampaigns);
        toast.error("Failed to load campaigns: Invalid data format");
        setLoadingCampaigns(false);
        return;
      }

      // Filter and map campaigns to ensure all required fields
      const validCampaigns = fetchedCampaigns
        .filter(campaign => {
          const isValid = campaign && 
            campaign.id !== undefined && 
            campaign.name && 
            campaign.exists;
          
          if (!isValid) {
            console.warn("Invalid campaign data:", campaign);
          }
          return isValid;
        })
        .map(campaign => ({
          id: campaign.id.toString(),
          name: campaign.name,
          allowedSchoolTypes: campaign.allowedSchoolTypes || [],
          allowedStandards: campaign.allowedStandards || [],
          exists: campaign.exists
        }));

      console.log("Processed valid campaigns:", validCampaigns);
      
      if (validCampaigns.length === 0) {
        toast.warning("No active campaigns available at the moment.");
      }

      setCampaigns(validCampaigns);
    } catch (err) {
      console.error("Failed to fetch campaigns:", err);
      toast.error(`Failed to load campaigns: ${err.message}`);
    } finally {
      setLoadingCampaigns(false);
    }
  };

  const formatCampaignAmount = (amount) => {
    try {
      if (!amount) return '0 ETH';
      return `${ethers.formatEther(amount)} ETH`;
    } catch (error) {
      console.error('Error formatting campaign amount:', error);
      return '0 ETH';
    }
  };

  const checkStudentRegistration = async () => {
    if (account && contract) {
      try {
        const registeredStatus = await contract.isStudentRegistered(account);
        setCurrentStudentStatus(registeredStatus);
      } catch (err) {
        console.error("Error checking student registration:", err);
        setCurrentStudentStatus(false);
      }
    } else {
      setCurrentStudentStatus(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, [contract, getReadOnlyContract]);

  useEffect(() => {
    if (isConnected) {
      checkStudentRegistration();
    } else {
      setCurrentStudentStatus(false);
    }
  }, [isConnected, account, contract]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === 'campaignId') {
      setSelectedCampaignId(value);
    } else if (name === 'schoolType') {
      setSchoolType(value);
    } else if (name === 'standard') {
      setStandard(value);
    }
    // Clear error when field is edited
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      setErrors(prev => ({
        ...prev,
        admissionLetter: 'Please upload a PDF, JPG, JPEG, or PNG file'
      }));
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      setErrors(prev => ({
        ...prev,
        admissionLetter: 'File size should be less than 5MB'
      }));
      return;
    }

    setUploadingFile(true);
    setErrors(prev => ({ ...prev, admissionLetter: '' }));

    try {
      // Get the token from localStorage
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Please connect your wallet first');
      }

      const formData = new FormData();
      formData.append('admissionLetter', file);
      formData.append('studentId', account);
      formData.append('campaignId', selectedCampaignId);

      console.log('Uploading to:', `${BACKEND_URL}/api/admission-letters/upload`);
      console.log('FormData contents:', {
        studentId: account,
        campaignId: selectedCampaignId,
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size
      });
      
      const response = await fetch(`${BACKEND_URL}/api/admission-letters/upload`, {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Upload failed:', {
          status: response.status,
          statusText: response.statusText,
          errorData
        });
        if (response.status === 401) {
          throw new Error('Please connect your wallet first');
        }
        throw new Error(errorData.message || 'Failed to upload admission letter');
      }

      const data = await response.json();
      setAdmissionLetterId(data._id);
      toast.success('Admission letter uploaded successfully');
    } catch (err) {
      console.error('Error uploading admission letter:', err);
      setErrors(prev => ({
        ...prev,
        admissionLetter: err.message || 'Failed to upload admission letter. Please try again.'
      }));
      toast.error(err.message || 'Failed to upload admission letter');
    } finally {
      setUploadingFile(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!account) {
      setErrors(prev => ({
        ...prev,
        campaignId: 'Please connect your wallet first'
      }));
      return;
    }

    try {
      setIsRegistering(true);
      setErrors({});

      // Validate form data
      if (!selectedCampaignId || !schoolType || !standard) {
        setErrors(prev => ({
          ...prev,
          campaignId: 'Please select a campaign',
          schoolType: 'School type is required',
          standard: 'Standard is required'
        }));
        setIsRegistering(false);
        return;
      }

      // Validate admission letter
      if (!admissionLetterId) {
        setErrors(prev => ({
          ...prev,
          admissionLetter: 'Please upload an admission letter'
        }));
        setIsRegistering(false);
        return;
      }

      const contractInstance = contract || getReadOnlyContract();
      if (!contractInstance) {
        throw new Error("Contract not loaded. Please connect your wallet or ensure RPC URL is set.");
      }

      const tx = await contractInstance.registerForCampaign(
        selectedCampaignId,
        schoolType,
        standard,
        id(admissionLetterId)
      );

      toast.info('Transaction submitted. Waiting for confirmation...');
      const receipt = await tx.wait();
      
      if (receipt.status === 1) {
        toast.success('Student registered successfully!');
        // Reset form
        setSelectedCampaignId('');
        setSchoolType('');
        setStandard('');
        setAdmissionLetterId('');
        checkStudentRegistration();
        navigate('/student/profile');
      } else {
        throw new Error('Transaction failed');
      }
    } catch (err) {
      console.error('Registration error:', err);
      toast.error(err.message || 'Failed to register student');
    } finally {
      setIsRegistering(false);
    }
  };

  if (loadingCampaigns) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
        <CircularProgress size={50} />
      </Box>
    );
  }

  if (!isConnected) {
    return (
      <Box sx={{ p: 4, mt: 4, textAlign: 'center' }}>
        <Typography variant="h5" mb={3}>Please connect your wallet to register for a campaign.</Typography>
        <Button variant="contained" color="primary" onClick={useWeb3Store.getState().connectWallet}>
          Connect Wallet
        </Button>
      </Box>
    );
  }

  if (currentStudentStatus === null) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
        <CircularProgress size={50} />
        <Typography sx={{ ml: 2 }}>Checking student registration status...</Typography>
      </Box>
    );
  }

  if (currentStudentStatus === true) {
    return (
      <Box sx={{ p: 4, mt: 4, textAlign: 'center', color: 'success.main' }}>
        <Typography variant="h5" component="h2" gutterBottom>You are already registered for a campaign!</Typography>
        <Typography variant="body1" mt={2}>
          You can check your NFT status on the "My NFTs" page once it's minted.
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom textAlign="center">
        Register Student for Campaign
      </Typography>
      <Paper sx={{ p: 3, maxWidth: '600px', mx: 'auto' }}>
        <Stack component="form" onSubmit={handleSubmit} spacing={3}>
          <FormControl fullWidth error={!!errors.campaignId}>
            <InputLabel>Select Campaign</InputLabel>
            <Select
              name="campaignId"
              value={selectedCampaignId}
              onChange={handleInputChange}
              label="Select Campaign"
              required
            >
              {campaigns.length === 0 ? (
                <MenuItem disabled>
                  No campaigns available
                </MenuItem>
              ) : (
                campaigns.map((campaign) => (
                  <MenuItem key={campaign.id} value={campaign.id}>
                    {campaign.name}
                  </MenuItem>
                ))
              )}
            </Select>
            {errors.campaignId && <FormHelperText>{errors.campaignId}</FormHelperText>}
            {campaigns.length === 0 && (
              <FormHelperText>
                There are no active campaigns at the moment. Please check back later.
              </FormHelperText>
            )}
          </FormControl>

          <FormControl fullWidth error={!!errors.schoolType}>
            <InputLabel>School Type</InputLabel>
            <Select
              name="schoolType"
              value={schoolType}
              onChange={handleInputChange}
              label="School Type"
              required
            >
              <MenuItem value="Government">Government</MenuItem>
              <MenuItem value="Private">Private</MenuItem>
              <MenuItem value="International">International</MenuItem>
            </Select>
            {errors.schoolType && <FormHelperText>{errors.schoolType}</FormHelperText>}
          </FormControl>

          <FormControl fullWidth error={!!errors.standard}>
            <InputLabel>Standard</InputLabel>
            <Select
              name="standard"
              value={standard}
              onChange={handleInputChange}
              label="Standard"
              required
            >
              {Object.entries(STANDARDS).map(([value, label]) => (
                <MenuItem key={value} value={value}>
                  {label}
                </MenuItem>
              ))}
            </Select>
            {errors.standard && <FormHelperText>{errors.standard}</FormHelperText>}
          </FormControl>

          <Box>
            <Typography variant="subtitle1" gutterBottom>
              Upload Admission Letter
            </Typography>
            <input
              accept=".pdf,.jpg,.jpeg,.png"
              style={{ display: 'none' }}
              id="admission-letter-upload"
              type="file"
              onChange={handleFileChange}
            />
            <label htmlFor="admission-letter-upload">
              <Button
                variant="outlined"
                component="span"
                startIcon={<Upload />}
                disabled={uploadingFile}
              >
                {uploadingFile ? 'Uploading...' : 'Upload Admission Letter'}
              </Button>
            </label>
            {errors.admissionLetter && (
              <Typography color="error" variant="caption" display="block">
                {errors.admissionLetter}
              </Typography>
            )}
            {admissionLetterId && (
              <Box mt={1}>
                <Chip
                  label="File uploaded successfully"
                  color="success"
                  size="small"
                />
                <Link
                  href={`${BACKEND_URL}/api/admission-letters/${account}/download`}
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{ ml: 1 }}
                >
                  View File
                </Link>
              </Box>
            )}
          </Box>

          <Button
            type="submit"
            variant="contained"
            color="primary"
            size="large"
            disabled={isRegistering || uploadingFile}
            startIcon={isRegistering ? <CircularProgress size={20} /> : null}
          >
            {isRegistering ? 'Registering...' : 'Register Student'}
          </Button>
        </Stack>
      </Paper>
    </Box>
  );
};

export default RegisterStudentMUI;