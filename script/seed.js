/**
 * seed.js — run with: node script/seed.js
 * Populates the `products` collection in MongoDB with a rich electronics catalog.
 * Categories: Laptops, Smartphones, Tablets, Audio, Wearables, Gaming, Cameras, Workspace, Smart Home, Power & Charging.
 */

require("dotenv").config();
const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    _id: { type: String },
    name: { type: String, required: true },
    price: { type: Number, required: true }, // in ₹
    category: { type: String, required: true },
    description: { type: String },
    relatedTo: [{ type: String }],
  },
  { _id: false }
);

const Product = mongoose.model("Product", productSchema);

const products = [
  // ── 1. Laptops & Computers ──────────────────────────────────────────────────
  {
    _id: "prod_macbook_air_m3",
    name: "Apple MacBook Air 13.6-inch M3",
    price: 114900,
    category: "laptops",
    description: "Liquid Retina display, 8-core CPU, 10-core GPU, 18-hour battery life, 256GB SSD in Midnight.",
    relatedTo: ["prod_usbc_hub_7in1", "prod_laptopstand_aluminium"],
  },

  // ── 2. Smartphones & Mobile ─────────────────────────────────────────────────
  {
    _id: "prod_iphone_15_pro",
    name: "Apple iPhone 15 Pro (128GB, Natural Titanium)",
    price: 129900,
    category: "smartphones",
    description: "Aerospace-grade titanium design, A17 Pro chip, Action button, 48MP main camera system with 3x Telephoto.",
    relatedTo: ["prod_phonecase_iphone15", "prod_screenprotector_iphone15", "prod_charger_65w_gan"],
  },
  {
    _id: "prod_phonecase_iphone15",
    name: "iPhone 15 MagSafe Armor Silicone Case",
    price: 599,
    category: "accessories",
    description: "Soft-touch silicone with built-in N52 strong magnets and military grade 2-meter drop protection.",
    relatedTo: ["prod_screenprotector_iphone15", "prod_cable_usbc_240w"],
  },
  {
    _id: "prod_screenprotector_iphone15",
    name: "iPhone 15 9H Tempered Glass Screen Protector",
    price: 199,
    category: "accessories",
    description: "9H diamond-grade hardness, oleophobic anti-fingerprint coating, bubble-free alignment frame.",
    relatedTo: ["prod_phonecase_iphone15"],
  },

  // ── 3. Tablets & Creativity ─────────────────────────────────────────────────
  {
    _id: "prod_ipad_air_m2",
    name: "Apple iPad Air 11-inch M2 (128GB, Space Gray)",
    price: 59900,
    category: "tablets",
    description: "Stunning Liquid Retina display, blazing fast M2 chip, Landscape 12MP front camera, Wi-Fi 6E.",
    relatedTo: ["prod_usbc_hub_7in1", "prod_charger_65w_gan"],
  },

  // ── 4. Audio & Headphones ───────────────────────────────────────────────────
  {
    _id: "prod_headphones_wh1000xm5",
    name: "Sony WH-1000XM5 Wireless ANC Headphones",
    price: 29999,
    category: "audio",
    description: "Industry-leading noise cancellation with 8 microphones, 30-hour battery, Hi-Res LDAC playback.",
    relatedTo: ["prod_headphonecase_wh1000xm5", "prod_cable_usbc_240w"],
  },
  {
    _id: "prod_headphonecase_wh1000xm5",
    name: "Sony WH-1000XM5 Hard EVA Travel Case",
    price: 1499,
    category: "audio",
    description: "Custom molded hard shell case with accessory storage pouch and metal carabiner.",
    relatedTo: ["prod_headphones_wh1000xm5"],
  },
  {
    _id: "prod_airpods_pro_2",
    name: "Apple AirPods Pro (2nd Gen with USB-C MagSafe Case)",
    price: 24900,
    category: "audio",
    description: "H2 chip, 2x more Active Noise Cancellation, Adaptive Audio, Conversation Awareness, IP54 rated.",
    relatedTo: ["prod_charger_65w_gan", "prod_apple_watch_ultra2"],
  },

  // ── 5. Wearables & Smartwatches ─────────────────────────────────────────────
  {
    _id: "prod_apple_watch_ultra2",
    name: "Apple Watch Ultra 2 (GPS + Cellular, 49mm Titanium)",
    price: 89900,
    category: "wearables",
    description: "Rugged 49mm titanium case, 3000 nits display, precision dual-frequency GPS, 36-hr battery life.",
    relatedTo: ["prod_airpods_pro_2", "prod_charger_65w_gan"],
  },

  // ── 6. Gaming & Consoles ────────────────────────────────────────────────────
  {
    _id: "prod_ps5_dualsense_controller",
    name: "PlayStation 5 DualSense Wireless Controller",
    price: 4999,
    category: "gaming",
    description: "Immersive haptic feedback, dynamic adaptive triggers, built-in microphone and motion sensor.",
    relatedTo: ["prod_cable_usbc_240w", "prod_powerbank_20000"],
  },

  // ── 7. Workspace & Ergonomics ───────────────────────────────────────────────
  {
    _id: "prod_keychron_k2_pro",
    name: "Keychron K2 Pro Wireless Mechanical Keyboard",
    price: 4499,
    category: "workspace",
    description: "75% compact layout, QMK/VIA programmable, hot-swappable mechanical switches, RGB backlighting.",
    relatedTo: ["prod_mx_master_3s", "prod_usbc_hub_7in1"],
  },
  {
    _id: "prod_mx_master_3s",
    name: "Logitech MX Master 3S Wireless Performance Mouse",
    price: 3899,
    category: "workspace",
    description: "8000 DPI track-on-glass sensor, Quiet Clicks, MagSpeed electromagnetic scroll wheel.",
    relatedTo: ["prod_keychron_k2_pro", "prod_laptopstand_aluminium"],
  },
  {
    _id: "prod_laptopstand_aluminium",
    name: "Aluminium Ergonomic Laptop Stand",
    price: 1999,
    category: "workspace",
    description: "Height and angle adjustable heavy-duty aluminium stand with heat dissipation vents.",
    relatedTo: ["prod_mx_master_3s", "prod_macbook_air_m3"],
  },
  {
    _id: "prod_usbc_hub_7in1",
    name: "7-in-1 Aluminum USB-C Hub & Multiport Adapter",
    price: 2499,
    category: "workspace",
    description: "4K@60Hz HDMI, 100W Power Delivery, SD/microSD reader, 2x USB 3.2 Gen 2 ports in space grey.",
    relatedTo: ["prod_macbook_air_m3", "prod_cable_usbc_240w"],
  },
  {
    _id: "prod_keyboard_mouse_combo",
    name: "Logitech Wireless Keyboard & Optical Mouse Combo",
    price: 1799,
    category: "workspace",
    description: "Reliable 2.4GHz wireless connection, spill-resistant keyboard, 36-month battery life.",
    relatedTo: ["prod_laptopstand_aluminium"],
  },

  // ── 8. Cameras & Creator Gear ────────────────────────────────────────────────
  {
    _id: "prod_sony_zv_e10",
    name: "Sony Alpha ZV-E10 Mirrorless Creator Camera (16-50mm)",
    price: 61490,
    category: "cameras",
    description: "24.2MP APS-C sensor, 4K HDR recording, Real-time Eye AF, directional 3-capsule mic with windscreen.",
    relatedTo: ["prod_usbc_hub_7in1", "prod_powerbank_20000"],
  },

  // ── 9. Smart Home & Ambient Lighting ─────────────────────────────────────────
  {
    _id: "prod_philips_hue_starter",
    name: "Philips Hue Smart Ambient Light Bar 2-Pack",
    price: 4899,
    category: "smarthome",
    description: "16 million colors, sync with music and gaming, voice control with Alexa, Google Assistant & Apple Home.",
    relatedTo: ["prod_keychron_k2_pro", "prod_charger_65w_gan"],
  },

  // ── 10. Power & Fast Charging ───────────────────────────────────────────────
  {
    _id: "prod_charger_65w_gan",
    name: "65W GaN Dual-Port USB-C Rapid Charger",
    price: 2499,
    category: "charging",
    description: "Gallium Nitride tech delivers up to 65W PD 3.0 via USB-C plus 18W QC via USB-A.",
    relatedTo: ["prod_cable_usbc_240w", "prod_powerbank_20000"],
  },
  {
    _id: "prod_cable_usbc_240w",
    name: "240W Braided USB-C to USB-C Fast Charging Cable (2m)",
    price: 799,
    category: "charging",
    description: "E-Marker smart chip, 480Mbps data sync, heavy-duty nylon braided exterior with strain relief.",
    relatedTo: ["prod_charger_65w_gan", "prod_powerbank_20000"],
  },
  {
    _id: "prod_powerbank_20000",
    name: "20,000mAh 65W Laptop Power Bank with Smart LED Display",
    price: 3499,
    category: "charging",
    description: "High-capacity power bank capable of charging laptops, phones, and wearables with real-time wattage screen.",
    relatedTo: ["prod_cable_usbc_240w", "prod_charger_65w_gan"],
  }
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅  Connected to MongoDB:", process.env.MONGO_URI);

    const deleted = await Product.deleteMany({});
    console.log(`🗑️   Cleared ${deleted.deletedCount} existing product(s).`);

    const inserted = await Product.insertMany(products);
    console.log(`🌱  Seeded ${inserted.length} electronics products successfully!\n`);

    const categories = [...new Set(inserted.map(p => p.category))];
    categories.forEach(cat => {
      const count = inserted.filter(p => p.category === cat).length;
      console.log(`   📂 ${cat.toUpperCase()}: ${count} products`);
    });

    // ── Seed Accounts ───────────────────────────────────────────────────────────
    const bcrypt = require('bcryptjs');
    const User = require('../models/User');

    await User.deleteMany({ email: { $in: ['merchant@parcel.test', 'buyer@parcel.test'] } });

    const merchantHash = await bcrypt.hash('demo1234', 10);
    const merchantUser = await User.create({
      name: 'Store Owner',
      email: 'merchant@parcel.test',
      passwordHash: merchantHash,
      role: 'merchant'
    });
    console.log(`\n👑  Seeded Merchant Account: ${merchantUser.email} (password: demo1234, role: ${merchantUser.role})`);

    const buyerHash = await bcrypt.hash('demo1234', 10);
    const buyerUser = await User.create({
      name: 'Alex Rivera',
      email: 'buyer@parcel.test',
      passwordHash: buyerHash,
      role: 'buyer'
    });
    console.log(`👤  Seeded Buyer Account:    ${buyerUser.email} (password: demo1234, role: ${buyerUser.role})`);

  } catch (err) {
    console.error("❌  Seed failed:", err.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log("\n🔌  Disconnected from MongoDB. Done.");
  }
}

seed();
