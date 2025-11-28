const express = require('express');
const FieldStaff = require('../models/FieldStaff');
const { requireRole } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

const router = express.Router();

// Validation middleware
const validateFieldStaff = [
  body('kodeOrlap')
    .trim()
    .notEmpty()
    .withMessage('Kode Orlap is required')
    .isLength({ min: 2, max: 20 })
    .withMessage('Kode Orlap must be between 2-20 characters'),
  body('namaOrlap')
    .trim()
    .notEmpty()
    .withMessage('Nama Orlap is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Nama Orlap must be between 2-100 characters'),
  body('noHandphone')
    .trim()
    .notEmpty()
    .withMessage('No Handphone is required')
    .matches(/^(\+62|62|0)8[1-9][0-9]{6,9}$/)
    .withMessage('No Handphone must be a valid Indonesian mobile number')
];

// GET /api/field-staff - Get all field staff
router.get('/', requireRole(['admin']), async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const fieldStaff = await FieldStaff.find({})
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await FieldStaff.countDocuments();

    res.json({
      success: true,
      data: fieldStaff,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching field staff:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch field staff'
    });
  }
});

// GET /api/field-staff/:id - Get field staff by ID
router.get('/:id', requireRole(['admin']), async (req, res) => {
  try {
    const fieldStaff = await FieldStaff.findById(req.params.id);

    if (!fieldStaff) {
      return res.status(404).json({
        success: false,
        error: 'Field staff not found'
      });
    }

    res.json({
      success: true,
      data: fieldStaff
    });
  } catch (error) {
    console.error('Error fetching field staff:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch field staff'
    });
  }
});

// POST /api/field-staff - Create new field staff
router.post('/', requireRole(['admin']), validateFieldStaff, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { kodeOrlap, namaOrlap, noHandphone } = req.body;

    // Check if kodeOrlap already exists
    const existingFieldStaff = await FieldStaff.findOne({ kodeOrlap });
    if (existingFieldStaff) {
      return res.status(400).json({
        success: false,
        error: 'Kode Orlap already exists'
      });
    }

    const fieldStaff = new FieldStaff({
      kodeOrlap,
      namaOrlap,
      noHandphone
    });

    await fieldStaff.save();

    res.status(201).json({
      success: true,
      data: fieldStaff,
      message: 'Field staff created successfully'
    });
  } catch (error) {
    console.error('Error creating field staff:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create field staff'
    });
  }
});

// PUT /api/field-staff/:id - Update field staff
router.put('/:id', requireRole(['admin']), validateFieldStaff, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { kodeOrlap, namaOrlap, noHandphone } = req.body;

    // Check if kodeOrlap already exists (excluding current record)
    const existingFieldStaff = await FieldStaff.findOne({
      kodeOrlap,
      _id: { $ne: req.params.id }
    });
    if (existingFieldStaff) {
      return res.status(400).json({
        success: false,
        error: 'Kode Orlap already exists'
      });
    }

    const fieldStaff = await FieldStaff.findByIdAndUpdate(
      req.params.id,
      { kodeOrlap, namaOrlap, noHandphone },
      { new: true, runValidators: true }
    );

    if (!fieldStaff) {
      return res.status(404).json({
        success: false,
        error: 'Field staff not found'
      });
    }

    res.json({
      success: true,
      data: fieldStaff,
      message: 'Field staff updated successfully'
    });
  } catch (error) {
    console.error('Error updating field staff:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update field staff'
    });
  }
});

// DELETE /api/field-staff/:id - Delete field staff
router.delete('/:id', requireRole(['admin']), async (req, res) => {
  try {
    const fieldStaff = await FieldStaff.findByIdAndDelete(req.params.id);

    if (!fieldStaff) {
      return res.status(404).json({
        success: false,
        error: 'Field staff not found'
      });
    }

    res.json({
      success: true,
      message: 'Field staff deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting field staff:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete field staff'
    });
  }
});

module.exports = router;