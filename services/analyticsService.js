/**
 * services/analyticsService.js
 * 
 * Computes deterministic, database-verified store metrics using Mongoose aggregation.
 * Zero-Trust Principle: The LLM NEVER calculates or estimates numbers. All figures
 * are calculated directly from MongoDB before being provided to any advisory prompt.
 */

const Order = require('../models/Order');
const Product = require('../models/Product');

/**
 * Computes all store performance metrics from real database orders.
 * @returns {Promise<Object>} Formatted store metrics
 */
async function getStoreMetrics() {
  // 1. Overall Revenue and Average Order Value (paid orders only)
  const revenueAgg = await Order.aggregate([
    { $match: { status: 'paid' } },
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: '$total' },
        paidOrdersCount: { $sum: 1 },
        avgOrderValue: { $avg: '$total' }
      }
    }
  ]);

  const totalRevenue = revenueAgg.length > 0 ? Math.round(revenueAgg[0].totalRevenue) : 0;
  const paidOrdersCount = revenueAgg.length > 0 ? revenueAgg[0].paidOrdersCount : 0;
  const avgOrderValue = revenueAgg.length > 0 ? Math.round(revenueAgg[0].avgOrderValue) : 0;

  // 2. Top 5 products by revenue with units sold
  const topSellers = await Order.aggregate([
    { $match: { status: 'paid' } },
    { $unwind: '$items' },
    {
      $group: {
        _id: '$items.name',
        name: { $first: '$items.name' },
        productId: { $first: '$items.productId' },
        unitsSold: { $sum: { $ifNull: ['$items.qty', 1] } },
        revenue: { $sum: { $multiply: ['$items.price', { $ifNull: ['$items.qty', 1] }] } }
      }
    },
    { $sort: { revenue: -1 } },
    { $limit: 5 }
  ]);

  // 3. Bottom 5 products by revenue among products that have at least one sale
  const bottomSellers = await Order.aggregate([
    { $match: { status: 'paid' } },
    { $unwind: '$items' },
    {
      $group: {
        _id: '$items.name',
        name: { $first: '$items.name' },
        productId: { $first: '$items.productId' },
        unitsSold: { $sum: { $ifNull: ['$items.qty', 1] } },
        revenue: { $sum: { $multiply: ['$items.price', { $ifNull: ['$items.qty', 1] }] } }
      }
    },
    { $sort: { revenue: 1 } },
    { $limit: 5 }
  ]);

  // 4. Multi-item orders (proxy for cross-sell / upsell effectiveness)
  const multiItemAgg = await Order.aggregate([
    { $match: { status: 'paid' } },
    {
      $project: {
        itemCount: { $size: { $ifNull: ['$items', []] } }
      }
    },
    {
      $group: {
        _id: null,
        totalPaid: { $sum: 1 },
        multiItemOrders: {
          $sum: { $cond: [{ $gt: ['$itemCount', 1] }, 1, 0] }
        }
      }
    }
  ]);

  const multiItemOrdersCount = multiItemAgg.length > 0 ? multiItemAgg[0].multiItemOrders : 0;
  const multiItemRatePercent = paidOrdersCount > 0
    ? Number(((multiItemOrdersCount / paidOrdersCount) * 100).toFixed(1))
    : 0;

  // 5. Payment failure rate (failed orders / total attempted orders)
  const paymentStats = await Order.aggregate([
    { $match: { status: { $in: ['paid', 'failed'] } } },
    {
      $group: {
        _id: null,
        totalAttempted: { $sum: 1 },
        paidCount: { $sum: { $cond: [{ $eq: ['$status', 'paid'] }, 1, 0] } },
        failedCount: { $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] } }
      }
    }
  ]);

  const totalAttemptedOrders = paymentStats.length > 0 ? paymentStats[0].totalAttempted : 0;
  const failedOrdersCount = paymentStats.length > 0 ? paymentStats[0].failedCount : 0;
  const paymentFailureRatePercent = totalAttemptedOrders > 0
    ? Number(((failedOrdersCount / totalAttemptedOrders) * 100).toFixed(1))
    : 0;

  // 6. Zero-sales products (catalog items that have 0 paid units sold)
  const soldNames = new Set(topSellers.map(s => s.name));
  const allSoldAgg = await Order.aggregate([
    { $match: { status: 'paid' } },
    { $unwind: '$items' },
    { $group: { _id: '$items.name' } }
  ]);
  const allSoldNames = new Set(allSoldAgg.map(s => s._id));

  const allProducts = await Product.find({}, 'name price category').lean();
  const zeroSalesProducts = allProducts
    .filter(p => !allSoldNames.has(p.name))
    .slice(0, 10)
    .map(p => ({
      id: p._id,
      name: p.name,
      price: p.price,
      category: p.category
    }));

  return {
    revenue: {
      totalRevenue,
      paidOrdersCount,
      avgOrderValue
    },
    topSellers: topSellers.map(p => ({
      name: p.name,
      unitsSold: p.unitsSold,
      revenue: Math.round(p.revenue)
    })),
    bottomSellers: bottomSellers.map(p => ({
      name: p.name,
      unitsSold: p.unitsSold,
      revenue: Math.round(p.revenue)
    })),
    upsellPerformance: {
      paidOrdersCount,
      multiItemOrdersCount,
      multiItemRatePercent
    },
    paymentHealth: {
      totalAttemptedOrders,
      paidOrdersCount,
      failedOrdersCount,
      paymentFailureRatePercent
    },
    zeroSalesCount: allProducts.filter(p => !allSoldNames.has(p.name)).length,
    sampleZeroSales: zeroSalesProducts
  };
}

module.exports = {
  getStoreMetrics
};
