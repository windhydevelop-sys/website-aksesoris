const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');
const { logger } = require('./audit');

/**
 * Extract images from HTML content based on text markers
 * Assumes linear flow: Text Marker -> Image
 */
const extractImagesFromHtml = (html) => {
    const $ = cheerio.load(html);
    const images = [];
    let currentProductIndex = -1; // Will match product array index

    // State for detection
    let expecting = null; // 'uploadFotoId' or 'uploadFotoSelfie'

    // Iterate over all elements in body
    // Mammoth usually outputs <p>, <table>, <img>, etc.
    $('body').children().each((i, elem) => {
        const text = $(elem).text().trim();
        const $img = $(elem).find('img');
        const hasImg = $img.length > 0;

        // 1. Detect Product Boundary
        // Use regex flexible enough to catch "No.ORDER"
        if (text.match(/No\s*\.?\s*ORDER/i)) {
            currentProductIndex++;
            expecting = null; // Reset expectation on new product
            // logger.info(`ImageExtractor: Found product boundary ${currentProductIndex}`);
        }

        if (currentProductIndex < 0) return; // Skip content before first product

        // 2. Detect Image Markers
        if (text.match(/Foto\s*KTP/i)) {
            expecting = 'uploadFotoId';
        } else if (text.match(/Foto\s*Selfie/i)) {
            expecting = 'uploadFotoSelfie';
        }

        // 3. Capture Image
        if (hasImg && expecting) {
            // Mammoth embeds default as base64 in src
            const src = $img.attr('src');

            if (src && src.startsWith('data:image')) {
                images.push({
                    productIndex: currentProductIndex,
                    type: expecting,
                    base64: src
                });

                // Reset expectation after finding image
                // (Assuming 1 image per label)
                expecting = null;
            }
        }
    });

    logger.info(`Extracted ${images.length} images from document`);
    return images;
};

/**
 * Save base64 image to disk and return filename
 */
const saveImageToDisk = (base64Str, uploadsDir) => {
    try {
        // base64Str format: "data:image/jpeg;base64,/9j/4AAQ..."
        const matches = base64Str.match(/^data:image\/([a-zA-Z0-9]+);base64,(.+)$/);

        if (!matches || matches.length !== 3) {
            // Try raw base64 if no header
            return null;
        }

        const ext = matches[1] === 'jpeg' ? 'jpg' : matches[1];
        const data = matches[2];
        const buffer = Buffer.from(data, 'base64');

        const filename = `secure_${Date.now()}_${Math.round(Math.random() * 1E9)}.${ext}`;
        const filePath = path.join(uploadsDir, filename);

        fs.writeFileSync(filePath, buffer);
        return filename;

    } catch (err) {
        logger.error('Failed to save extracted image', { error: err.message });
        return null;
    }
};

module.exports = {
    extractImagesFromHtml,
    saveImageToDisk
};
