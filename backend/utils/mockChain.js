const crypto = require('crypto');

function generateTxHash() {
  return '0x' + crypto.randomBytes(32).toString('hex');
}

function generateTokenId() {
  return Math.floor(Math.random() * 1000000).toString();
}

function mockBlockchainRecord() {
  return {
    txHash: generateTxHash(),
    tokenId: generateTokenId(),
    blockNumber: Math.floor(Math.random() * 1000000) + 4000000,
    network: 'Polygon Amoy',
    timestamp: new Date().toISOString(),
  };
}

module.exports = { generateTxHash, generateTokenId, mockBlockchainRecord };
