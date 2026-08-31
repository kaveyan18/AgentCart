const { reviewOrder } = require('../services/policyGate');

test('approves an order under the limit', () => {
  const result = reviewOrder({ items: [{ price: 599, qty: 1 }, { price: 199, qty: 1 }] });
  expect(result.approved).toBe(true);
  expect(result.total).toBe(798);
});

test('blocks an order over the ₹5000 limit', () => {
  const result = reviewOrder({ items: [{ price: 6000, qty: 1 }] });
  expect(result.approved).toBe(false);
  expect(result.violations.length).toBeGreaterThan(0);
});

test('blocks a discount over 10%', () => {
  const result = reviewOrder({ items: [{ price: 1000, qty: 1 }], discountPercent: 15 });
  expect(result.approved).toBe(false);
});

test('every order requires explicit confirmation', () => {
  const result = reviewOrder({ items: [{ price: 100, qty: 1 }] });
  expect(result.requiresConfirmation).toBe(true);
});