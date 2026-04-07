const express = require("express");
const router = express.Router();
const { v4: uuidv4 } = require("uuid");
const Parcel = require("../models/Parcel");
const auth = require("../middleware/auth");
const blockchain = require("../services/blockchainService");

const multer = require("multer");
const path = require("path");
const fs = require("fs");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = "uploads/parcels";
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${req.params.id}-${Date.now()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowed = [".pdf", ".jpg", ".jpeg", ".png", ".webp"];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) cb(null, true);
    else cb(new Error("Only PDF and images allowed"));
  },
});

router.get("/", auth.protect, async (req, res) => {
  try {
    const { search, status, landType, page = 1, limit = 20 } = req.query;
    let query = {};
    
    // For citizen users, ONLY show their own parcels
    if (req.user.role === 'user') {
      // Match by: userId OR email OR owner name (case-insensitive)
      query = {
        $or: [
          { ownerId: req.user._id },
          { ownerEmail: { $regex: `^${req.user.email}$`, $options: "i" } },
          { ownerName: { $regex: `^${req.user.name}$`, $options: "i" } }
        ]
      };
    }
    
    // Apply search filter (AND with existing filters)
    if (search) {
      const searchFilter = { $or: [{ parcelId: { $regex: search, $options: "i" } }, { ownerName: { $regex: search, $options: "i" } }] };
      if (query.$or) {
        query = { $and: [query, searchFilter] };
      } else {
        query = { ...query, ...searchFilter };
      }
    }
    
    if (status) query.status = status;
    if (landType) query.landType = landType;
    
    const total = await Parcel.countDocuments(query);
    const parcels = await Parcel.find(query).sort({ registeredAt: -1 }).skip((Number(page)-1)*Number(limit)).limit(Number(limit));
    res.json({ success: true, total, parcels });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.get("/:id", auth.protect, async (req, res) => {
  try {
    const parcel = await Parcel.findOne({ parcelId: req.params.id });
    if (!parcel) return res.status(404).json({ success: false, message: "Parcel not found" });
    // Restrict citizens to their own parcels
    if (req.user.role === 'user') {
      const isOwner = parcel.ownerId && parcel.ownerId.toString() === req.user._id.toString();
      const emailMatch = parcel.ownerEmail && parcel.ownerEmail === req.user.email;
      const nameMatch = parcel.ownerName && parcel.ownerName === req.user.name;
      if (!isOwner && !emailMatch && !nameMatch) {
        return res.status(403).json({ success: false, message: "Not authorized to view this parcel" });
      }
    }
    res.json({ success: true, parcel });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.post("/", auth.protect, auth.adminOnly, async (req, res) => {
  try {
    const { ownerName, ownerAddress, ownerEmail, location, area, landType, marketValue } = req.body;
    
    // Validate email
    if (!ownerEmail || !ownerEmail.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      return res.status(400).json({ success: false, message: "Valid owner email is required" });
    }
    
    // If ownerEmail provided, find the user and link them
    let ownerId = null;
    if (ownerEmail) {
      const User = require("../models/User");
      const owner = await User.findOne({ email: ownerEmail });
      if (owner) ownerId = owner._id;
    }
    const parcel = await Parcel.create({ parcelId: "BL-" + uuidv4().slice(0,8).toUpperCase(), ownerName, ownerAddress, ownerEmail: ownerEmail.toLowerCase(), ownerId, location, area, landType, marketValue, registeredBy: req.user._id });
    
    // Register on blockchain
    console.log("📝 Registering parcel on blockchain:", parcel.parcelId);
    const chainResult = await blockchain.registerParcelOnChain(parcel.parcelId, ownerName, ownerAddress || "0x0000000000000000000000000000000000000000", JSON.stringify(location), area.value, landType, marketValue);
    console.log("📦 Blockchain result:", chainResult);
    parcel.txHash = chainResult?.txHash || "pending";
    console.log("✅ Parcel txHash set to:", parcel.txHash);
    parcel.tokenId = parcel.parcelId;
    await parcel.save();
    
    const { sendMail, templates } = require("../utils/mailer");
    sendMail(req.user.email, templates.parcelRegistered(parcel.parcelId, parcel.ownerName));
    res.status(201).json({ success: true, parcel });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.patch("/:id", auth.protect, auth.adminOnly, async (req, res) => {
  try {
    const parcel = await Parcel.findOneAndUpdate({ parcelId: req.params.id }, { ...req.body, updatedAt: Date.now() }, { new: true });
    if (!parcel) return res.status(404).json({ success: false, message: "Parcel not found" });
    res.json({ success: true, parcel });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.delete("/:id", auth.protect, auth.adminOnly, async (req, res) => {
  try {
    const parcel = await Parcel.findOneAndDelete({ parcelId: req.params.id });
    if (!parcel) return res.status(404).json({ success: false, message: "Parcel not found" });
    res.json({ success: true, message: "Parcel deleted" });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// POST /api/parcels/:id/documents
router.post("/:id/documents", auth.protect, auth.adminOnly, upload.single("document"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: "No file uploaded" });
    const parcel = await Parcel.findOne({ parcelId: req.params.id });
    if (!parcel) return res.status(404).json({ success: false, message: "Parcel not found" });

    const doc = {
      name: req.body.docName || req.file.originalname,
      url: `/uploads/parcels/${req.file.filename}`,
    };
    parcel.documents.push(doc);
    await parcel.save();

    res.json({ success: true, document: doc, documents: parcel.documents });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/parcels/:id/documents/:docIndex
router.delete("/:id/documents/:docIndex", auth.protect, auth.adminOnly, async (req, res) => {
  try {
    const parcel = await Parcel.findOne({ parcelId: req.params.id });
    if (!parcel) return res.status(404).json({ success: false, message: "Parcel not found" });

    const idx = Number(req.params.docIndex);
    const doc = parcel.documents[idx];
    if (!doc) return res.status(404).json({ success: false, message: "Document not found" });

    // Delete file from disk
    const filePath = "." + doc.url;
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    parcel.documents.splice(idx, 1);
    await parcel.save();

    res.json({ success: true, documents: parcel.documents });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});
module.exports = router;