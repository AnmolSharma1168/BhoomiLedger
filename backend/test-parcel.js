const axios = require("axios");

(async () => {
  try {
    const API = "http://localhost:5001";
    
    // Login
    const loginRes = await axios.post(`${API}/api/auth/login`, {
      email: "admin@bhoomi.com",
      password: "Admin@1234"
    });
    
    const token = loginRes.data.token;
    console.log("✅ Logged in. Token:", token.slice(0, 20) + "...");
    
    // Register parcel
    const parcelRes = await axios.post(`${API}/api/parcels`, {
      ownerName: "Vedika Singh",
      ownerAddress: "0x123456",
      ownerEmail: "vedika@bhoomi.com",
      location: { 
        district: "Punjab", 
        village: "Jalandhar",
        surveyNumber: "SRV-2024-001",
        taluk: "Jalandhar",
        state: "Punjab"
      },
      area: { value: 50000, unit: "sq_ft" },
      landType: "commercial",
      marketValue: 80000000
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log("\n✅ Parcel registered!");
    console.log("Parcel ID:", parcelRes.data.parcel.parcelId);
    console.log("TxHash:", parcelRes.data.parcel.txHash);
    console.log("\nFull response:");
    console.log(JSON.stringify(parcelRes.data.parcel, null, 2));
    
  } catch (err) {
    console.error("❌ Error:", err.response?.data || err.message);
  }
})();
