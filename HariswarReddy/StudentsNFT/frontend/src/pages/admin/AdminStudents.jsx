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
import { toast } from 'react-hot-toast';
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

  const schoolTypes = [
    { value: 0, label: 'Government' },
    { value: 1, label: 'Private' }
  ];

  const standards = Array.from({ length: 12 }, (_, i) => ({
    value: i + 1,
    label: `Standard ${i + 1}`
  }));

  const fetchStudents = async () => {
    if (!contract || !account) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const studentCount = await contract.studentCount();
      const studentsData = [];

      for (let i = 0; i < studentCount; i++) {
        const student = await contract.students(i);
        studentsData.push({
          id: i.toString(),
          address: student.studentAddress,
          schoolType: student.schoolType === 0 ? 'Government' : 'Private',
          standard: student.standard.toString(),
          approved: student.approved
        });
      }

      setStudents(studentsData);
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
            <Button
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
            </Button>
            <Tooltip title="Refresh Data">
              <IconButton onClick={fetchStudents} sx={{ color: 'white' }}>
                <RefreshIcon />
              </IconButton>
            </Tooltip>
          </Stack>
        </Stack>
      </Paper>

      {/* Students Grid */}
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
                  Register your first student to get started
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={handleCreateClick}
                  sx={{ mt: 2 }}
                >
                  Register Student
                </Button>
              </CardContent>
            </Card>
          </Grid>
        ) : (
          students.map((student) => (
            <Grid item xs={12} md={6} lg={4} key={student.id}>
              <Card 
                elevation={2}
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 4
                  }
                }}
              >
                <CardContent sx={{ flexGrow: 1 }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={2}>
                    <Typography variant="h6" component="div" gutterBottom>
                      Student #{student.id}
                    </Typography>
                    <Stack direction="row" spacing={1}>
                      <Tooltip title="Edit Student">
                        <IconButton 
                          size="small" 
                          onClick={() => handleEditClick(student)}
                          sx={{ color: 'primary.main' }}
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete Student">
                        <IconButton 
                          size="small" 
                          onClick={() => handleDeleteClick(student)}
                          sx={{ color: 'error.main' }}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </Stack>
                  <Stack spacing={2}>
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Address
                      </Typography>
                      <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>
                        {student.address}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        School Type
                      </Typography>
                      <Chip
                        label={student.schoolType}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                    </Box>
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Standard
                      </Typography>
                      <Chip
                        label={`Standard ${student.standard}`}
                        size="small"
                        color="secondary"
                        variant="outlined"
                      />
                    </Box>
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Status
                      </Typography>
                      <Chip
                        label={student.approved ? 'Approved' : 'Pending'}
                        color={student.approved ? 'success' : 'warning'}
                        size="small"
                      />
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          ))
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
    </Box>
  );
};

export default AdminStudents; 