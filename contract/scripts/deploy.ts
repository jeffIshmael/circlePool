import { network } from "hardhat";

const { ethers } = await network.connect({
  network: "testnet"
});

async function main() {
  // Get the signer 
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contract with the account:", deployer.address);

  // The deployer 
  const CirclePoolFactory = await ethers.getContractFactory("CirclePool", deployer);
  const circlePool = await CirclePoolFactory.deploy();

  await circlePool.waitForDeployment();

  const address = await circlePool.getAddress();
  console.log("Contract deployed at:", address);
}

main().catch(console.error);