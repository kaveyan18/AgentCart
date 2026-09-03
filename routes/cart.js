const express = require('express');
const router = express.Router();
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const { requireAuth } = require('../middleware/requireAuth');

/**
 * Helper to compute cart totals and refresh unit prices from canonical DB records.
 */
async function formatCartResponse(cart) {
  if (!cart || !Array.isArray(cart.items) || cart.items.length === 0) {
    return { items: [], total: 0, count: 0 };
  }

  // Fetch latest prices and details from Product collection
  const productIds = cart.items.map(i => i.productId);
  const products = await Product.find({ _id: { $in: productIds } });
  const productMap = new Map();
  products.forEach(p => productMap.set(String(p._id), p));

  let total = 0;
  let count = 0;
  const verifiedItems = [];

  for (const item of cart.items) {
    const product = productMap.get(String(item.productId));
    // Always use live server price from Product collection if available
    const livePrice = product ? product.price : item.price;
    const name = product ? product.name : item.name;
    const qty = Math.max(1, Number(item.qty) || 1);
    const subtotal = livePrice * qty;

    total += subtotal;
    count += qty;

    verifiedItems.push({
      productId: item.productId,
      id: item.productId,
      _id: item.productId,
      name,
      price: livePrice,
      qty,
      category: product ? product.category : 'electronics',
      subtotal
    });
  }

  return { items: verifiedItems, total, count };
}

// ── 1. GET /api/cart — Fetch user's server-authoritative cart ──────────────────
router.get('/', requireAuth, async (req, res) => {
  try {
    let cart = await Cart.findOne({ userId: req.userId });
    if (!cart) {
      cart = await Cart.create({ userId: req.userId, items: [] });
    }
    const response = await formatCartResponse(cart);
    res.json(response);
  } catch (err) {
    console.error('[CART GET ERROR]', err);
    res.status(500).json({ error: 'Could not fetch cart', detail: err.message });
  }
});

// ── 2. POST /api/cart/add — Add product or bundle to cart ─────────────────────
router.post('/add', requireAuth, async (req, res) => {
  try {
    const { productId, qty = 1, items } = req.body;

    let cart = await Cart.findOne({ userId: req.userId });
    if (!cart) {
      cart = new Cart({ userId: req.userId, items: [] });
    }

    // Handle single item or array of items (bundle)
    const itemsToAdd = Array.isArray(items) && items.length > 0
      ? items
      : [{ productId, qty }];

    for (const addReq of itemsToAdd) {
      const pId = addReq.productId || addReq._id || addReq.id;
      const addQty = Math.max(1, Number(addReq.qty) || 1);

      if (!pId) continue;

      // Validate product exists in DB
      let product = null;
      try {
        product = await Product.findById(pId);
      } catch {
        // May be name lookup fallback
      }
      if (!product && addReq.name) {
        product = await Product.findOne({ name: addReq.name });
      }

      if (!product) continue;

      const existingIndex = cart.items.findIndex(
        i => String(i.productId) === String(product._id)
      );

      if (existingIndex > -1) {
        cart.items[existingIndex].qty += addQty;
        cart.items[existingIndex].price = product.price; // keep price updated
      } else {
        cart.items.push({
          productId: product._id,
          name: product.name,
          price: product.price,
          qty: addQty
        });
      }
    }

    await cart.save();
    const response = await formatCartResponse(cart);
    res.json(response);
  } catch (err) {
    console.error('[CART ADD ERROR]', err);
    res.status(500).json({ error: 'Could not add item to cart', detail: err.message });
  }
});

// ── 3. PUT /api/cart/update — Update quantity of an item ──────────────────────
router.put('/update', requireAuth, async (req, res) => {
  try {
    const { productId, qty } = req.body;
    if (!productId) {
      return res.status(400).json({ error: 'productId is required' });
    }

    let cart = await Cart.findOne({ userId: req.userId });
    if (!cart) {
      cart = await Cart.create({ userId: req.userId, items: [] });
    }

    const targetQty = Number(qty);
    const existingIndex = cart.items.findIndex(
      i => String(i.productId) === String(productId)
    );

    if (existingIndex > -1) {
      if (targetQty <= 0) {
        // Remove item if quantity <= 0
        cart.items.splice(existingIndex, 1);
      } else {
        cart.items[existingIndex].qty = targetQty;
      }
      await cart.save();
    }

    const response = await formatCartResponse(cart);
    res.json(response);
  } catch (err) {
    console.error('[CART UPDATE ERROR]', err);
    res.status(500).json({ error: 'Could not update cart item', detail: err.message });
  }
});

// ── 4. DELETE /api/cart/remove/:productId — Remove specific item ──────────────
router.delete('/remove/:productId', requireAuth, async (req, res) => {
  try {
    const { productId } = req.params;
    let cart = await Cart.findOne({ userId: req.userId });
    if (cart) {
      cart.items = cart.items.filter(i => String(i.productId) !== String(productId));
      await cart.save();
    }
    const response = await formatCartResponse(cart);
    res.json(response);
  } catch (err) {
    console.error('[CART REMOVE ERROR]', err);
    res.status(500).json({ error: 'Could not remove item from cart', detail: err.message });
  }
});

// ── 5. DELETE /api/cart/clear — Clear all items in cart ───────────────────────
router.delete('/clear', requireAuth, async (req, res) => {
  try {
    let cart = await Cart.findOne({ userId: req.userId });
    if (cart) {
      cart.items = [];
      await cart.save();
    }
    res.json({ items: [], total: 0, count: 0 });
  } catch (err) {
    console.error('[CART CLEAR ERROR]', err);
    res.status(500).json({ error: 'Could not clear cart', detail: err.message });
  }
});

// ── 6. POST /api/cart/merge — Merge guest localStorage items on login ────────
router.post('/merge', requireAuth, async (req, res) => {
  try {
    const { items = [] } = req.body;
    let cart = await Cart.findOne({ userId: req.userId });
    if (!cart) {
      cart = new Cart({ userId: req.userId, items: [] });
    }

    if (Array.isArray(items) && items.length > 0) {
      for (const guestItem of items) {
        const pId = guestItem.productId || guestItem._id || guestItem.id;
        const addQty = Math.max(1, Number(guestItem.qty) || 1);
        if (!pId) continue;

        let product = null;
        try {
          product = await Product.findById(pId);
        } catch {
          // fallback by name
        }
        if (!product && guestItem.name) {
          product = await Product.findOne({ name: guestItem.name });
        }
        if (!product) continue;

        const existingIndex = cart.items.findIndex(
          i => String(i.productId) === String(product._id)
        );

        if (existingIndex > -1) {
          cart.items[existingIndex].qty += addQty;
          cart.items[existingIndex].price = product.price;
        } else {
          cart.items.push({
            productId: product._id,
            name: product.name,
            price: product.price,
            qty: addQty
          });
        }
      }
      await cart.save();
    }

    const response = await formatCartResponse(cart);
    res.json(response);
  } catch (err) {
    console.error('[CART MERGE ERROR]', err);
    res.status(500).json({ error: 'Could not merge cart items', detail: err.message });
  }
});

module.exports = router;
