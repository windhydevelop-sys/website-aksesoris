const fs = require('fs');
const path = require('path');
const { parseDocument } = require('./documentParser');
const { logger } = require('./audit');

// Try to load pdf-parse, but make it optional for environments that don't support it
let pdfParse = null;
try {
  pdfParse = require('pdf-parse');
  logger.info('pdf-parse library loaded successfully');
} catch (error) {
  logger.warn('pdf-parse library not available in this environment:', error.message);
  logger.warn('PDF parsing will use fallback methods only');
}

/**
 * PDF Parser Utility for extracting product data from PDF files
 */

// Extract text content from PDF buffer using multiple fallback methods
const extractTextFromPDF = async (pdfBuffer) => {
  try {
    // Method 1: Try pdf-parse (most reliable for text extraction) - only if available
    if (pdfParse) {
      try {
        const data = await pdfParse(pdfBuffer);
        if (data && data.text && data.text.trim().length > 0) {
          logger.info('PDF text extracted successfully using pdf-parse');
          return data.text;
        }
      } catch (pdfParseError) {
        logger.warn('pdf-parse failed, trying alternative methods:', pdfParseError.message);
      }
    } else {
      logger.warn('pdf-parse not available, using fallback methods only');
    }

    // Method 2: Try basic text extraction from buffer (fallback)
    // This is a very basic approach - in production you'd want a more robust solution
    const bufferString = pdfBuffer.toString('utf8', 0, Math.min(10000, pdfBuffer.length));

    // Look for common text patterns in PDFs
    const textMatches = bufferString.match(/BT[\s\S]*?ET/g) || [];
    let extractedText = '';

    for (const match of textMatches) {
      // Basic text extraction from PDF text objects
      const textContent = match.replace(/BT|ET/g, '').trim();
      if (textContent.length > 0) {
        extractedText += textContent + ' ';
      }
    }

    if (extractedText.trim().length > 10) {
      logger.info('PDF text extracted using basic buffer parsing');
      return extractedText;
    }

    // Method 3: Return a helpful message if no text can be extracted
    logger.warn('Could not extract text from PDF using available methods');
    return 'PDF text extraction not available. Please use manual data entry or ensure the PDF contains extractable text.';

  } catch (error) {
    logger.error('PDF text extraction failed:', error);
    return 'PDF processing error. Please try manual data entry.';
  }
};

// Parse product data from extracted text
const parseProductData = (text) => {
  const products = [];
  const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);

  logger.info('Parsing PDF text', { totalLines: lines.length });

  // More precise patterns for financial data extraction
  const patterns = {
    nik: /(?:^|\n)\s*NIK[\s:]*([0-9]{16})(?:\s|$|\n)/i,
    nama: /(?:^|\n)\s*Nama[\s:]*([A-Za-z\s]+?)(?:\n|$)/i,
    namaIbuKandung: /(?:^|\n)\s*Nama Ibu Kandung[\s:]*([A-Za-z\s]+?)(?:\n|$)/i,
    tempatTanggalLahir: /(?:^|\n)\s*Tempat.*Lahir[\s:]*([A-Za-z\s,0-9]+?)(?:\n|$)/i,
    noRek: /(?:^|\n)\s*No.*Rekening[\s:]*([0-9]{10,18})(?:\s|$|\n)/i,
    noAtm: /(?:^|\n)\s*No.*ATM[\s:]*([0-9]{16})(?:\s|$|\n)/i,
    validThru: /(?:^|\n)\s*Valid.*Thru[\s:]*([0-9\/\-]+)(?:\s|$|\n)/i,
    noHp: /(?:^|\n)\s*No.*HP[\s:]*([0-9+\-\s]+?)(?:\n|$)/i,
    pinAtm: /(?:^|\n)\s*PIN.*ATM[\s:]*([0-9]{4,6})(?:\s|$|\n)/i,
    pinWondr: /(?:^|\n)\s*PIN.*Wondr[\s:]*([0-9]{4,6})(?:\s|$|\n)/i,
    email: /(?:^|\n)\s*Email[\s:]*([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})(?:\s|$|\n)/i,
    bank: /(?:^|\n)\s*Bank[\s:]*([A-Za-z\s]+?)(?:\n|$)/i,
    grade: /(?:^|\n)\s*Grade[\s:]*([A-Za-z0-9\s]+?)(?:\n|$)/i,
    kcp: /(?:^|\n)\s*KCP[\s:]*([A-Za-z0-9\s\-]+?)(?:\n|$)/i,
    noOrder: /(?:^|\n)\s*No.*Order[\s:]*([A-Za-z0-9\-]+)(?:\s|$|\n)/i,
    codeAgen: /(?:^|\n)\s*Code.*Agen[\s:]*([A-Za-z0-9\-]+)(?:\s|$|\n)/i,
    passWondr: /(?:^|\n)\s*Password.*Wondr[\s:]*([A-Za-z0-9!@#$%^&*]+?)(?:\n|$)/i,
    passEmail: /(?:^|\n)\s*Password.*Email[\s:]*([A-Za-z0-9!@#$%^&*]+?)(?:\n|$)/i,
    expired: /(?:^|\n)\s*Expired[\s:]*([0-9\-\/]+)(?:\s|$|\n)/i,
    uploadFotoId: /(?:^|\n)\s*Foto KTP[\s:]*([a-zA-Z0-9_\-\.]+)(?:\s|$|\n)/i,
    uploadFotoSelfie: /(?:^|\n)\s*Foto Selfie[\s:]*([a-zA-Z0-9_\-\.]+)(?:\s|$|\n)/i
  };

  // Try to extract data from the entire text
  const extractedData = {};

  // Apply all patterns to extract data
  Object.keys(patterns).forEach(key => {
    const match = text.match(patterns[key]);
    if (match && match[1]) {
      extractedData[key] = match[1].trim();
    }
  });

  // Clean up extracted data
  if (extractedData.noHp) {
    // Clean phone number
    extractedData.noHp = extractedData.noHp.replace(/[\s\-]/g, '');
  }

  if (extractedData.nama) {
    // Clean name
    extractedData.nama = extractedData.nama.replace(/\s+/g, ' ').trim();
  }

  if (extractedData.namaIbuKandung) {
    // Clean mother's name
    extractedData.namaIbuKandung = extractedData.namaIbuKandung.replace(/\s+/g, ' ').trim();
  }

  if (extractedData.bank) {
    // Clean bank name
    extractedData.bank = extractedData.bank.replace(/\s+/g, ' ').trim();
  }

  // Convert expired date to proper format if needed
  if (extractedData.expired) {
    try {
      // Try to parse various date formats
      const dateStr = extractedData.expired;
      let parsedDate;

      if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
        // Already in YYYY-MM-DD format
        parsedDate = new Date(dateStr);
      } else if (dateStr.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
        // MM/DD/YYYY format
        const [month, day, year] = dateStr.split('/');
        parsedDate = new Date(`${year}-${month}-${day}`);
      } else if (dateStr.match(/^\d{2}-\d{2}-\d{4}$/)) {
        // DD-MM-YYYY format
        const [day, month, year] = dateStr.split('-');
        parsedDate = new Date(`${year}-${month}-${day}`);
      }

      if (parsedDate && !isNaN(parsedDate.getTime())) {
        extractedData.expired = parsedDate.toISOString().split('T')[0];
      }
    } catch (error) {
      logger.warn('Failed to parse expired date from PDF', { dateStr: extractedData.expired });
    }
  }

  logger.info('Extracted data from PDF', {
    extractedFields: Object.keys(extractedData),
    data: extractedData
  });

  // Return as array (single product from PDF)
  if (Object.keys(extractedData).length > 0) {
    products.push(extractedData);
  }

  return products;
};

// Main function to process document and extract product data
const processDocumentFile = async (filePath) => {
  try {
    const extension = path.extname(filePath).toLowerCase();
    logger.info('Processing document file', { filePath, extension });

    let text = '';
    let format = 'unknown';

    if (extension === '.pdf') {
      // Process PDF files
      const pdfBuffer = fs.readFileSync(filePath);
      text = await extractTextFromPDF(pdfBuffer);
      format = 'pdf';
    } else {
      // Process other document formats (Word, Excel, CSV)
      const result = await parseDocument(filePath);

      if (result.success) {
        text = result.text;
        format = result.format;
      } else {
        return {
          success: false,
          error: result.error,
          products: []
        };
      }
    }

    // Parse product data from extracted text
    const products = parseProductData(text);

    logger.info('Document processing completed', {
      filePath,
      format,
      extractedProducts: products.length,
      textLength: text.length
    });

    return {
      success: true,
      products,
      format,
      textPreview: text.substring(0, 500) + (text.length > 500 ? '...' : '')
    };

  } catch (error) {
    logger.error('Document processing failed', {
      filePath,
      error: error.message,
      stack: error.stack
    });

    return {
      success: false,
      error: error.message,
      products: []
    };
  }
};

// Backward compatibility - alias for PDF processing
const processPDFFile = processDocumentFile;

// Validate extracted product data
const validateExtractedData = (products) => {
  const errors = [];
  const validProducts = [];

  products.forEach((product, index) => {
    const productErrors = [];

    // Required field validation
    const requiredFields = ['nik', 'nama', 'noRek', 'noAtm', 'noHp', 'pinAtm', 'pinWondr', 'email', 'expired'];
    requiredFields.forEach(field => {
      if (!product[field]) {
        productErrors.push(`${field} is required`);
      }
    });

    // Format validation
    if (product.nik && !/^\d{16}$/.test(product.nik)) {
      productErrors.push('NIK must be 16 digits');
    }

    if (product.noRek && !/^\d{10,18}$/.test(product.noRek)) {
      productErrors.push('No. Rekening must be 10-18 digits');
    }

    if (product.noAtm && !/^\d{16}$/.test(product.noAtm)) {
      productErrors.push('No. ATM must be 16 digits');
    }

    if (product.noHp && !/^(\+62|62|0)8[1-9][0-9]{6,9}$/.test(product.noHp.replace(/[\s\-]/g, ''))) {
      productErrors.push('No. HP format is invalid');
    }

    if (product.pinAtm && !/^\d{4,6}$/.test(product.pinAtm)) {
      productErrors.push('PIN ATM must be 4-6 digits');
    }

    if (product.pinWondr && !/^\d{4,6}$/.test(product.pinWondr)) {
      productErrors.push('PIN Wondr must be 4-6 digits');
    }

    if (product.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(product.email)) {
      productErrors.push('Email format is invalid');
    }

    if (productErrors.length === 0) {
      validProducts.push(product);
    } else {
      errors.push({
        productIndex: index,
        errors: productErrors,
        data: product
      });
    }
  });

  return {
    validProducts,
    errors,
    summary: {
      total: products.length,
      valid: validProducts.length,
      invalid: errors.length
    }
  };
};

module.exports = {
  processPDFFile,
  extractTextFromPDF,
  parseProductData,
  validateExtractedData
};