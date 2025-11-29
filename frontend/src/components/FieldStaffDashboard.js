import React, { useState, useEffect, useCallback } from 'react';
import {
  Container, Typography, Box, Card, CardContent, Grid, Chip, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, CircularProgress, Alert
} from '@mui/material';
import { Smartphone, Inventory, Assignment, CheckCircle, Schedule } from '@mui/icons-material';
import SidebarLayout from './SidebarLayout';
import { useNavigate } from 'react-router-dom';
import { useNotification } from '../contexts/NotificationContext';
import axios from '../utils/axios';

const FieldStaffDashboard = () => {
  const navigate = useNavigate();
  const { showError } = useNotification();
  const [handphoneSummary, setHandphoneSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Get current user info (assuming field staff info is stored)
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const fieldStaffCode = currentUser.fieldStaff || currentUser.kodeOrlap;

  const fetchHandphoneSummary = useCallback(async () => {
    if (!fieldStaffCode) {
      setError('Field staff information not found');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      // First get field staff details to get the ID
      const fieldStaffRes = await axios.get('/api/field-staff');
      const fieldStaffList = fieldStaffRes.data.data || [];
      const currentFieldStaff = fieldStaffList.find(fs => fs.kodeOrlap === fieldStaffCode);

      if (!currentFieldStaff) {
        setError('Field staff not found in database');
        setLoading(false);
        return;
      }

      // Get handphone assignment summary
      const summaryRes = await axios.get(`/api/handphones/field-staff/${currentFieldStaff._id}`);
      setHandphoneSummary(summaryRes.data.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching handphone summary:', err);
      setError('Failed to fetch handphone assignment data');
      showError('Failed to fetch handphone assignment data');
    } finally {
      setLoading(false);
    }
  }, [fieldStaffCode, showError]);

  useEffect(() => {
    fetchHandphoneSummary();
  }, [fetchHandphoneSummary]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'available': return 'success';
      case 'in_use': return 'warning';
      case 'maintenance': return 'error';
      default: return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'available': return <CheckCircle />;
      case 'in_use': return <Schedule />;
      case 'maintenance': return <Assignment />;
      default: return <Assignment />;
    }
  };

  if (loading) {
    return (
      <SidebarLayout onLogout={handleLogout}>
        <Container maxWidth="lg" sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
          <CircularProgress />
        </Container>
      </SidebarLayout>
    );
  }

  if (error) {
    return (
      <SidebarLayout onLogout={handleLogout}>
        <Container maxWidth="lg" sx={{ mt: 4 }}>
          <Alert severity="error">{error}</Alert>
        </Container>
      </SidebarLayout>
    );
  }

  return (
    <SidebarLayout onLogout={handleLogout}>
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ mb: 3 }}>
          Dashboard Field Staff - {fieldStaffCode}
        </Typography>

        {/* Summary Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              borderRadius: 3,
              boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
            }}>
              <CardContent sx={{ textAlign: 'center' }}>
                <Smartphone sx={{ fontSize: 40, mb: 1 }} />
                <Typography variant="h4" component="div">
                  {handphoneSummary?.totalHandphones || 0}
                </Typography>
                <Typography variant="body2">Total Handphone</Typography>
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
                <CheckCircle sx={{ fontSize: 40, mb: 1 }} />
                <Typography variant="h4" component="div">
                  {handphoneSummary?.available || 0}
                </Typography>
                <Typography variant="body2">Handphone Tersedia</Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{
              background: 'linear-gradient(135deg, #ff9800 0%, #ffb74d 100%)',
              color: 'white',
              borderRadius: 3,
              boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
            }}>
              <CardContent sx={{ textAlign: 'center' }}>
                <Schedule sx={{ fontSize: 40, mb: 1 }} />
                <Typography variant="h4" component="div">
                  {handphoneSummary?.inUse || 0}
                </Typography>
                <Typography variant="body2">Sedang Digunakan</Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{
              background: 'linear-gradient(135deg, #f44336 0%, #e57373 100%)',
              color: 'white',
              borderRadius: 3,
              boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
            }}>
              <CardContent sx={{ textAlign: 'center' }}>
                <Assignment sx={{ fontSize: 40, mb: 1 }} />
                <Typography variant="h4" component="div">
                  {handphoneSummary?.maintenance || 0}
                </Typography>
                <Typography variant="body2">Dalam Perbaikan</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Handphone List */}
        <Card sx={{ borderRadius: 3, boxShadow: '0 8px 32px rgba(0,0,0,0.1)', mb: 4 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              📱 Handphone Yang Dikelola
            </Typography>
            <TableContainer>
              <Table>
                <TableHead sx={{ bgcolor: 'grey.100' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold' }}>Handphone</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>IMEI</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Current Product</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Assignment Count</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {handphoneSummary?.handphones?.map((handphone) => (
                    <TableRow key={handphone.id} hover>
                      <TableCell>
                        {handphone.merek} {handphone.tipe}
                      </TableCell>
                      <TableCell>{handphone.imei || '-'}</TableCell>
                      <TableCell>
                        <Chip
                          icon={getStatusIcon(handphone.status)}
                          label={handphone.status === 'available' ? 'Tersedia' :
                                 handphone.status === 'in_use' ? 'Digunakan' :
                                 handphone.status === 'maintenance' ? 'Perbaikan' : handphone.status}
                          color={getStatusColor(handphone.status)}
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        {handphone.currentProduct ? (
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                              {handphone.currentProduct.noOrder}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {handphone.currentProduct.customer} - {handphone.currentProduct.status}
                            </Typography>
                          </Box>
                        ) : (
                          <Typography variant="body2" color="text.secondary">-</Typography>
                        )}
                      </TableCell>
                      <TableCell>{handphone.totalAssignments}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            {(!handphoneSummary?.handphones || handphoneSummary.handphones.length === 0) && (
              <Box sx={{ p: 4, textAlign: 'center' }}>
                <Typography variant="body1" color="text.secondary">
                  Belum ada handphone yang di-assign ke field staff ini.
                </Typography>
              </Box>
            )}
          </CardContent>
        </Card>

        {/* Products Handled */}
        <Card sx={{ borderRadius: 3, boxShadow: '0 8px 32px rgba(0,0,0,0.1)' }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              📦 Produk Yang Ditangani
            </Typography>
            <Alert severity="info" sx={{ mb: 2 }}>
              Produk yang menggunakan handphone yang dikelola oleh field staff ini akan ditampilkan di sini.
              Fitur ini akan menampilkan history lengkap assignment handphone ke produk.
            </Alert>
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <Inventory sx={{ fontSize: 48, color: 'grey.400', mb: 2 }} />
              <Typography variant="body1" color="text.secondary">
                Fitur detail produk per handphone akan diimplementasikan selanjutnya.
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Container>
    </SidebarLayout>
  );
};

export default FieldStaffDashboard;