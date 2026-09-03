const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.Mixed },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  qty: { type: Number, default: 1 }
}, { _id: false });

const orderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  userEmail: String,
  fullName: { type: String, default: '' },
  phone: { type: String, default: '' },
  shippingAddress: {
    street: { type: String, default: '' },
    city: { type: String, default: '' },
    state: { type: String, default: '' },
    postalCode: { type: String, default: '' },
    country: { type: String, default: 'India' }
  },
  items: [orderItemSchema],
  total: Number,
  status: { type: String, enum: ['created', 'paid', 'failed'], default: 'created' },
  razorpayOrderId: String,
  errorReason: String,
  errorCode: String,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Order', orderSchema);