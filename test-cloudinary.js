const { uploadSingleFile } = require('./backend/utils/cloudinary');
const fs = require('fs');
const path = require('path');

async function testCloudinary() {
    console.log('Testing Cloudinary upload...');
    const testImagePath = path.join(__dirname, 'backend/uploads', 'secure_1763063594960-183427657.jpg');

    if (!fs.existsSync(testImagePath)) {
        console.error('Test image not found at', testImagePath);
        return;
    }

    const { success, url, publicId, error } = await uploadSingleFile(testImagePath);

    if (success) {
        console.log('SUCCESS!');
        console.log('URL:', url);
        console.log('Public ID:', publicId);
    } else {
        console.error('FAILED:', error);
    }
}

testCloudinary();
