const { evaluateTransaction, validateAndCalculateCart, POLICY } = require('../services/policyGate');

describe('Bounded Financial Autonomy Policy Gate', () => {
  // Mock Product model for testing database price validation
  const mockProducts = [
    { _id: 'prod_macbook', name: 'MacBook Air M3', price: 114900, category: 'laptops' },
    { _id: 'prod_keyboard', name: 'Keychron Mechanical Keyboard', price: 8999, category: 'accessories' },
    { _id: 'prod_mouse', name: 'Logitech MX Master 3S', price: 9995, category: 'accessories' },
    { _id: 'prod_phone', name: 'iPhone 15 Pro', price: 129900, category: 'smartphones' },
    { _id: 'prod_case', name: 'iPhone 15 MagSafe Armor Silicone Case', price: 599, category: 'accessories' },
    { _id: 'prod_screen', name: 'iPhone 15 9H Tempered Glass Screen Protector', price: 199, category: 'accessories' },
    { _id: 'prod_midrange', name: 'OnePlus 12R Smartphone', price: 39999, category: 'smartphones' },
    { _id: 'prod_exact50k', name: 'Mid-Tier Laptop Bundle', price: 50000, category: 'laptops' },
    { _id: 'prod_exact100k', name: 'Dual Monitor Workstation Bundle', price: 100000, category: 'electronics' }
  ];

  const MockProductModel = {
    find: jest.fn().mockImplementation((query) => {
      const orClauses = query.$or || [];
      const idClause = orClauses.find(c => c._id && c._id.$in);
      const nameClause = orClauses.find(c => c.name && c.name.$in);

      const idSet = new Set(idClause ? idClause._id.$in.map(String) : []);
      const nameSet = new Set(nameClause ? nameClause.name.$in : []);

      return Promise.resolve(
        mockProducts.filter(p => idSet.has(String(p._id)) || nameSet.has(p.name))
      );
    })
  };

  // ── Test 1: Cart = ₹10,000 → Expected: AUTO_CHECKOUT ─────────────────────────
  test('Test 1: Cart = ₹10,000 → Expected: AUTO_CHECKOUT', () => {
    const decision = evaluateTransaction(10000, { source: 'ai_agent' });
    expect(decision.action).toBe('AUTO_CHECKOUT');
    expect(decision.allowed).toBe(true);
    expect(decision.requiresConfirmation).toBe(false);
  });

  // ── Test 2: Cart = ₹50,000 → Expected: AUTO_CHECKOUT ─────────────────────────
  test('Test 2: Cart = ₹50,000 (Autonomous Limit Boundary) → Expected: AUTO_CHECKOUT', () => {
    const decision = evaluateTransaction(50000, { source: 'ai_agent' });
    expect(decision.action).toBe('AUTO_CHECKOUT');
    expect(decision.allowed).toBe(true);
    expect(decision.requiresConfirmation).toBe(false);
  });

  // ── Test 3: Cart = ₹50,001 → Expected: REQUIRE_CONFIRMATION ───────────────────
  test('Test 3: Cart = ₹50,001 → Expected: REQUIRE_CONFIRMATION', () => {
    const decision = evaluateTransaction(50001, { source: 'ai_agent', userConfirmed: false });
    expect(decision.action).toBe('REQUIRE_CONFIRMATION');
    expect(decision.requiresConfirmation).toBe(true);

    // When user explicitly confirms:
    const confirmedDecision = evaluateTransaction(50001, { source: 'ai_agent', userConfirmed: true });
    expect(confirmedDecision.action).toBe('CONFIRMED_CHECKOUT');
    expect(confirmedDecision.allowed).toBe(true);
    expect(confirmedDecision.requiresConfirmation).toBe(false);
  });

  // ── Test 4: Cart = ₹1,00,000 → Expected: REQUIRE_CONFIRMATION ─────────────────
  test('Test 4: Cart = ₹1,00,000 (Confirmation Limit Boundary) → Expected: REQUIRE_CONFIRMATION', () => {
    const decision = evaluateTransaction(100000, { source: 'ai_agent', userConfirmed: false });
    expect(decision.action).toBe('REQUIRE_CONFIRMATION');
    expect(decision.requiresConfirmation).toBe(true);

    // When user explicitly confirms:
    const confirmedDecision = evaluateTransaction(100000, { source: 'ai_agent', userConfirmed: true });
    expect(confirmedDecision.action).toBe('CONFIRMED_CHECKOUT');
    expect(confirmedDecision.allowed).toBe(true);
  });

  // ── Test 5: Cart = ₹1,00,001 → Expected: MANUAL_CHECKOUT ──────────────────────
  test('Test 5: Cart = ₹1,00,001 → Expected: MANUAL_CHECKOUT for AI agent', () => {
    const decision = evaluateTransaction(100001, { source: 'ai_agent', userConfirmed: true });
    expect(decision.action).toBe('MANUAL_CHECKOUT');
    expect(decision.allowed).toBe(false);
  });

  // ── Test 6: Server ignores forged client price and uses real DB price ──────────
  test('Test 6: Client sends fake forged price (₹100 for ₹1,14,900 MacBook) → Server enforces DB price', async () => {
    const manipulatedClientItems = [
      { id: 'prod_macbook', name: 'MacBook Air M3', price: 100, qty: 1 }
    ];

    const calculation = await validateAndCalculateCart(manipulatedClientItems, 0, MockProductModel);

    // Must calculate actual price of ₹1,14,900 from DB, not client's ₹100
    expect(calculation.discountedTotal).toBe(114900);
    expect(calculation.verifiedItems[0].price).toBe(114900);

    // Policy applied to real total must be MANUAL_CHECKOUT, not AUTO_CHECKOUT
    const decision = evaluateTransaction(calculation.discountedTotal, { source: 'ai_agent' });
    expect(decision.action).toBe('MANUAL_CHECKOUT');
    expect(decision.allowed).toBe(false);
  });

  // ── Test 7: AI agent calling checkout endpoint for > ₹1L is blocked ────────────
  test('Test 7: AI agent attempting order creation for > ₹1,00,000 is blocked', async () => {
    const calculation = await validateAndCalculateCart([
      { id: 'prod_phone', name: 'iPhone 15 Pro', price: 129900, qty: 1 }
    ], 0, MockProductModel);

    expect(calculation.discountedTotal).toBe(129900);

    const decision = evaluateTransaction(calculation.discountedTotal, {
      source: 'ai_agent',
      isManualCheckout: false
    });

    expect(decision.action).toBe('MANUAL_CHECKOUT');
    expect(decision.allowed).toBe(false);
  });

  // ── Test 8: Human buyer manually checking out > ₹1L on /cart is allowed ─────────
  test('Test 8: Human buyer checking out > ₹1,00,000 manually is allowed', async () => {
    const calculation = await validateAndCalculateCart([
      { id: 'prod_macbook', name: 'MacBook Air M3', price: 114900, qty: 1 }
    ], 0, MockProductModel);

    expect(calculation.discountedTotal).toBe(114900);

    const decision = evaluateTransaction(calculation.discountedTotal, {
      source: 'user',
      isManualCheckout: true
    });

    // Human buyer is NEVER blocked from purchasing
    expect(decision.action).toBe('MANUAL_USER_APPROVED');
    expect(decision.allowed).toBe(true);
  });

  // ── Test 9: Cart changes after confirmation → Policy evaluated using new total ─
  test('Test 9: Cart changes after confirmation → Policy re-evaluated with fresh total', async () => {
    // Initial cart: ₹39,999 (Tier 1)
    let cart = [{ id: 'prod_midrange', name: 'OnePlus 12R Smartphone', price: 39999, qty: 1 }];
    let calc = await validateAndCalculateCart(cart, 0, MockProductModel);
    let decision = evaluateTransaction(calc.discountedTotal, { source: 'ai_agent' });
    expect(decision.action).toBe('AUTO_CHECKOUT');

    // User adds another item: ₹39,999 + ₹18,994 = ₹58,993 (Tier 2, requires confirmation)
    cart.push({ id: 'prod_keyboard', name: 'Keychron Mechanical Keyboard', price: 8999, qty: 1 });
    cart.push({ id: 'prod_mouse', name: 'Logitech MX Master 3S', price: 9995, qty: 1 });
    calc = await validateAndCalculateCart(cart, 0, MockProductModel);
    expect(calc.discountedTotal).toBe(39999 + 8999 + 9995); // 58993

    decision = evaluateTransaction(calc.discountedTotal, { source: 'ai_agent', userConfirmed: false });
    expect(decision.action).toBe('REQUIRE_CONFIRMATION');

    // User adds high-ticket item: pushes total > ₹1,00,000 (Tier 3, manual checkout only)
    cart.push({ id: 'prod_macbook', name: 'MacBook Air M3', price: 114900, qty: 1 });
    calc = await validateAndCalculateCart(cart, 0, MockProductModel);
    expect(calc.discountedTotal).toBeGreaterThan(100000);

    // Even if user confirmed previous tier, new total must be re-evaluated as MANUAL_CHECKOUT
    decision = evaluateTransaction(calc.discountedTotal, { source: 'ai_agent', userConfirmed: true });
    expect(decision.action).toBe('MANUAL_CHECKOUT');
    expect(decision.allowed).toBe(false);
  });

  // ── Test 10: Policy limits definition verification ───────────────────────────
  test('Test 10: Policy constants match specification (₹50k autonomous, ₹100k confirmation)', () => {
    expect(POLICY.AUTONOMOUS_LIMIT).toBe(50000);
    expect(POLICY.CONFIRMATION_LIMIT).toBe(100000);
    expect(POLICY.MAX_DISCOUNT_PERCENT).toBe(10);
  });
});
