import React, { useState, useEffect, useCallback } from 'react';
import {
  Container, Typography, Box, CircularProgress, Alert, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, IconButton, Button, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, FormControl, InputLabel, Select, MenuItem, Card, CardContent, Grid, Chip, Tabs, Tab,
  InputAdornment
} from '@mui/material';
import { Edit, Delete, Add, TrendingUp, TrendingDown, AccountBalanceWallet } from '@mui/icons-material';
import SidebarLayout from './SidebarLayout';
import RekeningDetailPanel from './RekeningDetailPanel';
import CashflowReporting from './CashflowReporting';
import { useNavigate } from 'react-router-dom';
import { useNotification } from '../contexts/NotificationContext';
import axios from '../utils/axios';

const CashflowManagement = () => {
  const navigate = useNavigate();
  const { showSuccess, showError } = useNotification();
  const [dashboardTab, setDashboardTab] = useState(0); // 0 = Dashboard, 1 = Laporan
  const [cashflows, setCashflows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedAccount, setSelectedAccount] = useState('Rekening A');
  const [summary, setSummary] = useState({ 
    totalIncome: 0, 
    totalExpense: 0, 
    netIncome: 0
  });
  const [accountDetail, setAccountDetail] = useState(null);

  // Dialog states
  const [openDialog, setOpenDialog] = useState(false);
  const [editingCashflow, setEditingCashflow] = useState(null);
  const [formData, setFormData] = useState({
    type: 'income',
    category: '',
    amount: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    reference: '',
    paymentMethod: 'cash',
    account: 'Rekening A'
  });

  // Simplified - no balance calculation needed for user input

  const formatNumberWithDots = (num) => {
    if (!num && num !== 0) return '';
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };

  const parseNumberFromDots = (str) => {
    if (!str) return '';
    return str.replace(/\./g, '');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const fetchCashflows = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/cashflow', {
        params: { account: selectedAccount }
      });
      setCashflows(response.data.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching cashflows:', err);
      setError('Failed to fetch cashflows');
      showError('Failed to fetch cashflows');
    } finally {
      setLoading(false);
    }
  }, [showError, selectedAccount]);

  const fetchSummary = useCallback(async () => {
    try {
      const response = await axios.get('/api/cashflow/summary/overview', {
        params: { account: selectedAccount }
      });
      setSummary(response.data.data);
    } catch (err) {
      console.error('Error fetching summary:', err);
      showError('Gagal memuat ringkasan keuangan');
    }
  }, [showError, selectedAccount]);

  const fetchAccountDetail = useCallback(async () => {
    try {
      console.log(`📊 Fetching account detail for: ${selectedAccount}`);
      const response = await axios.get(`/api/rekening/account/${selectedAccount}`);
      console.log('📊 Account detail response:', response.data);
      if (response.data.success && response.data.data) {
        console.log('📊 Setting account detail:', response.data.data);
        setAccountDetail(response.data.data);
      } else {
        console.warn('📊 No account detail data in response');
        setAccountDetail(null);
      }
    } catch (err) {
      console.error('❌ Error fetching account detail:', err);
      setAccountDetail(null);
    }
  }, [selectedAccount]);

  useEffect(() => {
    fetchCashflows();
    fetchSummary();
    fetchAccountDetail();
  }, [fetchCashflows, fetchSummary, fetchAccountDetail]);

  // No auto-fill needed for single-entry system

  const handleOpenDialog = (cashflow = null) => {
    if (cashflow) {
      setEditingCashflow(cashflow);
      setFormData({
        type: cashflow.type,
        category: cashflow.category,
        amount: formatNumberWithDots(cashflow.amount),
        description: cashflow.description || '',
        date: cashflow.date ? new Date(cashflow.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        reference: cashflow.reference || '',
        paymentMethod: cashflow.paymentMethod || 'cash',
        account: cashflow.account || 'Rekening A'
      });
    } else {
      setEditingCashflow(null);
      setFormData({
        type: 'income',
        category: '',
        amount: '',
        description: '',
        date: new Date().toISOString().split('T')[0],
        reference: '',
        paymentMethod: 'cash',
        account: selectedAccount
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingCashflow(null);
    setFormData({
      type: 'income',
      category: '',
      amount: '',
      description: '',
      date: new Date().toISOString().split('T')[0],
      reference: '',
      paymentMethod: 'cash',
      account: selectedAccount
    });
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    
    // Special handling for amount field with dot separator
    if (name === 'amount') {
      const cleanedValue = parseNumberFromDots(value);
      const formattedValue = formatNumberWithDots(cleanedValue);
      setFormData({ ...formData, [name]: formattedValue });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Basic validation
    const parsedAmount = parseFloat(parseNumberFromDots(formData.amount)) || 0;
    if (!formData.amount || parsedAmount <= 0) {
      showError('Silakan masukkan jumlah yang valid.');
      return;
    }

    if (!formData.category.trim()) {
      showError('Silakan masukkan kategori transaksi.');
      return;
    }

    try {
      const submitData = {
        ...formData,
        amount: parsedAmount
      };

      if (editingCashflow) {
        await axios.put(`/api/cashflow/${editingCashflow._id}`, submitData);
        showSuccess('Transaksi berhasil diperbarui');
      } else {
        await axios.post('/api/cashflow', submitData);
        showSuccess('Transaksi berhasil dibuat');
      }
      fetchCashflows();
      fetchSummary();
      handleCloseDialog();
    } catch (err) {
      console.error('Error saving cashflow:', err);
      showError(err.response?.data?.error || 'Gagal menyimpan transaksi');
    }
  };

  const handleDelete = async (cashflowId) => {
    if (window.confirm('Are you sure you want to delete this cashflow entry?')) {
      try {
        await axios.delete(`/api/cashflow/${cashflowId}`);
        showSuccess('Cashflow entry deleted successfully');
        fetchCashflows();
        fetchSummary();
      } catch (err) {
        console.error('Error deleting cashflow:', err);
        showError('Failed to delete cashflow entry');
      }
    }
  };

  const getTypeColor = (type) => {
    return type === 'income' ? 'success' : 'error';
  };

  const getTypeIcon = (type) => {
    return type === 'income' ? <TrendingUp /> : <TrendingDown />;
  };

  const getPaymentMethodLabel = (method) => {
    const labels = {
      cash: 'Cash',
      transfer: 'Transfer',
      credit_card: 'Credit Card',
      debit_card: 'Debit Card',
      other: 'Other'
    };
    return labels[method] || method;
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
            Manajemen Arus Kas
          </Typography>
        </Box>

        {/* Main Dashboard vs Laporan Tab */}
        <Card sx={{
          mb: 3,
          borderRadius: 2,
          boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
        }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs
              value={dashboardTab}
              onChange={(e, newValue) => setDashboardTab(newValue)}
              indicatorColor="primary"
              textColor="primary"
              variant="fullWidth"
              sx={{
                '& .MuiTab-root': {
                  fontSize: '1rem',
                  fontWeight: 'bold',
                  textTransform: 'none',
                  py: 2
                }
              }}
            >
              <Tab label="📊 Dashboard" />
              <Tab label="📈 Laporan Laba Rugi" />
            </Tabs>
          </Box>
        </Card>

        {/* Dashboard Tab Content */}
        {dashboardTab === 0 && (
          <>
        {/* Account Selection Tabs */}
        <Card sx={{
          mb: 3,
          borderRadius: 2,
          boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
        }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs
              value={selectedAccount === 'Rekening A' ? 0 : 1}
              onChange={(e, newValue) => setSelectedAccount(newValue === 0 ? 'Rekening A' : 'Rekening B')}
              indicatorColor="primary"
              textColor="primary"
              variant="fullWidth"
              sx={{
                '& .MuiTab-root': {
                  fontSize: '1rem',
                  fontWeight: 'bold',
                  textTransform: 'none',
                  py: 2
                }
              }}
            >
              <Tab label="💳 Rekening A (Utama)" />
              <Tab label="💳 Rekening B (Alternatif)" />
            </Tabs>
          </Box>
          <Box sx={{ p: 2, bgcolor: 'grey.50' }}>
            <Typography variant="body2" color="text.secondary">
              Terpilih: <strong>{selectedAccount}</strong> - Semua transaksi akan disimpan ke rekening ini
            </Typography>
          </Box>
        </Card>

        {/* Rekening Detail Panel */}
        <RekeningDetailPanel 
          account={selectedAccount} 
          onDetailUpdate={(detail) => {
            // Refresh data if needed
            fetchSummary();
          }}
        />

        {/* Summary Cards - Single Entry System */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={4}>
            <Card sx={{
              background: 'linear-gradient(135deg, #4caf50 0%, #66bb6a 100%)',
              color: 'white',
              borderRadius: 3,
              boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
            }}>
              <CardContent sx={{ textAlign: 'center' }}>
                <TrendingUp sx={{ fontSize: 40, mb: 1 }} />
                <Typography variant="h4" component="div">
                  Rp {summary.totalIncome?.toLocaleString('id-ID') || '0'}
                </Typography>
                <Typography variant="body2">Total Pemasukan</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <Card sx={{
              background: 'linear-gradient(135deg, #f44336 0%, #e57373 100%)',
              color: 'white',
              borderRadius: 3,
              boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
            }}>
              <CardContent sx={{ textAlign: 'center' }}>
                <TrendingDown sx={{ fontSize: 40, mb: 1 }} />
                <Typography variant="h4" component="div">
                  Rp {summary.totalExpense?.toLocaleString('id-ID') || '0'}
                </Typography>
                <Typography variant="body2">Total Pengeluaran</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            {(() => {
              const netProfit = (accountDetail?.saldoAwal || 0) + (summary.totalIncome || 0) - (summary.totalExpense || 0);
              console.log('💰 Card render - Account:', selectedAccount, 'saldoAwal:', accountDetail?.saldoAwal, 'totalIncome:', summary.totalIncome, 'totalExpense:', summary.totalExpense, 'netProfit:', netProfit);
              return (
                <Card sx={{ 
                  background: netProfit >= 0
                    ? 'linear-gradient(135deg, #4caf50 0%, #81c784 100%)'
                    : 'linear-gradient(135deg, #f44336 0%, #ef5350 100%)',
                  color: 'white',
                  borderRadius: 3,
                  boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
                }}>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <AccountBalanceWallet sx={{ fontSize: 40, mb: 1 }} />
                    <Typography variant="h4" component="div">
                      Rp {netProfit.toLocaleString('id-ID')}
                    </Typography>
                    <Typography variant="body2">
                      Total Saldo Akhir
                    </Typography>
                  </CardContent>
                </Card>
              );
            })()}
          </Grid>
        </Grid>

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
            startIcon={<Add />}
            onClick={() => handleOpenDialog()}
            sx={{
              borderRadius: 2,
              width: { xs: '100%', sm: 'auto' }
            }}
          >
            Tambah Transaksi
          </Button>
        </Box>

        {/* Payment Recording Guide */}
        <Card sx={{ mb: 3, backgroundColor: '#fff3e0', borderLeft: '4px solid #ff9800' }}>
          <CardContent>
            <Typography variant="body2" sx={{ mb: 1 }}>
              <strong>💳 Catat Pembayaran Produk:</strong>
            </Typography>
            <Typography variant="body2" sx={{ ml: 2, mb: 0.5 }}>
              • Klik "Tambah Transaksi" dengan Type: <strong>Pengeluaran</strong>
            </Typography>
            <Typography variant="body2" sx={{ ml: 2, mb: 0.5 }}>
              • Kategori: Pembayaran Produk
            </Typography>
            <Typography variant="body2" sx={{ ml: 2, mb: 0.5 }}>
              • Jumlah: Ambil dari daftar "Produk Siap Bayar"
            </Typography>
            <Typography variant="body2" sx={{ ml: 2 }}>
              • Reference: Gunakan No. Invoice produk (INV-YYYYMM-XXXXX)
            </Typography>
          </CardContent>
        </Card>

        <Card sx={{
          borderRadius: 3,
          boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
          overflow: 'hidden'
        }}>
          <TableContainer>
            <Table>
              <TableHead sx={{ bgcolor: 'grey.100' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold' }}>Jenis</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Rekening</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Kategori</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Jumlah</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Deskripsi</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Tanggal</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Metode Pembayaran</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Aksi</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {cashflows.map((cashflow) => (
                  <TableRow key={cashflow._id} hover>
                    <TableCell>
                      <Chip
                        icon={getTypeIcon(cashflow.type)}
                        label={cashflow.type === 'income' ? 'Pemasukan' : 'Pengeluaran'}
                        color={getTypeColor(cashflow.type)}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={cashflow.account || 'Rekening A'}
                        variant="filled"
                        size="small"
                        sx={{
                          bgcolor: cashflow.account === 'Rekening B' ? 'info.main' : 'primary.main',
                          color: 'white'
                        }}
                      />
                    </TableCell>
                    <TableCell>{cashflow.category}</TableCell>
                    <TableCell sx={{
                      color: cashflow.type === 'income' ? 'success.main' : 'error.main',
                      fontWeight: 'bold'
                    }}>
                      {cashflow.type === 'income' ? '+' : '-'}Rp {cashflow.amount?.toLocaleString('id-ID') || '0'}
                    </TableCell>
                    <TableCell>{cashflow.description}</TableCell>
                    <TableCell>{new Date(cashflow.date).toLocaleDateString()}</TableCell>
                    <TableCell>{getPaymentMethodLabel(cashflow.paymentMethod)}</TableCell>
                    <TableCell>
                      <IconButton onClick={() => handleOpenDialog(cashflow)} color="primary" size="small">
                        <Edit />
                      </IconButton>
                      <IconButton onClick={() => handleDelete(cashflow._id)} color="error" size="small">
                        <Delete />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          {cashflows.length === 0 && !loading && (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="body1" color="text.secondary">
                No cashflow entries found. Click "Add Transaction" to create your first entry.
              </Typography>
            </Box>
          )}
        </Card>



        {loading && <CircularProgress sx={{ mt: 2 }} />}
        {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}

        {/* Cashflow Dialog */}
        <Dialog
          open={openDialog}
          onClose={handleCloseDialog}
          maxWidth="md"
          fullWidth
          sx={{ '& .MuiDialog-paper': { borderRadius: 3 } }}
        >
          <DialogTitle sx={{ bgcolor: 'primary.main', color: 'white', fontWeight: 'bold' }}>
            {editingCashflow ? 'Edit Transaksi' : 'Tambah Transaksi Baru'}
          </DialogTitle>
          <form onSubmit={handleSubmit}>
            <DialogContent sx={{ pt: 3 }}>
              {/* Type Selection - Tab Based */}
              <Box sx={{ mb: 4 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 2 }}>
                  Jenis Transaksi
                </Typography>
                <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
                  <Tabs
                    value={formData.type === 'income' ? 0 : 1}
                    onChange={(e, newValue) => setFormData({ ...formData, type: newValue === 0 ? 'income' : 'expense' })}
                    indicatorColor="primary"
                    textColor="primary"
                  >
                    <Tab label="📈 Pemasukan (Income)" sx={{ textTransform: 'none', fontSize: '0.95rem' }} />
                    <Tab label="📉 Pengeluaran (Expense)" sx={{ textTransform: 'none', fontSize: '0.95rem' }} />
                  </Tabs>
                </Box>
              </Box>

              <Grid container spacing={3}>
                {/* Rekening Selection */}
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel id="account-label">Rekening Tujuan</InputLabel>
                    <Select
                      labelId="account-label"
                      name="account"
                      value={formData.account}
                      label="Rekening Tujuan"
                      onChange={handleFormChange}
                      sx={{ borderRadius: 2 }}
                    >
                      <MenuItem value="Rekening A">💳 Rekening A (Utama)</MenuItem>
                      <MenuItem value="Rekening B">💳 Rekening B (Alternatif)</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                {/* Payment Method */}
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel id="payment-method-label">Metode Pembayaran</InputLabel>
                    <Select
                      labelId="payment-method-label"
                      name="paymentMethod"
                      value={formData.paymentMethod}
                      label="Metode Pembayaran"
                      onChange={handleFormChange}
                      sx={{ borderRadius: 2 }}
                    >
                      <MenuItem value="cash">💵 Cash</MenuItem>
                      <MenuItem value="transfer">🏦 Transfer</MenuItem>
                      <MenuItem value="credit_card">💳 Credit Card</MenuItem>
                      <MenuItem value="debit_card">🏧 Debit Card</MenuItem>
                      <MenuItem value="other">📋 Other</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                {/* Kategori */}
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Kategori"
                    name="category"
                    value={formData.category}
                    onChange={handleFormChange}
                    required
                    placeholder={formData.type === 'income' ? 'Penjualan, Bonus, Dividen...' : 'Utilitas, Gaji, Marketing...'}
                    InputProps={{
                      startAdornment: <Box sx={{ mr: 1, fontSize: '1.1rem' }}>🏷️</Box>
                    }}
                    sx={{ borderRadius: 2 }}
                  />
                </Grid>

                {/* Jumlah */}
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Jumlah"
                    name="amount"
                    value={formData.amount}
                    onChange={handleFormChange}
                    required
                    placeholder="0"
                    InputProps={{
                      startAdornment: <InputAdornment position="start">Rp</InputAdornment>
                    }}
                    helperText="Format otomatis dengan titik pemisah (1.000.000)"
                    sx={{ borderRadius: 2 }}
                  />
                </Grid>

                {/* Tanggal */}
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Tanggal Transaksi"
                    name="date"
                    type="date"
                    value={formData.date}
                    onChange={handleFormChange}
                    required
                    InputLabelProps={{ shrink: true }}
                    sx={{ borderRadius: 2 }}
                  />
                </Grid>

                {/* Reference */}
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Referensi"
                    name="reference"
                    value={formData.reference}
                    onChange={handleFormChange}
                    placeholder="No. Invoice, PO, kwitansi..."
                    InputProps={{
                      startAdornment: <Box sx={{ mr: 1, fontSize: '1.1rem' }}>📄</Box>
                    }}
                    sx={{ borderRadius: 2 }}
                  />
                </Grid>

                {/* Description - Full Width */}
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Keterangan"
                    name="description"
                    value={formData.description}
                    onChange={handleFormChange}
                    multiline
                    rows={3}
                    placeholder="Catatan atau detail tambahan tentang transaksi ini..."
                    InputProps={{
                      startAdornment: <Box sx={{ mr: 1, fontSize: '1.1rem' }}>💬</Box>
                    }}
                    sx={{ borderRadius: 2 }}
                  />
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseDialog}>Batal</Button>
              <Button type="submit" variant="contained" sx={{ borderRadius: 2 }}>
                {editingCashflow ? 'Perbarui' : 'Buat'}
              </Button>
            </DialogActions>
          </form>
        </Dialog>
          </>
        )}

        {/* Laporan Tab Content */}
        {dashboardTab === 1 && (
          <CashflowReporting />
        )}
      </Container>
    </SidebarLayout>
  );
};

export default CashflowManagement;