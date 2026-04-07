const axios = require("axios");

(async () => {
  try {
    const API = "http://localhost:3001/api";
    
    // 1. Delete old admin user from DB
    console.log("📝 Cleaning up old admin...");
    const mongoose = require("mongoose");
    await mongoose.connect("mongodb://127.0.0.1:27017/bhoomiledger");
    const User = require("./models/User");
    await User.deleteOne({ email: "admin@bhoomi.com" });
    await mongoose.disconnect();
    console.log("✅ Old admin deleted\n");
    
    // 2. Seed new admin
    console.log("📝 Creating new admin with verification required...");
    const seedRes = await axios.post(`${API}/auth/seed`);
    const verifyCode = seedRes.data.verificationCode;
    console.log("✅ Admin created!");
    console.log("   Email:", seedRes.data.email);
    console.log("   Verification Code:", verifyCode);
    console.log("\n");
    
    // 3. Try to login (should require verification)
    console.log("📝 Attempting login...");
    try {
      const loginRes = await axios.post(`${API}/auth/login`, {
        email: "admin@bhoomi.com",
        password: "Admin@1234"
      });
      console.log("❌ ERROR: Should have rejected unverified user!");
    } catch (err) {
      if (err.response?.status === 403) {
        console.log("✅ LOGIN BLOCKED (as expected)");
        console.log("   Error:", err.response.data.message);
        console.log("   RequiresVerification:", err.response.data.requiresVerification);
      } else {
        throw err;
      }
    }
    console.log("\n");
    
    // 4. Verify email
    console.log("📝 Verifying email with code: " + verifyCode);
    const verifyRes = await axios.post(`${API}/auth/verify-email`, {
      email: "admin@bhoomi.com",
      code: verifyCode
    });
    console.log("✅ EMAIL VERIFIED!");
    console.log("   Token:", verifyRes.data.token?.substring(0, 30) + "...");
    console.log("   User:", verifyRes.data.user.name, `(${verifyRes.data.user.role})`);
    console.log("\n");
    
    // 5. Login again (should work now)
    console.log("📝 Attempting login again (after verification)...");
    const loginRes2 = await axios.post(`${API}/auth/login`, {
      email: "admin@bhoomi.com",
      password: "Admin@1234"
    });
    console.log("✅ LOGIN SUCCESSFUL!");
    console.log("   Token:", loginRes2.data.token?.substring(0, 30) + "...");
    console.log("   User:", loginRes2.data.user.name, `(${loginRes2.data.user.role})\n`);
    
    console.log("🎉 VERIFICATION FLOW WORKING PERFECTLY!");
    
  } catch (err) {
    console.error("❌ Error:", err.response?.data || err.message);
    process.exit(1);
  }
})();
