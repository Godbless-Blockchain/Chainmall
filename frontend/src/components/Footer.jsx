import React from 'react';
import './Footer.css';

function Footer() {
  return (
    <footer className="app-footer">
      <div className="container text-center py-3">
        &copy; {new Date().getFullYear()} ChainMall. All rights reserved.
      </div>
    </footer>
  );
}

export default Footer;