const TelegramBot = require('node-telegram-bot-api');
const TelegramUser = require('../models/TelegramUser');
const User = require('../models/User'); // Asumsi model User Anda ada di sini

const token = process.env.TELEGRAM_BOT_TOKEN;
const bot = new TelegramBot(token); // Tidak perlu polling di sini karena kita pakai webhook

// Fungsi untuk mengatur webhook
const setWebhook = async (req, res) => {
  const webhookUrl = req.body.url; // URL publik backend Anda
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

// Fungsi untuk menangani update dari Telegram
const handleWebhook = async (req, res) => {
  const update = req.body;

  if (!update || !update.message) {
    return res.status(200).send('No message update');
  }

  const message = update.message;
  const chatId = message.chat.id;
  const from = message.from; // Informasi pengirim

  // Tangani perintah /start
  if (message.text === '/start') {
    try {
      // Cek apakah chat_id sudah ada
      let telegramUser = await TelegramUser.findOne({ chatId });

      if (!telegramUser) {
        // Jika belum ada, buat entri baru
        telegramUser = await TelegramUser.create({
          // userId: null, // Akan diisi nanti setelah user teridentifikasi
          chatId: String(chatId), // Pastikan tipe data string
          username: from.username,
          firstName: from.first_name,
          lastName: from.last_name,
          isBot: from.is_bot,
        });
        await bot.sendMessage(chatId, 'Halo! Anda telah berhasil mengaktifkan notifikasi kedaluwarsa produk. Kami akan memberitahu Anda jika ada produk yang akan kedaluwarsa.');
        console.log(`New Telegram user registered: ${chatId}`);
      } else {
        // Jika sudah ada, update info jika perlu
        telegramUser.username = from.username;
        telegramUser.firstName = from.first_name;
        telegramUser.lastName = from.last_name;
        await telegramUser.save();
        await bot.sendMessage(chatId, 'Anda sudah terdaftar untuk notifikasi. Terima kasih!');
        console.log(`Existing Telegram user updated: ${chatId}`);
      }

      res.status(200).send('Webhook processed');

    } catch (error) {
      console.error('Error handling /start command:', error);
      await bot.sendMessage(chatId, 'Maaf, terjadi kesalahan saat mendaftarkan Anda untuk notifikasi.');
      res.status(500).send('Error processing webhook');
    }
  } else {
    // Tangani pesan lain jika diperlukan
    await bot.sendMessage(chatId, 'Maaf, saya hanya bisa memproses perintah /start untuk saat ini.');
    res.status(200).send('Webhook processed (other message)');
  }
};

module.exports = {
  setWebhook,
  handleWebhook,
};