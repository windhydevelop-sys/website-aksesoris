import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from '../utils/axios';
import {
  Container, Typography, Box, Grid, Card, CardContent, CardMedia, Button, CircularProgress, Table, TableBody, TableRow, TableCell
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SidebarLayout from './SidebarLayout';

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
    kcp: 'KCP',
    nik: 'NIK',
    nama: 'Nama',
    namaIbuKandung: 'Nama Ibu Kandung',
    tempatTanggalLahir: 'Tempat / Tanggal Lahir',
    noRek: 'No. Rekening',
    noAtm: 'No. ATM',
    validThru: 'Valid Thru',
    noHp: 'No. HP',
    handphone: 'Handphone',
    imeiHandphone: 'IMEI Handphone',
    pinAtm: 'PIN ATM',
    pinWondr: 'PIN Wondr',
    passWondr: 'Password Wondr',
    email: 'Email',
    passEmail: 'Password Email',
    expired: 'Expired',
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
    'handphone',
    'imeiHandphone',
    'pinAtm',
    'pinWondr',
    'passWondr',
    'email',
    'passEmail',
    'expired',
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
            <Grid container spacing={2}>
              {/* Display images first if available */}
              {['uploadFotoId','uploadFotoSelfie'].map((imgKey)=> (
                product[imgKey] ? (
                  <Grid item xs={12} sm={6} key={imgKey}>
                    <Typography variant="subtitle2" gutterBottom>{imgKey === 'uploadFotoId' ? 'Foto KTP' : 'Foto Selfie'}</Typography>
                    <CardMedia component="img" image={buildImageUrl(product[imgKey])} alt={imgKey} sx={{ maxHeight: 300, objectFit: 'contain', borderRadius:2, border:'1px solid #444' }} />
                  </Grid>
                ) : null
              ))}

              <Grid item xs={12}>
                <Table size="small">
                  <TableBody>
                    {fieldOrder.map((key)=>{
                      if(!product[key]) return null;
                      const label = fieldLabels[key] || key;
                      return (
                        <TableRow key={key}>
                          <TableCell component="th" scope="row" sx={{ fontWeight:'bold', width:'35%' }}>{label}</TableCell>
                          <TableCell>{key==='expired'? new Date(product[key]).toLocaleDateString('id-ID') : String(product[key])}</TableCell>
                        </TableRow>
                      );
                    })}

                    {/* Image rows */}
                    {['uploadFotoId','uploadFotoSelfie'].map((imgKey)=> (
                      product[imgKey] ? (
                        <TableRow key={imgKey}>
                          <TableCell component="th" scope="row" sx={{ fontWeight:'bold' }}>{imgKey === 'uploadFotoId' ? 'Foto KTP' : 'Foto Selfie'}</TableCell>
                          <TableCell>
                            <CardMedia component="img" image={buildImageUrl(product[imgKey])} alt={imgKey} sx={{ maxWidth:200, maxHeight:200, objectFit:'contain', borderRadius:2, border:'1px solid #444' }} />
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