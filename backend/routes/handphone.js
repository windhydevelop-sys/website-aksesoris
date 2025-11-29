const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  getHandphones,
  getHandphoneById,
  createHandphone,
  updateHandphone,
  deleteHandphone
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

module.exports = router;