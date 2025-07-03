import { useEffect, useState } from "react";
import { ethers } from "ethers";
import { CONTRACT_ADDRESS, CONTRACT_ABI } from "./contracts/chainmall";
import "./App.css";

function App() {
  const [wallet, setWallet] = useState(null);
  const [contract, setContract] = useState(null);
  const [products, setProducts] = useState([]);

  useEffect(() => {
    const load = async () => {
      if (window.ethereum) {
        const provider = new ethers.BrowserProvider(window.ethereum);
        await provider.send("eth_requestAccounts", []);
        const signer = await provider.getSigner();

        const chainMall = new ethers.Contract(
          CONTRACT_ADDRESS,
          CONTRACT_ABI,
          signer
        );

        setWallet(await signer.getAddress());
        setContract(chainMall);

        const count = await chainMall.nextProductId();
        const all = [];

        for (let i = 0; i < count; i++) {
          const product = await chainMall.getProduct(i);
          all.push(product);
        }

        setProducts(all);
      } else {
        alert("Please install MetaMask to use ChainMall");
      }
    };

    load();
  }, []);

  return (
    <div className="container">
      <header className="header">
        <h1>ChainMall</h1>
        <p>Wallet: {wallet}</p>
      </header>

      <div className="grid">
        {products.length ? (
          products.map((p, i) => (
            <div key={i} className="card">
              <img
                src={`https://ipfs.io/ipfs/${p.imageHash}`}
                alt={p.name}
                onError={(e) => {
                  e.target.src = "https://via.placeholder.com/300x180?text=No+Image";
                }}
              />
              <div className="info">
                <h3>{p.name}</h3>
                <p>{p.description}</p>
                <p className="price">{ethers.formatEther(p.price)} ETH</p>
                <p className="category">
                  {p.category} - {p.subcategory}
                </p>
              </div>
            </div>
          ))
        ) : (
          <p>Loading products...</p>
        )}
      </div>
    </div>
  );
}

export default App;
