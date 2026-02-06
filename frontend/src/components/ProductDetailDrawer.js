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
  AccountCircle,
  PictureAsPdf
} from '@mui/icons-material';
import { useNotification } from '../contexts/NotificationContext';
import { getStatusChip } from '../utils/statusHelpers';
import axios from 'axios';

const ProductDetailDrawer = ({ open, onClose, product, onPrintInvoice, onExportPdf }) => {
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
    mobilePassword: { label: 'Password Mobile', icon: <VpnKey /> },
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

  // Bank-specific credential fields mapping
  // Using generic fields (mobileUser, mobilePassword, etc) for most banks
  // Only use specific fields if the bank has unique requirements (e.g., BCA)
  const bankSpecificFields = {
    'BCA': ['myBCAUser', 'myBCAPassword', 'myBCAPin', 'mobilePassword', 'mobileUser', 'mobilePin'],
    'BRI': ['mobileUser', 'mobilePassword', 'mobilePin', 'ibUser', 'ibPassword', 'ibPin'],
    'BNI': ['mobileUser', 'mobilePassword', 'mobilePin', 'ibUser', 'ibPassword', 'ibPin'],
    'MANDIRI': ['mobileUser', 'mobilePassword', 'mobilePin', 'ibUser', 'ibPassword', 'ibPin'],
    'CIMB': ['mobileUser', 'mobilePassword', 'mobilePin', 'ibUser', 'ibPassword', 'ibPin'],
    'OCBC': ['mobileUser', 'mobilePassword', 'mobilePin'],
    'PERMATA': ['mobileUser', 'mobilePassword', 'mobilePin', 'ibUser', 'ibPassword', 'ibPin'],
    'DANAMON': ['mobileUser', 'mobilePassword', 'mobilePin', 'ibUser', 'ibPassword', 'ibPin'],
    'BTN': ['mobileUser', 'mobilePassword', 'mobilePin', 'ibUser', 'ibPassword', 'ibPin']
  };

  // Helper to get dynamic label based on bank
  const getFieldLabel = (key, originalLabel, bankName) => {
    if (!bankName) return originalLabel;
    const bank = bankName.toUpperCase();

    if (key === 'mobileUser') {
      if (bank.includes('BNI')) return 'User Wondr';
      if (bank.includes('MANDIRI')) return 'User Livin';
      if (bank.includes('BRI')) return 'User Brimo';
      if (bank.includes('OCBC')) return 'User Nyala';
      if (bank.includes('BCA')) return 'User M-BCA';
    }

    if (key === 'mobilePassword') {
      if (bank.includes('BNI')) return 'Password Wondr';
      if (bank.includes('MANDIRI')) return 'Password Livin';
      if (bank.includes('BRI')) return 'Password Brimo';
      if (bank.includes('OCBC')) return 'Password Mobile';
      if (bank.includes('BCA')) return 'Kode Akses';
      // Default fallback
      return 'Password Mobile';
    }

    if (key === 'mobilePin') {
      if (bank.includes('BNI')) return 'PIN Wondr';
      if (bank.includes('MANDIRI')) return 'PIN Livin';
      if (bank.includes('BRI')) return 'PIN Brimo';
    }

    return originalLabel;
  };

  // Common fields that should always be displayed
  const commonFields = [
    'status', 'noOrder', 'codeAgen', 'customer', 'bank', 'grade', 'kcp',
    'nik', 'nama', 'namaIbuKandung', 'tempatTanggalLahir', 'noRek', 'noAtm',
    'validThru', 'noHp', 'pinAtm', 'fieldStaff', 'expired', 'email', 'passEmail'
  ];

  // Function to determine if a field should be shown based on bank
  const shouldShowField = (fieldKey, bankName) => {
    // Always show common fields
    if (commonFields.includes(fieldKey)) return true;

    // If no bank specified, hide bank-specific fields
    if (!bankName || bankName === '-') return false;

    // Check if field is bank-specific
    const bankUpper = bankName.toUpperCase();
    for (const [bank, fields] of Object.entries(bankSpecificFields)) {
      if (bankUpper.includes(bank)) {
        return fields.includes(fieldKey);
      }
    }

    // If field is not in any bank-specific list, don't show it
    return false;
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
        sx: { width: { xs: '100%', md: '85%', lg: '70%' } }
      }}
    >
      <Box sx={{ p: 4, height: '100%', overflow: 'auto' }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" sx={{ fontWeight: 'bold', flex: 1 }}>
            Detail Produk
          </Typography>
          <IconButton onClick={onClose} size="large">
            <Close sx={{ fontSize: 32 }} />
          </IconButton>
        </Box>

        <Divider sx={{ mb: 4 }} />

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
            variant="contained"
            startIcon={<PictureAsPdf />}
            onClick={() => onExportPdf && onExportPdf(product)}
            disabled={loading}
            color="success"
            sx={{ color: 'white' }}
          >
            Export PDF
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
        <Card sx={{ boxShadow: 3 }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h5" sx={{ mb: 3, fontWeight: 'bold' }}>
              Informasi Produk
            </Typography>
            <Table size="medium">
              <TableBody>
                {Object.entries(fieldConfig)
                  .filter(([key]) => shouldShowField(key, product.bank))
                  .map(([key, config]) => {
                    let value = product[key] || '-';

                    // Format specific fields
                    if (key === 'expired') {
                      value = formatDate(value);
                    }

                    // Mask sensitive fields
                    if (sensitiveFields.includes(key) && value) {
                      value = '••••••••';
                    }

                    return (
                      <TableRow key={key} hover>
                        <TableCell
                          component="th"
                          scope="row"
                          sx={{
                            fontWeight: 'bold',
                            width: '35%',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 2,
                            fontSize: '1.1rem',
                            py: 2
                          }}
                        >
                          {React.cloneElement(config.icon, { sx: { fontSize: 28 } })}
                          {getFieldLabel(key, config.label, product.bank)}
                        </TableCell>
                        <TableCell sx={{ fontSize: '1.2rem', py: 2 }}>
                          {key === 'status' ? (
                            getStatusChip(value, 'medium', { fontSize: '1rem', px: 2 })
                          ) : key === 'nik' ? (
                            <Chip
                              label={value}
                              variant="outlined"
                              color="primary"
                              sx={{ fontWeight: 'bold', fontSize: '1.1rem', height: 32 }}
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
