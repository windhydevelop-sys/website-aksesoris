const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Invoice = require('../models/Invoice');
const Product = require('../models/Product');
const auth = require('../middleware/auth');
const { auditLog } = require('../utils/audit');

// Generate new invoice from product
router.post('/', auth, async (req, res) => {
  try {
    const { productId } = req.body;
    const userId = new mongoose.Types.ObjectId(req.user.id);

    console.log('📄 [POST /invoice] Creating invoice for product:', productId);

    // Validate productId
    if (!productId) {
      return res.status(400).json({
        success: false,
        error: 'Product ID is required'
      });
    }

    // Get product details
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }

    // Check if product already has invoice
    if (product.invoiceNo) {
      return res.status(400).json({
        success: false,
        error: 'Invoice already exists for this product'
      });
    }

    // Generate invoice number
    const invoiceNo = await Invoice.generateInvoiceNo();

    // Create invoice
    const newInvoice = new Invoice({
      invoiceNo,
      productId: new mongoose.Types.ObjectId(productId),
      amount: product.harga || 0,
      customerName: product.nama || '',
      customerNik: product.nik || '',
      bank: product.bank || '',
      noRek: product.noRek || '',
      description: `Produk ${product.noOrder || 'N/A'} untuk ${product.nama || 'Customer'}`,
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      status: 'draft',
      createdBy: userId
    });

    const savedInvoice = await newInvoice.save();
    console.log('✅ Invoice created:', invoiceNo);

    // Update product with invoice info
    await Product.findByIdAndUpdate(productId, {
      invoiceNo: invoiceNo,
      invoiceDate: new Date(),
      lastModifiedBy: userId
    });

    // Audit log
    await auditLog('CREATE_INVOICE', req.user.id, 'Invoice', savedInvoice._id, {
      invoiceNo: invoiceNo,
      productId: productId,
      amount: product.harga
    }, req);

    res.status(201).json({
      success: true,
      data: savedInvoice,
      message: 'Invoice created successfully'
    });

  } catch (error) {
    console.error('❌ Error creating invoice:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create invoice'
    });
  }
});

// Get invoice by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate('productId', 'noOrder nama nik bank noRek harga')
      .populate('createdBy', 'username email')
      .populate('lastModifiedBy', 'username email');

    if (!invoice) {
      return res.status(404).json({
        success: false,
        error: 'Invoice not found'
      });
    }

    res.json({
      success: true,
      data: invoice
    });

  } catch (error) {
    console.error('❌ Error fetching invoice:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch invoice'
    });
  }
});

// Get invoice by invoice number
router.get('/number/:invoiceNo', auth, async (req, res) => {
  try {
    const invoice = await Invoice.findOne({ invoiceNo: req.params.invoiceNo })
      .populate('productId', 'noOrder nama nik bank noRek harga')
      .populate('createdBy', 'username email')
      .populate('lastModifiedBy', 'username email');

    if (!invoice) {
      return res.status(404).json({
        success: false,
        error: 'Invoice not found'
      });
    }

    res.json({
      success: true,
      data: invoice
    });

  } catch (error) {
    console.error('❌ Error fetching invoice:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch invoice'
    });
  }
});

// Get all invoices (with filters)
router.get('/', auth, async (req, res) => {
  try {
    const { status, productId } = req.query;
    const userId = new mongoose.Types.ObjectId(req.user.id);

    let query = { createdBy: userId };
    if (status) query.status = status;
    if (productId) query.productId = new mongoose.Types.ObjectId(productId);

    const invoices = await Invoice.find(query)
      .populate('productId', 'noOrder nama nik bank noRek harga')
      .populate('createdBy', 'username email')
      .sort({ invoiceDate: -1 });

    res.json({
      success: true,
      data: invoices,
      count: invoices.length
    });

  } catch (error) {
    console.error('❌ Error fetching invoices:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch invoices'
    });
  }
});

// Update invoice status
router.put('/:id/status', auth, async (req, res) => {
  try {
    const { status } = req.body;
    const userId = new mongoose.Types.ObjectId(req.user.id);

    if (!['draft', 'issued', 'paid', 'overdue', 'cancelled'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status'
      });
    }

    let updateData = {
      status,
      lastModifiedBy: userId
    };

    // If marking as paid
    if (status === 'paid') {
      updateData.paidDate = new Date();
    }

    const updatedInvoice = await Invoice.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('productId', 'noOrder nama')
     .populate('createdBy', 'username email');

    if (!updatedInvoice) {
      return res.status(404).json({
        success: false,
        error: 'Invoice not found'
      });
    }

    // Audit log
    await auditLog('UPDATE_INVOICE_STATUS', req.user.id, 'Invoice', updatedInvoice._id, {
      status: status
    }, req);

    res.json({
      success: true,
      data: updatedInvoice,
      message: 'Invoice status updated'
    });

  } catch (error) {
    console.error('❌ Error updating invoice:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update invoice'
    });
  }
});

// Mark invoice as issued
router.post('/:id/issue', auth, async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) {
      return res.status(404).json({
        success: false,
        error: 'Invoice not found'
      });
    }

    await invoice.markAsIssued();

    // Audit log
    await auditLog('ISSUE_INVOICE', req.user.id, 'Invoice', invoice._id, {
      invoiceNo: invoice.invoiceNo
    }, req);

    res.json({
      success: true,
      data: invoice,
      message: 'Invoice issued'
    });

  } catch (error) {
    console.error('❌ Error issuing invoice:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to issue invoice'
    });
  }
});

// Mark invoice as paid
router.post('/:id/pay', auth, async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) {
      return res.status(404).json({
        success: false,
        error: 'Invoice not found'
      });
    }

    await invoice.markAsPaid();

    // Audit log
    await auditLog('PAY_INVOICE', req.user.id, 'Invoice', invoice._id, {
      invoiceNo: invoice.invoiceNo,
      amount: invoice.amount
    }, req);

    res.json({
      success: true,
      data: invoice,
      message: 'Invoice marked as paid'
    });

  } catch (error) {
    console.error('❌ Error paying invoice:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to mark invoice as paid'
    });
  }
});

module.exports = router;
