const MAX_ORDER_VALUE = 100000;  // ₹ 1 Lakh limit
const MAX_DISCOUNT_PERCENT = 10;

function reviewOrder({ items, discountPercent = 0 }) {
  const total = items.reduce((sum, item) => sum + item.price * (item.qty || 1), 0);
  const discountedTotal = total * (1 - discountPercent / 100);

  const violations = [];

  if (discountedTotal > MAX_ORDER_VALUE) {
    violations.push(`Order total ₹${discountedTotal} exceeds max allowed ₹${MAX_ORDER_VALUE}`);
  }
  if (discountPercent > MAX_DISCOUNT_PERCENT) {
    violations.push(`Discount ${discountPercent}% exceeds max allowed ${MAX_DISCOUNT_PERCENT}%`);
  }

  const approved = violations.length === 0;

  return {
    approved,
    total: discountedTotal,
    requiresConfirmation: true, // always true — payment always needs explicit buyer confirm
    violations,
    reason: approved
      ? `Order approved: ₹${discountedTotal} within ₹${MAX_ORDER_VALUE} limit`
      : `Order blocked: ${violations.join('; ')}`
  };
}

module.exports = { reviewOrder, MAX_ORDER_VALUE, MAX_DISCOUNT_PERCENT };