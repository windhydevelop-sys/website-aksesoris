const mongoose = require('mongoose');

const productPaymentSchema = new mongoose.Schema({
  // Reference to Product
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
    description: 'Reference ke Product yang dibayar'
  },
  
  // Payment Details
  amount: {
    type: Number,
    required: true,
    min: 0,
    description: 'Jumlah pembayaran'
  },
  
  rekeningId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RekeningDetail',
    required: true,
    description: 'Rekening yang menerima pembayaran'
  },
  
  rekeningName: {
    type: String,
    required: false,
    description: 'Nama rekening (snapshot saat pembayaran)'
  },
  
  // Reference to Cashflow Entry
  cashflowId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Cashflow',
    required: false,
    description: 'Reference ke Cashflow entry (jika sudah tercatat)'
  },
  
  // Status
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'rejected'],
    default: 'pending',
    description: 'Status pembayaran'
  },
  
  // Dates
  paymentDate: {
    type: Date,
    default: Date.now,
    description: 'Tanggal pembayaran dicatat'
  },
  
  confirmedDate: {
    type: Date,
    required: false,
    description: 'Tanggal pembayaran dikonfirmasi'
  },
  
  // Additional Info
  paymentMethod: {
    type: String,
    enum: ['cash', 'transfer', 'credit_card', 'debit_card', 'check', 'other'],
    default: 'transfer',
    description: 'Metode pembayaran'
  },
  
  referenceNo: {
    type: String,
    required: false,
    description: 'Nomor referensi (invoice, no transfer, etc)'
  },
  
  notes: {
    type: String,
    required: false,
    description: 'Catatan tambahan tentang pembayaran'
  },
  
  // Audit fields
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    description: 'User yang mencatat pembayaran'
  },
  
  confirmedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false,
    description: 'User yang mengkonfirmasi pembayaran'
  },
  
  lastModifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false,
    description: 'User terakhir yang modifikasi'
  }
  
}, { timestamps: true, collection: 'product_payments' });

// Index untuk pencarian cepat
productPaymentSchema.index({ productId: 1 });
productPaymentSchema.index({ rekeningId: 1 });
productPaymentSchema.index({ status: 1 });
productPaymentSchema.index({ paymentDate: -1 });
productPaymentSchema.index({ createdBy: 1 });

// Middleware untuk update lastModifiedBy
productPaymentSchema.pre('findOneAndUpdate', function(next) {
  this.set({ lastModifiedBy: this.getOptions().new });
  next();
});

// Instance method untuk confirm payment
productPaymentSchema.methods.confirmPayment = function(userId) {
  this.status = 'confirmed';
  this.confirmedDate = new Date();
  this.confirmedBy = userId;
  return this.save();
};

// Instance method untuk reject payment
productPaymentSchema.methods.rejectPayment = function() {
  this.status = 'rejected';
  return this.save();
};

module.exports = mongoose.model('ProductPayment', productPaymentSchema);
