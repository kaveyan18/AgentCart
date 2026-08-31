const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { reviewOrder } = require('../services/policyGate');
const { createRazorpayOrder } = require('../services/razorpayService');
const { writeLog } = require('../services/auditService');
const Order = require('../models/Order');
const AuditLog = require('../models/AuditLog');

// 1. Audit log endpoint for merchant console (must come before /:id)
router.get('/audit', async (req, res) => {
  try {
    const logs = await AuditLog.find().sort({ timestamp: -1 }).limit(50);
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: 'Could not fetch audit logs', detail: err.message });
  }
});

// 2. All orders list (for order history)
router.get('/', async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 }).limit(50);
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: 'Could not fetch orders', detail: err.message });
  }
});

// 3. Buyer clicked "Confirm payment" — re-validate through the gate, then hit Razorpay
router.post('/confirm', async (req, res) => {
  const { items, discountPercent } = req.body;

  // Re-run the gate here too — never trust a total the frontend sends back to you
  const gateResult = reviewOrder({ items, discountPercent });

  await writeLog('order_confirm', 'Buyer confirmed payment, re-validating before Razorpay call', gateResult);

  if (!gateResult.approved) {
    return res.status(400).json({ status: 'blocked', message: gateResult.reason });
  }

  try {
    const razorpayOrder = await createRazorpayOrder(gateResult.total, `receipt_${Date.now()}`);

    const order = await Order.create({
      items,
      total: gateResult.total,
      status: 'created',
      razorpayOrderId: razorpayOrder.id
    });

    await writeLog('razorpay_order_created', `Order ${order._id} created in Razorpay`, { razorpayOrderId: razorpayOrder.id });

    res.json({
      orderId: order._id,
      razorpayOrderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      keyId: process.env.RAZORPAY_KEY_ID
    });
  } catch (err) {
    await writeLog('razorpay_order_failed', err.message, { error: true });
    res.status(500).json({ status: 'error', message: 'Could not create payment order' });
  }
});

// 4. Direct client payment verification
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

  await writeLog('payment_captured', `Order ${order._id} payment verified & paid`, { razorpayOrderId, razorpayPaymentId });

  res.json({ status: 'paid', order });
});

// 5. Direct client failure handler
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
  });

  res.json({ status: 'failed', errorReason: order?.errorReason, order });
});

// 6. Check status of an order — used after payment completes
router.get('/:id/status', async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).json({ message: 'Order not found' });
  res.json({ status: order.status, total: order.total });
});

module.exports = router;