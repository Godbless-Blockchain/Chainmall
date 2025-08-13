import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useChainMall } from '../hooks/useChainMall';
import { useFilter } from '../context/FilterContext';
import { useTransaction } from '../context/TransactionContext';
import { uploadFileToIPFS } from '../utils/ipfsUpload';

function Sell() {
  const { productCategories } = useFilter();
  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    category: "",
    imageFile: null,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setLocalError] = useState('');

  const { listProduct } = useChainMall();
  const { transaction } = useTransaction();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (files) {
      setForm((prev) => ({ ...prev, imageFile: files[0] }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); 
    if (!form.name || !form.description || !form.price || !form.category || !form.imageFile) {
      setLocalError('Please fill out all fields and select an image.');
      return;
    }

    setIsSubmitting(true);
    setLocalError('');

    try {
      // 1. Upload image to IPFS
      const { cid: imageHash } = await uploadFileToIPFS(form.imageFile);

      // 2. Call the smart contract function via our hook
      const success = await listProduct(form.name, form.description, parseFloat(form.price), form.category, imageHash);

      if (success) {
        navigate('/marketplace'); // Redirect on success
      } else {
        // Error will be shown by the TransactionContext's global error display
      }
    } catch (err) {
      console.error("Error listing product:", err);
      setLocalError('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isLoading = isSubmitting || transaction.status === 'loading';

  return (
    <div className="container mt-4">
      <h2>List a New Product</h2>
      <form onSubmit={handleSubmit} className="card p-4" style={{ maxWidth: 500 }}>
        <div className="mb-3">
          <label className="form-label">Product Name</label>
          <input
            type="text"
            className="form-control"
            name="name"
            value={form.name || ''}
            onChange={handleChange}
            required
          />
        </div>

        <div className="mb-3">
          <label className="form-label">Description</label>
          <textarea
            className="form-control"
            name="description"
            value={form.description || ''}
            onChange={handleChange}
            required
          />
        </div>

        <div className="mb-3">
          <label className="form-label">Price (SepoliaETH)</label>
          <input
            type="number"
            className="form-control"
            name="price"
            value={form.price || ''}
            onChange={handleChange}
            required
            min="0"
            step="any"
          />
        </div>

        <div className="mb-3">
          <label className="form-label">Category</label>
          <select
            className="form-control"
            name="category"
            value={form.category || ''}
            onChange={handleChange}
            required
          >
            <option value="">Select Category</option>
            {productCategories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-3">
          <label className="form-label">Product Image</label>
          <input
            type="file"
            className="form-control"
            name="imageFile"
            accept="image/*"
            onChange={handleChange}
            required
          />
        </div>

        {error && <div className="alert alert-danger">{error}</div>}
        {transaction.status === 'error' && <div className="alert alert-danger">{transaction.message}</div>}

        <button
          type="submit"
          className="btn btn-primary"
          disabled={isLoading}
        >
          {isLoading ? "Listing..." : "List Product"}
        </button>
      </form>
    </div>
  );
}

export default Sell;
