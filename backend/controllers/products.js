const mongoose = require('mongoose');
const Product = require('../models/Product');
const Handphone = require('../models/Handphone');
const FieldStaff = require('../models/FieldStaff');
const { auditLog, securityLog } = require('../utils/audit');
const { validateProduct } = require('../utils/validation');
const { autoAssignHandphone, completeHandphoneAssignment } = require('../utils/handphoneAssignment');

// Get unique customer names for autocomplete
const getCustomers = async (req, res) => {
  console.log('[/api/products/customers] Route hit.');
  try {
    const { customerName } = req.query;
    const { codeAgen } = req.query;
    let query = {};

    if (customerName) {
      query.customer = new RegExp(customerName, 'i'); // Case-insensitive search
    }

    if (codeAgen) {
      query.codeAgen = new RegExp(codeAgen, 'i'); // Case-insensitive search
    }
    const products = await Product.findDecrypted(query);

    auditLog('READ', req.userId, 'Product', 'customer_filtered', {
      customerName: customerName || 'all',
      codeAgen: codeAgen || 'all',
      count: products.length
    }, req);

    res.json({ success: true, data: products });
  } catch (err) {
    console.error('[/api/products/customers] Error fetching products:', err);
    securityLog('PRODUCT_CUSTOMER_READ_FAILED', 'medium', {
      error: err.message,
      userId: req.userId,
      customerName: req.query.customerName,
      codeAgen: req.query.codeAgen
    }, req);
    res.status(500).json({ success: false, error: 'Failed to fetch products' });
  }
};

// Get products with complaints, filterable by codeAgen, nama, and noRek
const getComplaints = async (req, res) => {
  console.log('[/api/products/complaints] Route hit.');
  try {
    const { codeAgen, nama, noRek } = req.query;
    let query = { complaint: { $exists: true, $ne: null, $ne: '' } }; // Products with a non-empty complaint

    if (codeAgen) {
      query.codeAgen = new RegExp(codeAgen, 'i');
    }
    if (nama) {
      query.nama = new RegExp(nama, 'i');
    }
    if (noRek) {
      query.noRek = new RegExp(noRek, 'i');
    }

    const products = await Product.findDecrypted(query);

    auditLog('READ', req.userId, 'Product', 'complaints_filtered', {
      codeAgen: codeAgen || 'all',
      nama: nama || 'all',
      noRek: noRek || 'all',
      count: products.length
    }, req);

    res.json({ success: true, data: products });
  } catch (err) {
    console.error('[/api/products/complaints] Error fetching complaints:', err);
    securityLog('PRODUCT_COMPLAINTS_READ_FAILED', 'medium', {
      error: err.message,
      userId: req.userId,
      codeAgen: req.query.codeAgen,
      nama: req.query.nama,
      noRek: req.query.noRek
    }, req);
    res.status(500).json({ success: false, error: 'Failed to fetch complaints' });
  }
};

// Create product with handphone validation
const createProduct = async (req, res) => {
  try {
    const data = { ...req.body };

    // Handle file uploads
    if (req.files && req.files.uploadFotoId && req.files.uploadFotoId.length > 0) {
      data.uploadFotoId = req.files.uploadFotoId[0].filename;
    }
    if (req.files && req.files.uploadFotoSelfie && req.files.uploadFotoSelfie.length > 0) {
      data.uploadFotoSelfie = req.files.uploadFotoSelfie[0].filename;
    }

    // Add complaint field if present
    if (req.body.complaint) {
      data.complaint = req.body.complaint;
    }

    // Handle handphone assignment - manual selection or auto-assign
    let handphoneAssignment = null;
    if (data.handphoneId) {
      // Manual handphone selection
      try {
        const handphone = await Handphone.findById(data.handphoneId);
        if (!handphone) {
          return res.status(400).json({
            success: false,
            error: 'Handphone tidak ditemukan'
          });
        }

        // Allow handphones that are available or already assigned (for multiple product assignment)
        if (handphone.status !== 'available' && handphone.status !== 'assigned') {
          return res.status(400).json({
            success: false,
            error: 'Handphone sedang digunakan atau dalam maintenance'
          });
        }

        // For multiple product assignment, add complete assignment history entry
        handphone.assignmentHistory.push({
          product: null, // Will be set after product creation - temporary placeholder
          assignedAt: new Date(),
          assignedBy: req.userId,
          status: 'active'
        });

        // Temporarily set required fields to pass validation
        // We'll update with actual product ID after product creation
        const tempProductId = new mongoose.Types.ObjectId(); // Temporary ID
        handphone.assignmentHistory[handphone.assignmentHistory.length - 1].product = tempProductId;

        await handphone.save();

        handphoneAssignment = {
          handphoneId: handphone._id,
          handphone: `${handphone.merek} ${handphone.tipe}`,
          imei: handphone.imei,
          assignmentDate: new Date()
        };

      } catch (error) {
        return res.status(400).json({
          success: false,
          error: 'Gagal assign handphone: ' + error.message
        });
      }
    } else {
      // Auto-assign handphone based on fieldStaff (fallback)
      try {
        handphoneAssignment = await autoAssignHandphone(data, req.userId);
      } catch (assignmentError) {
        return res.status(400).json({
          success: false,
          error: assignmentError.message
        });
      }
    }

    // Set handphone data
    data.handphoneId = handphoneAssignment.handphoneId;
    data.handphone = handphoneAssignment.handphone;
    data.imeiHandphone = handphoneAssignment.imei;
    data.handphoneAssignmentDate = handphoneAssignment.assignmentDate;

    // Add audit fields
    data.createdBy = req.userId;
    data.lastModifiedBy = req.userId;

    const product = new Product(data);
    await product.save();

    // Update handphone assignment history with actual product reference
    if (handphoneAssignment) {
      const handphone = await Handphone.findById(handphoneAssignment.handphoneId);
      if (handphone && handphone.assignmentHistory.length > 0) {
        // Update the last assignment history entry with actual product ID
        const lastAssignment = handphone.assignmentHistory[handphone.assignmentHistory.length - 1];
        lastAssignment.product = product._id;
        await handphone.save();
      }
    }

    // Audit log
    auditLog('CREATE', req.userId, 'Product', product._id, {
      noOrder: data.noOrder,
      nama: data.nama,
      handphoneAssigned: handphoneAssignment ? handphoneAssignment.handphone : null
    }, req);

    // Return decrypted data with populated handphone
              const populatedProduct = await Product.findById(product._id).populate('handphoneId', 'merek tipe imei spesifikasi');
              res.status(201).json({ success: true, data: populatedProduct });

  } catch (err) {
    console.error('Product creation error:', err);
    securityLog('PRODUCT_CREATE_FAILED', 'low', {
      error: err.message,
      userId: req.userId
    }, req);

    res.status(500).json({
      success: false,
      error: 'Failed to create product'
    });
  }
};

// Get all products with decryption and handphone population
const getProducts = async (req, res) => {
  try {
    const products = await Product.find().populate('handphoneId', 'merek tipe imei spesifikasi');

    // Decrypt each product
    const decryptedProducts = products.map(product => product.getDecryptedData());

    // Audit log for data access
    auditLog('READ', req.userId, 'Product', 'all', {
      count: decryptedProducts.length
    }, req);

    res.json({
      success: true,
      count: decryptedProducts.length,
      data: decryptedProducts
    });

  } catch (err) {
    securityLog('PRODUCT_READ_FAILED', 'low', {
      error: err.message,
      userId: req.userId
    }, req);

    res.status(500).json({
      success: false,
      error: 'Failed to fetch products'
    });
  }
};

// Get product by id with decryption and handphone population
const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate('handphoneId', 'merek tipe imei spesifikasi');

    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }

    // Audit log
    auditLog('READ', req.userId, 'Product', req.params.id, {
      noOrder: product.noOrder,
      nama: product.nama
    }, req);

    res.json({
      success: true,
      data: product
    });

  } catch (err) {
    securityLog('PRODUCT_READ_FAILED', 'low', {
      error: err.message,
      productId: req.params.id,
      userId: req.userId
    }, req);

    res.status(500).json({
      success: false,
      error: 'Failed to fetch product'
    });
  }
};

// Update product with handphone validation and status change logic
const updateProduct = async (req, res) => {
  try {
    const data = { ...req.body };

    // Handle file uploads
    if (req.files && req.files.uploadFotoId) {
      data.uploadFotoId = req.files.uploadFotoId[0].filename;
    }
    if (req.files && req.files.uploadFotoSelfie) {
      data.uploadFotoSelfie = req.files.uploadFotoSelfie[0].filename;
    }

    // Add complaint field if present
    if (req.body.complaint) {
      data.complaint = req.body.complaint;
    }

    // Get current product to check status changes
    const currentProduct = await Product.findById(req.params.id);
    if (!currentProduct) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }

    // Validate handphone if handphoneId is being changed
    if (data.handphoneId && data.handphoneId !== currentProduct.handphoneId?.toString()) {
      const handphone = await Handphone.findById(data.handphoneId).populate('assignedTo');
      if (!handphone) {
        return res.status(400).json({
          success: false,
          error: 'Handphone not found'
        });
      }

      // Check if handphone is available or already assigned (for multiple product assignment)
      if (handphone.status !== 'available' && handphone.status !== 'assigned') {
        return res.status(400).json({
          success: false,
          error: 'Handphone is not available for assignment'
        });
      }

      // Check if handphone is assigned to the same fieldStaff
      if (data.fieldStaff && handphone.assignedTo.kodeOrlap !== data.fieldStaff) {
        return res.status(400).json({
          success: false,
          error: 'Handphone is not assigned to the same field staff'
        });
      }
    }

    // Handle status changes
    const oldStatus = currentProduct.status;
    const newStatus = data.status || oldStatus;

    // Add audit field
    data.lastModifiedBy = req.userId;

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      data,
      { new: true, runValidators: true }
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }

    // Handle status change logic
    if (newStatus !== oldStatus && newStatus === 'completed' && product.handphoneId) {
      // Complete handphone assignment when product is completed
      try {
        await completeHandphoneAssignment(product._id);
      } catch (error) {
        console.error('Error completing handphone assignment:', error);
        // Continue with update but log error
      }
    }

    // Audit log
    auditLog('UPDATE', req.userId, 'Product', req.params.id, {
      noOrder: data.noOrder,
      nama: data.nama
    }, req);

    // Return with populated handphone
    const populatedProduct = await Product.findById(product._id).populate('handphoneId', 'merek tipe imei spesifikasi');
    res.json({
      success: true,
      data: populatedProduct.getDecryptedData()
    });

  } catch (err) {
    securityLog('PRODUCT_UPDATE_FAILED', 'medium', {
      error: err.message,
      productId: req.params.id,
      userId: req.userId
    }, req);

    res.status(500).json({
      success: false,
      error: 'Failed to update product'
    });
  }
};

// Delete product with security checks
const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }

    // If product has assigned handphone, return it first
    if (product.handphoneId) {
      try {
        const handphone = await Handphone.findById(product.handphoneId);
        if (handphone && handphone.currentProduct) {
          // Update assignment history
          if (handphone.assignmentHistory.length > 0) {
            handphone.assignmentHistory[handphone.assignmentHistory.length - 1].returnedAt = new Date();
          }

          // Clear current product and set status to available
          handphone.currentProduct = null;
          handphone.status = 'available';
          await handphone.save();
        }
      } catch (error) {
        console.error('Error returning handphone during product deletion:', error);
        // Continue with deletion but log error
      }
    }

    await Product.findByIdAndDelete(req.params.id);

    // Audit log
    auditLog('DELETE', req.userId, 'Product', req.params.id, {
      noOrder: product.noOrder,
      nama: product.nama
    }, req);

    // Clean up uploaded files (logic from routes file)
    const path = require('path');
    const fs = require('fs');
    const uploadsDir = path.join(__dirname, '../uploads');

    if (product.uploadFotoId) {
      const filePath = path.join(uploadsDir, product.uploadFotoId);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    if (product.uploadFotoSelfie) {
      const filePath = path.join(uploadsDir, product.uploadFotoSelfie);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    res.json({
      success: true,
      message: 'Product deleted successfully'
    });

  } catch (err) {
    securityLog('PRODUCT_DELETE_FAILED', 'high', {
      error: err.message,
      productId: req.params.id,
      userId: req.userId
    }, req);

    res.status(500).json({
      success: false,
      error: 'Failed to delete product'
    });
  }
};

module.exports = {
  getCustomers,
  getComplaints,
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct
};