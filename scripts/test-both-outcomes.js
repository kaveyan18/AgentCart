require('dotenv').config();
const connectDB = require('../config/db');
const Order = require('../models/Order');
const { runAgent } = require('../agent/orchestrator');

async function run() {
  await connectDB();

  // 1. Setup a 'paid' order in MongoDB
  const paidOrder = await Order.create({
    items: [
      { name: 'iPhone 15 Silicone Case', price: 599, qty: 1 },
      { name: 'iPhone 15 Tempered Glass Screen Protector', price: 199, qty: 1 }
    ],
    total: 798,
    status: 'paid'
  });

  // 2. Setup a 'failed' order in MongoDB
  const failedOrder = await Order.create({
    items: [
      { name: 'Sony WH-1000XM5 Wireless Headphones', price: 29999, qty: 1 }
    ],
    total: 29999,
    status: 'failed',
    errorReason: 'Your card was declined by the bank due to insufficient funds'
  });

  console.log('====================================================');
  console.log('TEST 1: PAID ORDER STATUS');
  console.log(`Order ID: ${paidOrder._id}`);
  console.log('====================================================');
  const paidResult = await runAgent(`Payment attempt completed for order ${paidOrder._id}, please check status and let me know`);
  console.log('Agent Reply (PAID):');
  console.log(paidResult.reply);

  console.log('\n====================================================');
  console.log('TEST 2: FAILED ORDER STATUS');
  console.log(`Order ID: ${failedOrder._id}`);
  console.log('====================================================');
  const failedResult = await runAgent(`Payment attempt completed for order ${failedOrder._id}, please check status and let me know`);
  console.log('Agent Reply (FAILED):');
  console.log(failedResult.reply);
  console.log('====================================================\n');

  process.exit(0);
}

run();
