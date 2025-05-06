const hre = require("hardhat");

async function main() {
  const [hemanth, teja] = await hre.ethers.getSigners();

  const contractAddress = "0xe7f1725e7734ce288f8367e1bb143e90bb3f0512"; // Your latest contract address

  const HemanthToken = await hre.ethers.getContractAt("HemanthToken", contractAddress);

  const amount = hre.ethers.parseUnits("500", 18); // ✅ updated parsing function
  const tx = await HemanthToken.transfer(teja.address, amount);
  await tx.wait();

  console.log(`✅ Transferred 500 HEM from ${hemanth.address} to ${teja.address}`);

  const hemanthBalance = await HemanthToken.balanceOf(hemanth.address);
  const tejaBalance = await HemanthToken.balanceOf(teja.address);

  console.log(`Hemanth Balance: ${hre.ethers.formatUnits(hemanthBalance, 18)} HEM`);
  console.log(`Teja Balance: ${hre.ethers.formatUnits(tejaBalance, 18)} HEM`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
