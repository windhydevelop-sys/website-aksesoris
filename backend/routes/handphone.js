const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  getHandphones,
  getHandphoneById,
  createHandphone,
  updateHandphone,
  deleteHandphone,
  getProductsDetailsByHandphoneId
} = require('../controllers/handphones');

// Middleware to add user info to request
const addUserInfo = (req, res, next) => {
  req.userId = req.user ? req.user.id : null;
  next();
};

router.use((req, res, next) => {
  console.log(`Handphones router: Incoming request to ${req.method} ${req.originalUrl}`);
  next();
});

// Get all handphones
router.get('/', auth, addUserInfo, getHandphones);

// Get handphone by ID
router.get('/:id', auth, addUserInfo, getHandphoneById);

// Create new handphone
router.post('/', auth, addUserInfo, createHandphone);

// Update handphone
router.put('/:id', auth, addUserInfo, updateHandphone);

// Delete handphone
router.delete('/:id', auth, addUserInfo, deleteHandphone);

// Assign product to handphone
router.post('/:id/assign-product', auth, addUserInfo, async (req, res) => {
  try {
    const { productId } = req.body;
    const handphone = await require('../models/Handphone').findById(req.params.id);

    if (!handphone) {
      return res.status(404).json({
        success: false,
        error: 'Handphone not found'
      });
    }

    // Add product to assignedProducts if not already present
    if (!handphone.assignedProducts.includes(productId)) {
      handphone.assignedProducts.push(productId);
      console.log('Handphone object before save in assign-product:', handphone);
      await handphone.save();
    }

    res.json({
      success: true,
      message: 'Product assigned to handphone successfully'
    });
  } catch (error) {
    console.error('Error assigning product to handphone:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to assign product to handphone'
    });
  }
});

// Unassign product from handphone
router.delete('/:id/unassign-product/:productId', auth, addUserInfo, async (req, res) => {
  try {
    const { id: handphoneId, productId } = req.params;
    const handphone = await require('../models/Handphone').findById(handphoneId);

    if (!handphone) {
      return res.status(404).json({
        success: false,
        error: 'Handphone not found'
      });
    }

    // Remove product from assignedProducts
    handphone.assignedProducts = handphone.assignedProducts.filter(
      id => id.toString() !== productId
    );
    await handphone.save();

    res.json({
      success: true,
      message: 'Product unassigned from handphone successfully'
    });
  } catch (error) {
    console.error('Error unassigning product from handphone:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to unassign product from handphone'
    });
  }
});

// Get products details by nadarphone ID
router.get('/:id/products-details', auth, addUserInfo, getProductsDetailsByHandphoneId);

module.exports = router;