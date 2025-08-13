// src/pages/SellerDashboard.jsx
import React, { useState, useEffect } from "react";
import { useChainMall } from '../hooks/useChainMall.jsx';
import { useWallet } from '../context/WalletContext.jsx';

function SellerDashboard() {
  const { getMySales, markAsShipped } = useChainMall();
  const { account } = useWallet();
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSales = async () => {
      if (!account) return;
      setLoading(true);
      const mySales = await getMySales();
      setSales(mySales.sort((a, b) => b.createdAt - a.createdAt)); // Newest first
      setLoading(false);
    };

    fetchSales();
  }, [account, getMySales]);

  if (loading) return <p>Loading your sales data...</p>;

  return (
    <div className="container mt-4">
      <h2>Seller Dashboard</h2>
      {sales.length === 0 ? (
        <p>You have no sales yet.</p>
      ) : (
        <div className="list-group">
          {sales.map((sale) => (
            <div key={sale.id} className="list-group-item list-group-item-action flex-column align-items-start">
              <div className="d-flex w-100 justify-content-between">
                <h5 className="mb-1">Order #{sale.id} (Product ID: {sale.productId})</h5>
                <small>{sale.createdAt.toLocaleDateString()}</small>
              </div>
              <p className="mb-1"><strong>Buyer:</strong> {sale.buyer}</p>
              <p className="mb-1"><strong>Status:</strong> <span className={`badge bg-${sale.status === 'Pending' ? 'secondary' : 'info'}`}>{sale.status}</span></p>
              {sale.buyerMessage && <p className="mb-1 fst-italic"><strong>Message:</strong> "{sale.buyerMessage}"</p>}
              {sale.status === "Pending" && (
                <button className="btn btn-warning mt-2" onClick={() => markAsShipped(sale.id)}>Mark as Shipped</button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default SellerDashboard;
