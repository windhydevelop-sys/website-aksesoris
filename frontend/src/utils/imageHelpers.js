import axios from './axios';

/**
 * Builds a complete URL for an image based on the provided filename or public_id.
 * Handles full Cloudinary URLs, local upload paths, and legacy Cloudinary public_ids.
 * 
 * @param {string} filename - The filename, full URL, or public_id from the database
 * @returns {string} The complete URL for the image
 */
export const buildImageUrl = (filename) => {
    if (!filename) return '';

    // If it's already a full URL or a relative web path
    if (filename.startsWith('http') || filename.startsWith('/')) {
        return filename;
    }

    // Fallback for existing data that only stored the Cloudinary public_id
    // with the 'secure_' prefix (older logic)
    if (filename.startsWith('secure_')) {
        const cloudName = 'dzytsa9mv'; // From Cloudinary config
        return `https://res.cloudinary.com/${cloudName}/image/upload/v1/website-aksesoris/${filename}`;
    }

    // Default to local uploads directory (for non-Cloudinary local files)
    return `${axios.defaults.baseURL}/uploads/${filename}`;
};
