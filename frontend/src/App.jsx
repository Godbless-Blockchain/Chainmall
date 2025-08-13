import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Marketplace from './pages/Marketplace';
import SellerDashboard from './pages/SellerDashboard';
import MyOrders from './pages/MyOrders';
import Profile from './pages/Profile';
import ProductDetail from './pages/ProductDetail';
import OrderDetail from "./pages/OrderDetail";
import Sell from './pages/Sell';
import AdminDashboard from './pages/AdminDashboard';

function App() {
  return (
    <div className="d-flex flex-column" style={{ minHeight: "100vh" }}>
      <Navbar />
      <main className="flex-grow-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/marketplace" element={<Marketplace />} />
          <Route path="/seller" element={<SellerDashboard />} />
          <Route path="/orders" element={<MyOrders />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="/order/:id" element={<OrderDetail />} />
          <Route path="/sell" element={<Sell />} />
          <Route path="/admin" element={<AdminDashboard />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

export default App;
