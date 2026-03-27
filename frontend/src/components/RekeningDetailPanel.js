import React, { useState, useEffect, useCallback } from 'react';
import {
  Card, CardContent, Typography, Box, Grid, TextField,
  Button, Dialog, DialogTitle, DialogContent, DialogActions,
  FormControl, InputLabel, Select, MenuItem, CircularProgress, Alert,
  Chip, InputAdornment
} from '@mui/material';
import { Edit, Delete } from '@mui/icons-material';
import axios from '../utils/axios';

const RekeningDetailPanel = ({ account, onDetailUpdate }) => {
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [formData, setFormData] = useState({
    namaBank: '',
    nomorRekening: '',
    namaPemilik: '',
    saldoAwal: '',
    keterangan: '',
    status: 'aktif',
    tipeRekening: 'tabungan',
    mata_uang: 'IDR'
  });

  // Format number with dot separator (Indonesian format: 1.000.000)
  const formatNumberWithDots = (num) => {
    if (!num && num !== 0) return '';
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };

  // Parse number from dot-separated format back to pure number
  const parseNumberFromDots = (str) => {
    if (!str) return '';
    return str.replace(/\./g, '');
  };

  const fetchRekeningDetail = useCallback(async () => {
    try {
      setLoading(true);
      console.log(`🔍 Fetching rekening detail for account: ${account}`);
      const response = await axios.get(`/api/rekening/account/${account}`);
      console.log('✅ Rekening detail fetched:', response.data);
      
      if (response.data.success && response.data.data) {
        setDetail(response.data.data);
        setError(null);
      } else {
        setDetail(null);
        setError(null); // No detail yet, not an error
      }
    } catch (err) {
      console.log(`❌ Error status: ${err.response?.status}`);
      if (err.response?.status === 404) {
        // Not found is okay, user can create new
        console.log('📝 No detail found yet - showing create form');
        setDetail(null);
        setError(null);
      } else {
        console.error('❌ Error fetching rekening detail:', err.response?.data || err.message);
        setError('Gagal memuat detail rekening');
      }
    } finally {
      setLoading(false);
    }
  }, [account]);

  // Fetch detail rekening
  useEffect(() => {
    fetchRekeningDetail();
  }, [fetchRekeningDetail]);

  const handleOpenDialog = () => {
    console.log('🔓 [CLICK] Opening dialog button clicked!');
    console.log('   Detail exists:', !!detail);
    console.log('   Current state:', { detail, openDialog, editMode });
    
    if (detail) {
      // Edit mode
      console.log('✏️ Setting form data for EDIT mode');
      setFormData({
        namaBank: detail.namaBank || '',
        nomorRekening: detail.nomorRekening || '',
        namaPemilik: detail.namaPemilik || '',
        saldoAwal: detail.saldoAwal || '',
        keterangan: detail.keterangan || '',
        status: detail.status || 'aktif',
        tipeRekening: detail.tipeRekening || 'tabungan',
        mata_uang: detail.mata_uang || 'IDR'
      });
      setEditMode(true);
    } else {
      // Create mode
      console.log('➕ Setting form data for CREATE mode');
      setFormData({
        namaBank: '',
        nomorRekening: '',
        namaPemilik: '',
        saldoAwal: '',
        keterangan: '',
        status: 'aktif',
        tipeRekening: 'tabungan',
        mata_uang: 'IDR'
      });
      setEditMode(false);
    }
    
    console.log('📂 About to set openDialog to TRUE');
    setOpenDialog(true);
    console.log('✅ Dialog state updated - should be visible now!');
  };

  const handleCloseDialog = () => {
    console.log('🔒 Closing dialog');
    setOpenDialog(false);
    setFormData({
      namaBank: '',
      nomorRekening: '',
      namaPemilik: '',
      saldoAwal: '',
      keterangan: '',
      status: 'aktif',
      tipeRekening: 'tabungan',
      mata_uang: 'IDR'
    });
    console.log('✅ Dialog closed, form cleared');
  };

  const handleDeleteRekening = async () => {
    try {
      console.log(`🗑️ Deleting ${account} detail...`);
      const response = await axios.delete(`/api/rekening/account/${account}`);
      console.log('✅ Delete response:', response.data);
      
      if (response.data.success) {
        console.log('✅ Rekening deleted successfully');
        setDetail(null);
        setDeleteConfirmOpen(false);
        if (onDetailUpdate) {
          onDetailUpdate(null);
        }
      }
    } catch (err) {
      console.error('❌ Error deleting rekening:', err);
      alert(err.response?.data?.error || 'Gagal menghapus detail rekening');
    }
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    console.log(`📝 Form field changed: ${name} = ${value}`);
    
    // Special handling for numeric fields with dot separator
    if (name === 'saldoAwal') {
      const cleanedValue = parseNumberFromDots(value);
      const formattedValue = formatNumberWithDots(cleanedValue);
      setFormData(prev => ({
        ...prev,
        [name]: formattedValue
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('📤 Submitting form. Edit mode:', editMode);

    // Validation
    if (!formData.namaBank || !formData.nomorRekening || !formData.namaPemilik) {
      console.warn('⚠️ Validation failed - missing required fields');
      alert('Nama Bank, Nomor Rekening, dan Nama Pemilik wajib diisi');
      return;
    }

    try {
      let response;
      if (editMode && detail) {
        // Update
        console.log(`🔄 Updating ${account} detail...`);
        response = await axios.put(`/api/rekening/account/${account}`, {
          ...formData,
          saldoAwal: parseFloat(parseNumberFromDots(formData.saldoAwal)) || 0
        });
      } else {
        // Create
        console.log(`✨ Creating new ${account} detail...`);
        response = await axios.post('/api/rekening', {
          account: account,
          ...formData,
          saldoAwal: parseFloat(parseNumberFromDots(formData.saldoAwal)) || 0
        });
      }

      console.log('✅ API response:', response.data);

      if (response.data.success) {
        console.log('✅ Success! Setting detail and closing dialog');
        setDetail(response.data.data);
        handleCloseDialog();
        if (onDetailUpdate) {
          onDetailUpdate(response.data.data);
        }
      } else {
        console.warn('⚠️ API returned success: false');
        alert('Gagal menyimpan detail rekening (API returned false)');
      }
    } catch (err) {
      console.error('❌ Error saving rekening detail:', {
        status: err.response?.status,
        error: err.response?.data?.error,
        message: err.message
      });
      alert(err.response?.data?.error || 'Gagal menyimpan detail rekening');
    }
  };

  if (loading) {
    return (
      <>
        <Card sx={{ mb: 3, borderRadius: 2 }}>
          <CardContent sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress size={40} />
          </CardContent>
        </Card>
        
        {/* Dialog - Always render at top level */}
        <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
          <DialogTitle sx={{ bgcolor: 'primary.main', color: 'white', fontWeight: 'bold' }}>
            Dialog
          </DialogTitle>
        </Dialog>
      </>
    );
  }

  // If no detail, show create button
  if (!detail) {
    return (
      <>
        <Card sx={{
          mb: 3,
          borderRadius: 2,
          border: '2px dashed',
          borderColor: 'primary.light',
          bgcolor: 'primary.lighter'
        }}>
          {/* DEBUG: Show if dialog is open */}
          {openDialog && (
            <Alert severity="info" sx={{ borderRadius: 0, borderBottom: '1px solid' }}>
              🔍 DEBUG: Dialog state = OPEN (openDialog: true)
            </Alert>
          )}
          
          <CardContent sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="h6" color="primary" sx={{ mb: 1, fontWeight: 'bold' }}>
              ℹ️ Detail {account} Belum Diatur
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Silakan masukkan informasi rekening bank untuk {account}
            </Typography>
            <Button
              variant="contained"
              onClick={handleOpenDialog}
              size="small"
            >
              Atur Detail Rekening
            </Button>
          </CardContent>
        </Card>

        {/* Delete Confirmation Dialog */}
        <Dialog
          open={deleteConfirmOpen}
          onClose={() => setDeleteConfirmOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle sx={{ bgcolor: 'error.main', color: 'white', fontWeight: 'bold' }}>
            ⚠️ Hapus Detail Rekening
          </DialogTitle>
          <DialogContent sx={{ pt: 3 }}>
            <Typography>
              Apakah Anda yakin ingin menghapus detail {account}? Tindakan ini tidak dapat dibatalkan.
            </Typography>
            <Alert severity="warning" sx={{ mt: 2 }}>
              Semua data transaksi yang terkait akan tetap tersimpan, hanya detail rekening yang akan dihapus.
            </Alert>
          </DialogContent>
          <DialogActions sx={{ p: 2, gap: 1 }}>
            <Button onClick={() => setDeleteConfirmOpen(false)}>
              Batal
            </Button>
            <Button
              onClick={handleDeleteRekening}
              variant="contained"
              color="error"
            >
              Ya, Hapus
            </Button>
          </DialogActions>
        </Dialog>

        {/* Edit Dialog - Always render at top level */}
        {console.log('🔍 Dialog render check: openDialog =', openDialog, ', Dialog should be', openDialog ? 'VISIBLE' : 'hidden')}
        <Dialog 
          open={openDialog} 
          onClose={handleCloseDialog} 
          maxWidth="sm" 
          fullWidth
          PaperProps={{
            sx: {
              bgcolor: 'background.paper',
              boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
              borderRadius: '12px'
            }
          }}
        >
          <DialogTitle sx={{ 
            bgcolor: account === 'Rekening B' ? 'info.main' : 'primary.main', 
            color: 'white', 
            fontWeight: 'bold',
            fontSize: '1.3rem',
            py: 2.5,
            borderBottom: '1px solid rgba(255,255,255,0.1)'
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{ fontSize: '1.5rem' }}>💳</Box>
              <Box>
                {editMode ? `Ubah Detail ${account}` : `Tambah Detail ${account}`}
              </Box>
            </Box>
          </DialogTitle>
          <form onSubmit={handleSubmit}>
            <DialogContent sx={{ 
              pt: 3,
              pb: 2,
              bgcolor: 'background.paper'
            }}>
              <Grid container spacing={2.5}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Nama Bank"
                    name="namaBank"
                    value={formData.namaBank}
                    onChange={handleFormChange}
                    placeholder="Contoh: Bank Mandiri"
                    required
                    InputProps={{
                      startAdornment: <Box sx={{ mr: 1, fontSize: '1.2rem' }}>🏦</Box>
                    }}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1 } }}
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Nomor Rekening"
                    name="nomorRekening"
                    value={formData.nomorRekening}
                    onChange={handleFormChange}
                    placeholder="Contoh: 1234567890"
                    required
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1 } }}
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Nama Pemilik Rekening"
                    name="namaPemilik"
                    value={formData.namaPemilik}
                    onChange={handleFormChange}
                    placeholder="Contoh: PT. Aksesoris Indonesia"
                    required
                    InputProps={{
                      startAdornment: <Box sx={{ mr: 1, fontSize: '1.2rem' }}>👤</Box>
                    }}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1 } }}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Saldo Awal"
                    name="saldoAwal"
                    value={formData.saldoAwal}
                    onChange={handleFormChange}
                    InputProps={{ 
                      startAdornment: <InputAdornment position="start">Rp </InputAdornment>
                    }}
                    placeholder="0"
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1 } }}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth variant="outlined">
                    <InputLabel>Tipe Rekening</InputLabel>
                    <Select
                      name="tipeRekening"
                      value={formData.tipeRekening}
                      onChange={handleFormChange}
                      label="Tipe Rekening"
                      sx={{ borderRadius: 1 }}
                    >
                      <MenuItem value="tabungan">💰 Tabungan</MenuItem>
                      <MenuItem value="giro">📊 Giro</MenuItem>
                      <MenuItem value="simpanan">🏪 Simpanan</MenuItem>
                      <MenuItem value="lainnya">📋 Lainnya</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth variant="outlined">
                    <InputLabel>Mata Uang</InputLabel>
                    <Select
                      name="mata_uang"
                      value={formData.mata_uang}
                      onChange={handleFormChange}
                      label="Mata Uang"
                      sx={{ borderRadius: 1 }}
                    >
                      <MenuItem value="IDR">💵 IDR (Rupiah)</MenuItem>
                      <MenuItem value="USD">💲 USD (Dollar)</MenuItem>
                      <MenuItem value="EUR">€ EUR (Euro)</MenuItem>
                      <MenuItem value="SGD">💴 SGD (Singapore Dollar)</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth variant="outlined">
                    <InputLabel>Status</InputLabel>
                    <Select
                      name="status"
                      value={formData.status}
                      onChange={handleFormChange}
                      label="Status"
                      sx={{ borderRadius: 1 }}
                    >
                      <MenuItem value="aktif">✅ Aktif</MenuItem>
                      <MenuItem value="nonaktif">⛔ Nonaktif</MenuItem>
                      <MenuItem value="archived">📦 Archived</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Keterangan"
                    name="keterangan"
                    value={formData.keterangan}
                    onChange={handleFormChange}
                    multiline
                    rows={3}
                    placeholder="Catatan atau penjelasan tentang rekening ini..."
                    variant="outlined"
                    sx={{ 
                      '& .MuiOutlinedInput-root': { borderRadius: 1 },
                      '& .MuiOutlinedInput-root textarea': { fontFamily: 'inherit' }
                    }}
                  />
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions sx={{ 
              p: 2.5,
              borderTop: '1px solid',
              borderColor: 'divider',
              gap: 1
            }}>
              <Button 
                onClick={handleCloseDialog}
                sx={{ 
                  px: 3,
                  textTransform: 'none',
                  fontSize: '0.95rem'
                }}
              >
                ❌ Batal
              </Button>
              <Button 
                type="submit" 
                variant="contained"
                sx={{ 
                  px: 4,
                  textTransform: 'none',
                  fontSize: '0.95rem',
                  background: account === 'Rekening B' ? 'linear-gradient(135deg, #0288D1, #01579B)' : 'linear-gradient(135deg, #1976D2, #1565C0)',
                  '&:hover': {
                    background: account === 'Rekening B' ? 'linear-gradient(135deg, #01579B, #0D47A1)' : 'linear-gradient(135deg, #1565C0, #0D47A1)'
                  }
                }}
              >
                {editMode ? '💾 Perbarui' : '✅ Simpan'}
              </Button>
            </DialogActions>
          </form>
        </Dialog>
      </>
    );
  }

  // Display detail
  return (
    <>
      <Card sx={{
        mb: 3,
        borderRadius: 2,
        border: '1px solid',
        borderColor: account === 'Rekening B' ? 'info.light' : 'primary.light',
        bgcolor: account === 'Rekening B' ? 'info.lighter' : 'primary.lighter'
      }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                🏦 {detail.namaBank}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {detail.namaPemilik}
              </Typography>
            </Box>
            <Box>
              <Chip
                label={detail.status === 'aktif' ? '✓ Aktif' : '✕ Nonaktif'}
                color={detail.status === 'aktif' ? 'success' : 'error'}
                size="small"
                sx={{ mr: 1 }}
              />
              <Button
                size="small"
                startIcon={<Edit />}
                onClick={handleOpenDialog}
                variant="outlined"
                sx={{ mr: 1 }}
              >
                Edit
              </Button>
              <Button
                size="small"
                startIcon={<Delete />}
                onClick={() => setDeleteConfirmOpen(true)}
                variant="outlined"
                color="error"
              >
                Hapus
              </Button>
            </Box>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <Box sx={{ py: 1 }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase' }}>
                  Nomor Rekening
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 'bold', mt: 0.5 }}>
                  {detail.nomorRekening}
                </Typography>
              </Box>
            </Grid>

            <Grid item xs={12} sm={6}>
              <Box sx={{ py: 1 }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase' }}>
                  Saldo Awal
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 'bold', mt: 0.5, color: 'success.main' }}>
                  Rp {(detail.saldoAwal || 0).toLocaleString('id-ID')}
                </Typography>
              </Box>
            </Grid>



            <Grid item xs={12} sm={6}>
              <Box sx={{ py: 1 }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase' }}>
                  Tipe Rekening
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 'bold', mt: 0.5 }}>
                  {detail.tipeRekening === 'tabungan' ? 'Tabungan' : 
                   detail.tipeRekening === 'giro' ? 'Giro' : 
                   detail.tipeRekening === 'simpanan' ? 'Simpanan' : 'Lainnya'}
                </Typography>
              </Box>
            </Grid>

            <Grid item xs={12} sm={6}>
              <Box sx={{ py: 1 }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase' }}>
                  Mata Uang
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 'bold', mt: 0.5 }}>
                  {detail.mata_uang}
                </Typography>
              </Box>
            </Grid>

            {detail.keterangan && (
              <Grid item xs={12}>
                <Box sx={{ py: 1, bgcolor: 'grey.50', p: 1.5, borderRadius: 1 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase' }}>
                    Keterangan
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 0.5 }}>
                    {detail.keterangan}
                  </Typography>
                </Box>
              </Grid>
            )}
          </Grid>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog - Display Detail Section */}
      <Dialog
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ bgcolor: 'error.main', color: 'white', fontWeight: 'bold' }}>
          ⚠️ Hapus Detail Rekening
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Typography>
            Apakah Anda yakin ingin menghapus detail {account}? Tindakan ini tidak dapat dibatalkan.
          </Typography>
          <Alert severity="warning" sx={{ mt: 2 }}>
            Semua data transaksi yang terkait akan tetap tersimpan, hanya detail rekening yang akan dihapus.
          </Alert>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button onClick={() => setDeleteConfirmOpen(false)}>
            Batal
          </Button>
          <Button
            onClick={handleDeleteRekening}
            variant="contained"
            color="error"
          >
            Ya, Hapus
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Dialog - Professional Design */}
      {console.log('🔍 Dialog render check: openDialog =', openDialog, ', Dialog should be', openDialog ? 'VISIBLE' : 'hidden')}
      <Dialog 
        open={openDialog} 
        onClose={handleCloseDialog} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: 'background.paper',
            boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
            borderRadius: '12px'
          }
        }}
      >
        <DialogTitle sx={{ 
          bgcolor: account === 'Rekening B' ? 'info.main' : 'primary.main', 
          color: 'white', 
          fontWeight: 'bold',
          fontSize: '1.3rem',
          py: 2.5,
          borderBottom: '1px solid rgba(255,255,255,0.1)'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ fontSize: '1.5rem' }}>💳</Box>
            <Box>
              {editMode ? `Ubah Detail ${account}` : `Tambah Detail ${account}`}
            </Box>
          </Box>
        </DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent sx={{ 
            pt: 3,
            pb: 2,
            bgcolor: 'background.paper'
          }}>
            <Grid container spacing={2.5}>
              {/* Bank Name and Account Number - Side by side */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Nama Bank"
                  name="namaBank"
                  value={formData.namaBank}
                  onChange={handleFormChange}
                  placeholder="Contoh: Bank Mandiri"
                  required
                  variant="outlined"
                  InputProps={{
                    startAdornment: <Box sx={{ mr: 1, fontSize: '1.2rem' }}>🏦</Box>
                  }}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1 } }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Nomor Rekening"
                  name="nomorRekening"
                  value={formData.nomorRekening}
                  onChange={handleFormChange}
                  placeholder="Contoh: 1234567890"
                  required
                  variant="outlined"
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1 } }}
                />
              </Grid>

              {/* Account Owner */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Nama Pemilik Rekening"
                  name="namaPemilik"
                  value={formData.namaPemilik}
                  onChange={handleFormChange}
                  placeholder="Contoh: PT. Aksesoris Indonesia"
                  required
                  variant="outlined"
                  InputProps={{
                    startAdornment: <Box sx={{ mr: 1, fontSize: '1.2rem' }}>👤</Box>
                  }}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1 } }}
                />
              </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Saldo Awal"
                    name="saldoAwal"
                    value={formData.saldoAwal}
                    onChange={handleFormChange}
                    InputProps={{ 
                      startAdornment: <InputAdornment position="start">Rp </InputAdornment>
                    }}
                    placeholder="0"
                    variant="outlined"
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1 } }}
                  />
                </Grid>



              <Grid item xs={12} sm={6}>
                <FormControl fullWidth variant="outlined">
                  <InputLabel>Tipe Rekening</InputLabel>
                  <Select
                    name="tipeRekening"
                    value={formData.tipeRekening}
                    onChange={handleFormChange}
                    label="Tipe Rekening"
                    sx={{ borderRadius: 1 }}
                  >
                    <MenuItem value="tabungan">💰 Tabungan</MenuItem>
                    <MenuItem value="giro">📊 Giro</MenuItem>
                    <MenuItem value="simpanan">🏪 Simpanan</MenuItem>
                    <MenuItem value="lainnya">📋 Lainnya</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              {/* Currency and Status */}
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth variant="outlined">
                  <InputLabel>Mata Uang</InputLabel>
                  <Select
                    name="mata_uang"
                    value={formData.mata_uang}
                    onChange={handleFormChange}
                    label="Mata Uang"
                    sx={{ borderRadius: 1 }}
                  >
                    <MenuItem value="IDR">💵 IDR (Rupiah)</MenuItem>
                    <MenuItem value="USD">💲 USD (Dollar)</MenuItem>
                    <MenuItem value="EUR">€ EUR (Euro)</MenuItem>
                    <MenuItem value="SGD">💴 SGD (Singapore Dollar)</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth variant="outlined">
                  <InputLabel>Status</InputLabel>
                  <Select
                    name="status"
                    value={formData.status}
                    onChange={handleFormChange}
                    label="Status"
                    sx={{ borderRadius: 1 }}
                  >
                    <MenuItem value="aktif">✅ Aktif</MenuItem>
                    <MenuItem value="nonaktif">⛔ Nonaktif</MenuItem>
                    <MenuItem value="archived">📦 Archived</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              {/* Notes */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Keterangan"
                  name="keterangan"
                  value={formData.keterangan}
                  onChange={handleFormChange}
                  multiline
                  rows={3}
                  placeholder="Catatan atau penjelasan tentang rekening ini..."
                  variant="outlined"
                  sx={{ 
                    '& .MuiOutlinedInput-root': { borderRadius: 1 },
                    '& .MuiOutlinedInput-root textarea': { fontFamily: 'inherit' }
                  }}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ 
            p: 2.5,
            borderTop: '1px solid',
            borderColor: 'divider',
            gap: 1
          }}>
            <Button 
              onClick={handleCloseDialog}
              sx={{ 
                px: 3,
                textTransform: 'none',
                fontSize: '0.95rem'
              }}
            >
              ❌ Batal
            </Button>
            <Button 
              type="submit" 
              variant="contained"
              sx={{ 
                px: 4,
                textTransform: 'none',
                fontSize: '0.95rem',
                background: account === 'Rekening B' ? 'linear-gradient(135deg, #0288D1, #01579B)' : 'linear-gradient(135deg, #1976D2, #1565C0)',
                '&:hover': {
                  background: account === 'Rekening B' ? 'linear-gradient(135deg, #01579B, #0D47A1)' : 'linear-gradient(135deg, #1565C0, #0D47A1)'
                }
              }}
            >
              {editMode ? '💾 Perbarui' : '✅ Simpan'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </>
  );
};

export default RekeningDetailPanel;
