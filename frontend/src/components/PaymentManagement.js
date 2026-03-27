import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Container,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Typography,
  Alert,
  Chip,
  CircularProgress,
  Card,
  CardContent,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Checkbox
} from '@mui/material';
import { Payment, Print, Receipt } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import axios_instance from '../utils/axios';
import SidebarLayout from './SidebarLayout';
import { useNotification } from '../contexts/NotificationContext';

const PaymentManagement = () => {
  const navigate = useNavigate();
  
  // State management
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { showSuccess, showError } = useNotification();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [activeTab, setActiveTab] = useState(0); // 0: Piutang, 1: Hutang
  const [settleDialog, setSettleDialog] = useState({ open: false, product: null, type: '' });
  const [selectedAccount, setSelectedAccount] = useState('Rekening A');
  const [isSettling, setIsSettling] = useState(false);
  const [selectedProductIds, setSelectedProductIds] = useState([]);
  const [isPrinting, setIsPrinting] = useState(false);

  /**
   * Fetch unpaid products that are completed (ready for payment)
   */
  const fetchUnpaidProducts = useCallback(async () => {
    try {
      setLoading(true);
      console.log('📦 Fetching completed unpaid products...');
      
      // Fetch unpaid products with status=completed only
      const response = await axios_instance.get('/api/products', {
        params: { sudahBayar: false, status: 'completed' }
      });
      
      if (response.data.success) {
        console.log('✅ Completed unpaid products fetched:', response.data.data.length);
        setProducts(response.data.data);
        setError(null);
      } else {
        throw new Error(response.data.error || 'Failed to fetch products');
      }
    } catch (err) {
      console.error('❌ Error fetching unpaid products:', err);
      setError('Gagal memuat data piutang siap bayar. Silakan coba lagi.');
      showError('Gagal memuat data piutang siap bayar');
    } finally {
      setLoading(false);
    }
  }, [showError]);

  /**
   * Filter products based on search and status
   */
  const getFilteredProducts = useCallback(() => {
    let filtered = products;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(p =>
        p.noOrder?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.nama?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.bank?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (filterStatus) {
      filtered = filtered.filter(p => p.status === filterStatus);
    }

    return filtered;
  }, [products, searchTerm, filterStatus]);

  /**
   * Format harga with dot separator (e.g., 1.000.000)
   */
  const formatHargaDot = (harga) => {
    if (!harga) return '0';
    return harga.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };

  /**
   * Handle navigate to product detail
   */
  const handleViewProduct = (productId) => {
    navigate(`/product-details/${productId}`);
  };

  // Fetch products on mount
  useEffect(() => {
    fetchUnpaidProducts();
  }, [fetchUnpaidProducts]);

  /**
   * Calculate totals
   */
  const piutangProducts = products.filter(p => p.pembayaranPiutangStatus !== 'paid');
  const hutangProducts = products.filter(p => p.pembayaranHutangStatus !== 'paid');
  
  const totalPiutang = piutangProducts.reduce((sum, p) => sum + (p.hargaJual || p.harga || 0), 0);
  const totalHutang = hutangProducts.reduce((sum, p) => sum + (p.hargaBeli || 0), 0);

  const handleSettleClick = (product, type) => {
    setSettleDialog({ open: true, product, type });
  };

  const handleConfirmSettle = async () => {
    setIsSettling(true);
    try {
      const { product, type } = settleDialog;
      const updateData = {};
      
      if (type === 'piutang') {
        updateData.pembayaranPiutangStatus = 'paid';
        updateData.pembayaranPiutangAccount = selectedAccount;
      } else {
        updateData.pembayaranHutangStatus = 'paid';
        updateData.pembayaranHutangAccount = selectedAccount;
      }

      const response = await axios_instance.put(`/api/products/${product._id}`, updateData);
      if (response.data.success) {
        showSuccess(`Berhasil melunasi ${type === 'piutang' ? 'Tagihan Customer' : 'Hutang Orlap'}`);
        fetchUnpaidProducts();
        setSettleDialog({ open: false, product: null, type: '' });
        // Clear selection if the settled product was selected
        setSelectedProductIds(prev => prev.filter(id => id !== product._id));
      }
    } catch (err) {
      showError('Gagal melakukan pelunasan');
    } finally {
      setIsSettling(false);
    }
  };

  const handleSelectToggle = (id) => {
    setSelectedProductIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleSelectAll = (checked, items) => {
    if (checked) {
      const ids = items.map(p => p._id);
      setSelectedProductIds(prev => [...new Set([...prev, ...ids])]);
    } else {
      const idsToRemove = items.map(p => p._id);
      setSelectedProductIds(prev => prev.filter(id => !idsToRemove.includes(id)));
    }
  };

  const handlePrintAction = async (type) => {
    if (selectedProductIds.length === 0) return;
    
    setIsPrinting(true);
    try {
      const selectedProducts = products.filter(p => selectedProductIds.includes(p._id));
      
      let endpoint = '';
      let payload = { productIds: selectedProductIds };

      if (type === 'piutang') {
        // Validate same customer
        const customer = selectedProducts[0].customer;
        const allSame = selectedProducts.every(p => p.customer === customer);
        if (!allSame) {
          showError('Semua produk yang dipilih harus dari Customer yang sama untuk 1 Invoice');
          setIsPrinting(false);
          return;
        }
        endpoint = '/api/products/generate-grouped-invoice';
        payload.customerName = customer;
      } else {
        // Validate same Orlap
        const orlap = selectedProducts[0].codeAgen;
        const allSame = selectedProducts.every(p => p.codeAgen === orlap);
        if (!allSame) {
          showError('Semua produk yang dipilih harus dari Orlap yang sama untuk 1 Kwitansi');
          setIsPrinting(false);
          return;
        }
        endpoint = '/api/products/generate-kwitansi';
        payload.orlapName = orlap;
      }

      const response = await axios_instance.post(endpoint, payload, { responseType: 'blob' });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${type === 'piutang' ? 'Invoice' : 'Kwitansi'}-${Date.now()}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      showSuccess(`Berhasil membuat ${type === 'piutang' ? 'Invoice' : 'Kwitansi'}`);
    } catch (err) {
      console.error('Print Error:', err);
      showError(`Gagal membuat ${type === 'piutang' ? 'Invoice' : 'Kwitansi'}`);
    } finally {
      setIsPrinting(false);
    }
  };

  const filteredProducts = getFilteredProducts();

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <SidebarLayout onLogout={handleLogout}>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
          <Payment sx={{ fontSize: 32, color: '#4caf50' }} />
          <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
            Produk Siap Bayar
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ ml: 'auto' }}>
            (Status: Completed, Belum Lunas)
          </Typography>
        </Box>

        {/* Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs 
            value={activeTab} 
            onChange={(e, v) => {
              setActiveTab(v);
              setSelectedProductIds([]); // Clear selection on tab switch
            }} 
            aria-label="payment tabs" 
            color="success"
          >
            <Tab label={`💰 Piutang Customer (${piutangProducts.length})`} sx={{ fontWeight: 'bold' }} />
            <Tab label={`💸 Hutang ke Orlap (${hutangProducts.length})`} sx={{ fontWeight: 'bold' }} />
          </Tabs>
        </Box>

        {/* Summary Cards */}
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2, mb: 4 }}>
          {/* Total Siap Bayar */}
          <Card sx={{ bgcolor: activeTab === 0 ? '#e8f5e9' : '#fff3e0', borderTop: activeTab === 0 ? '4px solid #4caf50' : '4px solid #ff9800' }}>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                {activeTab === 0 ? 'Total Piutang (Tagihan Customer)' : 'Total Hutang (Biaya ke Orlap)'}
              </Typography>
              <Typography variant="h5" sx={{ color: activeTab === 0 ? '#2e7d32' : '#e65100', fontWeight: 'bold' }}>
                Rp {formatHargaDot(activeTab === 0 ? totalPiutang : totalHutang)}
              </Typography>
            </CardContent>
          </Card>

          {/* Jumlah Produk */}
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Jumlah Data {activeTab === 0 ? 'Piutang' : 'Hutang'}
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                {activeTab === 0 ? piutangProducts.length : hutangProducts.length} Transaksi
              </Typography>
            </CardContent>
          </Card>
        </Box>

        {/* Info Box */}
        <Card sx={{ mb: 3, backgroundColor: '#e8f5e9', borderLeft: '4px solid #4caf50' }}>
          <CardContent>
            <Typography variant="body2">
              <strong>📋 Panduan Pembayaran Produk:</strong>
            </Typography>
            <Typography variant="body2" sx={{ mt: 1, ml: 2 }}>
              1. Edit harga & ubah status produk ke <strong>COMPLETED</strong> di menu ProductDetail
            </Typography>
            <Typography variant="body2" sx={{ ml: 2 }}>
              2. Invoice akan otomatis dibuat (INV-YYYYMM-XXXXX)
            </Typography>
            <Typography variant="body2" sx={{ ml: 2 }}>
              3. Lihat daftar produk siap bayar di halaman ini
            </Typography>
            <Typography variant="body2" sx={{ ml: 2 }}>
              4. Catat pembayaran di menu <strong>Cashflow → Tambah Transaksi</strong>
            </Typography>
          </CardContent>
        </Card>

        {/* Error/Success Messages */}
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        {/* Filters */}
        <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <TextField
            label="🔍 Cari Produk"
            placeholder="No. Order, Nama, Bank..."
            variant="outlined"
            size="small"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ minWidth: 250 }}
          />

          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              label="Status"
            >
              <MenuItem value="">Semua Status</MenuItem>
              <MenuItem value="pending">Pending</MenuItem>
              <MenuItem value="in_progress">In Progress</MenuItem>
              <MenuItem value="completed">Completed</MenuItem>
            </Select>
          </FormControl>

          <Button variant="outlined" onClick={fetchUnpaidProducts}>
            🔄 Refresh
          </Button>

          {selectedProductIds.length > 0 && (
            <Box sx={{ ml: 'auto', display: 'flex', gap: 1 }}>
              <Button
                variant="contained"
                color={activeTab === 0 ? 'success' : 'warning'}
                startIcon={activeTab === 0 ? <Print /> : <Receipt />}
                onClick={() => handlePrintAction(activeTab === 0 ? 'piutang' : 'hutang')}
                disabled={isPrinting}
              >
                {isPrinting ? <CircularProgress size={20} color="inherit" /> : `Cetak ${activeTab === 0 ? 'Invoice' : 'Kwitansi'} (${selectedProductIds.length})`}
              </Button>
              <Button variant="text" size="small" onClick={() => setSelectedProductIds([])}>
                Batal Pilih
              </Button>
            </Box>
          )}
        </Box>

        {/* Products Table */}
        <TableContainer component={Paper}>
          {loading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          )}

          {!loading && filteredProducts.length === 0 ? (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Typography color="textSecondary">
                {products.length === 0
                  ? 'Tidak ada piutang. Semua produk sudah dibayar! ✅'
                  : 'Tidak ada hasil pencarian'}
              </Typography>
            </Box>
          ) : (
            <Table>
              <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                <TableRow>
                  <TableCell padding="checkbox">
                    <Checkbox
                      indeterminate={selectedProductIds.length > 0 && selectedProductIds.length < (activeTab === 0 ? piutangProducts.length : hutangProducts.length)}
                      checked={(activeTab === 0 ? piutangProducts : hutangProducts).length > 0 && selectedProductIds.length === (activeTab === 0 ? piutangProducts : hutangProducts).length}
                      onChange={(e) => handleSelectAll(e.target.checked, activeTab === 0 ? piutangProducts : hutangProducts)}
                    />
                  </TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>No. Order</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Nama</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>{activeTab === 0 ? 'Customer' : 'Field Staff'}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold' }}>{activeTab === 0 ? 'Harga Jual (Piutang)' : 'Harga Beli (Hutang)'}</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Invoice</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold' }}>Aksi</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(activeTab === 0 ? piutangProducts : hutangProducts)
                  .filter(p => p.noOrder?.toLowerCase().includes(searchTerm.toLowerCase()) || p.nama?.toLowerCase().includes(searchTerm.toLowerCase()))
                  .map((product) => (
                  <TableRow key={product._id} hover selected={selectedProductIds.includes(product._id)}>
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={selectedProductIds.includes(product._id)}
                        onChange={() => handleSelectToggle(product._id)}
                      />
                    </TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>{product.noOrder || '-'}</TableCell>
                    <TableCell>{product.nama || '-'}</TableCell>
                    <TableCell>{activeTab === 0 ? (product.customer || '-') : (product.codeAgen || '-')}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold', color: activeTab === 0 ? '#2e7d32' : '#e65100' }}>
                      Rp {formatHargaDot(activeTab === 0 ? (product.hargaJual || product.harga) : product.hargaBeli)}
                    </TableCell>
                    <TableCell>
                      {product.invoiceNo ? (
                        <Chip label={`INV-${product.invoiceNo}`} size="small" color="success" variant="outlined" />
                      ) : '-'}
                    </TableCell>
                    <TableCell align="center">
                      <Button
                        size="small"
                        variant="contained"
                        color={activeTab === 0 ? 'success' : 'warning'}
                        onClick={() => handleSettleClick(product, activeTab === 0 ? 'piutang' : 'hutang')}
                        sx={{ mr: 1 }}
                      >
                        Lunas
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => handleViewProduct(product._id)}
                      >
                        Detail
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </TableContainer>
      </Container>
      {/* Settlement Dialog */}
      <Dialog open={settleDialog.open} onClose={() => !isSettling && setSettleDialog({ ...settleDialog, open: false })}>
        <DialogTitle>
          {settleDialog.type === 'piutang' ? '🏦 Terima Pembayaran Customer' : '💸 Bayar Hutang ke Orlap'}
        </DialogTitle>
        <DialogContent dividers>
          <Typography variant="body1" gutterBottom>
            Anda akan menandai transaksi ini sebagai <strong>LUNAS</strong>.
          </Typography>
          <Box sx={{ my: 2, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
            <Typography variant="body2">Produk: <strong>{settleDialog.product?.nama}</strong></Typography>
            <Typography variant="body2">No. Order: <strong>{settleDialog.product?.noOrder}</strong></Typography>
            <Typography variant="h6" sx={{ mt: 1, color: settleDialog.type === 'piutang' ? 'success.main' : 'error.main' }}>
              Nominal: Rp {formatHargaDot(settleDialog.type === 'piutang' ? (settleDialog.product?.hargaJual || settleDialog.product?.harga) : settleDialog.product?.hargaBeli)}
            </Typography>
          </Box>
          
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Pilih Rekening Pembayaran</InputLabel>
            <Select
              value={selectedAccount}
              label="Pilih Rekening Pembayaran"
              onChange={(e) => setSelectedAccount(e.target.value)}
              disabled={isSettling}
            >
              <MenuItem value="Rekening A">Rekening A</MenuItem>
              <MenuItem value="Rekening B">Rekening B</MenuItem>
              <MenuItem value="cash">Tunai (Cash)</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSettleDialog({ ...settleDialog, open: false })} disabled={isSettling}>
            Batal
          </Button>
          <Button 
            onClick={handleConfirmSettle} 
            variant="contained" 
            color={settleDialog.type === 'piutang' ? 'success' : 'warning'}
            disabled={isSettling}
          >
            {isSettling ? <CircularProgress size={20} sx={{ mr: 1 }} /> : null}
            Konfirmasi Lunas
          </Button>
        </DialogActions>
      </Dialog>
    </SidebarLayout>
  );
};

export default PaymentManagement;
