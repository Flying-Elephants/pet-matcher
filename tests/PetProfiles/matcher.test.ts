import { describe, it, expect, vi, beforeEach } from "vitest";
import { MatcherService } from "../../app/modules/PetProfiles/internal/matcher";
import { BillingService } from "../../app/modules/Billing";
import { AnalyticsService } from "../../app/modules/Analytics";

vi.mock("../../app/modules/Billing", () => ({
  BillingService: {
    isUnderLimit: vi.fn(),
    recordMatch: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock("../../app/modules/Analytics", () => ({
  AnalyticsService: {
    recordMatch: vi.fn().mockResolvedValue(undefined),
  },
}));

describe("MatcherService", () => {
  const shop = "test-shop.myshopify.com";
  const mockRules = [
    {
      id: "rule1",
      priority: 1,
      isActive: true,
      conditions: { breed: ["Golden Retriever"] },
      productIds: ["prod1"],
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(BillingService.isUnderLimit).mockResolvedValue(true);
  });

  it("should match profile to products", async () => {
    const profile = { id: "p1", shop, breed: "Golden Retriever" };
    const matches = await MatcherService.match(profile as any, mockRules as any);
    expect(matches).toContain("prod1");
    expect(BillingService.recordMatch).toHaveBeenCalledWith(shop);
  });

  it("should not match if conditions do not meet", async () => {
    const profile = { id: "p1", shop, breed: "Labrador" };
    const matches = await MatcherService.match(profile as any, mockRules as any);
    expect(matches).toHaveLength(0);
  });

  it("should handle multiple rules with priority", async () => {
    const multiRules = [
        { id: "rule1", priority: 1, isActive: true, conditions: { breed: ["Golden Retriever"] }, productIds: ["prod1"] },
        { id: "rule2", priority: 10, isActive: true, conditions: { breed: ["Golden Retriever"] }, productIds: ["prod2"] }
    ];
    const profile = { id: "p1", shop, breed: "Golden Retriever" };
    const matches = await MatcherService.match(profile as any, multiRules as any);
    expect(matches).toContain("prod1");
    expect(matches).toContain("prod2");
  });

  it("should ignore inactive rules", async () => {
      const inactiveRule = { id: "rule3", priority: 1, isActive: false, conditions: { breed: ["Golden Retriever"] }, productIds: ["prod3"] };
      const profile = { id: "p1", shop, breed: "Golden Retriever" };
      const matches = await MatcherService.match(profile as any, [inactiveRule] as any);
      expect(matches).toHaveLength(0);
  });

  describe("isProductMatched fallback", () => {
    it("should return isMatched: true if product has no rules", async () => {
      const profile = { id: "pet1", shop, breed: "Labrador" };
      const result = await MatcherService.isProductMatched(profile as any, [] as any, "untargeted-prod");
      expect(result.isMatched).toBe(true);
    });

    it("should return isMatched: true if product only has inactive rules", async () => {
      const profile = { id: "pet1", shop, breed: "Labrador" };
      const rules = [{ id: "rule1", isActive: false, productIds: ["prod1"], conditions: { breeds: ["Golden Retriever"] } }];
      const result = await MatcherService.isProductMatched(profile as any, rules as any, "prod1");
      expect(result.isMatched).toBe(true);
    });

    it("should return isMatched: false if product has active rule but profile doesn't match", async () => {
      const profile = { id: "pet1", shop, breed: "Labrador" };
      const rules = [{ id: "rule1", isActive: true, productIds: ["prod1"], conditions: { breeds: ["Golden Retriever"] } }];
      const result = await MatcherService.isProductMatched(profile as any, rules as any, "prod1");
      expect(result.isMatched).toBe(false);
    });

    it("should return MISSING_WEIGHT warning if rule has weight but profile doesn't", async () => {
      const profile = { id: "pet1", shop, breed: "Labrador", weightGram: null };
      const rules = [{ 
        id: "rule1", 
        isActive: true, 
        productIds: ["prod1"], 
        conditions: { 
          weightRange: { min: 1000, max: 5000 } 
        } 
      }];
      const result = await MatcherService.isProductMatched(profile as any, rules as any, "prod1");
      expect(result.isMatched).toBe(false);
      expect(result.warnings).toContain("MISSING_WEIGHT");
    });
  });
});
