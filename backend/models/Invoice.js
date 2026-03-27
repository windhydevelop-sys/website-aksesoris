const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema({
  // Invoice Identification
  invoiceNo: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    description: 'Nomor invoice unik (auto-generated)'
  },
  
  // Reference to Product
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
    description: 'Reference ke Product yang di-invoice'
  },
  
  // Invoice Details
  amount: {
    type: Number,
    required: true,
    min: 0,
    description: 'Jumlah tagihan'
  },
  
  customerName: {
    type: String,
    required: true,
    description: 'Nama pelanggan'
  },
  
  customerNik: {
    type: String,
    required: false,
    description: 'NIK pelanggan'
  },
  
  bank: {
    type: String,
    required: false,
    description: 'Bank tujuan'
  },
  
  noRek: {
    type: String,
    required: false,
    description: 'Nomor rekening pelanggan'
  },
  
  // Dates
  invoiceDate: {
    type: Date,
    default: Date.now,
    description: 'Tanggal invoice dibuat'
  },
  
  dueDate: {
    type: Date,
    required: false,
    description: 'Tanggal jatuh tempo'
  },
  
  paidDate: {
    type: Date,
    required: false,
    description: 'Tanggal pembayaran'
  },
  
  // Status
  status: {
    type: String,
    enum: ['draft', 'issued', 'paid', 'overdue', 'cancelled'],
    default: 'draft',
    description: 'Status invoice'
  },
  
  // Description & Notes
  description: {
    type: String,
    required: false,
    description: 'Deskripsi layanan/produk'
  },
  
  notes: {
    type: String,
    required: false,
    description: 'Catatan tambahan'
  },
  
  // Audit fields
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    description: 'User yang membuat invoice'
  },
  
  lastModifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    description: 'User terakhir yang modifikasi'
  }
  
}, { timestamps: true, collection: 'invoices' });

// Index untuk pencarian cepat
invoiceSchema.index({ invoiceNo: 1 });
invoiceSchema.index({ productId: 1 });
invoiceSchema.index({ status: 1 });
invoiceSchema.index({ invoiceDate: -1 });
invoiceSchema.index({ createdBy: 1 });

// Middleware untuk update lastModifiedBy
invoiceSchema.pre('findOneAndUpdate', function(next) {
  this.set({ lastModifiedBy: this.getOptions().new });
  next();
});

// Instance method untuk generate invoice number
invoiceSchema.statics.generateInvoiceNo = async function() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  
  // Format: INV-YYYYMM-XXXXX
  const prefix = `INV-${year}${month}`;
  
  // Count invoices created today
  const count = await this.countDocuments({
    invoiceNo: new RegExp(`^${prefix}`)
  });
  
  const sequence = String(count + 1).padStart(5, '0');
  return `${prefix}-${sequence}`;
};

// Instance method untuk mark as paid
invoiceSchema.methods.markAsPaid = function() {
  this.status = 'paid';
  this.paidDate = new Date();
  return this.save();
};

// Instance method untuk mark as issued
invoiceSchema.methods.markAsIssued = function() {
  this.status = 'issued';
  return this.save();
};

module.exports = mongoose.model('Invoice', invoiceSchema);
