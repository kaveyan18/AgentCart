// main.js — Application bootstrap.
// Wires together all modules and sets up global event listeners.

import { showScreen }    from './router.js';
import { loadProducts }  from './products.js';
import { toggleChat,
         addBubble,
         sendMessage,
         renderGateCard } from './chat.js';
import { initiatePayment } from './payment.js';
import { state }          from './state.js';

// ── Init ─────────────────────────────────────────────────────────

async function init() {
  // Load products on startup
  await loadProducts();

  // Start on Home screen
  showScreen('home');

  // Wire chat bubble + close button
  document.getElementById('chatBubble')?.addEventListener('click', toggleChat);
  document.getElementById('chatCloseBtn')?.addEventListener('click', toggleChat);

  // Wire chat send button
  document.getElementById('chatSend')?.addEventListener('click', handleSend);

  // Wire Enter key in chat input
  document.getElementById('chatInput')?.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  });

  // Wire nav links
  document.querySelectorAll('[data-nav]').forEach(el => {
    el.addEventListener('click', () => showScreen(el.dataset.nav));
  });
}

// ── Chat send handler ─────────────────────────────────────────────

function handleSend() {
  const input = document.getElementById('chatInput');
  const text  = input?.value.trim();
  if (!text) return;

  sendMessage(text, (orderData) => {
    // Called when the agent has proposed an order ready for payment
    renderGateCard(orderData, () => initiatePayment(orderData.items));
  });
}

// ── Run ───────────────────────────────────────────────────────────

init();
