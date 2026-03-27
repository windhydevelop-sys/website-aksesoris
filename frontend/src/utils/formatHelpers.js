/**
 * Format currency value for display (adds thousand separators with dots)
 * Input: 1000000 or "1000000"
 * Output: "1.000.000"
 */
export const formatCurrency = (value) => {
  if (!value && value !== 0) return '';
  const numberString = String(value).replace(/[^0-9]/g, '');
  return numberString.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
};

/**
 * Clean formatted currency for backend submission (removes dots)
 * CRITICAL: Must be called before sending data to backend
 * Input: "1.000.000" or 1000000
 * Output: 1000000 (number)
 */
export const cleanCurrency = (value) => {
  if (!value && value !== 0) return 0;
  // Remove all dots before parsing
  const cleaned = String(value).replace(/\./g, '');
  return parseInt(cleaned, 10) || 0;
};

/**
 * Build full image URL from relative paths
 * Handles both relative paths and absolute URLs
 * Input: "uploads/image.jpg" or "/uploads/image.jpg"
 * Output: "http://localhost:5000/uploads/image.jpg"
 */
export const buildImageUrl = (imagePath, baseURL = '') => {
  if (!imagePath) return '';
  
  // If already an absolute URL, return as-is
  if (imagePath.startsWith('http')) return imagePath;
  
  // Use provided baseURL or default to current window location
  const base = baseURL || `${window.location.protocol}//${window.location.host}`;
  
  // Ensure imagePath starts with /
  const normalizedPath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
  
  return `${base}${normalizedPath}`;
};

/**
 * Handle image loading errors with fallback
 */
export const handleImageError = (event) => {
  event.target.style.display = 'none';
};

/**
 * Format date for display in Indonesian locale
 * Input: Date object or ISO string
 * Output: "25 Desember 2023" or custom format
 */
export const formatDate = (date, format = 'long') => {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  const options = {
    weekday: format === 'long' ? 'long' : undefined,
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  };
  
  return new Intl.DateTimeFormat('id-ID', options).format(dateObj);
};

/**
 * Format currency in IDR with full Intl formatting
 * Input: 1000000
 * Output: "Rp 1.000.000,00"
 */
export const formatIDR = (value) => {
  if (!value && value !== 0) return 'Rp 0';
  
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(value);
};

/**
 * Truncate text with ellipsis
 * Input: "This is a long text", 10
 * Output: "This is..."
 */
export const truncateText = (text, maxLength = 50) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return `${text.substring(0, maxLength - 3)}...`;
};

/**
 * Validate currency input - check if value is valid number
 */
export const isValidCurrency = (value) => {
  if (!value && value !== 0) return false;
  const cleaned = cleanCurrency(value);
  return cleaned > 0;
};

/**
 * Convert payment status to Indonesian label
 */
export const getPaymentStatusLabel = (status) => {
  const statusMap = {
    paid: 'Lunas',
    unpaid: 'Belum Bayar',
    pending: 'Menunggu',
    cancelled: 'Dibatalkan',
    partial: 'Sebagian Bayar'
  };
  return statusMap[status] || status;
};

/**
 * Get payment status color for UI
 */
export const getPaymentStatusColor = (status) => {
  const colorMap = {
    paid: '#4CAF50', // green
    unpaid: '#F44336', // red
    pending: '#FF9800', // orange
    cancelled: '#9E9E9E', // gray
    partial: '#2196F3' // blue
  };
  return colorMap[status] || '#757575';
};
