const fs = require('fs');
const path = require('path');
const mammoth = require('mammoth');
const XLSX = require('xlsx');
const cheerio = require('cheerio');
const { logger } = require('./audit');

// Parse Word documents (.docx) - Enhanced to extract tables
const parseWordDocument = async (filePath) => {
  try {
    logger.info('Parsing Word document', { filePath });

    // Try to extract HTML to parse tables
    const htmlResult = await mammoth.convertToHtml({ path: filePath });
    const html = htmlResult.value;

    // Check if document contains tables
    const $ = cheerio.load(html);
    const tables = $('table');

    if (tables.length > 0) {
      // Extract table data
      const tableData = [];

      tables.first().find('tr').each((i, row) => {
        const rowData = [];
        $(row).find('td, th').each((j, cell) => {
          rowData.push($(cell).text().trim());
        });
        if (rowData.length > 0) {
          tableData.push(rowData);
        }
      });

      logger.info('Word document with table parsed successfully', {
        filePath,
        rows: tableData.length,
        hasTable: true
      });

      return {
        success: true,
        text: html,
        html: html, // Standardize to always provide html property
        format: 'docx',
        sheetData: tableData, // Same format as Excel parser
        hasTable: true
      };
    } else {
      // Fallback to raw text extraction
      const textResult = await mammoth.extractRawText({ path: filePath });
      const text = textResult.value;

      // Try to parse List Format (Label: Value)
      const listData = parseListFormat(text);

      if (listData.length > 0) {
        logger.info('Word document with List format parsed successfully', {
          filePath,
          rows: listData.length,
          hasTable: true // Pretend it has table so import logic works
        });

        return {
          success: true,
          text,
          html,
          format: 'docx',
          sheetData: listData,
          hasTable: true
        };
      }

      logger.info('Word document parsed successfully (no table/list)', {
        filePath,
        textLength: text.length,
        hasTable: false
      });

      return {
        success: true,
        text, // Raw text for regex parsing
        html, // HTML for image extraction
        format: 'docx',
        hasTable: false
      };
    }

  } catch (error) {
    logger.error('Word document parsing failed', {
      filePath,
      error: error.message
    });

    return {
      success: false,
      error: `Failed to parse Word document: ${error.message}`,
      format: 'docx'
    };
  }
};

/**
 * Parse text content from Word document in List format
 * Logic: Looks for "HASIL KOREKSI DATA" as separator, then "Label: Value" lines
 */
const parseListFormat = (text) => {
  try {
    const sections = text.split(/HASIL KOREKSI DATA - PRODUK \d+/i);
    // First section is usually empty or header, ignore if it doesn't have fields
    const validSections = sections.filter(s => s.trim().length > 0 && s.includes(':'));

    if (validSections.length === 0) return [];

    const headers = [
      'No. Order', 'Code Agen', 'Jenis Rekening', 'Bank', 'Grade', 'Kantor Cabang', 'NIK', 'Nama',
      'Nama Ibu Kandung', 'Tempat/Tanggal Lahir', 'No. Rekening', 'Sisa Saldo', 'No. ATM',
      'Valid Kartu', 'No. HP', 'PIN ATM', 'Email', 'Password Email', 'Expired',
      'User Mobile', 'Password Mobile', 'PIN Mobile',
      'I-Banking', 'Password IB', 'PIN IB', 'BCA-ID', 'Pass BCA-ID', 'Pin Transaksi',
      'Kode Akses', 'Pin m-BCA', 'PIN Wondr', 'Pass Wondr', 'User Nyala',
      'User BRImo', 'Pass BRImo', 'User Merchant', 'Pass Merchant'
    ];

    const rows = [headers]; // First row is header

    validSections.forEach(section => {
      const rowData = new Array(headers.length).fill('');
      const lines = section.split('\n').map(l => l.trim()).filter(l => l);

      lines.forEach(line => {
        const separatorIndex = line.indexOf(':');
        if (separatorIndex > -1) {
          const key = line.substring(0, separatorIndex).trim();
          const value = line.substring(separatorIndex + 1).trim();

          // Match key to header (fuzzy match or exact?)
          // Exact match first, then case-insensitive
          const headerIndex = headers.findIndex(h => h.toLowerCase() === key.toLowerCase());
          if (headerIndex > -1) {
            rowData[headerIndex] = value === '-' ? '' : value;
          }
        }
      });

      // Only add if we found at least one field (e.g. NIK or No Order)
      // Or just check if not empty
      if (rowData.some(val => val !== '')) {
        rows.push(rowData);
      }
    });

    return rows.length > 1 ? rows : [];
  } catch (e) {
    console.error('Error parsing list format:', e);
    return [];
  }
};

// Parse Excel spreadsheets (.xlsx, .xls)
const parseExcelDocument = async (filePath) => {
  try {
    logger.info('Parsing Excel document', { filePath });

    const workbook = XLSX.readFile(filePath);
    const sheetNames = workbook.SheetNames;

    // Use first sheet or look for sheet containing product data
    let targetSheet = workbook.Sheets[sheetNames[0]];

    // Try to find a sheet with product data
    for (const sheetName of sheetNames) {
      if (sheetName.toLowerCase().includes('product') ||
        sheetName.toLowerCase().includes('data') ||
        sheetName.toLowerCase().includes('produk')) {
        targetSheet = workbook.Sheets[sheetName];
        break;
      }
    }

    // Convert to JSON
    const jsonData = XLSX.utils.sheet_to_json(targetSheet, {
      header: 1, // Use first row as headers
      defval: '' // Default value for empty cells
    });

    // Convert to text format for parsing
    const text = jsonData.map(row =>
      Array.isArray(row) ? row.join('\t') : String(row)
    ).join('\n');

    logger.info('Excel document parsed successfully', {
      filePath,
      sheetName: targetSheet.name || 'Unknown',
      rows: jsonData.length,
      textLength: text.length
    });

    return {
      success: true,
      text,
      format: 'xlsx',
      sheetData: jsonData
    };

  } catch (error) {
    logger.error('Excel document parsing failed', {
      filePath,
      error: error.message
    });

    return {
      success: false,
      error: `Failed to parse Excel document: ${error.message}`,
      format: 'xlsx'
    };
  }
};

// Parse CSV files
const parseCSVDocument = async (filePath) => {
  try {
    logger.info('Parsing CSV document', { filePath });

    const workbook = XLSX.readFile(filePath);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const csvData = XLSX.utils.sheet_to_csv(sheet);

    logger.info('CSV document parsed successfully', {
      filePath,
      lines: csvData.split('\n').length
    });

    return {
      success: true,
      text: csvData,
      format: 'csv'
    };

  } catch (error) {
    logger.error('CSV document parsing failed', {
      filePath,
      error: error.message
    });

    return {
      success: false,
      error: `Failed to parse CSV document: ${error.message}`,
      format: 'csv'
    };
  }
};

// Main document parser that detects file type and uses appropriate parser
const parseDocument = async (filePath) => {
  const extension = path.extname(filePath).toLowerCase();

  switch (extension) {
    case '.docx':
      return await parseWordDocument(filePath);

    case '.xlsx':
    case '.xls':
      return await parseExcelDocument(filePath);

    case '.csv':
      return await parseCSVDocument(filePath);

    default:
      return {
        success: false,
        error: `Unsupported file format: ${extension}`,
        format: 'unknown'
      };
  }
};

module.exports = {
  parseDocument,
  parseWordDocument,
  parseExcelDocument,
  parseCSVDocument
};