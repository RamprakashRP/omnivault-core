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
 * AMOY GAS FIX:
 * The network now requires a much higher 'Priority Fee' (Tip).
 * We are setting it to 100 Gwei to ensure it clears the 25 Gwei floor mentioned in your error.
 */
const GAS_SETTINGS = {
  maxPriorityFeePerGas: ethers.parseUnits("100", "gwei"), // High tip to clear the 2.5Gwei - 25Gwei floor
  maxFeePerGas: ethers.parseUnits("150", "gwei"),        // Total gas cap
  gasLimit: 500000                                      // Manual gas limit to skip 'estimateGas' failures
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

    // We pass the GAS_SETTINGS to bypass the 'below minimum' error
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
    
    // Check if user is trying to buy their own file (prevents revert error)
    const doc = await contract.getDocument(fileHash);
    const signer = await (new ethers.BrowserProvider(window.ethereum as any)).getSigner();
    if (doc[1].toLowerCase() === (await signer.getAddress()).toLowerCase()) {
      throw new Error("You already own this asset. Buying your own asset will cause a contract revert.");
    }

    const tx = await contract.purchaseAccess(fileHash, {
      value: ethers.parseEther(priceInEth),
      ...GAS_SETTINGS
    });
    return await tx.wait();
  } catch (error: any) {
    // Better error message for the user
    const msg = error.reason || error.message || "Transaction failed";
    console.error("Purchase Error:", msg);
    throw new Error(msg);
  }
}

export async function fetchDocumentDetails(fileHash: string) {
  try {
    if (typeof window === "undefined" || !window.ethereum) return null;
    const contract = await getContract();
    const doc = await contract.getDocument(fileHash);
    if (doc[1] === "0x0000000000000000000000000000000000000000") return null;
    
    return {
      url: doc[0],
      owner: doc[1],
      price: ethers.formatEther(doc[3]),
      isForSale: doc[4]
    };
  } catch (error) {
    return null;
  }
}

export async function verifyAccess(fileHash: string, userAddress: string) {
  try {
    if (typeof window === "undefined" || !window.ethereum) return false;
    const contract = await getContract();
    return await contract.checkAccess(fileHash, userAddress);
  } catch (error) {
    return false;
  }
}