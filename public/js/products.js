// products.js — Product grid and product detail rendering.

import { state }       from './state.js';
import { getProducts } from './api.js';
import { showScreen }  from './router.js';
import { openChat }    from './chat.js';
import { escHtml, formatPrice, categoryIcon, CATEGORY_COLORS, FALLBACK_COLOR } from './utils.js';

// ── Load + render grid ───────────────────────────────────────────

export async function loadProducts() {
  const grid = document.getElementById('productGrid');
  grid.innerHTML = '<div class="spinner"></div>';

  try {
    state.products = await getProducts();
    renderProductGrid();
  } catch (_) {
    grid.innerHTML = `<p style="color:var(--slate);padding:20px;grid-column:1/-1">
      Could not load products — is the server running?</p>`;
  }
}

function renderProductGrid() {
  const grid = document.getElementById('productGrid');

  if (!state.products.length) {
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1">
      <h3>No products yet</h3><p>Run <code>node scripts/seed.js</code> to add products.</p>
    </div>`;
    return;
  }

  grid.innerHTML = state.products.slice(0, 8).map(p => {
    const col = CATEGORY_COLORS[p.category] || FALLBACK_COLOR;
    const icon = categoryIcon(p.category, { width: 44, height: 44 });
    return `
      <div class="product-card" data-id="${p._id}" role="button" tabindex="0"
           aria-label="View ${escHtml(p.name)}, ${formatPrice(p.price)}">
        <div class="thumb" style="background:${col.bg}">${icon}</div>
        <div class="stars">★★★★☆</div>
        <div class="pname">${escHtml(p.name)}</div>
        <div class="pprice">${formatPrice(p.price)}</div>
      </div>`;
  }).join('');

  // Attach click handlers (avoids inline onclick)
  grid.querySelectorAll('.product-card').forEach(card => {
    const handler = () => showProduct(card.dataset.id);
    card.addEventListener('click', handler);
    card.addEventListener('keydown', e => { if (e.key === 'Enter') handler(); });
  });
}

// ── Product detail ───────────────────────────────────────────────

export function showProduct(id) {
  const p = state.products.find(x => String(x._id) === String(id));
  if (!p) return;
  state.currentProduct = p;

  const related = (p.relatedTo || [])
    .map(rid => state.products.find(x => String(x._id) === String(rid)))
    .filter(Boolean);

  const col  = CATEGORY_COLORS[p.category] || FALLBACK_COLOR;
  const icon = categoryIcon(p.category, { width: 120, height: 120, strokeWidth: '1.2' });

  const relatedHtml = related.length
    ? `<div class="related-title">Frequently bought together</div>
       <div class="related-row">${related.map(r => {
         const rc   = CATEGORY_COLORS[r.category] || FALLBACK_COLOR;
         const rIcon = categoryIcon(r.category, { width: 24, height: 24 });
         return `<div class="related-card" data-id="${r._id}" role="button" tabindex="0">
           <div class="thumb" style="background:${rc.bg}">${rIcon}</div>
           <div class="pname">${escHtml(r.name)}</div>
           <div class="pprice">${formatPrice(r.price)}</div>
         </div>`;
       }).join('')}</div>`
    : '';

  document.getElementById('productDetail').innerHTML = `
    <div class="pd-image" style="background:${col.bg}">${icon}</div>
    <div>
      <div class="pd-name">${escHtml(p.name)}</div>
      <div class="pd-meta">★★★★☆ &nbsp;·&nbsp; ${escHtml(p.category)}</div>
      <div class="pd-price">${formatPrice(p.price)}</div>
      <div class="pd-desc">${escHtml(p.description || 'Premium quality product.')}</div>
      <div class="pd-actions">
        <button class="btn btn-primary" id="pdAskAI">Ask AI to add this</button>
        <button class="btn btn-secondary">Add to cart</button>
      </div>
      ${relatedHtml}
    </div>`;

  // Wire "Ask AI" button — opens chat with pre-filled message
  document.getElementById('pdAskAI').addEventListener('click', () => {
    openChat();
    const input = document.getElementById('chatInput');
    if (input) input.value = `I want to buy the ${p.name}`;
  });

  // Wire related cards
  document.querySelectorAll('.related-card').forEach(card => {
    card.addEventListener('click', () => showProduct(card.dataset.id));
  });

  showScreen('product');
}

// Expose for inline navigation links
window.showProduct = showProduct;
