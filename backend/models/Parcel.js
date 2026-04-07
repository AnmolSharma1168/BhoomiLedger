const mongoose = require('mongoose');

const parcelSchema = new mongoose.Schema({
  parcelId: { type: String, required: true, unique: true },
  ownerName: { type: String, required: true },
  ownerAddress: { type: String, required: true },      // wallet address
  location: {
    district: { type: String, required: true },
    village: { type: String, required: true },
    surveyNumber: { type: String, required: true },
    taluk: { type: String, default: '' },
    state: { type: String, default: 'Karnataka' }
  },
  area: {
    value: { type: Number, required: true },
    unit: { type: String, enum: ['acres', 'hectares', 'sq_ft', 'sq_m'], default: 'acres' }
  },
  landType: { type: String, enum: ['agricultural', 'residential', 'commercial', 'industrial', 'forest'], default: 'agricultural' },
  marketValue: { type: Number, default: 0 },           // in INR
  status: { type: String, enum: ['active', 'under_transfer', 'disputed', 'mortgaged'], default: 'active' },
  tokenId: { type: String, default: '' },              // NFT token ID on blockchain
  txHash: { type: String, default: '' },               // blockchain tx hash
  documents: [{ name: String, url: String }],
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  ownerEmail: { type: String, default: '' },
  registeredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  registeredAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Parcel', parcelSchema);