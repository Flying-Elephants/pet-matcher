import { describe, it, expect, vi, beforeEach } from "vitest";
import { BillingService } from "../../app/modules/Billing";
import { BillingShopify } from "../../app/modules/Billing/internal/shopify";
import { BillingDb } from "../../app/modules/Billing/internal/db";
import { PLAN_CONFIGS } from "../../app/modules/Billing/core/types";

vi.mock("../../app/modules/Billing/internal/shopify", () => ({
  BillingShopify: {
    getSubscription: vi.fn(),
    createSubscription: vi.fn(),
  },
}));

vi.mock("../../app/modules/Billing/internal/db", () => ({
  BillingDb: {
    getSession: vi.fn(),
    updateSubscription: vi.fn(),
    incrementMatchCount: vi.fn(),
    resetMatchCount: vi.fn(),
  },
}));

describe("BillingService", () => {
  const shop = "test-shop.myshopify.com";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getSubscriptionStatus", () => {
    it("should return correct status for FREE plan", async () => {
      vi.mocked(BillingDb.getSession).mockResolvedValue({
        shop,
        plan: "FREE",
        matchCount: 10,
      } as any);

      const status = await BillingService.getSubscriptionStatus({} as any, shop);
      
      expect(status.plan).toBe("FREE");
      expect(status.usage).toBe(10);
      expect(status.limits).toEqual(PLAN_CONFIGS.FREE);
    });

    it("should throw error if session not found", async () => {
      vi.mocked(BillingDb.getSession).mockResolvedValue(null);
      await expect(BillingService.getSubscriptionStatus({} as any, shop)).rejects.toThrow("Session not found");
    });
  });

  describe("syncSubscription", () => {
    it("should sync GROWTH plan from Shopify", async () => {
      vi.mocked(BillingShopify.getSubscription).mockResolvedValue([{ name: "GROWTH", status: "ACTIVE" }] as any);
      
      const plan = await BillingService.syncSubscription({} as any, shop);
      
      expect(plan).toBe("GROWTH");
      expect(BillingDb.updateSubscription).toHaveBeenCalledWith(shop, "GROWTH");
    });

    it("should fallback to FREE if no active subscription", async () => {
      vi.mocked(BillingShopify.getSubscription).mockResolvedValue([]);
      
      const plan = await BillingService.syncSubscription({} as any, shop);
      
      expect(plan).toBe("FREE");
      expect(BillingDb.updateSubscription).toHaveBeenCalledWith(shop, "FREE");
    });
  });

  describe("Feature Gates", () => {
    it("should allow feature if plan has it", async () => {
      vi.mocked(BillingDb.getSession).mockResolvedValue({ plan: "GROWTH" } as any);
      const canUse = await BillingService.canUseFeature(shop, "klaviyoSync");
      expect(canUse).toBe(true);
    });

    it("should deny feature if plan doesn't have it", async () => {
      vi.mocked(BillingDb.getSession).mockResolvedValue({ plan: "FREE" } as any);
      const canUse = await BillingService.canUseFeature(shop, "klaviyoSync");
      expect(canUse).toBe(false);
    });

    it("should return false for isUnderLimit if limit is reached", async () => {
      vi.mocked(BillingDb.getSession).mockResolvedValue({ 
        plan: "FREE", 
        matchCount: 100
      } as any);
      
      const isUnder = await BillingService.isUnderLimit(shop);
      expect(isUnder).toBe(false);
    });

    it("should return true for isUnderLimit if limit not reached", async () => {
      vi.mocked(BillingDb.getSession).mockResolvedValue({ 
        plan: "FREE", 
        matchCount: 99
      } as any);
      
      const isUnder = await BillingService.isUnderLimit(shop);
      expect(isUnder).toBe(true);
    });

    it("should always return true for ENTERPRISE", async () => {
      vi.mocked(BillingDb.getSession).mockResolvedValue({ 
        plan: "ENTERPRISE", 
        matchCount: 9999 
      } as any);
      
      const isUnder = await BillingService.isUnderLimit(shop);
      expect(isUnder).toBe(true);
    });
  });
});
