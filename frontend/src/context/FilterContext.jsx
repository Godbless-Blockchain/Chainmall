import React, { createContext, useContext, useState } from 'react';

const FilterContext = createContext();

export function useFilter() {
  return useContext(FilterContext);
}

// Base categories for products, shared across the app
export const productCategories = ["Fashion", "Electronics", "Artwork", "Accessories"];

export function FilterProvider({ children }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const value = {
    searchTerm,
    setSearchTerm,
    selectedCategory,
    setSelectedCategory,
    productCategories,
  };

  return (
    <FilterContext.Provider value={value}>{children}</FilterContext.Provider>
  );
}