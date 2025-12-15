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

  // Get current user info
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const isAdmin = currentUser.role === 'admin';
  const fieldStaffCode = currentUser.fieldStaff || currentUser.kodeOrlap;

  const fetchHandphoneSummary = useCallback(async () => {
    try {
      setLoading(true);

      if (isAdmin) {
        // Admin can see all handphones or select a specific field staff
        // For now, show summary of all handphones
        const summaryRes = await axios.get('/api/handphones');
        const allHandphones = summaryRes.data.data || [];

        // Calculate summary for all handphones
        const summary = {
          totalHandphones: allHandphones.length,
          available: allHandphones.filter(h => h.status === 'available').length,
          inUse: allHandphones.filter(h => h.status === 'assigned' || h.status === 'in_use').length,
          maintenance: allHandphones.filter(h => h.status === 'maintenance').length,
          handphones: allHandphones.map(handphone => ({
            id: handphone._id,
            merek: handphone.merek,
            tipe: handphone.tipe,
            imei: handphone.imei,
            status: handphone.status === 'assigned' ? 'in_use' : handphone.status,
            currentProduct: handphone.currentProduct ? {
              noOrder: handphone.currentProduct.noOrder,
              customer: handphone.currentProduct.customer,
              status: handphone.currentProduct.status
            } : null,
            assignedProducts: handphone.assignedProducts || [],
            assignedTo: handphone.assignedTo,
            totalAssignments: handphone.assignedProducts?.length || 0
          }))
        };

        setHandphoneSummary(summary);
      } else {
        // Field staff logic
        if (!fieldStaffCode) {
          setError('Field staff information not found');
          setLoading(false);
          return;
        }

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
      }

      setError(null);
    } catch (err) {
      console.error('Error fetching handphone summary:', err);
      setError('Failed to fetch handphone assignment data');
      showError('Failed to fetch handphone assignment data');
    } finally {
      setLoading(false);
    }
  }, [isAdmin, fieldStaffCode, showError]);

  useEffect(() => {
    fetchHandphoneSummary();
  }, [isAdmin, fieldStaffCode, fetchHandphoneSummary]);

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
          Dashboard Field Staff {fieldStaffCode && `- ${fieldStaffCode}`}
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Menampilkan data handphone dan produk yang dikelola
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
                    <TableCell sx={{ fontWeight: 'bold' }}>Field Staff</TableCell>
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
                      <TableCell>
                        {handphone.assignedTo ? (
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                              {handphone.assignedTo.kodeOrlap}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {handphone.assignedTo.namaOrlap}
                            </Typography>
                          </Box>
                        ) : (
                          <Typography variant="body2" color="text.secondary">-</Typography>
                        )}
                      </TableCell>
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
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Produk yang pernah di-assign ke handphone yang dikelola oleh field staff ini.
            </Typography>

            {handphoneSummary?.handphones?.some(h => h.assignedProducts && h.assignedProducts.length > 0) ? (
              <TableContainer>
                <Table size="small">
                  <TableHead sx={{ bgcolor: 'grey.50' }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 'bold', fontSize: '0.875rem' }}>Handphone</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', fontSize: '0.875rem' }}>Produk</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', fontSize: '0.875rem' }}>Customer</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', fontSize: '0.875rem' }}>Status</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', fontSize: '0.875rem' }}>Tanggal Assign</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', fontSize: '0.875rem' }}>Field Staff</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {handphoneSummary.handphones
                      .filter(handphone => handphone.assignedProducts && handphone.assignedProducts.length > 0)
                      .map(handphone =>
                        handphone.assignedProducts.map((product, index) => (
                          <TableRow key={`${handphone.id}-${product._id || index}`} hover>
                            {index === 0 && (
                              <TableCell rowSpan={handphone.assignedProducts.length} sx={{ fontSize: '0.875rem', fontWeight: 'medium' }}>
                                {handphone.merek} {handphone.tipe}
                                {handphone.imei && (
                                  <Typography variant="caption" display="block" color="text.secondary">
                                    IMEI: {handphone.imei}
                                  </Typography>
                                )}
                              </TableCell>
                            )}
                            <TableCell sx={{ fontSize: '0.875rem' }}>
                              {product.noOrder || '-'}
                            </TableCell>
                            <TableCell sx={{ fontSize: '0.875rem' }}>
                              {product.customer || product.nama || '-'}
                            </TableCell>
                            <TableCell sx={{ fontSize: '0.875rem' }}>
                              <Chip
                                label={product.complaint ? 'Dalam Proses' : 'Selesai'}
                                color={product.complaint ? 'warning' : 'success'}
                                size="small"
                                variant="outlined"
                              />
                            </TableCell>
                            <TableCell sx={{ fontSize: '0.875rem' }}>
                              {product.handphoneAssignmentDate ?
                                new Date(product.handphoneAssignmentDate).toLocaleDateString('id-ID') :
                                product.createdAt ?
                                new Date(product.createdAt).toLocaleDateString('id-ID') :
                                '-'}
                            </TableCell>
                            {index === 0 && (
                              <TableCell rowSpan={handphone.assignedProducts.length} sx={{ fontSize: '0.875rem' }}>
                                {handphone.assignedTo ? (
                                  <Box>
                                    <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
                                      {handphone.assignedTo.kodeOrlap}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary" display="block">
                                      {handphone.assignedTo.namaOrlap}
                                    </Typography>
                                  </Box>
                                ) : (
                                  <Typography variant="caption" color="text.secondary">-</Typography>
                                )}
                              </TableCell>
                            )}
                          </TableRow>
                        ))
                      )}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Box sx={{ p: 4, textAlign: 'center' }}>
                <Inventory sx={{ fontSize: 48, color: 'grey.400', mb: 2 }} />
                <Typography variant="body1" color="text.secondary">
                  Belum ada produk yang di-assign ke handphone yang dikelola.
                </Typography>
              </Box>
            )}
          </CardContent>
        </Card>
      </Container>
    </SidebarLayout>
  );
};

export default FieldStaffDashboard;