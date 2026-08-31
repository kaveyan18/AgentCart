import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { ChatProvider } from './context/ChatContext';
import Home from './pages/Home';
import ProductDetail from './pages/ProductDetail';
import OrderConfirmed from './pages/OrderConfirmed';
import OrderHistory from './pages/OrderHistory';
import MerchantConsole from './pages/MerchantConsole';
import ChatBubble from './components/ChatBubble';
import ChatPanel from './components/ChatPanel';

export default function App() {
  return (
    <ChatProvider>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/product/:id" element={<ProductDetail />} />
        <Route path="/confirm" element={<OrderConfirmed />} />
        <Route path="/orders" element={<OrderHistory />} />
        <Route path="/admin" element={<MerchantConsole />} />
      </Routes>

      {/* Floating Chat Assistant Overlay */}
      <ChatBubble />
      <ChatPanel />
    </ChatProvider>
  );
}
