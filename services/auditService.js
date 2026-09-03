const AuditLog = require('../models/AuditLog');

/**
 * Records an audit log event with support for bounded financial autonomy metrics.
 * 
 * @param {string} action - Action name (e.g. 'CHECKOUT_REQUEST', 'CHECKOUT_CONFIRMED', 'order_confirm', 'propose_order')
 * @param {string} reason - Human-readable explanation
 * @param {Object} result - Result metadata or policy evaluation
 * @param {string|ObjectId} userId - Associated user
 * @param {Object} metadata - Optional fields: { cartTotal, policyDecision, userConfirmed, source }
 */
async function writeLog(action, reason, result, userId = null, metadata = {}) {
  try {
    const payload = {
      action,
      reason,
      result,
      userId: userId || undefined,
      cartTotal: metadata.cartTotal !== undefined ? metadata.cartTotal : (result?.total || undefined),
      policyDecision: metadata.policyDecision || result?.policyAction || result?.action || undefined,
      userConfirmed: metadata.userConfirmed !== undefined ? Boolean(metadata.userConfirmed) : Boolean(result?.userConfirmed),
      source: metadata.source || result?.source || 'ai_agent',
      timestamp: new Date()
    };

    const log = await AuditLog.create(payload);
    console.log(`[AUDIT] ${action} [policy:${payload.policyDecision || 'N/A'}] [total:₹${payload.cartTotal || 0}]${userId ? ` [user:${userId}]` : ''}: ${reason}`);
    return log;
  } catch (err) {
    console.error(`[AUDIT ERROR]`, err.message);
  }
}

module.exports = { writeLog };