// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract LandInheritance {
    address public admin;

    enum WillStatus { Active, Executed, Revoked }

    struct Beneficiary {
        address wallet;
        string name;
        uint256 sharePercent;
    }

    struct Will {
        string willId;
        address testator;
        string[] parcelIds;
        Beneficiary[] beneficiaries;
        WillStatus status;
        uint256 createdAt;
        uint256 executedAt;
        bool exists;
    }

    mapping(string => Will) public wills;

    event WillRegistered(string indexed willId, address testator, uint256 timestamp);
    event WillExecuted(string indexed willId, uint256 timestamp);
    event WillRevoked(string indexed willId, uint256 timestamp);

    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin");
        _;
    }

    constructor() {
        admin = msg.sender;
    }

    function registerWill(
        string memory willId,
        address testator,
        string[] memory parcelIds,
        address[] memory beneficiaryWallets,
        string[] memory beneficiaryNames,
        uint256[] memory shares
    ) external onlyAdmin {
        require(!wills[willId].exists, "Will already exists");
        require(beneficiaryWallets.length == shares.length, "Mismatched arrays");

        Will storage w = wills[willId];
        w.willId = willId;
        w.testator = testator;
        w.parcelIds = parcelIds;
        w.status = WillStatus.Active;
        w.createdAt = block.timestamp;
        w.exists = true;

        uint256 totalShares = 0;
        for (uint i = 0; i < beneficiaryWallets.length; i++) {
            w.beneficiaries.push(Beneficiary({
                wallet: beneficiaryWallets[i],
                name: beneficiaryNames[i],
                sharePercent: shares[i]
            }));
            totalShares += shares[i];
        }
        require(totalShares == 100, "Shares must total 100");
        emit WillRegistered(willId, testator, block.timestamp);
    }

    function executeWill(string memory willId) external onlyAdmin {
        require(wills[willId].exists, "Will not found");
        require(wills[willId].status == WillStatus.Active, "Will not active");
        wills[willId].status = WillStatus.Executed;
        wills[willId].executedAt = block.timestamp;
        emit WillExecuted(willId, block.timestamp);
    }

    function revokeWill(string memory willId) external onlyAdmin {
        require(wills[willId].exists, "Will not found");
        require(wills[willId].status == WillStatus.Active, "Will not active");
        wills[willId].status = WillStatus.Revoked;
        emit WillRevoked(willId, block.timestamp);
    }

    function getWillStatus(string memory willId) external view returns (WillStatus) {
        return wills[willId].status;
    }
}
