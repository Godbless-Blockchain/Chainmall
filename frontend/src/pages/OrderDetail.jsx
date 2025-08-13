import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useChainMall } from '../hooks/useChainMall.jsx';
import { useWallet } from '../context/WalletContext.jsx';
import { useTransaction } from '../context/TransactionContext.jsx';

const IPFS_GATEWAY = 'https://ipfs.io/ipfs/';

function OrderDetail() {
  const { id } = useParams();
  const { getOrder, getProduct, markAsShipped, markAsCompleted, raiseDispute } = useChainMall();
  const { account } = useWallet();
  const { transaction } = useTransaction();

  const [order, setOrder] = useState(null);
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Mock chat state
  const [newMessage, setNewMessage] = useState("");
  const [messages, setMessages] = useState([]);

  const fetchOrderDetails = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError('');
    try {
      const fetchedOrder = await getOrder(Number(id));
      if (fetchedOrder) {
        setOrder(fetchedOrder);
        const fetchedProduct = await getProduct(fetchedOrder.productId);
        setProduct(fetchedProduct);
        // In a real app, you would fetch chat messages here
        setMessages([{ senderId: fetchedOrder.buyer, text: "Hi, I've just placed my order.", time: fetchedOrder.createdAt.toLocaleString() }]);
      } else {
        setError('Order not found.');
      }
    } catch (err) {
      setError('Failed to load order details.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [id, getOrder, getProduct]);

  useEffect(() => {
    fetchOrderDetails();
  }, [fetchOrderDetails]);

  const handleAction = async (action, ...args) => {
    if (!order) return;
    const success = await action(order.id, ...args);
    if (success) {
      fetchOrderDetails(); // Refresh data on success
    }
  };

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;
    // This is a mock implementation. A real chat would use a backend or P2P connection.
    const msg = { senderId: account, text: newMessage, time: new Date().toLocaleString() };
    setMessages([...messages, msg]);
    setNewMessage("");
  };

  const handleRaiseDispute = () => {
    const reason = prompt("Please provide a reason for raising this dispute:");
    if (reason) {
      handleAction(raiseDispute, reason);
    }
  };

  if (loading) return <div className="text-center"><p>Loading order details...</p></div>;
  if (error) return <div className="alert alert-danger">{error}</div>;
  if (!order || !product) return <div className="text-center"><p>Order details could not be loaded.</p></div>;

  const isBuyer = account && account.toLowerCase() === order.buyer.toLowerCase();
  const isSeller = account && account.toLowerCase() === order.seller.toLowerCase();
  const canDispute = isBuyer || isSeller;
  const isProcessing = transaction.status === 'loading';

  return (
    <div className="container mt-4">
      <h2>Order #{order.id}</h2>
      <div className="card mb-4">
        <div className="card-header d-flex justify-content-between align-items-center">
          <span>Order Status: <span className="fw-bold">{order.status}</span></span>
          <small>Order Date: {order.createdAt.toLocaleString()}</small>
        </div>
        <div className="card-body">
          <div className="row">
            <div className="col-md-4">
              <img src={`${IPFS_GATEWAY}${product.imageHash}`} alt={product.name} className="img-fluid rounded" onError={(e) => { e.target.src = 'https://via.placeholder.com/300x200?text=No+Image'; }} />
            </div>
            <div className="col-md-8">
              <h4><Link to={`/product/${product.id}`}>{product.name}</Link></h4>
              <p><strong>Price:</strong> {product.price} ETH</p>
              <p><strong>Seller:</strong> <small>{order.seller}</small></p>
              <p><strong>Buyer:</strong> <small>{order.buyer}</small></p>
              <hr/>
              <div className="d-flex gap-2">
                {isBuyer && order.status === 'Shipped' && <button className="btn btn-success" onClick={() => handleAction(markAsCompleted)} disabled={isProcessing}>Confirm Receipt</button>}
                {isSeller && order.status === 'Pending' && <button className="btn btn-warning" onClick={() => handleAction(markAsShipped)} disabled={isProcessing}>Mark as Shipped</button>}
                {canDispute && order.status !== 'Completed' && order.status !== 'Disputed' && <button className="btn btn-danger" onClick={handleRaiseDispute} disabled={isProcessing}>Raise Dispute</button>}
              </div>
              {isProcessing && <p className="text-muted mt-2">{transaction.message}</p>}
              {transaction.status === 'error' && <div className="alert alert-danger mt-2">{transaction.message}</div>}
            </div>
          </div>
        </div>
      </div>
      <div className="mt-4">
        <h3>Peer-to-Peer Chat</h3>
        <div className="card card-body">
          <div className="chat-box border p-3 mb-3 bg-light" style={{ maxHeight: "300px", overflowY: "auto" }}>
            {messages.map((m, i) => (<div key={i} className={m.senderId.toLowerCase() === account?.toLowerCase() ? 'text-end' : ''}><p className="mb-0"><strong>{m.senderId.toLowerCase() === account?.toLowerCase() ? 'You' : 'Them'}:</strong> {m.text}</p><small className="text-muted">{m.time}</small></div>))}
          </div>
          <div className="d-flex"><input type="text" className="form-control me-2" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Type a message..." onKeyDown={e => e.key === 'Enter' && handleSendMessage()} /><button className="btn btn-primary" onClick={handleSendMessage}>Send</button></div>
        </div>
      </div>
    </div>
  );
}

export default OrderDetail;
