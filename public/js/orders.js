// orders.js — Order history screen

import { getOrders } from './api.js';
import { escHtml, formatPrice, formatDate } from './utils.js';

export async function loadOrders() {
  const list = document.getElementById('ordersList');
  list.innerHTML = '<div class="spinner"></div>';

  try {
    const orders = await getOrders();

    if (!orders.length) {
      list.innerHTML = `<div class="empty-state">
        <h3>No orders yet</h3>
        <p>Chat with AgentCart AI to place your first order!</p>
      </div>`;
      return;
    }

    list.innerHTML = orders.map(o => {
      const names = (o.items || []).map(i => i.name).join(' + ') || 'Order';
      const label = names.length > 55 ? names.slice(0, 55) + '…' : names;
      const date  = formatDate(o.createdAt);

      const pillClass = o.status === 'paid'   ? 'paid'
                      : o.status === 'failed' ? 'failed'
                      : 'created';
      const pillLabel = o.status === 'paid'   ? 'Paid'
                      : o.status === 'failed' ? 'Failed'
                      : 'Pending';

      return `
        <div class="order-card">
          <div class="order-left">
            <div class="oname">${escHtml(label)}</div>
            <div class="odate">${date}</div>
          </div>
          <div class="order-right">
            <span class="order-total">${formatPrice(o.total || 0)}</span>
            <span class="pill ${pillClass}">${pillLabel}</span>
          </div>
        </div>`;
    }).join('');

  } catch (_) {
    list.innerHTML = `<p style="color:var(--slate);padding:20px">Could not load orders.</p>`;
  }
}
