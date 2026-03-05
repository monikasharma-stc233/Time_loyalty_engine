const graphqlRequest = require("../utils/graphqlClient");
const calculateTier = require("./tierCalculator");
async function processCustomer(customerGid) {
  console.log("Processing customer:", customerGid);

  const orders = await fetchAllOrders(customerGid);
  console.log("Total orders fetched:", orders.length);

  const spend = calculateLast1DaySpend(orders);
  console.log("Last 1 day spend:", spend);  

  const tier = calculateTier(spend);
  console.log("Assigned Tier:" , tier);

  await updateCustomerTag(customerGid, tier);

  await updateMetafields(customerGid, tier, spend);

}
async function fetchAllOrders(customerGid) {
  let hasNextPage = true;
  let cursor = null;
  let allOrders = [];

  while (hasNextPage) {
    const query = `
      query ($customerId: ID!, $cursor: String) {
        customer(id: $customerId) {
          orders(first: 50, after: $cursor) {
            pageInfo {
              hasNextPage
            }
            edges {
              cursor
              node {
                id
                createdAt
                cancelledAt
                totalPriceSet {
                  shopMoney {
                    amount
                  }
                }
              }
            }
          }
        }
      }
    `;

    const data = await graphqlRequest(query, {
      customerId: customerGid,
      cursor: cursor,
    });
    console.log(JSON.stringify(data, null, 2));
    if (!data.customer) return [];

    const edges = data.customer.orders.edges;

    allOrders.push(...edges);

    hasNextPage = data.customer.orders.pageInfo.hasNextPage;

    cursor = edges.length
      ? edges[edges.length - 1].cursor
      : null;
  }

  return allOrders;
}
function calculateLast1DaySpend(orders) {
  const oneDayAgo = new Date();
  oneDayAgo.setDate(oneDayAgo.getDate() - 1);

  let total = 0;

  for (const { node } of orders) {
    const createdDate = new Date(node.createdAt);

    if (createdDate > oneDayAgo && !node.cancelledAt) {
      total += parseFloat(node.totalPriceSet.shopMoney.amount);
    }
  }

  return total;
}
async function updateCustomerTag(customerGid, newTier) {
  // Step 1: Fetch current tags
  const query = `
    query ($id: ID!) {
      customer(id: $id) {
        id
        tags
      }
    }
  `;

  const data = await graphqlRequest(query, { id: customerGid });

  if (!data.customer) return;

  let existingTags = data.customer.tags || [];

  // Step 2: Remove old tier tags
  existingTags = existingTags.filter(
    tag => !["Bronze", "Silver", "Gold"].includes(tag)
  );

  // Step 3: Add new tier if not already present
  if (!existingTags.includes(newTier)) {
    existingTags.push(newTier);
  }

  // Step 4: Update customer
  const mutation = `
    mutation ($input: CustomerInput!) {
      customerUpdate(input: $input) {
        userErrors {
          message
        }
      }
    }
  `;

  await graphqlRequest(mutation, {
    input: {
      id: customerGid,
      tags: existingTags,
    },
  });

  console.log("✅ Tag updated to:", newTier);
}
async function updateMetafields(customerGid, tier, spend) {
  const mutation = `
    mutation ($metafields: [MetafieldsSetInput!]!) {
      metafieldsSet(metafields: $metafields) {
        userErrors {
          message
        }
      }
    }
  `;

  const metafields = [
    {
      namespace: "loyalty",
      key: "tier",
      type: "single_line_text_field",
      value: tier,
      ownerId: customerGid,
    },
    {
      namespace: "loyalty",
      key: "spend_last_1d",
      type: "number_decimal",
      value: spend.toFixed(2),
      ownerId: customerGid,
    },
    {
      namespace: "loyalty",
      key: "last_calculated",
      type: "date_time",
      value: new Date().toISOString(),
      ownerId: customerGid,
    },
  ];

  await graphqlRequest(mutation, { metafields });

  console.log("✅ Metafields updated");
}

module.exports = { processCustomer };