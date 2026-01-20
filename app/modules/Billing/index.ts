import type { AdminApiContext } from "@shopify/shopify-app-react-router/server";
import { BillingShopify } from "./internal/shopify";
import { BillingDb } from "./internal/db";
import { PLAN_CONFIGS, type SubscriptionPlan } from "./core/types";
import { PLAN_GROWTH, PLAN_ENTERPRISE } from "../../shopify.server";
import { redirect } from "react-router";

export * from "./core/types";

export const BillingService = {
  /**
   * Get current subscription status from local DB + Shopify Sync
   */
  async getSubscriptionStatus(admin: AdminApiContext, shop: string) {
    // 1. Get from local DB
    let session = await BillingDb.getSession(shop);
    
    // 2. Fallback or initial sync
    if (!session) {
      throw new Error("Session not found");
    }

    const plan = (session.plan as SubscriptionPlan) || "FREE";
    const limits = PLAN_CONFIGS[plan];

    return {
      plan,
      usage: session.matchCount,
      limits,
    };
  },

  /**
   * Sync Shopify active subscription to local DB
   */
  async syncSubscription(admin: AdminApiContext, shop: string): Promise<SubscriptionPlan> {
    const activeSubs = await BillingShopify.getSubscription(admin);
    
    let plan: SubscriptionPlan = "FREE";
    
    if (activeSubs && activeSubs.length > 0) {
      const activePlanName = activeSubs[0].name;
      if (activePlanName === PLAN_GROWTH) plan = "GROWTH";
      else if (activePlanName === PLAN_ENTERPRISE) plan = "ENTERPRISE";
    }

    await BillingDb.updateSubscription(shop, plan);
    return plan;
  },

  /**
   * Initiate upgrade flow
   */
  async upgrade(admin: AdminApiContext, billing: any, plan: SubscriptionPlan, returnUrl: string) {
    return BillingShopify.createSubscription(admin, billing, plan, returnUrl);
  },

  /**
   * Cancel active subscription (Downgrade to FREE)
   */
  async cancelSubscription(admin: AdminApiContext, shop: string) {
    const activeSubs = await BillingShopify.getSubscription(admin);
    if (activeSubs && activeSubs.length > 0) {
      await BillingShopify.cancelSubscription(admin, activeSubs[0].id);
    }
    await BillingDb.updateSubscription(shop, "FREE");
  },

  /**
   * Require a minimum plan or redirect
   */
  async requirePlan(shop: string, minPlan: SubscriptionPlan) {
    // Simple hierarchy check
    const hierarchy = ["FREE", "GROWTH", "ENTERPRISE"];
    const session = await BillingDb.getSession(shop);
    const currentPlan = (session?.plan as SubscriptionPlan) || "FREE";
    
    if (hierarchy.indexOf(currentPlan) < hierarchy.indexOf(minPlan)) {
      throw redirect("/app/billing");
    }
  },

  /**
   * Record a match event (usage tracking)
   */
  async recordMatch(shop: string) {
    await BillingDb.incrementMatchCount(shop);
  },

  /**
   * Check if a feature is allowed
   */
  async canUseFeature(shop: string, feature: keyof (typeof PLAN_CONFIGS)["FREE"]["features"]) {
    const session = await BillingDb.getSession(shop);
    const plan = (session?.plan as SubscriptionPlan) || "FREE";
    const features = PLAN_CONFIGS[plan].features;
    return features[feature];
  },

  /**
   * Check if usage limit is reached
   */
  async isUnderLimit(shop: string) {
    const session = await BillingDb.getSession(shop);
    if (!session) return false;

    const plan = (session.plan as SubscriptionPlan) || "FREE";
    const limits = PLAN_CONFIGS[plan];

    if (limits.maxMatches === 0) return true; // Unlimited
    return session.matchCount < limits.maxMatches;
  }
};
