// router.js — Screen navigation.
// Screens are plain <div class="screen"> elements toggled with .active.

import { loadOrders }    from './orders.js';
import { loadAdminData } from './admin.js';

const SCREENS = ['home', 'product', 'confirm', 'orders', 'admin'];

/**
 * Navigate to a screen by id-suffix (e.g. 'home', 'product').
 * Calls any screen-specific data loaders automatically.
 * @param {string} id
 */
export function showScreen(id) {
  SCREENS.forEach(name => {
    const el = document.getElementById('screen-' + name);
    if (el) el.classList.toggle('active', name === id);
  });

  const isAdmin = id === 'admin';
  const bubble  = document.getElementById('chatBubble');
  const panel   = document.getElementById('chatPanel');
  if (bubble) bubble.style.display = isAdmin ? 'none' : 'flex';
  if (isAdmin && panel) panel.classList.remove('open');

  // Lazy-load screen data
  if (id === 'orders') loadOrders();
  if (id === 'admin')  loadAdminData();

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Expose globally so inline onclick="" attributes in HTML still work
window.showScreen = showScreen;
