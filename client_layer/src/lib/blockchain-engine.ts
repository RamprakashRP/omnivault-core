import { ethers } from "ethers";

// ⚠️ Ensure this is your current Amoy Contract Address
export const CONTRACT_ADDRESS = "0xFaF40DFdd2702a5e22AC4CDbBd5f5461b9a5c13B"; 

export const ABI = [
  "function notarizeDocument(string _fileHash, string _cloudURL, uint256 _price) public",
  "function purchaseAccess(string _fileHash) public payable",
  "function checkAccess(string _fileHash, address _user) public view returns (bool)",
  "function getDocument(string _fileHash) public view returns (string cloudURL, address owner, uint256 timestamp, uint256 price, bool isForSale)"
];

/**
 * REINFORCED AMOY GAS SETTINGS:
 * Your error showed that the network needs at least 25 Gwei (25,000,000,000).
 * We are setting the Priority Fee (tip) to 40 Gwei to be absolutely safe.
 * We also provide a fixed gasLimit to prevent the "estimateGas" error from blocking the popup.
 */
const GAS_SETTINGS = {
  maxPriorityFeePerGas: ethers.parseUnits("40", "gwei"), // Clears the 25 Gwei floor
  maxFeePerGas: ethers.parseUnits("60", "gwei"),        // Total gas cap
  gasLimit: 800000                                      // Bypasses estimateGas failures
};

const checkNetwork = async () => {
  if (typeof window !== "undefined" && window.ethereum) {
    const chainId = await window.ethereum.request({ method: 'eth_chainId' });
    if (chainId !== '0x13882') {
      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0x13882' }],
        });
      } catch (error: any) {
        if (error.code === 4902) {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: '0x13882',
              chainName: 'Polygon Amoy Testnet',
              // Updated to POL branding to match latest Polygon standards
              nativeCurrency: { name: 'POL', symbol: 'POL', decimals: 18 },
              rpcUrls: ['https://rpc-amoy.polygon.technology'],
              blockExplorerUrls: ['https://amoy.polygonscan.com']
            }]
          });
        }
      }
    }
  }
};

export const getContract = async () => {
  if (typeof window === "undefined" || !window.ethereum) {
    throw new Error("MetaMask not found!");
  }
  await checkNetwork();
  const provider = new ethers.BrowserProvider(window.ethereum as any);
  const signer = await provider.getSigner();
  return new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);
};

export async function notarizeOnChain(fileHash: string, s3ObjectKey: string, priceInEth: string = "0") {
  try {
    const contract = await getContract();
    const priceInWei = ethers.parseEther(priceInEth || "0");

    // Passing GAS_SETTINGS to resolve the "gas price below minimum" error
    const tx = await contract.notarizeDocument(fileHash, s3ObjectKey, priceInWei, {
      ...GAS_SETTINGS
    });
    return await tx.wait();
  } catch (error: any) {
    console.error("Blockchain Error:", error);
    throw error;
  }
}

export async function buyAccess(fileHash: string, priceInEth: string) {
  try {
    const contract = await getContract();
    
    // Safety check: Prevents "missing revert data" by stopping owners from buying their own file
    const doc = await contract.getDocument(fileHash);
    const provider = new ethers.BrowserProvider(window.ethereum as any);
    const signer = await provider.getSigner();
    const userAddress = (await signer.getAddress()).toLowerCase();
    
    if (doc[1].toLowerCase() === userAddress) {
      throw new Error("Self-Purchase Error: You are the owner of this asset.");
    }

    // Check if already bought
    const alreadyHasAccess = await contract.checkAccess(fileHash, userAddress);
    if (alreadyHasAccess) {
      throw new Error("Already Purchased: You already have access to this asset.");
    }

    const tx = await contract.purchaseAccess(fileHash, {
      value: ethers.parseEther(priceInEth),
      ...GAS_SETTINGS // Forces the transaction even if gas estimation is weird
    });
    return await tx.wait();
  } catch (error: any) {
    // Provide a more readable error message for the UI
    const msg = error.reason || error.message || "Purchase failed on-chain";
    console.error("Purchase Error:", msg);
    throw new Error(msg);
  }
}

export async function fetchDocumentDetails(fileHash: string) {
  try {
    if (typeof window === "undefined" || !window.ethereum) return null;
    const contract = await getContract();
    const doc = await contract.getDocument(fileHash);
    
    // Check if the document exists (owner is not zero address)
    if (doc[1] === "0x0000000000000000000000000000000000000000") {
      return null;
    }
    
    return {
      url: doc[0],
      owner: doc[1],
      price: ethers.formatEther(doc[3]),
      isForSale: doc[4]
    };
  } catch (error) {
    console.error("Fetch Doc Details Error:", error);
    return null;
  }
}

export async function verifyAccess(fileHash: string, userAddress: string) {
  try {
    if (typeof window === "undefined" || !window.ethereum) return false;
    const contract = await getContract();
    return await contract.checkAccess(fileHash, userAddress);
  } catch (error) {
    console.error("Verify Access Error:", error);
    return false;
  }
}