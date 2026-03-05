const crypto = require("crypto");
const loyaltyService = require("../services/loyaltyService");

module.exports = async (req, res) => {
  try {
    const hmacHeader = req.headers["x-shopify-hmac-sha256"];
    const generatedHmac = crypto
      .createHmac("sha256", process.env.SHOPIFY_WEBHOOK_SECRET)
      .update(req.body, "utf8")
      .digest("base64");

    if (generatedHmac !== hmacHeader) {
      return res.status(401).send("Invalid HMAC");
    }

    const order = JSON.parse(req.body.toString());

    if (!order.customer || !order.customer.id) {
      return res.status(200).send("No customer attached");
    }

    // Convert REST id → GraphQL ID
    const customerGid = `gid://shopify/Customer/${order.customer.id}`;

    loyaltyService.processCustomer(customerGid);

    res.status(200).send("Processed");
  } catch (err) {
    console.error("Webhook Error:", err);
    res.status(500).send("Error");
  }
};