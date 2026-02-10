const fs = require('fs');
const path = require('path');
const { logger, securityLog } = require('./audit');
const { extractImagesFromHtml, uploadImageToCloudinary, extractImagesFromPDF } = require('./imageExtractor');
const { parseDocument } = require('./documentParser');
const { uploadBufferToCloudinary } = require('./cloudinary');

let PDFParse = null;
try {
  const pdfModule = require('pdf-parse');
  // Check if it's the Mehmet Kozan version (class-based)
  if (pdfModule.PDFParse) {
    PDFParse = pdfModule.PDFParse;
  } else if (typeof pdfModule === 'function') {
    // Fallback for standard pdf-parse
    PDFParse = pdfModule;
  }
} catch (error) {
  logger.warn('pdf-parse library error or not available');
}

// Extract PDF text using the available library
const extractTextFromPDF = async (pdfBuffer) => {
  try {
    if (!PDFParse) return 'PDF parser not available';

    // If it's a class (Mehmet Kozan version)
    if (typeof PDFParse === 'function' && PDFParse.prototype && PDFParse.prototype.load) {
      const pdf = new PDFParse(new Uint8Array(pdfBuffer));
      await pdf.load();
      const result = await pdf.getText();
      return (result && typeof result === 'object' ? result.text : result) || '';
    }

    // If it's the standard function parser
    if (typeof PDFParse === 'function') {
      const data = await PDFParse(pdfBuffer);
      return data.text || '';
    }

    return 'Unsupported PDF parser format';
  } catch (error) {
    logger.error('PDF text extraction failed:', {
      error: error.message,
      stack: error.stack,
      bufferSize: pdfBuffer ? pdfBuffer.length : 0
    });
    return 'PDF processing error: ' + error.message;
  }
};

// Extract tables directly if using the advanced parser
const extractTablesFromPDF = async (pdfBuffer) => {
  try {
    if (typeof PDFParse === 'function' && PDFParse.prototype && PDFParse.prototype.getPageTables) {
      const pdf = new PDFParse(new Uint8Array(pdfBuffer));
      await pdf.load();

      const allTables = [];
      // Try to extract from first 5 pages
      const pagesToTry = Math.min(pdf.pagesCount || 1, 5);
      for (let i = 0; i < pagesToTry; i++) {
        try {
          const pageTables = await pdf.getPageTables(i);
          if (pageTables && pageTables.length > 0) {
            pageTables.forEach(table => {
              if (table.rows && table.rows.length > 1) {
                // Convert table rows to 2D array of strings
                allTables.push(table.rows.map(row =>
                  row.map(cell => (cell && typeof cell === 'object') ? (cell.text || '') : String(cell))
                ));
              }
            });
          }
        } catch (e) { /* skip page */ }
      }
      return allTables.length > 0 ? allTables[0] : null; // Return first found table
    }
  } catch (error) {
    logger.warn('Advanced PDF table extraction failed, falling back to text parsing', { error: error.message });
  }
  return null;
};

const parseProductData = (rawText) => {
  const products = [];

  // Normalization
  let text = rawText
    .replace(/[\u2013\u2014\u2212]/g, '-')
    .replace(/[\u00A0\u1680\u180e\u2000-\u200b\u202f\u205f\u3000]/g, ' ')
    .replace(/[“”‘’]/g, "'");

  const productBlocks = text.split(/(?=No\s*\.?\s*ORDER)/i).filter(block => block && block.length > 20);

  logger.info('Parsing text data', { totalChars: text.length, detectedBlocks: productBlocks.length });

  productBlocks.forEach((blockText, index) => {
    const patterns = {
      nik: /NIK[\s:]*([0-9\-\s]{16,25})/i,
      nama: /Nama[\s:]*([A-Za-z0-9\s\.\:\'\"\(\)\-\&\/]+?)(?:\s+Ibu|\s+Tempat|\s+No\.|\n|$)/i,
      namaIbuKandung: /(?:Nama\s*)?Ibu\s*Kandung[\s:]*([A-Za-z\s]+?)(?:\s+Tempat|\s+No\.|\n|$)/i,
      tempatTanggalLahir: /(?:Tempat|Tpat)?.*(?:Tanggal|Tgl)?.*Lahir[\s:]*([A-Za-z\s,0-9\-]+?)(?:\s+No\.|\n|$)/i,
      noRek: /No.*?Rek(?:ening)?[\s:]*([0-9\s\-]{8,25})/i,
      jenisRekening: /(?:Jenis\s*Rekening|Tipe\s*Rekening|Account\s*Type)[\s:]*([A-Za-z0-9\s]+?)(?:\s+No\.|\s+No\s*ATM|\n|$)/i,
      noAtm: /(?:No\.?\s*ATM|Nomor\s*ATM|No\.?\s*Kartu\s*Debit)[\s:]*([0-9\s\-]{16,25})(?:\s*\(([0-9\/\s\-]+?)\))?/i,
      validThru: /(?:Valid.*Thru|Valid.*Kartu)\s*[\s:]+\s*([0-9\/\-]+)/i,
      noHp: /No.*HP[\s:]*([0-9+\-\s]+)/i,
      pinAtm: /Pin.*ATM[\s:]*([0-9\s\-]{4,10})/i,
      email: /Email[\s:]*([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i,
      bank: /(?:^|\s)(?<!cabang\s)(?:Bank|Nama\s?Bank)[\s:]*([A-Za-z\s]+?)(?:\s*\((?:Grade\s+)?([^)]+?)\))?(?:\s+Grade|\s+KCP|\s+Kantor\s+Cabang|\n|$)/i,
      grade: /(?:^|\s)Grade[\s:]*([A-Za-z0-9\s]+?)(?:\s*\)|$|\s+KCP|\s+Kantor\s+Cabang|\s+NIK|\n)/i,
      kcp: /(?:KCP|Kantor\s+Cabang|Cabang\s+Bank)\s*[\s:]+\s*([A-Za-z0-9\s\-\.]+?)(?:\s+NIK|\n|$)/i,
      noOrder: /No\s*\.?\s*ORDER[\s:]*[(\[]?\s*([^\]\)\n]+?)(?:\s+NIK|\s+Nama|\n|$|[)\]])/i,
      codeAgen: /(?:Code\s*Agen|Kode\s*Orlap)[\s:]*[(\[]?([A-Za-z0-9\-]+)[)\]]?/i,
      customer: /(?:Customer|Pelanggan)[\s:]*[(\[]?([A-Za-z0-9\s]+?)[)\]]?(?:\s+NIK|\s+Nama|\n|$)/i,

      // IB Credentials (Priority)
      ibUser: /(?:User\s*I-Banking|I-Banking|User\s*IB|Internet\s*Banking|IB\s*User|IB)[\s:]+([A-Za-z0-9!@#$%\^&*.\-_]+)/i,
      ibPassword: /(?:Pass(?:word)?\s*I-Banking|Pass(?:word)?\s*IB|Password\s*Internet\s*Banking)[\s:]+([A-Za-z0-9!@#$%\^&*.\-_]+)/i,
      ibPin: /(?:Pin\s*I-Banking|Pin\s*IB)[\s:]+([0-9]{4,10})/i,

      // Merchant Credentials (BRI Qris)
      merchantUser: /(?:User|ID|Username)\s*(?:Merchant|Qris)[\s:]*([A-Za-z0-9!@#$%\^&*.\-_]+)/i,
      merchantPassword: /(?:Pass(?:word)?|Kata\s*Sandi)\s*(?:Merchant|Qris)[\s:]*([A-Za-z0-9!@#$%\^&*.\-_]+)/i,


      pinWondr: /PIN\s*Wondr[\s:]*([0-9]{4,8})/i,
      passWondr: /Pass(?:word)?\s*Wondr[\s:]*([A-Za-z0-9!@#$%^&*]+)/i,
      passEmail: /Pass(?:word)?\s*Email[\s:]*([A-Za-z0-9!@#$%^&*]+)/i,
      mobileUser: /(?:User|Id|Login|Account|User\s*Id|User\s*M-Banking|User\s*M-Bank)\s*(?:Mobile|M-BCA|MBCA|BRIMO|Livin|Wondr|Nyala|M-Bank|MBANK|M-Banking|Login|Account)[\s:]*([A-Za-z0-9!@#$%\^&*.\-_]+)/i,
      mobilePassword: /(?:Kode\s*Akses|Password|Pass|Login|Pass\s*Login|Pass\s*Mobile|Password\s*Mobile)\s*(?:Mobile|M-BCA|MBCA|BRIMO|Livin|Wondr|M-Bank|MBANK|M-Banking|Login)?[\s:]*([A-Za-z0-9!@#$%\^&*.\-_]+)/i,
      mobilePin: /(?:Pin|Pin\s*Login|Pin\s*Mobile)\s*(?:M-BCA|MBCA|Mobile|BRIMO|Livin|Wondr|M-Bank|MBANK|M-Banking|Login)?[\s:]*([0-9]{4,10})/i,

      myBCAUser: /(?:BCA\s*ID|BCA-ID|User\s*myBCA)[\s:]*([A-Za-z0-9!@#$%\^&*.\-_]+)/i,
      myBCAPassword: /(?:Pass\s*BCA-ID|Pass\s*BCA\s*ID|Password\s*myBCA)[\s:]*([A-Za-z0-9!@#$%\^&*.\-_]+)/i,
      myBCAPin: /(?:Pin\s*Transaksi|Pin\s*myBCA)[\s:]*([0-9]{4,10})/i
    };

    const extractedData = {};
    Object.keys(patterns).forEach(key => {
      const match = blockText.match(patterns[key]);
      if (match && match[1]) {
        extractedData[key] = match[1].trim();

        // Secondary capture groups for combined fields
        if (key === 'bank' && match[2] && !extractedData.grade) {
          extractedData.grade = match[2].trim();
        }
        if (key === 'noAtm' && match[2] && !extractedData.validThru) {
          extractedData.validThru = match[2].trim();
        }
      } else {
        // Default value for missing fields only if not already set (e.g. by composite fields)
        if (!extractedData[key]) {
          extractedData[key] = '-';
        }
      }
    });

    // Auto-detect QRIS for BRI if merchant fields are extracted
    if ((extractedData.merchantUser && extractedData.merchantUser !== '-') ||
      (extractedData.merchantPassword && extractedData.merchantPassword !== '-')) {
      if (extractedData.bank?.toUpperCase().includes('BRI')) {
        extractedData.jenisRekening = 'QRIS';
      }
    }

    const cleanNumeric = (str) => str ? str.replace(/[\s\-]/g, '') : '';
    extractedData.noHp = cleanNumeric(extractedData.noHp);
    extractedData.noRek = cleanNumeric(extractedData.noRek);
    extractedData.nik = cleanNumeric(extractedData.nik);
    extractedData.noAtm = cleanNumeric(extractedData.noAtm);
    extractedData.pinAtm = cleanNumeric(extractedData.pinAtm);

    // Date parsing removed to use manual input
    extractedData.expired = null;

    if (extractedData.noOrder || extractedData.nik) products.push(extractedData);
  });
  return products;
};

const processDocumentFile = async (filePath) => {
  try {
    const extension = path.extname(filePath).toLowerCase();
    logger.info('Processing document file', { filePath, extension });

    let text = '';
    let htmlContent = null;
    let products = [];
    let sheetData = null;

    if (extension === '.pdf') {
      const pdfBuffer = fs.readFileSync(filePath);

      // Try built-in table extraction first
      const extractedTable = await extractTablesFromPDF(pdfBuffer);
      if (extractedTable && extractedTable.length > 0) {
        logger.info('Extracted structured table from PDF using advanced parser');
        products = parseTableData(extractedTable);
      }

      if (products.length === 0) {
        // Fallback to text parsing
        text = await extractTextFromPDF(pdfBuffer);

        // DEBUG: Log first 1000 chars to help debug layout
        logger.info('PDF Extracted Text (Detailed):', {
          textLength: text.length,
          sample: text.substring(0, 500)
        });

        // In PDF, columns are often separated by multiple spaces or single space
        const lines = text.split('\n').filter(l => l.trim().length > 0);
        const rows = lines.map(line => {
          let cells = line.split(/\s{2,}|\t/).map(c => c.trim()).filter(c => c.length > 0);
          if (cells.length < 3 && line.toLowerCase().includes('nik') && line.toLowerCase().includes('nama')) {
            cells = line.split(/\s+/).map(c => c.trim()).filter(c => c.length > 0);
          }
          return cells;
        });

        const potentialTableRows = rows.filter(r => r.length > 3);
        if (potentialTableRows.length >= 1) {
          logger.info('Detected potential table/grid structure in PDF text');
          products = parseTableData(rows);
          if (products.length === 0) {
            products = parseProductData(text);
          }
        } else {
          products = parseProductData(text);
        }
      }



      // Extract images from PDF and upload to Cloudinary
      if (products.length > 0) {
        try {
          logger.info('Attempting to extract images from PDF...');
          const images = await extractImagesFromPDF(pdfBuffer);

          if (images.length > 0) {
            logger.info(`Found ${images.length} images in PDF, uploading to Cloudinary...`);

            // First image = KTP, Second image = Selfie
            for (let i = 0; i < Math.min(images.length, 2); i++) {
              const img = images[i];
              const fieldName = i === 0 ? 'uploadFotoId' : 'uploadFotoSelfie';
              const label = i === 0 ? 'KTP' : 'Selfie';

              try {
                // Upload to Cloudinary
                const timestamp = Date.now();
                const random = Math.floor(Math.random() * 1000000000);
                const publicId = `secure_${timestamp}_${random}`;

                const uploadResult = await uploadBufferToCloudinary(img.buffer, {
                  public_id: publicId,
                  transformation: [{ width: 1200, height: 1200, crop: 'limit' }]
                });

                if (uploadResult && uploadResult.secure_url) {
                  // Assign to first product (assuming single product per PDF)
                  if (products[0]) {
                    products[0][fieldName] = uploadResult.secure_url;
                    logger.info(`Successfully uploaded ${label} to Cloudinary: ${uploadResult.secure_url}`);
                  }
                }
              } catch (uploadErr) {
                logger.warn(`Failed to upload ${label} image to Cloudinary:`, { error: uploadErr });
              }
            }
          } else {
            logger.info('No images found in PDF');
          }
        } catch (imgErr) {
          logger.warn('PDF image extraction warning:', imgErr.message);
        }
      }
    } else {
      const parseResult = await parseDocument(filePath);
      if (!parseResult.success) throw new Error(parseResult.error);
      text = parseResult.text || '';
      htmlContent = parseResult.html || null;
      sheetData = parseResult.sheetData;

      if (sheetData && parseResult.hasTable) {
        products = parseTableData(sheetData);
      } else {
        products = parseProductData(text);
      }

      // Extract images for Word documents
      if (extension === '.docx' && htmlContent && products.length > 0) {
        try {
          const images = extractImagesFromHtml(htmlContent);
          if (images.length > 0) {
            // Use Promise.all for parallel uploads
            await Promise.all(images.map(async (img) => {
              if (products[img.productIndex]) {
                const imageUrl = await uploadImageToCloudinary(img.base64);
                if (imageUrl) {
                  if (img.type === 'uploadFotoId') products[img.productIndex].uploadFotoId = imageUrl;
                  else if (img.type === 'uploadFotoSelfie') products[img.productIndex].uploadFotoSelfie = imageUrl;
                }
              }
            }));
          }
        } catch (e) {
          logger.warn('Word image extraction warning:', e.message);
        }
      }
    }

    const validationResult = validateExtractedData(products);
    return { success: true, ...validationResult };

  } catch (error) {
    logger.error('Document processing failed', { error: error.message });
    return { success: false, validProducts: [], errors: [], summary: { total: 0, valid: 0, invalid: 0 }, error: error.message };
  }
};

const parseTableData = (tableData) => {
  const products = [];
  if (!tableData || tableData.length < 2) return products;

  const fieldMapping = {
    'no. order': 'noOrder', 'no order': 'noOrder', 'nomor order': 'noOrder', 'order no': 'noOrder',
    'kode agen': 'codeAgen', 'code agen': 'codeAgen', 'kode orlap': 'codeAgen', 'code orlap': 'codeAgen',
    'bank': 'bank', 'nama bank': 'bank', 'jenis bank': 'bank',
    'grade': 'grade', 'kcp': 'kcp', 'kantor cabang': 'kcp', 'cabang bank': 'kcp',
    'nik': 'nik', 'nomor induk kependudukan': 'nik',
    'nama': 'nama', 'nama lengkap': 'nama', 'nama sesuai ktp': 'nama',
    'nama ibu kandung': 'namaIbuKandung', 'ibu kandung': 'namaIbuKandung',
    'tempat tanggal lahir': 'tempatTanggalLahir', 'ttl': 'tempatTanggalLahir',
    'no. rekening': 'noRek', 'no rekening': 'noRek', 'nomor rekening': 'noRek', 'rekening': 'noRek',
    'no. atm': 'noAtm', 'no atm': 'noAtm', 'nomor atm': 'noAtm', 'nomor kartu debit': 'noAtm',
    'valid thru': 'validThru', 'valid kartu': 'validThru', 'valid sd': 'validThru', 'masa aktif': 'validThru',
    'no. hp': 'noHp', 'no hp': 'noHp', 'nomor hp': 'noHp', 'nomor handphone': 'noHp',
    'pin atm': 'pinAtm', 'pin kartu': 'pinAtm',
    'email': 'email', 'alamat email': 'email',
    'expired': 'expired', 'tanggal expired': 'expired',
    'foto ktp': 'uploadFotoId', 'upload foto ktp': 'uploadFotoId',
    'foto selfie': 'uploadFotoSelfie', 'upload foto selfie': 'uploadFotoSelfie',
    'customer': 'customer', 'pelanggan': 'customer', 'nama customer': 'customer', 'nama pelanggan': 'customer',
    'kode akses': 'mobilePassword', 'user m-bca': 'mobileUser', 'pin m-bca': 'mobilePin', 'bca-id': 'myBCAUser', 'pass bca-id': 'myBCAPassword',
    'pin transaksi': 'myBCAPin', 'user i-banking': 'ibUser', 'pin i-banking': 'ibPin', 'i-banking': 'ibUser', 'pass i-banking': 'ibPassword', 'password internet banking': 'ibPassword',
    'pass i-banking': 'ibPassword', 'password i-banking': 'ibPassword', 'pin i-banking': 'ibPin',
    'user ib': 'ibUser', 'pass ib': 'ibPassword', 'password ib': 'ibPassword', 'pin ib': 'ibPin',
    // OCBC (Nyala)
    'user nyala': 'mobileUser', 'id nyala': 'mobileUser', 'user id nyala': 'mobileUser',
    'nyala id': 'mobileUser', 'nyala user': 'mobileUser',
    'pin mobile': 'mobilePin', 'pass mobile': 'mobilePassword', 'password mobile': 'mobilePassword',
    // Generic / Other
    'no rek': 'noRek', 'norek': 'noRek', 'nomor rekening': 'noRek', 'rekening': 'noRek',
    'jenis rekening': 'jenisRekening', 'tipe rekening': 'jenisRekening', 'account type': 'jenisRekening', 'jenis tabungan': 'jenisRekening',
    'user merchant': 'merchantUser', 'id merchant': 'merchantUser', 'username merchant': 'merchantUser', 'user qris': 'merchantUser',
    'password merchant': 'merchantPassword', 'pass merchant': 'merchantPassword', 'password qris': 'merchantPassword',
    'no atm': 'noAtm', 'noatm': 'noAtm', 'nomor atm': 'noAtm', 'nomor kartu': 'noAtm', 'kartu debit': 'noAtm',
    // BRI (BRIMO)
    'user brimo': 'mobileUser', 'id brimo': 'mobileUser', 'password brimo': 'mobilePassword', 'pass brimo': 'mobilePassword', 'pin brimo': 'mobilePin',
    'brimo id': 'mobileUser', 'brimo user': 'mobileUser', 'brimo password': 'mobilePassword', 'brimo pass': 'mobilePassword', 'brimo pin': 'mobilePin',
    // Mandiri (Livin)
    'user livin': 'mobileUser', 'id livin': 'mobileUser', 'password livin': 'mobilePassword', 'pass livin': 'mobilePassword', 'pin livin': 'mobilePin',
    'livin id': 'mobileUser', 'livin user': 'mobileUser', 'livin password': 'mobilePassword', 'livin pass': 'mobilePassword', 'livin pin': 'mobilePin',
    // BNI (Wondr)
    'user wondr': 'mobileUser', 'id wondr': 'mobileUser', 'password wondr': 'mobilePassword', 'pass wondr': 'mobilePassword', 'pin wondr': 'mobilePin',
    'wondr id': 'mobileUser', 'wondr user': 'mobileUser', 'wondr password': 'mobilePassword', 'wondr pass': 'mobilePassword', 'wondr pin': 'mobilePin',
    'password transaksi wondr': 'mobilePin', 'pass transaksi wondr': 'mobilePin',
    // Generic variations for Mobile Banking
    'user mobile': 'mobileUser', 'id mobile': 'mobileUser', 'password mobile': 'mobilePassword', 'pass mobile': 'mobilePassword', 'pin mobile': 'mobilePin',
    'user mbanking': 'mobileUser', 'id mbanking': 'mobileUser', 'password mbanking': 'mobilePassword', 'pass mbanking': 'mobilePassword', 'pin mbanking': 'mobilePin',
    'kata sandi mobile': 'mobilePassword', 'login mobile': 'mobileUser', 'akun mobile': 'mobileUser',
    'kode akses': 'mobilePassword', 'access code': 'mobilePassword'
  };

  // Find header row by checking which row contains the most known headers
  let headerRowIndex = -1;
  let maxMatchedHeaders = 0;
  let detectedHeaders = [];

  for (let i = 0; i < Math.min(tableData.length, 10); i++) {
    const row = tableData[i];
    if (!row) continue;

    let matches = 0;
    const currentHeaders = [];
    row.forEach(cell => {
      const cleanCell = String(cell).trim().toLowerCase();
      if (fieldMapping[cleanCell]) {
        matches++;
        currentHeaders.push(fieldMapping[cleanCell]);
      } else {
        currentHeaders.push(cleanCell);
      }
    });

    if (matches > maxMatchedHeaders && matches >= 3) {
      maxMatchedHeaders = matches;
      headerRowIndex = i;
      detectedHeaders = currentHeaders;
    }
  }

  if (headerRowIndex === -1) {
    logger.info('Could not find header row in table data');
    return products;
  }

  logger.info('Found header row', { index: headerRowIndex, matchedFields: maxMatchedHeaders });

  const headerMap = {};
  detectedHeaders.forEach((field, i) => { headerMap[i] = field; });

  for (let i = headerRowIndex + 1; i < tableData.length; i++) {
    const row = tableData[i];
    const p = {};
    if (!row) continue;
    row.forEach((cell, idx) => {
      const field = headerMap[idx];
      if (field) {
        p[field] = String(cell).trim();
      }
    });
    if (p.noHp) p.noHp = p.noHp.replace(/[\s\-]/g, '');
    if (p.noRek) p.noRek = p.noRek.replace(/[\s\-]/g, '');
    if (p.nik) p.nik = p.nik.replace(/[\s\-]/g, '');
    if (Object.keys(p).length > 3) products.push(p);
  }
  return products;
};

const validateExtractedData = (products) => {
  const errors = [];
  const validProducts = [];
  products.forEach((product, index) => {
    const productErrors = [];
    const mandatoryFields = ['nik', 'nama', 'noRek', 'noAtm', 'noHp', 'pinAtm', 'email'];

    // DEBUG LOG
    if (index === 0) console.log('DEBUG VALIDATION FIELDS:', mandatoryFields);

    const bank = (product.bank || '').toLowerCase();

    if (bank.includes('bni')) {
      if (product.pinWondr) mandatoryFields.push('pinWondr');
    }

    mandatoryFields.forEach(field => {
      if (!product[field] || String(product[field]).trim() === '') {
        productErrors.push(`${field} is required`);
      }
    });
    if (product.nik && !/^\d{16}$/.test(product.nik)) productErrors.push('NIK must be 16 digits');
    if (productErrors.length === 0) validProducts.push(product);
    else errors.push({ productIndex: index, errors: productErrors, data: product });
  });
  return { validProducts, errors, summary: { total: products.length, valid: validProducts.length, invalid: errors.length } };
};

module.exports = {
  processPDFFile: processDocumentFile,
  processDocumentFile,
  extractTextFromPDF,
  parseProductData,
  validateExtractedData
};