const hre = require("hardhat");

async function main() {
  // Grab both signers from Hardhat
  const [hemanth, teja] = await hre.ethers.getSigners();

  // Deployed contract address — update if you redeploy
  const contractAddress = "0xe7f1725e7734ce288f8367e1bb143e90bb3f0512";

  // Load contract using Teja's signer
  const HemanthToken = await hre.ethers.getContractAt("HemanthToken", contractAddress, teja);

  // Send 500 HEM from Teja → Hemanth
  const amount = hre.ethers.parseUnits("500", 18);
  const tx = await HemanthToken.transfer(hemanth.address, amount);
  await tx.wait();

  console.log(`✅ Teja sent 500 HEM to Hemanth`);

  const hemanthBal = await HemanthToken.balanceOf(hemanth.address);
  const tejaBal = await HemanthToken.balanceOf(teja.address);

  console.log(`💼 Hemanth: ${hre.ethers.formatUnits(hemanthBal, 18)} HEM`);
  console.log(`💼 Teja: ${hre.ethers.formatUnits(tejaBal, 18)} HEM`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
