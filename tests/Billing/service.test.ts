import { describe, it, expect, vi, beforeEach } from "vitest";
import { BillingService } from "../../app/modules/Billing";
import { BillingShopify } from "../../app/modules/Billing/internal/shopify";
import { BillingDb } from "../../app/modules/Billing/internal/db";
import { PLAN_CONFIGS } from "../../app/modules/Billing/core/types";

// Mock shopify.server.ts to avoid initialization errors
vi.mock("../../app/shopify.server", () => ({
  PLAN_GROWTH: "Growth Plan",
  PLAN_ENTERPRISE: "Enterprise Plan",
  authenticate: {
    admin: vi.fn(),
    webhook: vi.fn(),
  },
}));

vi.mock("../../app/modules/Billing/internal/shopify", () => ({
  BillingShopify: {
    getSubscription: vi.fn(),
    createSubscription: vi.fn(),
    cancelSubscription: vi.fn(),
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
    it("should sync GROWTH plan from Shopify (Growth Plan -> GROWTH)", async () => {
      vi.mocked(BillingShopify.getSubscription).mockResolvedValue([{ name: "Growth Plan", status: "ACTIVE" }] as any);
      
      const plan = await BillingService.syncSubscription({} as any, shop);
      
      expect(plan).toBe("GROWTH");
      expect(BillingDb.updateSubscription).toHaveBeenCalledWith(shop, "GROWTH");
    });

    it("should sync ENTERPRISE plan from Shopify (Enterprise Plan -> ENTERPRISE)", async () => {
      vi.mocked(BillingShopify.getSubscription).mockResolvedValue([{ name: "Enterprise Plan", status: "ACTIVE" }] as any);
      
      const plan = await BillingService.syncSubscription({} as any, shop);
      
      expect(plan).toBe("ENTERPRISE");
      expect(BillingDb.updateSubscription).toHaveBeenCalledWith(shop, "ENTERPRISE");
    });

    it("should fallback to FREE if no active subscription", async () => {
      vi.mocked(BillingShopify.getSubscription).mockResolvedValue([]);
      
      const plan = await BillingService.syncSubscription({} as any, shop);
      
      expect(plan).toBe("FREE");
      expect(BillingDb.updateSubscription).toHaveBeenCalledWith(shop, "FREE");
    });
    
    it("should fallback to FREE if plan name is unknown", async () => {
      vi.mocked(BillingShopify.getSubscription).mockResolvedValue([{ name: "Unknown Plan", status: "ACTIVE" }] as any);
      
      const plan = await BillingService.syncSubscription({} as any, shop);
      
      expect(plan).toBe("FREE");
      expect(BillingDb.updateSubscription).toHaveBeenCalledWith(shop, "FREE");
    });
  });

  describe("cancelSubscription", () => {
    it("should cancel active subscription and set to FREE", async () => {
      vi.mocked(BillingShopify.getSubscription).mockResolvedValue([{ id: "sub_123", name: "Growth Plan" }] as any);
      
      await BillingService.cancelSubscription({} as any, shop);
      
      expect(BillingShopify.cancelSubscription).toHaveBeenCalledWith(expect.anything(), "sub_123");
      expect(BillingDb.updateSubscription).toHaveBeenCalledWith(shop, "FREE");
    });

    it("should just set to FREE if no active subscription found", async () => {
      vi.mocked(BillingShopify.getSubscription).mockResolvedValue([]);
      
      await BillingService.cancelSubscription({} as any, shop);
      
      expect(BillingShopify.cancelSubscription).not.toHaveBeenCalled();
      expect(BillingDb.updateSubscription).toHaveBeenCalledWith(shop, "FREE");
    });
  });

  describe("Feature Gates & Limits", () => {
    it("should allow feature if plan has it (Growth has Klaviyo)", async () => {
      vi.mocked(BillingDb.getSession).mockResolvedValue({ plan: "GROWTH" } as any);
      const canUse = await BillingService.canUseFeature(shop, "klaviyoSync");
      expect(canUse).toBe(true);
    });

    it("should deny feature if plan doesn't have it (Free has no Klaviyo)", async () => {
      vi.mocked(BillingDb.getSession).mockResolvedValue({ plan: "FREE" } as any);
      const canUse = await BillingService.canUseFeature(shop, "klaviyoSync");
      expect(canUse).toBe(false);
    });

    it("should check isUnderLimit for FREE (Max 50)", async () => {
      vi.mocked(BillingDb.getSession).mockResolvedValue({ 
        plan: "FREE", 
        matchCount: 49
      } as any);
      
      const isUnder = await BillingService.isUnderLimit(shop);
      expect(isUnder).toBe(true);
      
      vi.mocked(BillingDb.getSession).mockResolvedValue({ 
        plan: "FREE", 
        matchCount: 50
      } as any);
      const isUnderBoundary = await BillingService.isUnderLimit(shop);
      expect(isUnderBoundary).toBe(false);
    });

    it("should check isUnderLimit for GROWTH (Max 500)", async () => {
      vi.mocked(BillingDb.getSession).mockResolvedValue({ 
        plan: "GROWTH", 
        matchCount: 499
      } as any);
      expect(await BillingService.isUnderLimit(shop)).toBe(true);
      
      vi.mocked(BillingDb.getSession).mockResolvedValue({ 
        plan: "GROWTH", 
        matchCount: 500
      } as any);
      expect(await BillingService.isUnderLimit(shop)).toBe(false);
    });

    it("should always return true for ENTERPRISE (Unlimited)", async () => {
      vi.mocked(BillingDb.getSession).mockResolvedValue({ 
        plan: "ENTERPRISE", 
        matchCount: 99999
      } as any);
      
      const isUnder = await BillingService.isUnderLimit(shop);
      expect(isUnder).toBe(true);
    });
  });
});
