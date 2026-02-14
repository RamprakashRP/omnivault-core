require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.20",
  networks: {
    amoy: {
      url: "https://rpc-amoy.polygon.technology",
      // This pulls the private key from the .env file in this folder
      accounts: [process.env.PRIVATE_KEY],
      chainId: 80002,
    },
  },
};