const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  action: { type: String, required: true },
  reason: { type: String },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  cartTotal: { type: Number },
  policyDecision: {
    type: String,
    enum: [
      'AUTO_CHECKOUT',
      'REQUIRE_CONFIRMATION',
      'CONFIRMED_CHECKOUT',
      'MANUAL_CHECKOUT',
      'MANUAL_USER_APPROVED',
      'BLOCKED',
      'APPROVED'
    ]
  },
  userConfirmed: { type: Boolean, default: false },
  source: { type: String, default: 'ai_agent' }, // 'ai_agent' | 'user'
  result: { type: mongoose.Schema.Types.Mixed },
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('AuditLog', auditLogSchema);