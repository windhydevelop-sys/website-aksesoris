const TelegramBot = require('node-telegram-bot-api');
const bcrypt = require('bcryptjs');
const TelegramUser = require('../models/TelegramUser');
const User = require('../models/User');
const FieldStaff = require('../models/FieldStaff');

const token = process.env.TELEGRAM_BOT_TOKEN;
const bot = new TelegramBot(token);

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

const setWebhook = async (req, res) => {
  const webhookUrl = req.body.url;
  if (!webhookUrl) {
    return res.status(400).json({ message: 'URL webhook diperlukan.' });
  }

  try {
    await bot.setWebhook(`${webhookUrl}/api/telegram/webhook`);
    res.status(200).json({ message: 'Webhook Telegram berhasil diatur.' });
  } catch (error) {
    console.error('Error setting Telegram webhook:', error);
    res.status(500).json({ message: 'Gagal mengatur webhook Telegram.', error: error.message });
  }
};

const askNextField = async (chatId, session) => {
  const steps = [
    'customer',
    'bank',
    'grade',
    'kcp',
    'nik',
    'nama'
  ];
  const currentIndex = session.sessionStep || 0;
  if (currentIndex >= steps.length) {
    await bot.sendMessage(chatId, 'Data dasar sudah dikumpulkan. Untuk melanjutkan kolom sensitif dan upload foto, silakan buka Form Web App.');
    await bot.sendMessage(chatId, 'Buka form:', {
      reply_markup: {
        inline_keyboard: [[
          { text: 'Buka Form Input Produk', web_app: { url: `${FRONTEND_URL}/telegram-form` } }
        ]]
      }
    });
    session.state = 'idle';
    session.sessionStep = 0;
    await session.save();
    return;
  }

  const field = steps[currentIndex];
  const labels = {
    customer: 'Masukkan nama Customer',
    bank: 'Masukkan nama Bank',
    grade: 'Masukkan Grade',
    kcp: 'Masukkan KCP',
    nik: 'Masukkan NIK 16 digit',
    nama: 'Masukkan Nama lengkap'
  };
  await bot.sendMessage(chatId, labels[field]);
};

const handleWebhook = async (req, res) => {
  const update = req.body;

  try {
    if (!update) {
      return res.status(200).send('No update');
    }

    if (update.callback_query) {
      const cq = update.callback_query;
      const chatId = cq.message.chat.id;
      const data = cq.data;
      let session = await TelegramUser.findOne({ chatId: String(chatId) });
      if (!session) {
        session = await TelegramUser.create({ chatId: String(chatId) });
      }

      if (data === 'start_chat_input') {
        session.state = 'collecting';
        session.formData = session.formData || {};
        session.sessionStep = 0;
        await session.save();
        await bot.sendMessage(chatId, 'Mulai input produk via chat. Jawab pertanyaan berikut.');
        await askNextField(chatId, session);
      }

      return res.status(200).send('Callback processed');
    }

    if (!update.message) {
      return res.status(200).send('No message update');
    }

    const message = update.message;
    const chatId = message.chat.id;
    const from = message.from;
    const text = message.text || '';

    let telegramUser = await TelegramUser.findOne({ chatId: String(chatId) });
    if (!telegramUser) {
      telegramUser = await TelegramUser.create({
        chatId: String(chatId),
        username: from.username,
        firstName: from.first_name,
        lastName: from.last_name,
        isBot: from.is_bot,
      });
    }

    if (text === '/start') {
      telegramUser.username = from.username;
      telegramUser.firstName = from.first_name;
      telegramUser.lastName = from.last_name;
      await telegramUser.save();

      telegramUser.state = 'awaiting_orlap_code';
      telegramUser.sessionStep = 0;
      telegramUser.formData = {};
      await telegramUser.save();
      await bot.sendMessage(chatId, 'Masukkan Kode Orlap Anda untuk melanjutkan.');

      return res.status(200).send('Webhook processed');
    }

    if (telegramUser.state === 'awaiting_orlap_code' && text && !text.startsWith('/')) {
      const kode = text.trim();
      const fs = await FieldStaff.findOne({ kodeOrlap: kode });
      if (!fs) {
        await bot.sendMessage(chatId, 'Kode Orlap tidak ditemukan. Coba lagi atau hubungi admin.');
        return res.status(200).send('Orlap code not found');
      }
      telegramUser.fieldStaffId = fs._id;
      telegramUser.kodeOrlap = fs.kodeOrlap;
      telegramUser.state = 'idle';
      await telegramUser.save();
      await bot.sendMessage(chatId, 'Autentikasi berhasil. Pilih metode input:', {
        reply_markup: {
          inline_keyboard: [
            [{ text: 'Buka Form Input Produk', web_app: { url: `${FRONTEND_URL}/telegram-form` } }],
            [{ text: 'Mulai Input via Chat', callback_data: 'start_chat_input' }]
          ]
        }
      });
      return res.status(200).send('Orlap authenticated');
    }

    if (text.startsWith('/login')) {
      const parts = text.split(' ');
      if (parts.length < 3) {
        await bot.sendMessage(chatId, 'Format login: /login email password');
        return res.status(200).send('Login format prompt');
      }
      const email = parts[1];
      const password = parts.slice(2).join(' ');
      const user = await User.findOne({ email });
      if (!user) {
        await bot.sendMessage(chatId, 'User tidak ditemukan.');
        return res.status(200).send('Login failed');
      }
      const ok = await bcrypt.compare(password, user.password);
      if (!ok) {
        await bot.sendMessage(chatId, 'Password salah.');
        return res.status(200).send('Login failed');
      }
      telegramUser.userId = user._id;
      await telegramUser.save();
      await bot.sendMessage(chatId, 'Login berhasil! Akun Telegram Anda terhubung.');
      return res.status(200).send('Login success');
    }

    if (telegramUser.state === 'collecting') {
      const steps = ['customer', 'bank', 'grade', 'kcp', 'nik', 'nama'];
      const idx = telegramUser.sessionStep || 0;
      const field = steps[idx];
      telegramUser.formData = telegramUser.formData || {};
      telegramUser.formData[field] = text;
      telegramUser.sessionStep = idx + 1;
      await telegramUser.save();
      await askNextField(chatId, telegramUser);
      return res.status(200).send('Collecting step');
    }

    await bot.sendMessage(chatId, 'Perintah tidak dikenal. Gunakan /start untuk memulai atau /login email password untuk menghubungkan akun.');
    return res.status(200).send('Default response');
  } catch (error) {
    console.error('Telegram webhook error:', error);
    if (update?.message?.chat?.id) {
      await bot.sendMessage(update.message.chat.id, 'Terjadi kesalahan. Coba lagi.');
    }
    return res.status(500).send('Error processing webhook');
  }
};

module.exports = {
  setWebhook,
  handleWebhook,
};
