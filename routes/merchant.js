const express = require('express');
const router = express.Router();
const requireMerchant = require('../middleware/requireMerchant');
const { getGrowthInsights } = require('../agent/merchantAdvisor');

/**
 * GET /api/merchant/insights
 * Protected endpoint providing verified store analytics and AI growth recommendations.
 * Reuses existing requireMerchant middleware.
 */
router.get('/insights', requireMerchant, async (req, res) => {
  try {
    const result = await getGrowthInsights();
    res.json(result);
  } catch (err) {
    console.error('Merchant insights endpoint error:', err);
    res.status(500).json({ error: 'Failed to retrieve growth insights', detail: err.message });
  }
});

module.exports = router;
