import React, { useState, useEffect, useCallback } from 'react';
import { Container, Typography, Box, CircularProgress, Alert, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, IconButton, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Autocomplete, FormControl, InputLabel, Select, MenuItem, Card, Chip } from '@mui/material';
import { Edit, Delete, AddShoppingCart } from '@mui/icons-material';
import SidebarLayout from './SidebarLayout';
import { useNavigate } from 'react-router-dom';
import { useNotification } from '../contexts/NotificationContext';
import axios from '../utils/axios';

const OrderManagement = () => {
  const navigate = useNavigate();
  const { showSuccess, showError } = useNotification();
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [fieldStaff, setFieldStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Dialog states
  const [openDialog, setOpenDialog] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);
  const [formData, setFormData] = useState({
    noOrder: '',
    customer: '',
    fieldStaff: '',
    status: 'pending',
    notes: '',
    totalAmount: ''
  });

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/orders');
      setOrders(response.data.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError('Failed to fetch orders');
      showError('Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  }, [showError]);

  const fetchCustomers = useCallback(async () => {
    try {
      const response = await axios.get('/api/customers');
      setCustomers(response.data.data);
    } catch (err) {
      console.error('Error fetching customers:', err);
    }
  }, []);

  const fetchFieldStaff = useCallback(async () => {
    try {
      const response = await axios.get('/api/field-staff');
      setFieldStaff(response.data.data);
    } catch (err) {
      console.error('Error fetching field staff:', err);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
    fetchCustomers();
    fetchFieldStaff();
  }, [fetchOrders, fetchCustomers, fetchFieldStaff]);

  const handleOpenDialog = (order = null) => {
    if (order) {
      setEditingOrder(order);
      setFormData({
        noOrder: order.noOrder,
        customer: order.customer,
        fieldStaff: order.fieldStaff,
        status: order.status,
        notes: order.notes || '',
        totalAmount: order.totalAmount || ''
      });
    } else {
      setEditingOrder(null);
      setFormData({
        noOrder: '',
        customer: '',
        fieldStaff: '',
        status: 'pending',
        notes: '',
        totalAmount: ''
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingOrder(null);
    setFormData({
      noOrder: '',
      customer: '',
      fieldStaff: '',
      status: 'pending',
      notes: '',
      totalAmount: ''
    });
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleAutocompleteChange = (field, value) => {
    setFormData({
      ...formData,
      [field]: value || ''
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const submitData = {
        ...formData,
        totalAmount: formData.totalAmount ? parseFloat(formData.totalAmount) : 0
      };

      if (editingOrder) {
        await axios.put(`/api/orders/${editingOrder._id}`, submitData);
        showSuccess('Order updated successfully');
      } else {
        await axios.post('/api/orders', submitData);
        showSuccess('Order created successfully');
      }
      fetchOrders();
      handleCloseDialog();
    } catch (err) {
      console.error('Error saving order:', err);
      showError(err.response?.data?.error || 'Failed to save order');
    }
  };

  const handleDelete = async (orderId) => {
    if (window.confirm('Are you sure you want to delete this order?')) {
      try {
        await axios.delete(`/api/orders/${orderId}`);
        showSuccess('Order deleted successfully');
        fetchOrders();
      } catch (err) {
        console.error('Error deleting order:', err);
        showError('Failed to delete order');
      }
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'in_progress': return 'info';
      case 'completed': return 'success';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'pending': return 'Pending';
      case 'in_progress': return 'In Progress';
      case 'completed': return 'Completed';
      case 'cancelled': return 'Cancelled';
      default: return status;
    }
  };

  return (
    <SidebarLayout onLogout={handleLogout}>
      <Container maxWidth="xl" sx={{ mt: { xs: 2, sm: 4 }, mb: { xs: 2, sm: 4 } }}>
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
            Order Management
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
            startIcon={<AddShoppingCart />}
            onClick={() => handleOpenDialog()}
            sx={{
              borderRadius: 2,
              width: { xs: '100%', sm: 'auto' }
            }}
          >
            Add Order
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
                  <TableCell sx={{ fontWeight: 'bold' }}>No. Order</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Customer</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Orlap</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Total Amount</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Created</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {orders.map((order) => (
                  <TableRow key={order._id} hover>
                    <TableCell>{order.noOrder}</TableCell>
                    <TableCell>{order.customer}</TableCell>
                    <TableCell>{order.fieldStaff}</TableCell>
                    <TableCell>
                      <Chip
                        label={getStatusLabel(order.status)}
                        color={getStatusColor(order.status)}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>Rp {order.totalAmount?.toLocaleString('id-ID') || '0'}</TableCell>
                    <TableCell>{new Date(order.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <IconButton onClick={() => handleOpenDialog(order)} color="primary" size="small">
                        <Edit />
                      </IconButton>
                      <IconButton onClick={() => handleDelete(order._id)} color="error" size="small">
                        <Delete />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          {orders.length === 0 && !loading && (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="body1" color="text.secondary">
                No orders found. Click "Add Order" to create your first order.
              </Typography>
            </Box>
          )}
        </Card>

        {loading && <CircularProgress sx={{ mt: 2 }} />}
        {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}

        {/* Order Dialog */}
        <Dialog
          open={openDialog}
          onClose={handleCloseDialog}
          maxWidth="md"
          fullWidth
          sx={{ '& .MuiDialog-paper': { borderRadius: 3 } }}
        >
          <DialogTitle sx={{ bgcolor: 'primary.main', color: 'white', fontWeight: 'bold' }}>
            {editingOrder ? 'Edit Order' : 'Add New Order'}
          </DialogTitle>
          <form onSubmit={handleSubmit}>
            <DialogContent>
              <TextField
                fullWidth
                label="No. Order"
                name="noOrder"
                value={formData.noOrder}
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

              <Autocomplete
                fullWidth
                value={formData.customer}
                options={customers.map(c => c.namaCustomer)}
                freeSolo
                onChange={(event, newValue) => handleAutocompleteChange('customer', newValue)}
                onInputChange={(event, newInputValue) => handleAutocompleteChange('customer', newInputValue)}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Customer"
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
                )}
              />

              <Autocomplete
                fullWidth
                value={formData.fieldStaff}
                options={fieldStaff.map(fs => `${fs.kodeOrlap} - ${fs.namaOrlap}`)}
                freeSolo
                onChange={(event, newValue) => handleAutocompleteChange('fieldStaff', newValue)}
                onInputChange={(event, newInputValue) => handleAutocompleteChange('fieldStaff', newInputValue)}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Field Staff"
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
                )}
              />

              <FormControl fullWidth margin="normal">
                <InputLabel id="status-label">Status</InputLabel>
                <Select
                  labelId="status-label"
                  name="status"
                  value={formData.status}
                  label="Status"
                  onChange={handleFormChange}
                  sx={{
                    borderRadius: 2,
                    backgroundColor: 'rgba(255,255,255,0.9)',
                    '&:hover': { backgroundColor: 'rgba(255,255,255,0.95)' },
                    '&.Mui-focused': { backgroundColor: 'white' }
                  }}
                >
                  <MenuItem value="pending">Pending</MenuItem>
                  <MenuItem value="in_progress">In Progress</MenuItem>
                  <MenuItem value="completed">Completed</MenuItem>
                  <MenuItem value="cancelled">Cancelled</MenuItem>
                </Select>
              </FormControl>

              <TextField
                fullWidth
                label="Total Amount"
                name="totalAmount"
                type="number"
                value={formData.totalAmount}
                onChange={handleFormChange}
                margin="normal"
                InputProps={{
                  startAdornment: 'Rp ',
                }}
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
                label="Notes"
                name="notes"
                value={formData.notes}
                onChange={handleFormChange}
                margin="normal"
                multiline
                rows={3}
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
                {editingOrder ? 'Update' : 'Create'}
              </Button>
            </DialogActions>
          </form>
        </Dialog>
      </Container>
    </SidebarLayout>
  );
};

export default OrderManagement;