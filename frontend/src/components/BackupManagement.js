import React, { useState, useEffect, useCallback } from 'react';
import {
  Container, Typography, Box, CircularProgress, Alert, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, IconButton, Button, Dialog, DialogTitle, DialogContent, DialogActions,
  Card, CardContent, Grid, Chip, FormControl, InputLabel, Select, MenuItem
} from '@mui/material';
import { Backup, Restore, Delete, Download, Schedule } from '@mui/icons-material';
import SidebarLayout from './SidebarLayout';
import { useNavigate } from 'react-router-dom';
import { useNotification } from '../contexts/NotificationContext';
import axios from '../utils/axios';

const BackupManagement = () => {
  const navigate = useNavigate();
  const { showSuccess, showError } = useNotification();
  const [backups, setBackups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [backupStatus, setBackupStatus] = useState(null);

  // Dialog states
  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [openRestoreDialog, setOpenRestoreDialog] = useState(false);
  const [selectedBackup, setSelectedBackup] = useState(null);
  const [backupType, setBackupType] = useState('collections');

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const fetchBackupStatus = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/backup/status');
      setBackupStatus(response.data.data);
      setBackups(response.data.data.backups);
      setError(null);
    } catch (err) {
      console.error('Error fetching backup status:', err);
      setError('Failed to fetch backup status');
      showError('Failed to fetch backup status');
    } finally {
      setLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    fetchBackupStatus();
  }, [fetchBackupStatus]);

  const handleCreateBackup = async () => {
    try {
      const response = await axios.post('/api/backup/create', { type: backupType });
      showSuccess(response.data.data.message);
      fetchBackupStatus();
      setOpenCreateDialog(false);
    } catch (err) {
      console.error('Error creating backup:', err);
      showError(err.response?.data?.error || 'Failed to create backup');
    }
  };

  const handleRestoreBackup = async () => {
    if (!selectedBackup) return;

    if (!window.confirm(`Are you sure you want to restore from backup "${selectedBackup.filename}"? This will replace current data.`)) {
      return;
    }

    try {
      const response = await axios.post('/api/backup/restore', { filename: selectedBackup.filename });
      showSuccess(response.data.data.message);
      setOpenRestoreDialog(false);
      setSelectedBackup(null);
    } catch (err) {
      console.error('Error restoring backup:', err);
      showError(err.response?.data?.error || 'Failed to restore backup');
    }
  };

  const handleDeleteBackup = async (filename) => {
    if (!window.confirm(`Are you sure you want to delete backup "${filename}"?`)) {
      return;
    }

    try {
      await axios.delete(`/api/backup/${filename}`);
      showSuccess('Backup file deleted successfully');
      fetchBackupStatus();
    } catch (err) {
      console.error('Error deleting backup:', err);
      showError('Failed to delete backup file');
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('id-ID');
  };

  return (
    <SidebarLayout onLogout={handleLogout}>
      <Container maxWidth="xl" sx={{ mt: { xs: 2, sm: 4 }, mb: { xs: 2, sm: 4 } }}>
        <Box sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          justifyContent: { xs: 'center', sm: 'space-between' },
          alignItems: { xs: 'stretch', sm: 'center' },
          gap: 2,
          mb: 3
        }}>
          <Typography
            variant="h4"
            component="h1"
            sx={{ textAlign: { xs: 'center', sm: 'left' } }}
          >
            Database Backup Management
          </Typography>
        </Box>

        {/* Status Cards */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{
              background: 'linear-gradient(135deg, #2196f3 0%, #64b5f6 100%)',
              color: 'white',
              borderRadius: 3,
              boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
            }}>
              <CardContent sx={{ textAlign: 'center' }}>
                <Backup sx={{ fontSize: 40, mb: 1 }} />
                <Typography variant="h4" component="div">{backupStatus?.totalBackups || 0}</Typography>
                <Typography variant="body2">Total Backups</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{
              background: 'linear-gradient(135deg, #4caf50 0%, #66bb6a 100%)',
              color: 'white',
              borderRadius: 3,
              boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
            }}>
              <CardContent sx={{ textAlign: 'center' }}>
                <Download sx={{ fontSize: 40, mb: 1 }} />
                <Typography variant="h4" component="div">
                  {backupStatus?.lastBackup ? formatFileSize(backupStatus.lastBackup.size) : '0 MB'}
                </Typography>
                <Typography variant="body2">Last Backup Size</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Box sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          justifyContent: { xs: 'center', sm: 'flex-end' },
          alignItems: { xs: 'stretch', sm: 'center' },
          gap: 2,
          mb: 3
        }}>
          <Button
            variant="contained"
            startIcon={<Backup />}
            onClick={() => setOpenCreateDialog(true)}
            sx={{
              borderRadius: 2,
              width: { xs: '100%', sm: 'auto' }
            }}
          >
            Create Backup
          </Button>
          <Button
            variant="outlined"
            startIcon={<Restore />}
            onClick={() => setOpenRestoreDialog(true)}
            disabled={!backups.length}
            sx={{
              borderRadius: 2,
              width: { xs: '100%', sm: 'auto' }
            }}
          >
            Restore Backup
          </Button>
        </Box>

        <Card sx={{
          borderRadius: 3,
          boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
          overflow: 'hidden'
        }}>
          <TableContainer>
            <Table>
              <TableHead sx={{ bgcolor: 'grey.100' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold' }}>Filename</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Type</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Size</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Created</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Modified</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {backups.map((backup) => (
                  <TableRow key={backup.filename} hover>
                    <TableCell sx={{ fontFamily: 'monospace' }}>{backup.filename}</TableCell>
                    <TableCell>
                      <Chip
                        label={backup.filename.includes('full') ? 'Full' : 'Collections'}
                        color={backup.filename.includes('full') ? 'primary' : 'secondary'}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>{formatFileSize(backup.size)}</TableCell>
                    <TableCell>{formatDate(backup.createdAt)}</TableCell>
                    <TableCell>{formatDate(backup.modifiedAt)}</TableCell>
                    <TableCell>
                      <IconButton
                        onClick={() => {
                          setSelectedBackup(backup);
                          setOpenRestoreDialog(true);
                        }}
                        color="primary"
                        size="small"
                        title="Restore from this backup"
                      >
                        <Restore />
                      </IconButton>
                      <IconButton
                        onClick={() => handleDeleteBackup(backup.filename)}
                        color="error"
                        size="small"
                        title="Delete backup file"
                      >
                        <Delete />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          {backups.length === 0 && !loading && (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="body1" color="text.secondary">
                No backup files found. Click "Create Backup" to create your first backup.
              </Typography>
            </Box>
          )}
        </Card>

        {loading && <CircularProgress sx={{ mt: 2 }} />}
        {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}

        {/* Create Backup Dialog */}
        <Dialog
          open={openCreateDialog}
          onClose={() => setOpenCreateDialog(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle sx={{ bgcolor: 'primary.main', color: 'white', fontWeight: 'bold' }}>
            Create Database Backup
          </DialogTitle>
          <DialogContent sx={{ mt: 2 }}>
            <FormControl fullWidth margin="normal">
              <InputLabel id="backup-type-label">Backup Type</InputLabel>
              <Select
                labelId="backup-type-label"
                value={backupType}
                label="Backup Type"
                onChange={(e) => setBackupType(e.target.value)}
              >
                <MenuItem value="collections">Collections Only (Recommended)</MenuItem>
                <MenuItem value="full">Full Database</MenuItem>
              </Select>
            </FormControl>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              • Collections: Backup main collections (products, customers, orders, etc.)<br/>
              • Full: Backup entire database including system collections
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenCreateDialog(false)}>Cancel</Button>
            <Button onClick={handleCreateBackup} variant="contained">
              Create Backup
            </Button>
          </DialogActions>
        </Dialog>

        {/* Restore Backup Dialog */}
        <Dialog
          open={openRestoreDialog}
          onClose={() => setOpenRestoreDialog(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle sx={{ bgcolor: 'warning.main', color: 'white', fontWeight: 'bold' }}>
            Restore Database Backup
          </DialogTitle>
          <DialogContent sx={{ mt: 2 }}>
            <Typography variant="body1" gutterBottom>
              Select backup file to restore:
            </Typography>
            <FormControl fullWidth margin="normal">
              <InputLabel id="restore-backup-label">Backup File</InputLabel>
              <Select
                labelId="restore-backup-label"
                value={selectedBackup?.filename || ''}
                label="Backup File"
                onChange={(e) => {
                  const backup = backups.find(b => b.filename === e.target.value);
                  setSelectedBackup(backup);
                }}
              >
                {backups.map((backup) => (
                  <MenuItem key={backup.filename} value={backup.filename}>
                    {backup.filename} ({formatFileSize(backup.size)}) - {formatDate(backup.createdAt)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Alert severity="warning" sx={{ mt: 2 }}>
              <strong>Warning:</strong> Restoring will replace current data. Make sure you have a recent backup before proceeding.
            </Alert>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenRestoreDialog(false)}>Cancel</Button>
            <Button
              onClick={handleRestoreBackup}
              variant="contained"
              color="warning"
              disabled={!selectedBackup}
            >
              Restore Backup
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </SidebarLayout>
  );
};

export default BackupManagement;