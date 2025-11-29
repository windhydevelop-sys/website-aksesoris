import React, { useState, useEffect, useCallback } from 'react';
import axios from '../utils/axios';
import * as XLSX from 'xlsx';
import { Page, Text, View, Document, StyleSheet, pdf } from '@react-pdf/renderer';
import {
  Button, Container, Typography, Box, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, TextField, Dialog, DialogActions, DialogContent,
  DialogTitle, IconButton, Alert, Autocomplete,
  FormControl, InputLabel, Select, MenuItem, Chip, InputAdornment,
  Tabs, Tab, Grid, Card, CardContent
} from '@mui/material';
import { Search, Event, TrendingUp, People, Smartphone, Inventory } from '@mui/icons-material';
import { Edit, Delete, Add, CloudUpload, CloudDownload, PictureAsPdf } from '@mui/icons-material';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import './Dashboard.css';
import { useNavigate } from 'react-router-dom';
import { useNotification } from '../contexts/NotificationContext';
import SidebarLayout from './SidebarLayout';

// Create styles for the PDF document
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    padding: 15,
    size: 'A5',
  },
  section: {
    margin: 5,
    padding: 5,
    flexGrow: 1,
  },
  header: {
    fontSize: 18,
    marginBottom: 10,
    textAlign: 'center',
    color: '#333333',
  },
  subHeader: {
    fontSize: 14,
    marginBottom: 8,
    color: '#555555',
  },
  text: {
    fontSize: 10,
    marginBottom: 3,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 3,
  },
  label: {
    width: 80,
    fontSize: 10,
    fontWeight: 'bold',
  },
  value: {
    flex: 1,
    fontSize: 10,
  },
  productImage: {
    width: '100%',
    height: 'auto',
    marginBottom: 10,
  },
  footer: {
    fontSize: 8,
    textAlign: 'center',
    marginTop: 10,
    color: '#777777',
  },
  table: {
    display: "table",
    width: "auto",
    borderStyle: "solid",
    borderWidth: 1,
    borderColor: '#bfbfbf',
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  tableRow: {
    margin: "auto",
    flexDirection: "row"
  },
  tableColHeader: {
    width: "16.66%",
    borderStyle: "solid",
    borderWidth: 1,
    borderColor: '#bfbfbf',
    borderLeftWidth: 0,
    borderTopWidth: 0,
    backgroundColor: '#f0f0f0',
    padding: 3,
    fontSize: 8,
    fontWeight: 'bold',
  },
  tableCol: {
    width: "16.66%",
    borderStyle: "solid",
    borderWidth: 1,
    borderColor: '#bfbfbf',
    borderLeftWidth: 0,
    borderTopWidth: 0,
    padding: 3,
    fontSize: 8,
  },
});


const InvoicePdfDocument = ({ product }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <Text style={styles.header}>INVOICE</Text>

      <View style={styles.section}>
        <Text style={styles.subHeader}>Detail Invoice</Text>
        <View style={styles.row}>
          <Text style={styles.label}>No. Invoice:</Text>
          <Text style={styles.value}>{product.noOrder || '-'}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Tanggal:</Text>
          <Text style={styles.value}>{new Date().toLocaleDateString('id-ID')}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.subHeader}>Ditagihkan Kepada</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Nama Pelanggan:</Text>
          <Text style={styles.value}>{product.customer || '-'}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.subHeader}>Detail Produk</Text>
        <View style={styles.table}>
          <View style={styles.tableRow}>
            <Text style={styles.tableColHeader}>Merek</Text>
            <Text style={styles.tableColHeader}>Tipe</Text>
            <Text style={styles.tableColHeader}>IMEI</Text>
            <Text style={styles.tableColHeader}>Spesifikasi</Text>
            <Text style={styles.tableColHeader}>Kepemilikan</Text>
            <Text style={styles.tableColHeader}>Harga</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={styles.tableCol}>{product.handphone || '-'}</Text>
            <Text style={styles.tableCol}>{product.tipeHandphone || '-'}</Text>
            <Text style={styles.tableCol}>{product.imeiHandphone || '-'}</Text>
            <Text style={styles.tableCol}>{product.spesifikasi || '-'}</Text>
            <Text style={styles.tableCol}>{product.kepemilikan || '-'}</Text>
            <Text style={styles.tableCol}>Rp {product.harga ? product.harga.toLocaleString('id-ID') : '-'}</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.subHeader}>Total Pembayaran</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Total:</Text>
          <Text style={styles.value}>Rp {product.harga ? product.harga.toLocaleString('id-ID') : '-'}</Text>
        </View>
      </View>

      <Text style={styles.footer}>Terima kasih atas kepercayaan Anda!</Text>
    </Page>
  </Document>
);

const formatCardNumber = (value) => {
  // Remove all non-digits
  const cleaned = value.replace(/\D/g, '');
  // Add space every 4 digits
  const formatted = cleaned.replace(/(\d{4})(?=\d)/g, '$1 ');
  return formatted;
};

const cleanCardNumber = (value) => {
  return value.replace(/\s/g, '');
};

const validateIMEI = (imei, products, editingId) => {
  if (!imei) return '';
  if (!/^\d{15}$/.test(imei)) return 'IMEI harus 15 digit angka';
  const isDuplicate = products.some(p => p.imeiHandphone === imei && (!editingId || p._id !== editingId));
  if (isDuplicate) return 'IMEI sudah digunakan';
  return '';
};

const initialFormState = {
  orderNumber: '',
  customer: '',
  fieldStaff: '',
  bank: '',
  grade: '',
  kcp: '',
  status: 'pending',
  expired: '',
  uploadFotoId: null,
  uploadFotoSelfie: null,
  handphone: '',
  tipeHandphone: '',
  imeiHandphone: '',
  spesifikasi: '',
  kepemilikan: '',
  harga: '',
  handphoneId: '',
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
};

const Dashboard = ({ setToken }) => {
  const { showSuccess, showError } = useNotification();
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [filterExpired, setFilterExpired] = useState('');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(initialFormState);
  const [imeiError, setImeiError] = useState('');
  const [imeiDuplicate, setImeiDuplicate] = useState(false);
  const [selectedProductForInvoice, setSelectedProductForInvoice] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [fieldStaff, setFieldStaff] = useState([]);
  const [orders, setOrders] = useState([]);
  const [availableHandphones, setAvailableHandphones] = useState([]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    let formattedValue = value;

    // Apply formatting for card-like inputs
    if (name === 'nik' || name === 'noAtm') {
      formattedValue = formatCardNumber(value);
    }

    setForm({ ...form, [name]: formattedValue });

    // Validate IMEI
    if (name === 'imeiHandphone') {
      const error = validateIMEI(formattedValue, products, editing);
      setImeiError(error);
      setImeiDuplicate(!!error && error.includes('sudah digunakan'));
    }
  };


  const [notifications, setNotifications] = useState([]);

  const token = localStorage.getItem('token');
  const navigate = useNavigate();

  const fetchProducts = useCallback(async () => {
    try {
      const res = await axios.get('/api/products', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProducts(res.data.data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  }, [token]);

  const fetchCustomers = useCallback(async () => {
    try {
      const res = await axios.get('/api/customers');
      setCustomers(res.data.data || []);
    } catch (error) {
      console.error('Error fetching customers:', error);
    }
  }, []);

  const fetchFieldStaff = useCallback(async () => {
    try {
      const res = await axios.get('/api/field-staff');
      setFieldStaff(res.data.data || []);
    } catch (error) {
      console.error('Error fetching field staff:', error);
    }
  }, []);

  const fetchOrders = useCallback(async () => {
    try {
      const res = await axios.get('/api/orders');
      setOrders(res.data.data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  }, []);

  const fetchAvailableHandphones = useCallback(async (fieldStaffId) => {
    if (!fieldStaffId) {
      setAvailableHandphones([]);
      return;
    }
    try {
      const res = await axios.get('/api/handphones');
      const handphones = res.data.data || [];
      // Filter handphones by assignedTo (fieldStaffId) and status 'available'
      const available = handphones.filter(h =>
        h.assignedTo && h.assignedTo._id === fieldStaffId && h.status === 'available'
      );
      setAvailableHandphones(available);
    } catch (error) {
      console.error('Error fetching available handphones:', error);
      setAvailableHandphones([]);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
    fetchCustomers();
    fetchFieldStaff();
    fetchOrders();
  }, [fetchProducts, fetchCustomers, fetchFieldStaff, fetchOrders]);



  const [filterStatus, setFilterStatus] = useState('');



  useEffect(() => {
    if (Array.isArray(products)) {
      let filtered = [...products];
      if (search) {
        filtered = filtered.filter(p => (p.nama && p.nama.toLowerCase().includes(search.toLowerCase())) || (p.noOrder && p.noOrder.includes(search)));
      }
      if (filterExpired) {
        const now = new Date();
        const days = parseInt(filterExpired);
        filtered = filtered.filter(p => {
          const exp = new Date(p.expired);
          const diff = (exp - now) / (1000 * 60 * 60 * 24);
          return diff <= days && diff > 0;
        });
      }
      if (filterStatus) {
        filtered = filtered.filter(p => p.status === filterStatus);
      }
      setFilteredProducts(filtered);
    }
  }, [products, search, filterExpired, filterStatus]);

  useEffect(() => {
    if (Array.isArray(products)) {
      const now = new Date();
      const alerts = products.filter(p => {
        const exp = new Date(p.expired);
        const diff = (exp - now) / (1000 * 60 * 60 * 24);
        return diff <= 7 && diff > 0;
      });
      setNotifications(alerts);

      // Calculate chart data
      const statusCounts = products.reduce((acc, product) => {
        acc[product.status] = (acc[product.status] || 0) + 1;
        return acc;
      }, {});
      const data = [
        { name: 'Pending', value: statusCounts.pending || 0, color: '#ff9800' },
        { name: 'In Progress', value: statusCounts.in_progress || 0, color: '#2196f3' },
        { name: 'Completed', value: statusCounts.completed || 0, color: '#4caf50' },
      ];
      setChartData(data);
    }
  }, [products]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
  };

  const handleOpen = (product = null) => {
    if (product) {
      setEditing(product._id);
      setForm({
        ...product,
        orderNumber: product.orderNumber || '',
        customer: product.customer || '',
        fieldStaff: product.fieldStaff || '',
        expired: product.expired ? product.expired.split('T')[0] : '',
        status: product.status || 'pending',
        uploadFotoId: product.uploadFotoId || '',
        uploadFotoSelfie: product.uploadFotoSelfie || '',
        handphone: product.handphone || '',
        tipeHandphone: product.tipeHandphone || '',
        imeiHandphone: product.imeiHandphone || '',
        spesifikasi: product.spesifikasi || '',
        kepemilikan: product.kepemilikan || '',
        harga: product.harga || '',
        handphoneId: product.handphoneId || '',
        bank: product.bank || '',
        grade: product.grade || '',
        kcp: product.kcp || '',
        nik: product.nik ? formatCardNumber(product.nik) : '',
        nama: product.nama || '',
        namaIbuKandung: product.namaIbuKandung || '',
        tempatTanggalLahir: product.tempatTanggalLahir || '',
        noRek: product.noRek || '',
        noAtm: product.noAtm ? formatCardNumber(product.noAtm) : '',
        validThru: product.validThru || '',
        noHp: product.noHp || '',
        pinAtm: product.pinAtm || '',
        pinWondr: product.pinWondr || '',
        passWondr: product.passWondr || '',
        email: product.email || '',
        passEmail: product.passEmail || '',
      });
      setImeiError(validateIMEI(product.imeiHandphone || '', products, product._id));
      setImeiDuplicate(products.some(p => p.imeiHandphone === product.imeiHandphone && p._id !== product._id));

      // Fetch available handphones for the selected field staff
      const selectedStaff = fieldStaff.find(fs => `${fs.kodeOrlap} - ${fs.namaOrlap}` === product.fieldStaff);
      if (selectedStaff) {
        fetchAvailableHandphones(selectedStaff._id);
      }

    } else {
      setEditing(null);
      setForm(initialFormState);
      setImeiError('');
      setImeiDuplicate(false);
      setAvailableHandphones([]);

    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    // Only clear selectedProductForInvoice if the product is not completed
    // This ensures the invoice button remains visible for completed products
    if (selectedProductForInvoice && selectedProductForInvoice.status !== 'completed') {
      setSelectedProductForInvoice(null);
    } else if (!selectedProductForInvoice) {
      setSelectedProductForInvoice(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const formData = new FormData();

    // Append all form fields except file objects
    for (const key in form) {
      if (key !== 'uploadFotoId' && key !== 'uploadFotoSelfie' && form[key] !== null && form[key] !== undefined) {
        let value = form[key];
        // Clean formatted card numbers for backend
        if ((key === 'nik' || key === 'noAtm') && typeof value === 'string') {
          value = cleanCardNumber(value);
        }
        // Handle date format for 'expired'
        if (key === 'expired' && value) {
          formData.append(key, new Date(value).toISOString());
        } else {
          formData.append(key, value);
        }
      }
    }

    // Append file objects if they are new File objects
    if (form.uploadFotoId instanceof File) {
      formData.append('uploadFotoId', form.uploadFotoId);
    } else if (typeof form.uploadFotoId === 'string' && form.uploadFotoId) {
      // If it's a string, it's an existing filename, send it back
      formData.append('uploadFotoId', form.uploadFotoId);
    }

    if (form.uploadFotoSelfie instanceof File) {
      formData.append('uploadFotoSelfie', form.uploadFotoSelfie);
    } else if (typeof form.uploadFotoSelfie === 'string' && form.uploadFotoSelfie) {
      // If it's a string, it's an existing filename, send it back
      formData.append('uploadFotoSelfie', form.uploadFotoSelfie);
    }

    try {
      let response;
      if (editing) {
        response = await axios.put(`/api/products/${editing}`, formData, {
          headers: { 'x-auth-token': token, 'Content-Type': 'multipart/form-data' }
        });
      } else {
        response = await axios.post('/api/products', formData, {
          headers: { 'x-auth-token': token, 'Content-Type': 'multipart/form-data' }
        });
      }

      // console.log('Response:', response.data); // Debug log
      fetchProducts();
      setSelectedProductForInvoice(response.data.data); // Update selected product for invoice
      handleClose();
      showSuccess(editing ? 'Produk berhasil diperbarui!' : 'Produk baru berhasil ditambahkan!');
    } catch (error) {
      console.error('Error saving product:', error);
      // console.error('Error response:', error.response?.data); // Debug log

      if (error.response?.data?.errors) {
        // Show validation errors
        const errorMessages = error.response.data.errors.map(err => err).join('\n');
        showError('Error validasi: ' + errorMessages);
      } else {
        showError('Error menyimpan produk: ' + (error.response?.data?.error || error.message));
      }
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`/api/products/${id}`, {
        headers: { 'x-auth-token': token }
      });
      fetchProducts();
      showSuccess('Produk berhasil dihapus!');
    } catch (error) {
      console.error('Error deleting product:', error);
      showError('Error menghapus produk: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleExport = () => {
    const ws = XLSX.utils.json_to_sheet(filteredProducts);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Products');
    XLSX.writeFile(wb, 'products.xlsx');
  };


  const handlePrintInvoice = async (product) => {
    const blob = await pdf(<InvoicePdfDocument product={product} />).toBlob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `invoice_${product.noOrder}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const imeiSuggestions = Array.from(new Set(products.map(p => p.imeiHandphone).filter(Boolean)));

  return (
    <SidebarLayout onLogout={handleLogout}>
      <Container maxWidth="lg">
        <Box sx={{ mt: 8 }}>
        <Typography variant="h4" component="h1" gutterBottom className="page-title">
          Input Product
        </Typography>
        {notifications.length > 0 && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            {notifications.length} produk akan expired dalam 7 hari!
          </Alert>
        )}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              borderRadius: 3,
              boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
              transition: 'transform 0.3s',
              '&:hover': { transform: 'translateY(-5px)' }
            }}>
              <CardContent sx={{ textAlign: 'center' }}>
                <Inventory sx={{ fontSize: 40, mb: 1 }} />
                <Typography variant="h4" component="div">{products.length}</Typography>
                <Typography variant="body2">Total Produk</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{
              background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
              color: 'white',
              borderRadius: 3,
              boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
              transition: 'transform 0.3s',
              '&:hover': { transform: 'translateY(-5px)' }
            }}>
              <CardContent sx={{ textAlign: 'center' }}>
                <People sx={{ fontSize: 40, mb: 1 }} />
                <Typography variant="h4" component="div">{Array.from(new Set(products.map(p => p.customer).filter(Boolean))).length}</Typography>
                <Typography variant="body2">Jumlah Customer</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{
              background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
              color: 'white',
              borderRadius: 3,
              boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
              transition: 'transform 0.3s',
              '&:hover': { transform: 'translateY(-5px)' }
            }}>
              <CardContent sx={{ textAlign: 'center' }}>
                <Smartphone sx={{ fontSize: 40, mb: 1 }} />
                <Typography variant="h4" component="div">{Array.from(new Set(products.map(p => p.handphone).filter(Boolean))).length}</Typography>
                <Typography variant="body2">Jumlah Handphone</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{
              background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
              color: 'white',
              borderRadius: 3,
              boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
              transition: 'transform 0.3s',
              '&:hover': { transform: 'translateY(-5px)' }
            }}>
              <CardContent sx={{ textAlign: 'center' }}>
                <TrendingUp sx={{ fontSize: 40, mb: 1 }} />
                <Typography variant="h4" component="div">{notifications.length}</Typography>
                <Typography variant="body2">Expired Soon</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} md={6}>
            <Card sx={{ borderRadius: 3, boxShadow: '0 8px 32px rgba(0,0,0,0.1)' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>Status Distribution</Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card sx={{ borderRadius: 3, boxShadow: '0 8px 32px rgba(0,0,0,0.1)' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>Status Overview</Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="value" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
        <Card sx={{
          mb: 3,
          borderRadius: 3,
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
        }}>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ color: 'rgba(0,0,0,0.8)' }}>Filters & Actions</Typography>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
              <TextField
                label="Cari produk"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                InputProps={{
                  startAdornment: <InputAdornment position="start"><Search /></InputAdornment>,
                  sx: { borderRadius: 2 }
                }}
                sx={{
                  minWidth: 220,
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
                variant="outlined"
              />
              <TextField
                label="Filter expired (hari)"
                value={filterExpired}
                onChange={(e) => setFilterExpired(e.target.value)}
                InputProps={{
                  startAdornment: <InputAdornment position="start"><Event /></InputAdornment>,
                  sx: { borderRadius: 2 }
                }}
                sx={{
                  minWidth: 220,
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
                variant="outlined"
              />
              <TextField
                select
                label="Status"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                sx={{
                  minWidth: 150,
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
                variant="outlined"
              >
                <MenuItem value="">Semua</MenuItem>
                <MenuItem value="pending">Tertunda</MenuItem>
                <MenuItem value="in_progress">Dalam Proses</MenuItem>
                <MenuItem value="completed">Selesai</MenuItem>
              </TextField>
              <Button variant="contained" onClick={() => handleOpen()} sx={{ borderRadius: 2 }}>
                <Add sx={{ mr: 1 }} />
                Add Product
              </Button>
              <Button
                variant="contained"
                color="secondary"
                onClick={handleExport}
                startIcon={<CloudDownload />}
                sx={{ borderRadius: 2 }}
              >
                Export Data
              </Button>
              {selectedProductForInvoice && selectedProductForInvoice.status === 'completed' && (
                <Button
                  variant="contained"
                  color="success"
                  onClick={() => handlePrintInvoice(selectedProductForInvoice)}
                  startIcon={<PictureAsPdf />}
                  sx={{ borderRadius: 2 }}
                >
                  Cetak Invoice
                </Button>
              )}
            </Box>
            <Typography variant="body2" color="text.secondary">Menampilkan {filteredProducts.length} dari {products.length} produk</Typography>
          </CardContent>
        </Card>
        <Card sx={{ borderRadius: 3, boxShadow: '0 8px 32px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
          <TableContainer>
            <Table aria-label="product table" stickyHeader>
              <TableHead sx={{ bgcolor: 'grey.100' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold' }}>No. Order</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Nama</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Handphone</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Expired</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Complaint</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredProducts.map((product, index) => (
                  <TableRow
                    key={product._id}
                    hover
                    sx={{
                      cursor: 'pointer',
                      bgcolor: index % 2 === 0 ? 'grey.50' : 'white',
                      '&:hover': { bgcolor: 'action.hover' }
                    }}
                    onClick={() => navigate(`/product-details/${product._id}`)}
                  >
                    <TableCell>{product.noOrder}</TableCell>
                    <TableCell>{product.nama}</TableCell>
                    <TableCell>{product.handphone ? `${product.handphone} ${product.tipeHandphone || ''}` : '-'}</TableCell>
                    <TableCell>{new Date(product.expired).toLocaleDateString('id-ID')}</TableCell>
                    <TableCell>
                      <Chip
                        label={product.status === 'pending' ? 'Tertunda' : product.status === 'in_progress' ? 'Dalam Proses' : 'Selesai'}
                        color={product.status === 'pending' ? 'error' : product.status === 'in_progress' ? 'warning' : 'success'}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>{product.complaint}</TableCell>
                    <TableCell onClick={(e)=>e.stopPropagation()}>
                      <IconButton onClick={(ev) => {ev.stopPropagation(); handleOpen(product);}} color="primary"><Edit /></IconButton>
                      <IconButton onClick={(ev) => {ev.stopPropagation(); handleDelete(product._id);}} color="error"><Delete /></IconButton>
                      {product.status === 'completed' && (
                        <IconButton onClick={(ev) => {ev.stopPropagation(); handlePrintInvoice(product);}} color="success">
                          <PictureAsPdf />
                        </IconButton>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
        <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth sx={{ '& .MuiDialog-paper': { borderRadius: 3 } }}>
          <DialogTitle sx={{ bgcolor: 'primary.main', color: 'white', fontWeight: 'bold' }}>{editing ? 'Edit Product' : 'Add Product'}</DialogTitle>
          <form onSubmit={handleSubmit}>
          <DialogContent>
              <Box>
                <Autocomplete
                  fullWidth
                  value={form.orderNumber}
                  options={orders.map(o => o.noOrder)}
                  freeSolo
                  onChange={(event, newValue) => { setForm({ ...form, orderNumber: newValue || '' }); }}
                  onInputChange={(event, newInputValue) => { setForm({ ...form, orderNumber: newInputValue || '' }); }}
                  renderInput={(params) => <TextField {...params} label="Order Number" name="orderNumber" placeholder="Pilih nomor order dari daftar atau ketik baru" margin="normal" required />}
                />
                <Autocomplete
                  fullWidth
                  value={form.customer}
                  options={customers.map(c => c.namaCustomer)}
                  freeSolo
                  onChange={(event, newValue) => { setForm({ ...form, customer: newValue || '' }); }}
                  onInputChange={(event, newInputValue) => { setForm({ ...form, customer: newInputValue || '' }); }}
                  renderInput={(params) => <TextField {...params} label="Customer" name="customer" placeholder="Pilih customer dari daftar atau ketik baru" margin="normal" required />}
                />
                <Autocomplete
                  fullWidth
                  value={form.fieldStaff}
                  options={fieldStaff.map(fs => `${fs.kodeOrlap} - ${fs.namaOrlap}`)}
                  freeSolo
                  onChange={(event, newValue) => {
                    setForm({ ...form, fieldStaff: newValue || '', handphoneId: '' });
                    // Find the selected field staff ID to fetch available handphones
                    const selectedStaff = fieldStaff.find(fs => `${fs.kodeOrlap} - ${fs.namaOrlap}` === newValue);
                    fetchAvailableHandphones(selectedStaff ? selectedStaff._id : null);
                  }}
                  onInputChange={(event, newInputValue) => { setForm({ ...form, fieldStaff: newInputValue || '' }); }}
                  renderInput={(params) => <TextField {...params} label="Orang Lapangan" name="fieldStaff" placeholder="Pilih orang lapangan dari daftar atau ketik baru" margin="normal" />}
                />
                <Autocomplete
                  fullWidth
                  value={availableHandphones.find(h => h._id === form.handphoneId) || null}
                  options={availableHandphones}
                  getOptionLabel={(option) => option ? `${option.merek} ${option.tipe} - IMEI: ${option.imei || 'N/A'}` : ''}
                  onChange={(event, newValue) => {
                    if (newValue) {
                      setForm({
                        ...form,
                        handphoneId: newValue._id,
                        handphone: newValue.merek,
                        tipeHandphone: newValue.tipe,
                        imeiHandphone: newValue.imei || '',
                        spesifikasi: newValue.spesifikasi,
                        kepemilikan: newValue.kepemilikan
                      });
                    } else {
                      setForm({
                        ...form,
                        handphoneId: '',
                        handphone: '',
                        tipeHandphone: '',
                        imeiHandphone: '',
                        spesifikasi: '',
                        kepemilikan: ''
                      });
                    }
                  }}
                  renderInput={(params) => <TextField {...params} label="Handphone" placeholder="Pilih handphone yang tersedia (opsional)" margin="normal" />}
                  disabled={!form.fieldStaff || availableHandphones.length === 0}
                />
                <TextField fullWidth label="Bank" name="bank" placeholder="Bebas, contoh: BCA, Mandiri, BNI, BRI" value={form.bank} onChange={handleChange} margin="normal" required />
                <TextField fullWidth label="Grade" name="grade" placeholder="Bebas, contoh: A, VIP, PREMIUM, GOLD" value={form.grade} onChange={handleChange} margin="normal" required />
                <TextField fullWidth label="KCP" name="kcp" placeholder="Bebas, contoh: KCP001 atau CABANG-JAKARTA" value={form.kcp} onChange={handleChange} margin="normal" required />
                <TextField fullWidth label="NIK" name="nik" placeholder="16 digit angka, contoh: 3201010101010001" value={form.nik} onChange={handleChange} margin="normal" required />
                <TextField fullWidth label="Nama" name="nama" placeholder="Bebas, contoh: Ahmad Susanto" value={form.nama} onChange={handleChange} margin="normal" required />
                <TextField fullWidth label="Nama Ibu Kandung" name="namaIbuKandung" placeholder="Bebas, contoh: Siti Aminah" value={form.namaIbuKandung} onChange={handleChange} margin="normal" required />
                <TextField fullWidth label="Tempat / Tanggal Lahir" name="tempatTanggalLahir" placeholder="Bebas, contoh: Jakarta, 01 Januari 1990" value={form.tempatTanggalLahir} onChange={handleChange} margin="normal" required />
                <TextField fullWidth label="No. Rekening" name="noRek" placeholder="10-18 digit angka, contoh: 123456789012" value={form.noRek} onChange={handleChange} margin="normal" required />
                
                <TextField fullWidth label="No. ATM" name="noAtm" placeholder="16 digit angka, contoh: 1234567890123456" value={form.noAtm} onChange={handleChange} margin="normal" required />
                <TextField fullWidth label="Valid Thru" name="validThru" placeholder="Bebas, contoh: 12/25 atau Dec 2025" value={form.validThru} onChange={handleChange} margin="normal" required />
                <TextField fullWidth label="No. HP" name="noHp" placeholder="Format Indonesia, contoh: 081234567890" value={form.noHp} onChange={handleChange} margin="normal" required />
                <TextField fullWidth label="PIN ATM" name="pinAtm" placeholder="4-6 digit angka, contoh: 1234" value={form.pinAtm} onChange={handleChange} margin="normal" required />
                <TextField fullWidth label="PIN Mbanking" name="pinWondr" placeholder="4-6 digit angka, contoh: 5678" value={form.pinWondr} onChange={handleChange} margin="normal" required />
                <TextField fullWidth label="Password Mbanking" name="passWondr" placeholder="Minimal 6 karakter, contoh: wondrpass123" value={form.passWondr} onChange={handleChange} margin="normal" required />
                <TextField fullWidth label="Email" name="email" placeholder="Format email valid, contoh: user@example.com" value={form.email} onChange={handleChange} margin="normal" required />
                <TextField fullWidth label="Password Email" name="passEmail" placeholder="Minimal 6 karakter, contoh: emailpass123" value={form.passEmail} onChange={handleChange} margin="normal" required />
                <TextField fullWidth label="Merek Handphone" name="handphone" placeholder="Merek HP, contoh: Samsung" value={form.handphone} onChange={handleChange} margin="normal" required />
                <TextField fullWidth label="Tipe Handphone" name="tipeHandphone" placeholder="Tipe/model HP, contoh: Galaxy A50" value={form.tipeHandphone} onChange={handleChange} margin="normal" required />
                <TextField fullWidth label="IMEI Handphone" name="imeiHandphone" placeholder="15 digit angka, contoh: 123456789012345" value={form.imeiHandphone} onChange={handleChange} margin="normal" error={!!imeiError} helperText={imeiError} />
                <TextField fullWidth label="Spesifikasi" name="spesifikasi" placeholder="Detail spesifikasi HP" value={form.spesifikasi} onChange={handleChange} margin="normal" multiline rows={3} required />
                <TextField fullWidth label="Kepemilikan" name="kepemilikan" placeholder="Status kepemilikan, contoh: Milik Sendiri" value={form.kepemilikan} onChange={handleChange} margin="normal" required />
                <TextField fullWidth label="Harga" name="harga" type="number" placeholder="Harga dalam Rupiah" value={form.harga} onChange={handleChange} margin="normal" required />
                <TextField fullWidth label="Expired" name="expired" type="date" placeholder="Pilih tanggal expired" value={form.expired} onChange={handleChange} margin="normal" required InputLabelProps={{ shrink: true }} />
                <FormControl fullWidth margin="normal">
                  <InputLabel id="status-label">Status</InputLabel>
                  <Select labelId="status-label" id="status" name="status" value={form.status} label="Status" onChange={handleChange}>
                    <MenuItem value="pending">Tertunda</MenuItem>
                    <MenuItem value="in_progress">Dalam Proses</MenuItem>
                    <MenuItem value="completed">Selesai</MenuItem>
                  </Select>
                </FormControl>
                {form.status === 'in_progress' && (
                  <TextField fullWidth label="Complaint" name="complaint" placeholder="Deskripsi keluhan atau masalah" value={form.complaint || ''} onChange={handleChange} margin="normal" multiline rows={4} />
                )}
                <Box mt={2} mb={1}>
                  <input accept="image/*" style={{ display: 'none' }} id="upload-foto-id" type="file" onChange={(e) => setForm({ ...form, uploadFotoId: e.target.files[0] })} />
                  <label htmlFor="upload-foto-id">
                    <Button variant="contained" component="span" startIcon={<CloudUpload />}>Upload Foto KTP</Button>
                  </label>
                  {form.uploadFotoId && (
                    <Box mt={1}>
                      <img src={typeof form.uploadFotoId === 'string' ? `${axios.defaults.baseURL}/uploads/${form.uploadFotoId}` : URL.createObjectURL(form.uploadFotoId)} alt="Foto KTP" style={{ maxWidth: '100%', maxHeight: '200px' }} />
                      <IconButton onClick={() => setForm({ ...form, uploadFotoId: null })} color="error" size="small"><Delete /></IconButton>
                    </Box>
                  )}
                  <Typography variant="caption" display="block" gutterBottom>Upload Foto KTP (opsional)</Typography>
                </Box>
                <Box mt={2} mb={1}>
                  <input accept="image/*" style={{ display: 'none' }} id="upload-foto-selfie" type="file" onChange={(e) => setForm({ ...form, uploadFotoSelfie: e.target.files[0] })} />
                  <label htmlFor="upload-foto-selfie">
                    <Button variant="contained" component="span" startIcon={<CloudUpload />}>Upload Foto Selfie</Button>
                  </label>
                  {form.uploadFotoSelfie && (
                    <Box mt={1}>
                      <img src={typeof form.uploadFotoSelfie === 'string' ? `${axios.defaults.baseURL}/uploads/${form.uploadFotoSelfie}` : URL.createObjectURL(form.uploadFotoSelfie)} alt="Foto Selfie" style={{ maxWidth: '100%', maxHeight: '200px' }} />
                      <IconButton onClick={() => setForm({ ...form, uploadFotoSelfie: null })} color="error" size="small"><Delete /></IconButton>
                    </Box>
                  )}
                  <Typography variant="caption" display="block" gutterBottom>Upload Foto Selfie (opsional)</Typography>
                </Box>
              </Box>
        </DialogContent>
          <DialogActions>
            <Button onClick={handleClose}>Cancel</Button>
            <Button type="submit" disabled={!!imeiError}>Save</Button>
          </DialogActions>
        </form>
      </Dialog>

        {/* PDF Import Dialog */}
        
        </Box>
      </Container>
    </SidebarLayout>
  );
};

export default Dashboard;