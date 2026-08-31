const AuditLog = require('../models/AuditLog');

async function writeLog(action, reason, result, userId = null) {
  try {
    const log = await AuditLog.create({
      action,
      reason,
      result,
      userId: userId || undefined,
      timestamp: new Date()
    });
    console.log(`[AUDIT] ${action}${userId ? ` [user:${userId}]` : ''}: ${reason} → ${JSON.stringify(result)}`);
    return log;
  } catch (err) {
    console.error(`[AUDIT ERROR]`, err.message);
  }
}

module.exports = { writeLog };