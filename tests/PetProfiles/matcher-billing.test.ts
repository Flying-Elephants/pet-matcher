import { describe, it, expect, vi, beforeEach } from "vitest";
import { MatcherService } from "../../app/modules/PetProfiles/internal/matcher";
import { BillingService } from "../../app/modules/Billing";
import { AnalyticsService } from "../../app/modules/Analytics";

vi.mock("../../app/modules/Billing", () => ({
  BillingService: {
    isUnderLimit: vi.fn(),
    recordMatch: vi.fn().mockResolvedValue({}),
  },
}));

vi.mock("../../app/modules/Analytics", () => ({
  AnalyticsService: {
    recordMatch: vi.fn().mockResolvedValue({}),
  },
}));

describe("MatcherService Billing Gating", () => {
  const profile = { id: "pet_1", shop: "test.myshopify.com", type: "Dog", breed: "Golden", weightGram: 1000 } as any;
  const rules = [
    { id: "rule_1", isActive: true, productIds: ["prod_1"], conditions: { petTypes: ["Dog"], breeds: [] } }
  ] as any;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should block matching if over limit", async () => {
    vi.mocked(BillingService.isUnderLimit).mockResolvedValue(false);

    const result = await MatcherService.match(profile, rules);
    
    expect(result).toEqual([]);
    expect(BillingService.recordMatch).not.toHaveBeenCalled();
  });

  it("should allow matching and record usage if under limit", async () => {
    vi.mocked(BillingService.isUnderLimit).mockResolvedValue(true);

    const result = await MatcherService.match(profile, rules);
    
    expect(result).toEqual(["prod_1"]);
    expect(BillingService.recordMatch).toHaveBeenCalledWith(profile.shop);
  });

  it("should return BILLING_LIMIT_REACHED in isProductMatched when over limit", async () => {
    vi.mocked(BillingService.isUnderLimit).mockResolvedValue(false);

    const result = await MatcherService.isProductMatched(profile, rules, "prod_1");
    
    expect(result.isMatched).toBe(false);
    expect(result.warnings).toContain("BILLING_LIMIT_REACHED");
  });
});
