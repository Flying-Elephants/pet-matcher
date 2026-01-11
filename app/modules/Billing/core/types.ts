import { z } from "zod";

export const SubscriptionPlanSchema = z.enum(["FREE", "GROWTH", "ENTERPRISE"]);
export type SubscriptionPlan = z.infer<typeof SubscriptionPlanSchema>;

export interface PlanLimits {
  maxMatches: number; // 0 for unlimited
  maxRules: number;
  features: {
    klaviyoSync: boolean;
    advancedAnalytics: boolean;
    prioritySupport: boolean;
  };
}

export const PLAN_CONFIGS: Record<SubscriptionPlan, PlanLimits> = {
  FREE: {
    maxMatches: 100,
    maxRules: 5,
    features: {
      klaviyoSync: false,
      advancedAnalytics: false,
      prioritySupport: false,
    },
  },
  GROWTH: {
    maxMatches: 0,
    maxRules: 25,
    features: {
      klaviyoSync: true,
      advancedAnalytics: true,
      prioritySupport: false,
    },
  },
  ENTERPRISE: {
    maxMatches: 0,
    maxRules: 100,
    features: {
      klaviyoSync: true,
      advancedAnalytics: true,
      prioritySupport: true,
    },
  },
};
