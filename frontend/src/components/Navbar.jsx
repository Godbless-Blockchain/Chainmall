import React from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useWallet } from "../context/WalletContext";
import { useFilter } from "../context/FilterContext";
import "./Navbar.css";
import logo from "../assets/logo.png";

function Navbar() {
  const { account, connectWallet, disconnectWallet, adminAddress } = useWallet();
  const {
    searchTerm,
    setSearchTerm,
    selectedCategory,
    setSelectedCategory,
    productCategories,
  } = useFilter();
  const navigate = useNavigate();

  const isUserAdmin =
    account && adminAddress && account.toLowerCase() === adminAddress.toLowerCase();

  const handleSearch = (e) => {
    e.preventDefault();
    // Navigate to the marketplace page on search submission.
    // The filtering is handled by the shared context state.
    navigate("/marketplace");
  };

  return (
    <header className="navbar-header">
      {/* Top Row: Logo + Search */}
      <div className="navbar-top">
        <div className="navbar-home-signin">
          <NavLink to="/" className="navbar-brand" end>
            <img src={logo} alt="Logo" />
            ChainMall
          </NavLink>
        </div>

        {/* Search Box + Category Dropdown */}
        <form className="navbar-search" onSubmit={handleSearch}>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            aria-label="Select category"
          >
            <option value="All">All Categories</option>
            {productCategories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          <input
            type="text"
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            aria-label="Search products"
          />
          <button type="submit">Search</button>
        </form>

        <div style={{ marginLeft: "auto" }}>
          {account ? (
            <span className="wallet-address">
              {account.slice(0, 6)}...{account.slice(-4)}
            </span>
          ) : (
            <button className="btn btn-primary" onClick={connectWallet}>
              Connect Wallet
            </button>
          )}
        </div>
      </div>

      {/* Links Row */}
      <nav className="navbar-links">
        <NavLink to="/marketplace">Marketplace</NavLink>
        <NavLink to="/orders">My Orders</NavLink>
        <NavLink to="/seller">Seller Dashboard</NavLink>
        <NavLink to="/sell">Sell</NavLink>
        {isUserAdmin && <NavLink to="/admin">Admin</NavLink>}

        {/* Account Dropdown */}
        <div className="dropdown">
          <button className="dropdown-toggle">Account</button>
          <div className="dropdown-menu">
            <NavLink to="/profile">Profile</NavLink>
            <button onClick={disconnectWallet} className="dropdown-item">Disconnect</button>
          </div>
        </div>
      </nav>
    </header>
  );
}

export default Navbar;
