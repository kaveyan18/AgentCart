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
const cartRoutes = require('./routes/cart');
const AuditLog = require('./models/AuditLog');

const app = express();
connectDB();

// 1. CORS for Vite dev server, Vercel frontend, and production origins
const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000',
  process.env.CLIENT_URL,
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
      callback(null, true);
    } else {
      callback(null, true); // Allow client requests in production
    }
  },
  credentials: true
}));

// 2. ⚠️ Webhook MUST come before express.json() — needs raw body for signature verification
app.use('/api/webhook', webhookRoutes);

// 3. Body parser & static assets
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// 4. API Routes & Machine-readable Agent Manifest
app.use('/api/auth', authRoutes);
app.get('/api/catalog.json', (req, res, next) => { req.url = '/catalog.json'; productRoutes(req, res, next); });
app.get('/catalog.json', (req, res, next) => { req.url = '/catalog.json'; productRoutes(req, res, next); });
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/chat', chatRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));