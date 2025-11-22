import React, { useState, useEffect } from 'react';
import { Container, Typography, Accordion, AccordionSummary, AccordionDetails, CircularProgress, Alert, TextField, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, InputAdornment, Box, Card, CardContent } from '@mui/material';
import { Search } from '@mui/icons-material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import SidebarLayout from './SidebarLayout';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Customers = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCustomer, setSelectedCustomer] = useState('');

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }
        let url = 'http://localhost:3001/api/products/customers';
        if (selectedCustomer) {
          url = `http://localhost:3001/api/products/customers?customerName=${encodeURIComponent(selectedCustomer)}`;
        }
        const response = await axios.get(url, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setProducts(response.data.data);
      } catch (err) {
        console.error('Error fetching products:', err);
        setError('Failed to fetch products. Please try again later.');
        if (err.response && err.response.status === 401) {
          navigate('/login');
        }
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(() => {
      fetchProducts();
    }, 300);
    return () => clearTimeout(timer);
  }, [navigate, selectedCustomer]);

  const groupedProducts = products.reduce((acc, product) => {
    const customerName = product.customer || 'Unassigned';
    if (!acc[customerName]) {
      acc[customerName] = [];
    }
    acc[customerName].push(product);
    return acc;
  }, {});

  return (
    <SidebarLayout onLogout={handleLogout}>
      <Container maxWidth="md" sx={{ mt: 8 }}>
        <Typography variant="h4" gutterBottom>Customer Products</Typography>

        <Card sx={{
          mb: 2,
          borderRadius: 3,
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
        }}>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ color: 'rgba(0,0,0,0.8)' }}>Filter</Typography>
            <TextField
              label="Filter by Customer Name"
              variant="outlined"
              value={selectedCustomer}
              onChange={(e) => setSelectedCustomer(e.target.value)}
              InputProps={{
                startAdornment: <InputAdornment position="start"><Search /></InputAdornment>,
                sx: { borderRadius: 2 }
              }}
              fullWidth
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  backdropFilter: 'blur(5px)',
                  border: '1px solid rgba(255,255,255,0.3)',
                  '&:hover': {
                    backgroundColor: 'rgba(255,255,255,0.2)',
                    border: '1px solid rgba(255,255,255,0.4)'
                  },
                  '&.Mui-focused': {
                    backgroundColor: 'rgba(255,255,255,0.2)',
                    border: '1px solid rgba(255,255,255,0.5)',
                    boxShadow: '0 0 10px rgba(255,255,255,0.3)'
                  }
                }
              }}
            />
            <Box sx={{ mt: 1 }}>
              <Typography variant="body2" color="text.secondary">Menampilkan {products.length} produk, {Object.keys(groupedProducts).length} pelanggan</Typography>
            </Box>
          </CardContent>
        </Card>

        {loading && <CircularProgress />}
        {error && <Alert severity="error">{error}</Alert>}

        {!loading && !error && Object.keys(groupedProducts).length === 0 && (
          <Typography>No products found.</Typography>
        )}

        {!loading && !error && Object.keys(groupedProducts).length > 0 && (
          <div>
            <Typography variant="body2" color="text.secondary">Menampilkan {products.length} produk, {Object.keys(groupedProducts).length} pelanggan</Typography>
            {Object.entries(groupedProducts).map(([customerName, customerProducts]) => (
              <Accordion key={customerName} sx={{ mt: 2 }}>
                <AccordionSummary
                  expandIcon={<ExpandMoreIcon />}
                  aria-controls={`${customerName}-content`}
                  id={`${customerName}-header`}
                >
                  <Typography variant="h6">{customerName} ({customerProducts.length})</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <TableContainer component={Paper}>
                    <Table size="small" aria-label="customer products table" stickyHeader>
                      <TableHead>
                        <TableRow>
                          <TableCell>Nama Customer</TableCell>
                          <TableCell>Order No</TableCell>
                          <TableCell>Nama Produk</TableCell>
                          <TableCell>Bank</TableCell>
                          <TableCell>Status</TableCell>
                          <TableCell>Expired</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {customerProducts.map((product) => (
                          <TableRow
                            key={product._id}
                            sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                          >
                            <TableCell component="th" scope="row">
                              {customerName}
                            </TableCell>
                            <TableCell>{product.noOrder}</TableCell>
                            <TableCell>{product.nama}</TableCell>
                            <TableCell>{product.bank}</TableCell>
                            <TableCell>{product.status}</TableCell>
                            <TableCell>{new Date(product.expired).toLocaleDateString('id-ID')}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </AccordionDetails>
              </Accordion>
            ))}
          </div>
        )}
      </Container>
    </SidebarLayout>
  );
};

export default Customers;