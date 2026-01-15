import type { AdminApiContext } from "@shopify/shopify-app-react-router/server";
import { MONTHLY_PLAN } from "../../../shopify.server";
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
    // If we are getting Managed Pricing error with appSubscriptionCreate,
    // it strongly suggests Shopify is forcing the use of the new billing config in shopifyApp
    // OR the app is in a state where API-based recurring charges are forbidden.
    
    // We will use appPurchaseOneTime as a test/fallback if recurring is blocked,
    // but first let's try a different approach: appSubscriptionCreate without the custom name
    // to see if it's a validation issue.
    
    const mutation = `#graphql
      mutation appSubscriptionCreate($name: String!, $lineItems: [AppSubscriptionLineItemInput!]!, $returnUrl: URL!, $test: Boolean) {
        appSubscriptionCreate(name: $name, lineItems: $lineItems, returnUrl: $returnUrl, test: $test) {
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

    const price = planName === "GROWTH" ? 9.99 : planName === "ENTERPRISE" ? 49.0 : 0.0;

    if (price === 0) {
      throw new Error("Cannot create a paid subscription for FREE plan");
    }

    const response = await admin.graphql(mutation, {
      variables: {
        name: planName, // Simple name
        returnUrl,
        test: false,
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

    const json: any = await response.json();
    
    if (json.errors) {
      console.error("GraphQL Errors:", JSON.stringify(json.errors, null, 2));
      throw new Error(json.errors[0]?.message || "GraphQL Error");
    }

    return json.data.appSubscriptionCreate;
  }
};
