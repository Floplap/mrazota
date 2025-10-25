import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Shop from './pages/Shop';
import Media from './pages/Media';
import Auth from './pages/Auth';
import Messenger from './pages/Messenger';
import Games from './pages/Games';
import AdminProducts from './pages/AdminProducts';
import AdminOrders from './pages/AdminOrders';
import Header from './components/Header';
import Footer from './components/Footer';

export default function App() {
  return (
    <div className="app-root min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/media" element={<Media />} />
          <Route path="/admin/products" element={<AdminProducts />} />
          <Route path="/admin/orders" element={<AdminOrders />} />
          <Route path="/games" element={<Games />} />
          <Route path="/messenger" element={<Messenger />} />
          <Route path="/auth" element={<Auth />} />
        </Routes>
      </main>

      <Footer />
    </div>
  );
}
