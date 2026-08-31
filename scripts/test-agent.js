require('dotenv').config();
const connectDB = require('../config/db');
const { runAgent } = require('../agent/orchestrator');

async function run() {
  await connectDB();

  const first = await runAgent('I need a case for my iPhone 15');
  console.log('Turn 1:', first.reply);

  const second = await runAgent('Yes, add the screen protector too and let\'s checkout', first.history);
  console.log('Turn 2:', second.reply);

  process.exit(0);
}

run();