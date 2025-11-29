const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  getHandphones,
  getHandphoneById,
  createHandphone,
  updateHandphone,
  deleteHandphone,
  assignToProduct,
  returnFromProduct
} = require('../controllers/handphoneController');

// Middleware to add user info to request
const addUserInfo = (req, res, next) => {
  req.userId = req.user ? req.user.id : null;
  next();
};

// Apply authentication to all routes
router.use(auth);
router.use(addUserInfo);

// GET /api/handphones - get all handphones
router.get('/', getHandphones);

// GET /api/handphones/:id - get handphone by ID
router.get('/:id', getHandphoneById);

// POST /api/handphones - create new handphone
router.post('/', createHandphone);

// PUT /api/handphones/:id - update handphone
router.put('/:id', updateHandphone);

// DELETE /api/handphones/:id - delete handphone
router.delete('/:id', deleteHandphone);

// PUT /api/handphones/:id/assign/:productId - assign handphone to product
router.put('/:id/assign/:productId', (req, res, next) => {
  // Move productId from params to body for controller compatibility
  req.body.productId = req.params.productId;
  next();
}, assignToProduct);

// PUT /api/handphones/:id/return - return handphone from product
router.put('/:id/return', returnFromProduct);

module.exports = router;