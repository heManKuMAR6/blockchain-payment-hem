const hre = require("hardhat");

async function main() {
  const [hemanth] = await hre.ethers.getSigners();

  const HemanthToken = await hre.ethers.getContractFactory("HemanthToken");

  const initialSupply = BigInt(100000) * BigInt(10 ** 18); // 100,000 tokens with 18 decimals

  const token = await HemanthToken.deploy(initialSupply);

  await token.deployed();

  console.log(`HemanthToken deployed to: ${token.address}`);
  console.log(`Deployer (Hemanth) address: ${hemanth.address}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
