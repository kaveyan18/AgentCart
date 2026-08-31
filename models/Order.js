const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  items: [{ name: String, price: Number, qty: Number }],
  total: Number,
  status: { type: String, enum: ['created', 'paid', 'failed'], default: 'created' },
  razorpayOrderId: String,
  errorReason: String,
  errorCode: String,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Order', orderSchema);