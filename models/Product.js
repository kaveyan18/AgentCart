const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    _id: { type: String },          // human-readable slug, e.g. "prod_charger_65w_gan"
    name: { type: String, required: true },
    price: { type: Number, required: true }, // in ₹ — multiply ×100 only for Razorpay
    category: { type: String },
    description: { type: String },
    relatedTo: [{ type: String }],  // array of _id slugs → cross-sell targets
  },
  { _id: false }                    // tell Mongoose we're supplying our own _id
);

module.exports = mongoose.model('Product', productSchema);