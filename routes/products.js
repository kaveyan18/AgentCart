const express = require('express');
const router = express.Router();
const Product = require('../models/Product');

// GET /api/products — list all products
router.get('/', async (req, res) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: 'Could not fetch products', detail: err.message });
  }
});

// GET /api/products/:id — single product by ID
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: 'Could not fetch product', detail: err.message });
  }
});

module.exports = router;
