const mongoose = require('mongoose');

const RekeningDetailSchema = new mongoose.Schema(
  {
    // Basic identifiers
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    account: {
      type: String,
      enum: ['Rekening A', 'Rekening B'],
      required: true
    },
    
    // Bank Information
    namaBank: {
      type: String,
      required: true,
      trim: true,
      example: 'Bank Mandiri'
    },
    nomorRekening: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      sparse: true,
      example: '1234567890'
    },
    namaPemilik: {
      type: String,
      required: true,
      trim: true,
      example: 'PT. Aksesoris Indonesia'
    },
    cabang: {
      type: String,
      trim: true,
      example: 'Jakarta Pusat'
    },
    
    // Balance Information
    saldoAwal: {
      type: Number,
      default: 0,
      min: 0,
      description: 'Starting balance when account created'
    },
    saldoTerkini: {
      type: Number,
      default: 0,
      description: 'Current balance (auto-calculated from transactions)'
    },
    tanggalSaldoTerkini: {
      type: Date,
      default: Date.now,
      description: 'Last update of current balance'
    },
    
    // Status & Description
    status: {
      type: String,
      enum: ['aktif', 'nonaktif', 'archived'],
      default: 'aktif'
    },
    keterangan: {
      type: String,
      trim: true,
      maxlength: 500,
      example: 'Rekening utama untuk operasional harian'
    },
    
    // Additional Information
    tipeRekening: {
      type: String,
      enum: ['tabungan', 'giro', 'simpanan', 'lainnya'],
      default: 'tabungan'
    },
    mata_uang: {
      type: String,
      default: 'IDR',
      enum: ['IDR', 'USD', 'EUR', 'SGD']
    },
    
    // Tracking
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    lastModifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    lastModifiedAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true,
    collection: 'rekening_details'
  }
);

// Index for faster queries
RekeningDetailSchema.index({ userId: 1, account: 1 });
RekeningDetailSchema.index({ userId: 1, status: 1 });
RekeningDetailSchema.index({ nomorRekening: 1 });

// Virtual for display
RekeningDetailSchema.virtual('displayName').get(function() {
  return `${this.namaBank} - ${this.nomorRekening}`;
});

// Pre-save middleware
RekeningDetailSchema.pre('save', function(next) {
  this.lastModifiedAt = Date.now();
  next();
});

module.exports = mongoose.model('RekeningDetail', RekeningDetailSchema);
