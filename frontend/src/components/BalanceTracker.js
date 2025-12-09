import React, { useState, useEffect, useCallback } from 'react';
import {
  Container, Typography, Box, CircularProgress, Alert, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, IconButton, Button, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, FormControl, InputLabel, Select, MenuItem, Card, CardContent, Grid, Chip
} from '@mui/material';
import { Edit, Delete, Add, TrendingUp, TrendingDown, AccountBalanceWallet, Refresh } from '@mui/icons-material';
import SidebarLayout from './SidebarLayout';
import { useNavigate } from 'react-router-dom';
import { useNotification } from '../contexts/NotificationContext';
import axios from '../utils/axios';

const BalanceTracker = () => {
  const navigate = useNavigate();
  const { showSuccess, showError } = useNotification();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [summary, setSummary] = useState({
    currentBalance: 0,
    totalDebit: 0,
    totalCredit: 0,
    totalIncome: 0,
    totalExpense: 0,
    netIncome: 0
  });

  // Dialog states
  const [openDialog, setOpenDialog] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [formData, setFormData] = useState({
    type: 'income',
    category: '',
    amount: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    reference: '',
    paymentMethod: 'cash'
  });

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const fetchTransactions = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/balance-transactions');
      setTransactions(response.data.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching balance transactions:', err);
      setError('Failed to fetch balance transactions');
      showError('Failed to fetch balance transactions');
    } finally {
      setLoading(false);
    }
  }, [showError]);

  const fetchSummary = useCallback(async () => {
    try {
      const response = await axios.get('/api/balance-transactions/summary/overview');
      setSummary(response.data.data);
    } catch (err) {
      console.error('Error fetching balance summary:', err);
    }
  }, []);

  useEffect(() => {
    fetchTransactions();
    fetchSummary();
  }, [fetchTransactions, fetchSummary]);

  const handleOpenDialog = (transaction = null) => {
    if (transaction) {
      setEditingTransaction(transaction);
      setFormData({
        type: transaction.type,
        category: transaction.category,
        amount: transaction.amount,
        description: transaction.description || '',
        date: transaction.date ? new Date(transaction.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        reference: transaction.reference || '',
        paymentMethod: transaction.paymentMethod || 'cash'
      });
    } else {
      setEditingTransaction(null);
      setFormData({
        type: 'income',
        category: '',
        amount: '',
        description: '',
        date: new Date().toISOString().split('T')[0],
        reference: '',
        paymentMethod: 'cash'
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingTransaction(null);
    setFormData({
      type: 'income',
      category: '',
      amount: '',
      description: '',
      date: new Date().toISOString().split('T')[0],
      reference: '',
      paymentMethod: 'cash'
    });
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Basic validation
    if (!formData.amount || formData.amount <= 0) {
      showError('Silakan masukkan jumlah yang valid.');
      return;
    }

    if (!formData.category.trim()) {
      showError('Silakan masukkan keterangan transaksi.');
      return;
    }

    try {
      if (editingTransaction) {
        await axios.put(`/api/balance-transactions/${editingTransaction._id}`, formData);
        showSuccess('Transaksi berhasil diperbarui');
      } else {
        await axios.post('/api/balance-transactions', formData);
        showSuccess('Transaksi berhasil dibuat');
      }
      fetchTransactions();
      fetchSummary();
      handleCloseDialog();
    } catch (err) {
      console.error('Error saving balance transaction:', err);
      showError(err.response?.data?.error || 'Gagal menyimpan transaksi');
    }
  };

  const handleDelete = async (transactionId) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus transaksi ini?')) {
      try {
        await axios.delete(`/api/balance-transactions/${transactionId}`);
        showSuccess('Transaksi berhasil dihapus');
        fetchTransactions();
        fetchSummary();
      } catch (err) {
        console.error('Error deleting balance transaction:', err);
        showError('Gagal menghapus transaksi');
      }
    }
  };

  const getTypeColor = (type) => {
    return type === 'income' ? 'success' : 'error';
  };

  const getTypeIcon = (type) => {
    return type === 'income' ? <TrendingUp /> : <TrendingDown />;
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
            📊 Pencatatan Saldo Kumulatif
          </Typography>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={() => {
              fetchTransactions();
              fetchSummary();
            }}
            sx={{ borderRadius: 2 }}
          >
            Refresh
          </Button>
        </Box>

        {/* Summary Cards */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={4}>
            <Card sx={{
              background: summary.currentBalance >= 0
                ? 'linear-gradient(135deg, #4caf50 0%, #66bb6a 100%)'
                : 'linear-gradient(135deg, #f44336 0%, #e57373 100%)',
              color: 'white',
              borderRadius: 3,
              boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
            }}>
              <CardContent sx={{ textAlign: 'center' }}>
                <AccountBalanceWallet sx={{ fontSize: 40, mb: 1 }} />
                <Typography variant="h4" component="div">
                  Rp {Math.abs(summary.currentBalance || 0).toLocaleString('id-ID')}
                </Typography>
                <Typography variant="body2">
                  Saldo {summary.currentBalance >= 0 ? 'Positif' : 'Negatif'}
                </Typography>
                <Typography variant="caption">Saldo Kumulatif Saat Ini</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <Card sx={{
              background: 'linear-gradient(135deg, #2196f3 0%, #64b5f6 100%)',
              color: 'white',
              borderRadius: 3,
              boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
            }}>
              <CardContent sx={{ textAlign: 'center' }}>
                <TrendingUp sx={{ fontSize: 40, mb: 1 }} />
                <Typography variant="h4" component="div">
                  Rp {summary.totalDebit?.toLocaleString('id-ID') || '0'}
                </Typography>
                <Typography variant="body2">Total Debit</Typography>
                <Typography variant="caption">Pemasukan Kumulatif</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <Card sx={{
              background: 'linear-gradient(135deg, #ff9800 0%, #ffb74d 100%)',
              color: 'white',
              borderRadius: 3,
              boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
            }}>
              <CardContent sx={{ textAlign: 'center' }}>
                <TrendingDown sx={{ fontSize: 40, mb: 1 }} />
                <Typography variant="h4" component="div">
                  Rp {summary.totalCredit?.toLocaleString('id-ID') || '0'}
                </Typography>
                <Typography variant="body2">Total Kredit</Typography>
                <Typography variant="caption">Pengeluaran Kumulatif</Typography>
              </CardContent>
            </Card>
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
                  <TableCell sx={{ fontWeight: 'bold' }}>Keterangan</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Jumlah</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Deskripsi</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Tanggal</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Saldo Kumulatif</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Aksi</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {transactions.map((transaction) => (
                  <TableRow key={transaction._id} hover>
                    <TableCell>
                      <Chip
                        icon={getTypeIcon(transaction.type)}
                        label={transaction.type === 'income' ? 'Pemasukan' : 'Pengeluaran'}
                        color={getTypeColor(transaction.type)}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>{transaction.category}</TableCell>
                    <TableCell sx={{
                      color: transaction.type === 'income' ? 'success.main' : 'error.main',
                      fontWeight: 'bold'
                    }}>
                      {transaction.type === 'income' ? '+' : '-'}Rp {transaction.amount?.toLocaleString('id-ID') || '0'}
                    </TableCell>
                    <TableCell>{transaction.description}</TableCell>
                    <TableCell>{new Date(transaction.date).toLocaleDateString('id-ID')}</TableCell>
                    <TableCell sx={{
                      fontWeight: 'bold',
                      color: transaction.runningBalance >= 0 ? 'success.main' : 'error.main'
                    }}>
                      Rp {Math.abs(transaction.runningBalance || 0).toLocaleString('id-ID')}
                      {transaction.runningBalance < 0 && ' (Negatif)'}
                    </TableCell>
                    <TableCell>
                      <IconButton onClick={() => handleOpenDialog(transaction)} color="primary" size="small">
                        <Edit />
                      </IconButton>
                      <IconButton onClick={() => handleDelete(transaction._id)} color="error" size="small">
                        <Delete />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          {transactions.length === 0 && !loading && (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="body1" color="text.secondary">
                Belum ada transaksi. Klik "Tambah Transaksi" untuk memulai pencatatan saldo.
              </Typography>
            </Box>
          )}
        </Card>

        {loading && <CircularProgress sx={{ mt: 2 }} />}
        {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}

        {/* Transaction Dialog */}
        <Dialog
          open={openDialog}
          onClose={handleCloseDialog}
          maxWidth="md"
          fullWidth
          sx={{ '& .MuiDialog-paper': { borderRadius: 3 } }}
        >
          <DialogTitle sx={{ bgcolor: 'primary.main', color: 'white', fontWeight: 'bold' }}>
            {editingTransaction ? 'Edit Transaksi' : 'Tambah Transaksi Baru'}
          </DialogTitle>
          <form onSubmit={handleSubmit}>
            <DialogContent>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth margin="normal">
                    <InputLabel id="type-label">Jenis Transaksi</InputLabel>
                    <Select
                      labelId="type-label"
                      name="type"
                      value={formData.type}
                      label="Jenis Transaksi"
                      onChange={handleFormChange}
                      sx={{
                        borderRadius: 2,
                        backgroundColor: 'rgba(255,255,255,0.9)',
                        '&:hover': { backgroundColor: 'rgba(255,255,255,0.95)' },
                        '&.Mui-focused': { backgroundColor: 'white' }
                      }}
                    >
                      <MenuItem value="income">
                        💰 Pemasukan (Otomatis: Debit = Jumlah, Kredit = 0)
                      </MenuItem>
                      <MenuItem value="expense">
                        💸 Pengeluaran (Otomatis: Debit = 0, Kredit = Jumlah)
                      </MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Keterangan"
                    name="category"
                    value={formData.category}
                    onChange={handleFormChange}
                    margin="normal"
                    required
                    placeholder="contoh: Penjualan, Hutang, Gaji, Utilitas"
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
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Jumlah"
                    name="amount"
                    type="number"
                    value={formData.amount}
                    onChange={handleFormChange}
                    margin="normal"
                    required
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
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Tanggal"
                    name="date"
                    type="date"
                    value={formData.date}
                    onChange={handleFormChange}
                    margin="normal"
                    required
                    InputLabelProps={{ shrink: true }}
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
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth margin="normal">
                    <InputLabel id="payment-method-label">Metode Pembayaran</InputLabel>
                    <Select
                      labelId="payment-method-label"
                      name="paymentMethod"
                      value={formData.paymentMethod}
                      label="Metode Pembayaran"
                      onChange={handleFormChange}
                      sx={{
                        borderRadius: 2,
                        backgroundColor: 'rgba(255,255,255,0.9)',
                        '&:hover': { backgroundColor: 'rgba(255,255,255,0.95)' },
                        '&.Mui-focused': { backgroundColor: 'white' }
                      }}
                    >
                      <MenuItem value="cash">Cash</MenuItem>
                      <MenuItem value="transfer">Transfer</MenuItem>
                      <MenuItem value="credit_card">Credit Card</MenuItem>
                      <MenuItem value="debit_card">Debit Card</MenuItem>
                      <MenuItem value="other">Other</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Referensi"
                    name="reference"
                    value={formData.reference}
                    onChange={handleFormChange}
                    margin="normal"
                    placeholder="Nomor invoice, kwitansi, dll."
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
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Deskripsi"
                    name="description"
                    value={formData.description}
                    onChange={handleFormChange}
                    margin="normal"
                    multiline
                    rows={3}
                    placeholder="Detail tambahan tentang transaksi ini"
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
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseDialog}>Batal</Button>
              <Button type="submit" variant="contained" sx={{ borderRadius: 2 }}>
                {editingTransaction ? 'Perbarui' : 'Buat'}
              </Button>
            </DialogActions>
          </form>
        </Dialog>
      </Container>
    </SidebarLayout>
  );
};

export default BalanceTracker;