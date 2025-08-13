import React, { useEffect, useState, useMemo } from "react";
import { useChainMall } from '../hooks/useChainMall.jsx';
import { useFilter } from '../context/FilterContext.jsx';
import ProductCard from "../components/ProductCard";

function Marketplace() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortOption, setSortOption] = useState('newest');
  const { searchTerm, selectedCategory } = useFilter();
  const { getAllProducts } = useChainMall();

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      const fetchedProducts = await getAllProducts();
      setProducts(fetchedProducts);
      setLoading(false);
    };

    fetchProducts();
  }, [getAllProducts]);

  const processedProducts = useMemo(() => {
    const filtered = products.filter(product => {
      const nameMatch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
      const categoryMatch = selectedCategory === 'All' || product.category === selectedCategory;
      return nameMatch && categoryMatch;
    });

    const sorted = [...filtered]; // Create a copy to avoid mutating state directly
    if (sortOption === 'price-asc') {
      sorted.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
    } else if (sortOption === 'price-desc') {
      sorted.sort((a, b) => parseFloat(b.price) - parseFloat(a.price));
    } else { // 'newest'
      sorted.sort((a, b) => b.createdAt - a.createdAt);
    }

    return sorted;
  }, [products, searchTerm, selectedCategory, sortOption]);

  if (loading) {
    return <div className="text-center"><p>Loading products from the blockchain...</p></div>;
  }

  return (
    <div className="container mt-3">
      <div className="d-flex justify-content-end mb-4">
        <div className="col-md-3">
          <select className="form-select" value={sortOption} onChange={(e) => setSortOption(e.target.value)}>
            <option value="newest">Sort by: Newest</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
          </select>
        </div>
      </div>
      <div className="row">
        {processedProducts.length > 0 ? (
          processedProducts.map((product) => (
            <div key={product.id} className="col-lg-3 col-md-4 col-sm-6 mb-4">
              <ProductCard product={product} />
            </div>
          ))
        ) : (
          <p className="text-center">No products match your search criteria.</p>
        )}
      </div>
    </div>
  );
}

export default Marketplace;
