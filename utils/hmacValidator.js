// utils/hmacValidator.js
const crypto = require("crypto");

function validateShopifyWebhook(req) {
  const hmacHeader = req.headers["x-shopify-hmac-sha256"];

  if (!hmacHeader) {
    console.log("❌ No HMAC header found");
    return false;
  }

  const generatedHmac = crypto
    .createHmac("sha256", process.env.SHOPIFY_WEBHOOK_SECRET)
    .update(req.body) // IMPORTANT: raw body
    .digest("base64");

  console.log("Header HMAC:", hmacHeader);
  console.log("Generated HMAC:", generatedHmac);

  return generatedHmac === hmacHeader;
}

module.exports = validateShopifyWebhook;