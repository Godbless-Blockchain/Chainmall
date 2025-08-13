const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

const CONTRACT_NAME = "ChainMall"; // <-- Change here if contract name changes

async function main() {
  console.log("🚀 Starting deployment...");

  // Deploy
  const Contract = await hre.ethers.getContractFactory(CONTRACT_NAME);
  const contract = await Contract.deploy();
  await contract.waitForDeployment();

  const contractAddress = await contract.getAddress();
  console.log(`✅ ${CONTRACT_NAME} deployed to: ${contractAddress}`);

  // Update root .env
  const rootEnvPath = path.join(__dirname, "../.env");
  updateEnvFile(rootEnvPath, "VITE_CONTRACT_ADDRESS", contractAddress);

  // Update frontend .env
  const frontendEnvPath = path.join(__dirname, "../frontend/.env");
  updateEnvFile(frontendEnvPath, "VITE_CONTRACT_ADDRESS", contractAddress);

  // Copy ABI to frontend/src/abi
  const abiDir = path.join(__dirname, "../frontend/src/abi");
  if (!fs.existsSync(abiDir)) {
    fs.mkdirSync(abiDir, { recursive: true });
  }

  const artifactPath = path.join(__dirname, `../artifacts/contracts/${CONTRACT_NAME}.sol/${CONTRACT_NAME}.json`);
  if (!fs.existsSync(artifactPath)) {
    throw new Error(`❌ ABI file not found at: ${artifactPath}`);
  }

  fs.copyFileSync(artifactPath, path.join(abiDir, `${CONTRACT_NAME}.json`));
  console.log(`✅ ABI updated at frontend/src/abi/${CONTRACT_NAME}.json`);

  console.log("🎯 Deployment complete!");
}

function updateEnvFile(filePath, key, value) {
  let envContent = "";
  if (fs.existsSync(filePath)) {
    envContent = fs.readFileSync(filePath, "utf-8");
    if (envContent.includes(`${key}=`)) {
      envContent = envContent.replace(new RegExp(`${key}=.*`), `${key}=${value}`);
    } else {
      envContent += `\n${key}=${value}`;
    }
  } else {
    envContent = `${key}=${value}`;
  }
  fs.writeFileSync(filePath, envContent.trim() + "\n");
  console.log(`✅ ${key} updated in ${filePath}`);
}

main().catch((error) => {
  console.error("❌ Deployment failed:", error);
  process.exitCode = 1;
});
