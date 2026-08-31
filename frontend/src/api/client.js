const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export function getStoredToken() {
  return localStorage.getItem('agentcart_token');
}

export function setStoredAuth(token, user) {
  if (token) localStorage.setItem('agentcart_token', token);
  else localStorage.removeItem('agentcart_token');

  if (user) localStorage.setItem('agentcart_user', JSON.stringify(user));
  else localStorage.removeItem('agentcart_user');
}

export function getStoredUser() {
  try {
    const raw = localStorage.getItem('agentcart_user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

async function request(path, options = {}) {
  const url = `${API_URL}${path}`;
  const defaultHeaders = { 'Content-Type': 'application/json' };

  const token = getStoredToken();
  if (token) {
    defaultHeaders['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers
    }
  };

  const response = await fetch(url, config);
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(data.message || data.error || `HTTP ${response.status}`);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

// ── 1. Auth ───────────────────────────────────────────────────────────────────
export async function registerUser({ name, email, password }) {
  return request('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ name, email, password })
  });
}

export async function loginUser({ email, password }) {
  return request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password })
  });
}

export async function getCurrentUser() {
  return request('/auth/me');
}

// ── 2. Products ───────────────────────────────────────────────────────────────
export async function getProducts() {
  return request('/products');
}

export async function getProductById(id) {
  return request(`/products/${id}`);
}

// ── 3. Chat with AI Agent ────────────────────────────────────────────────────
export async function sendChatMessage(message, history = []) {
  return request('/chat', {
    method: 'POST',
    body: JSON.stringify({ message, history })
  });
}

// ── 4. Razorpay Orders & Verification ─────────────────────────────────────────
export async function createOrder(items, discountPercent = 0) {
  return request('/orders/confirm', {
    method: 'POST',
    body: JSON.stringify({ items, discountPercent })
  });
}

export async function verifyOrderPayment(payload) {
  return request('/orders/verify', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export async function reportOrderFailure(payload) {
  return request('/orders/fail', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

// ── 5. Order History & Tracking ──────────────────────────────────────────────
export async function getOrderHistory() {
  return request('/orders');
}

export async function getAllOrdersForAdmin() {
  return request('/orders/all');
}

export async function getOrderStatus(id) {
  return request(`/orders/${id}/status`);
}

// ── 6. Merchant Console Audit Logs ───────────────────────────────────────────
export async function getAuditLogs() {
  return request('/orders/audit');
}
