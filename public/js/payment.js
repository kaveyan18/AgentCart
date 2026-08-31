// payment.js — Razorpay checkout, verify, and failure flow.

import { state }        from './state.js';
import { confirmOrder, verifyPayment, failPayment } from './api.js';
import { addBubble, showTyping, hideTyping, showBadge } from './chat.js';
import { sendChat }     from './api.js';
import { showScreen }   from './router.js';
import { escHtml, formatPrice } from './utils.js';

/**
 * Open the Razorpay modal for the given items and wire success/failure handlers.
 * @param {{ name: string, price: number, qty?: number }[]} items
 */
export async function initiatePayment(items) {
  addBubble('Initiating payment…', 'agent');

  let orderData;
  try {
    orderData = await confirmOrder(items);
  } catch (err) {
    addBubble('Could not create order: ' + err.message, 'agent');
    return;
  }

  const rzpOptions = {
    key:        orderData.keyId,
    amount:     orderData.amount,
    currency:   orderData.currency,
    order_id:   orderData.razorpayOrderId,
    name:       'AgentCart',
    description: items.map(i => i.name).join(', '),
    theme:      { color: '#F0654A' },
    prefill:    { name: 'Test User', email: 'test@example.com', contact: '9999999999' },

    handler: async (response) => {
      addBubble('Verifying payment…', 'agent');
      try {
        const result = await verifyPayment({
          orderId:             orderData.orderId,
          razorpayPaymentId:   response.razorpay_payment_id,
          razorpayOrderId:     response.razorpay_order_id,
          razorpaySignature:   response.razorpay_signature,
        });

        if (result.status === 'paid') {
          showConfirmScreen(orderData, items, true);
          await notifyAgent(orderData.orderId, 'paid');
        } else {
          addBubble('Verification failed — please contact support.', 'agent');
        }
      } catch (err) {
        addBubble('Verification error: ' + err.message, 'agent');
      }
    },

    modal: {
      ondismiss: () => {
        addBubble("Payment cancelled. Tap \"Confirm payment\" whenever you're ready.", 'agent');
        // Re-enable the gate confirm button if still visible
        const btn = document.getElementById('gateConfirmBtn');
        if (btn) btn.disabled = false;
      },
    },
  };

  const rzp = new window.Razorpay(rzpOptions);

  rzp.on('payment.failed', async (response) => {
    try {
      await failPayment({
        orderId:        orderData.orderId,
        razorpayOrderId: orderData.razorpayOrderId,
        errorReason:    response.error.description,
        errorCode:      response.error.code,
      });
    } catch (_) { /* best-effort */ }

    showConfirmScreen(orderData, items, false, response.error.description);
    await notifyAgent(orderData.orderId, 'failed', response.error.description);
  });

  rzp.open();
}

// ── Confirmation screen ──────────────────────────────────────────

function showConfirmScreen(orderData, items, success, errorReason) {
  const card = document.getElementById('confirmCard');
  const total = items.reduce((s, i) => s + i.price * (i.qty || 1), 0);

  if (success) {
    const itemRows = items.map(i =>
      `<div class="item-row">
        <span>${escHtml(i.name)}</span>
        <span>${formatPrice(i.price * (i.qty || 1))}</span>
      </div>`
    ).join('');

    card.innerHTML = `
      <div class="confirm-icon success">
        <svg viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" stroke-width="2.4"/></svg>
      </div>
      <div class="confirm-title">Payment successful!</div>
      <div class="confirm-sub">A confirmation has been sent to your email</div>
      <div class="confirm-order-id">Order #${String(orderData.orderId).slice(-8).toUpperCase()}</div>
      ${itemRows}
      <div class="total-row"><span>Total paid</span><span>${formatPrice(total)}</span></div>
      <button class="btn btn-primary btn-full" onclick="showScreen('home')">Continue shopping</button>`;
  } else {
    card.innerHTML = `
      <div class="confirm-icon failure">
        <svg viewBox="0 0 24 24">
          <line x1="18" y1="6" x2="6" y2="18" stroke-width="2.4"/>
          <line x1="6"  y1="6" x2="18" y2="18" stroke-width="2.4"/>
        </svg>
      </div>
      <div class="confirm-title">Payment failed</div>
      <div class="confirm-sub">${escHtml(errorReason || 'Your payment was not successful')}</div>
      <div class="failure-actions">
        <button class="btn btn-primary btn-full" onclick="showScreen('home')">Try again</button>
        <button class="btn btn-secondary btn-full" onclick="showScreen('home')">Browse products</button>
      </div>`;
  }

  document.getElementById('chatPanel')?.classList.remove('open');
  showScreen('confirm');
}

// ── Agent status notification ────────────────────────────────────

async function notifyAgent(orderId, status, errorReason) {
  const msgMap = {
    paid:   `Payment attempt completed for order ${orderId}, please check status and let the buyer know`,
    failed: `Payment failed for order ${orderId}${errorReason ? ' (' + errorReason + ')' : ''}, please check status and explain to the buyer`,
  };

  showTyping();
  try {
    const data = await sendChat(msgMap[status], state.chatHistory);
    hideTyping();
    if (!data.error) {
      state.chatHistory = data.history;
      addBubble(data.reply, 'agent');
    }
  } catch (_) {
    hideTyping();
  }
  showBadge();
}
