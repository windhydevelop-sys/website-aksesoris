const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const auth = require('../middleware/auth');
const { requireRole } = auth;
const { logActivity } = require('../utils/audit');

// Get all orders
router.get('/', auth, async (req, res) => {
  try {
    const orders = await Order.find()
      .populate('createdBy', 'username')
      .populate('lastModifiedBy', 'username')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: orders
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch orders'
    });
  }
});

// Get order by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('createdBy', 'username')
      .populate('lastModifiedBy', 'username');

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }

    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch order'
    });
  }
});

// Create new order
router.post('/', auth, async (req, res) => {
  try {
    const { noOrder, customer, fieldStaff, status, notes, totalAmount } = req.body;

    // Validate required fields
    if (!noOrder || !customer || !fieldStaff) {
      return res.status(400).json({
        success: false,
        error: 'No Order, Customer, and Field Staff are required'
      });
    }

    const newOrder = new Order({
      noOrder: noOrder.trim(),
      customer: customer.trim(),
      fieldStaff: fieldStaff.trim(),
      status: status || 'pending',
      notes: notes?.trim(),
      totalAmount: totalAmount || 0,
      createdBy: req.user.userId
    });

    const savedOrder = await newOrder.save();

    // Log activity
    await logActivity(
      req.user.userId,
      'CREATE_ORDER',
      `Created order ${noOrder}`,
      { orderId: savedOrder._id }
    );

    const populatedOrder = await Order.findById(savedOrder._id)
      .populate('createdBy', 'username');

    res.status(201).json({
      success: true,
      data: populatedOrder,
      message: 'Order created successfully'
    });
  } catch (error) {
    console.error('Error creating order:', error);

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: 'No Order already exists'
      });
    }

    if (error.statusCode === 400) {
      return res.status(error.statusCode).json({
        success: false,
        error: error.message
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to create order'
    });
  }
});

// Update order
router.put('/:id', auth, async (req, res) => {
  try {
    const { noOrder, customer, fieldStaff, status, notes, totalAmount } = req.body;

    const updateData = {
      lastModifiedBy: req.user.userId
    };

    if (noOrder !== undefined) updateData.noOrder = noOrder.trim();
    if (customer !== undefined) updateData.customer = customer.trim();
    if (fieldStaff !== undefined) updateData.fieldStaff = fieldStaff.trim();
    if (status !== undefined) updateData.status = status;
    if (notes !== undefined) updateData.notes = notes?.trim();
    if (totalAmount !== undefined) updateData.totalAmount = totalAmount;

    const updatedOrder = await Order.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('createdBy', 'username')
     .populate('lastModifiedBy', 'username');

    if (!updatedOrder) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }

    // Log activity
    await logActivity(
      req.user.userId,
      'UPDATE_ORDER',
      `Updated order ${updatedOrder.noOrder}`,
      { orderId: updatedOrder._id }
    );

    res.json({
      success: true,
      data: updatedOrder,
      message: 'Order updated successfully'
    });
  } catch (error) {
    console.error('Error updating order:', error);

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: 'No Order already exists'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to update order'
    });
  }
});

// Delete order
router.delete('/:id', auth, requireRole(['admin']), async (req, res) => {
  try {
    const deletedOrder = await Order.findByIdAndDelete(req.params.id);

    if (!deletedOrder) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }

    // Log activity
    await logActivity(
      req.user.userId,
      'DELETE_ORDER',
      `Deleted order ${deletedOrder.noOrder}`,
      { orderId: deletedOrder._id }
    );

    res.json({
      success: true,
      message: 'Order deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting order:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete order'
    });
  }
});

// Get orders by status
router.get('/status/:status', auth, async (req, res) => {
  try {
    const { status } = req.params;
    const orders = await Order.find({ status })
      .populate('createdBy', 'username')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: orders
    });
  } catch (error) {
    console.error('Error fetching orders by status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch orders'
    });
  }
});

module.exports = router;