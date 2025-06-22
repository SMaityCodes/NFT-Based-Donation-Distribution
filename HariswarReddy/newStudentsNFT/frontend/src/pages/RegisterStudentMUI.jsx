import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Button, TextField, Select, MenuItem,
  CircularProgress, Paper, Link, Chip, Alert, Stack, FormControl, InputLabel
} from '@mui/material';
import useWeb3Store from '../store/web3Store';
import { STANDARDS } from '../utils/constants';
import { toast } from 'react-hot-toast';
import { ethers } from 'ethers';
import { useNavigate } from 'react-router-dom';

const RegisterStudentMUI = () => {
  const { contract, isConnected, signer, account, getReadOnlyContract } = useWeb3Store();
  const [campaigns, setCampaigns] = useState([]);
  const [selectedCampaignId, setSelectedCampaignId] = useState('');
  const [schoolType, setSchoolType] = useState('');
  const [standard, setStandard] = useState('');
  const [admissionLetterFile, setAdmissionLetterFile] = useState(null);
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
      const fetchedCampaigns = await contractInstance.getAllCampaigns();
      setCampaigns(fetchedCampaigns);
    } catch (err) {
      console.error("Failed to fetch campaigns:", err);
      toast.error("Failed to load campaigns.");
    } finally {
      setLoadingCampaigns(false);
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
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        setErrors((prev) => ({ ...prev, admissionLetter: 'File size should be less than 5MB' }));
        return;
      }
      // Check file type
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
      if (!allowedTypes.includes(file.type)) {
        setErrors((prev) => ({ ...prev, admissionLetter: 'Only PDF, JPG, JPEG, and PNG files are allowed' }));
        return;
      }
      setAdmissionLetterFile(file);
      setErrors((prev) => ({ ...prev, admissionLetter: undefined }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('Register button clicked');
    const newErrors = {};

    if (!isConnected || !signer || !contract) {
      console.log('Wallet not connected or contract not loaded');
      toast.error("Please connect your wallet.");
      return;
    }
    if (!selectedCampaignId) {
      newErrors.campaignId = "Please select a campaign.";
    }
    if (!schoolType) {
      newErrors.schoolType = "School type is required.";
    }
    if (standard === '') {
      newErrors.standard = "Standard is required.";
    }
    if (!admissionLetterFile) {
      newErrors.admissionLetter = "Admission letter upload is required.";
    }

    const campaign = campaigns.find(c => c.id.toString() === selectedCampaignId);
    if (campaign) {
      const isSchoolTypeAllowed = campaign.allowedSchoolTypes.some(type => type.toLowerCase() === schoolType.toLowerCase());
      if (!isSchoolTypeAllowed) {
        newErrors.schoolType = `School type '${schoolType}' is not allowed for this campaign.`;
      }

      const isStandardAllowed = campaign.allowedStandards.some(s => s.toString() === standard);
      if (!isStandardAllowed) {
        newErrors.standard = `Standard '${STANDARDS[standard]}' is not allowed for this campaign.`;
      }
    } else if (selectedCampaignId) {
      newErrors.campaignId = "Selected campaign not found.";
    }

    if (Object.keys(newErrors).length > 0) {
      console.log('Form validation errors:', newErrors);
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setIsRegistering(true);
    try {
      // First, upload the admission letter to the backend
      console.log('Uploading admission letter to backend...');
      const formData = new FormData();
      formData.append('admissionLetter', admissionLetterFile);
      formData.append('studentId', account);
      formData.append('campaignId', selectedCampaignId);

      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001'}/api/admission-letters/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.log('Backend upload failed:', errorData);
        throw new Error(errorData.message || 'Failed to upload admission letter');
      }

      const { data: admissionLetter } = await response.json();
      console.log('Admission letter uploaded. File URL:', admissionLetter.fileUrl);
      console.log('Admission letter hash:', admissionLetter.hash);

      // Register on the blockchain FIRST
      console.log('Registering on blockchain...');
      const tx = await contract.registerForCampaign(
        parseInt(selectedCampaignId),
        schoolType,
        parseInt(standard),
        admissionLetter.hash // Use the hash from the backend response
      );
      toast.loading("Transaction pending...", { id: 'registerTx' });
      await tx.wait();
      toast.success("Student registered on blockchain!", { id: 'registerTx' });
      console.log('Registration transaction confirmed.');

      // Only if blockchain registration succeeds, register in backend
      console.log('Registering student in backend database...');
      const studentFormData = new FormData();
      studentFormData.append('admissionLetter', admissionLetterFile);
      studentFormData.append('address', account);
      studentFormData.append('schoolType', schoolType);
      studentFormData.append('standard', standard);
      studentFormData.append('campaignId', selectedCampaignId);

      const studentResponse = await fetch(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001'}/api/student`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: studentFormData
      });

      if (!studentResponse.ok) {
        const errorData = await studentResponse.json();
        console.log('Student registration failed:', errorData);
        throw new Error(errorData.error || errorData.message || 'Failed to register student in backend');
      }

      const { data: student } = await studentResponse.json();
      console.log('Student registered in backend:', student);
      
      // Reset form
      setSelectedCampaignId('');
      setSchoolType('');
      setStandard('');
      setAdmissionLetterFile(null);
      checkStudentRegistration();
      navigate('/student/profile');
    } catch (err) {
      console.error("Registration failed:", err);
      toast.error(`Registration failed: ${err.reason || err.message}`, { id: 'registerTx' });
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
      {/* Debug Panel */}
      <Paper sx={{ p: 2, mb: 2, background: '#f5f5f5', color: '#333' }}>
        <Typography variant="subtitle2">[Debug] Connection State</Typography>
        <Typography variant="body2">isConnected: {JSON.stringify(isConnected)}</Typography>
        <Typography variant="body2">account: {account || 'N/A'}</Typography>
        <Typography variant="body2">signer: {signer ? 'Loaded' : 'Not loaded'}</Typography>
        <Typography variant="body2">contract: {contract ? 'Loaded' : 'Not loaded'}</Typography>
      </Paper>
      <Typography variant="h4" component="h1" gutterBottom textAlign="center">
        Register Student for Campaign
      </Typography>
      <Paper sx={{ p: 3, maxWidth: '600px', mx: 'auto' }}>
        <Stack component="form" onSubmit={handleSubmit} spacing={3}>
          <FormControl fullWidth>
            <InputLabel>Campaign</InputLabel>
            <Select
              name="campaignId"
              value={selectedCampaignId}
              onChange={handleInputChange}
              label="Campaign"
              required
              error={!!errors.campaignId}
            >
              <MenuItem value="" disabled>
                Select a campaign
              </MenuItem>
              {campaigns.map((campaign) => (
                <MenuItem key={campaign.id.toString()} value={campaign.id.toString()}>
                  {campaign.name} (ID: {campaign.id.toString()})
                </MenuItem>
              ))}
            </Select>
            {errors.campaignId && (
              <Typography color="error" variant="caption">
                {errors.campaignId}
              </Typography>
            )}
          </FormControl>

          <FormControl fullWidth>
            <InputLabel>School Type</InputLabel>
            <Select
              name="schoolType"
              value={schoolType}
              onChange={handleInputChange}
              label="School Type"
              required
              error={!!errors.schoolType}
            >
              <MenuItem value="Government">Government</MenuItem>
              <MenuItem value="Private">Private</MenuItem>
              <MenuItem value="International">International</MenuItem>
            </Select>
            {errors.schoolType && (
              <Typography color="error" variant="caption">
                {errors.schoolType}
              </Typography>
            )}
          </FormControl>

          <FormControl fullWidth>
            <InputLabel>Standard</InputLabel>
            <Select
              name="standard"
              value={standard}
              onChange={handleInputChange}
              label="Standard"
              required
              error={!!errors.standard}
            >
              {Object.entries(STANDARDS).map(([value, label]) => (
                <MenuItem key={value} value={value}>
                  {label}
                </MenuItem>
              ))}
            </Select>
            {errors.standard && (
              <Typography color="error" variant="caption">
                {errors.standard}
              </Typography>
            )}
          </FormControl>

          <Box>
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
                fullWidth
                sx={{ 
                  mb: 1,
                  borderColor: errors.admissionLetter ? 'error.main' : undefined,
                  color: errors.admissionLetter ? 'error.main' : undefined,
                  '&:hover': {
                    borderColor: errors.admissionLetter ? 'error.main' : undefined,
                  }
                }}
              >
                Upload Admission Letter
              </Button>
            </label>
            {admissionLetterFile && (
              <Typography variant="body2" sx={{ mt: 1 }}>
                Selected file: {admissionLetterFile.name}
              </Typography>
            )}
            {errors.admissionLetter && (
              <Typography color="error" variant="caption">
                {errors.admissionLetter}
              </Typography>
            )}
          </Box>

          <Button
            variant="contained"
            color="primary"
            type="submit"
            disabled={isRegistering || !admissionLetterFile}
            startIcon={isRegistering && <CircularProgress size={20} color="inherit" />}
            fullWidth
          >
            Register
          </Button>
        </Stack>
      </Paper>
    </Box>
  );
};

export default RegisterStudentMUI;