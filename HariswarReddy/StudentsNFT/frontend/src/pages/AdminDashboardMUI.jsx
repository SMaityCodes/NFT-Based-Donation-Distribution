import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Button, TextField, Select, MenuItem, Grid, Paper,
  CircularProgress, Tabs, Tab, Divider, List, ListItem, ListItemText, Chip, Link,
  Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import useWeb3Store from '../store/web3Store';
import { STANDARDS } from '../utils/constants';
import { toast } from 'react-hot-toast';
import { ethers } from 'ethers';
import CampaignDetailsMUI from '../components/CampaignDetailsMUI'; // Re-use the separate component
import { getIPFSGatewayUrl } from '../utils/ipfs';
import { useAuth } from '../context/AuthContext';

const AdminDashboardMUI = () => {
  const { contract, account, isConnected, isOwner, signer } = useWeb3Store();
  const { token } = useAuth();
  const [tabIndex, setTabIndex] = useState(0);

  // Campaign Creation States
  const [campaignName, setCampaignName] = useState('');
  const [allowedSchoolTypes, setAllowedSchoolTypes] = useState('');
  const [selectedStandards, setSelectedStandards] = useState([]);
  const [creatingCampaign, setCreatingCampaign] = useState(false);
  const [campaignFormErrors, setCampaignFormErrors] = useState({});

  // Vendor Registration States
  const [vendorAddress, setVendorAddress] = useState('');
  const [registeringVendor, setRegisteringVendor] = useState(false);
  const [vendorFormErrors, setVendorFormErrors] = useState({});

  // Data Display States
  const [loadingData, setLoadingData] = useState(true);
  const [campaigns, setCampaigns] = useState([]);
  const [registeredStudents, setRegisteredStudents] = useState([]);
  const [approvedStudents, setApprovedStudents] = useState([]);
  const [selectedCampaignForStudents, setSelectedCampaignForStudents] = useState('');
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [loadingApprovedStudents, setLoadingApprovedStudents] = useState(false);
  const [allDonorsWithAmounts, setAllDonorsWithAmounts] = useState([]);
  const [donationAmount, setDonationAmount] = useState('');
  const [selectedCampaignForDonation, setSelectedCampaignForDonation] = useState(null);
  const [openDonationDialog, setOpenDonationDialog] = useState(false);
  const [donating, setDonating] = useState(false);
  const [approvingStudent, setApprovingStudent] = useState(false);

  const fetchData = async () => {
    if (!contract || !isOwner) {
      setLoadingData(false);
      return;
    }
    setLoadingData(true);
    try {
      const fetchedCampaigns = await contract.getAllCampaigns();
      // Format the campaigns data
      const formattedCampaigns = fetchedCampaigns.map(campaign => ({
        id: campaign.id.toString(),
        name: campaign.name,
        exists: campaign.exists,
        allowedSchoolTypes: campaign.allowedSchoolTypes,
        allowedStandards: campaign.allowedStandards
      }));
      setCampaigns(formattedCampaigns);

      const [donorAddresses, totalDonatedAmounts, donatedPerCampaign] = await contract.getAllDonorsWithCampaignAmounts();
      const formattedDonors = donorAddresses.map((addr, index) => ({
        address: addr,
        totalDonated: ethers.formatEther(totalDonatedAmounts[index]),
        donatedPerCampaign: donatedPerCampaign[index].map(amount => ethers.formatEther(amount))
      }));
      setAllDonorsWithAmounts(formattedDonors);

    } catch (err) {
      console.error("Error fetching admin data:", err);
      toast.error(`Error fetching admin data: ${err.reason || err.message}`);
      setCampaigns([]); // Set empty array on error
    } finally {
      setLoadingData(false);
    }
  };

  const fetchStudentsForCampaign = async (campaignId) => {
    if (!contract || !campaignId) {
      setRegisteredStudents([]);
      return;
    }

    setLoadingStudents(true);
    try {
      console.log('Fetching students for campaign:', campaignId);
      const campaignIdNum = parseInt(campaignId);
      
      // Get all students for the campaign
      const students = await contract.getStudentsByCampaign(campaignIdNum);
      console.log('Raw students data:', students);

      // Get the auth token
      const token = localStorage.getItem('token');
      if (!token) {
        console.warn('No authentication token found');
      }

      // Process each student
      const processedStudents = await Promise.all(students.map(async (student, index) => {
        try {
          // Get the student's global ID
          const studentId = await contract.studentIdsByCampaign(campaignIdNum, index);
          console.log(`Processing student ${index}:`, {
            address: student[0],
            studentId: studentId.toString()
          });

          // Get the student's data
          const studentData = await contract.students(studentId);
          console.log('Student data:', studentData);

          // Check if student is approved by checking nftId
          const isApproved = studentData.nftId > 0;
          console.log('Student approval status:', {
            address: student[0],
            nftId: studentData.nftId.toString(),
            isApproved
          });

          // Try to fetch admission letter
          let admissionLetter = null;
          try {
            const response = await fetch(
              `http://localhost:3001/api/admission-letters/${student[0].toLowerCase()}`,
              {
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json'
                }
              }
            );
            if (response.ok) {
              admissionLetter = await response.json();
            } else {
              console.warn(`Failed to fetch admission letter for student ${student[0]}:`, response.status);
            }
          } catch (err) {
            console.error('Error fetching admission letter:', err);
          }

          return {
            studentAddress: student[0],
            schoolType: student[1],
            standard: student[2],
            admissionLetterHash: student[3],
            approved: isApproved,
            nftId: studentData.nftId,
            campaignId: studentData.campaignId,
            admissionLetterStatus: admissionLetter ? 'Uploaded' : 'Not uploaded',
            fileUrl: admissionLetter?.fileUrl
          };
        } catch (err) {
          console.error(`Error processing student ${index}:`, err);
          return null;
        }
      }));

      // Filter out any null entries
      const validStudents = processedStudents.filter(student => student !== null);
      console.log('Processed students:', validStudents);

      // Update both registered and approved students lists
      setRegisteredStudents(validStudents.filter(student => !student.approved));
      setApprovedStudents(validStudents.filter(student => student.approved));
    } catch (err) {
      console.error("Failed to fetch students:", err);
      toast.error(`Failed to fetch students: ${err.reason || err.message}`);
      setRegisteredStudents([]);
      setApprovedStudents([]);
    } finally {
      setLoadingStudents(false);
    }
  };

  const fetchApprovedStudentsForCampaign = async (campaignId) => {
    if (!contract || !campaignId) return;
    setLoadingApprovedStudents(true);
    try {
      const approved = await contract.getApprovedStudentsByCampaign(campaignId);
      setApprovedStudents(approved);
    } catch (err) {
      console.error("Failed to fetch approved students:", err);
      toast.error(`Failed to fetch approved students: ${err.reason || err.message}`);
    } finally {
      setLoadingApprovedStudents(false);
    }
  };

  useEffect(() => {
    if (isConnected && isOwner && contract) {
      fetchData();
    }
  }, [isConnected, isOwner, contract]);

  useEffect(() => {
    if (selectedCampaignForStudents) {
      fetchStudentsForCampaign(parseInt(selectedCampaignForStudents));
      fetchApprovedStudentsForCampaign(parseInt(selectedCampaignForStudents));
    } else {
      setRegisteredStudents([]);
      setApprovedStudents([]);
    }
  }, [selectedCampaignForStudents, contract]);

  const handleCreateCampaign = async (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!contract || !isOwner) {
      toast.error("You are not authorized or wallet not connected.");
      return;
    }
    if (!campaignName) {
      newErrors.campaignName = "Campaign name is required.";
    }
    if (!allowedSchoolTypes) {
        newErrors.allowedSchoolTypes = "Allowed school types are required.";
    }
    if (selectedStandards.length === 0) {
      newErrors.selectedStandards = "At least one standard must be selected.";
    }

    if (Object.keys(newErrors).length > 0) {
        setCampaignFormErrors(newErrors);
        return;
    }

    setCampaignFormErrors({});
    setCreatingCampaign(true);
    try {
      const schoolTypesArray = allowedSchoolTypes.split(',').map(s => s.trim());
      const standardsIntArray = selectedStandards.map(s => parseInt(s));

      const tx = await contract.createCampaign(campaignName, schoolTypesArray, standardsIntArray);
      toast.loading("Transaction pending...", { id: 'createCampaignTx' });
      await tx.wait();
      toast.success("Campaign created successfully!", { id: 'createCampaignTx' });
      setCampaignName('');
      setAllowedSchoolTypes('');
      setSelectedStandards([]);
      fetchData();
    } catch (err) {
      console.error("Create campaign failed:", err);
      toast.error(`Create campaign failed: ${err.reason || err.message}`, { id: 'createCampaignTx' });
    } finally {
      setCreatingCampaign(false);
    }
  };

  const handleRegisterVendor = async (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!contract || !isOwner) {
      toast.error("You are not authorized or wallet not connected.");
      return;
    }
    if (!vendorAddress) {
        newErrors.vendorAddress = "Vendor address is required.";
    } else if (!ethers.isAddress(vendorAddress)) {
      newErrors.vendorAddress = "Please enter a valid Ethereum address.";
    }

    if (Object.keys(newErrors).length > 0) {
        setVendorFormErrors(newErrors);
        return;
    }

    setVendorFormErrors({});
    setRegisteringVendor(true);
    try {
      const tx = await contract.registerVendor(vendorAddress);
      toast.loading("Transaction pending...", { id: 'registerVendorTx' });
      await tx.wait();
      toast.success("Vendor registered successfully!", { id: 'registerVendorTx' });
      setVendorAddress('');
      // In a real app, you'd probably fetch vendors from an indexer or event listener
    } catch (err) {
      console.error("Register vendor failed:", err);
      toast.error(`Register vendor failed: ${err.reason || err.message}`, { id: 'registerVendorTx' });
    } finally {
      setRegisteringVendor(false);
    }
  };

  const handleApproveStudent = async (studentAddress) => {
    if (!contract || !isConnected || !isOwner) {
      toast.error("Please connect your wallet and ensure you're authorized");
      return;
    }

    setApprovingStudent(true);
    try {
      console.log('Approving student address:', studentAddress);
      
      // Get students for the current campaign
      const campaignId = parseInt(selectedCampaignForStudents);
      console.log('Campaign ID:', campaignId);
      
      const students = await contract.getStudentsByCampaign(campaignId);
      console.log('Campaign students:', students);

      // Find the student's index in the campaign
      let studentId = null;
      for (let i = 0; i < students.length; i++) {
        const student = students[i];
        console.log(`Checking student ${i}:`, {
          address: student[0],
          targetAddress: studentAddress,
          match: student[0].toLowerCase() === studentAddress.toLowerCase()
        });
        
        if (student[0].toLowerCase() === studentAddress.toLowerCase()) {
          // Get the student's global ID
          studentId = await contract.studentIdsByCampaign(campaignId, i);
          break;
        }
      }

      if (studentId === null) {
        throw new Error(`Student not found with address: ${studentAddress} in campaign ${campaignId}`);
      }

      console.log('Found student ID:', studentId.toString());

      // Get the student data to verify
      const studentData = await contract.students(studentId);
      console.log('Student data:', {
        address: studentData.studentAddress,
        schoolType: studentData.schoolType,
        standard: studentData.standard,
        approved: studentData.approved
      });

      // Approve the student using their ID
      const tx = await contract.approveStudent(studentId);
      console.log('Transaction sent:', tx.hash);
      
      // Wait for transaction to be mined
      const receipt = await tx.wait();
      console.log('Transaction receipt:', receipt);

      if (receipt.status === 1) {
        toast.success("Student approved successfully!");
        
        // Refresh both registered and approved students lists
        if (selectedCampaignForStudents) {
          await Promise.all([
            fetchStudentsForCampaign(selectedCampaignForStudents),
            fetchApprovedStudentsForCampaign(selectedCampaignForStudents)
          ]);
        }
      } else {
        throw new Error("Transaction failed");
      }
    } catch (err) {
      console.error("Approve student failed:", err);
      toast.error(`Failed to approve student: ${err.reason || err.message}`);
    } finally {
      setApprovingStudent(false);
    }
  };

  const handleDonate = async () => {
    if (!contract || !selectedCampaignForDonation || !donationAmount) return;

    try {
      setDonating(true);
      const amount = ethers.parseEther(donationAmount);
      
      const tx = await contract.donateToCampaign(selectedCampaignForDonation.id, { value: amount });
      toast.loading('Processing donation...', { id: 'donationTx' });
      
      await tx.wait();
      
      toast.success('Donation successful!', { id: 'donationTx' });
      setOpenDonationDialog(false);
      setDonationAmount('');
      fetchData(); // Refresh campaign data
    } catch (err) {
      console.error('Donation error:', err);
      toast.error(`Donation failed: ${err.reason || err.message}`, { id: 'donationTx' });
    } finally {
      setDonating(false);
    }
  };

  if (!isConnected || !isOwner) {
    return (
      <Box sx={{ p: 4, mt: 4, textAlign: 'center', color: 'error.main' }}>
        <Typography variant="h4" component="h2" gutterBottom>Access Denied!</Typography>
        <Typography variant="body1" mt={2}>You must be the contract owner to access this dashboard.</Typography>
        <Button variant="contained" color="primary" sx={{ mt: 3 }} onClick={useWeb3Store.getState().connectWallet}>
          Connect Wallet
        </Button>
      </Box>
    );
  }

  if (loadingData) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
        <CircularProgress size={50} />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom textAlign="center">
        Admin Dashboard
      </Typography>

      <Tabs value={tabIndex} onChange={(e, newValue) => setTabIndex(newValue)} centered sx={{ mt: 4, mb: 3 }}>
        <Tab label="Campaign Management" />
        <Tab label="Student Approvals" />
        <Tab label="Vendor Registration" />
        <Tab label="Financial Overview" />
      </Tabs>

      {/* Campaign Management Tab */}
      {tabIndex === 0 && (
        <Box>
          <Paper sx={{ p: 3, mb: 4 }}>
            <Typography variant="h5" gutterBottom>Create New Campaign</Typography>
            <VStack component="form" onSubmit={handleCreateCampaign} spacing={3}>
              <TextField
                label="Campaign Name"
                value={campaignName}
                onChange={(e) => setCampaignName(e.target.value)}
                placeholder="e.g., Primary School Books 2025"
                error={!!campaignFormErrors.campaignName}
                helperText={campaignFormErrors.campaignName}
                required
              />
              <TextField
                label="Allowed School Types (comma-separated)"
                value={allowedSchoolTypes}
                onChange={(e) => setAllowedSchoolTypes(e.target.value)}
                placeholder="e.g., govt, private, public"
                helperText="Enter types like 'govt', 'private', etc., separated by commas."
                error={!!campaignFormErrors.allowedSchoolTypes}
                required
              />
              <Select
                multiple
                value={selectedStandards}
                onChange={(e) => typeof e.target.value === 'string' ? setSelectedStandards(e.target.value.split(',').map(Number)) : setSelectedStandards(e.target.value)}
                displayEmpty
                inputProps={{ 'aria-label': 'Select Standards' }}
                sx={{ minWidth: 250 }}
                error={!!campaignFormErrors.selectedStandards}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selected.map((value) => (
                      <Chip key={value} label={STANDARDS[value].replace(/_/g, ' ')} />
                    ))}
                  </Box>
                )}
              >
                <MenuItem disabled value="">
                  <em>Select standards</em>
                </MenuItem>
                {STANDARDS.map((s, index) => (
                  <MenuItem key={index} value={index}>
                    {s.replace(/_/g, ' ')}
                  </MenuItem>
                ))}
              </Select>
              {campaignFormErrors.selectedStandards && (
                <Typography color="error" variant="caption">{campaignFormErrors.selectedStandards}</Typography>
              )}

              <Button
                variant="contained"
                color="primary"
                type="submit"
                disabled={creatingCampaign}
                startIcon={creatingCampaign && <CircularProgress size={20} color="inherit" />}
                fullWidth
              >
                Create Campaign
              </Button>
            </VStack>
          </Paper>

          <Divider sx={{ my: 4 }} />

          <Typography variant="h5" gutterBottom>All Campaigns</Typography>
          {campaigns.length === 0 ? (
            <Typography>No campaigns created yet.</Typography>
          ) : (
            <Grid container spacing={3}>
              {campaigns.map((campaign) => (
                <Grid item xs={12} md={6} key={campaign.id}>
                  <Paper elevation={2} sx={{ p: 2 }}>
                    <Typography variant="h6">{campaign.name}</Typography>
                    <Typography variant="body2">ID: {campaign.id.toString()}</Typography>
                    <Typography variant="body2">Allowed Types: {campaign.allowedSchoolTypes.join(', ')}</Typography>
                    <Typography variant="body2">Allowed Standards: {campaign.allowedStandards.map(s => STANDARDS[s]).join(', ')}</Typography>
                    <Typography variant="body2">Exists: {campaign.exists ? 'Yes' : 'No'}</Typography>
                    <Button
                      variant="contained"
                      color="primary"
                      size="small"
                      sx={{ mt: 2 }}
                      onClick={() => {
                        setSelectedCampaignForDonation(campaign);
                        setOpenDonationDialog(true);
                      }}
                    >
                      Donate to Campaign
                    </Button>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          )}

          <Divider sx={{ my: 4 }} />

          <CampaignDetailsMUI campaigns={campaigns} />

          {/* Donation Dialog */}
          <Dialog open={openDonationDialog} onClose={() => setOpenDonationDialog(false)}>
            <DialogTitle>Donate to Campaign</DialogTitle>
            <DialogContent>
              <Typography variant="body1" gutterBottom>
                Campaign: {selectedCampaignForDonation?.name}
              </Typography>
              <TextField
                autoFocus
                margin="dense"
                label="Amount (ETH)"
                type="number"
                fullWidth
                value={donationAmount}
                onChange={(e) => setDonationAmount(e.target.value)}
                inputProps={{ step: "0.01", min: "0" }}
              />
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setOpenDonationDialog(false)}>Cancel</Button>
              <Button 
                onClick={handleDonate}
                variant="contained" 
                disabled={!donationAmount || donating}
              >
                {donating ? <CircularProgress size={24} /> : 'Donate'}
              </Button>
            </DialogActions>
          </Dialog>
        </Box>
      )}

      {/* Student Approvals Tab */}
      {tabIndex === 1 && (
        <Box>
          <Typography variant="h5" gutterBottom>Student Approvals</Typography>
          <Select
            value={selectedCampaignForStudents}
            onChange={(e) => setSelectedCampaignForStudents(e.target.value)}
            displayEmpty
            inputProps={{ 'aria-label': 'Select Campaign to View Students' }}
            sx={{ minWidth: 250, mb: 3 }}
          >
            <MenuItem value="" disabled>
              <em>Select campaign</em>
            </MenuItem>
            {campaigns.map((camp) => (
              <MenuItem key={camp.id} value={camp.id.toString()}>
                {camp.name} (ID: {camp.id.toString()})
              </MenuItem>
            ))}
          </Select>

          {selectedCampaignForStudents && (
            <Box mt={3}>
              <Typography variant="h6" gutterBottom>Registered Students (Pending Approval)</Typography>
              {loadingStudents ? (
                <Box sx={{ display: 'flex', justifyContent: 'center' }}><CircularProgress /></Box>
              ) : registeredStudents.filter(s => !s.approved).length === 0 ? (
                <Typography>No pending students for this campaign.</Typography>
              ) : (
                <List>
                  {registeredStudents.filter(s => !s.approved).map((student, index) => (
                    <Paper component={ListItem} key={index} elevation={1} sx={{ mb: 2 }}>
                      <ListItemText
                        primary={`Address: ${student.studentAddress || 'N/A'}`}
                        secondary={
                          <>
                            <Typography component="span" variant="body2" color="text.primary">
                              School Type: {student.schoolType || 'N/A'} <br/>
                              Standard: {student.standard !== undefined ? STANDARDS[student.standard] : 'N/A'} <br/>
                              Campaign ID: {student.campaignId ? student.campaignId.toString() : 'N/A'} <br/>
                              NFT ID: {student.nftId ? student.nftId.toString() : 'Not minted'} <br/>
                              Admission Letter Status: {student.admissionLetterStatus || 'Not uploaded'} <br/>
                              {student.fileUrl && `Admission Letter: ${student.fileUrl}`}
                            </Typography>
                          </>
                        }
                      />
                      <Button
                        variant="contained"
                        color="success"
                        size="small"
                        onClick={() => handleApproveStudent(student.studentAddress)}
                        disabled={approvingStudent}
                      >
                        {approvingStudent ? (
                          <>
                            <CircularProgress size={20} sx={{ mr: 1 }} />
                            Approving...
                          </>
                        ) : (
                          'Approve & Mint NFT'
                        )}
                      </Button>
                    </Paper>
                  ))}
                </List>
              )}

              <Typography variant="h6" mt={4} gutterBottom>Approved Students (NFT Minted)</Typography>
              {loadingApprovedStudents ? (
                <Box sx={{ display: 'flex', justifyContent: 'center' }}><CircularProgress /></Box>
              ) : approvedStudents.length === 0 ? (
                <Typography>No approved students for this campaign yet.</Typography>
              ) : (
                <List>
                  {approvedStudents.map((student, index) => (
                    <Paper component={ListItem} key={index} elevation={1} sx={{ mb: 2 }}>
                      <ListItemText
                        primary={`Address: ${student.studentAddress || 'N/A'}`}
                        secondary={
                          <>
                            <Typography component="span" variant="body2" color="text.primary">
                              School Type: {student.schoolType || 'N/A'} <br/>
                              Standard: {student.standard !== undefined ? STANDARDS[student.standard] : 'N/A'} <br/>
                              NFT ID: {student.nftId ? student.nftId.toString() : 'Not minted'} <br/>
                              Campaign ID: {student.campaignId ? student.campaignId.toString() : 'N/A'}
                            </Typography>
                          </>
                        }
                      />
                      <Chip label="Approved" color="success" size="small" />
                    </Paper>
                  ))}
                </List>
              )}
            </Box>
          )}
        </Box>
      )}

      {/* Vendor Registration Tab */}
      {tabIndex === 2 && (
        <Box>
          <Paper sx={{ p: 3, mb: 4 }}>
            <Typography variant="h5" gutterBottom>Register New Vendor</Typography>
            <VStack component="form" onSubmit={handleRegisterVendor} spacing={3}>
              <TextField
                label="Vendor Address"
                value={vendorAddress}
                onChange={(e) => setVendorAddress(e.target.value)}
                placeholder="0x..."
                error={!!vendorFormErrors.vendorAddress}
                helperText={vendorFormErrors.vendorAddress}
                required
              />
              <Button
                variant="contained"
                color="primary"
                type="submit"
                disabled={registeringVendor}
                startIcon={registeringVendor && <CircularProgress size={20} color="inherit" />}
                fullWidth
              >
                Register Vendor
              </Button>
            </VStack>
          </Paper>
          <Divider sx={{ my: 4 }} />
          <Typography variant="body1" color="text.secondary">
            Registered Vendors will be displayed here (requires off-chain indexing or a contract function to get all vendors).
          </Typography>
        </Box>
      )}

      {/* Financial Overview Tab */}
      {tabIndex === 3 && (
        <Box>
          <Typography variant="h5" gutterBottom>Financial Overview</Typography>
          <Paper sx={{ p: 3, mb: 4 }}>
            <Typography variant="body1">
              <strong>Total Donors:</strong> {allDonorsWithAmounts.length}
            </Typography>
            <Typography variant="body1" mt={2}>
              For individual campaign balances, please refer to the "View Campaign Details" section under the "Campaign Management" tab.
            </Typography>
          </Paper>

          <Typography variant="h6" mt={4} gutterBottom>All Donors & Their Contributions</Typography>
          {allDonorsWithAmounts.length === 0 ? (
            <Typography>No donors found.</Typography>
          ) : (
            <List>
              {allDonorsWithAmounts.map((donor, index) => (
                <Paper component={ListItem} key={index} elevation={1} sx={{ mb: 2, flexDirection: 'column', alignItems: 'flex-start' }}>
                  <Typography variant="body1" fontWeight="bold">Donor: {donor.address}</Typography>
                  <Typography variant="body2" mt={1}>
                    Total Donated: <Chip label={`${donor.totalDonated} ETH`} color="success" size="small" />
                  </Typography>
                  <Typography variant="body2" mt={1}>Donated per Campaign:</Typography>
                  <List dense sx={{ width: '100%' }}>
                    {donor.donatedPerCampaign.map((amount, campIndex) => (
                      amount !== "0.0" && (
                        <ListItem key={campIndex}>
                          <ListItemText primary={`Campaign ${campIndex + 1}: ${amount} ETH`} sx={{ ml: 2 }} />
                        </ListItem>
                      )
                    ))}
                  </List>
                </Paper>
              ))}
            </List>
          )}
        </Box>
      )}
    </Box>
  );
};

// Helper for VStack like Chakra UI
const VStack = ({ children, spacing, ...props }) => (
  <Box display="flex" flexDirection="column" gap={spacing * 8} {...props}>
    {children}
  </Box>
);

export default AdminDashboardMUI;