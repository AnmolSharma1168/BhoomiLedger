const mongoose = require('mongoose');

const transferSchema = new mongoose.Schema({
  transferId: { type: String, required: true, unique: true },
  parcel: { type: mongoose.Schema.Types.ObjectId, ref: 'Parcel', required: true },
  parcelId: { type: String, required: true },
  seller: {
    name: String,
    walletAddress: String
  },
  buyer: {
    name: String,
    walletAddress: String
  },
  saleAmount: { type: Number, required: true },         // in INR
  stampDuty: { type: Number, default: 0 },
  registrationFee: { type: Number, default: 0 },
  status: {
    type: String,
    enum: ['initiated', 'documents_verified', 'payment_pending', 'payment_done', 'completed', 'cancelled'],
    default: 'initiated'
  },
  step: { type: Number, default: 1 },                  // 1-4 escrow steps
  txHash: { type: String, default: '' },
  notes: { type: String, default: '' },
  sellerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  buyerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  initiatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
  completedAt: { type: Date }
});

module.exports = mongoose.model('Transfer', transferSchema);