import React, { useState } from 'react';
import {
  Drawer,
  Typography,
  Box,
  IconButton,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Table,
  TableBody,
  TableRow,
  TableCell,
  Button,
  Chip,
  Divider
} from '@mui/material';
import {
  Close,
  Print,
  Edit,
  Person,
  Business,
  Phone,
  CreditCard,
  LocationOn,
  DateRange,
  Badge,
  VpnKey,
  Email,
  AccountCircle
} from '@mui/icons-material';
import { useNotification } from '../contexts/NotificationContext';
import { getStatusChip } from '../utils/statusHelpers';
import axios from 'axios';

const ProductDetailDrawer = ({ open, onClose, product, onPrintInvoice }) => {
  const { showSuccess, showError } = useNotification();
  const [loading, setLoading] = useState(false);

  if (!product) return null;

  // Helper to build image URL
  const buildImageUrl = (filename) => {
    if (!filename) return '';
    if (filename.startsWith('http') || filename.startsWith('/')) {
      return filename;
    }
    return `${axios.defaults.baseURL}/uploads/${filename}`;
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Handle print invoice
  const handlePrintInvoice = async () => {
    try {
      setLoading(true);
      if (onPrintInvoice) {
        await onPrintInvoice(product);
      } else {
        showSuccess('Print invoice functionality will be implemented');
      }
    } catch (error) {
      showError('Failed to print invoice');
    } finally {
      setLoading(false);
    }
  };

  // Handle edit
  const handleEdit = () => {
    showSuccess('Edit functionality will be implemented');
  };

  // Define field labels and icons
  const fieldConfig = {
    status: { label: 'Status', icon: <Badge /> },
    noOrder: { label: 'No. Order', icon: <Badge /> },
    codeAgen: { label: 'Kode Orlap', icon: <Business /> },
    customer: { label: 'Customer', icon: <Person /> },
    bank: { label: 'Bank', icon: <Business /> },
    grade: { label: 'Grade', icon: <Badge /> },
    kcp: { label: 'Kantor Cabang', icon: <LocationOn /> },
    nik: { label: 'NIK', icon: <CreditCard /> },
    nama: { label: 'Nama', icon: <Person /> },
    namaIbuKandung: { label: 'Nama Ibu Kandung', icon: <Person /> },
    tempatTanggalLahir: { label: 'Tempat / Tanggal Lahir', icon: <LocationOn /> },
    noRek: { label: 'No. Rekening', icon: <CreditCard /> },
    noAtm: { label: 'No. ATM', icon: <CreditCard /> },
    validThru: { label: 'Valid Kartu', icon: <DateRange /> },
    noHp: { label: 'No. HP', icon: <Phone /> },
    pinAtm: { label: 'Pin ATM', icon: <VpnKey /> },
    fieldStaff: { label: 'Field Staff', icon: <Person /> },
    expired: { label: 'Expired', icon: <DateRange /> },
    // Bank Credentials
    mobileUser: { label: 'User Mobile', icon: <AccountCircle /> },
    mobilePassword: { label: 'Kode Akses / Pass Mobile', icon: <VpnKey /> },
    mobilePin: { label: 'Pin Mobile', icon: <VpnKey /> },
    ibUser: { label: 'User IB', icon: <AccountCircle /> },
    ibPassword: { label: 'Pass IB', icon: <VpnKey /> },
    ibPin: { label: 'Pin IB', icon: <VpnKey /> },
    myBCAUser: { label: 'BCA-ID', icon: <AccountCircle /> },
    myBCAPassword: { label: 'Pass BCA-ID', icon: <VpnKey /> },
    myBCAPin: { label: 'Pin Transaksi', icon: <VpnKey /> },
    email: { label: 'Email', icon: <Email /> },
    passEmail: { label: 'Pass Email', icon: <VpnKey /> }
  };

  // Sensitive fields to mask
  const sensitiveFields = [
    'pinWondr', 'passWondr'
  ];

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: { width: { xs: '100%', md: '50%', lg: '40%' } }
      }}
    >
      <Box sx={{ p: 3, height: '100%', overflow: 'auto' }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5" sx={{ fontWeight: 'bold', flex: 1 }}>
            Detail Produk
          </Typography>
          <IconButton onClick={onClose} size="large">
            <Close />
          </IconButton>
        </Box>

        <Divider sx={{ mb: 3 }} />

        {/* Action Buttons */}
        <Box sx={{ display: 'flex', gap: 1, mb: 3, flexWrap: 'wrap' }}>
          <Button
            variant="contained"
            startIcon={<Print />}
            onClick={handlePrintInvoice}
            disabled={loading}
            color="primary"
          >
            Print Invoice
          </Button>
          <Button
            variant="outlined"
            startIcon={<Edit />}
            onClick={handleEdit}
            color="secondary"
          >
            Edit
          </Button>
        </Box>

        {/* Photos Section */}
        {(product.uploadFotoId || product.uploadFotoSelfie) && (
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
                Foto Dokumen
              </Typography>
              <Grid container spacing={2}>
                {product.uploadFotoId && (
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" gutterBottom>
                      Foto KTP
                    </Typography>
                    <CardMedia
                      component="img"
                      image={buildImageUrl(product.uploadFotoId)}
                      alt="Foto KTP"
                      sx={{
                        width: '100%',
                        maxHeight: 200,
                        objectFit: 'contain',
                        borderRadius: 1,
                        border: '1px solid #ddd'
                      }}
                    />
                  </Grid>
                )}
                {product.uploadFotoSelfie && (
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" gutterBottom>
                      Foto Selfie
                    </Typography>
                    <CardMedia
                      component="img"
                      image={buildImageUrl(product.uploadFotoSelfie)}
                      alt="Foto Selfie"
                      sx={{
                        width: '100%',
                        maxHeight: 200,
                        objectFit: 'contain',
                        borderRadius: 1,
                        border: '1px solid #ddd'
                      }}
                    />
                  </Grid>
                )}
              </Grid>
            </CardContent>
          </Card>
        )}

        {/* Product Information */}
        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
              Informasi Produk
            </Typography>
            <Table size="small">
              <TableBody>
                {Object.entries(fieldConfig).map(([key, config]) => {
                  let value = product[key];

                  if (value === undefined || value === null || value === '') {
                    return null;
                  }

                  // Format specific fields
                  if (key === 'expired') {
                    value = formatDate(value);
                  }

                  // Mask sensitive fields
                  if (sensitiveFields.includes(key) && value) {
                    value = '••••••••';
                  }

                  return (
                    <TableRow key={key}>
                      <TableCell
                        component="th"
                        scope="row"
                        sx={{
                          fontWeight: 'bold',
                          width: '35%',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1
                        }}
                      >
                        {config.icon}
                        {key === 'mobileUser' && product.bank?.toLowerCase().includes('ocbc') ? 'User Nyala' :
                          config.label}
                      </TableCell>
                      <TableCell>
                        {key === 'status' ? (
                          getStatusChip(value, 'small', { fontSize: '0.75rem' })
                        ) : key === 'nik' ? (
                          <Chip
                            label={value}
                            variant="outlined"
                            color="primary"
                            sx={{ fontWeight: 'bold' }}
                          />
                        ) : (
                          String(value)
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Additional Info */}
        <Card sx={{ mt: 2 }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
              Informasi Tambahan
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  Dibuat
                </Typography>
                <Typography variant="body1">
                  {formatDate(product.createdAt)}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  Terakhir Diupdate
                </Typography>
                <Typography variant="body1">
                  {formatDate(product.updatedAt)}
                </Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Box>
    </Drawer>
  );
};

export default ProductDetailDrawer;
