import type { AdminApiContext } from "@shopify/shopify-app-react-router/server";
import { PLAN_CONFIGS, type SubscriptionPlan } from "./core/types";

export * from "./core/types";

export const BillingService = {
  /**
   * Get current subscription status
   * OPEN BETA: Always return ENTERPRISE equivalent
   */
  async getSubscriptionStatus(admin: AdminApiContext, shop: string) {
    return {
      plan: "ENTERPRISE" as SubscriptionPlan,
      usage: 0,
      limits: PLAN_CONFIGS["ENTERPRISE"],
    };
  },

  /**
   * Sync Shopify active subscription to local DB
   * OPEN BETA: No-op
   */
  async syncSubscription(admin: AdminApiContext, shop: string): Promise<SubscriptionPlan> {
    return "FREE";
  },

  /**
   * Initiate upgrade flow
   * OPEN BETA: No-op
   */
  async upgrade(admin: AdminApiContext, billing: any, plan: SubscriptionPlan, returnUrl: string) {
    console.log("[Billing] Upgrade disabled in Open Beta");
    return { confirmationUrl: null };
  },

  /**
   * Cancel active subscription
   * OPEN BETA: No-op
   */
  async cancelSubscription(admin: AdminApiContext, shop: string) {
    console.log("[Billing] Cancel disabled in Open Beta");
  },

  /**
   * Require a minimum plan or redirect
   * OPEN BETA: Always allow
   */
  async requirePlan(shop: string, minPlan: SubscriptionPlan) {
    return;
  },

  /**
   * Record a match event (usage tracking)
   * OPEN BETA: No-op (or could track in DB if we wanted, but disabling for now to avoid confusion)
   */
  async recordMatch(shop: string) {
    // Optional: could still track usage if needed, but strict billing is off.
  },

  /**
   * Check if a feature is allowed
   * OPEN BETA: Always allow
   */
  async canUseFeature(shop: string, feature: keyof (typeof PLAN_CONFIGS)["FREE"]["features"]) {
    return true;
  },

  /**
   * Check if usage limit is reached
   * OPEN BETA: Always allow
   */
  async isUnderLimit(shop: string) {
    return true;
  }
};
