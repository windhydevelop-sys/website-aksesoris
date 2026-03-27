import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Select, MenuItem,
  FormControl, InputLabel, TextField, Button, Box, CircularProgress,
  Alert, Typography
} from '@mui/material';
import axios from '../utils/axios';

const PaymentReceiverDialog = ({ open, product, onClose, onSubmit }) => {
  const [loading, setLoading] = useState(false);
  const [loadingRekening, setLoadingRekening] = useState(true);
  const [error, setError] = useState(null);
  const [rekening, setRekening] = useState([]);
  
  const [formData, setFormData] = useState({
    rekeningId: '',
    amount: product?.harga || 0,
    paymentMethod: 'transfer',
    notes: ''
  });

  // Fetch rekening list
  useEffect(() => {
    const fetchRekening = async () => {
      try {
        console.log('🏦 Fetching list of rekening...');
        const response = await axios.get('/api/rekening');
        
        if (response.data.success) {
          console.log('✅ Rekening fetched:', response.data.data.length);
          setRekening(response.data.data);
        }
      } catch (err) {
        console.error('❌ Error fetching rekening:', err);
        setError('Gagal memuat daftar rekening');
      } finally {
        setLoadingRekening(false);
      }
    };

    if (open) {
      fetchRekening();
    }
  }, [open]);

  // Handle input change
  const handleChange = (field, value) => {
    console.log(`📝 Field "${field}" changed to:`, value);
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    setError(null);
  };

  // Handle submit
  const handleSubmit = async () => {
    try {
      // Validation
      if (!formData.rekeningId) {
        setError('Pilih rekening terlebih dahulu');
        return;
      }

      setLoading(true);
      console.log('💳 Submitting payment:', formData);
      
      await onSubmit(formData);
    } catch (err) {
      console.error('❌ Error in form submit:', err);
      setError(err.message || 'Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  };

  const selectedRekeningData = rekening.find(r => r._id === formData.rekeningId);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>
        💳 Catat Pembayaran Produk
      </DialogTitle>

      <DialogContent sx={{ pt: 2 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {/* Product Info */}
          <Box sx={{ 
            p: 1.5, 
            backgroundColor: '#e3f2fd', 
            borderRadius: 1,
            borderLeft: '4px solid #1976d2'
          }}>
            <Typography variant="body2">
              <strong>📦 Produk:</strong> {product?.noOrder || product?.nama || 'Unknown'}
            </Typography>
            <Typography variant="body2" sx={{ mt: 0.5 }}>
              <strong>💰 Jumlah:</strong> Rp {(product?.harga || 0).toLocaleString('id-ID')}
            </Typography>
          </Box>

          {/* Loading rekening */}
          {loadingRekening && (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
              <CircularProgress size={24} />
            </Box>
          )}

          {/* Rekening Select */}
          {!loadingRekening && (
            <>
              <FormControl fullWidth disabled={loading}>
                <InputLabel>🏦 Pilih Rekening</InputLabel>
                <Select
                  value={formData.rekeningId}
                  label="🏦 Pilih Rekening"
                  onChange={(e) => handleChange('rekeningId', e.target.value)}
                >
                  {rekening.length === 0 ? (
                    <MenuItem disabled>Tidak ada rekening</MenuItem>
                  ) : (
                    rekening.map((r, idx) => {
                      // Determine rekening label (A or B)
                      const rekeningLabel = r.nama?.includes('A') || r.account === 'Rekening A' 
                        ? 'Rekening A' 
                        : r.nama?.includes('B') || r.account === 'Rekening B'
                        ? 'Rekening B'
                        : `Rekening ${String.fromCharCode(65 + idx)}`; // Fallback: A, B, C...
                      
                      return (
                        <MenuItem key={r._id} value={r._id}>
                          {rekeningLabel} - {r.bank || 'Bank'}
                        </MenuItem>
                      );
                    })
                  )}
                </Select>
              </FormControl>

              {/* Selected Rekening Details */}
              {selectedRekeningData && (
                <Box sx={{ 
                  p: 1.5, 
                  backgroundColor: '#f5f5f5', 
                  borderRadius: 1
                }}>
                  <Typography variant="caption" color="text.secondary">
                    <strong>Saldo Saat Ini:</strong>
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 0.5 }}>
                    Rp {(selectedRekeningData.saldoAwal || 0).toLocaleString('id-ID')}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                    <strong>Bank:</strong> {selectedRekeningData.bank}
                  </Typography>
                </Box>
              )}

              {/* Payment Method */}
              <FormControl fullWidth disabled={loading}>
                <InputLabel>📱 Metode Pembayaran</InputLabel>
                <Select
                  value={formData.paymentMethod}
                  label="📱 Metode Pembayaran"
                  onChange={(e) => handleChange('paymentMethod', e.target.value)}
                >
                  <MenuItem value="transfer">Transfer Bank</MenuItem>
                  <MenuItem value="cash">Tunai</MenuItem>
                  <MenuItem value="check">Cek</MenuItem>
                  <MenuItem value="other">Lainnya</MenuItem>
                </Select>
              </FormControl>

              {/* Notes */}
              <TextField
                label="📝 Keterangan (Opsional)"
                multiline
                rows={3}
                value={formData.notes}
                onChange={(e) => handleChange('notes', e.target.value)}
                disabled={loading}
                placeholder="Contoh: Pembayaran untuk order #001, referensi bank xxx"
              />
            </>
          )}
        </Box>
      </DialogContent>

      <DialogActions>
        <Button
          onClick={onClose}
          disabled={loading || loadingRekening}
        >
          Batal
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          color="success"
          disabled={loading || loadingRekening || !formData.rekeningId}
        >
          {loading ? <CircularProgress size={20} sx={{ mr: 1 }} /> : '✅'}
          {loading ? 'Mencatat...' : 'Terima Pembayaran'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PaymentReceiverDialog;
