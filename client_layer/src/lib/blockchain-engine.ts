import { ethers } from "ethers";

export const CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

export const ABI = [
  "function notarizeDocument(string _fileHash, string _cloudURL, uint256 _price) public",
  "function purchaseAccess(string _fileHash) public payable",
  "function checkAccess(string _fileHash, address _user) public view returns (bool)",
  "function getDocument(string _fileHash) public view returns (string cloudURL, address owner, uint256 timestamp, uint256 price, bool isForSale)"
];

// Helper to avoid repeating MetaMask setup
export const getContract = async () => {
  if (!window.ethereum) throw new Error("MetaMask not found!");
  const provider = new ethers.BrowserProvider(window.ethereum as any);
  const signer = await provider.getSigner();
  return new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);
};

export async function notarizeOnChain(fileHash: string, s3ObjectKey: string, priceInEth: string = "0") {
  try {
    const contract = await getContract();
    const priceInWei = ethers.parseEther(priceInEth || "0");

    const tx = await contract.notarizeDocument(fileHash, s3ObjectKey, priceInWei);
    return await tx.wait();
  } catch (error: any) {
    console.error("Blockchain Error:", error);
    throw error;
  }
}

export async function buyAccess(fileHash: string, priceInEth: string) {
  try {
    const contract = await getContract();
    const tx = await contract.purchaseAccess(fileHash, {
      value: ethers.parseEther(priceInEth)
    });
    return await tx.wait();
  } catch (error: any) {
    console.error("Purchase Error:", error);
    throw error;
  }
}

// Added this for the "Buy" page search functionality
export async function fetchDocumentDetails(fileHash: string) {
  const contract = await getContract();
  const doc = await contract.getDocument(fileHash);
  return {
    url: doc[0],
    owner: doc[1],
    price: ethers.formatEther(doc[3]),
    isForSale: doc[4]
  };
}

// Added this for the "Assets" page access check
export async function verifyAccess(fileHash: string, userAddress: string) {
  const contract = await getContract();
  return await contract.checkAccess(fileHash, userAddress);
}