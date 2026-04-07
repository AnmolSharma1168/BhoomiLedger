const express = require("express");
const router = express.Router();
const { v4: uuidv4 } = require("uuid");
const Inheritance = require("../models/Inheritance");
const Parcel = require("../models/Parcel");
const auth = require("../middleware/auth");
const blockchain = require("../services/blockchainService");

router.get("/", auth.protect, async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    let query = {};
    
    // Restrict citizens to their own wills (where they are the testator)
    if (req.user.role === 'user') {
      query.$or = [
        { testatorId: req.user._id },
        { testatorWallet: req.user.walletAddress }
      ];
    }
    
    if (status) {
      if (query.$or) {
        query = { $and: [{ status }, { $or: query.$or }] };
      } else {
        query.status = status;
      }
    }
    
    const total = await Inheritance.countDocuments(query);
    const wills = await Inheritance.find(query).sort({ createdAt: -1 }).skip((Number(page)-1)*Number(limit)).limit(Number(limit));
    res.json({ success: true, total, wills });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.get("/:id", auth.protect, async (req, res) => {
  try {
    const will = await Inheritance.findOne({ willId: req.params.id });
    if (!will) return res.status(404).json({ success: false, message: "Will not found" });
    // Restrict citizens to their own wills
    if (req.user.role === 'user') {
      const isTestator = will.testatorId && will.testatorId.toString() === req.user._id.toString();
      const walletMatch = will.testatorWallet && will.testatorWallet === req.user.walletAddress;
      if (!isTestator && !walletMatch) {
        return res.status(403).json({ success: false, message: "Not authorized to view this will" });
      }
    }
    res.json({ success: true, will });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.post("/", auth.protect, auth.adminOnly, async (req, res) => {
  try {
    const { testatorName, testatorWallet, testatorEmail, parcelIds, beneficiaries, executionCondition, executionDate, notes } = req.body;
    const totalShare = beneficiaries.reduce((sum, b) => sum + b.sharePercent, 0);
    if (Math.round(totalShare) !== 100) return res.status(400).json({ success: false, message: "Shares must total 100%" });
    
    // Find testator user ID if email provided
    let testatorId = null;
    if (testatorEmail) {
      const User = require("../models/User");
      const testator = await User.findOne({ email: testatorEmail });
      if (testator) testatorId = testator._id;
    }
    
    const parcels = await Parcel.find({ parcelId: { $in: parcelIds } });
    const will = await Inheritance.create({ willId: "WILL-" + uuidv4().slice(0,8).toUpperCase(), testatorName, testatorWallet, testatorId, parcels: parcels.map(p => p._id), parcelIds, beneficiaries, executionCondition, executionDate: executionDate || null, notes, createdBy: req.user._id });
    
    // Register will on blockchain
    const beneficiaryWallets = beneficiaries.map(b => b.wallet || "0x0000000000000000000000000000000000000000");
    const beneficiaryNames = beneficiaries.map(b => b.name);
    const shares = beneficiaries.map(b => b.sharePercent);
    const chainResult = await blockchain.registerWillOnChain(will.willId, testatorWallet || "0x0000000000000000000000000000000000000000", parcelIds, beneficiaryWallets, beneficiaryNames, shares);
    will.txHash = chainResult.txHash || "pending";
    will.tokenId = will.willId;
    await will.save();
    
    res.status(201).json({ success: true, will });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.patch("/:id/execute", auth.protect, auth.adminOnly, async (req, res) => {
  try {
    const will = await Inheritance.findOne({ willId: req.params.id });
    if (!will || will.status !== "active") return res.status(400).json({ success: false, message: "Will not found or not active" });
    
    // Execute will on blockchain
    const chainResult = await blockchain.executeWillOnChain(will.willId);
    
    will.status = "executed";
    will.txHash = chainResult.txHash || will.txHash;
    will.executedAt = new Date();
    await will.save();
    res.json({ success: true, will });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.patch("/:id/revoke", auth.protect, auth.adminOnly, async (req, res) => {
  try {
    const will = await Inheritance.findOneAndUpdate({ willId: req.params.id, status: "active" }, { status: "revoked" }, { new: true });
    if (!will) return res.status(404).json({ success: false, message: "Active will not found" });
    res.json({ success: true, will });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;