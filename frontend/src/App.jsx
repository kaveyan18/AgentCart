import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ChatProvider } from './context/ChatContext';
import Home from './pages/Home';
import ProductDetail from './pages/ProductDetail';
import OrderConfirmed from './pages/OrderConfirmed';
import OrderHistory from './pages/OrderHistory';
import Profile from './pages/Profile';
import MerchantConsole from './pages/MerchantConsole';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ProtectedRoute from './components/ProtectedRoute';
import MerchantRoute from './components/MerchantRoute';
import ChatBubble from './components/ChatBubble';
import ChatPanel from './components/ChatPanel';

export default function App() {
  return (
    <AuthProvider>
      <ChatProvider>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route
            path="/confirm"
            element={
              <ProtectedRoute>
                <OrderConfirmed />
              </ProtectedRoute>
            }
          />
          <Route
            path="/orders"
            element={
              <ProtectedRoute>
                <OrderHistory />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <MerchantRoute>
                <MerchantConsole />
              </MerchantRoute>
            }
          />
        </Routes>

        {/* Floating Chat Assistant Overlay */}
        <ChatBubble />
        <ChatPanel />
      </ChatProvider>
    </AuthProvider>
  );
}
