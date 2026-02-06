import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from '../utils/axios';
import {
  Container, Typography, Box, Grid, Card, CardContent, CardMedia, Button, CircularProgress, Table, TableBody, TableRow, TableCell
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PrintIcon from '@mui/icons-material/Print';
import SidebarLayout from './SidebarLayout';
import { getStatusChip, getStatusBgColor } from '../utils/statusHelpers';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const token = localStorage.getItem('token');

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await axios.get(`/api/products/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setProduct(res.data.data);
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to fetch product');
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id, token]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const handlePrintInvoice = async (product) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`/api/orders/by-noorder/${product.noOrder}/invoice`, {
        responseType: 'blob',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `invoice-${product.noOrder}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error downloading invoice:', err);
      // You might want to show a toast notification here
    }
  };

  if (loading) {
    return (
      <SidebarLayout onLogout={handleLogout}>
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}>
          <CircularProgress />
        </Box>
        <Container maxWidth="sm" sx={{ mt: 2, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">Memuat detail produk...</Typography>
        </Container>
      </SidebarLayout>
    );
  }

  if (error) {
    return (
      <SidebarLayout onLogout={handleLogout}>
        <Container maxWidth="md" sx={{ mt: 8 }}>
          <Typography color="error" variant="h6" gutterBottom>{error}</Typography>
          <Button variant="contained" startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)}>
            Kembali
          </Button>
        </Container>
      </SidebarLayout>
    );
  }

  if (!product) return null;

  // For development, CRA proxy will forward `/api` requests to backend.
  // Use /api/uploads/ so files are served by backend via express static.
  // Helper to build correct image URL
  const buildImageUrl = (filename) => {
    if (!filename) return '';
    if (filename.startsWith('http') || filename.startsWith('/')) {
      return filename;
    }
    return `${axios.defaults.baseURL}/uploads/${filename}`;
  };

  // Define labels and display order for product fields
  const fieldLabels = {
    noOrder: 'No. Order',
    codeAgen: 'Kode Orlap',
    customer: 'Customer',
    bank: 'Bank',
    grade: 'Grade',
    kcp: 'Kantor Cabang',
    nik: 'NIK',
    nama: 'Nama',
    namaIbuKandung: 'Nama Ibu Kandung',
    tempatTanggalLahir: 'Tempat / Tanggal Lahir',
    noRek: 'No. Rekening',
    noAtm: 'No. ATM',
    validThru: 'Valid Kartu',
    noHp: 'No. HP',
    handphoneMerek: 'Merek Handphone',
    handphoneTipe: 'Tipe Handphone',
    handphoneSpesifikasi: 'Spesifikasi',
    handphoneKepemilikan: 'Kepemilikan',
    pinAtm: 'PIN ATM',
    pinWondr: 'PIN Wondr',
    passWondr: 'Password Wondr',
    email: 'Email',
    passEmail: 'Password Email',
    expired: 'Expired',
    mobileUser: 'User Mobile',
    mobilePassword: 'Password Mobile',
    mobilePin: 'Pin Mobile',
    ibUser: 'User IB',
    ibPin: 'Pin IB',
    myBCAUser: 'BCA-ID',
    myBCAPassword: 'Pass BCA-ID',
    myBCAPin: 'Pin Transaksi'
  };

  const fieldOrder = [
    'noOrder',
    'codeAgen',
    'customer',
    'bank',
    'grade',
    'kcp',
    'nik',
    'nama',
    'namaIbuKandung',
    'tempatTanggalLahir',
    'noRek',
    'noAtm',
    'validThru',
    'noHp',
    'handphoneMerek',
    'handphoneTipe',
    'handphoneSpesifikasi',
    'handphoneKepemilikan',
    'pinAtm',
    'pinWondr',
    'passWondr',
    'email',
    'passEmail',
    'expired',
    'mobileUser',
    'mobilePassword',
    'mobilePin',
    'ibUser',
    'ibPin',
    'myBCAUser',
    'myBCAPassword',
    'myBCAPin'
  ];

  return (
    <SidebarLayout onLogout={handleLogout}>
      <Container maxWidth="md" sx={{ mt: 8 }}>
        <Button variant="contained" startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)} sx={{ mb: 2 }}>
          Kembali
        </Button>
        <Card>
          <CardContent>
            <Typography variant="h4" gutterBottom>Detail Produk</Typography>

            {/* Status Section */}
            {product.status && (
              <Box sx={{ mb: 3 }}>
                <Card sx={{ bgcolor: getStatusBgColor(product.status), border: 1, borderColor: 'divider' }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom sx={{ color: 'text.primary', fontWeight: 'bold' }}>
                      Status Pesanan
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      {getStatusChip(product.status, 'large', { fontSize: '1.2rem', py: 1.5 })}
                      {product.status === 'completed' && (
                        <Button
                          variant="contained"
                          startIcon={<PrintIcon />}
                          onClick={() => handlePrintInvoice(product)}
                          sx={{ borderRadius: 2, fontWeight: 'bold' }}
                        >
                          Cetak Invoice
                        </Button>
                      )}
                    </Box>
                  </CardContent>
                </Card>
              </Box>
            )}
            <Grid container spacing={2}>
              {/* Display images first if available */}
              {['uploadFotoId', 'uploadFotoSelfie'].map((imgKey) => (
                product[imgKey] ? (
                  <Grid item xs={12} sm={6} key={imgKey}>
                    <Typography variant="subtitle2" gutterBottom>{imgKey === 'uploadFotoId' ? 'Foto KTP' : 'Foto Selfie'}</Typography>
                    <CardMedia component="img" image={buildImageUrl(product[imgKey])} alt={imgKey} sx={{ maxHeight: 300, objectFit: 'contain', borderRadius: 2, border: '1px solid #444' }} />
                  </Grid>
                ) : null
              ))}

              <Grid item xs={12}>
                <Table size="small">
                  <TableBody>
                    {fieldOrder.map((key) => {
                      let value = product[key];

                      // Handle handphone data - use direct fields stored in product
                      if (key === 'handphoneMerek') {
                        // Extract merek from handphone string (first word)
                        value = product.handphone ? product.handphone.split(' ')[0] : '';
                      } else if (key === 'handphoneTipe') {
                        // Extract tipe from handphone string (everything after first space)
                        value = product.handphone ? product.handphone.substring(product.handphone.indexOf(' ') + 1) : '';
                      } else if (key === 'handphoneSpesifikasi' || key === 'handphoneKepemilikan') {
                        // These fields are not stored directly in product, try to get from populated handphoneId
                        if (product.handphoneId && typeof product.handphoneId === 'object') {
                          const handphoneKey = key.replace('handphone', '').toLowerCase();
                          value = product.handphoneId[handphoneKey] || '';
                        } else {
                          value = '';
                        }
                      }

                      if (value === undefined || value === null || value === '') return null;

                      let label = fieldLabels[key] || key;

                      // Dynamic Labeling for Bank Credentials
                      if (product.bank) {
                        const bank = product.bank.toUpperCase();
                        if (key === 'mobileUser') {
                          if (bank.includes('BNI')) label = 'User Wondr';
                          if (bank.includes('MANDIRI')) label = 'User Livin';
                          if (bank.includes('BRI')) label = 'User Brimo';
                          if (bank.includes('OCBC')) label = 'User Nyala';
                        } else if (key === 'mobilePassword') {
                          if (bank.includes('BNI')) label = 'Password Wondr';
                          if (bank.includes('MANDIRI')) label = 'Password Livin';
                          if (bank.includes('BRI')) label = 'Password Brimo';
                          if (bank.includes('BCA')) label = 'Kode Akses';
                        } else if (key === 'mobilePin') {
                          if (bank.includes('BNI')) label = 'Pin Wondr';
                          if (bank.includes('MANDIRI')) label = 'Pin Livin';
                          if (bank.includes('BRI')) label = 'Pin Brimo';
                        }
                      }

                      return (
                        <TableRow key={key}>
                          <TableCell component="th" scope="row" sx={{ fontWeight: 'bold', width: '35%' }}>{label}</TableCell>
                          <TableCell>{key === 'expired' ? new Date(value).toLocaleDateString('id-ID') : String(value)}</TableCell>
                        </TableRow>
                      );
                    })}

                    {/* Image rows */}
                    {['uploadFotoId', 'uploadFotoSelfie'].map((imgKey) => (
                      product[imgKey] ? (
                        <TableRow key={imgKey}>
                          <TableCell component="th" scope="row" sx={{ fontWeight: 'bold' }}>{imgKey === 'uploadFotoId' ? 'Foto KTP' : 'Foto Selfie'}</TableCell>
                          <TableCell>
                            <CardMedia component="img" image={buildImageUrl(product[imgKey])} alt={imgKey} sx={{ maxWidth: 200, maxHeight: 200, objectFit: 'contain', borderRadius: 2, border: '1px solid #444' }} />
                          </TableCell>
                        </TableRow>
                      ) : null
                    ))}
                  </TableBody>
                </Table>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Container>
    </SidebarLayout>
  );
};

export default ProductDetail;