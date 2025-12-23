import { Chip } from '@mui/material';

/**
 * Get status label in Indonesian
 * @param {string} status - Order status
 * @returns {string} Indonesian status label
 */
export const getStatusLabel = (status) => {
  const labels = {
    pending: 'Tertunda',
    in_progress: 'Dalam Proses',
    completed: 'Selesai',
    cancelled: 'Dibatalkan'
  };
  return labels[status] || status || 'Unknown';
};

/**
 * Get status color for Material-UI Chip
 * @param {string} status - Order status
 * @returns {string} Material-UI color
 */
export const getStatusColor = (status) => {
  const colors = {
    pending: 'error',
    in_progress: 'warning', 
    completed: 'success',
    cancelled: 'default'
  };
  return colors[status] || 'default';
};

/**
 * Get status chip component with consistent styling
 * @param {string} status - Order status
 * @param {string} size - Chip size ('small', 'medium', 'large')
 * @param {object} sx - Additional sx props
 * @returns {JSX.Element} Status chip component
 */
export const getStatusChip = (status, size = 'medium', sx = {}) => (
  <Chip
    label={getStatusLabel(status)}
    color={getStatusColor(status)}
    size={size}
    variant="outlined"
    sx={{
      fontWeight: 'bold',
      ...sx
    }}
  />
);

/**
 * Get status background color for cards
 * @param {string} status - Order status
 * @returns {string} Background color
 */
export const getStatusBgColor = (status) => {
  const bgColors = {
    pending: 'error.light',
    in_progress: 'warning.light',
    completed: 'success.light', 
    cancelled: 'grey.100'
  };
  return bgColors[status] || 'grey.100';
};

/**
 * Get status text color
 * @param {string} status - Order status  
 * @returns {string} Text color
 */
export const getStatusTextColor = (status) => {
  const textColors = {
    pending: 'error.dark',
    in_progress: 'warning.dark',
    completed: 'success.dark',
    cancelled: 'text.secondary'
  };
  return textColors[status] || 'text.secondary';
};