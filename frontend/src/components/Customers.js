import React, { useState, useEffect, useCallback } from 'react';
import { Container, Typography, Accordion, AccordionSummary, AccordionDetails, CircularProgress, Alert, TextField, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, InputAdornment, Box, Card, CardContent, Button, Dialog, DialogTitle, DialogContent, DialogActions, IconButton, Tabs, Tab } from '@mui/material';
import { Search, Edit, Delete, PersonAdd } from '@mui/icons-material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import SidebarLayout from './SidebarLayout';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useNotification } from '../contexts/NotificationContext';

const Customers = () => {
  const navigate = useNavigate();
  const { showSuccess, showError } = useNotification();
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [tabValue, setTabValue] = useState(0);

  // Customer form states
  const [openCustomerDialog, setOpenCustomerDialog] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [customerForm, setCustomerForm] = useState({
    kodeCustomer: '',
    namaCustomer: '',
    noHandphone: ''
  });

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  // Customer management functions
  const fetchCustomers = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('https://website-aksesoris-production.up.railway.app/api/customers', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCustomers(response.data.data);
    } catch (err) {
      console.error('Error fetching customers:', err);
      showError('Failed to fetch customers');
    }
  }, [showError]);

  const handleOpenCustomerDialog = (customer = null) => {
    if (customer) {
      setEditingCustomer(customer);
      setCustomerForm({
        kodeCustomer: customer.kodeCustomer,
        namaCustomer: customer.namaCustomer,
        noHandphone: customer.noHandphone
      });
    } else {
      setEditingCustomer(null);
      setCustomerForm({
        kodeCustomer: '',
        namaCustomer: '',
        noHandphone: ''
      });
    }
    setOpenCustomerDialog(true);
  };

  const handleCloseCustomerDialog = () => {
    setOpenCustomerDialog(false);
    setEditingCustomer(null);
    setCustomerForm({
      kodeCustomer: '',
      namaCustomer: '',
      noHandphone: ''
    });
  };

  const handleCustomerFormChange = (e) => {
    setCustomerForm({
      ...customerForm,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmitCustomer = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      if (editingCustomer) {
        await axios.put(`https://website-aksesoris-production.up.railway.app/api/customers/${editingCustomer._id}`, customerForm, {
          headers: { Authorization: `Bearer ${token}` }
        });
        showSuccess('Customer updated successfully');
      } else {
        await axios.post('https://website-aksesoris-production.up.railway.app/api/customers', customerForm, {
          headers: { Authorization: `Bearer ${token}` }
        });
        showSuccess('Customer created successfully');
      }
      fetchCustomers();
      handleCloseCustomerDialog();
    } catch (err) {
      console.error('Error saving customer:', err);
      showError(err.response?.data?.error || 'Failed to save customer');
    }
  };

  const handleDeleteCustomer = async (customerId) => {
    if (window.confirm('Are you sure you want to delete this customer?')) {
      try {
        const token = localStorage.getItem('token');
        await axios.delete(`https://website-aksesoris-production.up.railway.app/api/customers/${customerId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        showSuccess('Customer deleted successfully');
        fetchCustomers();
      } catch (err) {
        console.error('Error deleting customer:', err);
        showError('Failed to delete customer');
      }
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }

        // Fetch customers
        await fetchCustomers();

        // Fetch products
        let url = 'https://website-aksesoris-production.up.railway.app/api/products/customers';
        if (selectedCustomer) {
          url = `https://website-aksesoris-production.up.railway.app/api/products/customers?customerName=${encodeURIComponent(selectedCustomer)}`;
        }
        const response = await axios.get(url, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setProducts(response.data.data);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to fetch data. Please try again later.');
        if (err.response && err.response.status === 401) {
          navigate('/login');
        }
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(() => {
      fetchData();
    }, 300);
    return () => clearTimeout(timer);
  }, [navigate, selectedCustomer, fetchCustomers]);

  const groupedProducts = products.reduce((acc, product) => {
    const customerName = product.customer || 'Unassigned';
    if (!acc[customerName]) {
      acc[customerName] = [];
    }
    acc[customerName].push(product);
    return acc;
  }, {});

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
            Customer Management
          </Typography>
        </Box>

        <Card sx={{
          borderRadius: 3,
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
          mb: 3
        }}>
          <Tabs
            value={tabValue}
            onChange={(e, newValue) => setTabValue(newValue)}
            sx={{
              '& .MuiTab-root': {
                color: 'rgba(0,0,0,0.7)',
                '&.Mui-selected': {
                  color: 'primary.main',
                  fontWeight: 'bold'
                }
              }
            }}
          >
            <Tab label="Customer List" />
            <Tab label="Customer Products" />
          </Tabs>
        </Card>

        {tabValue === 0 && (
          <>
            {/* Customer Management Tab */}
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
                onClick={() => handleOpenCustomerDialog()}
                sx={{
                  borderRadius: 2,
                  width: { xs: '100%', sm: 'auto' }
                }}
              >
                Add Customer
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
                      <TableCell sx={{ fontWeight: 'bold' }}>Kode Customer</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Nama Customer</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>No. Handphone</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Created</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {customers.map((customer) => (
                      <TableRow key={customer._id} hover>
                        <TableCell>{customer.kodeCustomer}</TableCell>
                        <TableCell>{customer.namaCustomer}</TableCell>
                        <TableCell>{customer.noHandphone}</TableCell>
                        <TableCell>{new Date(customer.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <IconButton onClick={() => handleOpenCustomerDialog(customer)} color="primary" size="small">
                            <Edit />
                          </IconButton>
                          <IconButton onClick={() => handleDeleteCustomer(customer._id)} color="error" size="small">
                            <Delete />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              {customers.length === 0 && !loading && (
                <Box sx={{ p: 4, textAlign: 'center' }}>
                  <Typography variant="body1" color="text.secondary">
                    No customers found. Click "Add Customer" to create your first customer.
                  </Typography>
                </Box>
              )}
            </Card>
          </>
        )}

        {tabValue === 1 && (
          <>
            {/* Customer Products Tab */}
            <Card sx={{
              mb: 2,
              borderRadius: 3,
              background: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
            }}>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ color: 'rgba(0,0,0,0.8)' }}>Filter Products by Customer</Typography>
                <TextField
                  label="Filter by Customer Name"
                  variant="outlined"
                  value={selectedCustomer}
                  onChange={(e) => setSelectedCustomer(e.target.value)}
                  InputProps={{
                    startAdornment: <InputAdornment position="start"><Search /></InputAdornment>,
                    sx: { borderRadius: 2 }
                  }}
                  fullWidth
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      backgroundColor: 'rgba(255,255,255,0.1)',
                      backdropFilter: 'blur(5px)',
                      border: '1px solid rgba(255,255,255,0.3)',
                      '&:hover': {
                        backgroundColor: 'rgba(255,255,255,0.2)',
                        border: '1px solid rgba(255,255,255,0.4)'
                      },
                      '&.Mui-focused': {
                        backgroundColor: 'rgba(255,255,255,0.2)',
                        border: '1px solid rgba(255,255,255,0.5)',
                        boxShadow: '0 0 10px rgba(255,255,255,0.3)'
                      }
                    }
                  }}
                />
                <Box sx={{ mt: 1 }}>
                  <Typography variant="body2" color="text.secondary">Menampilkan {products.length} produk, {Object.keys(groupedProducts).length} pelanggan</Typography>
                </Box>
              </CardContent>
            </Card>

            {loading && <CircularProgress />}
            {error && <Alert severity="error">{error}</Alert>}

            {!loading && !error && Object.keys(groupedProducts).length === 0 && (
              <Typography>No products found.</Typography>
            )}

            {!loading && !error && Object.keys(groupedProducts).length > 0 && (
              <div>
                <Typography variant="body2" color="text.secondary">Menampilkan {products.length} produk, {Object.keys(groupedProducts).length} pelanggan</Typography>
                {Object.entries(groupedProducts).map(([customerName, customerProducts]) => (
                  <Accordion key={customerName} sx={{ mt: 2 }}>
                    <AccordionSummary
                      expandIcon={<ExpandMoreIcon />}
                      aria-controls={`${customerName}-content`}
                      id={`${customerName}-header`}
                    >
                      <Typography variant="h6">{customerName} ({customerProducts.length})</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <TableContainer component={Paper}>
                        <Table size="small" aria-label="customer products table" stickyHeader>
                          <TableHead>
                            <TableRow>
                              <TableCell>Nama Customer</TableCell>
                              <TableCell>Order No</TableCell>
                              <TableCell>Nama Produk</TableCell>
                              <TableCell>Bank</TableCell>
                              <TableCell>Status</TableCell>
                              <TableCell>Expired</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {customerProducts.map((product) => (
                              <TableRow
                                key={product._id}
                                sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                              >
                                <TableCell component="th" scope="row">
                                  {customerName}
                                </TableCell>
                                <TableCell>{product.noOrder}</TableCell>
                                <TableCell>{product.nama}</TableCell>
                                <TableCell>{product.bank}</TableCell>
                                <TableCell>{product.status}</TableCell>
                                <TableCell>{new Date(product.expired).toLocaleDateString('id-ID')}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </AccordionDetails>
                  </Accordion>
                ))}
              </div>
            )}
          </>
        )}

        {/* Customer Dialog */}
        <Dialog
          open={openCustomerDialog}
          onClose={handleCloseCustomerDialog}
          maxWidth="sm"
          fullWidth
          sx={{ '& .MuiDialog-paper': { borderRadius: 3 } }}
        >
          <DialogTitle sx={{ bgcolor: 'primary.main', color: 'white', fontWeight: 'bold' }}>
            {editingCustomer ? 'Edit Customer' : 'Add New Customer'}
          </DialogTitle>
          <form onSubmit={handleSubmitCustomer}>
            <DialogContent>
              <TextField
                fullWidth
                label="Kode Customer"
                name="kodeCustomer"
                value={customerForm.kodeCustomer}
                onChange={handleCustomerFormChange}
                margin="normal"
                required
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    backgroundColor: 'rgba(255,255,255,0.05)',
                    '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)' },
                    '&.Mui-focused': { backgroundColor: 'rgba(255,255,255,0.1)' }
                  }
                }}
              />
              <TextField
                fullWidth
                label="Nama Customer"
                name="namaCustomer"
                value={customerForm.namaCustomer}
                onChange={handleCustomerFormChange}
                margin="normal"
                required
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    backgroundColor: 'rgba(255,255,255,0.05)',
                    '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)' },
                    '&.Mui-focused': { backgroundColor: 'rgba(255,255,255,0.1)' }
                  }
                }}
              />
              <TextField
                fullWidth
                label="No. Handphone"
                name="noHandphone"
                value={customerForm.noHandphone}
                onChange={handleCustomerFormChange}
                margin="normal"
                required
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    backgroundColor: 'rgba(255,255,255,0.05)',
                    '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)' },
                    '&.Mui-focused': { backgroundColor: 'rgba(255,255,255,0.1)' }
                  }
                }}
              />
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseCustomerDialog}>Cancel</Button>
              <Button type="submit" variant="contained" sx={{ borderRadius: 2 }}>
                {editingCustomer ? 'Update' : 'Create'}
              </Button>
            </DialogActions>
          </form>
        </Dialog>
      </Container>
    </SidebarLayout>
  );
};

export default Customers;