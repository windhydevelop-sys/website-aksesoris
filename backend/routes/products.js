const express = require('express');
console.log('Loading products router...');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Product = require('../models/Product');
const auth = require('../middleware/auth');
const { validateProduct } = require('../utils/validation');
const { auditLog, securityLog } = require('../utils/audit');
const { processPDFFile, validateExtractedData } = require('../utils/pdfParser');
const {
  getCustomers,
  getComplaints,
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct
} = require('../controllers/products');

const router = express.Router();

// Middleware to add user info to request
const addUserInfo = (req, res, next) => {
  req.userId = req.user ? req.user.id : null;
  next();
};

router.use((req, res, next) => {
  console.log(`Products router: Incoming request to ${req.method} ${req.originalUrl}`);
  next();
});

// Get unique customer names for autocomplete
router.get('/customers', auth, addUserInfo, getCustomers);

// Get products with complaints, filterable by codeAgen, nama, and noRek
router.get('/complaints', auth, addUserInfo, getComplaints);

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Secure file upload configuration
const fileFilter = (req, file, cb) => {
  // For document import endpoints, allow document formats
  const isDocumentEndpoint = req.originalUrl.includes('/import-');

  if (isDocumentEndpoint) {
    // Allow document formats for import
    const allowedDocTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
      'application/msword', // .doc (legacy)
      'application/vnd.ms-excel', // .xls
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'text/csv',
      'application/csv'
    ];

    const maxDocSize = 10 * 1024 * 1024; // 10MB for documents

    if (!allowedDocTypes.includes(file.mimetype)) {
      securityLog('INVALID_DOCUMENT_TYPE', 'medium', {
        filename: file.originalname,
        mimetype: file.mimetype,
        allowedTypes: allowedDocTypes
      }, req);
      return cb(new Error(`Document type not allowed. Allowed: PDF, Word (.docx), Excel (.xlsx), CSV`), false);
    }

    if (file.size > maxDocSize) {
      securityLog('DOCUMENT_TOO_LARGE', 'low', {
        filename: file.originalname,
        size: file.size,
        maxSize: maxDocSize
      }, req);
      return cb(new Error(`Document too large. Maximum size: ${maxDocSize / 1024 / 1024}MB`), false);
    }
  } else {
    // For image uploads, use original validation
    const allowedTypes = (process.env.ALLOWED_FILE_TYPES || 'image/jpeg,image/png,image/jpg').split(',');
    const maxSize = parseInt(process.env.MAX_FILE_SIZE) || 5242880; // 5MB default

    if (!allowedTypes.includes(file.mimetype)) {
      console.log('Detected MIME type:', file.mimetype); // Debug log
      securityLog('INVALID_FILE_TYPE', 'medium', {
        filename: file.originalname,
        mimetype: file.mimetype,
        allowedTypes
      }, req);
      return cb(new Error(`File type not allowed. Allowed types: ${allowedTypes.join(', ')}`), false);
    }

    if (file.size > maxSize) {
      securityLog('FILE_TOO_LARGE', 'low', {
        filename: file.originalname,
        size: file.size,
        maxSize
      }, req);
      return cb(new Error(`File too large. Maximum size: ${maxSize / 1024 / 1024}MB`), false);
    }
  }

  cb(null, true);
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    // Generate secure filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `secure_${uniqueSuffix}${ext}`);
  }
});

// Create separate upload middleware for optional files
const uploadOptional = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5242880, // 5MB
    files: 2 // Maximum 2 files per request
  }
}).fields([{ name: 'uploadFotoId', maxCount: 1 }, { name: 'uploadFotoSelfie', maxCount: 1 }]);

// Middleware to handle optional file uploads
const handleFileUpload = (req, res, next) => {
  // Only process multipart/form-data requests
  if (req.headers['content-type'] && req.headers['content-type'].includes('multipart/form-data')) {
    uploadOptional(req, res, (err) => {
      if (err) {
        return next(err);
      }
      // Ensure req.files exists even if no files uploaded
      req.files = req.files || {};
      next();
    });
  } else {
    // For JSON requests, skip file processing
    req.files = {};
    next();
  }
};

// PDF upload configuration
const pdfFileFilter = (req, file, cb) => {
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    securityLog('INVALID_PDF_FILE_TYPE', 'medium', {
      filename: file.originalname,
      mimetype: file.mimetype
    }, req);
    cb(new Error('Only PDF files are allowed for import'), false);
  }
};

const pdfUpload = multer({
  storage,
  fileFilter: pdfFileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB for PDF files
    files: 1 // Only 1 PDF file per request
  }
}).single('pdfFile');

// Create product with validation and security
router.post('/',
  addUserInfo,
  handleFileUpload,
  validateProduct,
  createProduct
);

// Get all products with decryption
router.get('/', addUserInfo, getProducts);

// Get product by id with decryption
router.get('/:id', addUserInfo, getProductById);

// Update product with validation and security
router.put('/:id',
  addUserInfo,
  handleFileUpload,
  validateProduct,
  updateProduct
);

// Delete product with security checks
router.delete('/:id', addUserInfo, deleteProduct);

// Generic Document Import endpoint - Preview data without saving
router.post('/import-document',
  addUserInfo,
  (req, res, next) => {
    // Use the document upload configuration for all supported formats
    const documentUpload = multer({
      storage,
      fileFilter,
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB for documents
        files: 1
      }
    }).single('documentFile');

    documentUpload(req, res, (err) => {
      if (err) {
        return res.status(400).json({
          success: false,
          error: err.message
        });
      }
      next();
    });
  },
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: 'No document file uploaded'
        });
      }

      const documentFilePath = req.file.path;
      const originalFilename = req.file.originalname;
      const fileExtension = path.extname(originalFilename).toLowerCase();

      // Process document file (supports PDF, Word, Excel, CSV)
      const result = await processPDFFile(documentFilePath);

      if (!result.success) {
        // Clean up uploaded file
        if (fs.existsSync(documentFilePath)) {
          fs.unlinkSync(documentFilePath);
        }

        return res.status(400).json({
          success: false,
          error: 'Failed to process document file',
          details: result.error
        });
      }

      // Validate extracted data
      const validation = validateExtractedData(result.products);

      // Clean up uploaded file
      if (fs.existsSync(documentFilePath)) {
        fs.unlinkSync(documentFilePath);
      }

      // Determine document type for logging
      const docType = fileExtension === '.pdf' ? 'PDF' :
                     fileExtension === '.docx' ? 'Word' :
                     fileExtension === '.xlsx' || fileExtension === '.xls' ? 'Excel' :
                     fileExtension === '.csv' ? 'CSV' : 'Document';

      // Audit log
      auditLog('DOCUMENT_IMPORT_PREVIEW', req.userId, 'Product', null, {
        filename: originalFilename,
        documentType: docType,
        extractedProducts: result.products.length,
        validProducts: validation.validProducts.length,
        invalidProducts: validation.errors.length
      }, req);

      res.json({
        success: true,
        message: `${docType} processed successfully`,
        data: {
          filename: originalFilename,
          documentType: docType,
          textPreview: result.textPreview,
          extractedData: validation.validProducts,
          validation: {
            total: validation.summary.total,
            valid: validation.summary.valid,
            invalid: validation.summary.invalid,
            errors: validation.errors
          }
        }
      });

    } catch (err) {
      // Clean up uploaded file on error
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }

      securityLog('DOCUMENT_IMPORT_FAILED', 'medium', {
        error: err.message,
        filename: req.file?.originalname,
        userId: req.userId
      }, req);

      res.status(500).json({
        success: false,
        error: 'Failed to import document'
      });
    }
  });

// Document Import with data saving endpoint
router.post('/import-document-save',
  addUserInfo,
  (req, res, next) => {
    pdfUpload(req, res, (err) => {
      if (err) {
        return res.status(400).json({
          success: false,
          error: err.message
        });
      }
      next();
    });
  },
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: 'No PDF file uploaded'
        });
      }

      const pdfFilePath = req.file.path;
      const originalFilename = req.file.originalname;

      // Process PDF file
      const result = await processPDFFile(pdfFilePath);

      if (!result.success) {
        // Clean up uploaded file
        if (fs.existsSync(pdfFilePath)) {
          fs.unlinkSync(pdfFilePath);
        }

        return res.status(400).json({
          success: false,
          error: 'Failed to process PDF file',
          details: result.error
        });
      }

      // Validate extracted data
      const validation = validateExtractedData(result.products);

      // Save valid products to database
      const savedProducts = [];
      const saveErrors = [];

      for (const productData of validation.validProducts) {
        try {
          // Add audit fields
          productData.createdBy = req.userId;
          productData.lastModifiedBy = req.userId;

          const product = new Product(productData);
          await product.save();
          savedProducts.push(product.getDecryptedData());

          // Audit log for each saved product
          auditLog('CREATE', req.userId, 'Product', product._id, {
            source: 'PDF_IMPORT',
            filename: originalFilename,
            nama: productData.nama
          }, req);

        } catch (saveError) {
          saveErrors.push({
            data: productData,
            error: saveError.message
          });
        }
      }

      // Clean up uploaded file
      if (fs.existsSync(pdfFilePath)) {
        fs.unlinkSync(pdfFilePath);
      }

      // Audit log for import operation
      auditLog('PDF_IMPORT_SAVE', req.userId, 'Product', null, {
        filename: originalFilename,
        totalExtracted: result.products.length,
        validProducts: validation.validProducts.length,
        savedProducts: savedProducts.length,
        saveErrors: saveErrors.length
      }, req);

      res.json({
        success: true,
        message: `PDF import completed. ${savedProducts.length} products saved successfully.`,
        data: {
          filename: originalFilename,
          savedProducts,
          summary: {
            extracted: result.products.length,
            valid: validation.validProducts.length,
            saved: savedProducts.length,
            errors: saveErrors.length
          },
          errors: saveErrors.length > 0 ? saveErrors : undefined
        }
      });

    } catch (err) {
      // Clean up uploaded file on error
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }

      securityLog('PDF_IMPORT_SAVE_FAILED', 'high', {
        error: err.message,
        filename: req.file?.originalname,
        userId: req.userId
      }, req);

      res.status(500).json({
        success: false,
        error: 'Failed to import and save PDF data'
      });
    }
});

module.exports = router;