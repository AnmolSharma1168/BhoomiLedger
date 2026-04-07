const hre = require("hardhat");
async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with:", deployer.address);
  console.log("Balance:", (await hre.ethers.provider.getBalance(deployer.address)).toString());
  const LandRegistry = await hre.ethers.getContractFactory("LandRegistry");
  const landRegistry = await LandRegistry.deploy();
  await landRegistry.waitForDeployment();
  console.log("? LandRegistry deployed to:", await landRegistry.getAddress());
}
main().catch(console.error);
