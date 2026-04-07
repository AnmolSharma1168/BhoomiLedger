const mongoose = require('mongoose');

const inheritanceSchema = new mongoose.Schema({
  willId: { type: String, required: true, unique: true },
  testatorName: { type: String, required: true },
  testatorWallet: { type: String, required: true },
  parcels: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Parcel' }],
  parcelIds: [String],
  beneficiaries: [{
    name: { type: String, required: true },
    walletAddress: { type: String, required: true },
    relation: { type: String, default: '' },
    sharePercent: { type: Number, required: true }
  }],
  executionCondition: { type: String, enum: ['on_death', 'on_date', 'manual'], default: 'on_death' },
  executionDate: { type: Date },
  status: { type: String, enum: ['active', 'executed', 'revoked', 'disputed'], default: 'active' },
  txHash: { type: String, default: '' },
  notes: { type: String, default: '' },
  testatorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
  executedAt: { type: Date }
});

module.exports = mongoose.model('Inheritance', inheritanceSchema);
