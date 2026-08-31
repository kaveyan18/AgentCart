/**
 * seed.js — run once with: node seed.js
 * Populates the `products` collection in the `agentic_commerce` database.
 * Each product has a `relatedTo` array — the raw data source for cross-sell / upsell logic.
 */

require("dotenv").config();
const mongoose = require("mongoose");

// ── Schema ────────────────────────────────────────────────────────────────────
const productSchema = new mongoose.Schema(
  {
    _id: { type: String },           // human-readable slug, e.g. "prod_phonecase_iphone15"
    name: { type: String, required: true },
    price: { type: Number, required: true }, // ₹ — convert × 100 only when calling Razorpay
    category: { type: String, required: true },
    description: { type: String },
    relatedTo: [{ type: String }],   // array of _id strings → cross-sell targets
  },
  { _id: false }                     // we supply our own string _id
);

const Product = mongoose.model("Product", productSchema);

// ── Seed data — 4 genuinely sensible pairs ────────────────────────────────────
const products = [
  // Pair 1 — iPhone 15 case + screen protector
  {
    _id: "prod_phonecase_iphone15",
    name: "iPhone 15 Silicone Case",
    price: 599,
    category: "accessories",
    description: "Slim MagSafe-compatible silicone case for iPhone 15 — drop tested to 2 m.",
    relatedTo: ["prod_screenprotector_iphone15"],
  },
  {
    _id: "prod_screenprotector_iphone15",
    name: "iPhone 15 Tempered Glass Screen Protector",
    price: 199,
    category: "accessories",
    description: "9H hardness, anti-fingerprint coating, bubble-free install kit included.",
    relatedTo: ["prod_phonecase_iphone15"],
  },

  // Pair 2 — Wireless headphones + carrying case
  {
    _id: "prod_headphones_wh1000xm5",
    name: "Sony WH-1000XM5 Wireless Headphones",
    price: 29999,
    category: "audio",
    description: "Industry-leading noise cancellation, 30-hr battery, LDAC Hi-Res audio.",
    relatedTo: ["prod_headphonecase_wh1000xm5"],
  },
  {
    _id: "prod_headphonecase_wh1000xm5",
    name: "Sony WH-1000XM5 Hard Carry Case",
    price: 1499,
    category: "audio",
    description: "Official Sony hard-shell carry case with carabiner clip and accessory pocket.",
    relatedTo: ["prod_headphones_wh1000xm5"],
  },

  // Pair 3 — 65 W GaN charger + braided USB-C cable
  {
    _id: "prod_charger_65w_gan",
    name: "65W GaN USB-C Charger",
    price: 2499,
    category: "charging",
    description: "Dual-port (USB-C + USB-A) GaN charger; charges a MacBook Air in 90 min.",
    relatedTo: ["prod_cable_usbc_240w"],
  },
  {
    _id: "prod_cable_usbc_240w",
    name: "240W USB-C Braided Cable (2 m)",
    price: 799,
    category: "charging",
    description: "240W EPR certified, 40 Gbps data, compatible with Thunderbolt 4.",
    relatedTo: ["prod_charger_65w_gan"],
  },

  // Pair 4 — Laptop stand + wireless keyboard+mouse combo
  {
    _id: "prod_laptopstand_aluminium",
    name: "Aluminium Adjustable Laptop Stand",
    price: 1999,
    category: "workspace",
    description: "Height + angle adjustable, fits 10–17\" laptops, folds flat for travel.",
    relatedTo: ["prod_keyboard_mouse_combo"],
  },
  {
    _id: "prod_keyboard_mouse_combo",
    name: "Wireless Keyboard & Mouse Combo",
    price: 2799,
    category: "workspace",
    description: "2.4 GHz + Bluetooth dual-mode, quiet keys, 12-month battery life.",
    relatedTo: ["prod_laptopstand_aluminium"],
  },
];

// ── Insert ────────────────────────────────────────────────────────────────────
async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅  Connected to MongoDB:", process.env.MONGO_URI);

    // Wipe existing products so the script is safely idempotent
    const deleted = await Product.deleteMany({});
    console.log(`🗑️   Cleared ${deleted.deletedCount} existing product(s).`);

    const inserted = await Product.insertMany(products);
    console.log(`🌱  Seeded ${inserted.length} products:\n`);

    inserted.forEach((p) =>
      console.log(`   • [${p._id}]  ${p.name}  —  ₹${p.price}  →  relatedTo: [${p.relatedTo.join(", ")}]`)
    );

    // Quick verification query
    console.log("\n📋  Verification — all products via find():");
    const all = await Product.find({}).lean();
    console.table(all.map(({ _id, name, price, category }) => ({ _id, name, price, category })));
  } catch (err) {
    console.error("❌  Seed failed:", err.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log("\n🔌  Disconnected. Done.");
  }
}

seed();
