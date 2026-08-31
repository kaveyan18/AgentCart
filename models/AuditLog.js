const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  action: String,
  reason: String,
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  result: mongoose.Schema.Types.Mixed,
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('AuditLog', auditLogSchema);