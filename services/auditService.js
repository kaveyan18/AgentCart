const AuditLog = require('../models/AuditLog');

async function writeLog(action, reason, result) {
  await AuditLog.create({ action, reason, result, timestamp: new Date() });
  console.log(`[AUDIT] ${action}: ${reason} → ${JSON.stringify(result)}`);
}

module.exports = { writeLog };