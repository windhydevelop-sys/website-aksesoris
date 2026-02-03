const mongoose = require('mongoose');
const Product = require('../models/Product');
const Order = require('../models/Order');
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

// Create product with phone validation
const createProduct = async (req, res) => {
  console.log('[/api/products] createProduct function called.');
  console.log('Request body:', req.body);
  console.error('Before Product creation - data.customer:', req.body.customer); // New log
  console.error('Before Product creation - data object:', req.body); // New log
  try {
    console.log('DEBUG: Starting product validation');
    // Validate product data using Joi schema directly
    const { productSchema } = require('../utils/validation');
    const { error, value } = productSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
    console.log('DEBUG: Validation result:', error ? 'FAILED' : 'PASSED');
    if (error) {
      const errors = error.details.map(detail => detail.message);
      console.log('DEBUG: Validation errors:', errors);
      return res.status(400).json({ success: false, error: 'Validation failed', details: errors });
    }
    console.log('DEBUG: Validation passed, proceeding to data processing');

    // Handle file uploads
    const data = { ...req.body };
    if (req.files && req.files.uploadFotoId) {
      data.uploadFotoId = req.files.uploadFotoId[0].filename;
    }
    if (req.files && req.files.uploadFotoSelfie) {
      data.uploadFotoSelfie = req.files.uploadFotoSelfie[0].filename;
    }

    // Add security fields
    data.createdBy = req.userId;
    data.lastModifiedBy = req.userId;

    // Assign phone (auto or manual) - OPTIONAL
    console.log('DEBUG: Starting phone assignment logic (optional)');
    console.log('DEBUG: data.handphoneId:', data.handphoneId);

    let phone = null;
    try {
      if (data.handphoneId) {
        console.log('DEBUG: Manual phone assignment - looking up phone');
        phone = await Handphone.findById(data.handphoneId);
        console.log('DEBUG: Phone found:', phone ? 'YES' : 'NO');
        if (!phone) {
          console.log('DEBUG: Phone not found, skipping assignment');
        } else {
          // Persist correct field name in product document
          data.handphoneId = phone._id;
        }
      } else if (data.codeAgen) {
        console.log('DEBUG: Auto phone assignment attempt');
        // Attempt auto assignment; if none available, continue without assignment
        const assigned = await autoAssignHandphone(data.codeAgen);
        if (assigned && assigned._id) {
          phone = assigned;
          data.handphoneId = assigned._id;
        } else {
          console.log('DEBUG: No phone assigned automatically, proceeding without handphone');
        }
      } else {
        console.log('DEBUG: No codeAgen provided, skipping auto assignment');
      }
    } catch (assignErr) {
      console.log('DEBUG: Phone assignment error, proceeding without handphone:', assignErr.message);
    }
    console.log('DEBUG: Phone assignment completed, handphoneId:', data.handphoneId || 'NONE');

    // Create product document
    const product = new Product(data);
    await product.save();
    console.error('After Product save - stored customer data:', product.customer); // Log to verify customer storage

    // Update phone data only if a phone was assigned
    if (phone) {
      console.log('DEBUG: Before phone update:', {
        phoneId: phone._id,
        currentProduct: phone.currentProduct,
        assignedProducts: phone.assignedProducts,
        status: phone.status
      });

      phone.currentProduct = product._id;
      phone.status = 'in_use';
      if (!phone.assignedProducts.includes(product._id)) {
        phone.assignedProducts.push(product._id);
      }

      console.log('DEBUG: After phone update:', {
        phoneId: phone._id,
        currentProduct: phone.currentProduct,
        assignedProducts: phone.assignedProducts,
        status: phone.status
      });

      await phone.save();
      console.log('DEBUG: Phone saved successfully');
    } else {
      console.log('DEBUG: No phone assigned, skipping phone update');
    }

    // Audit log
    auditLog('CREATE', req.userId, 'Product', product._id, {
      noOrder: product.noOrder,
      nama: product.nama,
      handphoneId: product.handphoneId
    }, req);

    // Return decrypted product with populated phone
    const populatedProduct = await Product.findById(product._id).populate('handphoneId', 'merek tipe imei');
    res.status(201).json({
      success: true,
      data: populatedProduct.getDecryptedData(),
      message: 'Product created and assigned to phone successfully'
    });
  } catch (err) {
    console.error('[/api/products] Error creating product:', err);
    securityLog('PRODUCT_CREATE_FAILED', 'medium', {
      error: err.message,
      userId: req.userId,
      data: req.body
    }, req);
    res.status(500).json({ success: false, error: 'Failed to create product' });
  }
};

// Get all products with decryption and phone population
const getProducts = async (req, res) => {
  try {
    // Use populate directly in the find query
    const products = await Product.find().populate('handphoneId', 'merek tipe imei spesifikasi kepemilikan');

    // Decrypt each product while preserving populated fields
    console.log('DEBUG: Starting products processing, found', products.length, 'products');
    const decryptedProducts = await Promise.all(products.map(async (product, index) => {
      console.log('DEBUG: Processing product', index + 1, 'with noOrder:', product.noOrder);
      const decrypted = product.getDecryptedData();

      // Ensure phoneId remains populated
      if (product.handphoneId && typeof product.handphoneId === 'object') {
        decrypted.handphoneId = product.handphoneId;
      }

      // Add order status
      if (product.noOrder) {
        try {
          console.log('DEBUG: Looking for order with noOrder:', product.noOrder);
          const order = await Order.findOne({ noOrder: product.noOrder });
          console.log('DEBUG: Found order:', order ? 'YES' : 'NO', 'Status:', order ? order.status : 'N/A');
          // If order exists, use its status, otherwise fallback to product's own status
          decrypted.status = order ? order.status : (product.status || 'pending');
        } catch (error) {
          console.error('Error fetching order status for product:', product._id, error);
          decrypted.status = product.status || 'pending';
        }
      } else {
        console.log('DEBUG: Product has no noOrder field, using product status');
        decrypted.status = product.status || 'pending';
      }

      console.log('DEBUG: Final status for product', index + 1, ':', decrypted.status);
      return decrypted;
    }));

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

// Get product by id with decryption and phone population
const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate('handphoneId', 'merek tipe imei spesifikasi kepemilikan');
    console.log('ProductDetail - Product found:', product);
    console.log('ProductDetail - PhoneId:', product.phoneId);

    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }

    // Get order status by matching noOrder
    let orderStatus = null;
    if (product.noOrder) {
      try {
        const order = await Order.findOne({ noOrder: product.noOrder });
        orderStatus = order ? order.status : null;
        console.log('ProductDetail - Order found:', order ? 'YES' : 'NO', 'Status:', orderStatus);
      } catch (error) {
        console.error('Error fetching order status:', error);
        orderStatus = null;
      }
    }

    // Audit log
    auditLog('READ', req.userId, 'Product', req.params.id, {
      noOrder: product.noOrder,
      nama: product.nama,
      orderStatus: orderStatus
    }, req);

    const decryptedData = product.getDecryptedData();

    // Add order status to the response
    decryptedData.status = orderStatus;

    res.json({
      success: true,
      data: decryptedData
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

// Update product with phone validation and status change logic
const updateProduct = async (req, res) => {
  try {
    const data = { ...req.body };

    // Debug: Log incoming request body
    console.log('Product update - Raw request body:', JSON.stringify(req.body, null, 2));

    // Fix array values from frontend autocomplete
    if (Array.isArray(data.noOrder)) {
      console.log('Converting noOrder array:', data.noOrder, '->', data.noOrder[0] || '');
      data.noOrder = data.noOrder[0] || '';
    }
    if (Array.isArray(data.codeAgen)) {
      console.log('Converting codeAgen array:', data.codeAgen, '->', data.codeAgen[0] || '');
      data.codeAgen = data.codeAgen[0] || '';
    }

    console.log('Product update - Processed data:', JSON.stringify(data, null, 2));

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

    // Validate phone if phoneId is being changed
    if (data.phoneId && data.phoneId !== currentProduct.phoneId?.toString()) {
      // Handle old phone: mark as returned and remove product from its assignedProducts
      if (currentProduct.phoneId) {
        const oldPhone = await Handphone.findById(currentProduct.phoneId);
        if (oldPhone) {
          // Update assignment history for the old phone
          const oldAssignment = oldPhone.assignmentHistory.find(
            (assignment) => assignment.product && assignment.product.toString() === req.params.id
          );
          if (oldAssignment) {
            oldAssignment.returnedAt = new Date();
            oldAssignment.status = 'returned';
          }

          // Remove product from assignedProducts
          oldPhone.assignedProducts = oldPhone.assignedProducts.filter(
            (p) => p.toString() !== req.params.id
          );

          // If no other products are assigned, set status to available
          if (oldPhone.assignedProducts.length === 0) {
            oldPhone.status = 'available';
          }
          await oldPhone.save();
        }
      }

      const newPhone = await Handphone.findById(data.phoneId).populate('assignedTo');
      if (!newPhone) {
        return res.status(400).json({
          success: false,
          error: 'Phone not found'
        });
      }

      // Check if phone is available or already assigned (for multiple product assignment)
      if (newPhone.status !== 'available' && newPhone.status !== 'assigned') {
        return res.status(400).json({
          success: false,
          error: 'Phone is not available for assignment'
        });
      }

      // Check if phone is assigned to the same fieldStaff
      const fieldStaffDoc = await FieldStaff.findOne({ kodeOrlap: data.fieldStaff });
      if (!fieldStaffDoc) {
        return res.status(400).json({
          success: false,
          error: 'Field staff not found'
        });
      }
      if (newPhone.assignedTo.toString() !== fieldStaffDoc._id.toString()) {
        return res.status(400).json({
          success: false,
          error: 'Phone is not assigned to the same field staff'
        });
      }

      // Handle new phone: add product to its assignedProducts and assignmentHistory
      newPhone.assignedProducts.push(req.params.id);
      newPhone.assignmentHistory.push({
        product: req.params.id,
        assignedAt: new Date(),
        assignedBy: req.userId,
        status: 'active',
      });
      newPhone.status = 'assigned';
      await newPhone.save();
    }

    // Add audit field
    data.lastModifiedBy = req.userId;

    // Debug: Log the data being sent to MongoDB
    console.log('Product update - Final data to be saved:', JSON.stringify(data, null, 2));

    // Remove invalid fields (no longer in Product model)
    delete data.status;
    delete data.harga;

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      data,
      { new: true, runValidators: false }
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }

    // Audit log
    auditLog('UPDATE', req.userId, 'Product', req.params.id, {
      noOrder: data.noOrder,
      nama: data.nama
    }, req);

    // Return with populated phone
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

    // If product has assigned phone, return it first
    if (product.phoneId) {
      try {
        const phone = await Handphone.findById(product.phoneId);
        if (phone && phone.currentProduct) {
          // Update assignment history
          if (phone.assignmentHistory.length > 0) {
            phone.assignmentHistory[phone.assignmentHistory.length - 1].returnedAt = new Date();
          }

          // Clear current product and set status to available
          phone.currentProduct = null;
          phone.status = 'available';
          await phone.save();
        }
      } catch (error) {
        console.error('Error returning phone during product deletion:', error);
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

// Export all products with decrypted data and base64 images for PDF generation
const getProductsExport = async (req, res) => {
  try {
    console.log('Starting product export...');

    // Get decrypted products
    let products = [];
    try {
      products = await Product.findDecrypted({});
      console.log(`Found ${products.length} decrypted products`);
    } catch (decryptError) {
      console.error('Error in decryption, falling back to raw products:', decryptError.message);
      products = await Product.find({});
      console.log(`Found ${products.length} raw products (decryption failed)`);
    }

    // Populate phone data for each product
    let populatedProducts = [];
    try {
      populatedProducts = await Product.populate(products, {
        path: 'phoneId',
        select: 'merek tipe imei spesifikasi kepemilikan assignedTo',
        populate: {
          path: 'assignedTo',
          select: 'kodeOrlap namaOrlap'
        }
      });
      console.log('Phone data populated successfully');
    } catch (populateError) {
      console.error('Error in populate, using products without populate:', populateError.message);
      populatedProducts = products;
    }

    // Convert images to base64 for PDF inclusion
    const fs = require('fs');
    const path = require('path');
    const uploadsDir = path.join(__dirname, '../uploads');
    console.log('Uploads directory:', uploadsDir);

    const productsWithImages = await Promise.all(populatedProducts.map(async (product, index) => {
      const productWithImages = { ...product };
      console.log(`Processing product ${index + 1}/${populatedProducts.length}: ${product.noOrder || product._id}`);

      // Convert KTP photo to base64
      if (product.uploadFotoId) {
        try {
          const ktpPath = path.join(uploadsDir, product.uploadFotoId);
          console.log(`Converting KTP image: ${ktpPath}`);

          if (fs.existsSync(ktpPath)) {
            const stats = fs.statSync(ktpPath);
            console.log(`KTP file size: ${stats.size} bytes`);

            if (stats.size > 10 * 1024 * 1024) { // 10MB limit
              console.warn(`KTP file too large: ${stats.size} bytes`);
            } else {
              const imageBuffer = fs.readFileSync(ktpPath);
              const base64Image = imageBuffer.toString('base64');
              const mimeType = path.extname(product.uploadFotoId).toLowerCase() === '.png' ? 'image/png' : 'image/jpeg';
              productWithImages.uploadFotoIdBase64 = `data:${mimeType};base64,${base64Image}`;
              console.log(`KTP image converted successfully, base64 length: ${base64Image.length}`);
            }
          } else {
            console.warn(`KTP file not found: ${ktpPath}`);
          }
        } catch (error) {
          console.error('Error converting KTP image to base64:', error.message);
        }
      }

      // Convert Selfie photo to base64
      if (product.uploadFotoSelfie) {
        try {
          const selfiePath = path.join(uploadsDir, product.uploadFotoSelfie);
          console.log(`Converting Selfie image: ${selfiePath}`);

          if (fs.existsSync(selfiePath)) {
            const stats = fs.statSync(selfiePath);
            console.log(`Selfie file size: ${stats.size} bytes`);

            if (stats.size > 10 * 1024 * 1024) { // 10MB limit
              console.warn(`Selfie file too large: ${stats.size} bytes`);
            } else {
              const imageBuffer = fs.readFileSync(selfiePath);

              // Check if it's actually a valid image by checking magic bytes
              const magicBytes = imageBuffer.slice(0, 4);
              console.log(`Selfie magic bytes: ${magicBytes.toString('hex')}`);

              // Detect MIME type from magic bytes
              let mimeType = 'image/jpeg'; // default
              if (magicBytes[0] === 0xFF && magicBytes[1] === 0xD8) {
                mimeType = 'image/jpeg';
              } else if (magicBytes[0] === 0x89 && magicBytes[1] === 0x50 &&
                magicBytes[2] === 0x4E && magicBytes[3] === 0x47) {
                mimeType = 'image/png';
              } else if (magicBytes[0] === 0x47 && magicBytes[1] === 0x49 &&
                magicBytes[2] === 0x46 && magicBytes[3] === 0x38) {
                mimeType = 'image/gif';
              } else if (magicBytes[0] === 0x42 && magicBytes[1] === 0x4D) {
                mimeType = 'image/bmp';
              } else if (magicBytes[0] === 0x52 && magicBytes[1] === 0x49 &&
                magicBytes[2] === 0x46 && magicBytes[3] === 0x46) {
                // Check for WebP
                if (magicBytes[8] === 0x57 && magicBytes[9] === 0x45 &&
                  magicBytes[10] === 0x42 && magicBytes[11] === 0x50) {
                  mimeType = 'image/webp';
                }
              }

              console.log(`Detected MIME type: ${mimeType}`);

              const base64Image = imageBuffer.toString('base64');
              productWithImages.uploadFotoSelfieBase64 = `data:${mimeType};base64,${base64Image}`;
              console.log(`Selfie image converted successfully, base64 length: ${base64Image.length}, MIME: ${mimeType}`);
            }
          } else {
            console.warn(`Selfie file not found: ${selfiePath}`);
          }
        } catch (error) {
          console.error('Error converting Selfie image to base64:', error.message);
        }
      }

      return productWithImages;
    }));

    console.log(`Successfully processed ${productsWithImages.length} products with images`);

    // Audit log for export
    auditLog('EXPORT', req.userId, 'Product', 'pdf_export', {
      count: productsWithImages.length,
      exportType: 'complete_data_with_images'
    }, req);

    res.json({
      success: true,
      data: productsWithImages,
      count: productsWithImages.length
    });

  } catch (err) {
    console.error('PRODUCT EXPORT ERROR:', err);
    securityLog('PRODUCT_EXPORT_FAILED', 'medium', {
      error: err.message,
      stack: err.stack,
      userId: req.userId
    }, req);

    res.status(500).json({
      success: false,
      error: 'Failed to export products: ' + err.message
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
  deleteProduct,
  getProductsExport
};
