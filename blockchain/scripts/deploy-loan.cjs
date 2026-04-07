const hre = require("hardhat");
async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Balance:", (await hre.ethers.provider.getBalance(deployer.address)).toString());
  const LandLoan = await hre.ethers.getContractFactory("LandLoan");
  const landLoan = await LandLoan.deploy();
  await landLoan.waitForDeployment();
  console.log("? LandLoan deployed to:", await landLoan.getAddress());
}
main().catch(console.error);
