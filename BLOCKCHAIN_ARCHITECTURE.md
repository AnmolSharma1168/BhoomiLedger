# BhoomiLedger Blockchain Service Architecture

## 📋 Overview

Professional blockchain service layer that supports **both mock and real blockchain** implementations.

- **Mock Blockchain** (Development): Fast, no gas costs, instant confirmation
- **Real Blockchain** (Production): Polygon Amoy testnet or mainnet

## 🔧 Quick Start

### Use Mock Blockchain (Default)
```bash
cd backend
npm start
# Uses mock blockchain automatically
```

### Switch to Real Polygon Network
```bash
# Set environment variable
export USE_MOCK_BLOCKCHAIN=false

# Then start backend
npm start
```

## 📁 Architecture

```
backend/
├── services/
│   ├── blockchainService.js      ← Main switcher (imports mock or polygon)
│   └── blockchain/
│       ├── mockChain.js          ← Development: generates realistic blockchain responses
│       └── polygonChain.js       ← Production: real ethers.js integration
├── routes/                        ← All routes use blockchainService
│   ├── parcels.js
│   ├── transfers.js
│   ├── loans.js
│   └── inheritance.js
└── utils/
    └── blockchain.js            ← (Legacy - can be removed)
```

## ⚙️ Environment Variables

```env
# .env file in backend/

# Use mock blockchain (default = true)
USE_MOCK_BLOCKCHAIN=true

# Only needed if USE_MOCK_BLOCKCHAIN=false
BLOCKCHAIN_RPC=http://127.0.0.1:8545
BLOCKCHAIN_PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
LAND_REGISTRY_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
LAND_TRANSFER_ADDRESS=0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
LAND_LOAN_ADDRESS=0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0
LAND_INHERITANCE_ADDRESS=0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9
```

## 🧪 Mock Blockchain Features

Generates realistic blockchain data:
- **Transaction Hashes**: Cryptographic 32-byte hex strings
- **Block Numbers**: Random 7-digit numbers (1,000,000 - 10,000,000)
- **Timestamps**: Current date/time
- **Status**: Always "confirmed"
- **Gas Used**: Simulated polygon gas (0.00015 - 0.00045 POL)

## 🔄 How It Works

### Index: `services/blockchainService.js`
```javascript
// Automatically selects blockchain based on env var
const USE_MOCK = process.env.USE_MOCK_BLOCKCHAIN !== "false";
const blockchain = USE_MOCK ? mockChain : polygonChain;

// Routes don't need to know the difference!
module.exports = blockchain;
```

### Routes Usage: (Example: `routes/parcels.js`)
```javascript
const blockchain = require("../services/blockchainService");

// Call blockchain functions - works with both mock and real!
const result = await blockchain.registerParcelOnChain(...);
```

## 🔌 Switching Implementations (One-File Change!)

To switch from mock to real Polygon:

1. **Get testnet MATIC** (0.3+ needed for deployment)
2. **Set environment variable**:
   ```bash
   USE_MOCK_BLOCKCHAIN=false
   ```
3. **Restart backend** - that's it! ✅

## 📊 Current Status

✅ Mock Blockchain: **ACTIVE**
✅ All Routes: **Working with mock blockchain**
✅ Database: **Persisting txHashes correctly**
✅ Ready to Deploy: **Can switch to Polygon Amoy instantly**

## 🚀 Next Steps

1. **Continue development** with mock blockchain
2. **When ready**: Get testnet MATIC from faucet
3. **Deploy contracts**: `npx hardhat run scripts/deploy.cjs --network amoy`
4. **Update .env** with new contract addresses
5. **Switch to real blockchain**: Set `USE_MOCK_BLOCKCHAIN=false`
6. **No code changes needed** - just environment variable!

## 💡 Why This Architecture?

- ✅ **Unblocked development** - no waiting for testnet funds
- ✅ **Professional design** - industry standard practice
- ✅ **Zero friction upgrade** - one env var to switch
- ✅ **Impressive portfolio** - demonstrates architectural thinking
- ✅ **Zero code duplication** - identical function signatures
