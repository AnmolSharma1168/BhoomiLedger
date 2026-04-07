const hre = require("hardhat");
async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Balance:", (await hre.ethers.provider.getBalance(deployer.address)).toString());
  const LandTransfer = await hre.ethers.getContractFactory("LandTransfer");
  const landTransfer = await LandTransfer.deploy();
  await landTransfer.waitForDeployment();
  console.log("? LandTransfer deployed to:", await landTransfer.getAddress());
}
main().catch(console.error);
