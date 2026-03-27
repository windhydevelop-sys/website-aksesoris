const mongoose = require('mongoose');

const cashflowSchema = new mongoose.Schema({
  // Transaction Type & Category
  type: {
    type: String,
    enum: ['income', 'expense'],
    required: true
  },
  category: {
    type: String,
    required: true,
    trim: true,
    example: 'Penjualan, Gaji, Sewa, Transportasi, dll'
  },
  
  // Amount & Description
  amount: {
    type: Number,
    required: true,
    min: 0,
    description: 'Nominal transaksi'
  },
  description: {
    type: String,
    trim: true,
    description: 'Deskripsi detail transaksi'
  },
  
  // Date & Reference
  date: {
    type: Date,
    default: Date.now,
    description: 'Tanggal transaksi'
  },
  reference: {
    type: String,
    trim: true,
    description: 'Nomor referensi atau invoice'
  },
  
  // Product Reference (for tracking sync with inventory)
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    sparse: true,
    description: 'Link ke produk (jika ada)'
  },
  
  // Account Selection (Rekening A atau B)
  account: {
    type: String,
    enum: ['Rekening A', 'Rekening B'],
    default: 'Rekening A',
    description: 'Rekening mana yang digunakan'
  },
  
  // Payment Method
  paymentMethod: {
    type: String,
    enum: ['cash', 'transfer', 'credit_card', 'debit_card', 'other'],
    default: 'cash',
    description: 'Metode pembayaran'
  },
  
  // Audit Fields
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    description: 'User yang membuat transaksi'
  },
  lastModifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    description: 'User terakhir yang edit'
  }
}, {
  timestamps: true,
  collection: 'cashflows'
});

// Set debit/credit based on type for proper double-entry accounting
cashflowSchema.pre('save', function(next) {
  // Set debit/credit based on type if not explicitly set
  if (this.type === 'income' && this.debit === 0 && this.credit === 0) {
    // Pemasukan: Kas bertambah (Debit), Pendapatan bertambah (Credit)
    this.debit = this.amount;
    this.credit = this.amount;
  } else if (this.type === 'expense' && this.debit === 0 && this.credit === 0) {
    // Pengeluaran: Beban bertambah (Debit), Kas berkurang (Credit)
    this.debit = this.amount;
    this.credit = this.amount;
  }

  // Update journal description if not set
  if (!this.journalDescription) {
    if (this.type === 'income') {
      this.journalDescription = `Pemasukan: ${this.category}`;
    } else if (this.type === 'expense') {
      this.journalDescription = `Pengeluaran: ${this.category}`;
    }
  }

  // Set default account based on type
  if (this.type === 'income') {
    this.accountCode = this.accountCode || '1101'; // Kas
    this.accountName = this.accountName || 'Kas';
  } else if (this.type === 'expense') {
    this.accountCode = this.accountCode || '1101'; // Kas
    this.accountName = this.accountName || 'Kas';
  }

  next();
});

// Index for better query performance
cashflowSchema.index({ type: 1 });
cashflowSchema.index({ category: 1 });
cashflowSchema.index({ date: -1 });
cashflowSchema.index({ createdBy: 1 });
cashflowSchema.index({ createdAt: -1 });
cashflowSchema.index({ accountCode: 1 });
cashflowSchema.index({ debit: 1 });
cashflowSchema.index({ credit: 1 });
cashflowSchema.index({ productId: 1 }); // For idempotency
cashflowSchema.index({ account: 1 }); // For multi-account support
cashflowSchema.index({ isDebt: 1 }); // For debt tracking

// Virtual for formatted amount
cashflowSchema.virtual('formattedAmount').get(function() {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR'
  }).format(this.amount);
});

// Virtual for formatted debit
cashflowSchema.virtual('formattedDebit').get(function() {
  return this.debit > 0 ? new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR'
  }).format(this.debit) : '-';
});

// Virtual for formatted credit
cashflowSchema.virtual('formattedCredit').get(function() {
  return this.credit > 0 ? new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR'
  }).format(this.credit) : '-';
});

// Virtual for net balance (debit - credit)
cashflowSchema.virtual('netBalance').get(function() {
  return this.debit - this.credit;
});

// Virtual for formatted net balance
cashflowSchema.virtual('formattedNetBalance').get(function() {
  const balance = this.netBalance;
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR'
  }).format(Math.abs(balance));
});

// Date will be set automatically by schema default

module.exports = mongoose.model('Cashflow', cashflowSchema);