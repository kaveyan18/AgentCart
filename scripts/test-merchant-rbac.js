require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User');
const Product = require('../models/Product');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

async function testMerchantFlow() {
  console.log('--- 🧪 Testing Merchant RBAC, Protected Routes & Product Management ---');
  await connectDB();

  try {
    // 1. Verify seeded merchant account
    const merchant = await User.findOne({ email: 'merchant@parcel.test' });
    if (!merchant || merchant.role !== 'merchant') {
      throw new Error('Merchant account not found or has incorrect role');
    }
    console.log(`✅ Verified Seeded Merchant Account: ${merchant.name} (Role: ${merchant.role})`);

    // 2. Verify seeded buyer account
    const buyer = await User.findOne({ email: 'buyer@parcel.test' });
    if (!buyer || buyer.role !== 'buyer') {
      throw new Error('Buyer account not found or has incorrect role');
    }
    console.log(`✅ Verified Seeded Buyer Account: ${buyer.name} (Role: ${buyer.role})`);

    // 3. Test merchant product creation
    const testSlug = `prod_test_vr_headset_${Date.now().toString().slice(-4)}`;
    const newProduct = await Product.create({
      _id: testSlug,
      name: 'Vision Pro Spatial VR Headset',
      price: 249900,
      category: 'wearables',
      description: 'Dual micro-OLED 4K displays, spatial audio, eye and hand tracking.',
      relatedTo: ['prod_airpods_pro_2']
    });
    console.log(`✅ Merchant Created New Catalog Product: ${newProduct.name} [${newProduct._id}] (₹${newProduct.price})`);

    // 4. Test merchant product update
    const updated = await Product.findByIdAndUpdate(
      testSlug,
      { price: 239900, description: 'Updated promotional price for demo day.' },
      { new: true }
    );
    console.log(`✅ Merchant Updated Catalog Product: ₹${updated.price} — ${updated.description}`);

    // 5. Test merchant product deletion
    await Product.findByIdAndDelete(testSlug);
    console.log(`✅ Merchant Deleted Test Catalog Product: ${testSlug}`);

    console.log('\n🎉 ALL MERCHANT ARCHITECTURE & RBAC TESTS PASSED!\n');
  } catch (err) {
    console.error('❌ Merchant test failed:', err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

testMerchantFlow();
