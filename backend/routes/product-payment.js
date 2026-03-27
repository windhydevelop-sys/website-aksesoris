const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const ProductPayment = require('../models/ProductPayment');
const Product = require('../models/Product');
const Cashflow = require('../models/Cashflow');
const RekeningDetail = require('../models/RekeningDetail');
const auth = require('../middleware/auth');
const { auditLog } = require('../utils/audit');

// Record payment for product
router.post('/', auth, async (req, res) => {
  try {
    const { productId, rekeningId, amount, paymentMethod, referenceNo, notes } = req.body;
    const userId = new mongoose.Types.ObjectId(req.user.id);

    console.log('💳 [POST /product-payment] Recording payment');
    console.log('   Product ID:', productId);
    console.log('   Rekening ID:', rekeningId);
    console.log('   Amount:', amount);

    // Validation
    if (!productId || !rekeningId || !amount) {
      return res.status(400).json({
        success: false,
        error: 'Product ID, Rekening ID, and Amount are required'
      });
    }

    if (amount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Amount must be greater than 0'
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

    // Get rekening details
    const rekening = await RekeningDetail.findById(rekeningId);
    if (!rekening) {
      return res.status(404).json({
        success: false,
        error: 'Rekening not found'
      });
    }

    // Create ProductPayment record
    const productPayment = new ProductPayment({
      productId: new mongoose.Types.ObjectId(productId),
      rekeningId: new mongoose.Types.ObjectId(rekeningId),
      amount,
      rekeningName: rekening.account, // e.g., "Rekening A"
      paymentMethod: paymentMethod || 'transfer',
      referenceNo,
      notes,
      status: 'pending',
      createdBy: userId
    });

    const savedPayment = await productPayment.save();
    console.log('✅ Payment recorded:', { paymentId: savedPayment._id, amount });

    // Create Cashflow entry (as expense)
    const cashflowData = {
      type: 'expense',
      category: `Pembayaran Produk ${product.noOrder || 'N/A'}`,
      amount: amount,
      description: `Pembayaran produk untuk ${product.nama || 'Customer'} (${product.noOrder})`,
      date: new Date(),
      reference: referenceNo || product.noOrder || 'N/A',
      account: rekening.account,
      paymentMethod: paymentMethod || 'transfer',
      createdBy: userId
    };

    const newCashflow = new Cashflow(cashflowData);
    const savedCashflow = await newCashflow.save();
    console.log('✅ Cashflow expense created:', { cashflowId: savedCashflow._id, amount });

    // Link cashflow to payment
    productPayment.cashflowId = savedCashflow._id;
    await productPayment.save();

    // Update Product status
    await Product.findByIdAndUpdate(productId, {
      sudahBayar: true,
      paymentDate: new Date(),
      rekeningId: rekeningId,
      lastModifiedBy: userId
    });

    console.log('✅ Product marked as paid');

    // Audit log
    await auditLog('CREATE_PRODUCT_PAYMENT', req.user.id, 'ProductPayment', savedPayment._id, {
      productId,
      amount,
      rekeningId
    }, req);

    res.status(201).json({
      success: true,
      data: {
        payment: savedPayment,
        cashflow: savedCashflow
      },
      message: 'Payment recorded successfully'
    });

  } catch (error) {
    console.error('❌ Error recording payment:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to record payment'
    });
  }
});

// Get payment by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const payment = await ProductPayment.findById(req.params.id)
      .populate('productId', 'noOrder nama nik bank harga')
      .populate('rekeningId', 'account namaBank nomorRekening')
      .populate('cashflowId')
      .populate('createdBy', 'username email')
      .populate('confirmedBy', 'username email');

    if (!payment) {
      return res.status(404).json({
        success: false,
        error: 'Payment not found'
      });
    }

    res.json({
      success: true,
      data: payment
    });

  } catch (error) {
    console.error('❌ Error fetching payment:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch payment'
    });
  }
});

// Get payments for product
router.get('/product/:productId', auth, async (req, res) => {
  try {
    const payments = await ProductPayment.find({
      productId: new mongoose.Types.ObjectId(req.params.productId)
    })
      .populate('rekeningId', 'account namaBank')
      .populate('createdBy', 'username email')
      .sort({ paymentDate: -1 });

    res.json({
      success: true,
      data: payments,
      count: payments.length
    });

  } catch (error) {
    console.error('❌ Error fetching payments:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch payments'
    });
  }
});

// Get all payments (with filters)
router.get('/', auth, async (req, res) => {
  try {
    const { status, rekeningId } = req.query;
    const userId = new mongoose.Types.ObjectId(req.user.id);

    let query = { createdBy: userId };
    if (status) query.status = status;
    if (rekeningId) query.rekeningId = new mongoose.Types.ObjectId(rekeningId);

    const payments = await ProductPayment.find(query)
      .populate('productId', 'noOrder nama harga')
      .populate('rekeningId', 'account namaBank')
      .populate('createdBy', 'username email')
      .sort({ paymentDate: -1 });

    res.json({
      success: true,
      data: payments,
      count: payments.length
    });

  } catch (error) {
    console.error('❌ Error fetching payments:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch payments'
    });
  }
});

// Confirm payment
router.post('/:id/confirm', auth, async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.id);

    const payment = await ProductPayment.findById(req.params.id);
    if (!payment) {
      return res.status(404).json({
        success: false,
        error: 'Payment not found'
      });
    }

    await payment.confirmPayment(userId);

    console.log('✅ Payment confirmed:', payment._id);

    // Audit log
    await auditLog('CONFIRM_PAYMENT', req.user.id, 'ProductPayment', payment._id, {
      productId: payment.productId,
      amount: payment.amount
    }, req);

    res.json({
      success: true,
      data: payment,
      message: 'Payment confirmed'
    });

  } catch (error) {
    console.error('❌ Error confirming payment:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to confirm payment'
    });
  }
});

// Reject payment
router.post('/:id/reject', auth, async (req, res) => {
  try {
    const payment = await ProductPayment.findById(req.params.id);
    if (!payment) {
      return res.status(404).json({
        success: false,
        error: 'Payment not found'
      });
    }

    await payment.rejectPayment();

    // Also delete associated cashflow if status was pending
    if (payment.cashflowId) {
      await Cashflow.findByIdAndDelete(payment.cashflowId);
      console.log('✅ Associated cashflow deleted');
    }

    // Reset product status
    await Product.findByIdAndUpdate(payment.productId, {
      sudahBayar: false,
      paymentDate: null
    });

    console.log('✅ Payment rejected:', payment._id);

    // Audit log
    await auditLog('REJECT_PAYMENT', req.user.id, 'ProductPayment', payment._id, {
      productId: payment.productId,
      amount: payment.amount
    }, req);

    res.json({
      success: true,
      data: payment,
      message: 'Payment rejected'
    });

  } catch (error) {
    console.error('❌ Error rejecting payment:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reject payment'
    });
  }
});

module.exports = router;
