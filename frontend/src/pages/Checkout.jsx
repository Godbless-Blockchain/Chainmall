// src/pages/Checkout.jsx
import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTransaction } from "../context/TransactionContext";

function Checkout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { initiateTransaction } = useTransaction();

  const product = location.state?.product;

  if (!product) {
    return <p>No product selected for checkout.</p>;
  }

  const handleBuyNow = () => {
    const tx = initiateTransaction(product);
    navigate(`/transaction/${tx.id}`);
  };

  return (
    <div className="container mt-4">
      <h2>Checkout</h2>
      <div className="card p-3">
        <h4>{product.name}</h4>
        <p><strong>Price:</strong> {product.price}</p>
        <button className="btn btn-primary" onClick={handleBuyNow}>
          Buy Now
        </button>
      </div>
    </div>
  );
}

export default Checkout;
