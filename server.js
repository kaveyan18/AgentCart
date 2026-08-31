require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');

const productRoutes = require('./routes/products');
const orderRoutes = require('./routes/orders');
const chatRoutes = require('./routes/chat');
const webhookRoutes = require('./routes/webhook');
const authRoutes = require('./routes/auth');
const AuditLog = require('./models/AuditLog');

const app = express();
connectDB();

// 1. CORS for Vite dev server (and any local client)
app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:3000'],
  credentials: true
}));

// 2. ⚠️ Webhook MUST come before express.json() — needs raw body for signature verification
app.use('/api/webhook', webhookRoutes);

// 3. Body parser & static assets
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// 4. API Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/chat', chatRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));