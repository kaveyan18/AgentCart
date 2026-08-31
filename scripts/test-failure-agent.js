require('dotenv').config();
const connectDB = require('../config/db');
const Order = require('../models/Order');
const { runAgent } = require('../agent/orchestrator');

async function run() {
  await connectDB();

  // 1. Create a simulated failed order in Mongo
  const failedOrder = await Order.create({
    items: [
      { name: 'iPhone 15 Silicone Case', price: 599, qty: 1 },
      { name: 'iPhone 15 Tempered Glass Screen Protector', price: 199, qty: 1 }
    ],
    total: 798,
    status: 'failed',
    errorReason: 'Payment declined by the issuing bank (insufficient funds)',
    errorCode: 'BAD_REQUEST_ERROR'
  });

  console.log(`Created test failed order in DB: ${failedOrder._id}`);

  // 2. Ask the agent to check the order status
  console.log('\nAsking agent to check the order status...\n');
  const response = await runAgent(`Can you check the status of my order ${failedOrder._id}?`);

  console.log('\nAgent Reply:');
  console.log(response.reply);

  process.exit(0);
}

run();
