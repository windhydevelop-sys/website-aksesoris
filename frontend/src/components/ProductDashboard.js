import React, { useState, useEffect, useCallback } from 'react';
import {
  Container, Typography, Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  IconButton, Button, Chip, TextField, MenuItem, Select, FormControl, InputLabel,
  Paper, CircularProgress, Alert
} from '@mui/material';
import { Edit, Refresh } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import SidebarLayout from './SidebarLayout';
import { useNotification } from '../contexts/NotificationContext';
import axios from '../utils/axios';

const ProductDashboard = () => {
  const { showError } = useNotification();
  const navigate = useNavigate();
  
  // State management
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Filter states
  const [statusFilter, setStatusFilter] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch products
  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      console.log('📦 Fetching products...');
      
      const response = await axios.get('/api/products');
      
      if (response.data.success) {
        console.log('✅ Products fetched:', response.data.data.length);
        setProducts(response.data.data);
        setError(null);
      } else {
        throw new Error(response.data.error || 'Failed to fetch products');
      }
    } catch (err) {
      console.error('❌ Error fetching products:', err);
      setError(err.message);
      showError('Gagal memuat daftar produk');
    } finally {
      setLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Filter products
  const filteredProducts = products.filter(product => {
    // Status filter
    if (statusFilter && product.status !== statusFilter) return false;
    
    // Payment filter
    if (paymentFilter === 'paid' && !product.sudahBayar) return false;
    if (paymentFilter === 'unpaid' && product.sudahBayar) return false;
    
    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        product.noOrder?.toLowerCase().includes(searchLower) ||
        product.nama?.toLowerCase().includes(searchLower) ||
        product.nik?.toLowerCase().includes(searchLower)
      );
    }
    
    return true;
  });

  // Handle edit - navigate to product detail
  const handleEdit = (product) => {
    console.log('📝 Opening product detail:', product._id);
    navigate(`/product-details/${product._id}`);
  };

  // Get status chip color
  const getStatusChipColor = (status) => {
    switch (status) {
      case 'pending': return 'default';
      case 'in_progress': return 'info';
      case 'completed': return 'success';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  // Get payment status label
  const getPaymentLabel = (sudahBayar) => {
    return sudahBayar ? '✅ Lunas' : '⏳ Belum';
  };

  return (
    <SidebarLayout>
      <Container maxWidth="lg" sx={{ py: 3 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1">
            📦 Dashboard Produk
          </Typography>
          <Button
            variant="contained"
            startIcon={<Refresh />}
            onClick={fetchProducts}
            disabled={loading}
          >
            Refresh
          </Button>
        </Box>

        {/* Filters */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr', md: '1fr 1fr 1fr 2fr' }, gap: 2 }}>
            {/* Status Filter */}
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                label="Status"
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <MenuItem value="">Semua Status</MenuItem>
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="in_progress">In Progress</MenuItem>
                <MenuItem value="completed">Completed</MenuItem>
                <MenuItem value="cancelled">Cancelled</MenuItem>
              </Select>
            </FormControl>

            {/* Payment Filter */}
            <FormControl fullWidth>
              <InputLabel>Pembayaran</InputLabel>
              <Select
                value={paymentFilter}
                label="Pembayaran"
                onChange={(e) => setPaymentFilter(e.target.value)}
              >
                <MenuItem value="">Semua</MenuItem>
                <MenuItem value="paid">Lunas</MenuItem>
                <MenuItem value="unpaid">Belum Lunas</MenuItem>
              </Select>
            </FormControl>

            {/* Search */}
            <TextField
              fullWidth
              placeholder="Cari: No Order, NIK, Nama"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              variant="outlined"
            />

            {/* Row Count */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
              <Typography variant="body2" color="text.secondary">
                Menampilkan: <strong>{filteredProducts.length}</strong> / {products.length} produk
              </Typography>
            </Box>
          </Box>
        </Paper>

        {/* Error */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Loading */}
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        )}

        {/* Products Table */}
        {!loading && filteredProducts.length === 0 ? (
          <Alert severity="info">
            Tidak ada produk yang sesuai dengan filter
          </Alert>
        ) : (
          <TableContainer component={Paper}>
            <Table>
              <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                <TableRow>
                  <TableCell><strong>No Order</strong></TableCell>
                  <TableCell><strong>NIK</strong></TableCell>
                  <TableCell><strong>Nama</strong></TableCell>
                  <TableCell><strong>Bank</strong></TableCell>
                  <TableCell align="right"><strong>Harga</strong></TableCell>
                  <TableCell><strong>Status</strong></TableCell>
                  <TableCell><strong>Pembayaran</strong></TableCell>
                  <TableCell align="center"><strong>Actions</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredProducts.map((product) => (
                  <TableRow key={product._id} hover>
                    <TableCell>{product.noOrder || '-'}</TableCell>
                    <TableCell>{product.nik || '-'}</TableCell>
                    <TableCell>{product.nama || '-'}</TableCell>
                    <TableCell>{product.bank || '-'}</TableCell>
                    <TableCell align="right">
                      {product.harga ? `Rp ${product.harga.toLocaleString('id-ID')}` : '-'}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={product.status || 'pending'}
                        color={getStatusChipColor(product.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={getPaymentLabel(product.sudahBayar)}
                        color={product.sudahBayar ? 'success' : 'warning'}
                        variant="outlined"
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="center">
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => handleEdit(product)}
                        title="Edit produk dan catat pembayaran"
                      >
                        <Edit />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Container>
    </SidebarLayout>
  );
};

export default ProductDashboard;
