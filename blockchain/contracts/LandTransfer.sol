// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract LandTransfer {
    address public admin;

    enum TransferStatus { Initiated, DocumentsVerified, PaymentDone, Completed, Cancelled }

    struct Transfer {
        string transferId;
        string parcelId;
        address seller;
        address buyer;
        uint256 saleAmount;
        uint256 stampDuty;
        uint256 registrationFee;
        TransferStatus status;
        uint256 createdAt;
        uint256 completedAt;
        bool exists;
    }

    mapping(string => Transfer) public transfers;

    event TransferInitiated(string indexed transferId, string parcelId, address seller, address buyer, uint256 amount);
    event TransferAdvanced(string indexed transferId, TransferStatus newStatus);
    event TransferCompleted(string indexed transferId, address newOwner, uint256 timestamp);

    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin");
        _;
    }

    constructor() {
        admin = msg.sender;
    }

    function initiateTransfer(
        string memory transferId,
        string memory parcelId,
        address seller,
        address buyer,
        uint256 saleAmount
    ) external onlyAdmin {
        require(!transfers[transferId].exists, "Transfer already exists");
        uint256 stampDuty = (saleAmount * 5) / 100;
        uint256 registrationFee = (saleAmount * 1) / 100;
        transfers[transferId] = Transfer({
            transferId: transferId,
            parcelId: parcelId,
            seller: seller,
            buyer: buyer,
            saleAmount: saleAmount,
            stampDuty: stampDuty,
            registrationFee: registrationFee,
            status: TransferStatus.Initiated,
            createdAt: block.timestamp,
            completedAt: 0,
            exists: true
        });
        emit TransferInitiated(transferId, parcelId, seller, buyer, saleAmount);
    }

    function advanceTransfer(string memory transferId, TransferStatus newStatus) external onlyAdmin {
        require(transfers[transferId].exists, "Transfer not found");
        transfers[transferId].status = newStatus;
        if (newStatus == TransferStatus.Completed) {
            transfers[transferId].completedAt = block.timestamp;
            emit TransferCompleted(transferId, transfers[transferId].buyer, block.timestamp);
        }
        emit TransferAdvanced(transferId, newStatus);
    }

    function getTransfer(string memory transferId) external view returns (Transfer memory) {
        return transfers[transferId];
    }
}
