import React, { useState, useEffect, useCallback } from 'react';
import {
  Container, Typography, Box, CircularProgress, Alert, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, IconButton, Button, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, FormControl, InputLabel, Select, MenuItem, Card, CardContent, Grid, Chip
} from '@mui/material';
import { Edit, Delete, Add, TrendingUp, TrendingDown, AccountBalanceWallet } from '@mui/icons-material';
import SidebarLayout from './SidebarLayout';
import { useNavigate } from 'react-router-dom';
import { useNotification } from '../contexts/NotificationContext';
import axios from '../utils/axios';

const CashflowManagement = () => {
  const navigate = useNavigate();
  const { showSuccess, showError } = useNotification();
  const [cashflows, setCashflows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [summary, setSummary] = useState({ 
    totalIncome: 0, 
    totalExpense: 0, 
    netIncome: 0,
    totalDebit: 0,
    totalCredit: 0,
    balance: 0,
    isBalanced: true
  });

  // Dialog states
  const [openDialog, setOpenDialog] = useState(false);
  const [editingCashflow, setEditingCashflow] = useState(null);
  const [formData, setFormData] = useState({
    type: 'income',
    category: '',
    amount: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    reference: '',
    paymentMethod: 'cash',
    // Enhanced journal fields
    debit: '',
    credit: '',
    accountCode: '1101',
    accountName: 'Cash',
    journalDescription: '',
    referenceNumber: ''
  });

  // Balance calculation for real-time validation
  const calculateBalance = () => {
    const debitAmount = parseFloat(formData.debit) || 0;
    const creditAmount = parseFloat(formData.credit) || 0;
    return debitAmount - creditAmount;
  };

  const balance = calculateBalance();
  const isBalanced = balance === 0;

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const fetchCashflows = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/cashflow');
      setCashflows(response.data.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching cashflows:', err);
      setError('Failed to fetch cashflows');
      showError('Failed to fetch cashflows');
    } finally {
      setLoading(false);
    }
  }, [showError]);

  const fetchSummary = useCallback(async () => {
    try {
      const [overviewResponse, debitCreditResponse] = await Promise.all([
        axios.get('/api/cashflow/summary/overview'),
        axios.get('/api/cashflow/summary/debit-credit')
      ]);
      
      const overviewData = overviewResponse.data.data;
      const debitCreditData = debitCreditResponse.data.data;
      
      setSummary({
        ...overviewData,
        totalDebit: debitCreditData.totalDebit,
        totalCredit: debitCreditData.totalCredit,
        balance: debitCreditData.balance,
        isBalanced: debitCreditData.isBalanced
      });
    } catch (err) {
      console.error('Error fetching summary:', err);
    }
  }, []);

  useEffect(() => {
    fetchCashflows();
    fetchSummary();
  }, [fetchCashflows, fetchSummary]);

  // Auto-fill debit/credit when type or amount changes
  useEffect(() => {
    if (formData.type && formData.amount > 0) {
      const amount = parseFloat(formData.amount) || 0;

      if (formData.type === 'income') {
        // Only auto-fill if debit/credit haven't been manually set or are still default
        if (formData.debit === '' || formData.debit === 0) {
          setFormData(prev => ({
            ...prev,
            debit: 0,
            credit: amount
          }));
        }
      } else if (formData.type === 'expense') {
        // Only auto-fill if debit/credit haven't been manually set or are still default
        if (formData.credit === '' || formData.credit === 0) {
          setFormData(prev => ({
            ...prev,
            debit: amount,
            credit: 0
          }));
        }
      }
    }
  }, [formData.type, formData.amount]);

  const handleOpenDialog = (cashflow = null) => {
    if (cashflow) {
      setEditingCashflow(cashflow);
      setFormData({
        type: cashflow.type,
        category: cashflow.category,
        amount: cashflow.amount,
        description: cashflow.description || '',
        date: cashflow.date ? new Date(cashflow.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        reference: cashflow.reference || '',
        paymentMethod: cashflow.paymentMethod || 'cash',
        // Enhanced journal fields
        debit: cashflow.debit || '',
        credit: cashflow.credit || '',
        accountCode: cashflow.accountCode || '1101',
        accountName: cashflow.accountName || 'Cash',
        journalDescription: cashflow.journalDescription || cashflow.description || '',
        referenceNumber: cashflow.referenceNumber || cashflow.reference || ''
      });
    } else {
      setEditingCashflow(null);
      setFormData({
        type: 'income',
        category: '',
        amount: '',
        description: '',
        date: new Date().toISOString().split('T')[0],
        reference: '',
        paymentMethod: 'cash',
        debit: '',
        credit: '',
        accountCode: '1101',
        accountName: 'Cash',
        journalDescription: '',
        referenceNumber: ''
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingCashflow(null);
    setFormData({
      type: 'income',
      category: '',
      amount: '',
      description: '',
      date: new Date().toISOString().split('T')[0],
      reference: '',
      paymentMethod: 'cash',
      debit: '',
      credit: '',
      accountCode: '1101',
      accountName: 'Cash',
      journalDescription: '',
      referenceNumber: ''
    });
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    const updatedFormData = {
      ...formData,
      [name]: value
    };

    // Auto-fill debit/credit based on type and amount
    if (name === 'type' || name === 'amount') {
      const amount = name === 'amount' ? parseFloat(value) || 0 : parseFloat(updatedFormData.amount) || 0;
      const type = name === 'type' ? value : updatedFormData.type;

      if (type === 'income' && amount > 0) {
        updatedFormData.debit = 0;
        updatedFormData.credit = amount;
      } else if (type === 'expense' && amount > 0) {
        updatedFormData.debit = amount;
        updatedFormData.credit = 0;
      }
    }

    setFormData(updatedFormData);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Balance validation
    const debitAmount = parseFloat(formData.debit) || 0;
    const creditAmount = parseFloat(formData.credit) || 0;
    
    if (debitAmount !== creditAmount) {
      showError(`Balance Error: Debit (Rp ${debitAmount.toLocaleString('id-ID')}) must equal Credit (Rp ${creditAmount.toLocaleString('id-ID')}). Please check your entries.`);
      return;
    }
    
    if (debitAmount === 0 && creditAmount === 0) {
      showError('Please enter either a debit amount or a credit amount.');
      return;
    }
    
    try {
      if (editingCashflow) {
        await axios.put(`/api/cashflow/${editingCashflow._id}`, formData);
        showSuccess('Cashflow entry updated successfully');
      } else {
        await axios.post('/api/cashflow', formData);
        showSuccess('Cashflow entry created successfully');
      }
      fetchCashflows();
      fetchSummary();
      handleCloseDialog();
    } catch (err) {
      console.error('Error saving cashflow:', err);
      
      // Enhanced error handling
      if (err.response?.data?.error?.includes('balance') || err.response?.data?.error?.includes('Balance')) {
        showError('Balance Error: Please ensure debit amount equals credit amount.');
      } else {
        showError(err.response?.data?.error || 'Failed to save cashflow entry');
      }
    }
  };

  const handleDelete = async (cashflowId) => {
    if (window.confirm('Are you sure you want to delete this cashflow entry?')) {
      try {
        await axios.delete(`/api/cashflow/${cashflowId}`);
        showSuccess('Cashflow entry deleted successfully');
        fetchCashflows();
        fetchSummary();
      } catch (err) {
        console.error('Error deleting cashflow:', err);
        showError('Failed to delete cashflow entry');
      }
    }
  };

  const getTypeColor = (type) => {
    return type === 'income' ? 'success' : 'error';
  };

  const getTypeIcon = (type) => {
    return type === 'income' ? <TrendingUp /> : <TrendingDown />;
  };

  const getPaymentMethodLabel = (method) => {
    const labels = {
      cash: 'Cash',
      transfer: 'Transfer',
      credit_card: 'Credit Card',
      debit_card: 'Debit Card',
      other: 'Other'
    };
    return labels[method] || method;
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
            Cashflow Management
          </Typography>
        </Box>

        {/* Enhanced Summary Cards with Journal Style */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{
              background: 'linear-gradient(135deg, #4caf50 0%, #66bb6a 100%)',
              color: 'white',
              borderRadius: 3,
              boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
            }}>
              <CardContent sx={{ textAlign: 'center' }}>
                <TrendingUp sx={{ fontSize: 40, mb: 1 }} />
                <Typography variant="h4" component="div">
                  Rp {summary.totalDebit?.toLocaleString('id-ID') || '0'}
                </Typography>
                <Typography variant="body2">Total Debit</Typography>
                <Typography variant="caption">(Cash Inflows)</Typography>
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
                <TrendingDown sx={{ fontSize: 40, mb: 1 }} />
                <Typography variant="h4" component="div">
                  Rp {summary.totalCredit?.toLocaleString('id-ID') || '0'}
                </Typography>
                <Typography variant="body2">Total Credit</Typography>
                <Typography variant="caption">(Cash Outflows)</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ 
              background: summary.netIncome >= 0
                ? 'linear-gradient(135deg, #2196f3 0%, #64b5f6 100%)'
                : 'linear-gradient(135deg, #ff9800 0%, #ffb74d 100%)',
              color: 'white',
              borderRadius: 3,
              boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
            }}>
              <CardContent sx={{ textAlign: 'center' }}>
                <AccountBalanceWallet sx={{ fontSize: 40, mb: 1 }} />
                <Typography variant="h4" component="div">
                  Rp {Math.abs(summary.netIncome || 0).toLocaleString('id-ID')}
                </Typography>
                <Typography variant="body2">
                  {summary.netIncome >= 0 ? 'Net Profit' : 'Net Loss'}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ 
              backgroundColor: summary.isBalanced ? '#e8f4fd' : '#fff3e0',
              border: summary.isBalanced ? '2px solid #4caf50' : '2px solid #ff9800'
            }}>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h6">
                  Balance {summary.isBalanced ? '✓' : '⚠'}
                </Typography>
                <Typography variant="h5" color={summary.isBalanced ? 'success.main' : 'warning.main'}>
                  Rp {Math.abs(summary.balance || 0).toLocaleString('id-ID')}
                </Typography>
                <Typography variant="body2" color={summary.isBalanced ? 'success.main' : 'warning.main'}>
                  {summary.isBalanced ? 'Balanced' : 'Check Entries'}
                </Typography>
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
            startIcon={<Add />}
            onClick={() => handleOpenDialog()}
            sx={{
              borderRadius: 2,
              width: { xs: '100%', sm: 'auto' }
            }}
          >
            Add Transaction
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
                  <TableCell sx={{ fontWeight: 'bold' }}>Type</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Category</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Amount</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Description</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Date</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Payment Method</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {cashflows.map((cashflow) => (
                  <TableRow key={cashflow._id} hover>
                    <TableCell>
                      <Chip
                        icon={getTypeIcon(cashflow.type)}
                        label={cashflow.type === 'income' ? 'Income' : 'Expense'}
                        color={getTypeColor(cashflow.type)}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>{cashflow.category}</TableCell>
                    <TableCell sx={{
                      color: cashflow.type === 'income' ? 'success.main' : 'error.main',
                      fontWeight: 'bold'
                    }}>
                      {cashflow.type === 'income' ? '+' : '-'}Rp {cashflow.amount?.toLocaleString('id-ID') || '0'}
                    </TableCell>
                    <TableCell>{cashflow.description}</TableCell>
                    <TableCell>{new Date(cashflow.date).toLocaleDateString()}</TableCell>
                    <TableCell>{getPaymentMethodLabel(cashflow.paymentMethod)}</TableCell>
                    <TableCell>
                      <IconButton onClick={() => handleOpenDialog(cashflow)} color="primary" size="small">
                        <Edit />
                      </IconButton>
                      <IconButton onClick={() => handleDelete(cashflow._id)} color="error" size="small">
                        <Delete />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          {cashflows.length === 0 && !loading && (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="body1" color="text.secondary">
                No cashflow entries found. Click "Add Transaction" to create your first entry.
              </Typography>
            </Box>
          )}
        </Card>

        {loading && <CircularProgress sx={{ mt: 2 }} />}
        {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}

        {/* Cashflow Dialog */}
        <Dialog
          open={openDialog}
          onClose={handleCloseDialog}
          maxWidth="md"
          fullWidth
          sx={{ '& .MuiDialog-paper': { borderRadius: 3 } }}
        >
          <DialogTitle sx={{ bgcolor: 'primary.main', color: 'white', fontWeight: 'bold' }}>
            {editingCashflow ? 'Edit Transaction' : 'Add New Transaction'}
          </DialogTitle>
          <form onSubmit={handleSubmit}>
            <DialogContent>
              {/* Balance Validation Indicator */}
              <Box sx={{ 
                p: 2, 
                mb: 2, 
                borderRadius: 2,
                backgroundColor: isBalanced ? '#e8f5e8' : '#fff3e0',
                border: `2px solid ${isBalanced ? '#4caf50' : '#ff9800'}`
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {isBalanced ? <Typography color="success.main">✓</Typography> : <Typography color="warning.main">⚠</Typography>}
                  <Typography variant="h6" color={isBalanced ? 'success.main' : 'warning.main'}>
                    Balance Check
                  </Typography>
                </Box>
                <Typography variant="body2" sx={{ mt: 1 }}>
                  Debit: Rp {(parseFloat(formData.debit) || 0).toLocaleString('id-ID')} | 
                  Credit: Rp {(parseFloat(formData.credit) || 0).toLocaleString('id-ID')} | 
                  Balance: Rp {Math.abs(balance).toLocaleString('id-ID')}
                </Typography>
                <Typography variant="caption" color={isBalanced ? 'success.main' : 'warning.main'}>
                  {isBalanced ? 'Entry is balanced ✓' : 'Debit must equal Credit'}
                </Typography>
              </Box>

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth margin="normal">
                    <InputLabel id="type-label">Type</InputLabel>
                    <Select
                      labelId="type-label"
                      name="type"
                      value={formData.type}
                      label="Type"
                      onChange={handleFormChange}
                      sx={{
                        borderRadius: 2,
                        backgroundColor: 'rgba(255,255,255,0.9)',
                        '&:hover': { backgroundColor: 'rgba(255,255,255,0.95)' },
                        '&.Mui-focused': { backgroundColor: 'white' }
                      }}
                    >
                      <MenuItem value="income">Income (Auto: Debit=0, Credit=Amount)</MenuItem>
                      <MenuItem value="expense">Expense (Auto: Debit=Amount, Credit=0)</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Category"
                    name="category"
                    value={formData.category}
                    onChange={handleFormChange}
                    margin="normal"
                    required
                    placeholder="e.g., Sales, Salary, Utilities, Marketing"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        backgroundColor: 'rgba(255,255,255,0.9)',
                        '&:hover': { backgroundColor: 'rgba(255,255,255,0.95)' },
                        '&.Mui-focused': { backgroundColor: 'white' }
                      },
                      '& .MuiInputBase-input': {
                        color: 'black'
                      },
                      '& .MuiInputLabel-root': {
                        color: 'rgba(0,0,0,0.7)'
                      },
                      '& .MuiInputLabel-root.Mui-focused': {
                        color: 'primary.main'
                      }
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Amount"
                    name="amount"
                    type="number"
                    value={formData.amount}
                    onChange={handleFormChange}
                    margin="normal"
                    required
                    helperText="Changing amount will auto-fill debit/credit based on type"
                    InputProps={{
                      startAdornment: 'Rp ',
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        backgroundColor: 'rgba(255,255,255,0.9)',
                        '&:hover': { backgroundColor: 'rgba(255,255,255,0.95)' },
                        '&.Mui-focused': { backgroundColor: 'white' }
                      },
                      '& .MuiInputBase-input': {
                        color: 'black'
                      },
                      '& .MuiInputLabel-root': {
                        color: 'rgba(0,0,0,0.7)'
                      },
                      '& .MuiInputLabel-root.Mui-focused': {
                        color: 'primary.main'
                      }
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Date"
                    name="date"
                    type="date"
                    value={formData.date}
                    onChange={handleFormChange}
                    margin="normal"
                    required
                    InputLabelProps={{ shrink: true }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        backgroundColor: 'rgba(255,255,255,0.9)',
                        '&:hover': { backgroundColor: 'rgba(255,255,255,0.95)' },
                        '&.Mui-focused': { backgroundColor: 'white' }
                      },
                      '& .MuiInputBase-input': {
                        color: 'black'
                      },
                      '& .MuiInputLabel-root': {
                        color: 'rgba(0,0,0,0.7)'
                      },
                      '& .MuiInputLabel-root.Mui-focused': {
                        color: 'primary.main'
                      }
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth margin="normal">
                    <InputLabel id="payment-method-label">Payment Method</InputLabel>
                    <Select
                      labelId="payment-method-label"
                      name="paymentMethod"
                      value={formData.paymentMethod}
                      label="Payment Method"
                      onChange={handleFormChange}
                      sx={{
                        borderRadius: 2,
                        backgroundColor: 'rgba(255,255,255,0.9)',
                        '&:hover': { backgroundColor: 'rgba(255,255,255,0.95)' },
                        '&.Mui-focused': { backgroundColor: 'white' }
                      }}
                    >
                      <MenuItem value="cash">Cash</MenuItem>
                      <MenuItem value="transfer">Transfer</MenuItem>
                      <MenuItem value="credit_card">Credit Card</MenuItem>
                      <MenuItem value="debit_card">Debit Card</MenuItem>
                      <MenuItem value="other">Other</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Reference"
                    name="reference"
                    value={formData.reference}
                    onChange={handleFormChange}
                    margin="normal"
                    placeholder="Invoice number, receipt number, etc."
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        backgroundColor: 'rgba(255,255,255,0.9)',
                        '&:hover': { backgroundColor: 'rgba(255,255,255,0.95)' },
                        '&.Mui-focused': { backgroundColor: 'white' }
                      },
                      '& .MuiInputBase-input': {
                        color: 'black'
                      },
                      '& .MuiInputLabel-root': {
                        color: 'rgba(0,0,0,0.7)'
                      },
                      '& .MuiInputLabel-root.Mui-focused': {
                        color: 'primary.main'
                      }
                    }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Description"
                    name="description"
                    value={formData.description}
                    onChange={handleFormChange}
                    margin="normal"
                    multiline
                    rows={3}
                    placeholder="Additional details about this transaction"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        backgroundColor: 'rgba(255,255,255,0.9)',
                        '&:hover': { backgroundColor: 'rgba(255,255,255,0.95)' },
                        '&.Mui-focused': { backgroundColor: 'white' }
                      },
                      '& .MuiInputBase-input': {
                        color: 'black'
                      },
                      '& .MuiInputLabel-root': {
                        color: 'rgba(0,0,0,0.7)'
                      },
                      '& .MuiInputLabel-root.Mui-focused': {
                        color: 'primary.main'
                      }
                    }}
                  />
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseDialog}>Cancel</Button>
              <Button type="submit" variant="contained" sx={{ borderRadius: 2 }}>
                {editingCashflow ? 'Update' : 'Create'}
              </Button>
            </DialogActions>
          </form>
        </Dialog>
      </Container>
    </SidebarLayout>
  );
};

export default CashflowManagement;