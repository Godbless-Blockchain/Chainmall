import React from 'react';
import { Link } from 'react-router-dom';
import bgImg from '../assets/homepagebg.jpg';
import './Home.css';

function Home() {
  return (
    <div
      className="home-bg"
      style={{
        backgroundImage: `url(${bgImg})`,
        height: '100%', // Fill the parent <main> container
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        padding: 0,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center'
      }}
    >
      <div className="home-content">
        <h3>Welcome to ChainMall - Your Decentralized Marketplace</h3>
        <p>Browse, buy, and sell products securely on the blockchain.</p>
        <Link to="/marketplace" className="shop-now-btn">
          Shop Now
        </Link>
      </div>
    </div>
  );
}
export default Home;