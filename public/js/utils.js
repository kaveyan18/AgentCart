// utils.js — Pure utility functions with no side-effects

/**
 * Escape a string for safe injection into HTML text/attribute contexts.
 * @param {*} str
 * @returns {string}
 */
export function escHtml(str) {
  const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  return String(str ?? '').replace(/[&<>"']/g, c => map[c]);
}

/**
 * Format a numeric amount as an Indian-locale rupee string.
 * @param {number} amount
 * @returns {string}  e.g.  "₹29,999"
 */
export function formatPrice(amount) {
  return '₹' + Number(amount).toLocaleString('en-IN');
}

/**
 * Format an ISO date string as a human-readable Indian date.
 * @param {string} iso
 * @returns {string}  e.g.  "28 Aug 2026"
 */
export function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

/** Map product category slug → { bg, stroke } colour pair */
export const CATEGORY_COLORS = {
  accessories: { bg: 'var(--sage-bg)',     stroke: 'var(--sage)'     },
  audio:       { bg: 'var(--pink-bg)',     stroke: 'var(--pink)'     },
  chargers:    { bg: 'var(--mustard-bg)',  stroke: 'var(--mustard)'  },
  cables:      { bg: 'var(--lavender-bg)', stroke: 'var(--lavender)' },
  workspace:   { bg: 'var(--lavender-bg)', stroke: 'var(--lavender)' },
};

/** Fallback colour pair for unknown categories */
export const FALLBACK_COLOR = { bg: 'var(--cream)', stroke: 'var(--slate)' };

/** Map product category slug → SVG path(s) to render inside a 24×24 viewBox */
export const CATEGORY_ICONS = {
  accessories: '<rect x="7" y="2" width="10" height="20" rx="2"/>',
  audio:       '<circle cx="8" cy="12" r="3.2"/><circle cx="16" cy="12" r="3.2"/>',
  chargers:    '<rect x="4" y="8" width="16" height="8" rx="2"/>',
  cables:      '<polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/>',
  workspace:   '<rect x="3" y="4" width="18" height="12" rx="2"/><line x1="8" y1="20" x2="16" y2="20"/><line x1="12" y1="16" x2="12" y2="20"/>',
};

export const FALLBACK_ICON = '<circle cx="12" cy="12" r="8"/>';

/** Build a full <svg> string for a category */
export function categoryIcon(category, { width = 44, height = 44, strokeWidth = '1.4', stroke } = {}) {
  const col = CATEGORY_COLORS[category] || FALLBACK_COLOR;
  const paths = CATEGORY_ICONS[category] || FALLBACK_ICON;
  return `<svg viewBox="0 0 24 24" fill="none" stroke-width="${strokeWidth}"
    style="stroke:${stroke || col.stroke};width:${width}px;height:${height}px">${paths}</svg>`;
}
