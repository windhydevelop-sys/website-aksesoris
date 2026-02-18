const dotenv = require('dotenv');
const path = require('path');
const mongoose = require('mongoose');
const TelegramBot = require('node-telegram-bot-api');

// Load env
const envPath = process.env.NODE_ENV === 'development'
  ? path.join(__dirname, '../.env.development')
  : path.join(__dirname, '../.env');
dotenv.config({ path: envPath });

const connectDB = require('../config/db');
const Product = require('../models/Product');
const TelegramUser = require('../models/TelegramUser');
const User = require('../models/User');

const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) {
  console.error('TELEGRAM_BOT_TOKEN is not defined in env');
  process.exit(1);
}
const bot = new TelegramBot(token);

const checkExpiredProducts = async () => {
  try {
    await connectDB();
    console.log('Database connected. Checking expired products...');

    const today = new Date();
    const thirtyDaysLater = new Date();
    thirtyDaysLater.setDate(today.getDate() + 30);

    // 1. Find all products that are already expired OR expiring within 30 days
    // We include products WITHOUT a status or with status !== 'cancelled'/'completed' if needed, 
    // but typically all active products should be checked.
    const products = await Product.find({
      expired: { $lte: thirtyDaysLater },
      status: { $ne: 'cancelled' }
    }).sort({ expired: 1 });

    if (products.length === 0) {
      console.log('No expiring products found.');
      return;
    }

    console.log(`Found ${products.length} expiring/expired products. Processing recipients...`);

    // 2. Fetch all Telegram-linked users
    const telegramLinks = await TelegramUser.find({ userId: { $exists: true, $ne: null } });
    if (telegramLinks.length === 0) {
      console.log('No Telegram-linked users found. Use /login in bot first.');
      return;
    }

    // 3. Fetch user details to separate Admins from Staff
    const linkedUserIds = telegramLinks.map(l => l.userId);
    const users = await User.find({ _id: { $in: linkedUserIds } });

    const admins = users.filter(u => u.role === 'admin');
    const staff = users.filter(u => u.role !== 'admin');

    // Map userId -> chatId
    const userToChatMap = {};
    telegramLinks.forEach(link => {
      userToChatMap[link.userId.toString()] = link.chatId;
    });

    // 4. Group products for recipients
    // Map chatId -> Set of products (to avoid duplicates if someone is an admin and a creator)
    const notificationQueue = {};

    const addToQueue = (chatId, product) => {
      if (!notificationQueue[chatId]) notificationQueue[chatId] = [];
      // Avoid adding same product twice to same person
      if (!notificationQueue[chatId].find(p => p._id.toString() === product._id.toString())) {
        notificationQueue[chatId].push(product);
      }
    };

    for (const product of products) {
      // A. Send to creator (if linked)
      if (product.createdBy) {
        const creatorChatId = userToChatMap[product.createdBy.toString()];
        if (creatorChatId) {
          addToQueue(creatorChatId, product);
        }
      }

      // B. Send ALL to Admins
      for (const admin of admins) {
        const adminChatId = userToChatMap[admin._id.toString()];
        if (adminChatId) {
          addToQueue(adminChatId, product);
        }
      }
    }

    // 5. Send summary messages
    console.log(`Distributing notifications to ${Object.keys(notificationQueue).length} chats...`);

    for (const [chatId, userProducts] of Object.entries(notificationQueue)) {
      let message = `⚠️ *PENGINGAT EXPIRED PRODUK* ⚠️\n`;
      message += `Halo, berikut adalah daftar produk yang perlu perhatian:\n\n`;

      userProducts.forEach((p, i) => {
        const isExpired = p.expired < today;
        const statusIcon = isExpired ? '🔴' : '🟡';
        const dateStr = p.expired ? p.expired.toLocaleDateString('id-ID') : 'N/A';

        message += `${i + 1}. ${statusIcon} *${p.nama || 'Tanpa Nama'}*\n`;
        message += `   - No. Order: \`${p.noOrder || '-'}\`\n`;
        message += `   - Expired: ${dateStr} ${isExpired ? '(SUDAH LEWAT)' : ''}\n\n`;
      });

      message += `_Mohon segera diperbarui agar tidak mengganggu operasional._`;

      try {
        await bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
        console.log(`Sent summary to chatId: ${chatId} (${userProducts.length} products)`);
      } catch (err) {
        console.error(`Failed to send message to ${chatId}:`, err.message);
      }

      // Small delay to avoid Telegram rate limits
      await new Promise(r => setTimeout(r, 200));
    }

    console.log('All notifications processed successfully.');

  } catch (error) {
    console.error('Execution error in checkExpiredProducts:', error);
  } finally {
    mongoose.connection.close();
  }
};

checkExpiredProducts();