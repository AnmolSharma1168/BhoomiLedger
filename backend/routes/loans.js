const express = require("express");
const router = express.Router();
const { v4: uuidv4 } = require("uuid");
const Loan = require("../models/Loan");
const Parcel = require("../models/Parcel");
const auth = require("../middleware/auth");
const blockchain = require("../services/blockchainService");

function calcEMI(principal, annualRate, months) {
  const r = annualRate / 12 / 100;
  if (r === 0) return Math.round(principal / months);
  return Math.round((principal * r * Math.pow(1+r,months)) / (Math.pow(1+r,months)-1));
}

router.get("/", auth.protect, async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    let query = status ? { status } : {};
    
    // For citizen users, ONLY show their own loans
    if (req.user.role === 'user') {
      query.$or = [
        { borrowerId: req.user._id },
        { borrowerWallet: req.user.walletAddress }
      ];
      // If there was a status filter, wrap it properly
      if (status) {
        query = { $and: [{ status }, { $or: query.$or }] };
      }
    }
    
    const total = await Loan.countDocuments(query);
    const loans = await Loan.find(query).sort({ createdAt: -1 }).skip((Number(page)-1)*Number(limit)).limit(Number(limit));
    res.json({ success: true, total, loans });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.get("/:id", auth.protect, async (req, res) => {
  try {
    const loan = await Loan.findOne({ loanId: req.params.id });
    if (!loan) return res.status(404).json({ success: false, message: "Loan not found" });
    // Restrict citizens to their own loans
    if (req.user.role === 'user') {
      const isBorrower = loan.borrowerId && loan.borrowerId.toString() === req.user._id.toString();
      const walletMatch = loan.borrowerWallet && loan.borrowerWallet === req.user.walletAddress;
      if (!isBorrower && !walletMatch) {
        return res.status(403).json({ success: false, message: "Not authorized to view this loan" });
      }
    }
    res.json({ success: true, loan });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.post("/", auth.protect, auth.adminOnly, async (req, res) => {
  try {
    const { parcelId, borrowerName, borrowerWallet, borrowerEmail, principal, interestRate, tenureMonths } = req.body;
    const parcel = await Parcel.findOne({ parcelId });
    if (!parcel) return res.status(404).json({ success: false, message: "Parcel not found" });
    
    // Find borrower user ID if email provided
    let borrowerId = null;
    if (borrowerEmail) {
      const User = require("../models/User");
      const borrower = await User.findOne({ email: borrowerEmail });
      if (borrower) borrowerId = borrower._id;
    }
    
    const emiAmount = calcEMI(principal, interestRate, tenureMonths);
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + tenureMonths);
    const loan = await Loan.create({ loanId: "LN-" + uuidv4().slice(0,8).toUpperCase(), parcel: parcel._id, parcelId, borrowerName, borrowerWallet, borrowerId, principal, interestRate, tenureMonths, emiAmount, totalRepayable: emiAmount * tenureMonths, endDate, createdBy: req.user._id });
    
    // Create loan on blockchain
    const chainResult = await blockchain.createLoanOnChain(loan.loanId, parcelId, borrowerWallet || "0x0000000000000000000000000000000000000000", principal, interestRate, tenureMonths, emiAmount);
    loan.txHash = chainResult.txHash || "pending";
    loan.tokenId = loan.loanId;
    await loan.save();
    
    const { sendMail, templates } = require("../utils/mailer");
    sendMail(req.user.email, templates.loanCreated(loan.loanId, loan.borrowerName, loan.principal, loan.emiAmount));
    parcel.status = "mortgaged";
    await parcel.save();
    res.status(201).json({ success: true, loan });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.patch("/:id/repay", auth.protect, auth.adminOnly, async (req, res) => {
  try {
    const loan = await Loan.findOne({ loanId: req.params.id });
    if (!loan) return res.status(404).json({ success: false, message: "Loan not found" });
    
    // Record repayment on blockchain
    const chainResult = await blockchain.recordLoanRepaymentOnChain(loan.loanId, req.body.amount);
    
    loan.amountPaid += req.body.amount;
    loan.txHash = chainResult.txHash || loan.txHash;
    
    if (loan.amountPaid >= loan.totalRepayable) {
      loan.status = "repaid";
      const parcel = await Parcel.findOne({ parcelId: loan.parcelId });
      if (parcel) { parcel.status = "active"; await parcel.save(); }
    }
    await loan.save();
    res.json({ success: true, loan });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;