import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useChainMall } from '../hooks/useChainMall.jsx';
import { useWallet } from '../context/WalletContext.jsx';
import { useTransaction } from '../context/TransactionContext.jsx';

const IPFS_GATEWAY = 'https://ipfs.io/ipfs/';

function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getProduct, purchaseProduct } = useChainMall();
  const { account } = useWallet();
  const { transaction } = useTransaction();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [buyerMessage, setBuyerMessage] = useState('');

  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const fetchedProduct = await getProduct(Number(id));
        if (fetchedProduct) {
          setProduct(fetchedProduct);
        } else {
          setError('Product not found or is no longer available.');
        }
      } catch (err) {
        setError('Failed to load product details.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id, getProduct]);

  const handleBuyNow = async () => {
    if (!product) return;
    const success = await purchaseProduct(product.id, product.price, buyerMessage);
    if (success) {
      navigate('/orders'); // Redirect to their orders page on success
    }
  };

  if (loading) return <div className="text-center"><p>Loading product...</p></div>;
  if (error) return <div className="alert alert-danger">{error}</div>;
  if (!product) return <div className="text-center"><p>Product could not be loaded.</p></div>;

  const isOwner = account && product.seller.toLowerCase() === account.toLowerCase();
  const isPurchasing = transaction.status === 'loading';

  return (
    <div className="container mt-4">
      <div className="row mt-4">
        <div className="col-md-6 d-flex justify-content-center align-items-center bg-light rounded p-3">
          <img
            src={`${IPFS_GATEWAY}${product.imageHash}`}
            alt={product.name}
            className="img-fluid rounded"
            style={{ maxHeight: '500px', objectFit: 'contain' }}
            onError={(e) => { e.target.src = "https://via.placeholder.com/500x400?text=No+Image"; }}
          />
        </div>
        <div className="col-md-6">
          <h2>{product.name}</h2>
          <p className="lead"><strong>Price:</strong> {parseFloat(product.price).toFixed(4)} ETH</p>
          <p><strong>Category:</strong> {product.category}</p>
          <p>{product.description}</p>
          <hr />
          {isOwner ? (
            <p className="text-muted">You are the seller of this product.</p>
          ) : (
            <>
              <div className="mb-3">
                <label htmlFor="buyerMessage" className="form-label">Message to Seller (Optional)</label>
                <textarea className="form-control" id="buyerMessage" rows="2" value={buyerMessage} onChange={(e) => setBuyerMessage(e.target.value)}></textarea>
              </div>
              <button className="btn btn-primary w-100" onClick={handleBuyNow} disabled={isPurchasing}>
                {isPurchasing ? 'Processing...' : 'Buy Now'}
              </button>
              {transaction.status === 'error' && <div className="alert alert-danger mt-3">{transaction.message}</div>}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default ProductDetail;
