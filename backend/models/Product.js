const mongoose = require('mongoose');
const { encrypt, decrypt, hashSensitive } = require('../utils/encryption');

const productSchema = new mongoose.Schema({
  noOrder: { type: String, required: true },
  codeAgen: { type: String, required: true },
  bank: { type: String, required: true },
  grade: { type: String, required: true },
  kcp: { type: String, required: true },
  nik: { type: String, required: true },
  nama: { type: String, required: true },
  namaIbuKandung: { type: String, required: true },
  tempatTanggalLahir: { type: String, required: true },
  noRek: { type: String, required: true },
  sisaSaldo: { type: String }, // New optional field for remaining balance
  noAtm: { type: String, required: true },
  validThru: { type: String, required: true },
  noHp: { type: String, required: true },
  handphone: { type: String }, // New field for handphone
  imeiHandphone: { type: String }, // New field for IMEI handphone
  handphoneId: { type: mongoose.Schema.Types.ObjectId, ref: 'Handphone' }, // Optional reference to Handphone
  // Encrypted sensitive fields
  pinAtm: { type: String, required: true },
  pinWondr: { type: String, required: true },
  passWondr: { type: String, required: true },
  email: { type: String, required: true },
  passEmail: { type: String, required: true },
  expired: { type: Date, required: true },
  uploadFotoId: { type: String }, // path to file
  uploadFotoSelfie: { type: String }, // path to file
  // Security fields
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  lastModifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  customer: { type: String },
  fieldStaff: { type: String }, // New field for field staff
  orderNumber: { type: String }, // New field for order number
  status: { type: String, enum: ['pending', 'in_progress', 'completed'], default: 'pending' },
  complaint: { type: String }, // New field for complaints
  harga: { type: Number }, // New field for product price
}, { timestamps: true });

// Pre-save middleware to encrypt sensitive data
productSchema.pre('save', function(next) {
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
    next();
  } catch (error) {
    next(error);
  }
});

// Pre-update middleware for findOneAndUpdate operations
productSchema.pre('findOneAndUpdate', function(next) {
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
    next();
  } catch (error) {
    next(error);
  }
});

// Instance method to get decrypted data
productSchema.methods.getDecryptedData = function() {
  const decrypted = this.toObject();

  try {
    decrypted.pinAtm = decrypt(this.pinAtm);
    decrypted.pinWondr = decrypt(this.pinWondr);
    decrypted.passWondr = decrypt(this.passWondr);
    decrypted.passEmail = decrypt(this.passEmail);
  } catch (error) {
    console.error('Error decrypting data:', error);
    // Return encrypted data if decryption fails
  }

  return decrypted;
};

// Static method to find and decrypt
productSchema.statics.findDecrypted = async function(query) {
  const products = await this.find(query);
  return products.map(product => product.getDecryptedData());
};

// Static method to find one and decrypt
productSchema.statics.findOneDecrypted = async function(query) {
  const product = await this.findOne(query);
  return product ? product.getDecryptedData() : null;
};

module.exports = mongoose.model('Product', productSchema);