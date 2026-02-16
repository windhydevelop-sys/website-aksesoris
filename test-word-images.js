const { generateCorrectedWord, generateCorrectedWordList } = require('./backend/utils/wordTemplateGenerator');
const fs = require('fs');

const testProducts = [
    {
        nama: 'Test User KTP Only',
        uploadFotoId: 'secure_1763063594960-183427657.jpg',
        uploadFotoSelfie: '-',
        bank: 'BRI',
        noRek: '123456789'
    },
    {
        nama: 'Test User Selfie Only',
        uploadFotoId: '',
        uploadFotoSelfie: 'secure_1763063594960-385479040.png',
        bank: 'BCA',
        noRek: '987654321'
    },
    {
        nama: 'Test User Remote Image',
        uploadFotoId: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
        uploadFotoSelfie: '-',
        bank: 'OCBC',
        noRek: '555555555'
    }
];

async function runTest() {
    console.log('--- Testing Word Export (Table Format) ---');
    try {
        const tableResult = await generateCorrectedWord(testProducts);
        if (tableResult.success) {
            fs.writeFileSync('test-table-images.docx', tableResult.buffer);
            console.log('Table format export saved to test-table-images.docx');
        } else {
            console.error('Table format export failed:', tableResult.error);
        }
    } catch (err) {
        console.error('Table format crash:', err);
    }

    console.log('\n--- Testing Word Export (List Format) ---');
    try {
        const listResult = await generateCorrectedWordList(testProducts);
        if (listResult.success) {
            fs.writeFileSync('test-list-images.docx', listResult.buffer);
            console.log('List format export saved to test-list-images.docx');
        } else {
            console.error('List format export failed:', listResult.error);
        }
    } catch (err) {
        console.error('List format crash:', err);
    }
}

runTest();
