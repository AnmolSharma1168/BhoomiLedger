const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const auth = require("../middleware/auth");
const DocumentRequest = require("../models/DocumentRequest");
const Parcel = require("../models/Parcel");
const User = require("../models/User");

// Multer configuration for document uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = "uploads/documents";
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext).replace(/\s+/g, '-');
    cb(null, `${Date.now()}-${name}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB
  fileFilter: (req, file, cb) => {
    const allowed = [".pdf", ".jpg", ".jpeg", ".png", ".webp"];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) cb(null, true);
    else cb(new Error("Only PDF and images allowed"));
  },
});

// ==================== CITIZEN ROUTES ====================

// Upload document for property
router.post("/upload", auth.protect, upload.single("document"), async (req, res) => {
  try {
    const { parcelId, documentName, documentType } = req.body;
    
    if (!req.file) return res.status(400).json({ success: false, message: "No file uploaded" });
    if (!parcelId || !documentName) return res.status(400).json({ success: false, message: "Missing required fields" });
    
    // Check if parcel exists and belongs to user
    const parcel = await Parcel.findOne({ parcelId });
    if (!parcel) return res.status(404).json({ success: false, message: "Property not found" });
    
    const isOwner = 
      (parcel.ownerId && parcel.ownerId.toString() === req.user._id.toString()) ||
      (parcel.ownerEmail === req.user.email) ||
      (parcel.ownerName === req.user.name);
    
    if (!isOwner) {
      // Delete uploaded file
      fs.unlink(req.file.path, () => {});
      return res.status(403).json({ success: false, message: "You can only upload documents for your own properties" });
    }
    
    // Create document request
    const docRequest = await DocumentRequest.create({
      parcelId,
      ownerId: req.user._id,
      ownerName: req.user.name,
      ownerEmail: req.user.email,
      documentName,
      documentType: documentType || "other",
      documentUrl: req.file.path,
      documentSize: req.file.size
    });
    
    res.status(201).json({
      success: true,
      message: "Document uploaded successfully. Awaiting admin approval.",
      documentRequest: docRequest
    });
  } catch (err) {
    // Delete uploaded file on error
    if (req.file) fs.unlink(req.file.path, () => {});
    res.status(500).json({ success: false, message: err.message });
  }
});

// Get user's document requests
router.get("/my-requests", auth.protect, async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    let query = { ownerId: req.user._id };
    
    if (status) query.status = status;
    
    const total = await DocumentRequest.countDocuments(query);
    const requests = await DocumentRequest.find(query)
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));
    
    res.json({ success: true, total, requests });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Download document
router.get("/download/:id", auth.protect, async (req, res) => {
  try {
    const docRequest = await DocumentRequest.findById(req.params.id);
    if (!docRequest) return res.status(404).json({ success: false, message: "Document not found" });
    
    // Only owner or admin can download
    const isOwner = docRequest.ownerId.toString() === req.user._id.toString();
    const isAdmin = req.user.role === "admin";
    
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }
    
    // Check if file exists
    if (!fs.existsSync(docRequest.documentUrl)) {
      return res.status(404).json({ success: false, message: "File not found" });
    }
    
    res.download(docRequest.documentUrl);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ==================== ADMIN ROUTES ====================

// Get all pending document requests
router.get("/admin/pending", auth.protect, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Only admins can access this" });
    }
    
    const { page = 1, limit = 20, search } = req.query;
    let query = { status: "pending" };
    
    if (search) {
      query.$or = [
        { parcelId: { $regex: search, $options: "i" } },
        { ownerName: { $regex: search, $options: "i" } },
        { ownerEmail: { $regex: search, $options: "i" } }
      ];
    }
    
    const total = await DocumentRequest.countDocuments(query);
    const requests = await DocumentRequest.find(query)
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));
    
    res.json({ success: true, total, requests });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Get all document requests (with all statuses)
router.get("/admin/all", auth.protect, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Only admins can access this" });
    }
    
    const { page = 1, limit = 20, status, search } = req.query;
    let query = {};
    
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { parcelId: { $regex: search, $options: "i" } },
        { ownerName: { $regex: search, $options: "i" } },
        { ownerEmail: { $regex: search, $options: "i" } }
      ];
    }
    
    const total = await DocumentRequest.countDocuments(query);
    const requests = await DocumentRequest.find(query)
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));
    
    res.json({ success: true, total, requests });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Approve document
router.post("/admin/approve/:id", auth.protect, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Only admins can approve documents" });
    }
    
    const docRequest = await DocumentRequest.findById(req.params.id);
    if (!docRequest) return res.status(404).json({ success: false, message: "Document request not found" });
    
    if (docRequest.status !== "pending") {
      return res.status(400).json({ success: false, message: `Cannot approve ${docRequest.status} request` });
    }
    
    // Update document request
    docRequest.status = "approved";
    docRequest.approvedBy = req.user._id;
    docRequest.approvedAt = new Date();
    docRequest.updatedAt = new Date();
    await docRequest.save();
    
    // Add document to parcel
    const parcel = await Parcel.findOne({ parcelId: docRequest.parcelId });
    if (parcel) {
      // Check if document already exists
      const exists = parcel.documents.some(doc => doc.url === docRequest.documentUrl);
      if (!exists) {
        parcel.documents.push({
          name: docRequest.documentName,
          url: docRequest.documentUrl,
          type: docRequest.documentType,
          approvedAt: new Date()
        });
        await parcel.save();
      }
    }
    
    res.json({
      success: true,
      message: "Document approved and linked to property",
      documentRequest: docRequest
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Reject document
router.post("/admin/reject/:id", auth.protect, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Only admins can reject documents" });
    }
    
    const { rejectionReason } = req.body;
    if (!rejectionReason) return res.status(400).json({ success: false, message: "Rejection reason required" });
    
    const docRequest = await DocumentRequest.findById(req.params.id);
    if (!docRequest) return res.status(404).json({ success: false, message: "Document request not found" });
    
    if (docRequest.status !== "pending") {
      return res.status(400).json({ success: false, message: `Cannot reject ${docRequest.status} request` });
    }
    
    // Update document request
    docRequest.status = "rejected";
    docRequest.rejectionReason = rejectionReason;
    docRequest.rejectedAt = new Date();
    docRequest.updatedAt = new Date();
    await docRequest.save();
    
    // Delete file
    if (fs.existsSync(docRequest.documentUrl)) {
      fs.unlinkSync(docRequest.documentUrl);
    }
    
    res.json({
      success: true,
      message: "Document rejected",
      documentRequest: docRequest
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Get statistics for admin dashboard
router.get("/admin/stats", auth.protect, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Only admins can access this" });
    }
    
    const pending = await DocumentRequest.countDocuments({ status: "pending" });
    const approved = await DocumentRequest.countDocuments({ status: "approved" });
    const rejected = await DocumentRequest.countDocuments({ status: "rejected" });
    
    res.json({
      success: true,
      stats: {
        pending,
        approved,
        rejected,
        total: pending + approved + rejected
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
