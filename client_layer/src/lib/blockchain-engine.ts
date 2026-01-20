// This tells TypeScript that the 'window' object has an 'ethereum' property
declare global {
  interface Window {
    ethereum?: any;
  }
}

import { ethers } from "ethers";

// Use the address you got from your successful deployment earlier
const CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

// This is the ABI (Application Binary Interface) - it tells Ethers how to talk to your Solidity functions
const ABI = [
  "function notarizeDocument(string _fileHash, string _cloudURL) public",
  "function verifyDocument(string _fileHash) public view returns (string, address, uint256)"
];

export async function notarizeOnChain(fileHash: string) {
  try {
    // 1. Check if MetaMask is even installed
    if (typeof window.ethereum === 'undefined') {
      alert("MetaMask not found! Please install the MetaMask extension.");
      return;
    }

    // 2. Check if the user is on the right network (Hardhat)
    const provider = new ethers.BrowserProvider(window.ethereum);
    const network = await provider.getNetwork();
    
    // Hardhat's Chain ID is 31337
    if (network.chainId !== 31337n) {
      alert("Wrong Network! Please switch MetaMask to 'Hardhat Local'.");
      return;
    }

    const signer = await provider.getSigner();
    const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);

    const tx = await contract.notarizeDocument(fileHash, "cloud://omnivault-storage");
    const receipt = await tx.wait();
    return receipt;
  } catch (error: any) {
    console.error("Blockchain Error:", error);
    alert("Blockchain Error: " + error.message);
    throw error;
  }
}