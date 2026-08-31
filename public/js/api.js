// api.js — All HTTP calls to the backend in one place.
// Returns parsed JSON or throws an Error with a human-readable message.

const BASE = '';   // same-origin; change if backend moves to a different port

async function request(method, path, body) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  if (body !== undefined) opts.body = JSON.stringify(body);

  const res = await fetch(BASE + path, opts);
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.message || data.error || `HTTP ${res.status}`);
  }
  return data;
}

/** Fetch all products */
export const getProducts = () => request('GET', '/api/products');

/** Fetch recent orders */
export const getOrders = () => request('GET', '/api/orders');

/** Fetch audit logs */
export const getAuditLogs = () => request('GET', '/api/audit');

/**
 * Send a chat message through the AI agent.
 * @param {string} message
 * @param {Array}  history  - conversation history array
 * @returns {{ reply: string, history: Array }}
 */
export const sendChat = (message, history) =>
  request('POST', '/api/chat', { message, history });

/**
 * Create a Razorpay order.
 * @param {{ name: string, price: number, qty: number }[]} items
 */
export const confirmOrder = (items) =>
  request('POST', '/api/orders/confirm', { items });

/**
 * Verify a Razorpay payment signature server-side.
 * @param {{ orderId, razorpayPaymentId, razorpayOrderId, razorpaySignature }} payload
 */
export const verifyPayment = (payload) =>
  request('POST', '/api/orders/verify', payload);

/**
 * Record a payment failure.
 * @param {{ orderId, razorpayOrderId, errorReason, errorCode }} payload
 */
export const failPayment = (payload) =>
  request('POST', '/api/orders/fail', payload);
