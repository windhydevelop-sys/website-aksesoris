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
  handphoneAssignmentDate: { type: Date, default: Date.now }, // When handphone was assigned
  handphoneReturnDate: { type: Date }, // When handphone was returned
  // Encrypted sensitive fields
  pinAtm: { type: String, required: true },
  pinWondr: { type: String },
  passWondr: { type: String },
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
  complaint: { type: String }, // New field for complaints
  myBCAUser: { type: String },
  myBCAPassword: { type: String },
  myBCAPin: { type: String },
  brimoUser: { type: String },
  brimoPassword: { type: String },
  briMerchantUser: { type: String },
  briMerchantPassword: { type: String },
  // Generic bank credential fields
  mobileUser: { type: String },
  mobilePassword: { type: String },
  mobilePin: { type: String },
  ibUser: { type: String }, // Internet Banking user
  ibPassword: { type: String }, // Internet Banking password
  merchantUser: { type: String },
  merchantPassword: { type: String },
  // Bank-specific additions
  ocbcNyalaUser: { type: String },
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
    if (this.isModified('myBCAPassword')) {
      this.myBCAPassword = encrypt(this.myBCAPassword);
    }
    if (this.isModified('brimoPassword')) {
      this.brimoPassword = encrypt(this.brimoPassword);
    }
    if (this.isModified('briMerchantPassword')) {
      this.briMerchantPassword = encrypt(this.briMerchantPassword);
    }
    if (this.isModified('mobilePassword')) {
      this.mobilePassword = encrypt(this.mobilePassword);
    }
    if (this.isModified('ibPassword')) {
      this.ibPassword = encrypt(this.ibPassword);
    }
    if (this.isModified('merchantPassword')) {
      this.merchantPassword = encrypt(this.merchantPassword);
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
    if (update.myBCAPassword) {
      update.myBCAPassword = encrypt(update.myBCAPassword);
    }
    if (update.brimoPassword) {
      update.brimoPassword = encrypt(update.brimoPassword);
    }
    if (update.briMerchantPassword) {
      update.briMerchantPassword = encrypt(update.briMerchantPassword);
    }
    if (update.mobilePassword) {
      update.mobilePassword = encrypt(update.mobilePassword);
    }
    if (update.ibPassword) {
      update.ibPassword = encrypt(update.ibPassword);
    }
    if (update.merchantPassword) {
      update.merchantPassword = encrypt(update.merchantPassword);
    }
    next();
  } catch (error) {
    next(error);
  }
});

// Instance method to get decrypted data
productSchema.methods.getDecryptedData = function() {
  // Use toObject with virtuals and populated fields
  const decrypted = this.toObject({ virtuals: true, getters: true });

  try {
    decrypted.pinAtm = decrypt(this.pinAtm);
    decrypted.pinWondr = decrypt(this.pinWondr);
    decrypted.passWondr = decrypt(this.passWondr);
    decrypted.passEmail = decrypt(this.passEmail);
    if (this.myBCAPassword) decrypted.myBCAPassword = decrypt(this.myBCAPassword);
    if (this.brimoPassword) decrypted.brimoPassword = decrypt(this.brimoPassword);
    if (this.briMerchantPassword) decrypted.briMerchantPassword = decrypt(this.briMerchantPassword);
    if (this.mobilePassword) decrypted.mobilePassword = decrypt(this.mobilePassword);
    if (this.ibPassword) decrypted.ibPassword = decrypt(this.ibPassword);
    if (this.merchantPassword) decrypted.merchantPassword = decrypt(this.merchantPassword);
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
