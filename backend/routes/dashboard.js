const express = require("express");
const router = express.Router();
const Parcel = require("../models/Parcel");
const Transfer = require("../models/Transfer");
const Loan = require("../models/Loan");
const Inheritance = require("../models/Inheritance");
const auth = require("../middleware/auth");

router.get("/stats", auth.protect, async (req, res) => {
  try {
    const [totalParcels, activeParcels, underTransfer, mortgaged, totalTransfers, completedTransfers, activeLoans, loanAgg, activeWills, executedWills, recentTransfers] = await Promise.all([
      Parcel.countDocuments(),
      Parcel.countDocuments({ status: "active" }),
      Parcel.countDocuments({ status: "under_transfer" }),
      Parcel.countDocuments({ status: "mortgaged" }),
      Transfer.countDocuments(),
      Transfer.countDocuments({ status: "completed" }),
      Loan.countDocuments({ status: "active" }),
      Loan.aggregate([{ $match: { status: "active" } }, { $group: { _id: null, total: { $sum: "$principal" } } }]),
      Inheritance.countDocuments({ status: "active" }),
      Inheritance.countDocuments({ status: "executed" }),
      Transfer.find().sort({ createdAt: -1 }).limit(10).select("transferId parcelId seller buyer saleAmount status createdAt")
    ]);
    res.json({ success: true, stats: { parcels: { total: totalParcels, active: activeParcels, underTransfer, mortgaged }, transfers: { total: totalTransfers, completed: completedTransfers }, loans: { active: activeLoans, totalValue: loanAgg[0] ? loanAgg[0].total : 0 }, wills: { active: activeWills, executed: executedWills } }, recentTransfers });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;