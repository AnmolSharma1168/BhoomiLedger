const crypto = require("crypto");

/**
 * Mock Blockchain Service
 * Simulates blockchain responses with realistic blockchain structures
 * Used for development when testnet funds are unavailable
 * Swappable with real blockchain service
 */

let blockCounter = 1000000;

function generateRealisticTxHash() {
  return "0x" + crypto.randomBytes(32).toString("hex");
}

function generateBlockNumber() {
  return Math.floor(Math.random() * 9000000) + 1000000;
}

function generateGasUsed() {
  return (Math.random() * 0.0003 + 0.00015).toFixed(5) + " POL";
}

function mockBlockchainRecord(txHash = null) {
  return {
    txHash: txHash || generateRealisticTxHash(),
    blockNumber: generateBlockNumber(),
    timestamp: new Date(),
    status: "confirmed",
    gasUsed: generateGasUsed(),
    mockChain: true
  };
}

// ============ PARCEL FUNCTIONS ============

async function registerParcelOnChain(parcelId, ownerName, ownerWallet, location, area, landType, marketValue) {
  try {
    const record = mockBlockchainRecord();
    console.log(`✅ [MOCK] Parcel registered: ${parcelId} | TxHash: ${record.txHash}`);
    return {
      success: true,
      txHash: record.txHash,
      blockNumber: record.blockNumber,
      timestamp: record.timestamp,
      status: record.status,
      gasUsed: record.gasUsed
    };
  } catch (err) {
    console.error("⚠️  [MOCK] Parcel registration error:", err.message);
    return { success: false, error: err.message, txHash: "pending" };
  }
}

async function transferParcelOwnership(parcelId, newOwnerName, newOwnerWallet) {
  try {
    const record = mockBlockchainRecord();
    console.log(`✅ [MOCK] Ownership transferred: ${parcelId} | TxHash: ${record.txHash}`);
    return {
      success: true,
      txHash: record.txHash,
      blockNumber: record.blockNumber,
      timestamp: record.timestamp,
      status: record.status
    };
  } catch (err) {
    console.error("⚠️  [MOCK] Ownership transfer error:", err.message);
    return { success: false, error: err.message, txHash: "pending" };
  }
}

async function verifyParcelOwner(parcelId, wallet) {
  try {
    // Mock: always verify successfully for development
    return { verified: true, mockChain: true };
  } catch (err) {
    console.error("⚠️  [MOCK] Owner verification error:", err.message);
    return { verified: false, error: err.message };
  }
}

// ============ TRANSFER FUNCTIONS ============

async function initiateTransferOnChain(transferId, parcelId, seller, buyer, saleAmount) {
  try {
    const record = mockBlockchainRecord();
    console.log(`✅ [MOCK] Transfer initiated: ${transferId} | TxHash: ${record.txHash}`);
    return {
      success: true,
      txHash: record.txHash,
      blockNumber: record.blockNumber,
      timestamp: record.timestamp,
      status: record.status
    };
  } catch (err) {
    console.error("⚠️  [MOCK] Transfer initiation error:", err.message);
    return { success: false, error: err.message, txHash: "pending" };
  }
}

async function advanceTransferOnChain(transferId, status) {
  try {
    const record = mockBlockchainRecord();
    console.log(`✅ [MOCK] Transfer advanced: ${transferId} -> ${status} | TxHash: ${record.txHash}`);
    return {
      success: true,
      txHash: record.txHash,
      blockNumber: record.blockNumber,
      timestamp: record.timestamp,
      status: record.status
    };
  } catch (err) {
    console.error("⚠️  [MOCK] Transfer advancement error:", err.message);
    return { success: false, error: err.message, txHash: "pending" };
  }
}

// ============ LOAN FUNCTIONS ============

async function createLoanOnChain(loanId, parcelId, borrower, principal, interestRate, tenureMonths, emiAmount) {
  try {
    const record = mockBlockchainRecord();
    console.log(`✅ [MOCK] Loan created: ${loanId} | TxHash: ${record.txHash}`);
    return {
      success: true,
      txHash: record.txHash,
      blockNumber: record.blockNumber,
      timestamp: record.timestamp,
      status: record.status
    };
  } catch (err) {
    console.error("⚠️  [MOCK] Loan creation error:", err.message);
    return { success: false, error: err.message, txHash: "pending" };
  }
}

async function recordLoanRepaymentOnChain(loanId, amount) {
  try {
    const record = mockBlockchainRecord();
    console.log(`✅ [MOCK] Repayment recorded: ${loanId} | TxHash: ${record.txHash}`);
    return {
      success: true,
      txHash: record.txHash,
      blockNumber: record.blockNumber,
      timestamp: record.timestamp,
      status: record.status
    };
  } catch (err) {
    console.error("⚠️  [MOCK] Repayment recording error:", err.message);
    return { success: false, error: err.message, txHash: "pending" };
  }
}

// ============ INHERITANCE FUNCTIONS ============

async function registerWillOnChain(willId, testator, parcelIds, beneficiaryWallets, beneficiaryNames, shares) {
  try {
    const record = mockBlockchainRecord();
    console.log(`✅ [MOCK] Will registered: ${willId} | TxHash: ${record.txHash}`);
    return {
      success: true,
      txHash: record.txHash,
      blockNumber: record.blockNumber,
      timestamp: record.timestamp,
      status: record.status
    };
  } catch (err) {
    console.error("⚠️  [MOCK] Will registration error:", err.message);
    return { success: false, error: err.message, txHash: "pending" };
  }
}

async function executeWillOnChain(willId) {
  try {
    const record = mockBlockchainRecord();
    console.log(`✅ [MOCK] Will executed: ${willId} | TxHash: ${record.txHash}`);
    return {
      success: true,
      txHash: record.txHash,
      blockNumber: record.blockNumber,
      timestamp: record.timestamp,
      status: record.status
    };
  } catch (err) {
    console.error("⚠️  [MOCK] Will execution error:", err.message);
    return { success: false, error: err.message, txHash: "pending" };
  }
}

module.exports = {
  registerParcelOnChain,
  transferParcelOwnership,
  verifyParcelOwner,
  initiateTransferOnChain,
  advanceTransferOnChain,
  createLoanOnChain,
  recordLoanRepaymentOnChain,
  registerWillOnChain,
  executeWillOnChain
};
