const hre = require("hardhat");

async function main() {
  console.log("🚀 Deploying ChainMall contract...");

  const ChainMall = await hre.ethers.getContractFactory("ChainMall");
  const chainMall = await ChainMall.deploy(); // No args needed
  await chainMall.waitForDeployment();        // ✅ NEW: instead of .deployed()

  console.log(`✅ ChainMall deployed to: ${chainMall.target}`);
}

main().catch((error) => {
  console.error("❌ Deployment failed:", error);
  process.exitCode = 1;
});
