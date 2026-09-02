/**
 * ai-buyer.js — Autonomous AI Buyer Agent (Agent-to-Agent Commerce)
 * 
 * Demonstrates the second half of the brief:
 * An external AI agent autonomously discovering catalog items via machine-readable ACP endpoint,
 * evaluating policy limits, assembling a cross-sell bundle, proposing the order, and settling payment
 * with ZERO human intervention.
 *
 * Usage: node scripts/ai-buyer.js
 */

require('dotenv').config();
const crypto = require('crypto');

const BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';

async function log(step, title, detail) {
  console.log(`\n\x1b[1m\x1b[36m[AI AGENT ${step}]\x1b[0m \x1b[1m${title}\x1b[0m`);
  if (detail) console.log(`   \x1b[90m${detail}\x1b[0m`);
}

async function runAutonomousBuyer() {
  const startTime = Date.now();
  console.log('═══════════════════════════════════════════════════════════════════');
  console.log('🤖 AGENTIC COMMERCE — AUTONOMOUS AI BUYER DEMO (M2M / ACP)');
  console.log('   Agent ID: agent_procure_ai_9942');
  console.log('   Protocol: ACP/1.0 (Agent Commerce Protocol)');
  console.log('═══════════════════════════════════════════════════════════════════');

  // ── 1. Authenticate Autonomous Agent Session ──────────────────────────────
  await log('STEP 1', 'Authenticating Agent Credentials...', 'POST /api/auth/login → buyer@parcel.test');
  const authRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'buyer@parcel.test', password: 'demo1234' })
  });

  const authData = await authRes.json();
  if (!authRes.ok) throw new Error(`Agent Auth Failed: ${authData.message || authRes.statusText}`);
  const token = authData.token;
  console.log(`   ✅ Authenticated as: \x1b[32m${authData.user.name}\x1b[0m (${authData.user.email}) | JWT Session Active`);

  // ── 2. Machine-Readable Catalog Discovery (ACP/1.0) ───────────────────────
  await log('STEP 2', 'Querying Machine-Readable ACP Manifest...', 'GET /api/catalog.json');
  const catalogRes = await fetch(`${BASE_URL}/api/catalog.json`);
  const catalog = await catalogRes.json();
  if (!catalogRes.ok) throw new Error(`Catalog fetch failed: ${catalogRes.statusText}`);

  console.log(`   ✅ Merchant Store: \x1b[33m${catalog.merchant.name}\x1b[0m`);
  console.log(`   ✅ Policy Limit: \x1b[32mMax ₹${catalog.merchant.policy_gate.max_autonomous_order_value}\x1b[0m | Items Discovered: \x1b[32m${catalog.items.length}\x1b[0m`);

  // ── 3. Autonomous Optimization & Cross-Sell Bundle Selection ──────────────
  await log('STEP 3', 'Evaluating Catalog & Optimizing Bundle Purchase...', 'Finding high-utility item + linked cross-sell within policy limit');
  const primaryItem = catalog.items.find(i => i.id === 'prod_phonecase_iphone15') || catalog.items.find(i => i.autonomous_checkout_eligible);
  if (!primaryItem) throw new Error('No eligible products found under policy limit');

  // Discover linked cross-sell item
  let bundleItems = [{ name: primaryItem.name, price: primaryItem.price, qty: 1 }];
  if (primaryItem.cross_sell_ids && primaryItem.cross_sell_ids.length > 0) {
    const crossSellId = primaryItem.cross_sell_ids[0];
    const crossSellItem = catalog.items.find(i => i.id === crossSellId);
    if (crossSellItem && (primaryItem.price + crossSellItem.price) <= catalog.merchant.policy_gate.max_autonomous_order_value) {
      bundleItems.push({ name: crossSellItem.name, price: crossSellItem.price, qty: 1 });
      console.log(`   🔗 Cross-sell Opportunity Detected: \x1b[35m${crossSellItem.name}\x1b[0m (₹${crossSellItem.price})`);
    }
  }

  const expectedTotal = bundleItems.reduce((s, i) => s + (i.price * i.qty), 0);
  console.log(`   📦 Selected Autonomous Bundle:`);
  bundleItems.forEach(i => console.log(`      • ${i.name} — ₹${i.price}`));
  console.log(`   💰 Calculated Total: \x1b[1m\x1b[32m₹${expectedTotal}\x1b[0m (Within ₹1,00,000 policy gate ceiling)`);

  // ── 4. Autonomous Order Proposal & Gate Validation ────────────────────────
  await log('STEP 4', 'Proposing Order to Policy Gate...', 'POST /api/orders/confirm');
  const orderRes = await fetch(`${BASE_URL}/api/orders/confirm`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ items: bundleItems })
  });

  const orderData = await orderRes.json();
  if (!orderRes.ok) throw new Error(`Policy Gate Blocked: ${orderData.message || orderRes.statusText}`);

  console.log(`   🛡️ Policy Gate Result: \x1b[32mAPPROVED\x1b[0m`);
  console.log(`   📄 Internal Order ID:  \x1b[33m${orderData.orderId}\x1b[0m`);
  console.log(`   💳 Razorpay Order ID:  \x1b[33m${orderData.razorpayOrderId}\x1b[0m (Amount: ₹${orderData.amount / 100})`);

  // ── 5. Autonomous Signature & Settlement Verification ─────────────────────
  await log('STEP 5', 'Executing Cryptographic Settlement Verification...', 'HMAC-SHA256 Signature Verification via /api/orders/verify');
  const mockPaymentId = `pay_agent_${Date.now().toString().slice(-8)}`;
  const signature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(`${orderData.razorpayOrderId}|${mockPaymentId}`)
    .digest('hex');

  const verifyRes = await fetch(`${BASE_URL}/api/orders/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      orderId: orderData.orderId,
      razorpayPaymentId: mockPaymentId,
      razorpayOrderId: orderData.razorpayOrderId,
      razorpaySignature: signature
    })
  });

  const verifyData = await verifyRes.json();
  if (!verifyRes.ok || verifyData.status !== 'paid') {
    throw new Error(`Verification failed: ${verifyData.message || 'Unknown error'}`);
  }

  // ── 6. Final Status & Execution Summary ───────────────────────────────────
  const elapsed = Date.now() - startTime;
  console.log('\n═══════════════════════════════════════════════════════════════════');
  console.log('🎉 AUTONOMOUS AI-TO-AI TRANSACTION COMPLETE!');
  console.log(`   Status:        \x1b[1m\x1b[32mPAID & VERIFIED (Status: ${verifyData.status.toUpperCase()})\x1b[0m`);
  console.log(`   Order ID:      ${verifyData.order._id}`);
  console.log(`   Total Settled: ₹${verifyData.order.total}`);
  console.log(`   Audit Status:  Logged to Merchant Policy Audit Trail`);
  console.log(`   Elapsed Time:  \x1b[1m\x1b[36m${elapsed}ms\x1b[0m with ZERO human interaction`);
  console.log('═══════════════════════════════════════════════════════════════════\n');
}

runAutonomousBuyer().catch(err => {
  console.error('\n❌ Autonomous Buyer Agent Error:', err.message);
  process.exit(1);
});
