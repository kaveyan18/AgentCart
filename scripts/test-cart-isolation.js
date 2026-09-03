require('dotenv').config();

const BASE_URL = process.env.API_URL || 'http://localhost:3000';

async function main() {
  console.log('═══════════════════════════════════════════════════════════════════');
  console.log('🧪 SERVER-AUTHORITATIVE MULTI-USER CART ISOLATION TEST (API)');
  console.log('═══════════════════════════════════════════════════════════════════\n');

  // 1. Get products from catalog
  const catalogRes = await fetch(`${BASE_URL}/api/catalog.json`);
  const catalog = await catalogRes.json();
  const prod1 = catalog.items[0];
  const prod2 = catalog.items[1];
  const prod3 = catalog.items[2];

  console.log(`[CATALOG] Discovered items:`);
  console.log(` • Item 1: ${prod1.name} (₹${prod1.price}) [ID: ${prod1.id}]`);
  console.log(` • Item 2: ${prod2.name} (₹${prod2.price}) [ID: ${prod2.id}]`);
  console.log(` • Item 3: ${prod3.name} (₹${prod3.price}) [ID: ${prod3.id}]\n`);

  // 2. Login as User A
  console.log('[STEP 1] Authenticating User A (buyer@parcel.test)...');
  const loginResA = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'buyer@parcel.test', password: 'demo1234' })
  });
  const dataA = await loginResA.json();
  const tokenA = dataA.token;
  console.log(` ✅ User A Authenticated: ${dataA.user.name} (${dataA.user.email}) | ID: ${dataA.user.id}\n`);

  // Clear any existing cart for clean test baseline
  await fetch(`${BASE_URL}/api/cart/clear`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${tokenA}` }
  });

  // 3. Add 2 items via API for User A
  console.log('[STEP 2] Adding 2 items to User A cart via POST /api/cart/add...');
  await fetch(`${BASE_URL}/api/cart/add`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${tokenA}`
    },
    body: JSON.stringify({ productId: prod1.id, qty: 1 })
  });

  const cartResA = await fetch(`${BASE_URL}/api/cart/add`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${tokenA}`
    },
    body: JSON.stringify({ productId: prod2.id, qty: 2 })
  });
  const cartA = await cartResA.json();

  console.log(` ✅ User A Cart Updated on Server:`);
  console.log(`    Total Items: ${cartA.count} | Distinct Products: ${cartA.items.length}`);
  cartA.items.forEach(it => console.log(`    - ${it.name} × ${it.qty} = ₹${it.subtotal}`));
  console.log(`    Cart Total: ₹${cartA.total}\n`);

  // 4. Authenticate User B (Second test user / incognito simulation)
  console.log('[STEP 3] Authenticating User B (shopper2@parcel.test / Incognito user)...');
  let tokenB;
  let loginResB = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'shopper2@parcel.test', password: 'password123' })
  });

  if (!loginResB.ok) {
    // Register User B if not yet in database
    const signupRes = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Jordan Lee',
        email: 'shopper2@parcel.test',
        password: 'demo1234'
      })
    });
    const signupData = await signupRes.json();
    tokenB = signupData.token;
    console.log(` ✅ User B Registered: ${signupData.user.name} (${signupData.user.email}) | ID: ${signupData.user.id}`);
  } else {
    const dataB = await loginResB.json();
    tokenB = dataB.token;
    console.log(` ✅ User B Authenticated: ${dataB.user.name} (${dataB.user.email}) | ID: ${dataB.user.id}`);
  }

  // Clear any pre-existing cart for User B to check clean isolation
  await fetch(`${BASE_URL}/api/cart/clear`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${tokenB}` }
  });

  // 5. Check User B's cart
  console.log('\n[STEP 4] Fetching User B cart via GET /api/cart...');
  const cartResB = await fetch(`${BASE_URL}/api/cart`, {
    headers: { 'Authorization': `Bearer ${tokenB}` }
  });
  const cartB = await cartResB.json();
  console.log(` ✅ User B Cart Status: ${cartB.items.length} items (Count: ${cartB.count}, Total: ₹${cartB.total})`);

  if (cartB.items.length === 0) {
    console.log(' 🎯 CONFIRMED: User B cart is completely empty and isolated from User A!');
  } else {
    console.error(' ❌ FAIL: Cart leakage detected!');
    process.exit(1);
  }

  // 6. Add 1 distinct item for User B
  console.log('\n[STEP 5] Adding 1 distinct item to User B cart via POST /api/cart/add...');
  const addResB = await fetch(`${BASE_URL}/api/cart/add`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${tokenB}`
    },
    body: JSON.stringify({ productId: prod3.id, qty: 1 })
  });
  const updatedCartB = await addResB.json();
  console.log(` ✅ User B Cart Now Contains:`);
  updatedCartB.items.forEach(it => console.log(`    - ${it.name} × ${it.qty} = ₹${it.subtotal}`));
  console.log(`    Cart Total: ₹${updatedCartB.total}\n`);

  // 7. Verify User A's cart remained untouched
  console.log('[STEP 6] Re-verifying User A cart to ensure zero cross-talk...');
  const recheckResA = await fetch(`${BASE_URL}/api/cart`, {
    headers: { 'Authorization': `Bearer ${tokenA}` }
  });
  const recheckedCartA = await recheckResA.json();

  console.log(` ✅ User A Cart Re-verification:`);
  console.log(`    Total Items: ${recheckedCartA.count} | Distinct Products: ${recheckedCartA.items.length}`);
  recheckedCartA.items.forEach(it => console.log(`    - ${it.name} × ${it.qty} = ₹${it.subtotal}`));
  console.log(`    Cart Total: ₹${recheckedCartA.total}`);

  const isUserAUnchanged = recheckedCartA.items.length === 2 && recheckedCartA.count === 3;
  const isUserBIsolated = updatedCartB.items.length === 1 && updatedCartB.count === 1;

  if (isUserAUnchanged && isUserBIsolated) {
    console.log('\n═══════════════════════════════════════════════════════════════════');
    console.log('🎉 SUCCESS: SERVER-AUTHORITATIVE CART ISOLATION FULLY VERIFIED!');
    console.log('   • User A Cart: 2 distinct products (qty: 3)');
    console.log('   • User B Cart: 1 distinct product  (qty: 1)');
    console.log('   • Zero localStorage bleeding across accounts / devices');
    console.log('═══════════════════════════════════════════════════════════════════');
  } else {
    console.error('\n❌ Verification Failed!');
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Fatal error in isolation test:', err);
  process.exit(1);
});
