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
    let foundKTP = false;
    let foundSelfie = false;

    // Iterate over all elements in body
    // Mammoth usually outputs <p>, <table>, <img>, etc.
    $('body').children().each((i, elem) => {
        const text = $(elem).text().trim();
        const $img = $(elem).find('img');
        const hasImg = $img.length > 0;

        // 1. Detect Product Boundary
        if (text.match(/No\s*\.?\s*ORDER/i)) {
            currentProductIndex++;
            expecting = null;
            foundKTP = false;
            foundSelfie = false;
            // logger.info(`ImageExtractor: Found product boundary ${currentProductIndex}`);
        }

        if (currentProductIndex < 0) return; // Skip content before first product

        // 2. Detect Image Markers (Flexible)
        // Checks for "Foto KTP", "KTP", "Identitas", "ID Card", etc.
        if (text.match(/(?:Foto\s*)?KTP|Identitas|ID\s*Card/i)) {
            expecting = 'uploadFotoId';
        }
        // Checks for "Foto Selfie", "Selfie", "Wajah", "Face", etc.
        else if (text.match(/(?:Foto\s*)?Selfie|Wajah|Face/i)) {
            expecting = 'uploadFotoSelfie';
        }

        // 3. Capture Image
        if (hasImg) {
            // Mammoth embeds default as base64 in src
            const src = $img.attr('src');

            if (src && src.startsWith('data:image')) {
                let targetType = null;

                if (expecting) {
                    // Explicit label match
                    targetType = expecting;
                } else {
                    // FALLBACK: If no explicit label, first image is KTP, second is Selfie
                    if (!foundKTP) {
                        targetType = 'uploadFotoId';
                    } else if (!foundSelfie) {
                        targetType = 'uploadFotoSelfie';
                    }
                }

                if (targetType) {
                    images.push({
                        productIndex: currentProductIndex,
                        type: targetType,
                        base64: src
                    });

                    if (targetType === 'uploadFotoId') foundKTP = true;
                    if (targetType === 'uploadFotoSelfie') foundSelfie = true;

                    // Reset expectation after finding image
                    expecting = null;
                }
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

/**
 * Extract images from PDF buffer using pdf-extract-image
 * Returns array of image buffers with metadata
 */
const extractImagesFromPDF = async (pdfBuffer) => {
    try {
        logger.info('Starting PDF image extraction...');

        const pdfExtract = require('pdf-extract-image');

        // Extract images from PDF buffer
        const images = await pdfExtract(pdfBuffer);

        if (!images || images.length === 0) {
            logger.info('No images found in PDF');
            return [];
        }

        logger.info(`Extracted ${images.length} images from PDF`);

        // Convert to our expected format
        const formattedImages = images.map((img, index) => ({
            buffer: img,  // Already a Buffer
            format: 'png',  // pdf-extract-image returns PNG buffers
            width: 0,  // Metadata not available from this library
            height: 0,
            pageIndex: 0,  // Page info not available
            size: img.length,
            index
        }));

        return formattedImages;

    } catch (error) {
        logger.error('PDF image extraction failed:', { error: error.message, stack: error.stack });
        return [];
    }
};

module.exports = {
    extractImagesFromHtml,
    saveImageToDisk,
    extractImagesFromPDF
};
