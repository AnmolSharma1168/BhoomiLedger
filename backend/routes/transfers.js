const express = require("express");
const router = express.Router();
const { v4: uuidv4 } = require("uuid");
const Transfer = require("../models/Transfer");
const Parcel = require("../models/Parcel");
const auth = require("../middleware/auth");
const blockchain = require("../services/blockchainService");

router.get("/", auth.protect, async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    let query = {};
    
    // Restrict citizens to transfers where they are seller or buyer
    if (req.user.role === 'user') {
      query.$or = [
        { sellerId: req.user._id },
        { buyerId: req.user._id }
      ];
    }
    
    if (status) {
      if (query.$or) {
        query = { $and: [{ status }, { $or: query.$or }] };
      } else {
        query.status = status;
      }
    }
    
    const total = await Transfer.countDocuments(query);
    const transfers = await Transfer.find(query).sort({ createdAt: -1 }).skip((Number(page)-1)*Number(limit)).limit(Number(limit));
    res.json({ success: true, total, transfers });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.get("/:id", auth.protect, async (req, res) => {
  try {
    const transfer = await Transfer.findOne({ transferId: req.params.id });
    if (!transfer) return res.status(404).json({ success: false, message: "Transfer not found" });
    // Restrict citizens to transfers where they are seller or buyer
    if (req.user.role === 'user') {
      const isSeller = transfer.sellerId && transfer.sellerId.toString() === req.user._id.toString();
      const isBuyer = transfer.buyerId && transfer.buyerId.toString() === req.user._id.toString();
      if (!isSeller && !isBuyer) {
        return res.status(403).json({ success: false, message: "Not authorized to view this transfer" });
      }
    }
    res.json({ success: true, transfer });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.post("/", auth.protect, auth.adminOnly, async (req, res) => {
  try {
    const { parcelId, seller, buyer, sellerEmail, buyerEmail, saleAmount } = req.body;
    const parcel = await Parcel.findOne({ parcelId });
    if (!parcel) return res.status(404).json({ success: false, message: "Parcel not found" });
    if (parcel.status === "under_transfer") return res.status(400).json({ success: false, message: "Parcel already under transfer" });
    
    // Find seller and buyer user IDs
    const User = require("../models/User");
    let sellerId = null, buyerId = null;
    if (sellerEmail) {
      const sellerUser = await User.findOne({ email: sellerEmail });
      if (sellerUser) sellerId = sellerUser._id;
    }
    if (buyerEmail) {
      const buyerUser = await User.findOne({ email: buyerEmail });
      if (buyerUser) buyerId = buyerUser._id;
    }
    
    const transfer = await Transfer.create({ transferId: "TRF-" + uuidv4().slice(0,8).toUpperCase(), parcel: parcel._id, parcelId, seller, buyer, sellerId, buyerId, saleAmount, stampDuty: Math.round(saleAmount*0.05), registrationFee: Math.round(saleAmount*0.01), initiatedBy: req.user._id });
    
    // Initiate transfer on blockchain
    const chainResult = await blockchain.initiateTransferOnChain(transfer.transferId, parcelId, seller.walletAddress || "0x0000000000000000000000000000000000000000", buyer.walletAddress || "0x0000000000000000000000000000000000000000", saleAmount);
    transfer.txHash = chainResult.txHash || "pending";
    transfer.tokenId = transfer.transferId;
    await transfer.save();
    
    const { sendMail, templates } = require("../utils/mailer");
    sendMail(req.user.email, templates.transferInitiated(transfer.transferId, transfer.parcelId, transfer.seller.name, transfer.buyer.name, transfer.saleAmount));
    parcel.status = "under_transfer";
    await parcel.save();
    res.status(201).json({ success: true, transfer });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.patch("/:id/step", auth.protect, auth.adminOnly, async (req, res) => {
  try {
    const { step, status, txHash } = req.body;
    const transfer = await Transfer.findOne({ transferId: req.params.id });
    if (!transfer) return res.status(404).json({ success: false, message: "Transfer not found" });
    
    // Advance transfer on blockchain
    const chainResult = await blockchain.advanceTransferOnChain(transfer.transferId, status);
    
    transfer.step = step;
    transfer.status = status;
    transfer.txHash = chainResult.txHash || txHash;
    
    if (status === "completed") {
      transfer.completedAt = new Date();
      const parcel = await Parcel.findOne({ parcelId: transfer.parcelId });
      const { sendMail, templates } = require("../utils/mailer");
      sendMail(req.user.email, templates.transferCompleted(transfer.transferId, transfer.parcelId, transfer.buyer.name));
      if (parcel) { parcel.ownerName = transfer.buyer.name; parcel.ownerAddress = transfer.buyer.walletAddress; parcel.status = "active"; await parcel.save(); }
    }
    await transfer.save();
    res.json({ success: true, transfer });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;