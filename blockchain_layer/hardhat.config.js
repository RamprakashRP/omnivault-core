import "@nomicfoundation/hardhat-ethers";

export default {
  solidity: "0.8.20",
  networks: {
    hardhat: {
      // This is the critical line to fix MetaMask issues
      chainId: 1337
    },
    localhost: {
      url: "http://127.0.0.1:8545",
      // Also ensure the localhost network matches
      chainId: 1337
    },
  },
};