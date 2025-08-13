import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useWallet } from '../context/WalletContext';
import { useChainMall } from '../hooks/useChainMall';

function Profile() {
  const { account } = useWallet();
  const { getMySales, getMyOrders, getAllProducts } = useChainMall();

  const [stats, setStats] = useState({ listings: 0, sales: 0, orders: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfileData = async () => {
      if (!account) {
        setLoading(false);
        return;
      }
      setLoading(true);

      try {
        // Fetch all data in parallel for efficiency
        const [sales, orders, allProducts] = await Promise.all([
          getMySales(),
          getMyOrders(),
          getAllProducts(),
        ]);

        const myListings = allProducts.filter(
          (p) => p.seller.toLowerCase() === account.toLowerCase()
        );

        setStats({
          listings: myListings.length,
          sales: sales.length,
          orders: orders.length,
        });
      } catch (error) {
        console.error("Failed to fetch profile data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [account, getMySales, getMyOrders, getAllProducts]);

  if (!account) {
    return <div className="text-center"><p>Please connect your wallet to view your profile.</p></div>;
  }

  if (loading) {
    return <div className="text-center"><p>Loading profile data...</p></div>;
  }

  return (
    <div className="container mt-4">
      <h2>👤 My Profile</h2>
      <p className="text-muted">Welcome, {account.slice(0, 6)}...{account.slice(-4)}</p>
      <hr />
      <div className="row text-center">
        <div className="col-md-4">
          <div className="card p-3">
            <h4>{stats.listings}</h4>
            <p className="mb-0">Active Listings</p>
            <Link to="/seller" className="btn btn-link">View My Listings</Link>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card p-3">
            <h4>{stats.sales}</h4>
            <p className="mb-0">Total Sales</p>
            <Link to="/seller" className="btn btn-link">View Sales Dashboard</Link>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card p-3">
            <h4>{stats.orders}</h4>
            <p className="mb-0">My Orders</p>
            <Link to="/orders" className="btn btn-link">View My Orders</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
export default Profile;
