const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const auth = require("../middleware/auth");
const { sendMail, templates } = require("../utils/mailer");

const generateToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" });

// Generate 6-digit verification code
const generateCode = () => Math.floor(100000 + Math.random() * 900000).toString();

// Register - Send verification code
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ success: false, message: "Email already registered" });
    
    const verificationCode = generateCode();
    const user = await User.create({ 
      name, 
      email, 
      password, 
      role: role || "user", 
      verificationCode,
      verificationCodeExpiry: new Date(Date.now() + 15 * 60 * 1000) // 15 min expiry
    });
    
    // Send verification email
    await sendMail(email, templates.verifyEmail(verificationCode));
    
    res.status(201).json({ 
      success: true, 
      message: "Registration successful. Verification code sent to email.",
      user: { id: user._id, name: user.name, email: user.email, role: user.role, isVerified: user.isVerified } 
    });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// Verify email
router.post("/verify-email", async (req, res) => {
  try {
    const { email, code } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    if (user.isVerified) return res.status(400).json({ success: false, message: "Email already verified" });
    
    // Check code expiry
    if (!user.verificationCodeExpiry || new Date() > user.verificationCodeExpiry) {
      return res.status(400).json({ success: false, message: "Code expired. Please request a new one." });
    }
    
    // Check code match
    if (user.verificationCode !== code) {
      return res.status(400).json({ success: false, message: "Invalid verification code" });
    }
    
    user.isVerified = true;
    user.verificationCode = '';
    user.verificationCodeExpiry = null;
    await user.save();
    
    res.json({ 
      success: true, 
      message: "Email verified successfully!",
      token: generateToken(user._id), 
      user: { id: user._id, name: user.name, email: user.email, role: user.role, isVerified: user.isVerified }
    });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// Resend verification code
router.post("/resend-code", async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    if (user.isVerified) return res.status(400).json({ success: false, message: "Email already verified" });
    
    const verificationCode = generateCode();
    user.verificationCode = verificationCode;
    user.verificationCodeExpiry = new Date(Date.now() + 15 * 60 * 1000);
    await user.save();
    
    await sendMail(email, templates.verifyEmail(verificationCode));
    res.json({ success: true, message: "Verification code sent to email" });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// Login - Check verification (only for users, not admins)
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await user.matchPassword(password))) return res.status(401).json({ success: false, message: "Invalid email or password" });
    
    // Admins bypass verification requirement
    if (user.role === "admin") {
      return res.json({ success: true, token: generateToken(user._id), user: { id: user._id, name: user.name, email: user.email, role: user.role } });
    }
    
    // Regular users require email verification
    if (!user.isVerified) {
      return res.status(403).json({ success: false, message: "Please verify your email first", requiresVerification: true });
    }
    
    res.json({ success: true, token: generateToken(user._id), user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// Forgot password - Send reset code
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    
    const resetCode = generateCode();
    user.resetPasswordCode = resetCode;
    user.resetPasswordCodeExpiry = new Date(Date.now() + 15 * 60 * 1000);
    await user.save();
    
    await sendMail(email, templates.forgotPassword(resetCode));
    res.json({ success: true, message: "Password reset code sent to email" });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// Verify reset code
router.post("/verify-reset-code", async (req, res) => {
  try {
    const { email, code } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    
    if (!user.resetPasswordCodeExpiry || new Date() > user.resetPasswordCodeExpiry) {
      return res.status(400).json({ success: false, message: "Code expired. Please request a new one." });
    }
    
    if (user.resetPasswordCode !== code) {
      return res.status(400).json({ success: false, message: "Invalid reset code" });
    }
    
    res.json({ success: true, message: "Code verified. Proceed to reset password." });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// Reset password
router.post("/reset-password", async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    
    if (!user.resetPasswordCodeExpiry || new Date() > user.resetPasswordCodeExpiry) {
      return res.status(400).json({ success: false, message: "Code expired. Please request a new one." });
    }
    
    if (user.resetPasswordCode !== code) {
      return res.status(400).json({ success: false, message: "Invalid reset code" });
    }
    
    user.password = newPassword;
    user.resetPasswordCode = '';
    user.resetPasswordCodeExpiry = null;
    await user.save();
    
    res.json({ success: true, message: "Password reset successfully. You can now login." });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.get("/me", auth.protect, async (req, res) => {
  res.json({ success: true, user: req.user });
});

router.post("/seed", async (req, res) => {
  try {
    const existing = await User.findOne({ email: "admin@bhoomi.com" });
    if (existing) return res.json({ success: true, message: "Admin already exists" });
    
    await User.create({ 
      name: "Bhoomi Admin", 
      email: "admin@bhoomi.com", 
      password: "Admin@1234", 
      role: "admin", 
      isVerified: true // Admins don't need email verification
    });
    
    res.json({ 
      success: true, 
      message: "Admin created successfully. No email verification required.",
      email: "admin@bhoomi.com",
      password: "Admin@1234"
    });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// Seed citizen account for testing
router.post("/seed-citizen", async (req, res) => {
  try {
    const existing = await User.findOne({ email: "hl1845@srmist.edu.in" });
    if (existing) return res.json({ success: true, message: "Citizen already exists" });
    
    const verificationCode = generateCode();
    await User.create({ 
      name: "Hiya Lodha", 
      email: "hl1845@srmist.edu.in", 
      password: "Citizen@1234", 
      role: "user", 
      isVerified: false,
      verificationCode,
      verificationCodeExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24hr expiry for testing
    });
    
    // Send verification email
    await sendMail("hl1845@srmist.edu.in", templates.verifyEmail(verificationCode));
    
    res.json({ 
      success: true, 
      message: "Citizen created with email verification required",
      verificationCode: verificationCode, // For testing - shows in API response
      email: "hl1845@srmist.edu.in",
      password: "Citizen@1234"
    });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// Fix endpoint: Mark all admins as verified (for setup/testing)
router.post("/fix-admins", async (req, res) => {
  try {
    await User.updateMany({ role: "admin" }, { isVerified: true });
    res.json({ success: true, message: "All admin accounts marked as verified" });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// Seed 5 mock citizens for hackathon demo
router.post("/seed-mock-citizens", async (req, res) => {
  try {
    const citizens = [
      { name: "Rajesh Kumar", email: "rajesh.kumar@example.com", password: "Demo@1234" },
      { name: "Priya Sharma", email: "priya.sharma@example.com", password: "Demo@1234" },
      { name: "Amit Patel", email: "amit.patel@example.com", password: "Demo@1234" },
      { name: "Neha Singh", email: "neha.singh@example.com", password: "Demo@1234" },
      { name: "Vikram Desai", email: "vikram.desai@example.com", password: "Demo@1234" }
    ];

    const created = [];
    const errors = [];

    for (const citizen of citizens) {
      try {
        const existing = await User.findOne({ email: citizen.email });
        if (existing) {
          created.push({ email: citizen.email, status: "already_exists" });
          continue;
        }

        const verificationCode = generateCode();
        await User.create({
          name: citizen.name,
          email: citizen.email,
          password: citizen.password,
          role: "user",
          isVerified: true, // Mark as verified for demo
          verificationCode,
          verificationCodeExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000)
        });

        created.push({ email: citizen.email, name: citizen.name, password: citizen.password, status: "created" });
      } catch (err) {
        errors.push({ email: citizen.email, error: err.message });
      }
    }

    res.json({
      success: true,
      message: "Mock citizens seeded for hackathon demo",
      created,
      errors
    });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;