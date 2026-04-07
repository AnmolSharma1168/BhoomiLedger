const { ethers } = require("ethers");

// Lazy initialize to avoid async issues at require-time
let provider, signer;
let landRegistry, landTransfer, landLoan, landInheritance;
let initialized = false;

function initialize() {
  if (initialized) return;
  
  try {
    provider = new ethers.JsonRpcProvider(process.env.BLOCKCHAIN_RPC || "http://127.0.0.1:8545");
    signer = new ethers.Wallet(process.env.BLOCKCHAIN_PRIVATE_KEY || "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80", provider);

    const LAND_REGISTRY_ABI = [
      "function registerParcel(string memory parcelId, string memory ownerName, address ownerWallet, string memory location, uint256 area, string memory landType, uint256 marketValue) external",
      "function transferOwnership(string memory parcelId, string memory newOwnerName, address newOwnerWallet) external",
      "function getParcel(string memory parcelId) external view returns (tuple(string, string, address, string, uint256, string, uint256, uint256, bool))",
      "function verifyOwner(string memory parcelId, address wallet) external view returns (bool)"
    ];

    const LAND_TRANSFER_ABI = [
      "function initiateTransfer(string memory transferId, string memory parcelId, address seller, address buyer, uint256 saleAmount) external",
      "function advanceTransfer(string memory transferId, uint8 newStatus) external",
      "function getTransfer(string memory transferId) external view returns (tuple(string, string, address, address, uint256, uint256, uint256, uint8, uint256, uint256, bool))"
    ];

    const LAND_LOAN_ABI = [
      "function createLoan(string memory loanId, string memory parcelId, address borrower, uint256 principal, uint256 interestRate, uint256 tenureMonths, uint256 emiAmount) external",
      "function recordRepayment(string memory loanId, uint256 amount) external",
      "function getLoan(string memory loanId) external view returns (tuple(string, string, address, uint256, uint256, uint256, uint256, uint256, uint256, uint8, uint256, bool))"
    ];

    const LAND_INHERITANCE_ABI = [
      "function registerWill(string memory willId, address testator, string[] memory parcelIds, address[] memory beneficiaryWallets, string[] memory beneficiaryNames, uint256[] memory shares) external",
      "function executeWill(string memory willId) external",
      "function revokeWill(string memory willId) external",
      "function getWillStatus(string memory willId) external view returns (uint8)"
    ];

    landRegistry = new ethers.Contract(process.env.LAND_REGISTRY_ADDRESS, LAND_REGISTRY_ABI, signer);
    landTransfer = new ethers.Contract(process.env.LAND_TRANSFER_ADDRESS, LAND_TRANSFER_ABI, signer);
    landLoan = new ethers.Contract(process.env.LAND_LOAN_ADDRESS, LAND_LOAN_ABI, signer);
    landInheritance = new ethers.Contract(process.env.LAND_INHERITANCE_ADDRESS, LAND_INHERITANCE_ABI, signer);
    
    initialized = true;
    console.log("✅ Blockchain initialized");
  } catch (err) {
    console.error("⚠️  Blockchain initialization warning:", err.message);
  }
}

// LandRegistry functions
async function registerParcelOnChain(parcelId, ownerName, ownerWallet, location, area, landType, marketValue) {
  try {
    initialize();
    const tx = await landRegistry.registerParcel(parcelId, ownerName, ownerWallet, location, area, landType, marketValue);
    const receipt = await tx.wait();
    console.log("✅ Parcel registered on chain:", parcelId);
    return { success: true, txHash: receipt.hash, blockNumber: receipt.blockNumber };
  } catch (err) {
    console.error("⚠️  Parcel registration error:", err.message);
    return { success: false, error: err.message, txHash: "pending" };
  }
}

async function transferParcelOwnership(parcelId, newOwnerName, newOwnerWallet) {
  try {
    initialize();
    const tx = await landRegistry.transferOwnership(parcelId, newOwnerName, newOwnerWallet);
    const receipt = await tx.wait();
    console.log("✅ Ownership transferred:", parcelId);
    return { success: true, txHash: receipt.hash };
  } catch (err) {
    console.error("⚠️  Ownership transfer error:", err.message);
    return { success: false, error: err.message, txHash: "pending" };
  }
}

async function verifyParcelOwner(parcelId, wallet) {
  try {
    initialize();
    const isOwner = await landRegistry.verifyOwner(parcelId, wallet);
    return { verified: isOwner };
  } catch (err) {
    console.error("⚠️  Owner verification error:", err.message);
    return { verified: false, error: err.message };
  }
}

// LandTransfer functions
async function initiateTransferOnChain(transferId, parcelId, seller, buyer, saleAmount) {
  try {
    initialize();
    const tx = await landTransfer.initiateTransfer(transferId, parcelId, seller, buyer, saleAmount);
    const receipt = await tx.wait();
    console.log("✅ Transfer initiated on chain:", transferId);
    return { success: true, txHash: receipt.hash };
  } catch (err) {
    console.error("⚠️  Transfer initiation error:", err.message);
    return { success: false, error: err.message, txHash: "pending" };
  }
}

async function advanceTransferOnChain(transferId, status) {
  try {
    initialize();
    const statusMap = { initiated: 0, documents_verified: 1, payment_done: 2, completed: 3, cancelled: 4 };
    const tx = await landTransfer.advanceTransfer(transferId, statusMap[status] || 0);
    const receipt = await tx.wait();
    console.log("✅ Transfer advanced:", transferId, "->", status);
    return { success: true, txHash: receipt.hash };
  } catch (err) {
    console.error("⚠️  Transfer advancement error:", err.message);
    return { success: false, error: err.message, txHash: "pending" };
  }
}

// LandLoan functions
async function createLoanOnChain(loanId, parcelId, borrower, principal, interestRate, tenureMonths, emiAmount) {
  try {
    initialize();
    const tx = await landLoan.createLoan(loanId, parcelId, borrower, principal, interestRate, tenureMonths, emiAmount);
    const receipt = await tx.wait();
    console.log("✅ Loan created on chain:", loanId);
    return { success: true, txHash: receipt.hash };
  } catch (err) {
    console.error("⚠️  Loan creation error:", err.message);
    return { success: false, error: err.message, txHash: "pending" };
  }
}

async function recordLoanRepaymentOnChain(loanId, amount) {
  try {
    initialize();
    const tx = await landLoan.recordRepayment(loanId, amount);
    const receipt = await tx.wait();
    console.log("✅ Repayment recorded on chain:", loanId);
    return { success: true, txHash: receipt.hash };
  } catch (err) {
    console.error("⚠️  Repayment recording error:", err.message);
    return { success: false, error: err.message, txHash: "pending" };
  }
}

// LandInheritance functions
async function registerWillOnChain(willId, testator, parcelIds, beneficiaryWallets, beneficiaryNames, shares) {
  try {
    initialize();
    const tx = await landInheritance.registerWill(willId, testator, parcelIds, beneficiaryWallets, beneficiaryNames, shares);
    const receipt = await tx.wait();
    console.log("✅ Will registered on chain:", willId);
    return { success: true, txHash: receipt.hash };
  } catch (err) {
    console.error("⚠️  Will registration error:", err.message);
    return { success: false, error: err.message, txHash: "pending" };
  }
}

async function executeWillOnChain(willId) {
  try {
    initialize();
    const tx = await landInheritance.executeWill(willId);
    const receipt = await tx.wait();
    console.log("✅ Will executed on chain:", willId);
    return { success: true, txHash: receipt.hash };
  } catch (err) {
    console.error("⚠️  Will execution error:", err.message);
    return { success: false, error: err.message, txHash: "pending" };
  }
}

// Export functions
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
