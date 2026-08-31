const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { reviewOrder } = require('../services/policyGate');
const { createRazorpayOrder } = require('../services/razorpayService');
const { writeLog } = require('../services/auditService');
const { requireAuth, optionalAuth } = require('../middleware/requireAuth');
const requireMerchant = require('../middleware/requireMerchant');
const Order = require('../models/Order');
const AuditLog = require('../models/AuditLog');
const User = require('../models/User');

// 1. Audit log endpoint for merchant console (must come before /:id) — Merchant Protected
router.get('/audit', requireMerchant, async (req, res) => {
  try {
    const logs = await AuditLog.find()
      .populate('userId', 'name email')
      .sort({ timestamp: -1 })
      .limit(50);
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: 'Could not fetch audit logs', detail: err.message });
  }
});

// 2. All orders for merchant console — Merchant Protected
router.get('/all', requireMerchant, async (req, res) => {
  try {
    const orders = await Order.find()
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .limit(100);
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: 'Could not fetch all orders', detail: err.message });
  }
});

// 3. User's personal order history (protected)
router.get('/', requireAuth, async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.userId })
      .sort({ createdAt: -1 })
      .limit(50);
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: 'Could not fetch user orders', detail: err.message });
  }
});

// 4. Buyer confirmed payment — re-validate through gate, create Razorpay order & associate with user
router.post('/confirm', requireAuth, async (req, res) => {
  const { items, discountPercent } = req.body;

  // Re-run the gate here too — never trust a total the frontend sends back to you
  const gateResult = reviewOrder({ items, discountPercent });

  await writeLog('order_confirm', 'Buyer confirmed payment, re-validating before Razorpay call', gateResult, req.userId);

  if (!gateResult.approved) {
    return res.status(400).json({ status: 'blocked', message: gateResult.reason });
  }

  try {
    const user = await User.findById(req.userId);
    const razorpayOrder = await createRazorpayOrder(gateResult.total, `rcpt_${Date.now().toString().slice(-8)}`);

    const order = await Order.create({
      userId: req.userId,
      userEmail: user ? user.email : undefined,
      items,
      total: gateResult.total,
      status: 'created',
      razorpayOrderId: razorpayOrder.id
    });

    await writeLog('razorpay_order_created', `Order ${order._id} created in Razorpay for ${user?.email || 'user'}`, { razorpayOrderId: razorpayOrder.id, total: gateResult.total }, req.userId);

    res.json({
      orderId: order._id,
      razorpayOrderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      keyId: process.env.RAZORPAY_KEY_ID
    });
  } catch (err) {
    await writeLog('razorpay_order_failed', err.message, { error: true }, req.userId);
    res.status(500).json({ status: 'error', message: 'Could not create payment order' });
  }
});

// 5. Direct client payment verification
router.post('/verify', async (req, res) => {
  const { orderId, razorpayPaymentId, razorpayOrderId, razorpaySignature } = req.body;

  // Verify HMAC signature: sha256(order_id + "|" + payment_id, secret)
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest('hex');

  if (expectedSignature !== razorpaySignature) {
    await writeLog('payment_verify_failed', 'Signature mismatch in client verification', { orderId, razorpayPaymentId });
    return res.status(400).json({ status: 'invalid_signature', message: 'Payment verification failed' });
  }

  const order = await Order.findByIdAndUpdate(
    orderId,
    { status: 'paid' },
    { new: true }
  );

  await writeLog('payment_captured', `Order ${order?._id} payment verified & paid`, { razorpayOrderId, razorpayPaymentId }, order?.userId);

  res.json({ status: 'paid', order });
});

// 6. Direct client failure handler
router.post('/fail', async (req, res) => {
  const { orderId, razorpayOrderId, errorReason, errorCode } = req.body;

  const order = await Order.findByIdAndUpdate(
    orderId,
    {
      status: 'failed',
      errorReason: errorReason || 'Payment declined',
      errorCode: errorCode || 'PAYMENT_FAILED'
    },
    { new: true }
  );

  await writeLog('payment_failed', `Order ${orderId} declined: ${errorReason || 'Payment declined'}`, {
    razorpayOrderId,
    errorReason,
    errorCode
  }, order?.userId);

  res.json({ status: 'failed', errorReason: order?.errorReason, order });
});

// 7. Check status of an order
router.get('/:id/status', async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).json({ message: 'Order not found' });
  res.json({ status: order.status, total: order.total, orderId: order._id });
});

module.exports = router;