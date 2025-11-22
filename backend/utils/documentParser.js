const fs = require('fs');
const path = require('path');
const mammoth = require('mammoth');
const XLSX = require('xlsx');
const { logger } = require('./audit');

// Parse Word documents (.docx)
const parseWordDocument = async (filePath) => {
  try {
    logger.info('Parsing Word document', { filePath });

    const result = await mammoth.extractRawText({ path: filePath });
    const text = result.value;

    logger.info('Word document parsed successfully', {
      filePath,
      textLength: text.length
    });

    return {
      success: true,
      text,
      format: 'docx'
    };

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