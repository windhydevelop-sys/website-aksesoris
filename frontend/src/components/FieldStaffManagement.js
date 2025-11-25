import React, { useState, useEffect, useCallback } from 'react';
import { Container, Typography, Box, CircularProgress, Alert, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, IconButton, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Card } from '@mui/material';
import { Edit, Delete, PersonAdd } from '@mui/icons-material';
import SidebarLayout from './SidebarLayout';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useNotification } from '../contexts/NotificationContext';

const FieldStaffManagement = () => {
  const navigate = useNavigate();
  const { showSuccess, showError } = useNotification();
  const [fieldStaff, setFieldStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Dialog states
  const [openDialog, setOpenDialog] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [formData, setFormData] = useState({
    kodeOrlap: '',
    namaOrlap: '',
    noHandphone: ''
  });

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const fetchFieldStaff = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/field-staff');
      setFieldStaff(response.data.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching field staff:', err);
      setError('Failed to fetch field staff');
      showError('Failed to fetch field staff');
    } finally {
      setLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    fetchFieldStaff();
  }, [fetchFieldStaff]);

  const handleOpenDialog = (staff = null) => {
    if (staff) {
      setEditingStaff(staff);
      setFormData({
        kodeOrlap: staff.kodeOrlap,
        namaOrlap: staff.namaOrlap,
        noHandphone: staff.noHandphone
      });
    } else {
      setEditingStaff(null);
      setFormData({
        kodeOrlap: '',
        namaOrlap: '',
        noHandphone: ''
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingStaff(null);
    setFormData({
      kodeOrlap: '',
      namaOrlap: '',
      noHandphone: ''
    });
  };

  const handleFormChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingStaff) {
        await axios.put(`/api/field-staff/${editingStaff._id}`, formData);
        showSuccess('Field staff updated successfully');
      } else {
        await axios.post('/api/field-staff', formData);
        showSuccess('Field staff created successfully');
      }
      fetchFieldStaff();
      handleCloseDialog();
    } catch (err) {
      console.error('Error saving field staff:', err);
      showError(err.response?.data?.error || 'Failed to save field staff');
    }
  };

  const handleDelete = async (staffId) => {
    if (window.confirm('Are you sure you want to delete this field staff?')) {
      try {
        await axios.delete(`/api/field-staff/${staffId}`);
        showSuccess('Field staff deleted successfully');
        fetchFieldStaff();
      } catch (err) {
        console.error('Error deleting field staff:', err);
        showError('Failed to delete field staff');
      }
    }
  };

  return (
    <SidebarLayout onLogout={handleLogout}>
      <Container maxWidth="lg" sx={{ mt: { xs: 2, sm: 4 }, mb: { xs: 2, sm: 4 } }}>
        <Box sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          justifyContent: { xs: 'center', sm: 'space-between' },
          alignItems: { xs: 'stretch', sm: 'center' },
          gap: 2,
          mb: 3
        }}>
          <Typography
            variant="h4"
            component="h1"
            sx={{ textAlign: { xs: 'center', sm: 'left' } }}
          >
            Field Staff Management
          </Typography>
        </Box>

        <Box sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          justifyContent: { xs: 'center', sm: 'flex-end' },
          alignItems: { xs: 'stretch', sm: 'center' },
          gap: 2,
          mb: 3
        }}>
          <Button
            variant="contained"
            startIcon={<PersonAdd />}
            onClick={() => handleOpenDialog()}
            sx={{
              borderRadius: 2,
              width: { xs: '100%', sm: 'auto' }
            }}
          >
            Add Field Staff
          </Button>
        </Box>

        <Card sx={{
          borderRadius: 3,
          boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
          overflow: 'hidden'
        }}>
          <TableContainer>
            <Table>
              <TableHead sx={{ bgcolor: 'grey.100' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold' }}>Kode Orlap</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Nama Orlap</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>No. Handphone</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Created</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {fieldStaff.map((staff) => (
                  <TableRow key={staff._id} hover>
                    <TableCell>{staff.kodeOrlap}</TableCell>
                    <TableCell>{staff.namaOrlap}</TableCell>
                    <TableCell>{staff.noHandphone}</TableCell>
                    <TableCell>{new Date(staff.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <IconButton onClick={() => handleOpenDialog(staff)} color="primary" size="small">
                        <Edit />
                      </IconButton>
                      <IconButton onClick={() => handleDelete(staff._id)} color="error" size="small">
                        <Delete />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          {fieldStaff.length === 0 && !loading && (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="body1" color="text.secondary">
                No field staff found. Click "Add Field Staff" to create your first field staff.
              </Typography>
            </Box>
          )}
        </Card>

        {loading && <CircularProgress sx={{ mt: 2 }} />}
        {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}

        {/* Field Staff Dialog */}
        <Dialog
          open={openDialog}
          onClose={handleCloseDialog}
          maxWidth="sm"
          fullWidth
          sx={{ '& .MuiDialog-paper': { borderRadius: 3 } }}
        >
          <DialogTitle sx={{ bgcolor: 'primary.main', color: 'white', fontWeight: 'bold' }}>
            {editingStaff ? 'Edit Field Staff' : 'Add New Field Staff'}
          </DialogTitle>
          <form onSubmit={handleSubmit}>
            <DialogContent>
              <TextField
                fullWidth
                label="Kode Orlap"
                name="kodeOrlap"
                value={formData.kodeOrlap}
                onChange={handleFormChange}
                margin="normal"
                required
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    backgroundColor: 'rgba(255,255,255,0.9)',
                    '&:hover': { backgroundColor: 'rgba(255,255,255,0.95)' },
                    '&.Mui-focused': { backgroundColor: 'white' }
                  },
                  '& .MuiInputBase-input': {
                    color: 'black'
                  },
                  '& .MuiInputLabel-root': {
                    color: 'rgba(0,0,0,0.7)'
                  },
                  '& .MuiInputLabel-root.Mui-focused': {
                    color: 'primary.main'
                  }
                }}
              />
              <TextField
                fullWidth
                label="Nama Orlap"
                name="namaOrlap"
                value={formData.namaOrlap}
                onChange={handleFormChange}
                margin="normal"
                required
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    backgroundColor: 'rgba(255,255,255,0.9)',
                    '&:hover': { backgroundColor: 'rgba(255,255,255,0.95)' },
                    '&.Mui-focused': { backgroundColor: 'white' }
                  },
                  '& .MuiInputBase-input': {
                    color: 'black'
                  },
                  '& .MuiInputLabel-root': {
                    color: 'rgba(0,0,0,0.7)'
                  },
                  '& .MuiInputLabel-root.Mui-focused': {
                    color: 'primary.main'
                  }
                }}
              />
              <TextField
                fullWidth
                label="No. Handphone"
                name="noHandphone"
                value={formData.noHandphone}
                onChange={handleFormChange}
                margin="normal"
                required
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    backgroundColor: 'rgba(255,255,255,0.9)',
                    '&:hover': { backgroundColor: 'rgba(255,255,255,0.95)' },
                    '&.Mui-focused': { backgroundColor: 'white' }
                  },
                  '& .MuiInputBase-input': {
                    color: 'black'
                  },
                  '& .MuiInputLabel-root': {
                    color: 'rgba(0,0,0,0.7)'
                  },
                  '& .MuiInputLabel-root.Mui-focused': {
                    color: 'primary.main'
                  }
                }}
              />
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseDialog}>Cancel</Button>
              <Button type="submit" variant="contained" sx={{ borderRadius: 2 }}>
                {editingStaff ? 'Update' : 'Create'}
              </Button>
            </DialogActions>
          </form>
        </Dialog>
      </Container>
    </SidebarLayout>
  );
};

export default FieldStaffManagement;