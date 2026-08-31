// chat.js — Chat panel UI and send logic.
// Renders bubbles, typing indicator, upsell cards, and gate cards.

import { state }      from './state.js';
import { sendChat }   from './api.js';
import { escHtml }    from './utils.js';

// ── Panel toggle ────────────────────────────────────────────────

export function toggleChat() {
  const panel = document.getElementById('chatPanel');
  panel.classList.toggle('open');
  clearBadge();
  if (panel.classList.contains('open')) {
    document.getElementById('chatInput')?.focus();
  }
}

export function openChat() {
  document.getElementById('chatPanel').classList.add('open');
  clearBadge();
  document.getElementById('chatInput')?.focus();
}

function clearBadge() {
  document.getElementById('chatBadge')?.classList.remove('show');
}

export function showBadge() {
  const panel = document.getElementById('chatPanel');
  if (!panel?.classList.contains('open')) {
    document.getElementById('chatBadge')?.classList.add('show');
  }
}

// ── Message rendering ────────────────────────────────────────────

const chatBody = () => document.getElementById('chatBody');

/** Append a plain text bubble. Returns the element. */
export function addBubble(text, role) {
  const div = document.createElement('div');
  div.className = `bubble ${role === 'user' ? 'buyer' : 'agent'}`;
  div.textContent = text;
  chatBody().appendChild(div);
  scrollToBottom();
  return div;
}

/** Render a gate / order-summary card with a confirm-payment button. */
export function renderGateCard(orderData, onConfirm) {
  const { items = [], total } = orderData;

  const card = document.createElement('div');
  card.className = 'gate-card';

  const rows = items
    .map(it => `<div class="gate-row">
      <span>${escHtml(it.name)}</span>
      <span>₹${(it.price * (it.qty || 1)).toLocaleString('en-IN')}</span>
    </div>`)
    .join('');

  card.innerHTML = `
    ${rows}
    <div class="gate-total">
      <span>Total</span>
      <span>₹${total.toLocaleString('en-IN')}</span>
    </div>
    <button class="gate-confirm-btn" id="gateConfirmBtn">
      Confirm ₹${total.toLocaleString('en-IN')} payment
    </button>`;

  chatBody().appendChild(card);

  card.querySelector('#gateConfirmBtn').addEventListener('click', () => {
    card.querySelector('#gateConfirmBtn').disabled = true;
    onConfirm();
  });

  scrollToBottom();
  return card;
}

// ── Typing indicator ─────────────────────────────────────────────

export function showTyping() {
  if (document.getElementById('typingIndicator')) return;
  const div = document.createElement('div');
  div.className = 'typing-indicator';
  div.id = 'typingIndicator';
  div.innerHTML = `<div class="typing-dots"><span></span><span></span><span></span></div>`;
  chatBody().appendChild(div);
  scrollToBottom();
}

export function hideTyping() {
  document.getElementById('typingIndicator')?.remove();
}

// ── Send message ─────────────────────────────────────────────────

/**
 * Send a user message to the agent and render its reply.
 * If `onOrderProposed` is provided, it is called when the reply contains
 * a gate-ready order (items + total extracted from the response).
 *
 * @param {string}   text
 * @param {Function} [onOrderProposed]  — called with { items, total }
 */
export async function sendMessage(text, onOrderProposed) {
  if (!text?.trim()) return;

  const sendBtn = document.getElementById('chatSend');
  const input   = document.getElementById('chatInput');
  if (input)   input.value = '';
  if (sendBtn) sendBtn.disabled = true;

  addBubble(text, 'user');
  showTyping();

  try {
    const data = await sendChat(text, state.chatHistory);
    hideTyping();

    if (data.error) {
      addBubble('Sorry, something went wrong — please try again.', 'agent');
      return;
    }

    state.chatHistory = data.history;

    // If the agent proposed an order and we have pending order data, show gate card
    if (state.pendingOrder && onOrderProposed) {
      addBubble(data.reply, 'agent');
      onOrderProposed(state.pendingOrder);
      state.pendingOrder = null;
    } else {
      addBubble(data.reply, 'agent');
    }

    showBadge();

  } catch (err) {
    hideTyping();
    addBubble('Connection error. Is the server running?', 'agent');
  } finally {
    if (sendBtn) sendBtn.disabled = false;
    input?.focus();
  }
}

// ── Helpers ──────────────────────────────────────────────────────

function scrollToBottom() {
  const body = chatBody();
  if (body) body.scrollTop = body.scrollHeight;
}
