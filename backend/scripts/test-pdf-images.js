const fs = require('fs');
const path = require('path');
const { extractImagesFromPDF } = require('../utils/imageExtractor');

async function testPDFImageExtraction() {
    try {
        // Find a sample PDF file
        const testFilesDir = path.join(__dirname, '../uploads/temp');
        const files = fs.readdirSync(testFilesDir).filter(f => f.endsWith('.pdf'));

        if (files.length === 0) {
            console.log('No PDF files found in uploads directory');
            return;
        }

        const testFile = path.join(testFilesDir, files[0]);
        console.log(`Testing with file: ${files[0]}`);

        const pdfBuffer = fs.readFileSync(testFile);
        console.log(`PDF buffer size: ${pdfBuffer.length} bytes`);

        const images = await extractImagesFromPDF(pdfBuffer);

        console.log(`\n✅ Extraction completed!`);
        console.log(`Found ${images.length} images`);

        images.forEach((img, index) => {
            console.log(`\nImage ${index + 1}:`);
            console.log(`  - Format: ${img.format}`);
            console.log(`  - Size: ${img.size} bytes`);
            console.log(`  - Dimensions: ${img.width}x${img.height}`);
            console.log(`  - Page: ${img.pageIndex + 1}`);
        });

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.error(error.stack);
    }
}

testPDFImageExtraction();
