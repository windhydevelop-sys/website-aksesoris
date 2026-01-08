import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Stepper,
  Step,
  StepLabel,
  Button,
  Card,
  CardContent,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Autocomplete,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip
} from '@mui/material';
import {
  PersonAdd,
  Group,
  AddShoppingCart,
  PhoneAndroid,
  ShoppingCart,
  CheckCircle,
  ArrowBack,
  ArrowForward
} from '@mui/icons-material';
import SidebarLayout from './SidebarLayout';
import { useNavigate } from 'react-router-dom';
import axios from '../utils/axios';
import { useNotification } from '../contexts/NotificationContext';

const steps = [
  'Input Field Staff (Orlap)',
  'Input Customer',
  'Input No Order',
  'Pilih Handphone',
  'Input Product'
];

const WorkflowManagement = () => {
  const navigate = useNavigate();
  const { showSuccess, showError } = useNotification();
  const [activeStep, setActiveStep] = useState(0);
  const [completed, setCompleted] = useState({});
  const [loading, setLoading] = useState(false);

  // Workflow data
  const [workflowData, setWorkflowData] = useState({
    customer: null,
    fieldStaff: null,
    order: null,
    handphone: null,
    product: null
  });

  // Form states
  const [customers, setCustomers] = useState([]);
  const [fieldStaff, setFieldStaff] = useState([]);
  const [handphones, setHandphones] = useState([]);

  // Dialog states
  const [customerDialog, setCustomerDialog] = useState(false);
  const [fieldStaffDialog, setFieldStaffDialog] = useState(false);
  const [orderDialog, setOrderDialog] = useState(false);
  const [handphoneDialog, setHandphoneDialog] = useState(false);
  const [productDialog, setProductDialog] = useState(false);

  // Form data
  const [customerForm, setCustomerForm] = useState({
    kodeCustomer: '',
    namaCustomer: '',
    noHandphone: ''
  });

  const [fieldStaffForm, setFieldStaffForm] = useState({
    kodeOrlap: '',
    namaOrlap: '',
    noHandphone: ''
  });

  const [orderForm, setOrderForm] = useState({
    noOrder: '',
    customer: '',
    fieldStaff: '',
    status: 'pending',
    notes: '',
    harga: ''
  });

  const [handphoneForm, setHandphoneForm] = useState({
    merek: '',
    tipe: '',
    imei: '',
    spesifikasi: '',
    kepemilikan: 'Perusahaan',
    harga: '',
    status: 'available'
  });

  const [productForm, setProductForm] = useState({
    bank: '',
    grade: '',
    kcp: '',
    nik: '',
    nama: '',
    namaIbuKandung: '',
    tempatTanggalLahir: '',
    noRek: '',
    noAtm: '',
    validThru: '',
    noHp: '',
    pinAtm: '',
    pinWondr: '',
    passWondr: '',
    email: '',
    passEmail: '',
    expired: '',
    uploadFotoId: null,
    uploadFotoSelfie: null
  });

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  // Helper function to format number fields with spaces every 4 digits
  const formatNumberWithSpaces = (value) => {
    if (!value) return value;
    // Remove all spaces first, then add spaces every 4 characters
    const cleaned = value.replace(/\s/g, '');
    return cleaned.replace(/(.{4})/g, '$1 ').trim();
  };

  // Load initial data
  useEffect(() => {
    fetchCustomers();
    fetchFieldStaff();
    fetchHandphones();
  }, []);

  const fetchCustomers = async () => {
    try {
      const response = await axios.get('/api/customers');
      setCustomers(response.data.data);
    } catch (error) {
      console.error('Error fetching customers:', error);
    }
  };

  const fetchFieldStaff = async () => {
    try {
      const response = await axios.get('/api/field-staff');
      setFieldStaff(response.data.data);
    } catch (error) {
      console.error('Error fetching field staff:', error);
    }
  };


  const fetchHandphones = async () => {
    try {
      const response = await axios.get('/api/handphones');
      setHandphones(response.data.data);
    } catch (error) {
      console.error('Error fetching handphones:', error);
    }
  };

  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleStepClick = (step) => {
    setActiveStep(step);
  };

  const handleComplete = () => {
    const newCompleted = completed;
    newCompleted[activeStep] = true;
    setCompleted(newCompleted);
    handleNext();
  };


  // Customer handlers
  const handleCustomerSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await axios.post('/api/customers', customerForm);
      setWorkflowData(prev => ({ ...prev, customer: response.data.data }));
      showSuccess('Customer berhasil dibuat');
      setCustomerDialog(false);
      fetchCustomers();
      handleComplete();
    } catch (error) {
      showError(error.response?.data?.error || 'Gagal membuat customer');
    } finally {
      setLoading(false);
    }
  };

  const handleCustomerSelect = (customer) => {
    setWorkflowData(prev => ({ ...prev, customer }));
    handleComplete();
  };

  // Field Staff handlers
  const handleFieldStaffSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await axios.post('/api/field-staff', fieldStaffForm);
      setWorkflowData(prev => ({ ...prev, fieldStaff: response.data.data }));
      showSuccess('Field staff berhasil dibuat');
      setFieldStaffDialog(false);
      fetchFieldStaff();
      handleComplete();
    } catch (error) {
      showError(error.response?.data?.error || 'Gagal membuat field staff');
    } finally {
      setLoading(false);
    }
  };

  const handleFieldStaffSelect = (staff) => {
    setWorkflowData(prev => ({ ...prev, fieldStaff: staff }));
    handleComplete();
  };

  // Order handlers
  const handleOrderSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const submitData = {
        customer: workflowData.customer.kodeCustomer,
        fieldStaff: workflowData.fieldStaff.kodeOrlap,
        status: orderForm.status,
        notes: orderForm.notes,
        harga: orderForm.harga
      };
      const response = await axios.post('/api/orders', submitData);
      setWorkflowData(prev => ({ ...prev, order: response.data.data }));
      showSuccess('Order berhasil dibuat');
      setOrderDialog(false);
      handleComplete();
    } catch (error) {
      showError(error.response?.data?.error || 'Gagal membuat order');
    } finally {
      setLoading(false);
    }
  };

  // Handphone handlers
  const handleHandphoneSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const submitData = {
        ...handphoneForm,
        assignedTo: workflowData.fieldStaff._id
      };
      const response = await axios.post('/api/handphones', submitData);
      setWorkflowData(prev => ({ ...prev, handphone: response.data.data }));
      showSuccess('Handphone berhasil dibuat dan ditugaskan');
      setHandphoneDialog(false);
      fetchHandphones();
      handleComplete();
    } catch (error) {
      showError(error.response?.data?.error || 'Gagal membuat handphone');
    } finally {
      setLoading(false);
    }
  };

  // Product handlers
  const handleProductSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('noOrder', workflowData.order.noOrder);
      formData.append('codeAgen', workflowData.fieldStaff.kodeOrlap);
      formData.append('customer', workflowData.customer.kodeCustomer);
      formData.append('fieldStaff', workflowData.fieldStaff.kodeOrlap);
      formData.append('handphoneId', workflowData.handphone._id);

      Object.entries(productForm).forEach(([key, value]) => {
        if (value === undefined || value === null || value === '') return;
        if (key === 'expired') {
          formData.append('expired', new Date(value).toISOString());
        } else if (key === 'uploadFotoId' || key === 'uploadFotoSelfie') {
          if (value instanceof File) {
            formData.append(key, value);
          }
        } else {
          formData.append(key, value);
        }
      });

      const response = await axios.post('/api/products', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setWorkflowData(prev => ({ ...prev, product: response.data.data }));
      showSuccess('Product berhasil dibuat');
      setProductDialog(false);
      handleComplete();
    } catch (error) {
      showError(error.response?.data?.error || 'Gagal membuat product');
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Box sx={{ py: 4 }}>
            <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', mb: 4, fontSize: '1.8rem' }}>
              Langkah 1: Input Field Staff (Orlap)
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 5, fontSize: '1.2rem', lineHeight: 1.6 }}>
              Buat field staff baru atau pilih field staff yang sudah ada. Kode orlap akan digunakan di order dan untuk penugasan handphone.
            </Typography>

            <Grid container spacing={4}>
              <Grid item xs={12} md={6}>
                <Button
                  variant="contained"
                  startIcon={<Group />}
                  onClick={() => setFieldStaffDialog(true)}
                  fullWidth
                  sx={{
                    mb: 3,
                    py: 2,
                    fontSize: '1.1rem',
                    fontWeight: 600
                  }}
                >
                  Buat Field Staff Baru
                </Button>
              </Grid>
              <Grid item xs={12} md={6}>
                <Autocomplete
                  options={fieldStaff}
                  getOptionLabel={(option) => option?.kodeOrlap || ''}
                  onChange={(event, newValue) => {
                    if (newValue) handleFieldStaffSelect(newValue);
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Pilih Field Staff yang Sudah Ada"
                      variant="outlined"
                      fullWidth
                      helperText="Hanya menampilkan kode orlap"
                      sx={{
                        '& .MuiInputBase-input': {
                          fontSize: '1.1rem',
                          py: 1.5
                        },
                        '& .MuiInputLabel-root': {
                          fontSize: '1.1rem'
                        }
                      }}
                    />
                  )}
                />
              </Grid>
            </Grid>

            {workflowData.fieldStaff && (
              <Alert severity="success" sx={{ mt: 2 }}>
                Field Staff dipilih: {workflowData.fieldStaff.kodeOrlap} - {workflowData.fieldStaff.namaOrlap}
              </Alert>
            )}
          </Box>
        );

      case 1:
        return (
          <Box sx={{ py: 4 }}>
            <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', mb: 4, fontSize: '1.8rem' }}>
              Langkah 2: Input Customer
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 5, fontSize: '1.2rem', lineHeight: 1.6 }}>
              Buat customer baru atau pilih customer yang sudah ada. Kode customer akan digunakan di order dan product.
            </Typography>

            <Grid container spacing={4}>
              <Grid item xs={12} md={6}>
                <Button
                  variant="contained"
                  startIcon={<PersonAdd />}
                  onClick={() => setCustomerDialog(true)}
                  fullWidth
                  sx={{
                    mb: 3,
                    py: 2,
                    fontSize: '1.1rem',
                    fontWeight: 600
                  }}
                >
                  Buat Customer Baru
                </Button>
              </Grid>
              <Grid item xs={12} md={6}>
                <Autocomplete
                  options={customers}
                  getOptionLabel={(option) => option?.kodeCustomer || ''}
                  onChange={(event, newValue) => {
                    if (newValue) handleCustomerSelect(newValue);
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Pilih Customer yang Sudah Ada"
                      variant="outlined"
                      fullWidth
                      helperText="Hanya menampilkan kode customer"
                      sx={{
                        '& .MuiInputBase-input': {
                          fontSize: '1.1rem',
                          py: 1.5
                        },
                        '& .MuiInputLabel-root': {
                          fontSize: '1.1rem'
                        }
                      }}
                    />
                  )}
                />
              </Grid>
            </Grid>

            {workflowData.customer && (
              <Alert severity="success" sx={{ mt: 2 }}>
                Customer dipilih: {workflowData.customer.kodeCustomer} - {workflowData.customer.namaCustomer}
              </Alert>
            )}
          </Box>
        );

      case 2:
        return (
          <Box sx={{ py: 4 }}>
            <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', mb: 4, fontSize: '1.8rem' }}>
              Langkah 3: Input No Order
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 5, fontSize: '1.2rem', lineHeight: 1.6 }}>
              Buat order baru yang menghubungkan customer dan field staff yang sudah dipilih.
            </Typography>

            <Alert severity="info" sx={{ mb: 4, py: 3, px: 3 }}>
              <Typography sx={{ fontSize: '1.1rem', fontWeight: 500 }}>
                Customer: {workflowData.customer?.kodeCustomer} | Field Staff: {workflowData.fieldStaff?.kodeOrlap}
              </Typography>
            </Alert>

            <Button
              variant="contained"
              startIcon={<AddShoppingCart />}
              onClick={() => setOrderDialog(true)}
              fullWidth
              sx={{
                py: 3,
                fontSize: '1.2rem',
                fontWeight: 600,
                borderRadius: 3
              }}
            >
              Buat Order Baru
            </Button>

            {workflowData.order && (
              <Alert severity="success" sx={{ mt: 2 }}>
                Order dibuat: {workflowData.order.noOrder}
              </Alert>
            )}
          </Box>
        );

      case 3:
        return (
          <Box sx={{ py: 4 }}>
            <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', mb: 4, fontSize: '1.8rem' }}>
              Langkah 4: Pilih Handphone untuk Field Staff
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 5, fontSize: '1.2rem', lineHeight: 1.6 }}>
              Pilih handphone yang sudah ada untuk field staff ini, atau buat handphone baru. 1 handphone dapat digunakan untuk beberapa produk.
            </Typography>

            <Alert severity="info" sx={{ mb: 4, py: 3, px: 3 }}>
              <Typography sx={{ fontSize: '1.1rem', fontWeight: 500 }}>
                Field Staff: {workflowData.fieldStaff?.kodeOrlap} - {workflowData.fieldStaff?.namaOrlap}
              </Typography>
            </Alert>

            {handphones.filter(hp => hp.assignedTo?._id === workflowData.fieldStaff?._id).length > 0 && (
              <Box sx={{ mb: 4 }}>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', mb: 3 }}>
                  Handphone yang sudah ada untuk field staff ini:
                </Typography>
                <TableContainer component={Paper} sx={{ mb: 3 }}>
                  <Table>
                    <TableHead sx={{ bgcolor: 'grey.100' }}>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 'bold', fontSize: '1rem', py: 2 }}>Merek</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', fontSize: '1rem', py: 2 }}>Tipe</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', fontSize: '1rem', py: 2 }}>IMEI</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', fontSize: '1rem', py: 2 }}>Status</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', fontSize: '1rem', py: 2 }}>Aksi</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {handphones
                        .filter(hp => hp.assignedTo?._id === workflowData.fieldStaff?._id)
                        .map((handphone) => (
                          <TableRow key={handphone._id} hover sx={{ '&:hover': { bgcolor: 'action.hover' } }}>
                            <TableCell sx={{ fontSize: '1rem', py: 2 }}>{handphone.merek}</TableCell>
                            <TableCell sx={{ fontSize: '1rem', py: 2 }}>{handphone.tipe}</TableCell>
                            <TableCell sx={{ fontSize: '1rem', py: 2 }}>{handphone.imei || '-'}</TableCell>
                            <TableCell sx={{ py: 2 }}>
                              <Chip
                                label={handphone.status}
                                color={
                                  handphone.status === 'available' ? 'success' :
                                  handphone.status === 'assigned' ? 'info' :
                                  handphone.status === 'in_use' ? 'warning' : 'error'
                                }
                                size="medium"
                              />
                            </TableCell>
                            <TableCell sx={{ py: 2 }}>
                              <Button
                                variant="outlined"
                                onClick={() => {
                                  setWorkflowData(prev => ({ ...prev, handphone }));
                                  handleComplete();
                                }}
                                disabled={workflowData.handphone?._id === handphone._id}
                                sx={{
                                  fontSize: '1rem',
                                  px: 3,
                                  py: 1
                                }}
                              >
                                {workflowData.handphone?._id === handphone._id ? 'Dipilih' : 'Pilih'}
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            )}

            <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
              <Button
                variant="contained"
                startIcon={<PhoneAndroid />}
                onClick={() => setHandphoneDialog(true)}
                sx={{
                  flex: 1,
                  minWidth: '250px',
                  py: 2,
                  fontSize: '1.1rem',
                  fontWeight: 600
                }}
              >
                Buat Handphone Baru
              </Button>

              {handphones.filter(hp => hp.assignedTo?._id === workflowData.fieldStaff?._id).length === 0 && (
                <Alert severity="warning" sx={{ flex: 1, py: 2 }}>
                  <Typography sx={{ fontSize: '1rem' }}>
                    Belum ada handphone untuk field staff ini. Silakan buat handphone baru.
                  </Typography>
                </Alert>
              )}
            </Box>

            {workflowData.handphone && (
              <Alert severity="success" sx={{ mt: 2 }}>
                Handphone dipilih: {workflowData.handphone.merek} {workflowData.handphone.tipe}
                {workflowData.handphone.imei && ` (IMEI: ${workflowData.handphone.imei})`}
              </Alert>
            )}
          </Box>
        );

      case 4:
        return (
          <Box sx={{ py: 4 }}>
            <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', mb: 4, fontSize: '1.8rem' }}>
              Langkah 5: Input Product
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 5, fontSize: '1.2rem', lineHeight: 1.6 }}>
              Buat product dengan data lengkap. Sistem akan otomatis menugaskan handphone yang tersedia dari field staff.
            </Typography>

            <Alert severity="info" sx={{ mb: 4, py: 3, px: 3 }}>
              <Typography sx={{ fontSize: '1.1rem', fontWeight: 500 }}>
                Order: {workflowData.order?.noOrder} | Customer: {workflowData.customer?.kodeCustomer} | Field Staff: {workflowData.fieldStaff?.kodeOrlap}
              </Typography>
            </Alert>

            <Button
              variant="contained"
              startIcon={<ShoppingCart />}
              onClick={() => setProductDialog(true)}
              fullWidth
              sx={{
                py: 3,
                fontSize: '1.2rem',
                fontWeight: 600,
                borderRadius: 3
              }}
            >
              Buat Product
            </Button>

            {workflowData.product && (
              <Alert severity="success" sx={{ mt: 2 }}>
                Product dibuat: {workflowData.product.nama}
              </Alert>
            )}
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <SidebarLayout onLogout={handleLogout}>
      <Container maxWidth="lg" sx={{ mt: 6, mb: 6, px: 4 }}>
        <Typography variant="h2" gutterBottom sx={{ mb: 6, fontWeight: 'bold', fontSize: { xs: '2.5rem', sm: '3rem' }, textAlign: 'center' }}>
          Workflow Management - Panduan Lengkap
        </Typography>

        <Card sx={{ mb: 6, borderRadius: 4, boxShadow: '0 8px 32px rgba(0,0,0,0.1)' }}>
          <CardContent sx={{ py: 6, px: 4 }}>
            <Stepper activeStep={activeStep} alternativeLabel>
              {steps.map((label, index) => (
                <Step key={label} completed={completed[index]}>
                  <StepLabel
                    onClick={() => handleStepClick(index)}
                    sx={{
                      cursor: 'pointer',
                      '& .MuiStepLabel-label': {
                        fontSize: '1.2rem',
                        fontWeight: 600,
                        mt: 2
                      }
                    }}
                  >
                    {label}
                  </StepLabel>
                </Step>
              ))}
            </Stepper>
          </CardContent>
        </Card>

        <Card sx={{ borderRadius: 4, boxShadow: '0 8px 32px rgba(0,0,0,0.1)' }}>
          <CardContent sx={{ py: 6, px: 4 }}>
            {renderStepContent(activeStep)}

            <Box sx={{ display: 'flex', flexDirection: 'row', pt: 4, pb: 2 }}>
              <Button
                color="inherit"
                disabled={activeStep === 0}
                onClick={handleBack}
                sx={{
                  mr: 3,
                  px: 4,
                  py: 2,
                  fontSize: '1.2rem',
                  fontWeight: 600,
                  borderRadius: 3
                }}
                startIcon={<ArrowBack />}
              >
                Kembali
              </Button>
              <Box sx={{ flex: '1 1 auto' }} />
              {activeStep === steps.length - 1 ? (
                <Button
                  variant="contained"
                  onClick={() => navigate('/handphone')}
                  startIcon={<CheckCircle />}
                  sx={{
                    px: 5,
                    py: 2,
                    fontSize: '1.2rem',
                    fontWeight: 600,
                    borderRadius: 3
                  }}
                >
                  Lihat Hasil di Detail Handphone
                </Button>
              ) : (
                <Button
                  variant="contained"
                  onClick={handleNext}
                  endIcon={<ArrowForward />}
                  disabled={!completed[activeStep]}
                  sx={{
                    px: 5,
                    py: 2,
                    fontSize: '1.2rem',
                    fontWeight: 600,
                    borderRadius: 3
                  }}
                >
                  Selanjutnya
                </Button>
              )}
            </Box>
          </CardContent>
        </Card>

        {/* Customer Dialog */}
        <Dialog open={customerDialog} onClose={() => setCustomerDialog(false)} maxWidth="md" fullWidth>
          <form onSubmit={handleCustomerSubmit}>
            <DialogTitle sx={{ fontSize: '1.5rem', fontWeight: 'bold', py: 2 }}>Buat Customer Baru</DialogTitle>
            <DialogContent sx={{ py: 3 }}>
              <TextField
                fullWidth
                label="Kode Customer"
                name="kodeCustomer"
                value={customerForm.kodeCustomer}
                onChange={(e) => setCustomerForm(prev => ({ ...prev, kodeCustomer: e.target.value }))}
                margin="normal"
                required
                sx={{
                  mb: 3,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    backgroundColor: 'rgba(255,255,255,0.9)',
                    '&:hover': { backgroundColor: 'rgba(255,255,255,0.95)' },
                    '&.Mui-focused': { backgroundColor: 'white' }
                  },
                  '& .MuiInputBase-input': {
                    color: 'black',
                    fontSize: '1.1rem',
                    py: 1.5
                  },
                  '& .MuiInputLabel-root': {
                    color: 'rgba(0,0,0,0.7)',
                    fontSize: '1.1rem'
                  },
                  '& .MuiInputLabel-root.Mui-focused': {
                    color: 'primary.main'
                  }
                }}
              />
              <TextField
                fullWidth
                label="Nama Customer"
                name="namaCustomer"
                value={customerForm.namaCustomer}
                onChange={(e) => setCustomerForm(prev => ({ ...prev, namaCustomer: e.target.value }))}
                margin="normal"
                required
                sx={{
                  mb: 3,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    backgroundColor: 'rgba(255,255,255,0.9)',
                    '&:hover': { backgroundColor: 'rgba(255,255,255,0.95)' },
                    '&.Mui-focused': { backgroundColor: 'white' }
                  },
                  '& .MuiInputBase-input': {
                    color: 'black',
                    fontSize: '1.1rem',
                    py: 1.5
                  },
                  '& .MuiInputLabel-root': {
                    color: 'rgba(0,0,0,0.7)',
                    fontSize: '1.1rem'
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
                value={customerForm.noHandphone}
                onChange={(e) => setCustomerForm(prev => ({ ...prev, noHandphone: e.target.value }))}
                margin="normal"
                required
                sx={{
                  mb: 3,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    backgroundColor: 'rgba(255,255,255,0.9)',
                    '&:hover': { backgroundColor: 'rgba(255,255,255,0.95)' },
                    '&.Mui-focused': { backgroundColor: 'white' }
                  },
                  '& .MuiInputBase-input': {
                    color: 'black',
                    fontSize: '1.1rem',
                    py: 1.5
                  },
                  '& .MuiInputLabel-root': {
                    color: 'rgba(0,0,0,0.7)',
                    fontSize: '1.1rem'
                  },
                  '& .MuiInputLabel-root.Mui-focused': {
                    color: 'primary.main'
                  }
                }}
              />
            </DialogContent>
            <DialogActions sx={{ py: 3, px: 3 }}>
              <Button onClick={() => setCustomerDialog(false)} sx={{ fontSize: '1.1rem', px: 3, py: 1.5 }}>Batal</Button>
              <Button type="submit" variant="contained" disabled={loading} sx={{ fontSize: '1.1rem', px: 4, py: 1.5 }}>
                {loading ? <CircularProgress size={24} /> : 'Buat Customer'}
              </Button>
            </DialogActions>
          </form>
        </Dialog>

        {/* Field Staff Dialog */}
        <Dialog open={fieldStaffDialog} onClose={() => setFieldStaffDialog(false)} maxWidth="md" fullWidth>
          <form onSubmit={handleFieldStaffSubmit}>
            <DialogTitle sx={{ fontSize: '1.5rem', fontWeight: 'bold', py: 2 }}>Buat Field Staff Baru</DialogTitle>
            <DialogContent sx={{ py: 3 }}>
              <TextField
                fullWidth
                label="Kode Orlap"
                name="kodeOrlap"
                value={fieldStaffForm.kodeOrlap}
                onChange={(e) => setFieldStaffForm(prev => ({ ...prev, kodeOrlap: e.target.value }))}
                margin="normal"
                required
                sx={{
                  mb: 3,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    backgroundColor: 'rgba(255,255,255,0.9)',
                    '&:hover': { backgroundColor: 'rgba(255,255,255,0.95)' },
                    '&.Mui-focused': { backgroundColor: 'white' }
                  },
                  '& .MuiInputBase-input': {
                    color: 'black',
                    fontSize: '1.1rem',
                    py: 1.5
                  },
                  '& .MuiInputLabel-root': {
                    color: 'rgba(0,0,0,0.7)',
                    fontSize: '1.1rem'
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
                value={fieldStaffForm.namaOrlap}
                onChange={(e) => setFieldStaffForm(prev => ({ ...prev, namaOrlap: e.target.value }))}
                margin="normal"
                required
                sx={{
                  mb: 3,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    backgroundColor: 'rgba(255,255,255,0.9)',
                    '&:hover': { backgroundColor: 'rgba(255,255,255,0.95)' },
                    '&.Mui-focused': { backgroundColor: 'white' }
                  },
                  '& .MuiInputBase-input': {
                    color: 'black',
                    fontSize: '1.1rem',
                    py: 1.5
                  },
                  '& .MuiInputLabel-root': {
                    color: 'rgba(0,0,0,0.7)',
                    fontSize: '1.1rem'
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
                value={fieldStaffForm.noHandphone}
                onChange={(e) => setFieldStaffForm(prev => ({ ...prev, noHandphone: e.target.value }))}
                margin="normal"
                required
                sx={{
                  mb: 3,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    backgroundColor: 'rgba(255,255,255,0.9)',
                    '&:hover': { backgroundColor: 'rgba(255,255,255,0.95)' },
                    '&.Mui-focused': { backgroundColor: 'white' }
                  },
                  '& .MuiInputBase-input': {
                    color: 'black',
                    fontSize: '1.1rem',
                    py: 1.5
                  },
                  '& .MuiInputLabel-root': {
                    color: 'rgba(0,0,0,0.7)',
                    fontSize: '1.1rem'
                  },
                  '& .MuiInputLabel-root.Mui-focused': {
                    color: 'primary.main'
                  }
                }}
              />
            </DialogContent>
            <DialogActions sx={{ py: 3, px: 3 }}>
              <Button onClick={() => setFieldStaffDialog(false)} sx={{ fontSize: '1.1rem', px: 3, py: 1.5 }}>Batal</Button>
              <Button type="submit" variant="contained" disabled={loading} sx={{ fontSize: '1.1rem', px: 4, py: 1.5 }}>
                {loading ? <CircularProgress size={24} /> : 'Buat Field Staff'}
              </Button>
            </DialogActions>
          </form>
        </Dialog>

        {/* Order Dialog */}
        <Dialog open={orderDialog} onClose={() => setOrderDialog(false)} maxWidth="md" fullWidth>
          <form onSubmit={handleOrderSubmit}>
            <DialogTitle sx={{ fontSize: '1.5rem', fontWeight: 'bold', py: 2 }}>Buat Order Baru</DialogTitle>
            <DialogContent sx={{ py: 3 }}>
              <TextField
                fullWidth
                label="Total Amount"
                name="harga"
                type="number"
                value={orderForm.harga}
                onChange={(e) => setOrderForm(prev => ({ ...prev, harga: e.target.value }))}
                margin="normal"
                sx={{
                  mb: 3,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    backgroundColor: 'rgba(255,255,255,0.9)',
                    '&:hover': { backgroundColor: 'rgba(255,255,255,0.95)' },
                    '&.Mui-focused': { backgroundColor: 'white' }
                  },
                  '& .MuiInputBase-input': {
                    color: 'black',
                    fontSize: '1.1rem',
                    py: 1.5
                  },
                  '& .MuiInputLabel-root': {
                    color: 'rgba(0,0,0,0.7)',
                    fontSize: '1.1rem'
                  },
                  '& .MuiInputLabel-root.Mui-focused': {
                    color: 'primary.main'
                  }
                }}
              />
              <FormControl fullWidth margin="normal">
                <InputLabel>Status</InputLabel>
                <Select
                  value={orderForm.status}
                  onChange={(e) => setOrderForm(prev => ({ ...prev, status: e.target.value }))}
                  label="Status"
                >
                  <MenuItem value="pending">Pending</MenuItem>
                  <MenuItem value="in_progress">In Progress</MenuItem>
                  <MenuItem value="completed">Completed</MenuItem>
                </Select>
              </FormControl>
              <TextField
                fullWidth
                label="Notes"
                name="notes"
                value={orderForm.notes}
                onChange={(e) => setOrderForm(prev => ({ ...prev, notes: e.target.value }))}
                margin="normal"
                multiline
                rows={3}
              />
            </DialogContent>
            <DialogActions sx={{ py: 3, px: 3 }}>
              <Button onClick={() => setOrderDialog(false)} sx={{ fontSize: '1.1rem', px: 3, py: 1.5 }}>Batal</Button>
              <Button type="submit" variant="contained" disabled={loading} sx={{ fontSize: '1.1rem', px: 4, py: 1.5 }}>
                {loading ? <CircularProgress size={24} /> : 'Buat Order'}
              </Button>
            </DialogActions>
          </form>
        </Dialog>

        {/* Handphone Dialog */}
        <Dialog open={handphoneDialog} onClose={() => setHandphoneDialog(false)} maxWidth="md" fullWidth>
          <form onSubmit={handleHandphoneSubmit}>
            <DialogTitle sx={{ fontSize: '1.5rem', fontWeight: 'bold', py: 2 }}>Buat Handphone Baru</DialogTitle>
            <DialogContent sx={{ py: 3 }}>
              <TextField
                fullWidth
                label="Merek"
                name="merek"
                value={handphoneForm.merek}
                onChange={(e) => setHandphoneForm(prev => ({ ...prev, merek: e.target.value }))}
                margin="normal"
                required
                sx={{
                  mb: 3,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    backgroundColor: 'rgba(255,255,255,0.9)',
                    '&:hover': { backgroundColor: 'rgba(255,255,255,0.95)' },
                    '&.Mui-focused': { backgroundColor: 'white' }
                  },
                  '& .MuiInputBase-input': {
                    color: 'black',
                    fontSize: '1.1rem',
                    py: 1.5
                  },
                  '& .MuiInputLabel-root': {
                    color: 'rgba(0,0,0,0.7)',
                    fontSize: '1.1rem'
                  },
                  '& .MuiInputLabel-root.Mui-focused': {
                    color: 'primary.main'
                  }
                }}
              />
              <TextField
                fullWidth
                label="Tipe"
                name="tipe"
                value={handphoneForm.tipe}
                onChange={(e) => setHandphoneForm(prev => ({ ...prev, tipe: e.target.value }))}
                margin="normal"
                required
                sx={{
                  mb: 3,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    backgroundColor: 'rgba(255,255,255,0.9)',
                    '&:hover': { backgroundColor: 'rgba(255,255,255,0.95)' },
                    '&.Mui-focused': { backgroundColor: 'white' }
                  },
                  '& .MuiInputBase-input': {
                    color: 'black',
                    fontSize: '1.1rem',
                    py: 1.5
                  },
                  '& .MuiInputLabel-root': {
                    color: 'rgba(0,0,0,0.7)',
                    fontSize: '1.1rem'
                  },
                  '& .MuiInputLabel-root.Mui-focused': {
                    color: 'primary.main'
                  }
                }}
              />
              <TextField
                fullWidth
                label="IMEI"
                name="imei"
                value={handphoneForm.imei}
                onChange={(e) => setHandphoneForm(prev => ({ ...prev, imei: e.target.value }))}
                margin="normal"
              />
              <TextField
                fullWidth
                label="Harga"
                name="harga"
                type="number"
                value={handphoneForm.harga}
                onChange={(e) => setHandphoneForm(prev => ({ ...prev, harga: e.target.value }))}
                margin="normal"
              />
              <TextField
                fullWidth
                label="Spesifikasi"
                name="spesifikasi"
                value={handphoneForm.spesifikasi}
                onChange={(e) => setHandphoneForm(prev => ({ ...prev, spesifikasi: e.target.value }))}
                margin="normal"
                multiline
                rows={2}
              />
              <TextField
                fullWidth
                label="Kepemilikan"
                name="kepemilikan"
                value={handphoneForm.kepemilikan}
                onChange={(e) => setHandphoneForm(prev => ({ ...prev, kepemilikan: e.target.value }))}
                margin="normal"
              />
            </DialogContent>
            <DialogActions sx={{ py: 3, px: 3 }}>
              <Button onClick={() => setHandphoneDialog(false)} sx={{ fontSize: '1.1rem', px: 3, py: 1.5 }}>Batal</Button>
              <Button type="submit" variant="contained" disabled={loading} sx={{ fontSize: '1.1rem', px: 4, py: 1.5 }}>
                {loading ? <CircularProgress size={24} /> : 'Buat Handphone'}
              </Button>
            </DialogActions>
          </form>
        </Dialog>

        {/* Product Dialog - Simplified for demo */}
        <Dialog open={productDialog} onClose={() => setProductDialog(false)} maxWidth="lg" fullWidth>
            <form onSubmit={handleProductSubmit}>
              <DialogTitle sx={{ fontSize: '1.5rem', fontWeight: 'bold', py: 2 }}>Buat Product Baru</DialogTitle>
              <DialogContent>
                <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Bank"
                    name="bank"
                    value={productForm.bank}
                    onChange={(e) => setProductForm(prev => ({ ...prev, bank: e.target.value }))}
                    margin="normal"
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Grade"
                    name="grade"
                    value={productForm.grade}
                    onChange={(e) => setProductForm(prev => ({ ...prev, grade: e.target.value }))}
                    margin="normal"
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="KCP"
                    name="kcp"
                    value={productForm.kcp}
                    onChange={(e) => setProductForm(prev => ({ ...prev, kcp: e.target.value }))}
                    margin="normal"
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="NIK (16 digit)"
                    name="nik"
                    value={formatNumberWithSpaces(productForm.nik)}
                    onChange={(e) => {
                      const rawValue = e.target.value.replace(/\s/g, '');
                      if (rawValue.length <= 16 && /^\d*$/.test(rawValue)) {
                        setProductForm(prev => ({ ...prev, nik: rawValue }));
                      }
                    }}
                    margin="normal"
                    required
                    placeholder="1234 5678 9012 3456"
                    helperText="Format otomatis dengan spasi setiap 4 digit"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="NIK"
                    name="nik"
                    value={productForm.nik}
                    onChange={(e) => setProductForm(prev => ({ ...prev, nik: e.target.value }))}
                    margin="normal"
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Nama"
                    name="nama"
                    value={productForm.nama}
                    onChange={(e) => setProductForm(prev => ({ ...prev, nama: e.target.value }))}
                    margin="normal"
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Nama Ibu Kandung"
                    name="namaIbuKandung"
                    value={productForm.namaIbuKandung}
                    onChange={(e) => setProductForm(prev => ({ ...prev, namaIbuKandung: e.target.value }))}
                    margin="normal"
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Tempat/Tanggal Lahir"
                    name="tempatTanggalLahir"
                    value={productForm.tempatTanggalLahir}
                    onChange={(e) => setProductForm(prev => ({ ...prev, tempatTanggalLahir: e.target.value }))}
                    margin="normal"
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="No. Rekening (10-18 digit)"
                    name="noRek"
                    value={productForm.noRek}
                    onChange={(e) => setProductForm(prev => ({ ...prev, noRek: e.target.value }))}
                    margin="normal"
                    required
                    inputProps={{ maxLength: 18 }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="No. ATM (16 digit)"
                    name="noAtm"
                    value={formatNumberWithSpaces(productForm.noAtm)}
                    onChange={(e) => {
                      const rawValue = e.target.value.replace(/\s/g, '');
                      if (rawValue.length <= 16 && /^\d*$/.test(rawValue)) {
                        setProductForm(prev => ({ ...prev, noAtm: rawValue }));
                      }
                    }}
                    margin="normal"
                    required
                    placeholder="1234 5678 9012 3456"
                    helperText="Format otomatis dengan spasi setiap 4 digit"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Valid Thru"
                    name="validThru"
                    value={productForm.validThru}
                    onChange={(e) => {
                      let value = e.target.value.replace(/\D/g, ''); // Only allow digits
                      if (value.length >= 2) {
                        value = value.slice(0, 2) + '/' + value.slice(2, 4);
                      }
                      if (value.length <= 5) { // MM/YY format
                        setProductForm(prev => ({ ...prev, validThru: value }));
                      }
                    }}
                    margin="normal"
                    required
                    placeholder="MM/YY"
                    helperText="Format: MM/YY (contoh: 12/25)"
                    inputProps={{ maxLength: 5 }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="No. HP"
                    name="noHp"
                    value={productForm.noHp}
                    onChange={(e) => setProductForm(prev => ({ ...prev, noHp: e.target.value }))}
                    margin="normal"
                    required
                    placeholder="081234567890"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="PIN ATM (4-6 digit)"
                    name="pinAtm"
                    type="password"
                    value={productForm.pinAtm}
                    onChange={(e) => setProductForm(prev => ({ ...prev, pinAtm: e.target.value }))}
                    margin="normal"
                    required
                    inputProps={{ maxLength: 6 }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="PIN Mbanking (4-6 digit)"
                    name="pinWondr"
                    type="password"
                    value={productForm.pinWondr}
                    onChange={(e) => setProductForm(prev => ({ ...prev, pinWondr: e.target.value }))}
                    margin="normal"
                    required
                    inputProps={{ maxLength: 6 }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Password Mbanking (min 6 karakter)"
                    name="passWondr"
                    type="password"
                    value={productForm.passWondr}
                    onChange={(e) => setProductForm(prev => ({ ...prev, passWondr: e.target.value }))}
                    margin="normal"
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Email"
                    name="email"
                    type="email"
                    value={productForm.email}
                    onChange={(e) => setProductForm(prev => ({ ...prev, email: e.target.value }))}
                    margin="normal"
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Password Email (min 6 karakter)"
                    name="passEmail"
                    type="password"
                    value={productForm.passEmail}
                    onChange={(e) => setProductForm(prev => ({ ...prev, passEmail: e.target.value }))}
                    margin="normal"
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Expired Date"
                    name="expired"
                    type="date"
                    value={productForm.expired}
                    onChange={(e) => setProductForm(prev => ({ ...prev, expired: e.target.value }))}
                    margin="normal"
                    required
                    InputLabelProps={{
                      shrink: true,
                    }}
                    inputProps={{
                      min: new Date().toISOString().split('T')[0], // Set minimum date to today
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        backgroundColor: 'rgba(255,255,255,0.9)',
                        '&:hover': { backgroundColor: 'rgba(255,255,255,0.95)' },
                        '&.Mui-focused': { backgroundColor: 'white' }
                      },
                      '& .MuiInputBase-input': {
                        color: 'black',
                        fontSize: '16px', // Prevents zoom on iOS
                      },
                      '& .MuiInputLabel-root': {
                        color: 'rgba(0,0,0,0.7)'
                      },
                      '& .MuiInputLabel-root.Mui-focused': {
                        color: 'primary.main'
                      }
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ mt: 1 }}>
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>Upload Foto KTP (opsional)</Typography>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0] || null;
                        setProductForm(prev => ({ ...prev, uploadFotoId: file }));
                      }}
                    />
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ mt: 1 }}>
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>Upload Foto Selfie (opsional)</Typography>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0] || null;
                        setProductForm(prev => ({ ...prev, uploadFotoSelfie: file }));
                      }}
                    />
                  </Box>
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions sx={{ py: 3, px: 3 }}>
              <Button onClick={() => setProductDialog(false)} sx={{ fontSize: '1.1rem', px: 3, py: 1.5 }}>Batal</Button>
              <Button type="submit" variant="contained" disabled={loading} sx={{ fontSize: '1.1rem', px: 4, py: 1.5 }}>
                {loading ? <CircularProgress size={24} /> : 'Buat Product'}
              </Button>
            </DialogActions>
          </form>
        </Dialog>
      </Container>
    </SidebarLayout>
  );
};

export default WorkflowManagement;
