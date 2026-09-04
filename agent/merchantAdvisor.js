/**
 * agent/merchantAdvisor.js
 * 
 * Merchant-facing Growth Insights Advisor.
 * 
 * CORE PRINCIPLE: The LLM never computes or hallucinates numbers.
 * All metrics are pre-calculated via deterministic MongoDB aggregation in
 * services/analyticsService.js before being passed to Groq.
 * 
 * This advisor is strictly ADVISORY with zero tool write access or financial authority.
 */

require('dotenv').config();
const Groq = require('groq-sdk');
const { getStoreMetrics } = require('../services/analyticsService');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const MODEL_NAME = process.env.GROQ_MODEL || 'qwen/qwen3.8-27b';

const ADVISOR_SYSTEM_PROMPT = `You are the Merchant Growth Insights Advisor for AgentCart.
You analyze real store performance metrics and provide actionable, executive-level merchandising advice to the store owner.

CRITICAL RULES:
1. ADVISORY ONLY: You have zero authority to change prices, create discount coupons, or modify database products. Your role is purely analytical recommendations. The merchant must manually execute any changes.
2. ZERO NUMBER COMPUTATION: Never calculate, estimate, or invent any metrics. Every number you mention (revenue, unit counts, percentages, prices) MUST be directly taken from the verified metrics summary provided in the user prompt.
3. CONCRETE & SPECIFIC: Provide exactly 3 to 4 prioritized, highly actionable recommendations. Reference actual product names and real numbers from the data. Never give generic platitudes like "increase marketing", "run social ads", or "improve customer satisfaction". Focus on:
   - Cross-sell & bundle opportunities based on the multi-item rate and top-performing accessories.
   - Low-performing or stagnant inventory pricing & merchandising actions.
   - Payment funnel health if the failure rate warrants attention.
4. TONE: Direct, concise, analytical, and professional (aligned with agent.md). No corporate filler, no emojis, no buzzwords. State currency clearly as ₹.`;

/**
 * Generates verified growth insights for the merchant console.
 * @returns {Promise<Object>} { metrics, insights, notEnoughData, generatedAt }
 */
async function getGrowthInsights() {
  // 1. Deterministically fetch real metrics from MongoDB
  const metrics = await getStoreMetrics();

  // 2. Safeguard: if there are fewer than 3 paid orders, do not trigger the LLM
  if (metrics.revenue.paidOrdersCount < 3) {
    return {
      metrics,
      insights: null,
      notEnoughData: true,
      reason: 'At least 3 paid orders are required to generate statistically meaningful growth insights.',
      generatedAt: new Date().toISOString()
    };
  }

  // 3. Format pre-computed metrics into a factual prompt payload
  const topSellersText = metrics.topSellers
    .map(p => `- ${p.name}: ${p.unitsSold} units sold, ₹${p.revenue.toLocaleString('en-IN')} revenue`)
    .join('\n');

  const bottomSellersText = metrics.bottomSellers
    .map(p => `- ${p.name}: ${p.unitsSold} units sold, ₹${p.revenue.toLocaleString('en-IN')} revenue`)
    .join('\n');

  const sampleZeroText = metrics.sampleZeroSales.length > 0
    ? metrics.sampleZeroSales.slice(0, 5).map(p => `- ${p.name} (₹${p.price.toLocaleString('en-IN')}, Category: ${p.category})`).join('\n')
    : 'None';

  const userPrompt = `Here are the verified store metrics for AgentCart:

REVENUE PERFORMANCE:
- Total Paid Revenue: ₹${metrics.revenue.totalRevenue.toLocaleString('en-IN')}
- Total Paid Orders: ${metrics.revenue.paidOrdersCount}
- Average Order Value (AOV): ₹${metrics.revenue.avgOrderValue.toLocaleString('en-IN')}

TOP 5 SELLERS BY REVENUE:
${topSellersText || 'No sales recorded'}

BOTTOM SELLERS (WITH AT LEAST 1 SALE):
${bottomSellersText || 'No low-volume sales recorded'}

CROSS-SELL & UPSELL HEALTH:
- Orders with >1 item: ${metrics.upsellPerformance.multiItemOrdersCount} of ${metrics.upsellPerformance.paidOrdersCount} (${metrics.upsellPerformance.multiItemRatePercent}%)

PAYMENT HEALTH:
- Total Orders Attempted: ${metrics.paymentHealth.totalAttemptedOrders}
- Successful Paid Orders: ${metrics.paymentHealth.paidOrdersCount}
- Failed Orders: ${metrics.paymentHealth.failedOrdersCount}
- Payment Failure Rate: ${metrics.paymentHealth.paymentFailureRatePercent}%

CATALOG INVENTORY WITH ZERO SALES:
- Total unsold catalog products: ${metrics.zeroSalesCount}
- Sample unsold products:
${sampleZeroText}

Please provide 3-4 structured, prioritized growth recommendations based on these exact figures.`;

  try {
    const response = await groq.chat.completions.create({
      model: MODEL_NAME,
      messages: [
        { role: 'system', content: ADVISOR_SYSTEM_PROMPT },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.3,
      max_tokens: 800
    });

    const rawContent = response.choices[0]?.message?.content || '';
    // Strip any thinking tags if using reasoning models like Qwen
    const cleanInsights = rawContent.replace(/<think>[\s\S]*?<\/think>/g, '').trim();

    return {
      metrics,
      insights: cleanInsights,
      notEnoughData: false,
      generatedAt: new Date().toISOString()
    };
  } catch (err) {
    console.error('Groq Growth Insights generation error:', err);
    return {
      metrics,
      insights: `Error generating AI recommendations: ${err.message}. Raw metrics remain fully accessible above.`,
      notEnoughData: false,
      error: true,
      generatedAt: new Date().toISOString()
    };
  }
}

module.exports = {
  getGrowthInsights
};
