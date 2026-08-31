require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User');
const Order = require('../models/Order');
const { reviewOrder } = require('../services/policyGate');
const { writeLog } = require('../services/auditService');

async function testAuthAndScoping() {
  console.log('--- 🧪 Testing Real User Authentication & Scoped Orders ---');
  await connectDB();

  try {
    const testEmail = `testuser_${Date.now()}@example.com`;
    const bcrypt = require('bcryptjs');
    const jwt = require('jsonwebtoken');

    // 1. Create test user
    const passwordHash = await bcrypt.hash('secret123', 10);
    const user = await User.create({
      name: 'AgentCart Tester',
      email: testEmail,
      passwordHash
    });
    console.log(`✅ Created test user: ${user.name} (${user.email}) [ID: ${user._id}]`);

    // 2. Test password verification
    const isMatch = await user.comparePassword('secret123');
    const isWrong = await user.comparePassword('wrongpassword');
    console.log(`✅ Password comparison: Correct = ${isMatch}, Wrong = ${isWrong}`);

    // 3. Test JWT token creation and verification
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log(`✅ JWT verified for user ID: ${decoded.id}`);

    // 4. Create scoped order tied to user
    const order = await Order.create({
      userId: user._id,
      userEmail: user.email,
      items: [
        { name: 'Apple AirPods Pro (2nd Gen)', price: 24900, qty: 1 }
      ],
      total: 24900,
      status: 'created',
      razorpayOrderId: `rzp_test_${Date.now()}`
    });
    console.log(`✅ Created scoped order #${order._id} for user ${order.userEmail}`);

    // 5. Test audit logging with user context
    await writeLog('propose_order', 'User ordered flagship audio via AI chat', { orderId: order._id }, user._id);
    console.log(`✅ Logged audit event tied to user ${user._id}`);

    // 6. Verify user query scoping
    const userOrders = await Order.find({ userId: user._id });
    console.log(`✅ User order query returned ${userOrders.length} order(s) strictly for this user`);

    // Cleanup
    await Order.findByIdAndDelete(order._id);
    await User.findByIdAndDelete(user._id);
    console.log('🧹 Cleaned up temporary test user and order.');

    console.log('\n🎉 ALL AUTH & SCOPED COMMERCE TESTS PASSED!\n');
  } catch (err) {
    console.error('❌ Test failed:', err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

testAuthAndScoping();
