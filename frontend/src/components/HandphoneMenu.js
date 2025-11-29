import React, { useState, useEffect, useCallback } from 'react';
import axios from '../utils/axios';
import { Container, Typography, Box, Paper, Table, TableHead, TableBody, TableRow, TableCell, CircularProgress, TableContainer, FormControl, InputLabel, Select, MenuItem, Card, CardContent, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Grid, Alert, Chip } from '@mui/material';
import { Add, Smartphone } from '@mui/icons-material';
import SidebarLayout from './SidebarLayout';
import { useNavigate } from 'react-router-dom';
import { useNotification } from '../contexts/NotificationContext';

const HandphoneMenu = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [selectedImei, setSelectedImei] = useState('');
  const [uniqueImeis, setUniqueImeis] = useState([]);
  const [handphones, setHandphones] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [handphoneForm, setHandphoneForm] = useState({
    merek: '',
    tipe: '',
    imei: '',
    spesifikasi: '',
    kepemilikan: 'Perusahaan',
    assignedTo: '',
    status: 'available'
  });
  const token = localStorage.getItem('token');
  const { showSuccess, showError } = useNotification();

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

  // Fetch handphones data
  const fetchHandphones = useCallback(async () => {
    try {
      const res = await axios.get('/api/handphones');
      setHandphones(res.data.data || []);
    } catch (err) {
      console.error('Error fetching handphones:', err);
    }
  }, []);

  const handleOpenDialog = () => {
    setHandphoneForm({
      merek: '',
      tipe: '',
      imei: '',
      spesifikasi: '',
      kepemilikan: 'Perusahaan',
      assignedTo: '',
      status: 'available'
    });
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleHandphoneFormChange = (e) => {
    const { name, value } = e.target;
    setHandphoneForm({
      ...handphoneForm,
      [name]: value
    });
  };

  const handleSubmitHandphone = async (e) => {
    e.preventDefault();

    try {
      await axios.post('/api/handphones', handphoneForm, {
        headers: { Authorization: `Bearer ${token}` }
      });

      showSuccess('Handphone berhasil ditambahkan!');
      fetchHandphones();
      handleCloseDialog();
    } catch (error) {
      console.error('Error creating handphone:', error);
      showError(error.response?.data?.error || 'Gagal menambahkan handphone');
    }
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


  // Ambil data produk dan handphone saat komponen dimuat
  useEffect(() => {
    fetchProducts();
    fetchHandphones();
  }, [fetchProducts, fetchHandphones]);

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
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <div>
            <Typography variant="h4" gutterBottom>Detail Handphone</Typography>
            <Typography variant="body2" color="text.secondary">Kelola inventaris handphone dan lihat data produk yang menggunakan handphone.</Typography>
          </div>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={handleOpenDialog}
            sx={{ borderRadius: 2 }}
          >
            Tambah Handphone
          </Button>
        </Box>

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

        {/* Dialog untuk input handphone baru */}
        <Dialog
          open={openDialog}
          onClose={handleCloseDialog}
          maxWidth="md"
          fullWidth
          sx={{ '& .MuiDialog-paper': { borderRadius: 3 } }}
        >
          <DialogTitle sx={{ bgcolor: 'primary.main', color: 'white', fontWeight: 'bold' }}>
            <Smartphone sx={{ mr: 1, verticalAlign: 'middle' }} />
            Tambah Handphone Baru
          </DialogTitle>
          <form onSubmit={handleSubmitHandphone}>
            <DialogContent>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Merek"
                    name="merek"
                    value={handphoneForm.merek}
                    onChange={handleHandphoneFormChange}
                    margin="normal"
                    required
                    placeholder="Contoh: Samsung, Xiaomi, iPhone"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Tipe/Model"
                    name="tipe"
                    value={handphoneForm.tipe}
                    onChange={handleHandphoneFormChange}
                    margin="normal"
                    required
                    placeholder="Contoh: Galaxy A50, Redmi Note 10, iPhone 12"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="IMEI"
                    name="imei"
                    value={handphoneForm.imei}
                    onChange={handleHandphoneFormChange}
                    margin="normal"
                    required
                    placeholder="15 digit angka IMEI"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth margin="normal">
                    <InputLabel>Kepemilikan</InputLabel>
                    <Select
                      name="kepemilikan"
                      value={handphoneForm.kepemilikan}
                      onChange={handleHandphoneFormChange}
                      label="Kepemilikan"
                    >
                      <MenuItem value="Perusahaan">Perusahaan</MenuItem>
                      <MenuItem value="Pribadi">Pribadi</MenuItem>
                      <MenuItem value="Sewa">Sewa</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Spesifikasi"
                    name="spesifikasi"
                    value={handphoneForm.spesifikasi}
                    onChange={handleHandphoneFormChange}
                    margin="normal"
                    multiline
                    rows={3}
                    placeholder="RAM, Storage, Processor, dll."
                  />
                </Grid>
              </Grid>

              <Alert severity="info" sx={{ mt: 2 }}>
                <strong>Catatan:</strong> Handphone yang ditambahkan akan otomatis tersedia untuk di-assign ke produk.
                Status awal handphone adalah "Available".
              </Alert>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseDialog}>Batal</Button>
              <Button type="submit" variant="contained" sx={{ borderRadius: 2 }}>
                Simpan Handphone
              </Button>
            </DialogActions>
          </form>
        </Dialog>

        {/* Section untuk menampilkan daftar handphone */}
        <Card sx={{
          mt: 4,
          borderRadius: 3,
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
        }}>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ color: 'rgba(0,0,0,0.8)' }}>
              📱 Inventaris Handphone
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Daftar handphone yang tersedia untuk di-assign ke produk.
            </Typography>

            <TableContainer component={Paper} elevation={1} sx={{ borderRadius: 2 }}>
              <Table size="small" aria-label="handphone inventory table">
                <TableHead>
                  <TableRow sx={{ bgcolor: 'grey.100' }}>
                    <TableCell sx={{ fontWeight: 'bold' }}>Merek</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Tipe</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>IMEI</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Kepemilikan</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Current Product</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {handphones.map((handphone) => (
                    <TableRow key={handphone._id} hover>
                      <TableCell sx={{ fontWeight: 'bold' }}>{handphone.merek}</TableCell>
                      <TableCell>{handphone.tipe}</TableCell>
                      <TableCell sx={{ fontFamily: 'monospace' }}>{handphone.imei}</TableCell>
                      <TableCell>
                        <Chip
                          label={handphone.status === 'available' ? 'Tersedia' :
                                 handphone.status === 'in_use' ? 'Digunakan' :
                                 handphone.status === 'maintenance' ? 'Perbaikan' : handphone.status}
                          color={handphone.status === 'available' ? 'success' :
                                 handphone.status === 'in_use' ? 'warning' :
                                 handphone.status === 'maintenance' ? 'error' : 'default'}
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>{handphone.kepemilikan}</TableCell>
                      <TableCell>
                        {handphone.currentProduct ? (
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                              {handphone.currentProduct.noOrder}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {handphone.currentProduct.nama}
                            </Typography>
                          </Box>
                        ) : (
                          <Typography variant="body2" color="text.secondary">-</Typography>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {handphones.length === 0 && (
              <Box sx={{ p: 4, textAlign: 'center' }}>
                <Smartphone sx={{ fontSize: 48, color: 'grey.400', mb: 2 }} />
                <Typography variant="body1" color="text.secondary">
                  Belum ada handphone yang terdaftar.
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Klik "Tambah Handphone" untuk menambah inventaris handphone pertama.
                </Typography>
              </Box>
            )}
          </CardContent>
        </Card>
      </Container>
    </SidebarLayout>
  );
};

export default HandphoneMenu;