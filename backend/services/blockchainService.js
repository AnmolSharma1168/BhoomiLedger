/**
 * Blockchain Service Router
 * Switches between mock and real blockchain based on USE_MOCK_BLOCKCHAIN env var
 * 
 * Usage:
 *   USE_MOCK_BLOCKCHAIN=true  -> Uses mock chain (development)
 *   USE_MOCK_BLOCKCHAIN=false -> Uses polygon chain (production/testnet)
 * 
 * This professional architecture allows:
 * - Seamless switching between mock and real blockchains
 * - Development without testnet funding limitations
 * - ONE-FILE CHANGE to swap blockchain implementations
 * - Zero changes needed in routes or business logic
 */

const mockChain = require("./blockchain/mockChain");
const polygonChain = require("./blockchain/polygonChain");

// Determine which blockchain service to use
const USE_MOCK = process.env.USE_MOCK_BLOCKCHAIN !== "false"; // Default to mock
const blockchain = USE_MOCK ? mockChain : polygonChain;

console.log(`\n🚀 Starting BhoomiLedger with ${USE_MOCK ? "[MOCK BLOCKCHAIN]" : "[POLYGON BLOCKCHAIN]"}`);
if (USE_MOCK) {
  console.log("   💡 Tip: Set USE_MOCK_BLOCKCHAIN=false to use real Polygon network\n");
}

module.exports = blockchain;
