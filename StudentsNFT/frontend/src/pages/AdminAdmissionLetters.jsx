import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress
} from '@mui/material';
import { toast } from 'react-toastify';

const AdminAdmissionLetters = () => {
  const [admissionLetters, setAdmissionLetters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLetter, setSelectedLetter] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchAdmissionLetters();
  }, []);

  const fetchAdmissionLetters = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/admission-letters`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch admission letters');
      }

      const data = await response.json();
      setAdmissionLetters(data);
    } catch (error) {
      console.error('Error fetching admission letters:', error);
      toast.error('Failed to fetch admission letters');
    } finally {
      setLoading(false);
    }
  };

  const handleViewLetter = (letter) => {
    setSelectedLetter(letter);
    setAdminNotes(letter.adminNotes || '');
    setOpenDialog(true);
  };

  const handleUpdateStatus = async (status) => {
    if (!selectedLetter) return;

    setUpdating(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/admission-letters/${selectedLetter.studentId}/status`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({
            status,
            adminNotes
          })
        }
      );

      if (!response.ok) {
        throw new Error('Failed to update status');
      }

      toast.success('Status updated successfully');
      setOpenDialog(false);
      fetchAdmissionLetters();
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    } finally {
      setUpdating(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved':
        return 'success';
      case 'rejected':
        return 'error';
      default:
        return 'warning';
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
    <Box sx={{ p: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Admission Letters
      </Typography>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Student ID</TableCell>
              <TableCell>Campaign ID</TableCell>
              <TableCell>Upload Date</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {admissionLetters.map((letter) => (
              <TableRow key={letter._id}>
                <TableCell>{letter.studentId}</TableCell>
                <TableCell>{letter.campaignId}</TableCell>
                <TableCell>
                  {new Date(letter.uploadDate).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <Chip
                    label={letter.status}
                    color={getStatusColor(letter.status)}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => handleViewLetter(letter)}
                  >
                    View
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Admission Letter Details</DialogTitle>
        <DialogContent>
          {selectedLetter && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                Student ID: {selectedLetter.studentId}
              </Typography>
              <Typography variant="subtitle1" gutterBottom>
                Campaign ID: {selectedLetter.campaignId}
              </Typography>
              <Typography variant="subtitle1" gutterBottom>
                Upload Date: {new Date(selectedLetter.uploadDate).toLocaleString()}
              </Typography>
              <Box sx={{ mt: 2 }}>
                <Button
                  variant="contained"
                  color="primary"
                  href={`${import.meta.env.VITE_BACKEND_URL}/api/admission-letters/${selectedLetter.studentId}/download`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Download Admission Letter
                </Button>
              </Box>
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Admin Notes"
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                sx={{ mt: 2 }}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => handleUpdateStatus('rejected')}
            color="error"
            disabled={updating}
          >
            Reject
          </Button>
          <Button
            onClick={() => handleUpdateStatus('approved')}
            color="success"
            disabled={updating}
          >
            Approve
          </Button>
          <Button onClick={() => setOpenDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminAdmissionLetters; 