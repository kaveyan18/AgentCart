/**
 * services/policyGate.js
 * 
 * Enforces Bounded Financial Autonomy for the AI Agent:
 * - Tier 1 (₹0 – ₹50,000): AUTO_CHECKOUT — Agent can proceed automatically
 * - Tier 2 (₹50,001 – ₹1,00,000): REQUIRE_CONFIRMATION — Agent requires explicit confirmation
 * - Tier 3 (Above ₹1,00,000): MANUAL_CHECKOUT — Agent cannot autonomously checkout; user must checkout manually
 * 
 * Note: The human buyer is NEVER blocked from purchasing high-value carts (>₹1L).
 * The policy boundaries only constrain the AI agent's autonomous authority.
 */

const POLICY = {
  AUTONOMOUS_LIMIT: 50000,       // ₹50,000 auto-checkout ceiling
  CONFIRMATION_LIMIT: 100000,    // ₹1,00,000 confirmation ceiling
  MAX_DISCOUNT_PERCENT: 10
};

const MAX_ORDER_VALUE = POLICY.CONFIRMATION_LIMIT;
const MAX_DISCOUNT_PERCENT = POLICY.MAX_DISCOUNT_PERCENT;

/**
 * Evaluates the policy action for a given server-verified transaction amount.
 * 
 * @param {number} amount - Final cart total in INR
 * @param {Object} options - { source: 'ai_agent' | 'user', userConfirmed: boolean, isManualCheckout: boolean }
 * @returns {Object} { action, allowed, requiresConfirmation, tier, amount, reason }
 */
function evaluateTransaction(amount, options = {}) {
  const {
    source = 'ai_agent',
    userConfirmed = false,
    isManualCheckout = false
  } = options;

  const numericAmount = Math.max(0, Number(amount) || 0);

  // Manual checkout initiated directly by human buyer on /cart
  if (isManualCheckout || source === 'user') {
    return {
      action: 'MANUAL_USER_APPROVED',
      allowed: true,
      requiresConfirmation: false,
      tier: numericAmount <= POLICY.AUTONOMOUS_LIMIT ? 'tier1' : numericAmount <= POLICY.CONFIRMATION_LIMIT ? 'tier2' : 'tier3',
      amount: numericAmount,
      reason: `Direct human checkout approved for ₹${numericAmount}`
    };
  }

  // Tier 1: ₹0 – ₹50,000 → Autonomous checkout
  if (numericAmount <= POLICY.AUTONOMOUS_LIMIT) {
    return {
      action: 'AUTO_CHECKOUT',
      allowed: true,
      requiresConfirmation: false,
      tier: 'tier1',
      amount: numericAmount,
      reason: `Autonomous checkout approved: ₹${numericAmount} is within autonomous limit (≤ ₹${POLICY.AUTONOMOUS_LIMIT})`
    };
  }

  // Tier 2: ₹50,001 – ₹1,00,000 → Explicit user confirmation
  if (numericAmount <= POLICY.CONFIRMATION_LIMIT) {
    if (userConfirmed) {
      return {
        action: 'CONFIRMED_CHECKOUT',
        allowed: true,
        requiresConfirmation: false,
        tier: 'tier2',
        amount: numericAmount,
        reason: `Checkout approved after explicit user confirmation for ₹${numericAmount}`
      };
    }
    return {
      action: 'REQUIRE_CONFIRMATION',
      allowed: true, // conditionally allowed once user confirms
      requiresConfirmation: true,
      tier: 'tier2',
      amount: numericAmount,
      reason: `Explicit buyer confirmation required: ₹${numericAmount} is between ₹${POLICY.AUTONOMOUS_LIMIT + 1} and ₹${POLICY.CONFIRMATION_LIMIT}`
    };
  }

  // Tier 3: Above ₹1,00,000 → Manual checkout only (Agent cannot autonomously checkout)
  return {
    action: 'MANUAL_CHECKOUT',
    allowed: false,
    requiresConfirmation: false,
    tier: 'tier3',
    amount: numericAmount,
    reason: `Cart total ₹${numericAmount} exceeds agent autonomous threshold (₹${POLICY.CONFIRMATION_LIMIT}). User must review and checkout manually.`
  };
}

/**
 * Validates cart items against the database Product model and recalculates genuine totals.
 * Prevents client or AI price manipulation bypasses.
 * 
 * @param {Array} items - Array of { id, _id, name, price, qty }
 * @param {number} discountPercent - Discount percent (max 10%)
 * @param {Model} ProductModel - Mongoose Product model
 * @returns {Promise<Object>} { verifiedItems, subtotal, discountedTotal, discountPercent, violations }
 */
async function validateAndCalculateCart(items = [], discountPercent = 0, ProductModel = null) {
  const Model = ProductModel || require('../models/Product');
  const safeDiscount = Math.min(Math.max(0, Number(discountPercent) || 0), POLICY.MAX_DISCOUNT_PERCENT);
  
  if (!Array.isArray(items) || items.length === 0) {
    return {
      verifiedItems: [],
      subtotal: 0,
      discountedTotal: 0,
      discountPercent: safeDiscount,
      violations: ['Cart contains no items']
    };
  }

  // Collect item identifiers
  const ids = items.map(i => i._id || i.id).filter(Boolean);
  const names = items.map(i => i.name).filter(Boolean);

  let dbProducts = [];
  try {
    dbProducts = await Model.find({
      $or: [
        { _id: { $in: ids } },
        { name: { $in: names } }
      ]
    });
  } catch (err) {
    console.error('Error fetching products from DB:', err.message);
  }

  const dbMap = new Map();
  dbProducts.forEach(p => {
    dbMap.set(String(p._id), p);
    dbMap.set(p.name, p);
  });

  const verifiedItems = [];
  const violations = [];
  let subtotal = 0;

  for (const item of items) {
    const key = item._id || item.id || item.name;
    const dbProduct = dbMap.get(String(key)) || dbMap.get(item.name);
    
    // Server authority: Always use price from database if product exists
    const price = dbProduct ? dbProduct.price : (Number(item.price) || 0);
    const qty = Math.max(1, Math.floor(Number(item.qty) || 1));
    const name = dbProduct ? dbProduct.name : (item.name || 'Product');
    const id = dbProduct ? dbProduct._id : (item.id || item._id);

    const lineTotal = price * qty;
    subtotal += lineTotal;

    verifiedItems.push({
      id,
      _id: id,
      name,
      price,
      qty,
      category: dbProduct ? dbProduct.category : (item.category || 'general'),
      subtotal: lineTotal
    });
  }

  const discountedTotal = Math.round(subtotal * (1 - safeDiscount / 100));

  return {
    verifiedItems,
    subtotal,
    discountedTotal,
    discountPercent: safeDiscount,
    violations
  };
}

/**
 * Legacy wrapper maintaining backwards compatibility with existing reviewOrder signature.
 */
function reviewOrder({ items = [], discountPercent = 0 }) {
  const total = items.reduce((sum, item) => sum + (Number(item.price) || 0) * (item.qty || 1), 0);
  const discountedTotal = Math.round(total * (1 - (discountPercent || 0) / 100));

  const violations = [];

  if (discountedTotal > POLICY.CONFIRMATION_LIMIT) {
    violations.push(`Order total ₹${discountedTotal} exceeds max allowed ₹${POLICY.CONFIRMATION_LIMIT}`);
  }
  if (discountPercent > POLICY.MAX_DISCOUNT_PERCENT) {
    violations.push(`Discount ${discountPercent}% exceeds max allowed ${POLICY.MAX_DISCOUNT_PERCENT}%`);
  }

  const approved = violations.length === 0;
  const policyResult = evaluateTransaction(discountedTotal, { source: 'ai_agent' });

  return {
    approved,
    total: discountedTotal,
    policyAction: policyResult.action,
    requiresConfirmation: true, // legacy reviewOrder: payment capture always requires explicit buyer confirm
    violations,
    reason: approved
      ? `Order approved: ₹${discountedTotal} within limit (${policyResult.action})`
      : `Order blocked: ${violations.join('; ')}`
  };
}

module.exports = {
  POLICY,
  MAX_ORDER_VALUE,
  MAX_DISCOUNT_PERCENT,
  evaluateTransaction,
  validateAndCalculateCart,
  reviewOrder
};