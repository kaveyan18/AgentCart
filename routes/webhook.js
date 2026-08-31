const express = require('express');
const crypto = require('crypto');
const router = express.Router();
const Order = require('../models/Order');
const { writeLog } = require('../services/auditService');

// IMPORTANT: this route needs the RAW body for signature verification,
// so it must NOT go through express.json() — mount it before that middleware in server.js
router.post('/', express.raw({ type: 'application/json' }), async (req, res) => {
  const signature = req.headers['x-razorpay-signature'];
  const body = req.body;

  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
    .update(body)
    .digest('hex');

  if (signature !== expectedSignature) {
    await writeLog('webhook_signature_invalid', 'Rejected — signature mismatch', {});
    return res.status(400).json({ message: 'Invalid signature' });
  }

  const event = JSON.parse(body);
  const razorpayOrderId = event.payload?.payment?.entity?.order_id;

  if (!razorpayOrderId) {
    return res.status(400).json({ message: 'No order id in payload' });
  }

  const order = await Order.findOne({ razorpayOrderId });
  if (!order) {
    await writeLog('webhook_order_not_found', razorpayOrderId, {});
    return res.status(404).json({ message: 'Order not found' });
  }

  if (event.event === 'payment.captured') {
    order.status = 'paid';
    await order.save();
    await writeLog('payment_captured', `Order ${order._id} payment succeeded`, { razorpayOrderId });
  } else if (event.event === 'payment.failed') {
    order.status = 'failed';
    await order.save();
    await writeLog('payment_failed', `Order ${order._id} payment declined`, {
      razorpayOrderId,
      errorReason: event.payload?.payment?.entity?.error_reason
    });
  }

  res.status(200).json({ received: true });
});

module.exports = router;