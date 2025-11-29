const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { getHandphoneAssignmentSummary, getProductsByHandphone } = require('../utils/handphoneAssignment');
const { auditLog } = require('../utils/audit');

// Get handphone assignment summary for field staff
router.get('/field-staff/:fieldStaffId', auth, async (req, res) => {
  try {
    const { fieldStaffId } = req.params;

    // Verify user has access to this field staff data
    // For now, allow admin or if field staff matches user's assigned field staff
    if (req.user.role !== 'admin' && req.user.fieldStaff !== fieldStaffId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    const summary = await getHandphoneAssignmentSummary(fieldStaffId);

    auditLog('READ', req.user.userId, 'Handphone', 'assignment_summary', {
      fieldStaffId,
      totalHandphones: summary.totalHandphones
    }, req);

    res.json({
      success: true,
      data: summary
    });

  } catch (error) {
    console.error('Error getting handphone assignment summary:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get handphone assignment summary'
    });
  }
});

// Get products handled by a specific handphone
router.get('/:handphoneId/products', auth, async (req, res) => {
  try {
    const { handphoneId } = req.params;

    const products = await getProductsByHandphone(handphoneId);

    auditLog('READ', req.user.userId, 'Handphone', handphoneId, {
      action: 'get_products',
      productCount: products.length
    }, req);

    res.json({
      success: true,
      data: products
    });

  } catch (error) {
    console.error('Error getting products by handphone:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get products by handphone'
    });
  }
});

module.exports = router;