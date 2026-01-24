import type { AdminApiContext } from "@shopify/shopify-app-react-router/server";
import { PLAN_GROWTH, PLAN_ENTERPRISE } from "../../../shopify.server";
import { BillingDb } from "./db";
import type { SubscriptionPlan } from "../core/types";

const PLAN_PRICES = {
  GROWTH: 9.99,
  ENTERPRISE: 29.99,
};

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

  async createSubscription(admin: AdminApiContext, billing: any, planName: SubscriptionPlan, returnUrl: string) {
    const shopifyPlanName = planName === "GROWTH" ? PLAN_GROWTH : planName === "ENTERPRISE" ? PLAN_ENTERPRISE : null;

    if (!shopifyPlanName) {
      throw new Error("Cannot create a paid subscription for FREE plan");
    }

    const isTest = process.env.NODE_ENV === "development" || process.env.SHOPIFY_BILLING_TEST === "true" || true; // Defaulting to true for now to fix user issue

    try {
      // Use the standard billing request which uses the config in shopify.server.ts
      // This handles the mutation and logic automatically
      return await billing.request({
        plan: shopifyPlanName,
        returnUrl,
        isTest,
      });
    } catch (error) {
      if (error instanceof Response) {
        const confirmationUrl = error.headers.get("X-Shopify-API-Request-Failure-Reauthorize-Url");
        if (confirmationUrl) {
          return { confirmationUrl };
        }
        throw error;
      }
      console.warn("Billing.request failed, attempting manual mutation fallback...", error);
      // Fallback to manual mutation if managed billing fails
      return await BillingShopify.createSubscriptionMutation(admin, shopifyPlanName, planName, returnUrl, isTest);
    }
  },

  async createSubscriptionMutation(
    admin: AdminApiContext,
    shopifyPlanName: string,
    planKey: SubscriptionPlan,
    returnUrl: string,
    isTest: boolean
  ) {
    console.log("[BillingDebug] createSubscriptionMutation called", { shopifyPlanName, returnUrl, isTest });
    if (planKey === "FREE") throw new Error("Cannot create subscription for FREE plan");
    
    const price = PLAN_PRICES[planKey];
    
    const mutation = `#graphql
      mutation AppSubscriptionCreate($name: String!, $returnUrl: URL!, $lineItems: [AppSubscriptionLineItemInput!]!, $test: Boolean) {
        appSubscriptionCreate(name: $name, returnUrl: $returnUrl, lineItems: $lineItems, test: $test) {
          userErrors {
            field
            message
          }
          confirmationUrl
          appSubscription {
            id
            status
          }
        }
      }
    `;

    const response = await admin.graphql(mutation, {
      variables: {
        name: shopifyPlanName,
        returnUrl: returnUrl,
        test: isTest,
        lineItems: [{
          plan: {
            appRecurringPricingDetails: {
              price: { amount: price.toString(), currencyCode: "USD" },
              interval: "EVERY_30_DAYS"
            }
          }
        }]
      }
    });

    const json = await response.json();
    console.log("[BillingDebug] createSubscriptionMutation response", JSON.stringify(json, null, 2));

    if (json.data?.appSubscriptionCreate?.userErrors?.length > 0) {
      const errors = json.data.appSubscriptionCreate.userErrors.map((e: any) => e.message).join(", ");
      console.error("[BillingDebug] createSubscriptionMutation userErrors", errors);
      throw new Error(`Billing Error: ${errors}`);
    }

    return json.data.appSubscriptionCreate;
  },

  async cancelSubscription(admin: AdminApiContext, subscriptionId: string) {
    console.log("[BillingDebug] cancelSubscription called", { subscriptionId });
    const mutation = `#graphql
      mutation AppSubscriptionCancel($id: ID!) {
        appSubscriptionCancel(id: $id) {
          userErrors {
            field
            message
          }
          appSubscription {
            id
            status
          }
        }
      }
    `;

    const response = await admin.graphql(mutation, {
      variables: { id: subscriptionId }
    });

    const json = await response.json();
    console.log("[BillingDebug] cancelSubscription response", JSON.stringify(json, null, 2));

    if (json.data?.appSubscriptionCancel?.userErrors?.length > 0) {
      const errorMsg = json.data.appSubscriptionCancel.userErrors[0].message;
      console.error("[BillingDebug] cancelSubscription userErrors", errorMsg);
      throw new Error(errorMsg);
    }
    
    return json.data.appSubscriptionCancel.appSubscription;
  }
};
