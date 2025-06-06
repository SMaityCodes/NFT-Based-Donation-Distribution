import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Button, TextField, Select, MenuItem, Grid, Paper,
  CircularProgress, Tabs, Tab, Divider, List, ListItem, ListItemText, Chip, Link
} from '@mui/material';
import useWeb3Store from '../store/web3Store';
import { STANDARDS } from '../utils/constants';
import { toast } from 'react-hot-toast';
import { ethers } from 'ethers';
import CampaignDetailsMUI from '../components/CampaignDetailsMUI'; // Re-use the separate component
import { getIPFSGatewayUrl } from '../utils/ipfs';

const AdminDashboardMUI = () => {
  const { contract, account, isConnected, isOwner, signer } = useWeb3Store();
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
    if (!contract || !campaignId) return;
    setLoadingStudents(true);
    try {
      const students = await contract.getStudentsByCampaign(campaignId);
      setRegisteredStudents(students);
    } catch (err) {
      console.error("Failed to fetch registered students:", err);
      toast.error(`Failed to fetch registered students: ${err.reason || err.message}`);
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

  const handleApproveStudent = async (studentId) => {
    if (!contract || !isOwner) {
      toast.error("You are not authorized or wallet not connected.");
      return;
    }

    try {
      const tx = await contract.approveStudent(studentId);
      toast.loading("Approving student...", { id: 'approveStudentTx' });
      await tx.wait();
      toast.success("Student approved and NFT minted!", { id: 'approveStudentTx' });
      fetchStudentsForCampaign(parseInt(selectedCampaignForStudents));
      fetchApprovedStudentsForCampaign(parseInt(selectedCampaignForStudents));
      fetchData();
    } catch (err) {
      console.error("Approve student failed:", err);
      toast.error(`Approve student failed: ${err.reason || err.message}`, { id: 'approveStudentTx' });
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
                  </Paper>
                </Grid>
              ))}
            </Grid>
          )}

          <Divider sx={{ my: 4 }} />

          <CampaignDetailsMUI campaigns={campaigns} />
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
                    <Paper component={ListItem} key={student.id.toString()} elevation={1} sx={{ mb: 2 }}>
                      <ListItemText
                        primary={`Address: ${student.studentAddress}`}
                        secondary={
                          <>
                            <Typography component="span" variant="body2" color="text.primary">
                              School Type: {student.schoolType} <br/>
                              Standard: {STANDARDS[student.standard]} <br/>
                              Campaign ID: {student.campaignId.toString()} <br/>
                              Admission Letter Hash: { ' ' }
                              <Link href={getIPFSGatewayUrl(ethers.toUtf8String(student.admissionLetterHash))} target="_blank" rel="noopener" color="primary">
                                {ethers.toUtf8String(student.admissionLetterHash).substring(0, 10)}...
                              </Link>
                            </Typography>
                          </>
                        }
                      />
                      <Button
                        variant="contained"
                        color="success"
                        size="small"
                        onClick={() => handleApproveStudent(student.id)}
                      >
                        Approve & Mint NFT
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
                    <Paper component={ListItem} key={student.id.toString()} elevation={1} sx={{ mb: 2 }}>
                      <ListItemText
                        primary={`Address: ${student.studentAddress}`}
                        secondary={
                          <>
                            <Typography component="span" variant="body2" color="text.primary">
                              Standard: {STANDARDS[student.standard]} <br/>
                              NFT ID: {student.nftId.toString()}
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