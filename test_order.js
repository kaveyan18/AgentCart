require("dotenv").config();

const Razorpay = require("razorpay");

const razorpayInstance = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});

async function testOrder() {
    try {
        const result = await razorpayInstance.orders.create({
            amount: 79800,
            currency: "INR",
            receipt: "test_receipt_1"
        });

        console.log("Order created successfully:");
        console.log(result);
    } catch (error) {
        console.error("Failed to create order:");
        console.error(error);
    }
}

testOrder();