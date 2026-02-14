const hre = require("hardhat");

async function main() {
  console.log("🚀 Starting OmniVault Deployment on Polygon Amoy...");

  // Get the contract factory
  const OmniVault = await hre.ethers.getContractFactory("OmniVault");
  
  // Deploy the contract
  const omnivault = await OmniVault.deploy();

  // Wait for the deployment to finish
  await omnivault.waitForDeployment();

  const address = await omnivault.getAddress();

  console.log("✅ Deployment Successful!");
  console.log("--------------------------------------------------");
  console.log(`CONTRACT ADDRESS: ${address}`);
  console.log("--------------------------------------------------");
  console.log("Copy the address above into your blockchain-engine.ts file.");
}

main().catch((error) => {
  console.error("❌ Deployment Failed:", error);
  process.exitCode = 1;
});