const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true, minlength: 6 },
  role: { type: String, enum: ['admin', 'officer', 'user'], default: 'user' },
  walletAddress: { type: String, default: '' },
  
  // Email verification
  isVerified: { type: Boolean, default: false },
  verificationCode: { type: String, default: '' },
  verificationCodeExpiry: { type: Date, default: null },
  
  // Password reset
  resetPasswordCode: { type: String, default: '' },
  resetPasswordCodeExpiry: { type: Date, default: null },
  
  createdAt: { type: Date, default: Date.now }
});

// Hash password before save
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Compare password
userSchema.methods.matchPassword = async function (entered) {
  return bcrypt.compare(entered, this.password);
};

module.exports = mongoose.model('User', userSchema);