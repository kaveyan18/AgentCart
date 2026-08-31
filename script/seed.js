/**
 * seed.js — run with: node script/seed.js
 * Populates the `products` collection in MongoDB with a rich electronics catalog.
 * Categories: Laptops & Workstations, Smartphones, Audio, Wearables, Cameras, Accessories & Power.
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
  // ── 1. Laptops & Workspace ───────────────────────────────────────────────────
  {
    _id: "prod_macbook_air_m3",
    name: "Apple MacBook Air 13.6-inch M3",
    price: 114900,
    category: "laptops",
    description: "Liquid Retina display, 8-core CPU, 10-core GPU, 18-hour battery life, 256GB SSD in Midnight.",
    relatedTo: ["prod_laptop_sleeve_leather", "prod_usbc_hub_7in1"],
  },
  {
    _id: "prod_dell_xps_14",
    name: "Dell XPS 14 OLED Laptop",
    price: 149990,
    category: "laptops",
    description: "Intel Core Ultra 7 155H, 3.2K 120Hz OLED touch display, NVIDIA RTX 4050, 1TB SSD, CNC aluminum.",
    relatedTo: ["prod_usbc_hub_7in1", "prod_mx_master_3s"],
  },
  {
    _id: "prod_laptop_sleeve_leather",
    name: "Premium Vegan Leather Laptop Sleeve (13-14 inch)",
    price: 1899,
    category: "workspace",
    description: "Water-resistant vegan leather with microfiber lining and magnetic snap closure.",
    relatedTo: ["prod_macbook_air_m3", "prod_dell_xps_14"],
  },
  {
    _id: "prod_usbc_hub_7in1",
    name: "7-in-1 Aluminum USB-C Hub & Multiport Adapter",
    price: 2499,
    category: "workspace",
    description: "4K@60Hz HDMI, 100W Power Delivery, SD/microSD reader, 2x USB 3.2 Gen 2 ports in space grey.",
    relatedTo: ["prod_macbook_air_m3", "prod_dell_xps_14"],
  },
  {
    _id: "prod_mx_master_3s",
    name: "Logitech MX Master 3S Wireless Performance Mouse",
    price: 3899,
    category: "workspace",
    description: "8000 DPI track-on-glass sensor, Quiet Clicks, MagSpeed electromagnetic scroll wheel.",
    relatedTo: ["prod_laptopstand_aluminium", "prod_dell_xps_14"],
  },
  {
    _id: "prod_laptopstand_aluminium",
    name: "Aluminium Ergonomic Laptop Stand",
    price: 1999,
    category: "workspace",
    description: "Height and angle adjustable heavy-duty aluminium stand with heat dissipation vents.",
    relatedTo: ["prod_mx_master_3s", "prod_macbook_air_m3"],
  },

  // ── 2. Smartphones & Mobile ─────────────────────────────────────────────────
  {
    _id: "prod_iphone_15_pro",
    name: "Apple iPhone 15 Pro (128GB, Natural Titanium)",
    price: 129900,
    category: "smartphones",
    description: "Aerospace-grade titanium design, A17 Pro chip, Action button, 48MP main camera system with 3x Telephoto.",
    relatedTo: ["prod_phonecase_iphone15", "prod_magsafe_wallet"],
  },
  {
    _id: "prod_samsung_s24_ultra",
    name: "Samsung Galaxy S24 Ultra 5G (256GB, Titanium Gray)",
    price: 124999,
    category: "smartphones",
    description: "Galaxy AI built-in, 200MP camera, Snapdragon 8 Gen 3, Titanium frame, integrated S Pen stylus.",
    relatedTo: ["prod_s24_spen", "prod_charger_65w_gan"],
  },
  {
    _id: "prod_phonecase_iphone15",
    name: "iPhone 15 MagSafe Armor Silicone Case",
    price: 599,
    category: "accessories",
    description: "Soft-touch silicone with built-in N52 strong magnets and military grade 2-meter drop protection.",
    relatedTo: ["prod_screenprotector_iphone15"],
  },
  {
    _id: "prod_screenprotector_iphone15",
    name: "iPhone 15 9H Tempered Glass Screen Protector",
    price: 199,
    category: "accessories",
    description: "9H diamond-grade hardness, oleophobic anti-fingerprint coating, bubble-free alignment frame.",
    relatedTo: ["prod_phonecase_iphone15"],
  },
  {
    _id: "prod_magsafe_wallet",
    name: "Magnetic MagSafe Leather Card Wallet",
    price: 1299,
    category: "accessories",
    description: "Genuine leather wallet with Find My support and shielded card slots for up to 3 cards.",
    relatedTo: ["prod_iphone_15_pro"],
  },
  {
    _id: "prod_s24_spen",
    name: "Samsung Official S-Pen for Galaxy S24 Ultra",
    price: 2499,
    category: "accessories",
    description: "4,096 levels of pressure sensitivity, 0.7mm fine tip, Bluetooth gesture control.",
    relatedTo: ["prod_samsung_s24_ultra"],
  },

  // ── 3. Audio & Headphones ───────────────────────────────────────────────────
  {
    _id: "prod_headphones_wh1000xm5",
    name: "Sony WH-1000XM5 Wireless ANC Headphones",
    price: 29999,
    category: "audio",
    description: "Industry-leading noise cancellation with 8 microphones, 30-hour battery, Hi-Res LDAC playback.",
    relatedTo: ["prod_headphonecase_wh1000xm5"],
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
    relatedTo: ["prod_airpods_protective_case"],
  },
  {
    _id: "prod_airpods_protective_case",
    name: "Rugged Lanyard Case for AirPods Pro 2",
    price: 499,
    category: "audio",
    description: "Shockproof TPU armor case with carabiner clip and cutout for speaker & status LED.",
    relatedTo: ["prod_airpods_pro_2"],
  },
  {
    _id: "prod_marshall_emberton",
    name: "Marshall Emberton II Portable Bluetooth Speaker",
    price: 14999,
    category: "audio",
    description: "30+ hours of portable playtime, IP67 dust and water resistance, True Stereophonic 360° sound.",
    relatedTo: ["prod_cable_usbc_240w"],
  },

  // ── 4. Wearables & Smartwatches ─────────────────────────────────────────────
  {
    _id: "prod_apple_watch_ultra2",
    name: "Apple Watch Ultra 2 (GPS + Cellular, 49mm)",
    price: 89900,
    category: "wearables",
    description: "Rugged 49mm titanium case, 3000 nits display, precision dual-frequency GPS, 36-hr battery life.",
    relatedTo: ["prod_apple_watch_trail_loop", "prod_watch_charging_dock"],
  },
  {
    _id: "prod_galaxy_watch_6",
    name: "Samsung Galaxy Watch 6 Classic (47mm LTE)",
    price: 34999,
    category: "wearables",
    description: "Rotating bezel, Sapphire crystal glass, advanced sleep coaching, ECG & body composition sensor.",
    relatedTo: ["prod_watch_charging_dock"],
  },
  {
    _id: "prod_apple_watch_trail_loop",
    name: "Trail Loop Nylon Breathable Sport Band (49mm)",
    price: 2199,
    category: "wearables",
    description: "Lightweight soft nylon weave with convenient pull tab for quick adjustments on the go.",
    relatedTo: ["prod_apple_watch_ultra2"],
  },
  {
    _id: "prod_watch_charging_dock",
    name: "3-in-1 Foldable Fast Magnetic Wireless Charging Dock",
    price: 3499,
    category: "wearables",
    description: "Simultaneous 15W MagSafe phone charging, 5W watch puck, and 5W earbuds pad in compact fold design.",
    relatedTo: ["prod_apple_watch_ultra2", "prod_galaxy_watch_6"],
  },

  // ── 5. Cameras & Creator Gear ────────────────────────────────────────────────
  {
    _id: "prod_sony_zv_e10",
    name: "Sony Alpha ZV-E10 Mirrorless Vlog Camera (16-50mm Lens)",
    price: 61490,
    category: "cameras",
    description: "24.2MP APS-C sensor, 4K HDR recording, Real-time Eye AF, directional 3-capsule mic with windscreen.",
    relatedTo: ["prod_camera_mic_wireless", "prod_camera_tripod_vlog"],
  },
  {
    _id: "prod_camera_mic_wireless",
    name: "DJI Mic 2 Wireless Lavalier Microphone Transmitter",
    price: 4899,
    category: "cameras",
    description: "32-bit float internal recording, intelligent noise cancelling, 250m range, 18-hour battery.",
    relatedTo: ["prod_sony_zv_e10"],
  },
  {
    _id: "prod_camera_tripod_vlog",
    name: "Carbon Fiber Compact Vlogging Tripod & Ballhead Grip",
    price: 2299,
    category: "cameras",
    description: "Ultra-lightweight 1.1kg carbon fiber, Arca-Swiss quick release plate, cold shoe mount for mics.",
    relatedTo: ["prod_sony_zv_e10"],
  },

  // ── 6. Power & Charging ─────────────────────────────────────────────────────
  {
    _id: "prod_charger_65w_gan",
    name: "65W GaN Dual-Port USB-C Rapid Charger",
    price: 2499,
    category: "charging",
    description: "Gallium Nitride tech delivers up to 65W PD 3.0 via USB-C plus 18W QC via USB-A.",
    relatedTo: ["prod_cable_usbc_240w"],
  },
  {
    _id: "prod_cable_usbc_240w",
    name: "240W Braided USB-C to USB-C Fast Charging Cable (2m)",
    price: 799,
    category: "charging",
    description: "E-Marker smart chip, 480Mbps data sync, heavy-duty nylon braided exterior with strain relief.",
    relatedTo: ["prod_charger_65w_gan"],
  },
  {
    _id: "prod_powerbank_20000",
    name: "20,000mAh 65W Laptop Power Bank with Smart LED Display",
    price: 3499,
    category: "charging",
    description: "High-capacity power bank capable of charging laptops, phones, and wearables with real-time wattage screen.",
    relatedTo: ["prod_cable_usbc_240w"],
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
  } catch (err) {
    console.error("❌  Seed failed:", err.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log("\n🔌  Disconnected from MongoDB. Done.");
  }
}

seed();
