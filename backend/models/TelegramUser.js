const mongoose = require('mongoose');

const telegramUserSchema = mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', // Asumsi Anda memiliki model User
      required: false, // Mengubah ini menjadi false karena awalnya mungkin belum terhubung
      unique: false, // Mengubah ini menjadi false karena satu user bisa punya beberapa chat_id (misal dari grup) atau belum terhubung
    },
    chatId: {
      type: String,
      required: true,
      unique: true, // Setiap chat_id Telegram unik
    },
    username: {
      type: String,
    },
    firstName: {
      type: String,
    },
    lastName: {
      type: String,
    },
    isBot: {
      type: Boolean,
      default: false,
    },
    // Anda bisa menambahkan field lain dari objek 'from' Telegram jika diperlukan
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('TelegramUser', telegramUserSchema);