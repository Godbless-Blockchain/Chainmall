import React, { useState, useEffect, useCallback } from 'react';
import { useChainMall } from '../hooks/useChainMall';
import { useWallet } from '../context/WalletContext';
import { Link } from 'react-router-dom';

function AdminDashboard() {
  const { account, adminAddress } = useWallet();
  const { getAllOrders, resolveDispute } = useChainMall();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const isUserAdmin = account && adminAddress && account.toLowerCase() === adminAddress.toLowerCase();

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const allOrders = await getAllOrders();

      const disputed = allOrders.filter(o => o.status === "Disputed");
      const others = allOrders.filter(o => o.status !== "Disputed");

      // Sort oldest on top for both groups
      disputed.sort((a, b) => a.createdAt - b.createdAt);
      others.sort((a, b) => a.createdAt - b.createdAt);

      setOrders([...disputed, ...others]);
    } catch (error) {
      console.error("Failed to fetch orders:", error);
    } finally {
      setLoading(false);
    }
  }, [getAllOrders]);

  useEffect(() => {
    // Only fetch data if the connected user is the admin.
    if (isUserAdmin) {
      fetchOrders();
    } else {
      setLoading(false);
    }
  }, [isUserAdmin, fetchOrders]);

  const handleResolve = async (orderId, refundBuyer) => {
    const reason = prompt("Please provide a resolution note:");
    if (reason === null) return; // User cancelled prompt

    const success = await resolveDispute(orderId, refundBuyer, reason);
    if (success) { fetchOrders(); } // Refresh the list
  };

  if (loading) return <p>Loading...</p>;

  // Security Gate: Check if the user is the admin.
  if (!isUserAdmin) {
    return (
      <div className="container mt-4">
        <h2>🚫 Access Denied</h2>
        <p>You must be the contract administrator to view this page.</p>
        {!account && <p>Please connect your wallet.</p>}
      </div>
    );
  }

  return (
    <div className="container mt-4">
      <h2>Admin Dashboard - Order Management</h2>
      {orders.length === 0 ? (
        <p>There are no orders.</p>
      ) : (
        <div className="list-group">
          {orders.map((order) => (
            <div key={order.id} className="list-group-item">
              <div className="d-flex w-100 justify-content-between">
                <h5 className="mb-1">
                  <Link to={`/order/${order.id}`}>Order #{order.id}</Link>
                </h5>
                <small>Status: <span className={`badge bg-${order.status === 'Disputed' ? 'danger' : 'info'}`}>{order.status}</span></small>
              </div>
              <p className="mb-1"><strong>Product ID:</strong> {order.productId}</p>
              <p className="mb-1"><strong>Buyer:</strong> {order.buyer}</p>
              <p className="mb-1"><strong>Seller:</strong> {order.seller}</p>
              {order.status === 'Disputed' && (
                <>
                  <p className="mb-1 fst-italic"><strong>Reason:</strong> "{order.buyerMessage}"</p>
                  <div className="mt-2">
                    <button className="btn btn-success me-2" onClick={() => handleResolve(order.id, false)}>
                      Pay Seller
                    </button>
                    <button className="btn btn-danger" onClick={() => handleResolve(order.id, true)}>
                      Refund Buyer
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;