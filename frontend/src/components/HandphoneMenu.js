import React, { useState, useEffect, useCallback } from 'react';
import axios from '../utils/axios';
import { Container, Typography, Box, Paper, Table, TableHead, TableBody, TableRow, TableCell, CircularProgress, TableContainer, FormControl, InputLabel, Select, MenuItem, Card, CardContent } from '@mui/material';
import SidebarLayout from './SidebarLayout';
import { useNavigate } from 'react-router-dom';

const HandphoneMenu = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [selectedImei, setSelectedImei] = useState('');
  const [uniqueImeis, setUniqueImeis] = useState([]);
  const token = localStorage.getItem('token');

  const navigate = useNavigate();
  
  // Fungsi untuk mengambil data produk dari API
  const fetchProducts = useCallback(async () => {
    try {
      const productsRes = await axios.get('/api/products', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProducts(productsRes.data.data || []);
    } catch (err) {
      setError(err.response?.data?.error || 'Gagal mengambil data produk');
    } finally {
      setLoading(false);
    }
  }, [token]);

  const handleSelectedImeiChange = (e) => {
    setSelectedImei(e.target.value);
  };

  // Terapkan filter dengan debounce ketika data produk atau nilai filter berubah
  // Fungsi untuk mengelompokkan produk berdasarkan Merek Handphone dan keterangan
  

  useEffect(() => {
    const handler = setTimeout(() => {
      if (Array.isArray(products)) {
        const tempFilteredProducts = selectedImei
          ? products.filter(p => p.imeiHandphone && p.imeiHandphone.toLowerCase() === selectedImei.toLowerCase())
          : products;

        setFilteredProducts(tempFilteredProducts);
      }
    }, 250);
    return () => clearTimeout(handler);
  }, [products, selectedImei]);


  // Ambil data produk saat komponen dimuat
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    if (Array.isArray(products)) {
      const imeis = [...new Set(products.map(p => p.imeiHandphone).filter(Boolean))];
      setUniqueImeis(imeis);
    }
  }, [products]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/login';
  };

  if (loading) {
    return (
      <SidebarLayout onLogout={handleLogout}>
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}>
          <CircularProgress />
        </Box>
      </SidebarLayout>
    );
  }

  if (error) {
    return (
      <SidebarLayout onLogout={handleLogout}>
        <Container maxWidth="md" sx={{ mt: 8 }}>
          <Typography color="error" variant="h6" gutterBottom>{error}</Typography>
        </Container>
      </SidebarLayout>
    );
  }

  return (
    <SidebarLayout onLogout={handleLogout}>
      <Container maxWidth="lg" sx={{ mt: 8 }}>
        <Typography variant="h4" gutterBottom>Detail Handphone</Typography>
        <Typography variant="body2" color="text.secondary">Menampilkan data dari tab Handphone: merek, IMEI, spesifikasi, dan kode orlap.</Typography>

        <Card sx={{
          mt: 2,
          borderRadius: 3,
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
        }}>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ color: 'rgba(0,0,0,0.8)' }}>Filter</Typography>
            <Box display="flex" gap={2} flexWrap="wrap">
              <FormControl sx={{
                minWidth: 280,
                flex: 1,
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
              }}>
                <InputLabel id="imei-filter-label">Filter IMEI</InputLabel>
                <Select labelId="imei-filter-label" id="imei-filter" value={selectedImei} label="Filter IMEI" onChange={handleSelectedImeiChange}>
                  <MenuItem value="">Semua IMEI</MenuItem>
                  {uniqueImeis.map((imei) => (
                    <MenuItem key={imei} value={imei}>{imei}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
            <Box sx={{ mt: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Menampilkan {filteredProducts.length} dari {Array.isArray(products) ? products.length : 0} produk
              </Typography>
            </Box>
          </CardContent>
        </Card>

        <TableContainer component={Paper} elevation={2} sx={{ mt: 2, borderRadius: 2 }}>
          <Table size="medium" aria-label="detail handphone table" stickyHeader sx={{ minWidth: 900 }}>
            <TableHead>
              <TableRow>
                <TableCell>Merek Handphone</TableCell>
                <TableCell>Tipe Handphone</TableCell>
                <TableCell>IMEI</TableCell>
                <TableCell>Spesifikasi</TableCell>
                <TableCell>Kepemilikan</TableCell>
                <TableCell>Kode Orlap</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(filteredProducts || []).map((product) => (
                <TableRow key={product._id} hover>
                  <TableCell>{product.handphone || '-'}</TableCell>
                  <TableCell>{product.tipeHandphone || '-'}</TableCell>
                  <TableCell sx={{ cursor: product._id ? 'pointer' : 'default', color: 'primary.main' }} onClick={() => product._id && navigate(`/product-details/${product._id}`)}>
                    {product.imeiHandphone || '-'}
                  </TableCell>
                  <TableCell>{product.spesifikasi || '-'}</TableCell>
                  <TableCell>{product.kepemilikan || '-'}</TableCell>
                  <TableCell>{product.codeAgen || '-'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Container>
    </SidebarLayout>
  );
};

export default HandphoneMenu;