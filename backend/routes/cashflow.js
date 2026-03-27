const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Cashflow = require('../models/Cashflow');
const auth = require('../middleware/auth');
const { requireRole } = auth;
const { auditLog } = require('../utils/audit');

// Get all cashflow entries
router.get('/', auth, async (req, res) => {
  try {
    const { type, category, startDate, endDate, account, page = 1, limit = 50 } = req.query;
    const userId = req.user.id;

    let query = { createdBy: userId };

    if (type) query.type = type;
    if (category) query.category = { $regex: category, $options: 'i' };
    if (account) query.account = account;  // Filter by account (Rekening A/B)

    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const cashflows = await Cashflow.find(query)
      .populate('createdBy', 'username')
      .populate('lastModifiedBy', 'username')
      .sort({ date: -1, createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Cashflow.countDocuments(query);

    res.json({
      success: true,
      data: cashflows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching cashflow:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch cashflow entries'
    });
  }
});

// Get cashflow by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const cashflow = await Cashflow.findById(req.params.id)
      .populate('createdBy', 'username')
      .populate('lastModifiedBy', 'username');

    if (!cashflow) {
      return res.status(404).json({
        success: false,
        error: 'Cashflow entry not found'
      });
    }

    // Security: Check if user owns this cashflow
    if (cashflow.createdBy.toString() !== req.user.id.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized'
      });
    }

    res.json({
      success: true,
      data: cashflow
    });
  } catch (error) {
    console.error('Error fetching cashflow entry:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch cashflow entry'
    });
  }
});

// Create new cashflow entry
router.post('/', auth, async (req, res) => {
  try {
    const {
      type, category, amount, description, date, reference, paymentMethod, account
    } = req.body;

    // Validate required fields
    if (!type || !category || !amount) {
      return res.status(400).json({
        success: false,
        error: 'Tipe, kategori, dan nominal wajib diisi'
      });
    }

    if (!['income', 'expense'].includes(type)) {
      return res.status(400).json({
        success: false,
        error: 'Tipe harus income atau expense'
      });
    }

    if (amount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Nominal harus lebih besar dari 0'
      });
    }

    // Simple single-entry transaction
    const newCashflowData = {
      type,
      category: category.trim(),
      amount: parseFloat(amount),
      description: description?.trim() || '',
      date: date ? new Date(date) : new Date(),
      reference: reference?.trim() || '',
      paymentMethod: paymentMethod || 'cash',
      account: account || 'Rekening A',
      createdBy: req.user.id
    };

    const newCashflow = new Cashflow(newCashflowData);
    const savedCashflow = await newCashflow.save();

    // Log activity
    await auditLog(
      'CREATE_CASHFLOW',
      req.user.id,
      'cashflow',
      savedCashflow._id,
      { type, category, amount },
      req
    );

    const populatedCashflow = await Cashflow.findById(savedCashflow._id)
      .populate('createdBy', 'username');

    res.status(201).json({
      success: true,
      data: populatedCashflow,
      message: 'Transaksi cashflow berhasil dibuat'
    });
  } catch (error) {
    console.error('Error creating cashflow entry:', error);
    res.status(500).json({
      success: false,
      error: 'Gagal membuat transaksi cashflow'
    });
  }
});

// Update cashflow entry
router.put('/:id', auth, async (req, res) => {
  try {
    const {
      type, category, amount, description, date, reference, paymentMethod, account
    } = req.body;

    // First check if cashflow exists and user owns it
    const existingCashflow = await Cashflow.findById(req.params.id);
    if (!existingCashflow) {
      return res.status(404).json({
        success: false,
        error: 'Transaksi tidak ditemukan'
      });
    }

    // Security: Check if user owns this cashflow
    if (existingCashflow.createdBy.toString() !== req.user.id.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized'
      });
    }

    const updateData = {
      lastModifiedBy: req.user.id
    };

    // Validate and update fields
    if (type !== undefined) {
      if (!['income', 'expense'].includes(type)) {
        return res.status(400).json({
          success: false,
          error: 'Tipe harus income atau expense'
        });
      }
      updateData.type = type;
    }

    if (category !== undefined) updateData.category = category.trim();

    if (amount !== undefined) {
      if (amount <= 0) {
        return res.status(400).json({
          success: false,
          error: 'Nominal harus lebih besar dari 0'
        });
      }
      updateData.amount = parseFloat(amount);
    }

    if (description !== undefined) updateData.description = description?.trim() || '';
    if (date !== undefined) updateData.date = new Date(date);
    if (reference !== undefined) updateData.reference = reference?.trim() || '';
    if (paymentMethod !== undefined) updateData.paymentMethod = paymentMethod;
    if (account !== undefined) updateData.account = account;

    const updatedCashflow = await Cashflow.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('createdBy', 'username')
      .populate('lastModifiedBy', 'username');

    // Log activity
    await auditLog(
      'UPDATE_CASHFLOW',
      req.user.id,
      'cashflow',
      updatedCashflow._id,
      { type: updatedCashflow.type, category: updatedCashflow.category },
      req
    );

    res.json({
      success: true,
      data: updatedCashflow,
      message: 'Transaksi cashflow berhasil diperbarui'
    });
  } catch (error) {
    console.error('Error updating cashflow entry:', error);
    res.status(500).json({
      success: false,
      error: 'Gagal mengupdate transaksi cashflow'
    });
  }
});

// Delete cashflow entry
router.delete('/:id', auth, async (req, res) => {
  try {
    const deletedCashflow = await Cashflow.findById(req.params.id);

    if (!deletedCashflow) {
      return res.status(404).json({
        success: false,
        error: 'Cashflow entry not found'
      });
    }

    // Security: Check if user owns this cashflow
    if (deletedCashflow.createdBy.toString() !== req.user.id.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized'
      });
    }

    await Cashflow.findByIdAndDelete(req.params.id);

    // Log activity
    await auditLog(
      'DELETE_CASHFLOW',
      req.user.id,
      'cashflow',
      deletedCashflow._id,
      { type: deletedCashflow.type, category: deletedCashflow.category },
      req
    );

    res.json({
      success: true,
      message: 'Cashflow entry deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting cashflow entry:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete cashflow entry'
    });
  }
});

// Get cashflow summary
router.get('/summary/overview', auth, async (req, res) => {
  try {
    const { startDate, endDate, account } = req.query;
    const userId = new mongoose.Types.ObjectId(req.user.id);

    let filter = { createdBy: userId };
    
    // Add date filter if provided
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }

    // Add account filter if provided
    if (account) {
      filter.account = account;
    }

    const incomeResult = await Cashflow.aggregate([
      { $match: { ...filter, type: 'income' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const expenseResult = await Cashflow.aggregate([
      { $match: { ...filter, type: 'expense' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const totalIncome = incomeResult.length > 0 ? incomeResult[0].total : 0;
    const totalExpense = expenseResult.length > 0 ? expenseResult[0].total : 0;
    const netIncome = totalIncome - totalExpense;

    res.json({
      success: true,
      data: {
        totalIncome,
        totalExpense,
        netIncome,
        period: { startDate, endDate },
        account
      }
    });
  } catch (error) {
    console.error('Error fetching cashflow summary:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch cashflow summary'
    });
  }
});



// NEW: Get profit/loss report with date range and account filter
router.get('/report/income-expense', auth, async (req, res) => {
  try {
    const { startDate, endDate, account } = req.query;

    let dateFilter = {};
    if (startDate || endDate) {
      dateFilter.date = {};
      if (startDate) dateFilter.date.$gte = new Date(startDate);
      if (endDate) dateFilter.date.$lte = new Date(endDate);
    }

    // Filter by account if specified
    if (account) {
      dateFilter.account = account;
    }

    // Get all transactions for the report
    const transactions = await Cashflow.find(dateFilter)
      .populate('createdBy', 'username')
      .populate('lastModifiedBy', 'username')
      .sort({ date: -1, createdAt: -1 });

    // Calculate totals
    let totalIncome = 0;
    let totalExpense = 0;
    const accountSummary = {};

    transactions.forEach(item => {
      if (item.type === 'income') {
        totalIncome += item.amount || 0;
      } else if (item.type === 'expense') {
        totalExpense += item.amount || 0;
      }

      // Summary by account
      const acc = item.account || 'Rekening A';
      if (!accountSummary[acc]) {
        accountSummary[acc] = { income: 0, expense: 0 };
      }
      
      if (item.type === 'income') {
        accountSummary[acc].income += item.amount || 0;
      } else {
        accountSummary[acc].expense += item.amount || 0;
      }
    });

    const netProfit = totalIncome - totalExpense;

    res.json({
      success: true,
      data: transactions,
      summary: {
        period: { startDate, endDate },
        totalIncome,
        totalExpense,
        netProfit,
        accountSummary
      }
    });
  } catch (error) {
    console.error('Error fetching report:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch report'
    });
  }
});

module.exports = router;