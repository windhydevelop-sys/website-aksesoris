import React, { useState } from 'react';
import axios from '../utils/axios';
import {
    Dialog, DialogTitle, DialogContent, DialogActions, Button,
    Typography, Box, Alert, LinearProgress, Paper, Table,
    TableBody, TableCell, TableContainer, TableHead, TableRow,
    Chip, Accordion, AccordionSummary, AccordionDetails,
    Menu, MenuItem, IconButton, TextField, CircularProgress
} from '@mui/material';
import {
    CloudUpload, ExpandMore, CheckCircle, Error, Info, Download, Description,
    Menu as MenuIcon
} from '@mui/icons-material';

const DocumentImport = ({ open, onClose, onImportSuccess }) => {
    const [selectedFile, setSelectedFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [previewData, setPreviewData] = useState(null);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [anchorEl, setAnchorEl] = useState(null);
    const openMenu = Boolean(anchorEl);
    const [manualExpiredDate, setManualExpiredDate] = useState('');
    const [manualStatus, setManualStatus] = useState('pending');
    const [importResults, setImportResults] = useState(null);
    const [validationData, setValidationData] = useState(null);
    const [isValidating, setIsValidating] = useState(false);

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
            // Check if file type is supported or extension matches
            const fileExt = '.' + file.name.split('.').pop().toLowerCase();
            const isSupported = supportedFormats.some(format =>
                format.type === file.type || format.ext === fileExt
            );

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

    const handleDownloadTemplate = async () => {
        try {
            const response = await axios.get('/api/products/download-template-word', {
                headers: { 'x-auth-token': token },
                responseType: 'blob'
            });

            // Create download link
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'template-bulk-upload-produk.docx');
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
        } catch (err) {
            setError('Gagal mendownload template');
            console.error('Download error:', err);
        }
    };

    const handleDownloadBankTemplate = async (bankName) => {
        handleCloseMenu();
        try {
            setUploading(true);
            const response = await axios.get(`/api/products/download-template-bank/${bankName}`, {
                headers: { 'x-auth-token': token },
                responseType: 'blob'
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `template-upload-${bankName}.docx`);
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
            setSuccess(`Template ${bankName.toUpperCase()} berhasil didownload!`);
        } catch (err) {
            setError(`Gagal mendownload template ${bankName} `);
            console.error('Bank download error:', err);
        } finally {
            setUploading(false);
        }
    };

    const handleOpenMenu = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleCloseMenu = () => {
        setAnchorEl(null);
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
            const docType = response.data.data.documentType || 'Dokumen';
            setSuccess(`${docType} berhasil diproses! Memvalidasi referensi database...`);

            // Auto-validate references
            if (response.data.data.extractedData && response.data.data.extractedData.length > 0) {
                handleValidate(response.data.data.extractedData);
            }
        } catch (err) {
            setError(err.response?.data?.error || 'Gagal memproses dokumen');
        } finally {
            setUploading(false);
        }
    };

    const handleValidate = async (products) => {
        setIsValidating(true);
        try {
            const response = await axios.post('/api/products/validate-import-data', { products }, {
                headers: { 'x-auth-token': token }
            });
            setValidationData(response.data.data);
            if (!response.data.isAllValid) {
                setError('Beberapa data (Customer/Orlap/Order) belum terdaftar di database. Silakan periksa peringatan di bawah.');
            }
        } catch (err) {
            console.error('Validation error:', err);
        } finally {
            setIsValidating(false);
        }
    };

    const handleDownloadCorrected = async () => {
        if (!previewData?.extractedData) return;
        try {
            setUploading(true);
            const response = await axios.post('/api/products/export-corrected-word',
                { products: previewData.extractedData },
                {
                    headers: { 'x-auth-token': token },
                    responseType: 'blob'
                }
            );

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `hasil - koreksi - ${Date.now()}.docx`);
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
            setSuccess('File hasil koreksi berhasil didownload!');
        } catch (err) {
            setError('Gagal mendownload hasil koreksi');
            console.error('Download corrected error:', err);
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
        if (manualExpiredDate) {
            formData.append('expiredDate', manualExpiredDate);
        }
        if (manualStatus) {
            formData.append('status', manualStatus);
        }

        try {
            const response = await axios.post('/api/products/import-document-save', formData, {
                headers: {
                    'x-auth-token': token,
                    'Content-Type': 'multipart/form-data'
                }
            });

            setSuccess(response.data.message);
            setImportResults(response.data.data.results);
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

        const data = previewData.extractedData;

        // Define all possible columns for all banks
        const allColumns = [
            { id: 'noOrder', label: 'No. Order' },
            { id: 'customer', label: 'Customer' },
            { id: 'nama', label: 'Nama' },
            { id: 'nik', label: 'NIK' },
            { id: 'noRek', label: 'No. Rekening' },
            { id: 'noHp', label: 'No. HP' },
            { id: 'bank', label: 'Bank' },
            { id: 'grade', label: 'Grade' },
            { id: 'kcp', label: 'Kantor Cabang' },
            { id: 'validThru', label: 'Valid Kartu' },
            // BCA Specific
            { id: 'mobilePassword', label: 'Kode Akses', bank: 'bca' },
            { id: 'mobilePin', label: 'Pin Mobile', bank: 'bca' },
            { id: 'myBCAUser', label: 'BCA-ID', bank: 'bca' },
            { id: 'myBCAPassword', label: 'Pass BCA-ID', bank: 'bca' },
            { id: 'myBCAPin', label: 'Pin Transaksi', bank: 'bca' },
            // BRI Specific (using generic mobilePassword/mobilePin)
            { id: 'mobilePassword', label: 'Pass BRIMO', bank: 'bri' },
            { id: 'mobilePin', label: 'Pin BRIMO', bank: 'bri' },
            // Mandiri Specific
            { id: 'mobilePassword', label: 'Pass Livin', bank: 'mandiri' },
            { id: 'mobilePin', label: 'Pin Livin', bank: 'mandiri' },
            // BNI Specific
            { id: 'mobilePassword', label: 'Pass Wondr', bank: 'bni' },
            { id: 'mobilePin', label: 'Pin Wondr', bank: 'bni' },
            // OCBC Specific
            { id: 'mobileUser', label: 'User Nyala', bank: 'ocbc' },
            // Common
            { id: 'ibUser', label: 'User IB' },
            { id: 'ibPassword', label: 'Pass IB' },
            { id: 'ibPin', label: 'Pin IB' },
            { id: 'pinAtm', label: 'Pin ATM' },
            { id: 'email', label: 'Email' },
            { id: 'passEmail', label: 'Pass Email' },
            { id: 'status', label: 'Validasi' }
        ];

        // Determine which columns to show. We'll show a column if any row has it OR if it's a common field.
        const visibleColumns = allColumns.filter(col => {
            if (!col.bank) return true; // Common field
            // Show bank-specific field if at least one product has that bank
            return data.some(p => (p.bank || '').toLowerCase().includes(col.bank));
        });

        // Unique columns by ID to avoid duplicates if multiple banks use the same field with different labels
        // However, we want the most specific label. For now, let's just keep it simple.
        const finalColumns = [];
        const seenIds = new Set();
        visibleColumns.forEach(col => {
            // Priority: Bank specific label > generic label
            const existingIdx = finalColumns.findIndex(c => c.id === col.id);
            if (existingIdx === -1) {
                finalColumns.push(col);
                seenIds.add(col.id);
            } else if (col.bank) {
                // If we found a bank-specific label for an existing field, use it if this batch is primarily that bank
                // For simplicity, let's just use the first one detected.
                finalColumns[existingIdx] = col;
            }
        });

        return (
            <TableContainer component={Paper} sx={{ mt: 2, maxHeight: 500 }}>
                <Table size="small" stickyHeader>
                    <TableHead>
                        <TableRow>
                            {finalColumns.map(col => (
                                <TableCell key={col.id} sx={{ fontWeight: 'bold', bgcolor: 'primary.main', color: 'white' }}>
                                    {col.label}
                                </TableCell>
                            ))}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {data.map((product, index) => (
                            <TableRow key={index} hover>
                                {finalColumns.map(col => {
                                    if (col.id === 'status') {
                                        return (
                                            <TableCell key={col.id}>
                                                <Chip
                                                    label="Valid"
                                                    color="success"
                                                    size="small"
                                                    icon={<CheckCircle />}
                                                />
                                            </TableCell>
                                        );
                                    }
                                    return (
                                        <TableCell key={col.id}>
                                            {product[col.id] || '-'}
                                        </TableCell>
                                    );
                                })}
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
                        label={`Total: ${validation.total} `}
                        color="default"
                        icon={<Info />}
                    />
                    <Chip
                        label={`Valid: ${validation.valid} `}
                        color="success"
                        icon={<CheckCircle />}
                    />
                    <Chip
                        label={`Invalid: ${validation.invalid} `}
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
                                <Box key={index} sx={{ mb: 2, p: 2, bgcolor: '#fff0f0', borderRadius: 1, border: '1px solid #ffcdd2' }}>
                                    <Typography variant="body2" color="error" sx={{ fontWeight: 'bold', mb: 1 }}>
                                        #{error.productIndex + 1}: {error.errors.join(', ')}
                                    </Typography>

                                    {/* Debug View for User */}
                                    <details style={{ cursor: 'pointer', fontSize: '0.875rem', color: '#555' }}>
                                        <summary>Lihat Data Terbaca (Debug)</summary>
                                        <Box sx={{ mt: 1, p: 1, bgcolor: '#fff', borderRadius: 1, border: '1px solid #eee', overflowX: 'auto' }}>
                                            <pre style={{ margin: 0, fontSize: '0.75rem' }}>
                                                {JSON.stringify(error.data, null, 2)}
                                            </pre>
                                        </Box>
                                    </details>
                                </Box>
                            ))}
                        </AccordionDetails>
                    </Accordion>
                )}
            </Box>
        );
    };

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="xl" fullWidth>
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                Import Bulk Data
                <Box>
                    <Button
                        variant="outlined"
                        startIcon={<Download />}
                        size="small"
                        onClick={handleOpenMenu}
                        sx={{ mr: 1 }}
                    >
                        Download Template
                    </Button>
                    <Menu
                        anchorEl={anchorEl}
                        open={openMenu}
                        onClose={handleCloseMenu}
                    >
                        <MenuItem onClick={handleDownloadTemplate}>Template Umum</MenuItem>
                        <MenuItem onClick={() => handleDownloadBankTemplate('BCA')}>Template BCA</MenuItem>
                        <MenuItem onClick={() => handleDownloadBankTemplate('BRI')}>Template BRI</MenuItem>
                        <MenuItem onClick={() => handleDownloadBankTemplate('Mandiri')}>Template Mandiri</MenuItem>
                        <MenuItem onClick={() => handleDownloadBankTemplate('BNI')}>Template BNI</MenuItem>
                        <MenuItem onClick={() => handleDownloadBankTemplate('OCBC')}>Template OCBC</MenuItem>
                    </Menu>
                </Box>
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
                        Format: Word (.docx), Excel (.xlsx), PDF, CSV
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
                            <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                                <Description color="action" />
                                <Typography variant="body2">
                                    <strong>{selectedFile.name}</strong> ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                                </Typography>
                            </Box>
                        )}
                    </Box>
                </Box>

                {uploading && (
                    <Box sx={{ mb: 2 }}>
                        <LinearProgress />
                        <Typography variant="body2" sx={{ mt: 1 }}>
                            Memproses file...
                        </Typography>
                    </Box>
                )}

                {previewData && (
                    <>
                        <Alert
                            severity="info"
                            sx={{ mb: 2 }}
                            action={
                                <Button
                                    color="inherit"
                                    size="small"
                                    variant="outlined"
                                    startIcon={<Download />}
                                    onClick={handleDownloadCorrected}
                                    disabled={uploading}
                                >
                                    Download Hasil Koreksi (.docx)
                                </Button>
                            }
                        >
                            <strong>Preview Data:</strong> Berikut adalah data yang berhasil diekstrak dengan <i>Auto-Correction</i>.
                            Anda dapat mendownload file yang sudah diperbaiki atau lanjut simpan.
                        </Alert>

                        {renderValidationSummary()}

                        {previewData.validation.valid > 0 && (
                            <Box sx={{ mt: 3, p: 2, bgcolor: '#f5f5f5', borderRadius: 1, border: '1px solid #e0e0e0' }}>
                                <Typography variant="subtitle2" gutterBottom color="primary">
                                    Set Tanggal Expired (Opsional)
                                </Typography>
                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                                    Pilih tanggal expired yang akan diterapkan ke semua produk valid dalam batch ini (jika tidak ada di file).
                                </Typography>
                                <input
                                    type="date"
                                    value={manualExpiredDate}
                                    onChange={(e) => setManualExpiredDate(e.target.value)}
                                    style={{
                                        padding: '8px',
                                        borderRadius: '4px',
                                        border: '1px solid #ccc',
                                        width: '100%',
                                        maxWidth: '300px'
                                    }}
                                />
                            </Box>
                        )}

                        {previewData.validation.valid > 0 && (
                            <Box sx={{ mt: 2, p: 2, bgcolor: '#f0f7ff', borderRadius: 1, border: '1px solid #cce3ff' }}>
                                <Typography variant="subtitle2" gutterBottom color="primary">
                                    Set Status Produk (Opsional)
                                </Typography>
                                <select
                                    value={manualStatus}
                                    onChange={(e) => setManualStatus(e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '8px',
                                        borderRadius: '4px',
                                        border: '1px solid #ccc',
                                        fontSize: '14px'
                                    }}
                                >
                                    <option value="pending">Pending</option>
                                    <option value="in_progress">In Progress</option>
                                    <option value="completed">Completed</option>
                                    <option value="cancelled">Cancelled</option>
                                </select>
                            </Box>
                        )}

                        {validationData && !isValidating && (
                            <Box sx={{ mt: 2 }}>
                                {(validationData.missingCustomers.length > 0 ||
                                    validationData.missingFieldStaff.length > 0 ||
                                    validationData.missingOrders.length > 0) && (
                                        <Alert severity="warning" sx={{ mb: 2 }}>
                                            <Typography variant="body2" fontWeight="bold">Referensi Data Tidak Ditemukan:</Typography>
                                            {validationData.missingCustomers.map(c => <div key={c}>• Customer: <strong>{c}</strong> belum ada.</div>)}
                                            {validationData.missingFieldStaff.map(o => <div key={o}>• Orlap: <strong>{o}</strong> belum ada.</div>)}
                                            {validationData.missingOrders.map(no => <div key={no}>• No Order: <strong>{no}</strong> belum ada.</div>)}
                                            <Typography variant="body2" sx={{ mt: 1 }}>
                                                Mohon buat data tersebut di menu <strong>Workflow</strong> sebelum melanjutkan import agar data terintegrasi dengan benar.
                                            </Typography>
                                        </Alert>
                                    )}
                            </Box>
                        )}

                        {renderPreviewTable()}

                        {previewData.textPreview && (
                            <Box sx={{ mt: 2 }}>
                                <Typography variant="h6" gutterBottom>
                                    Preview Teks Extracted
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

                {importResults && (
                    <Box sx={{ mt: 2 }}>
                        <Typography variant="h6" gutterBottom color="success.main">
                            Hasil Import Detail
                        </Typography>
                        <TableContainer component={Paper} sx={{ maxHeight: 300 }}>
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell><strong>Nama</strong></TableCell>
                                        <TableCell><strong>No. Order</strong></TableCell>
                                        <TableCell><strong>Status</strong></TableCell>
                                        <TableCell><strong>Keterangan</strong></TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {importResults.map((res, i) => (
                                        <TableRow key={i}>
                                            <TableCell>{res.nama || '-'}</TableCell>
                                            <TableCell>{res.noOrder || '-'}</TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={res.status}
                                                    color={res.status === 'Success' ? 'success' : 'error'}
                                                    size="small"
                                                />
                                            </TableCell>
                                            <TableCell>{res.error || 'Saved'}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Box>
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
                        Import Data ({previewData.validation.valid})
                    </Button>
                )}
            </DialogActions>
        </Dialog>
    );
};

export default DocumentImport;
