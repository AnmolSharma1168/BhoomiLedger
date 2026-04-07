import { ethers } from "@nomicfoundation/hardhat-ethers/internal/helpers.js";
import hre from "hardhat";

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with:", deployer.address);

  const LandRegistry = await hre.ethers.getContractFactory("LandRegistry");
  const landRegistry = await LandRegistry.deploy();
  await landRegistry.waitForDeployment();
  console.log("LandRegistry:", await landRegistry.getAddress());

  const LandTransfer = await hre.ethers.getContractFactory("LandTransfer");
  const landTransfer = await LandTransfer.deploy();
  await landTransfer.waitForDeployment();
  console.log("LandTransfer:", await landTransfer.getAddress());

  const LandLoan = await hre.ethers.getContractFactory("LandLoan");
  const landLoan = await LandLoan.deploy();
  await landLoan.waitForDeployment();
  console.log("LandLoan:", await landLoan.getAddress());

  const LandInheritance = await hre.ethers.getContractFactory("LandInheritance");
  const landInheritance = await LandInheritance.deploy();
  await landInheritance.waitForDeployment();
  console.log("LandInheritance:", await landInheritance.getAddress());

  console.log("\n? All contracts deployed!");
  console.log("LandRegistry:   ", await landRegistry.getAddress());
  console.log("LandTransfer:   ", await landTransfer.getAddress());
  console.log("LandLoan:       ", await landLoan.getAddress());
  console.log("LandInheritance:", await landInheritance.getAddress());
}

main().catch(console.error);
