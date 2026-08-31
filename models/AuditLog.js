const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  action: String,
  reason: String,
  result: mongoose.Schema.Types.Mixed,
  timestamp: Date
});

module.exports = mongoose.model('AuditLog', auditLogSchema);