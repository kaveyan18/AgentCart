# AgentCart 🛒🤖
> **Agentic Commerce Platform with Bounded Financial Autonomy**

AgentCart is an autonomous e-commerce storefront powered by Groq LLM function calling and protected by a deterministic, multi-tier financial safety gate with Razorpay checkout.

---

## ✨ Features

- 🤖 **Embedded AI Shopping Assistant**: Chat with an LLM agent equipped with tool-calling capabilities (`search_catalog`, `get_upsell_candidates`, `propose_order`, `get_order_status`).
- 🛡️ **Bounded Financial Autonomy (Policy Gate)**:
  - **Tier 1 (≤ ₹50,000)**: Auto-checkout approved autonomously by agent.
  - **Tier 2 (₹50,001 – ₹1,00,000)**: Requires explicit customer affirmation.
  - **Tier 3 (> ₹1,00,000)**: Agent cannot autonomously buy; forces manual buyer review.
- 💳 **Razorpay Payment Gateway**: Seamless test/live checkout flow with server-side signature verification and webhook listeners.
- 🔒 **Merchant Console (`/admin`)**: RBAC-protected dashboard for catalog management, live AI audit trail, and transaction inspection.
- 🛒 **Server-Authoritative Cart**: Cart isolation per user, coupon validation (max 10% discount policy ceiling), and anti-tamper price recalculation.

---

## 🛠️ Tech Stack

- **Backend**: Node.js, Express 5, MongoDB / Mongoose, Groq SDK, Razorpay SDK
- **Frontend**: React 18, Vite, React Router 6, Lucide Icons
- **Deployment**: Render (Backend) + Vercel (Frontend)

---

## 🚀 Quick Start

### 1. Clone & Install Dependencies

```bash
git clone https://github.com/kaveyan18/AgentCart.git
cd AgentCart

# Install root/backend dependencies
npm install

# Install frontend dependencies
cd frontend
npm install
cd ..
```

### 2. Configure Environment Variables

Create `.env` in the root directory:
```env
PORT=3000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
GROQ_API_KEY=your_groq_api_key
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
RAZORPAY_WEBHOOK_SECRET=your_razorpay_webhook_secret
CLIENT_URL=http://localhost:5173
```

Create `frontend/.env`:
```env
VITE_API_URL=http://localhost:3000/api
```

### 3. Run Locally

**Backend**:
```bash
npm run dev
# Running on http://localhost:3000
```

**Frontend**:
```bash
cd frontend
npm run dev
# Running on http://localhost:5173
```

---

## 🌐 Deployment

- **Backend (Render)**: Uses [`render.yaml`](./render.yaml). Point Render Blueprint or Web Service to the repository root.
- **Frontend (Vercel)**: Set Root Directory to `frontend`. Configured with SPA rewrite via [`frontend/vercel.json`](./frontend/vercel.json). Set `VITE_API_URL` in Vercel environment variables.
