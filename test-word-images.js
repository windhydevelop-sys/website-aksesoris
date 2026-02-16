const { generateCorrectedWordList } = require('./backend/utils/wordTemplateGenerator');
const fs = require('fs');
const path = require('path');

const testExport = async () => {
    // We'll use the real image filename found in DB
    const sampleProduct = {
        noOrder: 'TEST-ORDER-002',
        bank: 'BCA',
        nama: 'Asep Cloudinary',
        uploadFotoId: 'http://res.cloudinary.com/dzytsa9mv/image/upload/v1739092174/website-aksesoris/secure_1739092173574_560563456.png',
        uploadFotoSelfie: '-'
    };

    console.log('Starting test export with image:', sampleProduct.uploadFotoId);

    try {
        const result = await generateCorrectedWordList([sampleProduct]);
        if (result.success) {
            const outputPath = path.join(__dirname, 'test_export_result.docx');
            fs.writeFileSync(outputPath, result.buffer);
            console.log('Export successful! Results saved to:', outputPath);
            console.log('Buffer size:', result.buffer.length);
        } else {
            console.error('Export failed:', result.error);
        }
    } catch (err) {
        console.error('Critical error in test:', err);
    }
};

testExport();
