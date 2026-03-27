import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from '../utils/axios';
import {
  Container, Typography, Box, Grid, Card, CardContent, CardMedia, Button, CircularProgress, Table, TableBody, TableRow, TableCell, Chip
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PrintIcon from '@mui/icons-material/Print';
import { Edit } from '@mui/icons-material';
import SidebarLayout from './SidebarLayout';
import ProductEditForm from './ProductEditForm';
import { getStatusChip, getStatusBgColor } from '../utils/statusHelpers';
import { useNotification } from '../contexts/NotificationContext';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showSuccess, showError } = useNotification();
  
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const token = localStorage.getItem('token');

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await axios.get(`/api/products/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        console.log('📦 Product fetched:', res.data.data);
        setProduct(res.data.data);
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to fetch product');
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id, token]);

  // Monitor product changes
  useEffect(() => {
    if (product) {
      console.log('🔄 Product state updated:', {
        noOrder: product.noOrder,
        harga: product.harga,
        status: product.status,
        sudahBayar: product.sudahBayar
      });
    }
  }, [product]);

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

  const handleEditSubmit = async (formData) => {
    try {
      console.log('🔵 Starting edit submission with formData:', formData);
      
      const response = await axios.put(`/api/products/${id}`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('🟢 Response received:', {
        success: response.data.success,
        data: response.data.data
      });
      
      if (response.data.success) {
        const updatedProduct = response.data.data;
        
        console.log('📋 Update state with new product:', {
          noOrder: updatedProduct.noOrder,
          harga: updatedProduct.harga,
          status: updatedProduct.status,
          sudahBayar: updatedProduct.sudahBayar
        });
        
        // CRITICAL: Update state with new product data
        setProduct(updatedProduct);
        setEditDialogOpen(false);

        // If status changed to completed, show that invoice is ready
        if (formData.status === 'completed') {
          console.log('✅ Status changed to COMPLETED - Invoice ready for payment');
          showSuccess('✅ Produk berhasil diperbarui ke status COMPLETED! Produk siap dibayar.');
        } else {
          showSuccess('✅ Produk berhasil diperbarui.');
        }
      } else {
        showError(response.data.error || 'Gagal memperbarui produk');
      }
    } catch (err) {
      console.error('❌ Error in handleEditSubmit:', err);
      console.error('Response error:', err.response?.data);
      showError(err.response?.data?.error || 'Gagal memperbarui produk');
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
    jenisRekening: 'Jenis Rekening',
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
    mobilePassword: 'Password Mobile', // Will be overridden for BCA
    mobilePin: 'Pin Mobile',
    ibUser: 'User IB',
    ibPassword: 'Password IB',
    ibPin: 'Pin IB',
    myBCAUser: 'BCA-ID',
    myBCAPassword: 'Pass BCA-ID',
    myBCAPin: 'Pin Transaksi',
    kodeAkses: 'Kode Akses M-BCA', // LEGACY - no longer used but kept for compatibility
    pinMBca: 'Pin M-BCA',
    merchantUser: 'User Merchant',
    merchantPassword: 'Password Merchant',
    brimoUser: 'User Brimo',
    brimoPassword: 'Password Brimo',
    brimoPin: 'Pin Brimo',
    briMerchantUser: 'User Merchant QRIS',
    briMerchantPassword: 'Password Merchant QRIS',
    ocbcNyalaUser: 'User Nyala',
    ocbcNyalaPassword: 'Password Nyala',
    ocbcNyalaPin: 'Pin Nyala',
    hargaBeli: 'Harga Beli (Hutang)',
    hargaJual: 'Harga Jual (Piutang)',
    pembayaranHutangStatus: 'Status Bayar ke Orlap',
    pembayaranPiutangStatus: 'Status Bayar dari Customer'
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
    'jenisRekening',
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
    'mobilePassword', // For BCA: Kode Akses M-BCA, For others: Brimo/Livin/Wondr password
    'mobilePin',
    'ibUser',
    'ibPin',
    'myBCAUser',
    'myBCAPassword',
    'myBCAPin',
    'kodeAkses',
    'pinMBca',
    'brimoUser',
    'brimoPassword',
    'brimoPin',
    'briMerchantUser',
    'briMerchantPassword',
    'ocbcNyalaUser',
    'ocbcNyalaPassword',
    'ocbcNyalaPin',
    'hargaBeli',
    'hargaJual',
    'pembayaranHutangStatus',
    'pembayaranPiutangStatus',
    'merchantUser',
    'merchantPassword'
  ];

  // Helper function: Determine if a field should be displayed based on bank and jenisRekening
  const shouldDisplayField = (key, product) => {
    const bank = product.bank?.toUpperCase() || '';
    const jenisRekening = product.jenisRekening?.toUpperCase() || '';

    // BCA Mobile (M-BCA) field - only show if bank is BCA
    if (key === 'mobilePassword') {
      return bank.includes('BCA');
    }

    // BCA-specific PIN field - only show if bank is BCA
    if (key === 'pinMBca' || key === 'kodeAkses') {
      return bank.includes('BCA');
    }

    // BCA I-Banking: User IB & Pin IB (only show for BCA internet banking)
    if (['ibUser', 'ibPin'].includes(key)) {
      return bank.includes('BCA');
    }

    // BCA Corporate (BCA-ID/MyBCA) - only show if bank is BCA
    if (['myBCAUser', 'myBCAPassword', 'myBCAPin'].includes(key)) {
      return bank.includes('BCA');
    }

    // BRI BRIMO-specific fields - only show if BRI and NOT QRIS
    if (['brimoUser', 'brimoPassword', 'brimoPin'].includes(key)) {
      return bank.includes('BRI') && !jenisRekening.includes('QRIS');
    }

    // BRI MERCHANT QRIS fields - only show if BRI and QRIS
    if (['briMerchantUser', 'briMerchantPassword'].includes(key)) {
      return bank.includes('BRI') && jenisRekening.includes('QRIS');
    }

    // OCBC Nyala fields - only show if bank is OCBC/NISP
    if (['ocbcNyalaUser', 'ocbcNyalaPassword', 'ocbcNyalaPin'].includes(key)) {
      return bank.includes('OCBC') || bank.includes('NISP');
    }

    // Generic merchant fields - only show for non-BRI or if QRIS on non-BRI banks
    if (['merchantUser', 'merchantPassword'].includes(key)) {
      if (bank.includes('BRI')) return false; // BRI uses briMerchantUser/Password instead
      return true;
    }

    return true;
  };

  // Helper function: Get the correct label for a field based on bank type
  // List of encrypted fields that should already be decrypted by backend
  const encryptedFields = [
    'pinAtm', 'pinWondr', 'passWondr', 'passEmail',
    'myBCAUser', 'myBCAPassword', 'myBCAPin',
    'brimoUser', 'brimoPassword', 'briMerchantUser', 'briMerchantPassword',
    'kodeAkses', 'pinMBca',
    'mobileUser', 'mobilePassword', 'mobilePin',
    'ibUser', 'ibPassword', 'ibPin',
    'merchantUser', 'merchantPassword',
    'ocbcNyalaUser', 'ocbcNyalaPassword', 'ocbcNyalaPin'
  ];

  // Helper to detect if a field contains encrypted data (starts with "U2FsdGVkX1")
  const isStillEncrypted = (value) => {
    return typeof value === 'string' && value.startsWith('U2FsdGVkX1');
  };

  const getDynamicLabel = (key, product) => {
    const bank = product.bank?.toUpperCase() || '';

    if (key === 'mobilePassword') {
      // BCA M-BCA uses "Kode Akses M-BCA" (not regular password)
      if (bank.includes('BCA')) return 'Kode Akses M-BCA';
      // Other banks use their own mobile banking names
      if (bank.includes('BNI')) return 'Password Wondr';
      if (bank.includes('MANDIRI')) return 'Password Livin';
      if (bank.includes('BRI')) return 'Password Brimo';
      return 'Password Mobile';
    } else if (key === 'mobileUser') {
      if (bank.includes('BNI')) return 'User Wondr';
      if (bank.includes('MANDIRI')) return 'User Livin';
      if (bank.includes('BRI')) return 'User Brimo';
      if (bank.includes('OCBC') || bank.includes('NISP')) return 'User Nyala';
    } else if (key === 'mobilePin') {
      if (bank.includes('BNI')) return 'Pin Wondr';
      if (bank.includes('MANDIRI')) return 'Pin Livin';
      if (bank.includes('BRI')) return 'Pin Brimo';
    } else if (key === 'ibUser') {
      if (bank.includes('BCA')) return 'User Internet Banking';
    } else if (key === 'ibPin') {
      if (bank.includes('BCA')) return 'Pin Internet Banking';
    }

    return fieldLabels[key] || key;
  };

  return (
    <SidebarLayout onLogout={handleLogout}>
      <Container maxWidth="md" sx={{ mt: 8 }}>
        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <Button variant="contained" startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)}>
            Kembali
          </Button>
          <Button variant="outlined" onClick={() => {
            const fetchProduct = async () => {
              try {
                const res = await axios.get(`/api/products/${id}`, {
                  headers: { Authorization: `Bearer ${token}` }
                });
                setProduct(res.data.data);
                showSuccess('Data diperbarui dari server');
              } catch (err) {
                showError('Gagal refresh data');
              }
            };
            fetchProduct();
          }}>
            Refresh Data
          </Button>
        </Box>
        <Card>
          <CardContent>
            <Typography variant="h4" gutterBottom>Detail Produk</Typography>

            {/* Current Data Summary for Debugging */}
            <Box sx={{ mb: 3, p: 2, backgroundColor: '#f5f5f5', borderRadius: 1, border: '1px solid #ddd' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                📊 Data Terkini:
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <Typography variant="body2" color="textSecondary">Harga Beli (Hutang):</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 'bold', color: '#e65100' }}>
                    Rp {product?.hargaBeli?.toLocaleString('id-ID') || '0'}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Typography variant="body2" color="textSecondary">Harga Jual (Piutang):</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 'bold', color: '#2e7d32' }}>
                    Rp {(product?.hargaJual || product?.harga)?.toLocaleString('id-ID') || '0'}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Typography variant="body2" color="textSecondary">Estimasi Profit:</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 'bold', color: '#1976d2' }}>
                    Rp {((product?.hargaJual || product?.harga || 0) - (product?.hargaBeli || 0)).toLocaleString('id-ID')}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="textSecondary">Status:</Typography>
                  <Chip
                    label={product?.status?.toUpperCase() || '-'}
                    color={product?.status === 'completed' ? 'success' : 'warning'}
                    size="small"
                    sx={{ fontWeight: 'bold' }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="textSecondary">Invoice No:</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                    {product?.invoiceNo ? `INV-${product.invoiceNo}` : '⏳ Belum dibuat'}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="textSecondary">Sudah Bayar:</Typography>
                  <Chip
                    label={product?.sudahBayar ? 'Lunas ✅' : 'Belum Bayar ⏳'}
                    color={product?.sudahBayar ? 'success' : 'warning'}
                    size="small"
                  />
                </Grid>
              </Grid>
            </Box>

            {/* Status Section */}
            {product.status && (
              <Box sx={{ mb: 3 }}>
                <Card sx={{ bgcolor: getStatusBgColor(product.status), border: 1, borderColor: 'divider' }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom sx={{ color: 'text.primary', fontWeight: 'bold' }}>
                      Status Pesanan
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
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

            {/* Action Buttons Section */}
            <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Button
                variant="contained"
                color="primary"
                startIcon={<Edit />}
                onClick={() => setEditDialogOpen(true)}
              >
                Edit Harga & Status
              </Button>
            </Box>
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
                      // First check if field should be displayed based on bank/jenisRekening
                      if (!shouldDisplayField(key, product)) return null;

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

                      // Filter: Skip completely empty/undefined values, but keep "-" or whitespace as valid display values
                      if (value === undefined || value === null) return null;

                      // For these important contact fields, always display even if empty or "-"
                      const alwaysDisplayFields = ['namaIbuKandung', 'tempatTanggalLahir'];
                      if (!alwaysDisplayFields.includes(key) && value === '') return null;

                      // Get the correct label using getDynamicLabel helper
                      const label = getDynamicLabel(key, product);

                      // Check if value is still encrypted (shouldn't happen if backend is working)
                      const stillEncrypted = encryptedFields.includes(key) && isStillEncrypted(value);

                      // Display logic with warnings for encrypted fields
                      let displayValue;
                      if (key === 'expired' && value) {
                        displayValue = new Date(value).toLocaleDateString('id-ID');
                      } else if (stillEncrypted) {
                        // This shouldn't happen - backend should have decrypted
                        displayValue = '[Decrypted data not available]';
                        console.warn(`Field ${key} is still encrypted in response`);
                      } else {
                        displayValue = value ? String(value) : '-';
                      }

                      return (
                        <TableRow key={key}>
                          <TableCell component="th" scope="row" sx={{ fontWeight: 'bold', width: '35%' }}>{label}</TableCell>
                          <TableCell sx={{ color: stillEncrypted ? 'warning.main' : 'inherit' }}>
                            {displayValue}
                          </TableCell>
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

        {/* Edit Dialog */}
        <ProductEditForm
          open={editDialogOpen}
          product={product}
          onClose={() => setEditDialogOpen(false)}
          onSubmit={handleEditSubmit}
        />
      </Container>
    </SidebarLayout>
  );
};

export default ProductDetail;