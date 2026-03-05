# 🏆 Time-Based Loyalty Engine

A Shopify webhook-driven loyalty tier engine that automatically evaluates customer spending over the last 24 hours and assigns loyalty tiers (**Bronze**, **Silver**, **Gold**) via customer tags and metafields.

---

## 📌 How It Works

1. Shopify fires an `orders/create` webhook when any new order is placed.
2. The server validates the webhook using HMAC-SHA256 signature verification.
3. If the order has a customer, their full order history is fetched via Shopify Admin GraphQL API (paginated).
4. Spend from the **last 24 hours** is calculated (cancelled orders excluded).
5. A **loyalty tier** is assigned:
   - 🥇 **Gold** — spend > ₹10,000
   - 🥈 **Silver** — spend ≥ ₹5,000
   - 🥉 **Bronze** — spend < ₹5,000
6. The customer's **tag** and **metafields** are updated in Shopify.

---

## 📁 Project Structure

```
time_based_loyalty_Engine/
│
├── server.js                    # Express server & webhook route
│
├── webhooks/
│   └── orderCreate.js           # Webhook handler logic
│
├── services/
│   ├── loyaltyService.js        # Core logic: fetch orders, calculate spend, update customer
│   └── tierCalculator.js        # Tier assignment based on spend
│
├── utils/
│   ├── graphqlClient.js         # Shopify GraphQL API client (with rate limit handling)
│   └── hmacValidator.js         # HMAC-SHA256 webhook signature validator
│
├── .env                         # Environment variables (not committed)
├── .gitignore
└── package.json
```

---

## ⚙️ Environment Variables

Create a `.env` file in the root with the following:

```env
SHOPIFY_STORE=your-store.myshopify.com
SHOPIFY_ACCESS_TOKEN=your_admin_api_access_token
SHOPIFY_WEBHOOK_SECRET=your_webhook_secret
API_VERSION=2024-01
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js v18+
- A Shopify store with Admin API access
- A tunnel tool like [ngrok](https://ngrok.com/) to expose localhost for webhook testing

### Installation

```bash
npm install
```

### Run the Server

```bash
npm run dev
```

Server starts on **port 3000**.

### Expose with ngrok (for local webhook testing)

```bash
ngrok http 3000
```

Register the webhook in Shopify Admin with the ngrok URL:
```
https://<your-ngrok-url>/webhooks/orders/create
```

---

## 🔁 Customer Metafields Updated

| Namespace | Key               | Type                   | Description                    |
|-----------|-------------------|------------------------|--------------------------------|
| `loyalty` | `tier`            | `single_line_text_field` | Current loyalty tier          |
| `loyalty` | `spend_last_1d`   | `number_decimal`       | Total spend in the last 24 hrs |
| `loyalty` | `last_calculated` | `date_time`            | Timestamp of last calculation  |

---

## 🧰 Tech Stack

- **Node.js** + **Express**
- **Shopify Admin GraphQL API**
- **axios** for HTTP requests
- **crypto** for HMAC validation

---
