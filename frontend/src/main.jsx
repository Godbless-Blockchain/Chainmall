import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import App from './App';
import { WalletProvider } from './context/WalletContext';
import { TransactionProvider } from './context/TransactionContext';
import { FilterProvider } from './context/FilterContext';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HashRouter>
      <WalletProvider>
        <FilterProvider>
          <TransactionProvider>
            <App />
          </TransactionProvider>
        </FilterProvider>
      </WalletProvider>
    </HashRouter>
  </React.StrictMode>
);
