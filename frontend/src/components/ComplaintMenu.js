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
      <Container>
        <Typography variant="h4" component="h1" gutterBottom>
          Complaint Menu
        </Typography>

      <Card sx={{
        mb: 3,
        borderRadius: 3,
        background: 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
      }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ color: 'rgba(0,0,0,0.8)' }}>Filter</Typography>
          <Box display="flex" gap={2} flexWrap="wrap">
            <TextField
              label="Kode Orlap"
              name="codeAgen"
              value={filters.codeAgen}
              onChange={handleFilterChange}
              variant="outlined"
              size="small"
              InputProps={{
                startAdornment: <InputAdornment position="start"><Search /></InputAdornment>,
                sx: { borderRadius: 2 }
              }}
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
              onKeyDown={(e) => { if (e.key === 'Enter') { handleSearch(); } }}
            />
            <TextField
              label="Nama"
              name="nama"
              value={filters.nama}
              onChange={handleFilterChange}
              variant="outlined"
              size="small"
              InputProps={{
                startAdornment: <InputAdornment position="start"><Search /></InputAdornment>,
                sx: { borderRadius: 2 }
              }}
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
              onKeyDown={(e) => { if (e.key === 'Enter') { handleSearch(); } }}
            />
            <TextField
              label="No. Rekening"
              name="noRek"
              value={filters.noRek}
              onChange={handleFilterChange}
              variant="outlined"
              size="small"
              InputProps={{
                startAdornment: <InputAdornment position="start"><Search /></InputAdornment>,
                sx: { borderRadius: 2 }
              }}
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
              onKeyDown={(e) => { if (e.key === 'Enter') { handleSearch(); } }}
            />
            <Button variant="contained" onClick={handleSearch} disabled={loading} sx={{ borderRadius: 2 }}>
              Search
            </Button>
            <Button variant="outlined" color="primary" onClick={handleOpenAdd} sx={{ borderRadius: 2 }}>
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
        <TableContainer component={Paper} elevation={2} sx={{ borderRadius: 2 }}>
          <Box px={2} pt={2}>
            <Typography variant="body2" color="text.secondary">Menampilkan {complaints.length} komplain</Typography>
          </Box>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>No. Order</TableCell>
                <TableCell>Kode Orlap</TableCell>
                <TableCell>Customer</TableCell>
                <TableCell>Nama</TableCell>
                <TableCell>No. Rekening</TableCell>
                {showSisaSaldoColumn && <TableCell>Sisa Saldo</TableCell>}
                <TableCell>Status</TableCell>
                <TableCell>Complaint</TableCell>
                <TableCell>Expired</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {complaints.map((product) => (
                <TableRow key={product._id}>
                  <TableCell>{product.noOrder}</TableCell>
                  <TableCell>{product.codeAgen}</TableCell>
                  <TableCell>{product.customer}</TableCell>
                  <TableCell>{product.nama}</TableCell>
                  <TableCell>{product.noRek}</TableCell>
                  {product.complaint && <TableCell>{product.sisaSaldo || '-'}</TableCell>}
                  <TableCell>{product.status}</TableCell>
                  <TableCell>{product.complaint}</TableCell>
                  <TableCell>{product.expired ? new Date(product.expired).toLocaleDateString('id-ID') : '-'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog open={openAdd} onClose={handleCloseAdd} fullWidth maxWidth="sm">
        <DialogTitle>Tambah Komplain</DialogTitle>
        <form onSubmit={handleSubmitAdd}>
          <DialogContent>
            <TextField
              select
              fullWidth
              label="Pilih No. Order"
              name="productId"
              value={formAdd.productId}
              onChange={handleChangeAdd}
              margin="normal"
            >
              <option value="" hidden></option>
              {productOptions.map((p) => (
                <option key={p._id} value={p._id}>{p.noOrder} - {p.nama}</option>
              ))}
            </TextField>
            <TextField fullWidth label="Sisa Saldo" name="sisaSaldo" value={formAdd.sisaSaldo} onChange={handleChangeAdd} margin="normal" />
            <TextField fullWidth label="Keluhan / Komplain" name="complaint" value={formAdd.complaint} onChange={handleChangeAdd} margin="normal" multiline rows={3} />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseAdd}>Batal</Button>
            <Button type="submit" variant="contained">Simpan</Button>
          </DialogActions>
        </form>
      </Dialog>
      </Container>
    </SidebarLayout>
  );
};

export default ComplaintMenu;