import React, { useState, useEffect, useCallback } from "react";
import { Link } from 'react-router-dom';
import { useChainMall } from '../hooks/useChainMall.jsx';
import { useWallet } from '../context/WalletContext.jsx';

const IPFS_GATEWAY = 'https://ipfs.io/ipfs/';

function MyOrders() {
  const { getMyOrders, markAsCompleted, getProduct } = useChainMall();
  const { account } = useWallet();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [productDetails, setProductDetails] = useState({});

  const fetchOrdersAndProducts = useCallback(async () => {
    if (!account) return;
    setLoading(true);
    const myOrders = await getMyOrders();
    const sortedOrders = myOrders.sort((a, b) => b.createdAt - a.createdAt);
    setOrders(sortedOrders);

    const details = { ...productDetails };
    for (const order of sortedOrders) {
      if (!details[order.productId]) {
        const product = await getProduct(order.productId);
        if (product) {
          details[order.productId] = product;
        }
      }
    }
    setProductDetails(details);
    setLoading(false);
  }, [account, getMyOrders, getProduct]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchOrdersAndProducts();
  }, [fetchOrdersAndProducts]);

  const handleConfirmReceipt = async (orderId) => {
    const success = await markAsCompleted(orderId);
    if (success) {
      fetchOrdersAndProducts(); // Refetch orders to update status
    }
  };

  if (loading) return <p>Loading your orders...</p>;

  if (!account) {
    return <p>Please connect your wallet to see your orders.</p>;
  }

  return (
    <div className="container mt-4">
      <h2>My Orders</h2>
      {orders.length === 0 ? (
        <p>You have not purchased any items yet.</p>
      ) : (
        <div className="list-group">
          {orders.map((order) => {
            const product = productDetails[order.productId];
            const statusBg = order.status === 'Shipped' ? 'warning' : order.status === 'Completed' ? 'success' : 'secondary';
            return (
              <Link to={`/order/${order.id}`} key={order.id} className="list-group-item list-group-item-action">
              <div className="row align-items-center">
                <div className="col-md-2">{product ? <img src={`${IPFS_GATEWAY}${product.imageHash}`} alt={product.name} className="img-fluid rounded" /> : <div style={{ height: '100px', backgroundColor: '#eee' }} className="rounded"></div>}</div>
                <div className="col-md-6">
                  <h5 className="mb-1">{product ? product.name : `Product ID: ${order.productId}`}</h5>
                  <p className="mb-1"><strong>Order ID:</strong> {order.id}</p>
                  <p className="mb-1"><strong>Date:</strong> {order.createdAt.toLocaleDateString()}</p>
                  {order.buyerMessage && <p className="mb-1 fst-italic"><strong>Your Message:</strong> "{order.buyerMessage}"</p>}
                </div>
                <div className="col-md-4 text-md-end">
                  <p><strong>Status:</strong> <span className={`badge bg-${statusBg}`}>{order.status}</span></p>
                  {order.status === "Shipped" && (<button className="btn btn-success" onClick={(e) => { e.preventDefault(); handleConfirmReceipt(order.id); }}>Confirm Receipt</button>)}
                </div>
              </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
export default MyOrders;
