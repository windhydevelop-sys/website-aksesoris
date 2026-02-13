import React, { useState, useEffect, useCallback } from 'react';
import axios from '../utils/axios';
import {
    Container, Typography, Box, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, Paper, Button, Chip,
    CircularProgress, Checkbox
} from '@mui/material';
import {
    CloudDownload, CloudUpload, Warning,
    CheckCircle, Refresh
} from '@mui/icons-material';
import { useNotification } from '../contexts/NotificationContext';
import { useThemeMode } from '../contexts/ThemeModeContext';
import { THEME_MODE } from '../theme/themes';
import SidebarLayout from './SidebarLayout';

const TelegramSubmissions = () => {
    const { showSuccess, showError, showWarning } = useNotification();
    const { themeMode } = useThemeMode();
    const isLightMono = themeMode === THEME_MODE.LIGHT_MONO;

    const [loading, setLoading] = useState(true);
    const [submissions, setSubmissions] = useState([]);
    const [selected, setSelected] = useState([]);
    const [isExporting, setIsExporting] = useState(false);
    const [isImporting, setIsImporting] = useState(false);

    const fetchSubmissions = useCallback(async () => {
        setLoading(true);
        try {
            const response = await axios.get('/api/products/telegram-submissions');
            if (response.data.success) {
                setSubmissions(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching submissions:', error);
            showError('Gagal mengambil data submission Telegram');
        } finally {
            setLoading(false);
        }
    }, [showError]);

    useEffect(() => {
        fetchSubmissions();
    }, [fetchSubmissions]);

    const handleSelectAll = (event) => {
        if (event.target.checked) {
            setSelected(submissions.map(s => s._id));
        } else {
            setSelected([]);
        }
    };

    const handleSelectOne = (id) => {
        const selectedIndex = selected.indexOf(id);
        let newSelected = [];

        if (selectedIndex === -1) {
            newSelected = newSelected.concat(selected, id);
        } else if (selectedIndex === 0) {
            newSelected = newSelected.concat(selected.slice(1));
        } else if (selectedIndex === selected.length - 1) {
            newSelected = newSelected.concat(selected.slice(0, -1));
        } else if (selectedIndex > 0) {
            newSelected = newSelected.concat(
                selected.slice(0, selectedIndex),
                selected.slice(selectedIndex + 1)
            );
        }

        setSelected(newSelected);
    };

    const handleExportWord = async () => {
        if (selected.length === 0) {
            showWarning('Pilih minimal satu data untuk di-export');
            return;
        }

        setIsExporting(true);
        try {
            const selectedProducts = submissions.filter(s => selected.includes(s._id));
            const response = await axios.post('/api/products/export-corrected-word', {
                products: selectedProducts,
                format: 'table'
            }, {
                responseType: 'blob'
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `telegram-submissions-${Date.now()}.docx`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            showSuccess('File Word berhasil di-generate');
        } catch (error) {
            console.error('Export error:', error);
            showError('Gagal meng-export ke Word');
        } finally {
            setIsExporting(false);
        }
    };

    const handleImportWord = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        setIsImporting(true);
        try {
            const response = await axios.post('/api/products/import-corrected-word', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            if (response.data.success) {
                showSuccess(`Berhasil memperbarui ${response.data.updatedCount || 0} data`);
                fetchSubmissions();
            }
        } catch (error) {
            console.error('Import error:', error);
            showError('Gagal meng-import file Word. Pastikan format tabel sesuai.');
        } finally {
            setIsImporting(false);
            event.target.value = null;
        }
    };

    const isMissingData = (product) => {
        return !product.noOrder || !product.customer;
    };

    return (
        <SidebarLayout>
            <Container maxWidth="xl">
                <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                        <Typography variant="h4" sx={{ fontWeight: 'bold', color: isLightMono ? '#111' : '#fff' }}>
                            Data Input Telegram
                        </Typography>
                        <Typography variant="body1" sx={{ color: isLightMono ? '#666' : 'rgba(255,255,255,0.7)' }}>
                            Koreksi dan kelola data asal bot Telegram
                        </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 2 }}>
                        <Button
                            variant="outlined"
                            startIcon={<Refresh />}
                            onClick={fetchSubmissions}
                            disabled={loading}
                            sx={{ color: isLightMono ? '#111' : '#fff', borderColor: isLightMono ? '#111' : '#fff' }}
                        >
                            Refresh
                        </Button>
                        <Button
                            variant="contained"
                            startIcon={<CloudDownload />}
                            onClick={handleExportWord}
                            disabled={selected.length === 0 || isExporting}
                            color="secondary"
                        >
                            {isExporting ? <CircularProgress size={24} /> : 'Export Selected'}
                        </Button>
                        <Button
                            variant="contained"
                            component="label"
                            startIcon={<CloudUpload />}
                            disabled={isImporting}
                            color="primary"
                        >
                            {isImporting ? <CircularProgress size={24} /> : 'Import Corrected'}
                            <input type="file" hidden accept=".docx" onChange={handleImportWord} />
                        </Button>
                    </Box>
                </Box>

                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
                        <CircularProgress />
                    </Box>
                ) : (
                    <TableContainer component={Paper} sx={{ borderRadius: 2, overflow: 'hidden', bgcolor: isLightMono ? '#fff' : 'rgba(255,255,255,0.05)', color: isLightMono ? '#111' : '#fff' }}>
                        <Table sx={{ minWidth: 650 }}>
                            <TableHead sx={{ bgcolor: isLightMono ? '#f5f5f5' : 'rgba(0,0,0,0.2)' }}>
                                <TableRow>
                                    <TableCell padding="checkbox">
                                        <Checkbox
                                            indeterminate={selected.length > 0 && selected.length < submissions.length}
                                            checked={submissions.length > 0 && selected.length === submissions.length}
                                            onChange={handleSelectAll}
                                            sx={{ color: isLightMono ? '#111' : '#fff' }}
                                        />
                                    </TableCell>
                                    <TableCell sx={{ color: 'inherit', fontWeight: 'bold' }}>Info</TableCell>
                                    <TableCell sx={{ color: 'inherit', fontWeight: 'bold' }}>No. Order</TableCell>
                                    <TableCell sx={{ color: 'inherit', fontWeight: 'bold' }}>Customer</TableCell>
                                    <TableCell sx={{ color: 'inherit', fontWeight: 'bold' }}>Agent</TableCell>
                                    <TableCell sx={{ color: 'inherit', fontWeight: 'bold' }}>Bank</TableCell>
                                    <TableCell sx={{ color: 'inherit', fontWeight: 'bold' }}>Nama (KTP)</TableCell>
                                    <TableCell sx={{ color: 'inherit', fontWeight: 'bold' }}>NIK</TableCell>
                                    <TableCell sx={{ color: 'inherit', fontWeight: 'bold' }}>Tanggal</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {submissions.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={9} align="center" sx={{ py: 3, color: 'inherit' }}>
                                            Tidak ada data submission Telegram.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    submissions.map((row) => {
                                        const isSelected = selected.indexOf(row._id) !== -1;
                                        const missing = isMissingData(row);
                                        return (
                                            <TableRow
                                                key={row._id}
                                                selected={isSelected}
                                                sx={{
                                                    '&:hover': { bgcolor: isLightMono ? 'rgba(0,0,0,0.02)' : 'rgba(255,255,255,0.02)' },
                                                    bgcolor: missing ? (isLightMono ? 'rgba(255, 152, 0, 0.1)' : 'rgba(255, 152, 0, 0.1)') : 'inherit'
                                                }}
                                            >
                                                <TableCell padding="checkbox">
                                                    <Checkbox
                                                        checked={isSelected}
                                                        onChange={() => handleSelectOne(row._id)}
                                                        sx={{ color: isLightMono ? '#111' : '#fff' }}
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    {missing ? (
                                                        <Tooltip title="Data ini memerlukan koreksi (Order/Customer kosong)">
                                                            <Warning color="warning" />
                                                        </Tooltip>
                                                    ) : (
                                                        <CheckCircle color="success" />
                                                    )}
                                                </TableCell>
                                                <TableCell sx={{ color: 'inherit' }}>{row.noOrder || 'EMPTY'}</TableCell>
                                                <TableCell sx={{ color: 'inherit' }}>{row.customer || 'EMPTY'}</TableCell>
                                                <TableCell>
                                                    <Chip label={row.codeAgen || row.fieldStaff || '-'} size="small" />
                                                </TableCell>
                                                <TableCell sx={{ color: 'inherit' }}>{row.bank || '-'}</TableCell>
                                                <TableCell sx={{ color: 'inherit' }}>{row.nama || '-'}</TableCell>
                                                <TableCell sx={{ color: 'inherit' }}>{row.nik || '-'}</TableCell>
                                                <TableCell sx={{ color: 'inherit' }}>
                                                    {new Date(row.createdAt).toLocaleDateString('id-ID')}
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}
            </Container>
        </SidebarLayout>
    );
};

export default TelegramSubmissions;
