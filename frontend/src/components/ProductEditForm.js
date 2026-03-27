import React, { useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button,
  FormControlLabel, Switch, Select, MenuItem, FormControl, InputLabel,
  Box, CircularProgress, Alert, Typography
} from '@mui/material';

const ProductEditForm = ({ open, product, onClose, onSubmit }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Helper: Format number with dot separators (1000000 -> 1.000.000)
  const formatNumberWithDots = (num) => {
    if (!num && num !== 0) return '';
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };

  const [formData, setFormData] = useState({
    hargaBeli: formatNumberWithDots(product?.hargaBeli || 0),
    hargaJual: formatNumberWithDots(product?.hargaJual || product?.harga || 0),
    status: product?.status || 'pending',
    sudahBayar: product?.sudahBayar || false
  });

  // Helper: Parse number from dot-separated format (1.000.000 -> 1000000)
  const parseNumberFromDots = (str) => {
    if (!str) return 0;
    return parseInt(str.toString().replace(/\./g, ''), 10) || 0;
  };

  // Handle input change
  const handleChange = (field, value) => {
    // Special handling for pricing fields - format with dots
    if (field === 'hargaBeli' || field === 'hargaJual') {
      // Allow only numbers
      const numericValue = value.replace(/[^0-9]/g, '');
      const cleanedValue = parseInt(numericValue, 10) || 0;
      const formattedValue = formatNumberWithDots(cleanedValue);
      
      setFormData(prev => ({
        ...prev,
        [field]: formattedValue
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
    setError(null);
  };

  // Handle submit
  const handleSubmit = async () => {
    try {
      const parsedBeli = parseNumberFromDots(formData.hargaBeli);
      const parsedJual = parseNumberFromDots(formData.hargaJual);
      
      // Validation
      if (parsedJual <= 0) {
        setError('Harga Jual harus lebih dari 0');
        return;
      }

      setLoading(true);
      console.log(' Form data before submit:', formData);
      console.log('💾 Parsed harga beli:', parsedBeli);
      console.log('💾 Parsed harga jual:', parsedJual);
      
      const submitData = {
        hargaBeli: parsedBeli,
        hargaJual: parsedJual,
        status: formData.status,
        sudahBayar: formData.sudahBayar
      };

      console.log('🚀 Submitting to API with data:', submitData);
      
      // If status is being changed to completed, prepare to generate invoice
      if (submitData.status === 'completed') {
        console.log('📋 Status changed to COMPLETED - Invoice will be generated');
      }
      
      await onSubmit(submitData);
    } catch (err) {
      console.error('❌ Error in form submit:', err);
      setError(err.message || 'Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>
        ✏️ Edit Produk
      </DialogTitle>

      <DialogContent sx={{ pt: 2 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {/* Prices Row */}
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
            {/* Harga Beli */}
            <TextField
              label="📥 Harga Beli (Hutang)"
              type="text"
              value={formData.hargaBeli}
              onChange={(e) => handleChange('hargaBeli', e.target.value)}
              fullWidth
              disabled={loading}
              placeholder="0"
              sx={{ mt: 1 }}
              inputProps={{ 
                style: { fontWeight: 'bold' }
              }}
              helperText={`Biaya ke Orlap: Rp ${formData.hargaBeli || 0}`}
            />

            {/* Harga Jual */}
            <TextField
              label="📤 Harga Jual (Piutang)"
              type="text"
              value={formData.hargaJual}
              onChange={(e) => handleChange('hargaJual', e.target.value)}
              fullWidth
              disabled={loading}
              placeholder="0"
              sx={{ mt: 1 }}
              inputProps={{ 
                style: { fontWeight: 'bold' }
              }}
              helperText={`Tagihan ke Customer: Rp ${formData.hargaJual || 0}`}
            />
          </Box>

          {/* Profit info */}
          <Box sx={{ 
            p: 1.5, 
            backgroundColor: '#e3f2fd', 
            borderRadius: 1,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#1976d2' }}>
              📈 Estimasi Profit:
            </Typography>
            <Typography variant="h6" sx={{ 
              fontWeight: 'bold', 
              color: parseNumberFromDots(formData.hargaJual) - parseNumberFromDots(formData.hargaBeli) >= 0 ? '#2e7d32' : '#d32f2f'
            }}>
              Rp {formatNumberWithDots(parseNumberFromDots(formData.hargaJual) - parseNumberFromDots(formData.hargaBeli))}
            </Typography>
          </Box>

          {/* Status */}
          <FormControl fullWidth disabled={loading}>
            <InputLabel>📊 Status</InputLabel>
            <Select
              value={formData.status}
              label="📊 Status"
              onChange={(e) => handleChange('status', e.target.value)}
            >
              <MenuItem value="completed">Completed</MenuItem>
              {/* Force selection to completed for payment management context */}
            </Select>
          </FormControl>

          {/* Sudah Bayar */}
          <FormControlLabel
            control={
              <Switch
                checked={formData.sudahBayar}
                onChange={(e) => handleChange('sudahBayar', e.target.checked)}
                disabled={loading}
              />
            }
            label={
              <span>
                ✅ Sudah Bayar
                {formData.sudahBayar && <span> (Lunas)</span>}
              </span>
            }
          />

          {/* Hint */}
          <Box sx={{ 
            p: 1.5, 
            backgroundColor: '#f0f0f0', 
            borderRadius: 1,
            fontSize: '0.875rem',
            color: '#666'
          }}>
            💡 <strong>Catatan:</strong>{' '}
            {formData.sudahBayar 
              ? 'Produk ini ditandai sebagai LUNAS. Jika belum, gunakan tombol pembayaran untuk mencatat pembayaran.'
              : 'Untuk mencatat pembayaran produk, gunakan tombol "Catat Pembayaran" setelah menyimpan.'}
          </Box>
        </Box>
      </DialogContent>

      <DialogActions>
        <Button
          onClick={onClose}
          disabled={loading}
        >
          Batal
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading}
        >
          {loading ? <CircularProgress size={20} sx={{ mr: 1 }} /> : '💾'}
          {loading ? 'Menyimpan...' : 'Simpan'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ProductEditForm;
