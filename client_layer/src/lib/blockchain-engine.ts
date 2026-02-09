// client_layer/src/lib/blockchain-engine.ts
import { ethers } from "ethers";

export const CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

export const ABI = [
  "function notarizeDocument(string _fileHash, string _cloudURL, uint256 _price) public",
  "function purchaseAccess(string _fileHash) public payable",
  "function checkAccess(string _fileHash, address _user) public view returns (bool)",
  "function getDocument(string _fileHash) public view returns (string, address, uint256, uint256, bool)"
];

export async function notarizeOnChain(
  fileHash: string, 
  s3ObjectKey: string, // The new 2nd argument
  priceInEth: string = "0" // The 3rd argument
) {
  try {
    if (!window.ethereum) throw new Error("MetaMask not found!");

    const provider = new ethers.BrowserProvider(window.ethereum as any);
    const signer = await provider.getSigner();
    const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);

    const priceInWei = ethers.parseEther(priceInEth || "0");

    // Call the contract with the 3 parameters required by the new Module 2 logic
    const tx = await contract.notarizeDocument(
      fileHash, 
      s3ObjectKey, // This maps to _cloudURL in your Solidity contract
      priceInWei
    );
    
    const receipt = await tx.wait();
    return receipt;
  } catch (error: any) {
    console.error("Blockchain Error:", error);
    throw error;
  }
}

export async function buyAccess(fileHash: string, priceInEth: string) {
  try {
    if (!window.ethereum) throw new Error("MetaMask not found");

    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);

    // Execute the purchase function on the smart contract
    const tx = await contract.purchaseAccess(fileHash, {
      value: ethers.parseEther(priceInEth)
    });

    const receipt = await tx.wait();
    return receipt;
  } catch (error: any) {
    console.error("Purchase Error:", error);
    throw error;
  }
}

export async function fetchDocumentDetails(fileHash: string) {
    if (!window.ethereum) throw new Error("MetaMask not found");
    const provider = new ethers.BrowserProvider(window.ethereum);
    const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, provider);
    
    // Fetch mapping: [cloudURL, owner, timestamp, price, isForSale]
    return await contract.getDocument(fileHash);
}