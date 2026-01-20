// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract OmniVault {
    struct Document {
        string fileHash;      // SHA-256 fingerprint
        string cloudURL;     // Link to encrypted file (AWS/IPFS)
        address owner;       // Who uploaded it
        uint256 timestamp;   // When it was notarized
        bool exists;         // Verification flag
    }

    mapping(string => Document) private vault;
    
    event DocumentNotarized(string indexed fileHash, address indexed owner);

    function notarizeDocument(string memory _fileHash, string memory _cloudURL) public {
        require(!vault[_fileHash].exists, "Document already exists.");

        vault[_fileHash] = Document({
            fileHash: _fileHash,
            cloudURL: _cloudURL,
            owner: msg.sender,
            timestamp: block.timestamp,
            exists: true
        });

        emit DocumentNotarized(_fileHash, msg.sender);
    }

    function verifyDocument(string memory _fileHash) public view returns (string memory, address, uint256) {
        require(vault[_fileHash].exists, "Document not found.");
        Document memory doc = vault[_fileHash];
        return (doc.cloudURL, doc.owner, doc.timestamp);
    }
}