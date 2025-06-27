import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  Chip,
  Stack,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Tooltip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel
} from '@mui/material';
import useWeb3Store from '../../store/web3Store';
import { toast } from 'react-toastify';
import {
  School as SchoolIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  CheckCircle as CheckCircleIcon,
  Pending as PendingIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import { ethers } from 'ethers';
import { useNavigate } from 'react-router-dom';

const AdminStudents = () => {
  const navigate = useNavigate();
  const { contract, account } = useWeb3Store();
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState([]);
  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [createFormData, setCreateFormData] = useState({
    address: '',
    schoolType: 0,
    standard: 0
  });
  const [editFormData, setEditFormData] = useState({
    schoolType: 0,
    standard: 0
  });
  const [metaOpen, setMetaOpen] = useState(false);
  const [metaDetails, setMetaDetails] = useState(null);

  const schoolTypes = [
    { value: 0, label: 'Government' },
    { value: 1, label: 'Private' }
  ];

  const standards = [
    { value: 0, label: 'Class 1' },
    { value: 1, label: 'Class 2' },
    { value: 2, label: 'Class 3' },
    { value: 3, label: 'Class 4' },
    { value: 4, label: 'Class 5' },
    { value: 5, label: 'Class 6' },
    { value: 6, label: 'Class 7' },
    { value: 7, label: 'Class 8' },
    { value: 8, label: 'Class 9' },
    { value: 9, label: 'Class 10' },
    { value: 10, label: 'Inter 1' },
    { value: 11, label: 'Inter 2' },
    { value: 12, label: 'BTech 1' },
    { value: 13, label: 'BTech 2' },
    { value: 14, label: 'BTech 3' },
    { value: 15, label: 'BTech 4' },
    { value: 16, label: 'MTech 1' },
    { value: 17, label: 'MTech 2' },
    { value: 18, label: 'MTech 3' },
    { value: 19, label: 'MTech 4' }
  ];

  const STANDARD_LABELS = [
    'PRIMARY_1', 'PRIMARY_2', 'PRIMARY_3', 'PRIMARY_4', 'PRIMARY_5',
    'MIDDLE_6', 'MIDDLE_7', 'MIDDLE_8',
    'HIGH_9', 'HIGH_10',
    'INTER_11', 'INTER_12',
    'BTECH_1', 'BTECH_2', 'BTECH_3', 'BTECH_4'
  ];

  // Function to map standard numbers to proper class names
  const getStandardLabel = (standardNumber) => {
    const standard = parseInt(standardNumber);
    
    if (standard >= 0 && standard <= 9) {
      return `Class ${standard + 1}`;
    } else if (standard === 10) {
      return 'Inter 1';
    } else if (standard === 11) {
      return 'Inter 2';
    } else if (standard >= 12 && standard <= 15) {
      return `BTech ${standard - 11}`;
    } else if (standard >= 16 && standard <= 19) {
      return `MTech ${standard - 15}`;
    } else {
      return `Standard ${standard + 1}`;
    }
  };

  const fetchStudents = async () => {
    if (!contract || !account) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // Try to get students by campaign first, then fallback to studentCount
      let formattedStudents = [];
      
      try {
        // Get all campaigns first
        const campaigns = await contract.getAllCampaigns();
        console.log('Campaigns found:', campaigns.length);
        
        // Get students from each campaign
        for (let campaignIndex = 0; campaignIndex < campaigns.length; campaignIndex++) {
          const campaignId = campaigns[campaignIndex].id;
          console.log(`Fetching students for campaign ${campaignId}`);
          
          try {
            const campaignStudents = await contract.getStudentsByCampaign(campaignId);
            console.log(`Campaign ${campaignId} students:`, campaignStudents);
            
            // Process each student in the campaign
            for (let studentIndex = 0; studentIndex < campaignStudents.length; studentIndex++) {
              const student = campaignStudents[studentIndex];
              
              // Get the global student ID
              const globalStudentId = await contract.studentIdsByCampaign(campaignId, studentIndex);
              
              // Get detailed student data
              const studentData = await contract.students(globalStudentId);
              
              console.log(`Student ${globalStudentId} data:`, {
                studentAddress: studentData.studentAddress,
                schoolType: studentData.schoolType,
                standard: studentData.standard.toString(),
                nftId: studentData.nftId.toString(),
                approved: studentData.approved
              });

              const formattedStudent = {
                id: globalStudentId.toString(),
                address: studentData.studentAddress,
                schoolType: studentData.schoolType === 'govt' || studentData.schoolType === 0 ? 'Government' : 'Private',
                standard: studentData.standard.toString(),
                approved: studentData.approved,
                nftId: studentData.nftId.toString(),
                campaignId: campaignId.toString()
              };

              formattedStudents.push(formattedStudent);
            }
          } catch (campaignError) {
            console.error(`Error fetching students for campaign ${campaignId}:`, campaignError);
          }
        }
      } catch (campaignError) {
        console.error('Error fetching campaigns, falling back to studentCount:', campaignError);
        
        // Fallback: use the old method with studentCount
        const studentCount = await contract.studentCount();
        console.log('Total student count:', studentCount.toString());
        
        const studentPromises = [];
        for (let i = 0; i < studentCount; i++) {
          studentPromises.push(contract.students(i));
        }
        const studentResults = await Promise.all(studentPromises);
        
        console.log('Raw student results:', studentResults);
        
        formattedStudents = studentResults.map((student, index) => {
          console.log(`Student ${index} raw data:`, {
            studentAddress: student.studentAddress,
            schoolType: student.schoolType,
            standard: student.standard.toString(),
            nftId: student.nftId.toString(),
            approved: student.approved
          });

          return {
            id: index.toString(),
            address: student.studentAddress,
            schoolType: student.schoolType === 'govt' || student.schoolType === 0 ? 'Government' : 'Private',
            standard: student.standard.toString(),
            approved: student.approved,
            nftId: student.nftId.toString()
          };
        });
      }

      console.log('All formatted students:', formattedStudents);
      setStudents(formattedStudents);
    } catch (error) {
      console.error('Error fetching students:', error);
      toast.error('Failed to fetch students');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [contract, account]);

  const handleCreateClick = () => {
    setCreateFormData({
      address: '',
      schoolType: 0,
      standard: 1
    });
    setOpenCreateDialog(true);
  };

  const handleEditClick = (student) => {
    setSelectedStudent(student);
    setEditFormData({
      schoolType: student.schoolType === 'Government' ? 0 : 1,
      standard: parseInt(student.standard)
    });
    setOpenEditDialog(true);
  };

  const handleDeleteClick = (student) => {
    setSelectedStudent(student);
    setOpenDeleteDialog(true);
  };

  const handleCreateSubmit = async () => {
    if (!contract || !account) return;

    try {
      const tx = await contract.registerStudent(
        createFormData.address,
        createFormData.schoolType,
        createFormData.standard
      );
      await tx.wait();
      toast.success('Student registered successfully');
      setOpenCreateDialog(false);
      fetchStudents();
    } catch (error) {
      console.error('Error registering student:', error);
      toast.error('Failed to register student');
    }
  };

  const handleEditSubmit = async () => {
    if (!contract || !account || !selectedStudent) return;

    try {
      const tx = await contract.updateStudent(
        selectedStudent.id,
        editFormData.schoolType,
        editFormData.standard
      );
      await tx.wait();
      toast.success('Student updated successfully');
      setOpenEditDialog(false);
      fetchStudents();
    } catch (error) {
      console.error('Error updating student:', error);
      toast.error('Failed to update student');
    }
  };

  const handleDeleteSubmit = async () => {
    if (!contract || !account || !selectedStudent) return;

    try {
      const tx = await contract.deleteStudent(selectedStudent.id);
      await tx.wait();
      toast.success('Student deleted successfully');
      setOpenDeleteDialog(false);
      fetchStudents();
    } catch (error) {
      console.error('Error deleting student:', error);
      toast.error('Failed to delete student');
    }
  };

  const handleApproveStudent = async (student) => {
    if (!contract || !account) return;

    try {
      const tx = await contract.approveStudent(student.id);
      await tx.wait();
      toast.success('Student approved successfully!');
      fetchStudents(); // Refresh the student list
    } catch (error) {
      console.error('Error approving student:', error);
      toast.error('Failed to approve student');
    }
  };

  const handleViewMetadata = async (nftId) => {
    if (!contract || !nftId || nftId === '0') return;
    let details = {};
    try {
      const nftDetails = await contract.getNFTDetails(nftId);
      details.used = nftDetails[2];
      details.owner = nftDetails[3];
      try {
        const tx = await contract.getVendorTransaction(nftId);
        details.itemProvided = tx[2];
        details.admin = tx[1];
      } catch {}
    } catch {}
    setMetaDetails(details);
    setMetaOpen(true);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <Paper 
        elevation={0} 
        sx={{ 
          p: 3, 
          mb: 4, 
          borderRadius: 2,
          background: 'linear-gradient(45deg, #2e7d32 30%, #4caf50 90%)',
          color: 'white'
        }}
      >
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Stack direction="row" spacing={2} alignItems="center">
            <SchoolIcon sx={{ fontSize: 40 }} />
            <Box>
              <Typography variant="h4" fontWeight="bold">
                Student Management
              </Typography>
              <Typography variant="subtitle1" sx={{ opacity: 0.8 }}>
                Manage student registrations and approvals
              </Typography>
            </Box>
          </Stack>
          <Stack direction="row" spacing={2}>
            <Button
              variant="contained"
              color="inherit"
              onClick={() => navigate('/admin/dashboard')}
              startIcon={<PersonIcon />}
              sx={{ 
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.3)',
                }
              }}
            >
              Go to Dashboard
            </Button>
            {/* <Button
              variant="contained"
              color="inherit"
              onClick={handleCreateClick}
              startIcon={<AddIcon />}
              sx={{ 
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.3)',
                }
              }}
            >
              Register Student
            </Button> */}
            <Tooltip title="Refresh Data">
              <IconButton onClick={fetchStudents} sx={{ color: 'white' }}>
                <RefreshIcon />
              </IconButton>
            </Tooltip>
          </Stack>
        </Stack>
      </Paper>

      {/* Debug Section - Remove in production */}
      {/* {process.env.NODE_ENV === 'development' && students.length > 0 && (
        <Paper sx={{ p: 2, mb: 3, backgroundColor: '#f5f5f5' }}>
          <Typography variant="h6" gutterBottom>Debug Info</Typography>
          <Typography variant="body2" component="pre" sx={{ fontSize: '12px', overflow: 'auto' }}>
            {JSON.stringify(students, null, 2)}
          </Typography>
        </Paper>
      )} */}

      {/* Students List */}
      <Grid container spacing={3}>
        {students.length === 0 ? (
          <Grid item xs={12}>
            <Card elevation={2}>
              <CardContent sx={{ textAlign: 'center', py: 8 }}>
                <SchoolIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No Students Found
                </Typography>
                <Typography color="text.secondary" paragraph>
                  No students have registered yet
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ) : (
          <Grid item xs={12}>
            <Card elevation={2}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  All Students ({students.length})
                </Typography>
                <List>
                  {students.map((student) => (
                    <React.Fragment key={student.id}>
                      <ListItem>
                        <ListItemIcon>
                          <SchoolIcon color="success" />
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Stack direction="row" spacing={1} alignItems="center">
                              <Typography variant="subtitle1">
                                Student #{student.id}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                ({student.address})
                              </Typography>
                              {student.campaignId && (
                                <Chip 
                                  label={`Campaign ${student.campaignId}`}
                                  size="small"
                                  variant="outlined"
                                />
                              )}
                            </Stack>
                          }
                          secondary={
                            <Stack direction="row" spacing={1} mt={1}>
                              <Chip 
                                label={student.approved ? "Approved" : "Pending"}
                                color={student.approved ? "success" : "warning"}
                                size="small"
                              />
                              <Chip 
                                label={student.schoolType}
                                size="small"
                              />
                              <Chip 
                                label={getStandardLabel(student.standard)}
                                size="small"
                              />
                              {student.approved && (
                                <>
                                  <Chip 
                                    label={`NFT #${student.nftId}`}
                                    color="success"
                                    size="small"
                                    variant="outlined"
                                  />
                                  <Button
                                    variant="outlined"
                                    color="secondary"
                                    size="small"
                                    sx={{ ml: 1 }}
                                    onClick={() => navigate(`/token-uri/${STANDARD_LABELS[Number(student.standard)]}`)}
                                  >
                                    View Standard Token URI
                                  </Button>
                                  <Button
                                    variant="outlined"
                                    color="primary"
                                    size="small"
                                    sx={{ ml: 1 }}
                                    onClick={() => handleViewMetadata(student.nftId)}
                                  >
                                    View NFT Metadata
                                  </Button>
                                </>
                              )}
                            </Stack>
                          }
                        />
                        {!student.approved && (
                          <Button
                            variant="contained"
                            color="success"
                            size="small"
                            onClick={() => handleApproveStudent(student)}
                            startIcon={<CheckCircleIcon />}
                          >
                            Approve
                          </Button>
                        )}
                      </ListItem>
                      <Divider />
                    </React.Fragment>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>

      {/* Create Student Dialog */}
      <Dialog 
        open={openCreateDialog} 
        onClose={() => setOpenCreateDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Stack direction="row" spacing={1} alignItems="center">
            <AddIcon color="primary" />
            <Typography variant="h6">Register New Student</Typography>
          </Stack>
        </DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 2 }}>
            <TextField
              label="Student Address"
              fullWidth
              value={createFormData.address}
              onChange={(e) => setCreateFormData({ ...createFormData, address: e.target.value })}
            />
            <FormControl fullWidth>
              <InputLabel>School Type</InputLabel>
              <Select
                value={createFormData.schoolType}
                onChange={(e) => setCreateFormData({ ...createFormData, schoolType: e.target.value })}
                label="School Type"
              >
                {schoolTypes.map((type) => (
                  <MenuItem key={type.value} value={type.value}>
                    {type.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Standard</InputLabel>
              <Select
                value={createFormData.standard}
                onChange={(e) => setCreateFormData({ ...createFormData, standard: e.target.value })}
                label="Standard"
              >
                {standards.map((standard) => (
                  <MenuItem key={standard.value} value={standard.value}>
                    {standard.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCreateDialog(false)}>Cancel</Button>
          <Button 
            variant="contained" 
            onClick={handleCreateSubmit}
            disabled={!createFormData.address}
          >
            Register Student
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Student Dialog */}
      <Dialog 
        open={openEditDialog} 
        onClose={() => setOpenEditDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Stack direction="row" spacing={1} alignItems="center">
            <EditIcon color="primary" />
            <Typography variant="h6">Edit Student</Typography>
          </Stack>
        </DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 2 }}>
            <FormControl fullWidth>
              <InputLabel>School Type</InputLabel>
              <Select
                value={editFormData.schoolType}
                onChange={(e) => setEditFormData({ ...editFormData, schoolType: e.target.value })}
                label="School Type"
              >
                {schoolTypes.map((type) => (
                  <MenuItem key={type.value} value={type.value}>
                    {type.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Standard</InputLabel>
              <Select
                value={editFormData.standard}
                onChange={(e) => setEditFormData({ ...editFormData, standard: e.target.value })}
                label="Standard"
              >
                {standards.map((standard) => (
                  <MenuItem key={standard.value} value={standard.value}>
                    {standard.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenEditDialog(false)}>Cancel</Button>
          <Button 
            variant="contained" 
            onClick={handleEditSubmit}
          >
            Update Student
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Student Dialog */}
      <Dialog 
        open={openDeleteDialog} 
        onClose={() => setOpenDeleteDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Stack direction="row" spacing={1} alignItems="center">
            <DeleteIcon color="error" />
            <Typography variant="h6">Delete Student</Typography>
          </Stack>
        </DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete Student #{selectedStudent?.id}? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteDialog(false)}>Cancel</Button>
          <Button 
            variant="contained" 
            color="error" 
            onClick={handleDeleteSubmit}
          >
            Delete Student
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={metaOpen} onClose={() => setMetaOpen(false)}>
        <DialogTitle>NFT Metadata</DialogTitle>
        <DialogContent>
          {metaDetails ? (
            <>
              <Typography>Student Address: {metaDetails.admin || 'N/A'}</Typography>
              <Typography>Current Owner: {metaDetails.owner}</Typography>
              <Typography>Used: {metaDetails.used ? 'Yes' : 'No'}</Typography>
              <Typography>Item Provided: {metaDetails.itemProvided || 'N/A'}</Typography>
            </>
          ) : (
            <Typography>Loading...</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMetaOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminStudents; 