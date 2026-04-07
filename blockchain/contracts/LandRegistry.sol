// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract LandRegistry {
    address public admin;

    struct Parcel {
        string parcelId;
        string ownerName;
        address ownerWallet;
        string location;
        uint256 area;
        string landType;
        uint256 marketValue;
        uint256 registeredAt;
        bool exists;
    }

    mapping(string => Parcel) public parcels;
    string[] public parcelIds;

    event ParcelRegistered(string indexed parcelId, string ownerName, address ownerWallet, uint256 timestamp);
    event OwnershipTransferred(string indexed parcelId, address indexed from, address indexed to, uint256 timestamp);

    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin can call this");
        _;
    }

    modifier parcelExists(string memory parcelId) {
        require(parcels[parcelId].exists, "Parcel does not exist");
        _;
    }

    constructor() {
        admin = msg.sender;
    }

    function registerParcel(
        string memory parcelId,
        string memory ownerName,
        address ownerWallet,
        string memory location,
        uint256 area,
        string memory landType,
        uint256 marketValue
    ) external onlyAdmin {
        require(!parcels[parcelId].exists, "Parcel already registered");
        parcels[parcelId] = Parcel({
            parcelId: parcelId,
            ownerName: ownerName,
            ownerWallet: ownerWallet,
            location: location,
            area: area,
            landType: landType,
            marketValue: marketValue,
            registeredAt: block.timestamp,
            exists: true
        });
        parcelIds.push(parcelId);
        emit ParcelRegistered(parcelId, ownerName, ownerWallet, block.timestamp);
    }

    function transferOwnership(
        string memory parcelId,
        string memory newOwnerName,
        address newOwnerWallet
    ) external onlyAdmin parcelExists(parcelId) {
        address oldOwner = parcels[parcelId].ownerWallet;
        parcels[parcelId].ownerName = newOwnerName;
        parcels[parcelId].ownerWallet = newOwnerWallet;
        emit OwnershipTransferred(parcelId, oldOwner, newOwnerWallet, block.timestamp);
    }

    function getParcel(string memory parcelId) external view returns (Parcel memory) {
        return parcels[parcelId];
    }

    function getTotalParcels() external view returns (uint256) {
        return parcelIds.length;
    }

    function verifyOwner(string memory parcelId, address wallet) external view returns (bool) {
        return parcels[parcelId].ownerWallet == wallet;
    }
}
