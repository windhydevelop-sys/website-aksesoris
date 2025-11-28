const express = require('express');
const router = express.Router();
const Cashflow = require('../models/Cashflow');
const auth = require('../middleware/auth');
const { requireRole } = auth;
const { logActivity } = require('../utils/audit');

// Get all cashflow entries
router.get('/', auth, async (req, res) => {
  try {
    const { type, category, startDate, endDate, page = 1, limit = 50 } = req.query;

    let query = {};

    if (type) query.type = type;
    if (category) query.category = { $regex: category, $options: 'i' };

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
    const { type, category, amount, description, date, reference, paymentMethod } = req.body;

    // Validate required fields
    if (!type || !category || !amount) {
      return res.status(400).json({
        success: false,
        error: 'Type, category, and amount are required'
      });
    }

    if (amount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Amount must be greater than 0'
      });
    }

    const newCashflow = new Cashflow({
      type,
      category: category.trim(),
      amount: parseFloat(amount),
      description: description?.trim(),
      date: date ? new Date(date) : new Date(),
      reference: reference?.trim(),
      paymentMethod: paymentMethod || 'cash',
      createdBy: req.user.userId
    });

    const savedCashflow = await newCashflow.save();

    // Log activity
    await logActivity(
      req.user.userId,
      'CREATE_CASHFLOW',
      `Created ${type} entry: ${category} - Rp ${amount.toLocaleString('id-ID')}`,
      { cashflowId: savedCashflow._id }
    );

    const populatedCashflow = await Cashflow.findById(savedCashflow._id)
      .populate('createdBy', 'username');

    res.status(201).json({
      success: true,
      data: populatedCashflow,
      message: 'Cashflow entry created successfully'
    });
  } catch (error) {
    console.error('Error creating cashflow entry:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create cashflow entry'
    });
  }
});

// Update cashflow entry
router.put('/:id', auth, async (req, res) => {
  try {
    const { type, category, amount, description, date, reference, paymentMethod } = req.body;

    const updateData = {
      lastModifiedBy: req.user.userId
    };

    if (type !== undefined) updateData.type = type;
    if (category !== undefined) updateData.category = category.trim();
    if (amount !== undefined) {
      if (amount <= 0) {
        return res.status(400).json({
          success: false,
          error: 'Amount must be greater than 0'
        });
      }
      updateData.amount = parseFloat(amount);
    }
    if (description !== undefined) updateData.description = description?.trim();
    if (date !== undefined) updateData.date = new Date(date);
    if (reference !== undefined) updateData.reference = reference?.trim();
    if (paymentMethod !== undefined) updateData.paymentMethod = paymentMethod;

    const updatedCashflow = await Cashflow.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('createdBy', 'username')
     .populate('lastModifiedBy', 'username');

    if (!updatedCashflow) {
      return res.status(404).json({
        success: false,
        error: 'Cashflow entry not found'
      });
    }

    // Log activity
    await logActivity(
      req.user.userId,
      'UPDATE_CASHFLOW',
      `Updated ${updatedCashflow.type} entry: ${updatedCashflow.category}`,
      { cashflowId: updatedCashflow._id }
    );

    res.json({
      success: true,
      data: updatedCashflow,
      message: 'Cashflow entry updated successfully'
    });
  } catch (error) {
    console.error('Error updating cashflow entry:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update cashflow entry'
    });
  }
});

// Delete cashflow entry
router.delete('/:id', auth, async (req, res) => {
  try {
    const deletedCashflow = await Cashflow.findByIdAndDelete(req.params.id);

    if (!deletedCashflow) {
      return res.status(404).json({
        success: false,
        error: 'Cashflow entry not found'
      });
    }

    // Log activity
    await logActivity(
      req.user.userId,
      'DELETE_CASHFLOW',
      `Deleted ${deletedCashflow.type} entry: ${deletedCashflow.category}`,
      { cashflowId: deletedCashflow._id }
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
    const { startDate, endDate } = req.query;

    let dateFilter = {};
    if (startDate || endDate) {
      dateFilter.date = {};
      if (startDate) dateFilter.date.$gte = new Date(startDate);
      if (endDate) dateFilter.date.$lte = new Date(endDate);
    }

    const incomeResult = await Cashflow.aggregate([
      { $match: { ...dateFilter, type: 'income' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const expenseResult = await Cashflow.aggregate([
      { $match: { ...dateFilter, type: 'expense' } },
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
        period: { startDate, endDate }
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

module.exports = router;