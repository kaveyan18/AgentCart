export function formatPrice(amount) {
  return '₹' + Number(amount || 0).toLocaleString('en-IN');
}

export function formatDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
}

export function formatTime(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}

export const CATEGORY_THEMES = {
  laptops: {
    bg: 'var(--sage-bg)',
    stroke: 'var(--sage)',
    catBg: 'var(--coral)',
    label: 'Laptops'
  },
  smartphones: {
    bg: 'var(--coral-bg)',
    stroke: 'var(--coral)',
    catBg: 'var(--coral)',
    label: 'Smartphones'
  },
  audio: {
    bg: 'var(--pink-bg)',
    stroke: 'var(--pink)',
    catBg: 'var(--sage)',
    label: 'Audio & Hi-Fi'
  },
  wearables: {
    bg: 'var(--lavender-bg)',
    stroke: 'var(--lavender)',
    catBg: 'var(--mustard)',
    label: 'Wearables & Watches'
  },
  cameras: {
    bg: 'var(--mustard-bg)',
    stroke: 'var(--mustard)',
    catBg: 'var(--coral)',
    label: 'Cameras & Video'
  },
  gaming: {
    bg: 'var(--lavender-bg)',
    stroke: 'var(--lavender)',
    catBg: 'var(--coral)',
    label: 'Gaming & Consoles'
  },
  tablets: {
    bg: 'var(--sage-bg)',
    stroke: 'var(--sage)',
    catBg: 'var(--coral)',
    label: 'Tablets & Creative'
  },
  smarthome: {
    bg: 'var(--mustard-bg)',
    stroke: 'var(--mustard)',
    catBg: 'var(--sage)',
    label: 'Smart Home & Lighting'
  },
  workspace: {
    bg: 'var(--sage-bg)',
    stroke: 'var(--sage)',
    catBg: 'var(--coral)',
    label: 'Workspace & Ergonomics'
  },
  charging: {
    bg: 'var(--mustard-bg)',
    stroke: 'var(--mustard)',
    catBg: 'var(--pink)',
    label: 'Power & Charging'
  },
  accessories: {
    bg: 'var(--cream)',
    stroke: 'var(--slate)',
    catBg: 'var(--coral)',
    label: 'Accessories'
  }
};

export const FALLBACK_THEME = {
  bg: 'var(--cream)',
  stroke: 'var(--slate)',
  catBg: 'var(--coral)',
  label: 'Tech Gear'
};

export function getCategoryTheme(category) {
  const key = (category || '').toLowerCase();
  return CATEGORY_THEMES[key] || FALLBACK_THEME;
}

// Product images mapping
export function getProductImage(productId) {
  if (!productId) return '/images/hero_banner.jpg';
  const cleanId = String(productId).trim();
  return `/images/${cleanId}.jpg`;
}
