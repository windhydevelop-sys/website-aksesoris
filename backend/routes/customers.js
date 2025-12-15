const express = require('express');
const router = express.Router();
const Customer = require('../models/Customer');
const auth = require('../middleware/auth');
const requireAdmin = require('../middleware/auth').requireAdmin;

// Get all customers (Admin only)
router.get('/', auth, requireAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = req.query.limit ? parseInt(req.query.limit) : null;

    let customers;
    let total = await Customer.countDocuments();

    if (limit) {
      const skip = (page - 1) * limit;
      customers = await Customer.find()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);
    } else {
      customers = await Customer.find()
        .sort({ createdAt: -1 });
    }

    res.json({
      success: true,
      data: customers,
      pagination: limit ? {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      } : null
    });
  } catch (error) {
    console.error('Error fetching customers:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch customers'
    });
  }
});

// Get customer by ID
router.get('/:id', auth, requireAdmin, async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({
        success: false,
        error: 'Customer not found'
      });
    }
    res.json({
      success: true,
      data: customer
    });
  } catch (error) {
    console.error('Error fetching customer:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch customer'
    });
  }
});

// Create new customer (Admin only)
router.post('/', auth, requireAdmin, async (req, res) => {
  try {
    const { kodeCustomer, namaCustomer, noHandphone } = req.body;

    // Check if kodeCustomer already exists
    const existingCustomer = await Customer.findOne({ kodeCustomer });
    if (existingCustomer) {
      return res.status(400).json({
        success: false,
        error: 'Kode customer already exists'
      });
    }

    const customer = new Customer({
      kodeCustomer,
      namaCustomer,
      noHandphone
    });

    await customer.save();

    res.status(201).json({
      success: true,
      data: customer,
      message: 'Customer created successfully'
    });
  } catch (error) {
    console.error('Error creating customer:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.message
      });
    }
    res.status(500).json({
      success: false,
      error: 'Failed to create customer'
    });
  }
});

// Update customer (Admin only)
router.put('/:id', auth, requireAdmin, async (req, res) => {
  try {
    const { kodeCustomer, namaCustomer, noHandphone } = req.body;

    // Check if kodeCustomer already exists for another customer
    const existingCustomer = await Customer.findOne({
      kodeCustomer,
      _id: { $ne: req.params.id }
    });
    if (existingCustomer) {
      return res.status(400).json({
        success: false,
        error: 'Kode customer already exists'
      });
    }

    const customer = await Customer.findByIdAndUpdate(
      req.params.id,
      {
        kodeCustomer,
        namaCustomer,
        noHandphone,
        updatedAt: Date.now()
      },
      { new: true, runValidators: true }
    );

    if (!customer) {
      return res.status(404).json({
        success: false,
        error: 'Customer not found'
      });
    }

    res.json({
      success: true,
      data: customer,
      message: 'Customer updated successfully'
    });
  } catch (error) {
    console.error('Error updating customer:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.message
      });
    }
    res.status(500).json({
      success: false,
      error: 'Failed to update customer'
    });
  }
});

// Delete customer (Admin only)
router.delete('/:id', auth, requireAdmin, async (req, res) => {
  try {
    const customer = await Customer.findByIdAndDelete(req.params.id);
    if (!customer) {
      return res.status(404).json({
        success: false,
        error: 'Customer not found'
      });
    }
    res.json({
      success: true,
      message: 'Customer deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting customer:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete customer'
    });
  }
});

module.exports = router;