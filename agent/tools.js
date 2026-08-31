const Product = require('../models/Product');
const { reviewOrder } = require('../services/policyGate');
const { writeLog } = require('../services/auditService');

// ── Tool implementations ──────────────────────────────────────────────────────

async function searchCatalog(query) {
  // Split into individual words so "iPhone 15 case" finds products
  // containing each of those words, regardless of order
  const terms = query.trim().split(/\s+/);
  const andClauses = terms.map(term => ({
    $or: [
      { name: new RegExp(term, 'i') },
      { description: new RegExp(term, 'i') },
      { category: new RegExp(term, 'i') }
    ]
  }));

  const results = await Product.find({ $and: andClauses });
  return results.map(p => ({
    id: p._id,
    name: p.name,
    price: p.price,
    category: p.category
  }));
}

async function getUpsellCandidates(productId) {
  const product = await Product.findById(productId);
  if (!product || !product.relatedTo.length) return [];

  const related = await Product.find({ _id: { $in: product.relatedTo } });
  return related.map(p => ({
    id: p._id,
    name: p.name,
    price: p.price,
    reason: `Frequently bought with ${product.name}`
  }));
}

async function proposeOrder({ items, discountPercent, reason }, context = {}) {
  const gateResult = reviewOrder({ items, discountPercent });

  await writeLog('propose_order', reason || 'No reason provided', gateResult, context.userId || null);

  if (!gateResult.approved) {
    return { status: 'blocked', message: gateResult.reason };
  }

  return {
    status: 'pending_confirmation',
    total: gateResult.total,
    message: `Order ready — ₹${gateResult.total}. Awaiting buyer confirmation before payment.`
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
      description: 'Propose an order for policy review. Does NOT charge — only drafts and checks limits.',
      parameters: {
        type: 'object',
        properties: {
          items: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                price: { type: 'number' },
                qty: { type: 'number' }
              }
            }
          },
          discountPercent: { type: 'number' },
          reason: { type: 'string', description: 'Why this order is being proposed' }
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