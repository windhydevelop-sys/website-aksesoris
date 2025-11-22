const fs = require('fs');
const path = require('path');
const { extractTextFromPDF } = require('./backend/utils/pdfParser');

async function testPDFParsing() {
  try {
    console.log('Testing PDF parsing...');

    // Check if PDF file exists
    const pdfPath = path.join(__dirname, 'pdf sample.pdf');
    if (!fs.existsSync(pdfPath)) {
      console.error('PDF file not found:', pdfPath);
      return;
    }

    console.log('PDF file found, reading...');

    // Read PDF file
    const pdfBuffer = fs.readFileSync(pdfPath);
    console.log('PDF buffer size:', pdfBuffer.length, 'bytes');

    // Extract text
    console.log('Extracting text...');
    const text = await extractTextFromPDF(pdfBuffer);

    console.log('Extracted text length:', text.length);
    console.log('First 500 characters:');
    console.log(text.substring(0, 500));
    console.log('...');

    if (text.includes('PDF parsing is currently under maintenance')) {
      console.log('❌ PDF parsing is still disabled');
    } else {
      console.log('✅ PDF parsing is working!');
    }

  } catch (error) {
    console.error('Test failed:', error);
  }
}

testPDFParsing();