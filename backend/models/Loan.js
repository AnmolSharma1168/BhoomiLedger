const mongoose = require('mongoose');

const loanSchema = new mongoose.Schema({
  loanId: { type: String, required: true, unique: true },
  parcel: { type: mongoose.Schema.Types.ObjectId, ref: 'Parcel', required: true },
  parcelId: { type: String, required: true },
  borrowerName: { type: String, required: true },
  borrowerWallet: { type: String, required: true },
  lenderName: { type: String, default: 'BhoomiLedger Finance' },
  principal: { type: Number, required: true },          // loan amount in INR
  interestRate: { type: Number, required: true },       // annual % rate
  tenureMonths: { type: Number, required: true },
  emiAmount: { type: Number, default: 0 },
  totalRepayable: { type: Number, default: 0 },
  amountPaid: { type: Number, default: 0 },
  status: {
    type: String,
    enum: ['active', 'repaid', 'defaulted', 'foreclosed'],
    default: 'active'
  },
  startDate: { type: Date, default: Date.now },
  endDate: { type: Date },
  txHash: { type: String, default: '' },
  borrowerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Loan', loanSchema);