const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { reviewOrder, evaluateTransaction, validateAndCalculateCart } = require('../services/policyGate');
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

// 4. Buyer confirmed payment — validate genuine DB prices & enforce bounded financial autonomy policy
router.post('/confirm', requireAuth, async (req, res) => {
  const {
    items,
    discountPercent,
    fullName,
    phone,
    shippingAddress,
    userConfirmed = false,
    source = 'ai_agent',
    isManualCheckout = false
  } = req.body;

  // 1. Never trust amount from AI or frontend — calculate actual amount from backend DB
  const cartCalc = await validateAndCalculateCart(items, discountPercent);

  if (cartCalc.verifiedItems.length === 0) {
    return res.status(400).json({ status: 'blocked', message: 'Cart contains no valid items' });
  }

  // 2. Evaluate Bounded Financial Autonomy Policy
  const effectiveSource = isManualCheckout ? 'user' : source;
  const policyDecision = evaluateTransaction(cartCalc.discountedTotal, {
    source: effectiveSource,
    userConfirmed: Boolean(userConfirmed),
    isManualCheckout: Boolean(isManualCheckout)
  });

  // 3. Record structured audit log event
  const auditAction = userConfirmed ? 'CHECKOUT_CONFIRMED' : 'CHECKOUT_REQUEST';
  await writeLog(
    auditAction,
    policyDecision.reason,
    {
      action: policyDecision.action,
      allowed: policyDecision.allowed,
      requiresConfirmation: policyDecision.requiresConfirmation,
      total: cartCalc.discountedTotal,
      tier: policyDecision.tier,
      userConfirmed: Boolean(userConfirmed)
    },
    req.userId,
    {
      cartTotal: cartCalc.discountedTotal,
      policyDecision: policyDecision.action,
      userConfirmed: Boolean(userConfirmed),
      source: effectiveSource
    }
  );

  // 4. Enforce Policy Gate decisions
  // Tier 2: ₹50,001 – ₹1,00,000 requires explicit buyer confirmation
  if (policyDecision.action === 'REQUIRE_CONFIRMATION') {
    return res.status(400).json({
      status: 'requires_confirmation',
      policy: 'REQUIRE_CONFIRMATION',
      total: cartCalc.discountedTotal,
      message: `Your cart total is ₹${cartCalc.discountedTotal.toLocaleString('en-IN')}. This amount requires your explicit confirmation before proceeding.`
    });
  }

  // Tier 3: Above ₹1,00,000 for AI agent requires manual checkout by user
  if (policyDecision.action === 'MANUAL_CHECKOUT') {
    return res.status(403).json({
      status: 'manual_checkout_required',
      policy: 'MANUAL_CHECKOUT',
      total: cartCalc.discountedTotal,
      message: `Cart total of ₹${cartCalc.discountedTotal.toLocaleString('en-IN')} exceeds the AI agent autonomous limit (₹1,00,000). Please review and checkout manually via the Cart.`
    });
  }

  // Allowed transactions (AUTO_CHECKOUT, CONFIRMED_CHECKOUT, or MANUAL_USER_APPROVED)
  try {
    const user = await User.findById(req.userId);
    const razorpayOrder = await createRazorpayOrder(cartCalc.discountedTotal, `rcpt_${Date.now().toString().slice(-8)}`);

    const finalFullName = fullName?.trim() || user?.name || 'Valued Customer';
    const finalPhone = phone?.trim() || user?.phone || '+91 98765 43210';
    const finalAddress = (shippingAddress && shippingAddress.street) ? shippingAddress : (user?.shippingAddress?.street ? user.shippingAddress : {
      street: '123 Tech Residency, 4th Cross Road',
      city: 'Bengaluru',
      state: 'Karnataka',
      postalCode: '560034',
      country: 'India'
    });

    const order = await Order.create({
      userId: req.userId,
      userEmail: user ? user.email : undefined,
      fullName: finalFullName,
      phone: finalPhone,
      shippingAddress: finalAddress,
      items: cartCalc.verifiedItems,
      total: cartCalc.discountedTotal,
      status: 'created',
      razorpayOrderId: razorpayOrder.id
    });

    await writeLog('razorpay_order_created', `Order ${order._id} created in Razorpay [policy:${policyDecision.action}] (Total: ₹${cartCalc.discountedTotal})`, { razorpayOrderId: razorpayOrder.id, total: cartCalc.discountedTotal }, req.userId, {
      cartTotal: cartCalc.discountedTotal,
      policyDecision: policyDecision.action,
      userConfirmed: Boolean(userConfirmed),
      source: effectiveSource
    });

    res.json({
      orderId: order._id,
      razorpayOrderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
      policyAction: policyDecision.action,
      total: cartCalc.discountedTotal,
      fullName: finalFullName,
      phone: finalPhone,
      shippingAddress: finalAddress
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