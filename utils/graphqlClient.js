const axios = require("axios");

async function graphqlRequest(query, variables = {}) {
  try {
    const response = await axios.post(
      `https://${process.env.SHOPIFY_STORE}/admin/api/${process.env.API_VERSION}/graphql.json`,
      {
        query,
        variables,
      },
      {
        headers: {
          "X-Shopify-Access-Token": process.env.SHOPIFY_ACCESS_TOKEN,
          "Content-Type": "application/json",
        },
      }
    );

    // 🔥 IMPORTANT: Handle rate limiting
    const throttle = response.data.extensions?.cost?.throttleStatus;

    if (throttle) {
      const { currentlyAvailable, restoreRate } = throttle;

      if (currentlyAvailable < 50) {
        const waitTime = (50 / restoreRate) * 1000;
        console.log(`⚠️ Throttled. Sleeping ${waitTime}ms`);
        await new Promise((r) => setTimeout(r, waitTime));
      }
    }

    if (response.data.errors) {
      throw new Error(JSON.stringify(response.data.errors));
    }

    return response.data.data;

  } catch (error) {
    console.error("GraphQL Error:", error.message);
    throw error;
  }
}

module.exports = graphqlRequest;