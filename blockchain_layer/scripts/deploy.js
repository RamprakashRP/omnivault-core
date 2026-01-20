import hre from "hardhat";

async function main() {
  const OmniVault = await hre.ethers.getContractFactory("OmniVault");
  const vault = await OmniVault.deploy();

  await vault.waitForDeployment();
  const address = await vault.getAddress();
  
  console.log("\n--------------------------------------------------");
  console.log(`SUCCESS: OmniVault Contract is LIVE!`);
  console.log(`Address: ${address}`);
  console.log("--------------------------------------------------\n");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});