const dotenv = require('dotenv');
const connectDB = require('../config/db');
const Product = require('../models/Product');
const TelegramUser = require('../models/TelegramUser');
const mongoose = require('mongoose');
const TelegramBot = require('node-telegram-bot-api'); // Import TelegramBot

dotenv.config();

const token = process.env.TELEGRAM_BOT_TOKEN;
const bot = new TelegramBot(token); // Inisialisasi bot

const checkExpiredProducts = async () => {
  await connectDB();

  try {
    const today = new Date();
    const thirtyDaysLater = new Date();
    thirtyDaysLater.setDate(today.getDate() + 30);

    const expiringProducts = await Product.find({
      expired: {
        $lte: thirtyDaysLater,
        $gt: today,
      },
    });

    if (expiringProducts.length > 0) {
      console.log(`Ditemukan ${expiringProducts.length} produk yang akan kedaluwarsa dalam 30 hari:`);

      // Ambil semua chat_id pengguna Telegram yang terdaftar
      const telegramUsers = await TelegramUser.find({});
      const chatIds = telegramUsers.map(user => user.chatId);

      if (chatIds.length === 0) {
        console.log('Tidak ada pengguna Telegram yang terdaftar untuk menerima notifikasi.');
        return;
      }

      for (const product of expiringProducts) {
        const daysRemaining = Math.ceil((product.expired.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        const message = `🔔 *Notifikasi Kedaluwarsa Produk!* 🔔\n\nProduk *${product.nama}* (No. Order: ${product.noOrder}) akan kedaluwarsa pada *${product.expired.toDateString()}*.\nSisa waktu: *${daysRemaining}* hari.\n\nMohon segera lakukan tindakan yang diperlukan.`;

        console.log(`- Produk: ${product.nama} (ID: ${product._id}), Kedaluwarsa: ${product.expired.toDateString()}, Sisa Hari: ${daysRemaining}`);

        // Kirim notifikasi ke setiap pengguna Telegram yang terdaftar
        for (const chatId of chatIds) {
          try {
            await bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
            console.log(`Notifikasi terkirim untuk produk ${product.nama} ke chat ID: ${chatId}`);
          } catch (telegramError) {
            console.error(`Gagal mengirim notifikasi Telegram ke ${chatId} untuk produk ${product.nama}:`, telegramError.message);
          }
        }
      }
    } else {
      console.log('Tidak ada produk yang akan kedaluwarsa dalam 30 hari ke depan.');
    }
  } catch (error) {
    console.error('Error saat memeriksa produk kedaluwarsa:', error);
  } finally {
    mongoose.connection.close();
  }
};

checkExpiredProducts();