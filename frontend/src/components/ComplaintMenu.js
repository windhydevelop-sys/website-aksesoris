import React, { useState, useEffect, useCallback } from 'react';
import SidebarLayout from './SidebarLayout';
import {
  Container,
  Typography,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Box,
  Alert,
  InputAdornment,
  TableContainer,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Card,
  CardContent
} from '@mui/material';
import { Search } from '@mui/icons-material';
import { useNotification } from '../contexts/NotificationContext';
import axios from 'axios';

const ComplaintMenu = () => {
  const { showSuccess, showError } = useNotification();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [complaints, setComplaints] = useState([]);
  const [filters, setFilters] = useState({
    codeAgen: '',
    nama: '',
    noRek: '',
  });

  const [openAdd, setOpenAdd] = useState(false);
  const [formAdd, setFormAdd] = useState({ productId: '', sisaSaldo: '', complaint: '' });
  const [productOptions, setProductOptions] = useState([]);

  // Tambahkan variabel untuk memeriksa keberadaan komplain
  const showSisaSaldoColumn = complaints.some(product => product.complaint);

  const fetchComplaints = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const query = new URLSearchParams(filters).toString();
      const response = await axios.get(`/api/products/complaints?${query}`);
      setComplaints(response.data.data);
    } catch (err) {
      console.error('Error fetching complaints:', err);
      setError('Failed to fetch complaints. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchComplaints();
  }, [fetchComplaints]); // Fetch on initial load

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await axios.get('/api/products');
        setProductOptions(res.data.data || []);
      } catch (err) {
        console.error('Error fetching products:', err);
      }
    };
    fetchProducts();
  }, []);

  const handleFilterChange = (e) => {
    setFilters({
      ...filters,
      [e.target.name]: e.target.value,
    });
  };

  const handleSearch = () => {
    fetchComplaints();
  };

  const handleOpenAdd = () => {
    setFormAdd({ productId: '', sisaSaldo: '', complaint: '' });
    setOpenAdd(true);
  };

  const handleCloseAdd = () => {
    setOpenAdd(false);
  };

  const handleChangeAdd = (e) => {
    setFormAdd({ ...formAdd, [e.target.name]: e.target.value });
  };

  const handleSubmitAdd = async (e) => {
    e.preventDefault();
    try {
      if (!formAdd.productId) {
        setError('Pilih produk terlebih dahulu');
        return;
      }
      await axios.put(`/api/products/${formAdd.productId}`, { sisaSaldo: formAdd.sisaSaldo, complaint: formAdd.complaint });
      setOpenAdd(false);
      fetchComplaints();
      showSuccess('Komplain berhasil ditambahkan!');
    } catch (err) {
      console.error('Error creating product:', err);
      showError('Gagal menyimpan data komplain.');
    }
  };

  return (
    <SidebarLayout>
      <Container maxWidth="xl" sx={{ mt: 6, mb: 6, px: 4 }}>
        <Typography
          variant="h2"
          component="h1"
          gutterBottom
          sx={{
            fontWeight: 'bold',
            fontSize: { xs: '2.5rem', sm: '3rem' },
            mb: 6
          }}
        >
          Complaint Menu
        </Typography>

      <Card sx={{
        mb: 5,
        borderRadius: 4,
        background: 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
      }}>
        <CardContent sx={{ py: 5, px: 4 }}>
          <Typography variant="h4" gutterBottom sx={{ color: 'rgba(0,0,0,0.8)', fontWeight: 'bold', mb: 4, fontSize: '1.8rem' }}>Filter</Typography>
          <Box display="flex" gap={3} flexWrap="wrap" sx={{ mb: 2 }}>
            <TextField
              label="Kode Orlap"
              name="codeAgen"
              value={filters.codeAgen}
              onChange={handleFilterChange}
              variant="outlined"
              InputProps={{
                startAdornment: <InputAdornment position="start"><Search /></InputAdornment>,
                sx: { borderRadius: 3 }
              }}
              sx={{
                minWidth: 200,
                '& .MuiOutlinedInput-root': {
                  borderRadius: 3,
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
                },
                '& .MuiInputBase-input': {
                  fontSize: '1.1rem',
                  py: 1.5
                },
                '& .MuiInputLabel-root': {
                  fontSize: '1.1rem'
                }
              }}
              onKeyDown={(e) => { if (e.key === 'Enter') { handleSearch(); } }}
            />
            <TextField
              label="Nama"
              name="nama"
              value={filters.nama}
              onChange={handleFilterChange}
              variant="outlined"
              InputProps={{
                startAdornment: <InputAdornment position="start"><Search /></InputAdornment>,
                sx: { borderRadius: 3 }
              }}
              sx={{
                minWidth: 200,
                '& .MuiOutlinedInput-root': {
                  borderRadius: 3,
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
                },
                '& .MuiInputBase-input': {
                  fontSize: '1.1rem',
                  py: 1.5
                },
                '& .MuiInputLabel-root': {
                  fontSize: '1.1rem'
                }
              }}
              onKeyDown={(e) => { if (e.key === 'Enter') { handleSearch(); } }}
            />
            <TextField
              label="No. Rekening"
              name="noRek"
              value={filters.noRek}
              onChange={handleFilterChange}
              variant="outlined"
              InputProps={{
                startAdornment: <InputAdornment position="start"><Search /></InputAdornment>,
                sx: { borderRadius: 3 }
              }}
              sx={{
                minWidth: 200,
                '& .MuiOutlinedInput-root': {
                  borderRadius: 3,
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
                },
                '& .MuiInputBase-input': {
                  fontSize: '1.1rem',
                  py: 1.5
                },
                '& .MuiInputLabel-root': {
                  fontSize: '1.1rem'
                }
              }}
              onKeyDown={(e) => { if (e.key === 'Enter') { handleSearch(); } }}
            />
            <Button variant="contained" onClick={handleSearch} disabled={loading} sx={{ borderRadius: 3, fontSize: '1.2rem', px: 4, py: 2, fontWeight: 600 }}>
              Search
            </Button>
            <Button variant="outlined" color="primary" onClick={handleOpenAdd} sx={{ borderRadius: 3, fontSize: '1.2rem', px: 4, py: 2, fontWeight: 600 }}>
              Tambah Data
            </Button>
          </Box>
        </CardContent>
      </Card>

      {loading && <CircularProgress />}
      {error && <Alert severity="error">{error}</Alert>}

      {!loading && !error && complaints.length === 0 && (
        <Alert severity="info">No complaints found.</Alert>
      )}

      {!loading && !error && complaints.length > 0 && (
        <TableContainer component={Paper} elevation={3} sx={{ borderRadius: 4, boxShadow: '0 8px 32px rgba(0,0,0,0.1)' }}>
          <Box px={4} pt={4} pb={2}>
            <Typography variant="h6" color="text.secondary" sx={{ fontSize: '1.2rem', fontWeight: 500 }}>Menampilkan {complaints.length} komplain</Typography>
          </Box>
          <Table>
            <TableHead sx={{ bgcolor: 'grey.100' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold', fontSize: '1.2rem', py: 3 }}>No. Order</TableCell>
                <TableCell sx={{ fontWeight: 'bold', fontSize: '1.2rem', py: 3 }}>Kode Orlap</TableCell>
                <TableCell sx={{ fontWeight: 'bold', fontSize: '1.2rem', py: 3 }}>Customer</TableCell>
                <TableCell sx={{ fontWeight: 'bold', fontSize: '1.2rem', py: 3 }}>Nama</TableCell>
                <TableCell sx={{ fontWeight: 'bold', fontSize: '1.2rem', py: 3 }}>No. Rekening</TableCell>
                {showSisaSaldoColumn && <TableCell sx={{ fontWeight: 'bold', fontSize: '1.2rem', py: 3 }}>Sisa Saldo</TableCell>}
                <TableCell sx={{ fontWeight: 'bold', fontSize: '1.2rem', py: 3 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 'bold', fontSize: '1.2rem', py: 3 }}>Complaint</TableCell>
                <TableCell sx={{ fontWeight: 'bold', fontSize: '1.2rem', py: 3 }}>Expired</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {complaints.map((product) => (
                <TableRow key={product._id} hover sx={{ '&:hover': { bgcolor: 'action.hover' } }}>
                  <TableCell sx={{ fontSize: '1.1rem', py: 3 }}>{product.noOrder}</TableCell>
                  <TableCell sx={{ fontSize: '1.1rem', py: 3 }}>{product.codeAgen}</TableCell>
                  <TableCell sx={{ fontSize: '1.1rem', py: 3 }}>{product.customer}</TableCell>
                  <TableCell sx={{ fontSize: '1.1rem', py: 3 }}>{product.nama}</TableCell>
                  <TableCell sx={{ fontSize: '1.1rem', py: 3 }}>{product.noRek}</TableCell>
                  {product.complaint && <TableCell sx={{ fontSize: '1.1rem', py: 3 }}>{product.sisaSaldo || '-'}</TableCell>}
                  <TableCell sx={{ fontSize: '1.1rem', py: 3 }}>{product.status}</TableCell>
                  <TableCell sx={{ fontSize: '1.1rem', py: 3 }}>{product.complaint}</TableCell>
                  <TableCell sx={{ fontSize: '1.1rem', py: 3 }}>{product.expired ? new Date(product.expired).toLocaleDateString('id-ID') : '-'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog open={openAdd} onClose={handleCloseAdd} fullWidth maxWidth="md" sx={{ '& .MuiDialog-paper': { borderRadius: 4 } }}>
        <DialogTitle sx={{ fontSize: '1.5rem', py: 3, fontWeight: 'bold' }}>Tambah Komplain</DialogTitle>
        <form onSubmit={handleSubmitAdd}>
          <DialogContent sx={{ py: 4, px: 4 }}>
            <TextField
              select
              fullWidth
              label="Pilih No. Order"
              name="productId"
              value={formAdd.productId}
              onChange={handleChangeAdd}
              margin="normal"
              sx={{
                mb: 3,
                '& .MuiOutlinedInput-root': {
                  borderRadius: 3,
                  backgroundColor: 'rgba(255,255,255,0.9)',
                  '&:hover': { backgroundColor: 'rgba(255,255,255,0.95)' },
                  '&.Mui-focused': { backgroundColor: 'white' }
                },
                '& .MuiInputBase-input': {
                  fontSize: '1.1rem',
                  py: 1.5
                },
                '& .MuiInputLabel-root': {
                  fontSize: '1.1rem'
                }
              }}
            >
              <option value="" hidden></option>
              {productOptions.map((p) => (
                <option key={p._id} value={p._id}>{p.noOrder} - {p.nama}</option>
              ))}
            </TextField>
            <TextField
              fullWidth
              label="Sisa Saldo"
              name="sisaSaldo"
              value={formAdd.sisaSaldo}
              onChange={handleChangeAdd}
              margin="normal"
              sx={{
                mb: 3,
                '& .MuiOutlinedInput-root': {
                  borderRadius: 3,
                  backgroundColor: 'rgba(255,255,255,0.9)',
                  '&:hover': { backgroundColor: 'rgba(255,255,255,0.95)' },
                  '&.Mui-focused': { backgroundColor: 'white' }
                },
                '& .MuiInputBase-input': {
                  fontSize: '1.1rem',
                  py: 1.5
                },
                '& .MuiInputLabel-root': {
                  fontSize: '1.1rem'
                }
              }}
            />
            <TextField
              fullWidth
              label="Keluhan / Komplain"
              name="complaint"
              value={formAdd.complaint}
              onChange={handleChangeAdd}
              margin="normal"
              multiline
              rows={4}
              sx={{
                mb: 3,
                '& .MuiOutlinedInput-root': {
                  borderRadius: 3,
                  backgroundColor: 'rgba(255,255,255,0.9)',
                  '&:hover': { backgroundColor: 'rgba(255,255,255,0.95)' },
                  '&.Mui-focused': { backgroundColor: 'white' }
                },
                '& .MuiInputBase-input': {
                  fontSize: '1.1rem'
                },
                '& .MuiInputLabel-root': {
                  fontSize: '1.1rem'
                }
              }}
            />
          </DialogContent>
          <DialogActions sx={{ py: 4, px: 4 }}>
            <Button onClick={handleCloseAdd} sx={{ fontSize: '1.2rem', px: 4, py: 2, fontWeight: 600 }}>Batal</Button>
            <Button type="submit" variant="contained" sx={{ borderRadius: 3, fontSize: '1.2rem', px: 5, py: 2, fontWeight: 600 }}>Simpan</Button>
          </DialogActions>
        </form>
      </Dialog>
      </Container>
    </SidebarLayout>
  );
};

export default ComplaintMenu;