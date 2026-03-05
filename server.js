require("dotenv").config();
const express = require("express");
const loyaltyService = require("./services/loyaltyService");
const validateShopifyWebhook = require("./utils/hmacValidator");

const app = express();

/* ✅ Raw body ONLY for this route */
app.use(
  "/webhooks/orders/create",
  express.raw({ type: "application/json" })
);

app.post("/webhooks/orders/create", (req, res) => {

  const isValid = validateShopifyWebhook(req);

  if (!isValid) {
    console.log("❌ HMAC validation failed");
    return res.status(401).send("Unauthorized");
  }

  console.log("✅ HMAC verified");

  const order = JSON.parse(req.body.toString());

  const customerId = order.customer?.id;

  if (!customerId) {
    return res.status(200).send("No Customer");
  }

  const customerGid = `gid://shopify/Customer/${customerId}`;

  loyaltyService.processCustomer(customerGid);

  console.log("graphql customer id -", customerGid);

  res.status(200).send("Webhook received");
});

app.listen(3000, () => {
  console.log("Server running on port 3000");
});