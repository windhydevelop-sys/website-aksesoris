const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { setWebhook, handleWebhook } = require('../controllers/telegramController');
const TelegramUser = require('../models/TelegramUser');
const { createProduct } = require('../controllers/products');

router.get('/set-webhook', setWebhook);
router.post('/set-webhook', setWebhook);

router.post('/webhook', handleWebhook);

const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `secure_${uniqueSuffix}${ext}`);
  }
});

const uploadOptional = multer({
  storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5242880,
    files: 2
  }
}).fields([{ name: 'uploadFotoId', maxCount: 1 }, { name: 'uploadFotoSelfie', maxCount: 1 }]);

const handleFileUpload = (req, res, next) => {
  if (req.headers['content-type'] && req.headers['content-type'].includes('multipart/form-data')) {
    uploadOptional(req, res, (err) => {
      if (err) return next(err);
      req.files = req.files || {};
      next();
    });
  } else {
    req.files = {};
    next();
  }
};

const telegramAuth = async (req, res, next) => {
  try {
    const userIdHeader = req.header('X-Telegram-User-Id') || req.header('X-Telegram-Chat-Id');
    if (!userIdHeader) {
      return res.status(401).json({ success: false, error: 'Missing Telegram user id header' });
    }
    const telegramUser = await TelegramUser.findOne({ chatId: String(userIdHeader) });
    if (!telegramUser || !telegramUser.kodeOrlap) {
      return res.status(401).json({ success: false, error: 'Telegram user not authenticated via Orlap' });
    }
    req.telegramUser = telegramUser;
    req.userId = telegramUser.userId || null;
    req.body = req.body || {};
    req.body.codeAgen = telegramUser.kodeOrlap;
    next();
  } catch (err) {
    console.error('Telegram auth error:', err);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

router.post('/products', telegramAuth, handleFileUpload, createProduct);

module.exports = router;
