require('dotenv').config();
const connectDB = require('../config/db');
const { searchCatalog, getUpsellCandidates } = require('../agent/tools');

async function run() {
  await connectDB();
  const results = await searchCatalog('case');
  console.log('Search results:', results);
  

  if (results.length) {
    const upsells = await getUpsellCandidates(results[0].id);
    console.log('Upsell candidates:', upsells);
  }
  process.exit(0);
}

run();