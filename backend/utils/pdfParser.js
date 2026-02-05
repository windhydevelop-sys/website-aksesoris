const fs = require('fs');
const path = require('path');
const { logger, securityLog } = require('./audit');
const { extractImagesFromHtml, saveImageToDisk } = require('./imageExtractor');
const { parseDocument } = require('./documentParser');

let pdfParse = null;
try {
  pdfParse = require('pdf-parse');
} catch (error) {
  logger.warn('pdf-parse library not available in this environment');
}

// Extract PDF text
const extractTextFromPDF = async (pdfBuffer) => {
  try {
    if (pdfParse) {
      const data = await pdfParse(pdfBuffer);
      if (data && data.text && data.text.trim().length > 0) return data.text;
    }
    const bufferString = pdfBuffer.toString('utf8', 0, Math.min(10000, pdfBuffer.length));
    const textMatches = bufferString.match(/BT[\s\S]*?ET/g) || [];
    let extractedText = '';
    for (const match of textMatches) extractedText += match.replace(/BT|ET/g, '').trim() + ' ';
    return extractedText.length > 10 ? extractedText : 'PDF text extraction failed';
  } catch (error) {
    logger.error('PDF text extraction failed:', error);
    return 'PDF processing error';
  }
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
      nama: /Nama[\s:]*([A-Za-z\s\.]+?)(?:\s+Ibu|\s+Tempat|\s+No\.|\n|$)/i,
      namaIbuKandung: /(?:Nama\s*)?Ibu\s*Kandung[\s:]*([A-Za-z\s]+?)(?:\s+Tempat|\s+No\.|\n|$)/i,
      tempatTanggalLahir: /(?:Tempat|Tpat)?.*(?:Tanggal|Tgl)?.*Lahir[\s:]*([A-Za-z\s,0-9\-]+?)(?:\s+No\.|\n|$)/i,
      noRek: /No.*?Rek(?:ening)?[\s:]*([0-9\s\-]{8,25})/i,
      noAtm: /(?:No\.?\s*ATM|Nomor\s*ATM|No\.?\s*Kartu\s*Debit)[\s:]*([0-9\s\-]{16,25})(?:\s*\(([0-9\/\s\-]+?)\))?/i,
      validThru: /(?:Valid.*Thru|Valid.*Kartu)\s*[\s:]+\s*([0-9\/\-]+)/i,
      noHp: /No.*HP[\s:]*([0-9+\-\s]+)/i,
      pinAtm: /Pin.*ATM[\s:]*([0-9\s\-]{4,10})/i,
      email: /Email[\s:]*([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i,
      bank: /(?:^|\s)(?<!cabang\s)(?:Bank|Nama\s?Bank)[\s:]*([A-Za-z\s]+?)(?:\s*\((?:Grade\s+)?([^)]+?)\))?(?:\s+Grade|\s+KCP|\s+Kantor\s+Cabang|\n|$)/i,
      grade: /(?:^|\s)Grade[\s:]*([A-Za-z0-9\s]+?)(?:\s*\)|$|\s+KCP|\s+Kantor\s+Cabang|\s+NIK|\n)/i,
      kcp: /(?:KCP|Kantor\s+Cabang|Cabang\s+Bank)\s*[\s:]+\s*([A-Za-z0-9\s\-\.]+?)(?:\s+NIK|\n|$)/i,
      noOrder: /No\s*\.?\s*ORDER[\s:]*[(\[]?([A-Za-z0-9\-]+)[)\]]?/i,
      codeAgen: /(?:Code\s*Agen|Kode\s*Orlap)[\s:]*[(\[]?([A-Za-z0-9\-]+)[)\]]?/i,
      customer: /(?:Customer|Pelanggan)[\s:]*[(\[]?([A-Za-z0-9\s]+?)[)\]]?(?:\s+NIK|\s+Nama|\n|$)/i,

      // IB Credentials (Priority)
      ibUser: /(?:User\s*I-Banking|I-Banking|User\s*IB|Internet\s*Banking|IB\s*User|IB)[\s:]+([A-Za-z0-9!@#$%\^&*.\-_]+)/i,
      ibPassword: /(?:Pass(?:word)?\s*I-Banking|Pass(?:word)?\s*IB|Password\s*Internet\s*Banking)[\s:]+([A-Za-z0-9!@#$%\^&*.\-_]+)/i,
      ibPin: /(?:Pin\s*I-Banking|Pin\s*IB)[\s:]+([0-9]{4,10})/i,


      pinWondr: /PIN\s*Wondr[\s:]*([0-9]{4,8})/i,
      passWondr: /Pass(?:word)?\s*Wondr[\s:]*([A-Za-z0-9!@#$%^&*]+)/i,
      passEmail: /Pass(?:word)?\s*Email[\s:]*([A-Za-z0-9!@#$%^&*]+)/i,
      mobileUser: /(?:User|Id|Login|Account|User\s*Id|User\s*M-Banking|User\s*M-Bank)\s*(?:Mobile|M-BCA|BRIMO|Livin|Wondr|Nyala|M-Bank|Login|Account|Nyala)[\s:]*([A-Za-z0-9!@#$%\^&*.\-_]+)/i,
      mobilePassword: /(?:Kode\s*Akses|Password|Pass|Login|Pass\s*Login|Pass\s*Mobile|Password\s*Mobile)\s*(?:Mobile|M-BCA|BRIMO|Livin|Wondr|M-Bank|Login)?[\s:]*([A-Za-z0-9!@#$%\^&*.\-_]+)/i,
      mobilePin: /(?:Pin|Pin\s*Login|Pin\s*Mobile)\s*(?:M-BCA|Mobile|BRIMO|Livin|Wondr|M-Bank|Login)?[\s:]*([0-9]{4,10})/i,

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
      }
    });

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
      text = await extractTextFromPDF(pdfBuffer);
      products = parseProductData(text);
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
        if (extension === '.docx' && htmlContent && products.length > 0) {
          try {
            const images = extractImagesFromHtml(htmlContent);
            if (images.length > 0) {
              const uploadsDir = path.join(__dirname, '../uploads');
              if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
              images.forEach(img => {
                if (products[img.productIndex]) {
                  const filename = saveImageToDisk(img.base64, uploadsDir);
                  if (filename) {
                    if (img.type === 'uploadFotoId') products[img.productIndex].uploadFotoId = filename;
                    else if (img.type === 'uploadFotoSelfie') products[img.productIndex].uploadFotoSelfie = filename;
                  }
                }
              });
            }
          } catch (e) { logger.warn('Image extraction warning:', e.message); }
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
  const headers = tableData[0].map(h => String(h).trim().toLowerCase());
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
    'user m-banking': 'mobileUser', 'user m-bank': 'mobileUser', 'pin login': 'mobilePin', 'pass login': 'mobilePassword', 'password login': 'mobilePassword',
    // BRI (BRIMO)
    'user brimo': 'mobileUser', 'id brimo': 'mobileUser', 'password brimo': 'mobilePassword', 'pass brimo': 'mobilePassword', 'pin brimo': 'mobilePin',
    'brimo id': 'mobileUser', 'brimo user': 'mobileUser', 'brimo password': 'mobilePassword', 'brimo pass': 'mobilePassword', 'brimo pin': 'mobilePin',
    // Mandiri (Livin)
    'user livin': 'mobileUser', 'id livin': 'mobileUser', 'password livin': 'mobilePassword', 'pass livin': 'mobilePassword', 'pin livin': 'mobilePin',
    'livin id': 'mobileUser', 'livin user': 'mobileUser', 'livin password': 'mobilePassword', 'livin pass': 'mobilePassword', 'livin pin': 'mobilePin',
    // BNI (Wondr)
    'user wondr': 'mobileUser', 'id wondr': 'mobileUser', 'password wondr': 'mobilePassword', 'pass wondr': 'mobilePassword', 'pin wondr': 'mobilePin',
    'wondr id': 'mobileUser', 'wondr user': 'mobileUser', 'wondr password': 'mobilePassword', 'wondr pass': 'mobilePassword', 'wondr pin': 'mobilePin',
    // Generic variations for Mobile Banking
    'user mobile': 'mobileUser', 'id mobile': 'mobileUser', 'password mobile': 'mobilePassword', 'pass mobile': 'mobilePassword', 'pin mobile': 'mobilePin',
    'user mbanking': 'mobileUser', 'id mbanking': 'mobileUser', 'password mbanking': 'mobilePassword', 'pass mbanking': 'mobilePassword', 'pin mbanking': 'mobilePin',
    'kata sandi mobile': 'mobilePassword', 'login mobile': 'mobileUser', 'akun mobile': 'mobileUser'
  };

  const headerMap = {};
  headers.forEach((h, i) => { headerMap[i] = fieldMapping[h] || fieldMapping[h.replace(/[.]/g, '')] || h; });
  for (let i = 1; i < tableData.length; i++) {
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