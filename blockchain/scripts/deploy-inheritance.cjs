const hre = require("hardhat");
async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Balance:", (await hre.ethers.provider.getBalance(deployer.address)).toString());
  const LandInheritance = await hre.ethers.getContractFactory("LandInheritance");
  const landInheritance = await LandInheritance.deploy();
  await landInheritance.waitForDeployment();
  console.log("? LandInheritance deployed to:", await landInheritance.getAddress());
}
main().catch(console.error);
