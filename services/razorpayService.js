const Razorpay = require('razorpay');

const instance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

async function createRazorpayOrder(amountInRupees, receipt) {
  const order = await instance.orders.create({
    amount: Math.round(amountInRupees * 100), // paise
    currency: 'INR',
    receipt
  });
  return order;
}

module.exports = { createRazorpayOrder };