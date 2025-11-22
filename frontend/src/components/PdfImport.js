import React, { useState } from 'react';
import axios from 'axios';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
  Typography, Box, Alert, LinearProgress, Paper, Table,
  TableBody, TableCell, TableContainer, TableHead, TableRow,
  Chip, Accordion, AccordionSummary, AccordionDetails
} from '@mui/material';
import { CloudUpload, ExpandMore, CheckCircle, Error, Info } from '@mui/icons-material';

const PdfImport = ({ open, onClose, onImportSuccess }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const token = localStorage.getItem('token');

  // Supported file formats
  const supportedFormats = [
    { ext: '.pdf', type: 'application/pdf', label: 'PDF' },
    { ext: '.docx', type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', label: 'Word (.docx)' },
    { ext: '.xlsx', type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', label: 'Excel (.xlsx)' },
    { ext: '.xls', type: 'application/vnd.ms-excel', label: 'Excel (.xls)' },
    { ext: '.csv', type: 'text/csv', label: 'CSV' }
  ];

  const acceptedTypes = supportedFormats.map(format => format.type).join(',');

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Check if file type is supported
      const isSupported = supportedFormats.some(format => format.type === file.type);
      if (!isSupported) {
        const supportedLabels = supportedFormats.map(format => format.label).join(', ');
        setError(`Format file tidak didukung. Format yang didukung: ${supportedLabels}`);
        return;
      }

      if (file.size > 10 * 1024 * 1024) { // 10MB
        setError('Ukuran file maksimal 10MB');
        return;
      }

      setSelectedFile(file);
      setError('');
      setPreviewData(null);
      setSuccess('');
    }
  };

  const handlePreview = async () => {
    if (!selectedFile) return;

    setUploading(true);
    setError('');

    const formData = new FormData();
    formData.append('documentFile', selectedFile);

    try {
      const response = await axios.post('/api/products/import-document', formData, {
        headers: {
          'x-auth-token': token,
          'Content-Type': 'multipart/form-data'
        }
      });

      setPreviewData(response.data.data);
      setSuccess('PDF berhasil diproses! Klik "Import Data" untuk menyimpan ke database.');
    } catch (err) {
      setError(err.response?.data?.error || 'Gagal memproses PDF');
    } finally {
      setUploading(false);
    }
  };

  const handleImport = async () => {
    if (!selectedFile) return;

    setUploading(true);
    setError('');

    const formData = new FormData();
    formData.append('documentFile', selectedFile);

    try {
      const response = await axios.post('/api/products/import-document-save', formData, {
        headers: {
          'x-auth-token': token,
          'Content-Type': 'multipart/form-data'
        }
      });

      setSuccess(response.data.message);
      setPreviewData(null);
      setSelectedFile(null);

      // Notify parent component
      if (onImportSuccess) {
        onImportSuccess();
      }

      // Close dialog after successful import
      setTimeout(() => {
        handleClose();
      }, 2000);

    } catch (err) {
      setError(err.response?.data?.error || 'Gagal mengimport data');
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setPreviewData(null);
    setError('');
    setSuccess('');
    setUploading(false);
    onClose();
  };

  const renderPreviewTable = () => {
    if (!previewData?.extractedData?.length) return null;

    return (
      <TableContainer component={Paper} sx={{ mt: 2, maxHeight: 400 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell><strong>No. Order</strong></TableCell>
              <TableCell><strong>Nama</strong></TableCell>
              <TableCell><strong>NIK</strong></TableCell>
              <TableCell><strong>No. Rekening</strong></TableCell>
              <TableCell><strong>No. HP</strong></TableCell>
              <TableCell><strong>Status</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {previewData.extractedData.map((product, index) => (
              <TableRow key={index}>
                <TableCell>{product.noOrder || '-'}</TableCell>
                <TableCell>{product.nama || '-'}</TableCell>
                <TableCell>{product.nik || '-'}</TableCell>
                <TableCell>{product.noRek || '-'}</TableCell>
                <TableCell>{product.noHp || '-'}</TableCell>
                <TableCell>
                  <Chip
                    label="Valid"
                    color="success"
                    size="small"
                    icon={<CheckCircle />}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };

  const renderValidationSummary = () => {
    if (!previewData?.validation) return null;

    const { validation } = previewData;

    return (
      <Box sx={{ mt: 2 }}>
        <Typography variant="h6" gutterBottom>
          Ringkasan Validasi
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <Chip
            label={`Total: ${validation.total}`}
            color="default"
            icon={<Info />}
          />
          <Chip
            label={`Valid: ${validation.valid}`}
            color="success"
            icon={<CheckCircle />}
          />
          <Chip
            label={`Invalid: ${validation.invalid}`}
            color="error"
            icon={<Error />}
          />
        </Box>

        {validation.errors && validation.errors.length > 0 && (
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Typography color="error">
                {validation.errors.length} Data Invalid
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              {validation.errors.map((error, index) => (
                <Box key={index} sx={{ mb: 1, p: 1, bgcolor: 'error.light', borderRadius: 1 }}>
                  <Typography variant="body2" color="error">
                    <strong>Baris {error.productIndex + 1}:</strong> {error.errors.join(', ')}
                  </Typography>
                </Box>
              ))}
            </AccordionDetails>
          </Accordion>
        )}
      </Box>
    );
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        Import Data dari Dokumen
      </DialogTitle>

      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}

        <Box sx={{ mb: 3 }}>
          <Typography variant="body1" gutterBottom>
            Pilih file dokumen yang berisi data produk untuk diimport:
          </Typography>

          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Format yang didukung: {supportedFormats.map(format => format.label).join(', ')}
          </Typography>

          <Box sx={{ border: '2px dashed #ccc', borderRadius: 2, p: 3, textAlign: 'center' }}>
            <input
              type="file"
              accept={acceptedTypes}
              onChange={handleFileSelect}
              style={{ display: 'none' }}
              id="document-file-input"
            />
            <label htmlFor="document-file-input">
              <Button
                variant="outlined"
                component="span"
                startIcon={<CloudUpload />}
                disabled={uploading}
              >
                Pilih File Dokumen
              </Button>
            </label>

            {selectedFile && (
              <Typography variant="body2" sx={{ mt: 1 }}>
                File terpilih: <strong>{selectedFile.name}</strong> ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
              </Typography>
            )}
          </Box>
        </Box>

        {uploading && (
          <Box sx={{ mb: 2 }}>
            <LinearProgress />
            <Typography variant="body2" sx={{ mt: 1 }}>
              Memproses file PDF...
            </Typography>
          </Box>
        )}

        {previewData && (
          <>
            <Alert severity="info" sx={{ mb: 2 }}>
              <strong>Preview Data:</strong> Berikut adalah data yang berhasil diekstrak dari PDF.
              Pastikan data sudah benar sebelum mengklik "Import Data".
            </Alert>

            {renderValidationSummary()}
            {renderPreviewTable()}

            {previewData.textPreview && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Preview Teks PDF
                </Typography>
                <Paper sx={{ p: 2, bgcolor: 'grey.50', maxHeight: 150, overflow: 'auto' }}>
                  <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                    {previewData.textPreview}
                  </Typography>
                </Paper>
              </Box>
            )}
          </>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} disabled={uploading}>
          Batal
        </Button>

        {selectedFile && !previewData && (
          <Button
            onClick={handlePreview}
            variant="outlined"
            disabled={uploading}
          >
            Preview Data
          </Button>
        )}

        {previewData && previewData.validation.valid > 0 && (
          <Button
            onClick={handleImport}
            variant="contained"
            color="primary"
            disabled={uploading}
          >
            Import Data ({previewData.validation.valid} item)
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default PdfImport;