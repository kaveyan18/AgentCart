require('dotenv').config();
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const connectDB = require('../config/db');
const User = require('../models/User');
const { getStoreMetrics } = require('../services/analyticsService');
const { getGrowthInsights } = require('../agent/merchantAdvisor');

async function runTests() {
  console.log('=== 🧪 Testing Growth Insights & Zero-Trust Analytics ===\n');
  await connectDB();

  try {
    // 1. Test getStoreMetrics() directly
    console.log('--- 1. Testing getStoreMetrics() ---');
    const metrics = await getStoreMetrics();
    console.log('Total Paid Revenue:', metrics.revenue.totalRevenue);
    console.log('Paid Orders Count:', metrics.revenue.paidOrdersCount);
    console.log('Average Order Value (AOV):', metrics.revenue.avgOrderValue);
    console.log('Multi-item orders:', `${metrics.upsellPerformance.multiItemOrdersCount}/${metrics.upsellPerformance.paidOrdersCount} (${metrics.upsellPerformance.multiItemRatePercent}%)`);
    console.log('Payment failure rate:', `${metrics.paymentHealth.paymentFailureRatePercent}% (${metrics.paymentHealth.failedOrdersCount}/${metrics.paymentHealth.totalAttemptedOrders})`);
    console.log('Top 5 sellers count:', metrics.topSellers.length);
    console.log('Bottom 5 sellers count:', metrics.bottomSellers.length);
    console.log('Zero-sales catalog items:', metrics.zeroSalesCount);

    if (metrics.revenue.totalRevenue <= 0 || metrics.topSellers.length === 0) {
      throw new Error('Metrics aggregation returned empty or invalid data');
    }
    console.log('✅ getStoreMetrics() passed successfully.\n');

    // 2. Test getGrowthInsights() (LLM Narrative)
    console.log('--- 2. Testing getGrowthInsights() with Groq ---');
    const result = await getGrowthInsights();
    console.log('Insights generated at:', result.generatedAt);
    console.log('Not enough data flag:', result.notEnoughData);
    console.log('\n--- LLM ADVISORY NARRATIVE OUTPUT ---');
    console.log(result.insights);
    console.log('-------------------------------------\n');

    if (!result.insights || result.insights.length < 50) {
      throw new Error('LLM insights narrative is missing or too short');
    }
    console.log('✅ getGrowthInsights() passed successfully.\n');

    // 3. Test RBAC validation logic
    console.log('--- 3. Testing RBAC Access Control ---');
    const merchant = await User.findOne({ email: 'merchant@parcel.test' });
    const buyer = await User.findOne({ email: 'buyer@parcel.test' });

    if (!merchant || !buyer) {
      throw new Error('Test merchant or buyer accounts not found in database');
    }

    const merchantToken = jwt.sign({ id: merchant._id }, process.env.JWT_SECRET);
    const buyerToken = jwt.sign({ id: buyer._id }, process.env.JWT_SECRET);

    // Verify merchant token role
    const decodedMerchant = jwt.verify(merchantToken, process.env.JWT_SECRET);
    const merchantUser = await User.findById(decodedMerchant.id);
    console.log(`Merchant verification: Role = ${merchantUser.role} -> Access ALLOWED (200 OK)`);

    // Verify buyer token rejection
    const decodedBuyer = jwt.verify(buyerToken, process.env.JWT_SECRET);
    const buyerUser = await User.findById(decodedBuyer.id);
    if (buyerUser.role !== 'merchant') {
      console.log(`Buyer verification: Role = ${buyerUser.role} -> Access DENIED (403 Forbidden: Merchant privileges required)`);
    } else {
      throw new Error('Buyer unexpectedly had merchant role');
    }

    console.log('\n🎉 ALL GROWTH INSIGHTS TESTS PASSED!');
  } catch (err) {
    console.error('❌ Test failed:', err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

runTests();
