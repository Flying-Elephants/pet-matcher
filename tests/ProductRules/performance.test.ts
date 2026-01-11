import { describe, it, expect, vi, beforeEach } from "vitest";
import { ProductRuleService } from "../../app/modules/ProductRules";
import { ProductRuleDb } from "../../app/modules/ProductRules/internal/db";
import { BillingService } from "../../app/modules/Billing";

vi.mock("../../app/modules/ProductRules/internal/db", () => ({
  ProductRuleDb: {
    findMany: vi.fn(),
    findActive: vi.fn(),
    findOne: vi.fn(),
    findByName: vi.fn(),
    upsert: vi.fn(),
    delete: vi.fn(),
    count: vi.fn(),
  },
}));

vi.mock("../../app/modules/Billing", () => ({
  BillingService: {
    getSubscriptionStatus: vi.fn(),
  },
}));

describe("ProductRuleService - Performance Constraints", () => {
  const shop = "performance-test-shop.myshopify.com";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should enforce the 'Rule of 100' (max 100 rules for Enterprise)", async () => {
    // Enterprise plan allows 100 rules
    vi.mocked(BillingService.getSubscriptionStatus).mockResolvedValue({
      plan: "ENTERPRISE",
      usage: 0,
      limits: { maxRules: 100, maxMatches: 0 } as any,
    });
    
    // Simulate already having 100 rules
    vi.mocked(ProductRuleDb.count).mockResolvedValue(100);

    await expect(ProductRuleService.upsertRule(shop, { name: "101st Rule", productIds: ["p1"] }))
      .rejects.toThrow(/limited to 100 rules/);
  });

  it("should allow editing an existing rule even if at the limit", async () => {
    vi.mocked(BillingService.getSubscriptionStatus).mockResolvedValue({
      plan: "FREE",
      usage: 0,
      limits: { maxRules: 5, maxMatches: 100 } as any,
    });
    
    vi.mocked(ProductRuleDb.count).mockResolvedValue(5);
    vi.mocked(ProductRuleDb.findByName).mockResolvedValue(null);
    vi.mocked(ProductRuleDb.upsert).mockResolvedValue({ id: "rule-5" } as any);

    // Editing rule with ID "rule-5" should be allowed even though count is 5
    const result = await ProductRuleService.upsertRule(shop, { id: "rule-5", name: "Rule 5 Updated", productIds: ["p1"] });
    expect(result.id).toBe("rule-5");
    expect(ProductRuleDb.upsert).toHaveBeenCalled();
  });
});
