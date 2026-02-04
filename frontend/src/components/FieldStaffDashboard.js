import React, { useState, useEffect, useCallback } from 'react';
import {
  Container, Typography, Box, Card, CardContent, Grid, Chip, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, CircularProgress, Alert
} from '@mui/material';
import { Inventory, Assignment, CheckCircle } from '@mui/icons-material';
import SidebarLayout from './SidebarLayout';
import { useNavigate } from 'react-router-dom';
import { useNotification } from '../contexts/NotificationContext';
import axios from '../utils/axios';

const FieldStaffDashboard = () => {
  const navigate = useNavigate();
  const { showError } = useNotification();
  const [stats, setStats] = useState(null);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Get current user info
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const isAdmin = currentUser.role === 'admin';

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);

      if (isAdmin) {
        // Admin gets aggregated stats for all staff
        const response = await axios.get('/api/field-staff/stats');
        setStats(response.data.data);
        setSummary(response.data.summary);
      } else {
        // Regular field staff logic (maybe restrict view later, for now admin centric as per request)
        // If not admin, maybe redirect or show limited view? 
        // Assuming this dashboard is for Admin/Orlap Supervisors mainly.
        // If regular user, reuse the same endpoint but maybe filter in frontend or backend.
        // For compliance with request "Dashboard Orlap", we show the list.
        const response = await axios.get('/api/field-staff/stats');
        setStats(response.data.data);
        setSummary(response.data.summary);
      }

      setError(null);
    } catch (err) {
      console.error('Error fetching field staff stats:', err);
      setError('Gagal mengambil data statistik Field Staff');
      showError('Gagal mengambil data statistik');
    } finally {
      setLoading(false);
    }
  }, [isAdmin, showError]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
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
        <Typography variant="h4" component="h1" gutterBottom sx={{ mb: 3, fontWeight: 'bold' }}>
          Dashboard Orlap
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          Monitoring performa Field Staff dan pengelolaan rekening.
        </Typography>

        {/* Summary Cards */}
        {summary && (
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white', borderRadius: 3, boxShadow: 3
              }}>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Assignment sx={{ fontSize: 40, mb: 1 }} />
                  <Typography variant="h3" sx={{ fontWeight: 'bold' }}>{summary.totalFieldStaff}</Typography>
                  <Typography variant="body2">Total Orlap</Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{
                background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                color: 'white', borderRadius: 3, boxShadow: 3
              }}>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Inventory sx={{ fontSize: 40, mb: 1 }} />
                  <Typography variant="h3" sx={{ fontWeight: 'bold' }}>{summary.totalRekening}</Typography>
                  <Typography variant="body2">Total Dokumen/Rekening</Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{
                background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
                color: 'white', borderRadius: 3, boxShadow: 3
              }}>
                <CardContent sx={{ textAlign: 'center' }}>
                  <CheckCircle sx={{ fontSize: 40, mb: 1 }} />
                  <Typography variant="h4" sx={{ fontWeight: 'bold', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {summary.topPerformer?.namaOrlap.split(' ')[0]}
                  </Typography>
                  <Typography variant="caption" display="block">
                    Top Performer ({summary.topPerformer?.stats?.totalRekening} Dokumen)
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            {/* <Grid item xs={12} sm={6} md={3}>
               Optional 4th card
            </Grid> */}
          </Grid>
        )}

        {/* Orlap Data Table */}
        <Card sx={{ borderRadius: 3, boxShadow: 2 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
              📊 Statistik Per Orlap
            </Typography>
            <TableContainer>
              <Table>
                <TableHead sx={{ bgcolor: 'grey.100' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold' }}>Kode Orlap</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Nama Orlap</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', textAlign: 'center' }}>Total Rekening</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Distribusi Bank</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Status (Aktif/Selesai)</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {stats?.map((staff) => (
                    <TableRow key={staff._id} hover>
                      <TableCell sx={{ fontWeight: 'medium' }}>{staff.kodeOrlap}</TableCell>
                      <TableCell>{staff.namaOrlap}</TableCell>
                      <TableCell sx={{ textAlign: 'center', fontSize: '1.2rem', fontWeight: 'bold', color: 'primary.main' }}>
                        {staff.stats.totalRekening}
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                          {Object.entries(staff.stats.bankDistribution).map(([bank, count]) => (
                            <Chip
                              key={bank}
                              label={`${bank}: ${count}`}
                              size="small"
                              variant="outlined"
                              color="info"
                            />
                          ))}
                          {Object.keys(staff.stats.bankDistribution).length === 0 && (
                            <Typography variant="caption" color="text.secondary">-</Typography>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Chip label={`Aktif: ${staff.stats.activeCount}`} size="small" color="warning" variant="outlined" />
                          <Chip label={`Selesai: ${staff.stats.completedCount}`} size="small" color="success" variant="outlined" />
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                  {stats?.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                        Belum ada data Field Staff.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </Container>
    </SidebarLayout>
  );
};

export default FieldStaffDashboard;