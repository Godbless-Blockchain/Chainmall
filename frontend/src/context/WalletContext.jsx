// context/WalletContext.jsx
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { ethers } from "ethers";
import ChainMallABI from "../abi/ChainMall.json"; // Make sure ABI is correct and present

const WalletContext = createContext();

export function useWallet() {
  return useContext(WalletContext);
}

// In a Vite project, environment variables must be prefixed with VITE_ and are exposed on `import.meta.env`
const CONTRACT_ADDRESS =
  import.meta.env.VITE_CONTRACT_ADDRESS || "0x8DbeEB062b6E0c8f91BB8cCF5ed39E25AEde2841"; // A fallback for safety

export function WalletProvider({ children }) {
  const [account, setAccount] = useState(null);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [contract, setContract] = useState(null);
  const [adminAddress, setAdminAddress] = useState(null);

  const disconnectWallet = useCallback(() => {
    setAccount(null);
    setProvider(null);
    setSigner(null);
    setContract(null);
    setAdminAddress(null);
  }, []);

  const setupWallet = useCallback(async (ethereum) => {
    if (!ethereum) return;
    try {
      const providerInstance = new ethers.BrowserProvider(ethereum);
      const signerInstance = await providerInstance.getSigner();
      const address = await signerInstance.getAddress();
      const contractInstance = new ethers.Contract(
        CONTRACT_ADDRESS,
        ChainMallABI.abi,
        signerInstance
      );

      // Fetch admin address from the contract
      const admin = await contractInstance.admin();

      setProvider(providerInstance);
      setSigner(signerInstance);
      setAccount(address);
      setContract(contractInstance);
      setAdminAddress(admin);
    } catch (err) {
      console.error("Error setting up wallet:", err);
      disconnectWallet(); // Reset state on error
    }
  }, [disconnectWallet]);

  const connectWallet = async () => {
    if (!window.ethereum) {
      alert("MetaMask not detected. Please install MetaMask.");
      return;
    }
    try {
      // This will pop up MetaMask to request connection
      await window.ethereum.request({ method: "eth_requestAccounts" });
      await setupWallet(window.ethereum);
    } catch (err) {
      console.error(err);
      alert("Wallet connection failed.");
    }
  };

  // This useEffect hook handles automatic connection and wallet event listeners
  useEffect(() => {
    const { ethereum } = window;
    if (!ethereum) return;

    const handleAccountsChanged = (accounts) => {
      if (accounts.length > 0) {
        setupWallet(ethereum);
      } else {
        disconnectWallet();
      }
    };

    const handleChainChanged = () => {
      // As per MetaMask docs, reloading is the best way to handle chain changes
      window.location.reload();
    };

    // Attempt to connect automatically on page load
    const tryAutoConnect = async () => {
      const accounts = await ethereum.request({ method: "eth_accounts" });
      if (accounts.length > 0) {
        await setupWallet(ethereum);
      }
    };

    tryAutoConnect();

    // Set up listeners for wallet events
    ethereum.on("accountsChanged", handleAccountsChanged);
    ethereum.on("chainChanged", handleChainChanged);

    // Cleanup listeners on component unmount
    return () => {
      ethereum.removeListener("accountsChanged", handleAccountsChanged);
      ethereum.removeListener("chainChanged", handleChainChanged);
    };
  }, [setupWallet, disconnectWallet]);

  return (
    <WalletContext.Provider
      value={{
        account,
        provider,
        signer,
        contract,
        adminAddress,
        connectWallet,
        disconnectWallet,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}
