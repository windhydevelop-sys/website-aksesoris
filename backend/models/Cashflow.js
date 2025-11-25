const mongoose = require('mongoose');

const cashflowSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['income', 'expense'],
    required: true
  },
  category: {
    type: String,
    required: true,
    trim: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  description: {
    type: String,
    trim: true
  },
  date: {
    type: Date,
    default: Date.now
  },
  reference: {
    type: String,
    trim: true
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'transfer', 'credit_card', 'debit_card', 'other'],
    default: 'cash'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  lastModifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Index for better query performance
cashflowSchema.index({ type: 1 });
cashflowSchema.index({ category: 1 });
cashflowSchema.index({ date: -1 });
cashflowSchema.index({ createdBy: 1 });
cashflowSchema.index({ createdAt: -1 });

// Virtual for formatted amount
cashflowSchema.virtual('formattedAmount').get(function() {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR'
  }).format(this.amount);
});

// Pre-save middleware
cashflowSchema.pre('save', function(next) {
  if (!this.date) {
    this.date = new Date();
  }
  next();
});

module.exports = mongoose.model('Cashflow', cashflowSchema);