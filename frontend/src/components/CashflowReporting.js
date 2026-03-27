import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Container,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Grid,
  Typography,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent
} from '@mui/material';
import { 
  Download, 
  TrendingUp, 
  TrendingDown, 
  BarChart as BarChartIcon,
  Print
} from '@mui/icons-material';
import { formatIDR, formatDate } from '../utils/formatHelpers';
import axios_instance from '../utils/axios';
import { utils, writeFile } from 'xlsx';

const CashflowReporting = () => {
  // State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  // Filter states
  const [startDate, setStartDate] = useState(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [selectedAccount, setSelectedAccount] = useState('');
  
  // Report data
  const [reportData, setReportData] = useState([]);
  const [summary, setSummary] = useState({
    totalIncome: 0,
    totalExpense: 0,
    netProfit: 0,
    byAccount: {}
  });
  const [previewOpen, setPreviewOpen] = useState(false);

  /**
   * Fetch cashflow data for report
   */
  const fetchReportData = async () => {
    try {
      setLoading(true);
      const params = {
        startDate,
        endDate
      };
      
      if (selectedAccount) {
        params.account = selectedAccount;
      }

      const response = await axios_instance.get('/api/cashflow/report/income-expense', { params });
      const data = response.data.data || [];
      
      setReportData(data);
      calculateSummary(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching report:', err);
      setError('Gagal memuat laporan. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Calculate summary: Income - Expense = Net Profit
   */
  const calculateSummary = (data) => {
    let totalIncome = 0;
    let totalExpense = 0;
    const accountSummary = {};

    data.forEach(item => {
      if (item.type === 'income') {
        totalIncome += item.amount || 0;
      } else if (item.type === 'expense') {
        totalExpense += item.amount || 0;
      }

      // Summary by account
      const account = item.account || 'Rekening A';
      if (!accountSummary[account]) {
        accountSummary[account] = { income: 0, expense: 0 };
      }
      
      if (item.type === 'income') {
        accountSummary[account].income += item.amount || 0;
      } else {
        accountSummary[account].expense += item.amount || 0;
      }
    });

    const netProfit = totalIncome - totalExpense;

    setSummary({
      totalIncome,
      totalExpense,
      netProfit,
      byAccount: accountSummary
    });
  };

  // Load report on mount
  useEffect(() => {
    fetchReportData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate, endDate, selectedAccount]);

  /**
   * Export report to Excel
   */
  const handleExportToExcel = () => {
    try {
      setLoading(true);

      // Prepare data for export
      const worksheetData = [
        ['LAPORAN LABA RUGI'],
        [`Periode: ${formatDate(startDate)} - ${formatDate(endDate)}`],
        [],
        ['RINGKASAN LABA RUGI'],
        ['Keterangan', 'Jumlah (Rp)'],
        ['Total Pemasukan', summary.totalIncome],
        ['Total Pengeluaran', summary.totalExpense],
        ['Laba Bersih', summary.netProfit],
        [],
        ['RINGKASAN PER REKENING'],
        ['Rekening', 'Pemasukan', 'Pengeluaran', 'Laba Bersih']
      ];

      // Add account summary
      Object.entries(summary.byAccount).forEach(([account, data]) => {
        const profit = data.income - data.expense;
        worksheetData.push([account, data.income, data.expense, profit]);
      });

      worksheetData.push([]);
      worksheetData.push(['DETAIL TRANSAKSI']);
      worksheetData.push(['Tanggal', 'Tipe', 'Kategori', 'Jumlah', 'Rekening', 'Keterangan', 'Metode Bayar']);

      // Add transaction details
      reportData.forEach(item => {
        worksheetData.push([
          formatDate(item.date),
          item.type === 'income' ? 'Pemasukan' : 'Pengeluaran',
          item.category,
          item.amount,
          item.account || 'Rekening A',
          item.description || '',
          item.paymentMethod || ''
        ]);
      });

      // Create workbook
      const worksheet = utils.aoa_to_sheet(worksheetData);
      
      // Set column widths
      const columnWidths = [
        { wch: 15 },  // Tanggal
        { wch: 15 },  // Tipe
        { wch: 20 },  // Kategori
        { wch: 18 },  // Jumlah
        { wch: 15 },  // Rekening
        { wch: 25 },  // Keterangan
        { wch: 15 }   // Metode Bayar
      ];
      worksheet['!cols'] = columnWidths;

      const workbook = utils.book_new();
      utils.book_append_sheet(workbook, worksheet, 'Laporan Laba Rugi');

      // Generate filename with date
      const filename = `Laporan-Laba-Rugi-${startDate}-hingga-${endDate}.xlsx`;
      writeFile(workbook, filename);

      setSuccess('Laporan berhasil di-export ke Excel');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error exporting to Excel:', err);
      setError('Gagal export laporan');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Print preview dialog
   */
  const handlePrintPreview = () => {
    setPreviewOpen(true);
  };

  /**
   * Handle print
   */
  const handlePrint = () => {
    window.print();
    setPreviewOpen(false);
  };

  /**
   * Summary Card Component
   */
  const SummaryCard = ({ title, amount, type, account = null }) => {
    const isProfit = amount >= 0;
    const color = type === 'profit' 
      ? (isProfit ? '#4CAF50' : '#F44336')
      : type === 'income' 
      ? '#4CAF50'
      : '#F44336';

    return (
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box>
              <Typography variant="body2" color="textSecondary">
                {title}
              </Typography>
              {account && (
                <Typography variant="caption" color="textSecondary">
                  {account}
                </Typography>
              )}
              <Typography variant="h5" sx={{ color, fontWeight: 'bold', mt: 1 }}>
                {formatIDR(amount)}
              </Typography>
            </Box>
            <Box sx={{ color, fontSize: 32 }}>
              {type === 'income' && <TrendingUp />}
              {type === 'expense' && <TrendingDown />}
              {type === 'profit' && (isProfit ? <TrendingUp /> : <TrendingDown />)}
            </Box>
          </Box>
        </CardContent>
      </Card>
    );
  };

  /**
   * Report Summary Section
   */
  const ReportSummary = () => (
    <Box>
      <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', mb: 2 }}>
        📊 Ringkasan Laba Rugi
      </Typography>
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <SummaryCard 
            title="Total Pemasukan" 
            amount={summary.totalIncome}
            type="income"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <SummaryCard 
            title="Total Pengeluaran" 
            amount={summary.totalExpense}
            type="expense"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <SummaryCard 
            title="Laba Bersih" 
            amount={summary.netProfit}
            type="profit"
          />
        </Grid>
      </Grid>

      {/* Account Summary */}
      {Object.keys(summary.byAccount).length > 0 && (
        <>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', mb: 2 }}>
            📈 Ringkasan Per Rekening
          </Typography>
          <Grid container spacing={2} sx={{ mb: 4 }}>
            {Object.entries(summary.byAccount).map(([account, data]) => {
              const profit = data.income - data.expense;
              return (
                <Grid item xs={12} sm={6} key={account}>
                  <Card>
                    <CardContent>
                      <Typography variant="body2" color="textSecondary" gutterBottom>
                        {account}
                      </Typography>
                      <Grid container spacing={1}>
                        <Grid item xs={6}>
                          <Typography variant="caption" color="textSecondary">
                            Pemasukan
                          </Typography>
                          <Typography variant="body2" sx={{ color: '#4CAF50', fontWeight: 'bold' }}>
                            {formatIDR(data.income)}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="caption" color="textSecondary">
                            Pengeluaran
                          </Typography>
                          <Typography variant="body2" sx={{ color: '#F44336', fontWeight: 'bold' }}>
                            {formatIDR(data.expense)}
                          </Typography>
                        </Grid>
                      </Grid>
                      <Box sx={{ borderTop: '1px solid #eee', mt: 1, pt: 1 }}>
                        <Typography variant="caption" color="textSecondary">
                          Laba Bersih
                        </Typography>
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            color: profit >= 0 ? '#4CAF50' : '#F44336',
                            fontWeight: 'bold'
                          }}
                        >
                          {formatIDR(profit)}
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        </>
      )}
    </Box>
  );

  /**
   * Report Filters
   */
  const ReportFilters = () => (
    <Card sx={{ mb: 3 }}>
      <CardHeader title="⚙️ Filter Laporan" />
      <CardContent>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              label="Tanggal Mulai"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              label="Tanggal Akhir"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth>
              <InputLabel>Rekening</InputLabel>
              <Select 
                value={selectedAccount} 
                onChange={(e) => setSelectedAccount(e.target.value)}
                label="Rekening"
              >
                <MenuItem value="">Semua Rekening</MenuItem>
                <MenuItem value="Rekening A">Rekening A</MenuItem>
                <MenuItem value="Rekening B">Rekening B</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Button 
              variant="contained" 
              fullWidth
              sx={{ height: '56px' }}
              onClick={fetchReportData}
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : 'Tampilkan'}
            </Button>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
        <BarChartIcon sx={{ fontSize: 32 }} />
        <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
          Laporan Laba Rugi
        </Typography>
      </Box>

      {/* Messages */}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* Filters */}
      <ReportFilters />

      {/* Loading */}
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {!loading && (
        <>
          {/* Summary */}
          <ReportSummary />

          {/* Action Buttons */}
          <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              startIcon={<Download />}
              onClick={handleExportToExcel}
              disabled={reportData.length === 0}
            >
              Export ke Excel
            </Button>
            <Button
              variant="outlined"
              startIcon={<Print />}
              onClick={handlePrintPreview}
              disabled={reportData.length === 0}
            >
              Print Preview
            </Button>
          </Box>

          {/* Transactions Table */}
          {reportData.length > 0 && (
            <Card>
              <CardHeader title="📝 Detail Transaksi" />
              <TableContainer>
                <Table>
                  <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                    <TableRow>
                      <TableCell>Tanggal</TableCell>
                      <TableCell>Tipe</TableCell>
                      <TableCell>Kategori</TableCell>
                      <TableCell align="right">Jumlah</TableCell>
                      <TableCell>Rekening</TableCell>
                      <TableCell>Keterangan</TableCell>
                      <TableCell>Metode</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {reportData.map((item, index) => (
                      <TableRow key={index} hover>
                        <TableCell>{formatDate(item.date)}</TableCell>
                        <TableCell>
                          <Typography 
                            variant="body2"
                            sx={{ 
                              color: item.type === 'income' ? '#4CAF50' : '#F44336',
                              fontWeight: 'bold'
                            }}
                          >
                            {item.type === 'income' ? '+ Pemasukan' : '- Pengeluaran'}
                          </Typography>
                        </TableCell>
                        <TableCell>{item.category}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                          {formatIDR(item.amount)}
                        </TableCell>
                        <TableCell>{item.account || 'Rekening A'}</TableCell>
                        <TableCell sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {item.description}
                        </TableCell>
                        <TableCell>{item.paymentMethod || '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Card>
          )}

          {/* Empty State */}
          {reportData.length === 0 && !loading && (
            <Alert severity="info">
              Tidak ada data transaksi untuk periode ini. Silakan ubah filter dan coba lagi.
            </Alert>
          )}
        </>
      )}

      {/* Print Preview Modal */}
      <Dialog open={previewOpen} onClose={() => setPreviewOpen(false)} maxWidth="lg" fullWidth>
        <DialogTitle>Print Preview</DialogTitle>
        <DialogContent sx={{ py: 4 }}>
          <Box sx={{ backgroundColor: '#fff', p: 3 }}>
            <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold' }}>
              LAPORAN LABA RUGI
            </Typography>
            <Typography variant="body2" color="textSecondary" gutterBottom sx={{ mb: 3 }}>
              Periode: {formatDate(startDate)} - {formatDate(endDate)}
            </Typography>

            {/* Summary in Preview */}
            <Typography variant="h6" gutterBottom sx={{ mt: 2, fontWeight: 'bold' }}>
              Ringkasan
            </Typography>
            <TableContainer component={Paper}>
              <Table>
                <TableBody>
                  <TableRow>
                    <TableCell>Total Pemasukan</TableCell>
                    <TableCell align="right">{formatIDR(summary.totalIncome)}</TableCell>
                  </TableRow>
                  <TableRow sx={{ backgroundColor: '#f9f9f9' }}>
                    <TableCell>Total Pengeluaran</TableCell>
                    <TableCell align="right">{formatIDR(summary.totalExpense)}</TableCell>
                  </TableRow>
                  <TableRow sx={{ backgroundColor: '#f0f0f0', fontWeight: 'bold' }}>
                    <TableCell sx={{ fontWeight: 'bold' }}>Laba Bersih</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold', color: summary.netProfit >= 0 ? '#4CAF50' : '#F44336' }}>
                      {formatIDR(summary.netProfit)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        </DialogContent>
        <Box sx={{ p: 2, display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
          <Button onClick={() => setPreviewOpen(false)}>Batal</Button>
          <Button variant="contained" onClick={handlePrint}>
            Cetak
          </Button>
        </Box>
      </Dialog>
    </Container>
  );
};

export default CashflowReporting;
