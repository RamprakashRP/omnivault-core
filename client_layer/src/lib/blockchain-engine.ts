import { ethers } from "ethers";

// ⚠️ Deployed Polygon Amoy Contract Address
export const CONTRACT_ADDRESS = "0xFaF40DFdd2702a5e22AC4CDbBd5f5461b9a5c13B"; 

export const ABI = [
  "function notarizeDocument(string _fileHash, string _cloudURL, uint256 _price) public",
  "function purchaseAccess(string _fileHash) public payable",
  "function checkAccess(string _fileHash, address _user) public view returns (bool)",
  "function getDocument(string _fileHash) public view returns (string cloudURL, address owner, uint256 timestamp, uint256 price, bool isForSale)"
];

/**
 * FIX: Manual Gas Pricing for Polygon Amoy
 * Amoy often rejects transactions with low "tips". 
 * We set maxPriorityFeePerGas to 30 Gwei to ensure acceptance.
 */
const GAS_SETTINGS = {
  maxPriorityFeePerGas: ethers.parseUnits("30", "gwei"),
  maxFeePerGas: ethers.parseUnits("50", "gwei")
};

// Helper to ensure MetaMask is on Polygon Amoy (Chain ID: 80002 / 0x13882)
const checkNetwork = async () => {
  if (typeof window !== "undefined" && window.ethereum) {
    const chainId = await window.ethereum.request({ method: 'eth_chainId' });
    
    if (chainId !== '0x13882') {
      try {
        // Attempt to switch to Amoy
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0x13882' }],
        });
      } catch (error: any) {
        // If the network isn't added, add it automatically
        if (error.code === 4902) {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: '0x13882',
              chainName: 'Polygon Amoy Testnet',
              nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 },
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
    throw new Error("MetaMask is not installed. Please install it to use this feature.");
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

    // Applied GAS_SETTINGS to resolve "gas price below minimum" errors
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
    const tx = await contract.purchaseAccess(fileHash, {
      value: ethers.parseEther(priceInEth),
      ...GAS_SETTINGS // Applied gas fix here as well
    });
    return await tx.wait();
  } catch (error: any) {
    console.error("Purchase Error:", error);
    throw error;
  }
}

export async function fetchDocumentDetails(fileHash: string) {
  try {
    if (typeof window === "undefined" || !window.ethereum) return null;

    const contract = await getContract();
    const doc = await contract.getDocument(fileHash);
    return {
      url: doc[0],
      owner: doc[1],
      price: ethers.formatEther(doc[3]),
      isForSale: doc[4]
    };
  } catch (error) {
    console.error("Fetch Doc Error:", error);
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