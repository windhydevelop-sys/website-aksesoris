const express = require('express');
const router = express.Router();
const { setWebhook, handleWebhook } = require('../controllers/telegramWordController');
const auth = require('../middleware/auth');
const { requireAdmin } = require('../middleware/auth');

router.get('/set-webhook', setWebhook);
router.post('/set-webhook', setWebhook);
router.post('/webhook', handleWebhook);

module.exports = router;
