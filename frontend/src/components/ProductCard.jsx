import React from 'react';
import { Link } from 'react-router-dom';

const IPFS_GATEWAY = 'https://ipfs.io/ipfs/';

function ProductCard({ product }) {
  // The price is already formatted as an ETH string from the useChainMall hook
  const displayPrice = `${parseFloat(product.price).toFixed(4)} ETH`;

  return (
    <div className="card h-100">
      <img
        src={`${IPFS_GATEWAY}${product.imageHash}`}
        className="card-img-top"
        alt={product.name}
        style={{ height: '200px', objectFit: 'cover' }}
        onError={(e) => { e.target.src = 'https://via.placeholder.com/300x200?text=No+Image'; }}
      />
      <div className="card-body d-flex flex-column">
        <h5 className="card-title">{product.name}</h5>
        <p className="card-text text-muted">{product.category}</p>
        <p className="card-text fw-bold">{displayPrice}</p>
        <Link to={`/product/${product.id}`} className="btn btn-primary mt-auto">View Details</Link>
      </div>
    </div>
  );
}
export default ProductCard;
