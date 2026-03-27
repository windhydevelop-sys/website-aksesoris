const mongoose = require('mongoose');
const { encrypt, decrypt, hashSensitive } = require('../utils/encryption');

const productSchema = new mongoose.Schema({
  noOrder: { type: String, required: false },
  jenisRekening: { type: String, required: false }, // New field for BRI Account Type
  codeAgen: { type: String, required: false },
  bank: { type: String, required: false },
  grade: { type: String, required: false },
  kcp: { type: String, required: false },
  nik: { type: String, required: false },
  nama: { type: String, required: false },
  namaIbuKandung: { type: String, required: false },
  tempatTanggalLahir: { type: String, required: false },
  noRek: { type: String, required: false },
  sisaSaldo: { type: String }, // New optional field for remaining balance
  noAtm: { type: String, required: false },
  validThru: { type: String, required: false },
  noHp: { type: String, required: false },
  handphone: { type: String }, // New field for handphone
  imeiHandphone: { type: String }, // New field for IMEI handphone
  handphoneId: { type: mongoose.Schema.Types.ObjectId, ref: 'Handphone' }, // Optional reference to Handphone
  handphoneAssignmentDate: { type: Date, default: Date.now }, // When handphone was assigned
  handphoneReturnDate: { type: Date }, // When handphone was returned
  // Encrypted sensitive fields
  pinAtm: { type: String, required: false },
  pinWondr: { type: String },
  passWondr: { type: String },
  email: { type: String, required: false },
  passEmail: { type: String, required: false },
  expired: { type: Date }, // Optional
  uploadFotoId: { type: String }, // path to file
  uploadFotoSelfie: { type: String }, // path to file
  // Security fields
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  lastModifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  customer: { type: String },
  fieldStaff: { type: String }, // New field for field staff
  orderNumber: { type: String }, // New field for order number
  complaint: { type: String }, // New field for complaints
  myBCAUser: { type: String },
  myBCAPassword: { type: String },
  myBCAPin: { type: String },
  brimoUser: { type: String },
  brimoPassword: { type: String },
  briMerchantUser: { type: String },
  briMerchantPassword: { type: String },
  // Specific for BCA
  kodeAkses: { type: String },
  pinMBca: { type: String },
  // Generic bank credential fields
  mobileUser: { type: String },
  mobilePassword: { type: String },
  mobilePin: { type: String },
  ibUser: { type: String }, // Internet Banking user
  ibPassword: { type: String }, // Internet Banking password
  ibPin: { type: String }, // Internet Banking PIN (New Field)
  merchantUser: { type: String },
  merchantPassword: { type: String },
  ocbcNyalaUser: { type: String },
  ocbcNyalaPassword: { type: String },
  ocbcNyalaPin: { type: String },
  
  // Payment & Invoicing Fields
  harga: {
    type: Number,
    required: false,
    description: 'Harga produk/layanan (legacy)'
  },
  hargaBeli: {
    type: Number,
    required: false,
    default: 0,
    description: 'Biaya/Harga Beli dari Orlap (Hutang)'
  },
  hargaJual: {
    type: Number,
    required: false,
    default: 0,
    description: 'Tagihan/Harga Jual ke Customer (Piutang)'
  },
  pembayaranHutangStatus: {
    type: String,
    enum: ['unpaid', 'paid'],
    default: 'unpaid',
    description: 'Status pembayaran ke Orlap'
  },
  pembayaranPiutangStatus: {
    type: String,
    enum: ['unpaid', 'paid'],
    default: 'unpaid',
    description: 'Status pembayaran dari Customer'
  },
  account: {
    type: String,
    enum: ['Rekening A', 'Rekening B', '-'],
    default: '-',
    description: 'Rekening utama penampung'
  },
  pembayaranHutangAccount: {
    type: String,
    enum: ['Rekening A', 'Rekening B', 'cash', '-'],
    default: '-',
    description: 'Rekening yang digunakan bayar ke Orlap'
  },
  pembayaranPiutangAccount: {
    type: String,
    enum: ['Rekening A', 'Rekening B', 'cash', '-'],
    default: '-',
    description: 'Rekening penerima dari Customer'
  },
  sudahBayar: {
    type: Boolean,
    default: false,
    description: 'Status pembayaran produk'
  },
  rekeningId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RekeningDetail',
    required: false,
    description: 'Rekening yang digunakan untuk pembayaran'
  },
  invoiceNo: {
    type: String,
    required: false,
    unique: true,
    sparse: true,
    description: 'Nomor invoice'
  },
  invoiceDate: {
    type: Date,
    required: false,
    description: 'Tanggal invoice dibuat'
  },
  paymentDate: {
    type: Date,
    required: false,
    description: 'Tanggal pembayaran'
  },
  
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'completed', 'cancelled'],
    default: 'pending'
  }, // New field for product status
  source: {
    type: String,
    enum: ['web', 'telegram', 'import'],
    default: 'web'
  }
}, { timestamps: true });

// Pre-save middleware to encrypt sensitive data
productSchema.pre('save', function (next) {
  try {
    // Encrypt sensitive fields before saving
    if (this.isModified('pinAtm')) {
      this.pinAtm = encrypt(this.pinAtm);
    }
    if (this.isModified('pinWondr')) {
      this.pinWondr = encrypt(this.pinWondr);
    }
    if (this.isModified('passWondr')) {
      this.passWondr = encrypt(this.passWondr);
    }
    if (this.isModified('passEmail')) {
      this.passEmail = encrypt(this.passEmail);
    }
    if (this.isModified('myBCAUser')) {
      this.myBCAUser = encrypt(this.myBCAUser);
    }
    if (this.isModified('myBCAPassword')) {
      this.myBCAPassword = encrypt(this.myBCAPassword);
    }
    if (this.isModified('myBCAPin')) {
      this.myBCAPin = encrypt(this.myBCAPin);
    }
    if (this.isModified('brimoUser')) {
      this.brimoUser = encrypt(this.brimoUser);
    }
    if (this.isModified('brimoPassword')) {
      this.brimoPassword = encrypt(this.brimoPassword);
    }
    if (this.isModified('briMerchantUser')) {
      this.briMerchantUser = encrypt(this.briMerchantUser);
    }
    if (this.isModified('briMerchantPassword')) {
      this.briMerchantPassword = encrypt(this.briMerchantPassword);
    }
    if (this.isModified('kodeAkses')) {
      this.kodeAkses = encrypt(this.kodeAkses);
    }
    if (this.isModified('pinMBca')) {
      this.pinMBca = encrypt(this.pinMBca);
    }
    if (this.isModified('mobileUser')) {
      this.mobileUser = encrypt(this.mobileUser);
    }
    if (this.isModified('mobilePassword')) {
      this.mobilePassword = encrypt(this.mobilePassword);
    }
    if (this.isModified('mobilePin')) {
      this.mobilePin = encrypt(this.mobilePin);
    }
    if (this.isModified('ibUser')) {
      this.ibUser = encrypt(this.ibUser);
    }
    if (this.isModified('ibPassword')) {
      this.ibPassword = encrypt(this.ibPassword);
    }
    if (this.isModified('ibPin')) {
      this.ibPin = encrypt(this.ibPin);
    }
    if (this.isModified('merchantUser')) {
      this.merchantUser = encrypt(this.merchantUser);
    }
    if (this.isModified('merchantPassword')) {
      this.merchantPassword = encrypt(this.merchantPassword);
    }
    if (this.isModified('ocbcNyalaUser')) {
      this.ocbcNyalaUser = encrypt(this.ocbcNyalaUser);
    }
    if (this.isModified('ocbcNyalaPassword')) {
      this.ocbcNyalaPassword = encrypt(this.ocbcNyalaPassword);
    }
    if (this.isModified('ocbcNyalaPin')) {
      this.ocbcNyalaPin = encrypt(this.ocbcNyalaPin);
    }
    next();
  } catch (error) {
    next(error);
  }
});

// Pre-update middleware for findOneAndUpdate operations
productSchema.pre('findOneAndUpdate', function (next) {
  try {
    const update = this.getUpdate();
    if (update.pinAtm) {
      update.pinAtm = encrypt(update.pinAtm);
    }
    if (update.pinWondr) {
      update.pinWondr = encrypt(update.pinWondr);
    }
    if (update.passWondr) {
      update.passWondr = encrypt(update.passWondr);
    }
    if (update.passEmail) {
      update.passEmail = encrypt(update.passEmail);
    }
    if (update.myBCAUser) {
      update.myBCAUser = encrypt(update.myBCAUser);
    }
    if (update.myBCAPassword) {
      update.myBCAPassword = encrypt(update.myBCAPassword);
    }
    if (update.myBCAPin) {
      update.myBCAPin = encrypt(update.myBCAPin);
    }
    if (update.brimoUser) {
      update.brimoUser = encrypt(update.brimoUser);
    }
    if (update.brimoPassword) {
      update.brimoPassword = encrypt(update.brimoPassword);
    }
    if (update.briMerchantUser) {
      update.briMerchantUser = encrypt(update.briMerchantUser);
    }
    if (update.briMerchantPassword) {
      update.briMerchantPassword = encrypt(update.briMerchantPassword);
    }
    if (update.kodeAkses) {
      update.kodeAkses = encrypt(update.kodeAkses);
    }
    if (update.pinMBca) {
      update.pinMBca = encrypt(update.pinMBca);
    }
    if (update.mobileUser) {
      update.mobileUser = encrypt(update.mobileUser);
    }
    if (update.mobilePassword) {
      update.mobilePassword = encrypt(update.mobilePassword);
    }
    if (update.mobilePin) {
      update.mobilePin = encrypt(update.mobilePin);
    }
    if (update.ibUser) {
      update.ibUser = encrypt(update.ibUser);
    }
    if (update.ibPassword) {
      update.ibPassword = encrypt(update.ibPassword);
    }
    if (update.ibPin) {
      update.ibPin = encrypt(update.ibPin);
    }
    if (update.merchantUser) {
      update.merchantUser = encrypt(update.merchantUser);
    }
    if (update.merchantPassword) {
      update.merchantPassword = encrypt(update.merchantPassword);
    }
    if (update.ocbcNyalaUser) {
      update.ocbcNyalaUser = encrypt(update.ocbcNyalaUser);
    }
    if (update.ocbcNyalaPassword) {
      update.ocbcNyalaPassword = encrypt(update.ocbcNyalaPassword);
    }
    if (update.ocbcNyalaPin) {
      update.ocbcNyalaPin = encrypt(update.ocbcNyalaPin);
    }
    next();
  } catch (error) {
    next(error);
  }
});

// Instance method to get decrypted data
productSchema.methods.getDecryptedData = function () {
  // Use toObject with virtuals and populated fields
  const decrypted = this.toObject({ virtuals: true, getters: true });

  const fieldsToDecrypt = [
    'pinAtm', 'pinWondr', 'passWondr', 'passEmail',
    'myBCAUser', 'myBCAPassword', 'myBCAPin',
    'brimoUser', 'brimoPassword', 'briMerchantUser', 'briMerchantPassword',
    'kodeAkses', 'pinMBca',
    'mobileUser', 'mobilePassword', 'mobilePin',
    'ibUser', 'ibPassword', 'ibPin',
    'merchantUser', 'merchantPassword',
    'ocbcNyalaUser', 'ocbcNyalaPassword', 'ocbcNyalaPin'
  ];

  fieldsToDecrypt.forEach(field => {
    if (this[field]) {
      try {
        const decryptedValue = decrypt(this[field]);
        // Verify decryption was successful (not the same as input)
        if (decryptedValue !== this[field] || !decryptedValue.startsWith('U2FsdGVkX1')) {
          decrypted[field] = decryptedValue;
        } else {
          // Decryption failed silently, log it
          console.warn(`[DECRYPT FAIL] Field "${field}" could not be decrypted. Value starts with U2FsdGVkX1.`);
          decrypted[field] = this[field];
        }
      } catch (e) {
        console.error(`[DECRYPT ERROR] Field "${field}": ${e.message}`);
        decrypted[field] = this[field]; // Fallback to raw value
      }
    }
  });

  return decrypted;
};

// Static method to find and decrypt
productSchema.statics.findDecrypted = async function (query) {
  const products = await this.find(query);
  return products.map(product => product.getDecryptedData());
};

// Static method to find one and decrypt
productSchema.statics.findOneDecrypted = async function (query) {
  const product = await this.findOne(query);
  return product ? product.getDecryptedData() : null;
};

module.exports = mongoose.model('Product', productSchema);
