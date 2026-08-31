const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const requireMerchant = require('../middleware/requireMerchant');
const { writeLog } = require('../services/auditService');

// GET /api/products — list all products (public)
router.get('/', async (req, res) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: 'Could not fetch products', detail: err.message });
  }
});

// GET /api/products/:id — single product by ID (public)
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: 'Could not fetch product', detail: err.message });
  }
});

// POST /api/products — create new product (Merchant Only)
router.post('/', requireMerchant, async (req, res) => {
  try {
    const { _id, name, price, category, description, relatedTo } = req.body;
    if (!name || price === undefined) {
      return res.status(400).json({ message: 'Product name and price are required' });
    }

    const slug = _id
      ? _id.toLowerCase().replace(/[^a-z0-9_]/g, '_')
      : `prod_${name.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${Date.now().toString().slice(-4)}`;

    const existing = await Product.findById(slug);
    if (existing) {
      return res.status(400).json({ message: `A product with ID/slug "${slug}" already exists` });
    }

    const product = await Product.create({
      _id: slug,
      name: name.trim(),
      price: Number(price),
      category: category ? category.toLowerCase().trim() : 'accessories',
      description: description ? description.trim() : '',
      relatedTo: Array.isArray(relatedTo) ? relatedTo : []
    });

    await writeLog('merchant_product_created', `Merchant added product "${product.name}" (₹${product.price})`, { productId: product._id }, req.userId);

    res.status(201).json(product);
  } catch (err) {
    res.status(500).json({ message: 'Could not create product', detail: err.message });
  }
});

// PUT /api/products/:id — update product (Merchant Only)
router.put('/:id', requireMerchant, async (req, res) => {
  try {
    const { name, price, category, description, relatedTo } = req.body;
    const updateData = {};

    if (name !== undefined) updateData.name = name.trim();
    if (price !== undefined) updateData.price = Number(price);
    if (category !== undefined) updateData.category = category.toLowerCase().trim();
    if (description !== undefined) updateData.description = description.trim();
    if (relatedTo !== undefined) updateData.relatedTo = Array.isArray(relatedTo) ? relatedTo : [];

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    await writeLog('merchant_product_updated', `Merchant updated product "${product.name}" (₹${product.price})`, { productId: product._id }, req.userId);

    res.json(product);
  } catch (err) {
    res.status(500).json({ message: 'Could not update product', detail: err.message });
  }
});

// DELETE /api/products/:id — delete product (Merchant Only)
router.delete('/:id', requireMerchant, async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    await writeLog('merchant_product_deleted', `Merchant deleted product "${product.name}" (${req.params.id})`, { productId: req.params.id }, req.userId);

    res.json({ deleted: true, productId: req.params.id });
  } catch (err) {
    res.status(500).json({ message: 'Could not delete product', detail: err.message });
  }
});

module.exports = router;
