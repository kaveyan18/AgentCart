const Product = require('../models/Product');
const { evaluateTransaction, validateAndCalculateCart, reviewOrder } = require('../services/policyGate');
const { writeLog } = require('../services/auditService');

// ── Tool implementations ──────────────────────────────────────────────────────

async function searchCatalog(query) {
  // Split into individual words so "iPhone 15 case" finds products
  // containing each of those words, regardless of order
  const terms = (query || '').trim().split(/\s+/).filter(Boolean);
  const andClauses = terms.length > 0
    ? terms.map(term => ({
        $or: [
          { name: new RegExp(term, 'i') },
          { description: new RegExp(term, 'i') },
          { category: new RegExp(term, 'i') }
        ]
      }))
    : [{}];

  const results = await Product.find({ $and: andClauses }).limit(5);
  return results.map(p => ({
    id: p._id,
    name: p.name,
    price: p.price,
    category: p.category
  }));
}

async function getUpsellCandidates(productId) {
  const product = await Product.findById(productId);
  if (!product || !product.relatedTo || !product.relatedTo.length) return [];

  const related = await Product.find({ _id: { $in: product.relatedTo } }).limit(2);
  return related.map(p => ({
    id: p._id,
    name: p.name,
    price: p.price,
    reason: `Pairs well with ${product.name}`
  }));
}

async function proposeOrder({ items, discountPercent, reason, userConfirmed = false }, context = {}) {
  // 1. Calculate actual database price & validate cart items
  const cartCalc = await validateAndCalculateCart(items, discountPercent, Product);

  // 2. Evaluate Bounded Financial Autonomy Policy
  const isConfirmed = Boolean(userConfirmed || context.userConfirmed);
  const policyResult = evaluateTransaction(cartCalc.discountedTotal, {
    source: 'ai_agent',
    userConfirmed: isConfirmed
  });

  // 3. Write structured audit log
  await writeLog(
    'propose_order',
    reason || policyResult.reason,
    {
      action: policyResult.action,
      allowed: policyResult.allowed,
      requiresConfirmation: policyResult.requiresConfirmation,
      total: cartCalc.discountedTotal,
      tier: policyResult.tier,
      policy: policyResult.action
    },
    context.userId || null,
    {
      cartTotal: cartCalc.discountedTotal,
      policyDecision: policyResult.action,
      userConfirmed: isConfirmed,
      source: 'ai_agent'
    }
  );

  if (policyResult.action === 'AUTO_CHECKOUT') {
    return {
      success: true,
      status: 'auto_checkout',
      policy: 'AUTO_CHECKOUT',
      total: cartCalc.discountedTotal,
      items: cartCalc.verifiedItems,
      message: `Order ready for automatic checkout — ₹${cartCalc.discountedTotal.toLocaleString('en-IN')}. Items added to cart.`
    };
  }

  if (policyResult.action === 'REQUIRE_CONFIRMATION') {
    return {
      success: true,
      status: 'requires_confirmation',
      policy: 'REQUIRE_CONFIRMATION',
      total: cartCalc.discountedTotal,
      items: cartCalc.verifiedItems,
      message: `Your cart total is ₹${cartCalc.discountedTotal.toLocaleString('en-IN')}. This amount requires your explicit confirmation before proceeding. Would you like me to continue to checkout?`
    };
  }

  // MANUAL_CHECKOUT (> ₹1,00,000)
  return {
    success: true,
    status: 'manual_checkout',
    policy: 'MANUAL_CHECKOUT',
    total: cartCalc.discountedTotal,
    items: cartCalc.verifiedItems,
    message: `Your cart total is ₹${cartCalc.discountedTotal.toLocaleString('en-IN')}. This is above my ₹1,00,000 autonomous transaction limit. I've added everything to your cart. Please review your cart and continue to checkout manually.`
  };
}

const Order = require('../models/Order');

async function getOrderStatus(args) {
  try {
    const orderId = typeof args === 'string' ? args : args?.orderId;
    const order = await Order.findById(orderId);
    if (!order) {
      return { status: 'not_found', message: 'No order found with that id' };
    }
    return {
      status: order.status,       // 'created' | 'paid' | 'failed'
      total: order.total,
      orderId: order._id.toString(),
      errorReason: order.errorReason || null,
      items: order.items
    };
  } catch (err) {
    return { status: 'error', message: 'Invalid order ID or lookup failed' };
  }
}

// ── Groq tool schemas (names must match availableFunctions keys in orchestrator) ──

const toolSchemas = [
  {
    type: 'function',
    function: {
      name: 'search_catalog',
      description: 'Search the product catalog by name or keyword',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Search term, e.g. "phone case"' }
        },
        required: ['query']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_upsell_candidates',
      description: 'Get cross-sell products linked to a given product ID',
      parameters: {
        type: 'object',
        properties: {
          productId: { type: 'string', description: 'The _id slug of the product' }
        },
        required: ['productId']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'propose_order',
      description: 'Draft an order for policy review and checkout. ONLY call this when the buyer has confirmed their final item selection and wants to check out. NEVER call propose_order while still asking or proposing an upsell.',
      parameters: {
        type: 'object',
        properties: {
          items: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string', description: 'Product ID' },
                name: { type: 'string', description: 'Product name' },
                price: { type: 'number', description: 'Product price in INR' },
                qty: { type: 'number', description: 'Quantity' }
              },
              required: ['name', 'price']
            }
          },
          discountPercent: { type: 'number' },
          reason: { type: 'string', description: 'Why this order is being proposed' },
          userConfirmed: { type: 'boolean', description: 'True if buyer gave explicit confirmation ("yes", "confirm", "proceed")' }
        },
        required: ['items']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_order_status',
      description: 'Check payment or fulfillment status of an order using its order ID',
      parameters: {
        type: 'object',
        properties: {
          orderId: { type: 'string', description: 'The MongoDB _id of the order' }
        },
        required: ['orderId']
      }
    }
  }
];

module.exports = { searchCatalog, getUpsellCandidates, proposeOrder, getOrderStatus, toolSchemas };