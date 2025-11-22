const express = require('express');
const router = express.Router();
const { setWebhook, handleWebhook } = require('../controllers/telegramController');

// Route untuk mengatur webhook Telegram (hanya perlu dipanggil sekali)
router.post('/set-webhook', setWebhook);

// Route untuk menerima update dari Telegram
router.post('/webhook', handleWebhook);

module.exports = router;