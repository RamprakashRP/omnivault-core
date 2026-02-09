// blockchain_layer/contracts/OmniVault.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract OmniVault {
    struct Document {
        string fileHash;      // SHA-256 fingerprint
        string cloudURL;      // Link to encrypted file
        address owner;        // Who uploaded it
        uint256 timestamp;    // When it was notarized
        uint256 price;       // NEW: Price in Wei
        bool isForSale;      // NEW: Marketplace flag
        bool exists;         // Verification flag
    }

    mapping(string => Document) private vault;
    // NEW: Tracks access permissions: fileHash => userAddress => hasPaid
    mapping(string => mapping(address => bool)) private accessGrant;

    event DocumentNotarized(string indexed fileHash, address indexed owner, uint256 price);
    event AccessPurchased(string indexed fileHash, address indexed buyer, uint256 amount);

    function notarizeDocument(string memory _fileHash, string memory _cloudURL, uint256 _price) public {
        require(!vault[_fileHash].exists, "Document already exists.");

        vault[_fileHash] = Document({
            fileHash: _fileHash,
            cloudURL: _cloudURL,
            owner: msg.sender,
            timestamp: block.timestamp,
            price: _price,
            isForSale: _price > 0,
            exists: true
        });

        emit DocumentNotarized(_fileHash, msg.sender, _price);
    }

    function purchaseAccess(string memory _fileHash) public payable {
        Document storage doc = vault[_fileHash];
        require(doc.exists, "Document not found.");
        require(doc.isForSale, "Document not for sale.");
        require(msg.value >= doc.price, "Insufficient payment.");
        require(msg.sender != doc.owner, "Owner already has access.");

        // Transfer funds directly to the data owner
        (bool sent, ) = payable(doc.owner).call{value: msg.value}("");
        require(sent, "Failed to send Ether to owner.");

        accessGrant[_fileHash][msg.sender] = true;
        emit AccessPurchased(_fileHash, msg.sender, msg.value);
    }

    function checkAccess(string memory _fileHash, address _user) public view returns (bool) {
        if (vault[_fileHash].owner == _user) return true;
        return accessGrant[_fileHash][_user];
    }

    function getDocument(string memory _fileHash) public view returns (string memory, address, uint256, uint256, bool) {
        require(vault[_fileHash].exists, "Document not found.");
        Document memory doc = vault[_fileHash];
        return (doc.cloudURL, doc.owner, doc.timestamp, doc.price, doc.isForSale);
    }
}