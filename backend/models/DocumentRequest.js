const mongoose = require('mongoose');

const documentRequestSchema = new mongoose.Schema({
  parcelId: { type: String, required: true },           // Property ID
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  ownerName: { type: String, required: true },
  ownerEmail: { type: String, required: true },
  documentName: { type: String, required: true },       // e.g., "Title Deed"
  documentType: { type: String, enum: ['title_deed', 'survey_report', 'tax_receipt', 'ownership_proof', 'other'], default: 'other' },
  documentUrl: { type: String, required: true },        // File path
  documentSize: { type: Number, default: 0 },          // File size in bytes
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  rejectionReason: { type: String, default: '' },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  approvedAt: { type: Date, default: null },
  rejectedAt: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('DocumentRequest', documentRequestSchema);
