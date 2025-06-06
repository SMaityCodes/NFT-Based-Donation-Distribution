import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Button, TextField, Select, MenuItem,
  CircularProgress, Paper, Link, Chip, Alert, Stack, FormControl, InputLabel
} from '@mui/material';
import useWeb3Store from '../store/web3Store';
import { STANDARDS } from '../utils/constants';
import { uploadFileToIPFS, getIPFSGatewayUrl } from '../utils/ipfs';
import { toast } from 'react-hot-toast';
import { ethers } from 'ethers'; // Added ethers import for ZeroAddress check
import { useNavigate } from 'react-router-dom';

const RegisterStudentMUI = () => {
  const { contract, isConnected, signer, account, getReadOnlyContract } = useWeb3Store();
  const [campaigns, setCampaigns] = useState([]);
  const [selectedCampaignId, setSelectedCampaignId] = useState('');
  const [schoolType, setSchoolType] = useState('');
  const [standard, setStandard] = useState('');
  const [admissionLetterFile, setAdmissionLetterFile] = useState(null);
  const [admissionLetterHash, setAdmissionLetterHash] = useState(''); // Stores bytes32 hash
  const [ipfsCid, setIpfsCid] = useState(''); // Stores IPFS CID for viewing
  const [loadingCampaigns, setLoadingCampaigns] = useState(true);
  const [isRegistering, setIsRegistering] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [currentStudentStatus, setCurrentStudentStatus] = useState(null); // To check if student is already registered
  const [errors, setErrors] = useState({}); // Simple error state for form fields
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
        const studentInfo = await contract.students(account); // Assuming students mapping is by address
        // The contract's `students` mapping is by `uint studentCount`, not address.
        // To check if `msg.sender` (current account) is registered, you need `isStudentRegistered` mapping.
        const registeredStatus = await contract.isStudentRegistered(account);
        setCurrentStudentStatus(registeredStatus);
      } catch (err) {
        console.error("Error checking student registration:", err);
        setCurrentStudentStatus(false); // Assume not registered on error
      }
    } else {
        setCurrentStudentStatus(false); // Not connected, so not registered via current wallet
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, [contract, getReadOnlyContract]);

  useEffect(() => {
    // Only check student status if connected
    if (isConnected) {
        checkStudentRegistration();
    } else {
        setCurrentStudentStatus(false); // Reset status if disconnected
    }
  }, [isConnected, account, contract]); // Re-run if connection status or account changes

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
      setUploadingFile(true);
      setErrors((prev) => ({ ...prev, admissionLetter: undefined }));
      try {
        const { cid, sha256Hash } = await uploadFileToIPFS(file);
        setIpfsCid(cid);
        setAdmissionLetterHash(sha256Hash);
        toast.success("Admission letter uploaded to IPFS!");
      } catch (err) {
        console.error("Error uploading file:", err);
        toast.error("Failed to upload admission letter to IPFS.");
        setAdmissionLetterFile(null);
        setAdmissionLetterHash('');
        setIpfsCid('');
        setErrors((prev) => ({ ...prev, admissionLetter: "Failed to upload file." }));
      } finally {
        setUploadingFile(false);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!isConnected || !signer || !contract) {
      toast.error("Please connect your wallet.");
      return;
    }
    if (!selectedCampaignId) {
      newErrors.campaignId = "Please select a campaign.";
    }
    if (!schoolType) {
      newErrors.schoolType = "School type is required.";
    }
    if (standard === '') { // Standard is 0-indexed enum
      newErrors.standard = "Standard is required.";
    }
    if (!admissionLetterHash) {
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
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setIsRegistering(true);
    try {
      const tx = await contract.registerForCampaign(
        parseInt(selectedCampaignId),
        schoolType,
        parseInt(standard),
        admissionLetterHash
      );
      toast.loading("Transaction pending...", { id: 'registerTx' });
      await tx.wait();
      toast.success("Student registered successfully!", { id: 'registerTx' });
      // Reset form
      setSelectedCampaignId('');
      setSchoolType('');
      setStandard('');
      setAdmissionLetterFile(null);
      setAdmissionLetterHash('');
      setIpfsCid('');
      checkStudentRegistration(); // Re-check status after successful registration
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

  // After connection, if currentStudentStatus is still null, it means check is pending
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
          <FormControl fullWidth>
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
          </FormControl>

          <FormControl fullWidth>
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
          </FormControl>

          <TextField
            name="campaignId"
            label="Campaign ID"
            type="number"
            value={selectedCampaignId}
            onChange={(e) => setSelectedCampaignId(e.target.value)}
            error={!!errors.campaignId}
            helperText={errors.campaignId}
            required
            fullWidth
          />

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
                sx={{ mb: 1 }}
              >
                Upload Admission Letter
              </Button>
            </label>
            {uploadingFile && (
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                <CircularProgress size={20} sx={{ mr: 1 }} />
                <Typography variant="body2" color="primary">Uploading file to IPFS...</Typography>
              </Box>
            )}
            {ipfsCid && (
              <Typography variant="body2" sx={{ mt: 1 }}>
                File uploaded! View on IPFS:{' '}
                <Link href={getIPFSGatewayUrl(ipfsCid)} target="_blank" rel="noopener" color="primary">
                  {ipfsCid.substring(0, 10)}...{ipfsCid.substring(ipfsCid.length - 10)}
                </Link>
              </Typography>
            )}
          </Box>

          <Button
            variant="contained"
            color="primary"
            type="submit"
            disabled={isRegistering || uploadingFile || !admissionLetterHash}
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

// Helper for VStack like Chakra UI
const VStack = ({ children, spacing, ...props }) => (
  <Box display="flex" flexDirection="column" gap={spacing * 8} {...props}>
    {children}
  </Box>
);

export default RegisterStudentMUI;