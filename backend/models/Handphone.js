const mongoose = require('mongoose');

const handphoneSchema = new mongoose.Schema({
  merek: { type: String, required: true },
  tipe: { type: String, required: true },
  imei: { type: String, unique: true, sparse: true }, // optional but unique if provided
  spesifikasi: { type: String, required: true },
  kepemilikan: { type: String, required: true },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'FieldStaff', required: true },
  status: { type: String, enum: ['available', 'assigned', 'in_use', 'maintenance'], default: 'available' },
  currentProduct: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' }, // optional
  assignmentHistory: [{
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    assignedAt: { type: Date, required: true },
    returnedAt: { type: Date }
  }]
}, { timestamps: true });

// Indexes for performance
handphoneSchema.index({ assignedTo: 1 });
handphoneSchema.index({ status: 1 });
handphoneSchema.index({ imei: 1 }); // already indexed due to unique, but explicit

module.exports = mongoose.model('Handphone', handphoneSchema);