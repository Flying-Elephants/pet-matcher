import type { AdminApiContext } from "@shopify/shopify-app-react-router/server";
import { BillingDb } from "./db";
import type { SubscriptionPlan } from "../core/types";

export const BillingShopify = {
  async getSubscription(admin: AdminApiContext) {
    const query = `#graphql
      query {
        currentAppInstallation {
          activeSubscriptions {
            id
            name
            status
          }
        }
      }
    `;

    const response = await admin.graphql(query);

    if (response.status === 302) {
      throw response;
    }

    const json = await response.json();
    return json.data.currentAppInstallation.activeSubscriptions;
  },

  async createSubscription(admin: AdminApiContext, planName: SubscriptionPlan, returnUrl: string) {
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

    const price = planName === "GROWTH" ? 19.0 : planName === "ENTERPRISE" ? 49.0 : 0.0;

    if (price === 0) {
      // Logic for cancelling / moving to free would go here if Shopify allowed creating $0 subscriptions easily, 
      // but usually we just cancel existing ones. For this implementation, we assume GROWTH/ENTERPRISE.
      throw new Error("Cannot create a paid subscription for FREE plan");
    }

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
