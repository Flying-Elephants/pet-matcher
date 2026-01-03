import { BillingService as ShopifyBilling } from "./internal/shopify";
import type { AdminApiContext } from "@shopify/shopify-app-react-router/server";

export const BillingService = {
  async checkSubscription(admin: AdminApiContext) {
    const subs = await ShopifyBilling.getSubscription(admin);
    return subs && subs.length > 0 ? subs[0] : null;
  },

  async upgrade(admin: AdminApiContext, plan: "Growth" | "Enterprise", returnUrl: string) {
    return ShopifyBilling.createSubscription(admin, plan, returnUrl);
  }
};
