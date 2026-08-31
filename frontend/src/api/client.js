const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

async function request(path, options = {}) {
  const url = `${API_URL}${path}`;
  const defaultHeaders = { 'Content-Type': 'application/json' };

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

// 1. Products
export async function getProducts() {
  return request('/products');
}

export async function getProductById(id) {
  return request(`/products/${id}`);
}

// 2. Chat with AI Agent
export async function sendChatMessage(message, history = []) {
  return request('/chat', {
    method: 'POST',
    body: JSON.stringify({ message, history })
  });
}

// 3. Razorpay Orders & Verification
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

// 4. Order History
export async function getOrderHistory() {
  return request('/orders');
}

export async function getOrderStatus(id) {
  return request(`/orders/${id}/status`);
}

// 5. Merchant Console Audit Logs
export async function getAuditLogs() {
  return request('/orders/audit');
}
