import { describe, it, expect, vi, beforeEach } from "vitest";
import { ProductRuleService } from "../../app/modules/ProductRules";
import { ProductRuleDb } from "../../app/modules/ProductRules/internal/db";
import { BillingService } from "../../app/modules/Billing";

vi.mock("../../app/modules/Billing", () => ({
  BillingService: {
    getSubscriptionStatus: vi.fn(),
  },
}));

vi.mock("../../app/modules/ProductRules/internal/db", () => ({
  ProductRuleDb: {
    count: vi.fn(),
    findByName: vi.fn(),
    upsert: vi.fn(),
  },
}));

describe("ProductRuleService Billing Gating", () => {
  const shop = "test.myshopify.com";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should block rule creation if maxRules limit is reached", async () => {
    vi.mocked(BillingService.getSubscriptionStatus).mockResolvedValue({
      plan: "FREE",
      limits: { maxRules: 5 }
    } as any);

    vi.mocked(ProductRuleDb.count).mockResolvedValue(5);

    await expect(ProductRuleService.upsertRule(shop, { name: "New Rule", productIds: ["1"] }))
      .rejects.toThrow("Your FREE plan is limited to 5 rules");
  });

  it("should allow rule creation if under limit", async () => {
    vi.mocked(BillingService.getSubscriptionStatus).mockResolvedValue({
      plan: "FREE",
      limits: { maxRules: 5 }
    } as any);

    vi.mocked(ProductRuleDb.count).mockResolvedValue(4);
    vi.mocked(ProductRuleDb.findByName).mockResolvedValue(null);
    vi.mocked(ProductRuleDb.upsert).mockResolvedValue({ id: "rule_new" } as any);

    const result = await ProductRuleService.upsertRule(shop, { name: "New Rule", productIds: ["1"] });
    expect(result.id).toBe("rule_new");
  });

  it("should allow editing existing rule even if at limit", async () => {
    vi.mocked(BillingService.getSubscriptionStatus).mockResolvedValue({
      plan: "FREE",
      limits: { maxRules: 5 }
    } as any);

    vi.mocked(ProductRuleDb.count).mockResolvedValue(5);
    vi.mocked(ProductRuleDb.findByName).mockResolvedValue(null);
    vi.mocked(ProductRuleDb.upsert).mockResolvedValue({ id: "rule_1" } as any);

    const result = await ProductRuleService.upsertRule(shop, { id: "rule_1", name: "Existing Rule", productIds: ["1"] });
    expect(result.id).toBe("rule_1");
  });
});
