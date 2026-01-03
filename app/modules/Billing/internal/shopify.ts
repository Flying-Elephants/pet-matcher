import type { AdminApiContext } from "@shopify/shopify-app-react-router/server";

export const BillingService = {
  async getSubscription(admin: AdminApiContext) {
    const query = `#graphql
      query {
        currentAppInstallation {
          activeSubscriptions {
            id
            name
            status
            lineItems {
              id
              plan {
                pricingDetails {
                  __typename
                  ... on AppRecurringPricing {
                    interval
                    price {
                      amount
                    }
                  }
                }
              }
            }
          }
        }
      }
    `;

    const response = await admin.graphql(query);
    const json = await response.json();
    return json.data.currentAppInstallation.activeSubscriptions;
  },

  async createSubscription(admin: AdminApiContext, planName: string, returnUrl: string) {
    const mutation = `#graphql
      mutation appSubscriptionCreate($name: String!, $lineItems: [AppSubscriptionLineItemInput!]!, $returnUrl: URL!) {
        appSubscriptionCreate(name: $name, lineItems: $lineItems, returnUrl: $returnUrl) {
          appSubscription {
            id
          }
          confirmationUrl
          userErrors {
            field
            message
          }
        }
      }
    `;

    const price = planName === "Growth" ? 19.0 : 49.0;

    const response = await admin.graphql(mutation, {
      variables: {
        name: planName,
        returnUrl,
        lineItems: [
          {
            plan: {
              appRecurringPricingDetails: {
                price: { amount: price, currencyCode: "USD" },
                interval: "EVERY_30_DAYS"
              }
            }
          }
        ]
      }
    });

    const json = await response.json();
    return json.data.appSubscriptionCreate;
  }
};
