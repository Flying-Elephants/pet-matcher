import { describe, it, expect, beforeEach, vi } from "vitest";
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

describe("ProductRuleService", () => {
  const shop = "test-shop.myshopify.com";

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(BillingService.getSubscriptionStatus).mockResolvedValue({
      plan: "FREE",
      usage: 0,
      limits: { maxRules: 5, maxMatches: 100 } as any,
    });
    vi.mocked(ProductRuleDb.count).mockResolvedValue(0);
  });

  it("should match products based on pet type", async () => {
    const mockRule = {
      id: "1",
      shop,
      name: "Dog Rule",
      isActive: true,
      conditions: { petTypes: ["Dog"], breeds: [] },
      productIds: ["gid://shopify/Product/1"],
      priority: 0,
    };

    vi.mocked(ProductRuleDb.findActive).mockResolvedValue([mockRule as any]);

    const pet = { type: "Dog", breed: "Golden Retriever" };
    const matches = await ProductRuleService.getMatchedProductsForPet(shop, pet);

    expect(matches).toContain("gid://shopify/Product/1");
  });

  it("should NOT match products if pet type differs", async () => {
    const mockRule = {
      id: "1",
      shop,
      name: "Dog Rule",
      isActive: true,
      conditions: { petTypes: ["Dog"], breeds: [] },
      productIds: ["gid://shopify/Product/1"],
      priority: 0,
    };

    vi.mocked(ProductRuleDb.findActive).mockResolvedValue([mockRule as any]);

    const pet = { type: "Cat", breed: "Siamese" };
    const matches = await ProductRuleService.getMatchedProductsForPet(shop, pet);

    expect(matches).toHaveLength(0);
  });

  it("should match products based on breed", async () => {
    const mockRule = {
      id: "3",
      shop,
      name: "Golden Retriever Rule",
      isActive: true,
      conditions: { petTypes: ["Dog"], breeds: ["Golden Retriever"] },
      productIds: ["gid://shopify/Product/3"],
      priority: 0,
    };

    vi.mocked(ProductRuleDb.findActive).mockResolvedValue([mockRule as any]);

    const pet = { type: "Dog", breed: "Golden Retriever" };
    const matches = await ProductRuleService.getMatchedProductsForPet(shop, pet);

    expect(matches).toContain("gid://shopify/Product/3");
  });

  it("should NOT match if breed differs even if type matches", async () => {
    const mockRule = {
      id: "3",
      shop,
      name: "Golden Retriever Rule",
      isActive: true,
      conditions: { petTypes: ["Dog"], breeds: ["Golden Retriever"] },
      productIds: ["gid://shopify/Product/3"],
      priority: 0,
    };

    vi.mocked(ProductRuleDb.findActive).mockResolvedValue([mockRule as any]);

    const pet = { type: "Dog", breed: "Labrador" };
    const matches = await ProductRuleService.getMatchedProductsForPet(shop, pet);

    expect(matches).not.toContain("gid://shopify/Product/3");
  });

  describe("upsertRule", () => {
    it("should allow creating a rule with a unique name", async () => {
      vi.mocked(ProductRuleDb.findByName).mockResolvedValue(null);
      vi.mocked(ProductRuleDb.upsert).mockResolvedValue({ id: "new" } as any);

      await ProductRuleService.upsertRule(shop, { name: "Unique Name", productIds: ["p1"] });

      expect(ProductRuleDb.findByName).toHaveBeenCalledWith(shop, "Unique Name");
      expect(ProductRuleDb.upsert).toHaveBeenCalled();
    });

    it("should throw error if name is empty", async () => {
      await expect(ProductRuleService.upsertRule(shop, { name: "", productIds: ["p1"] }))
        .rejects.toThrow("Rule name is required.");
    });

    it("should throw error if product selection is empty", async () => {
      await expect(ProductRuleService.upsertRule(shop, { name: "Valid Name", productIds: [] }))
        .rejects.toThrow("At least one product must be selected.");
    });

    it("should throw error if name already exists for a different rule", async () => {
      vi.mocked(ProductRuleDb.findByName).mockResolvedValue({ id: "existing-id", name: "Duplicate" } as any);

      await expect(ProductRuleService.upsertRule(shop, { name: "Duplicate", id: "new-id", productIds: ["p1"] }))
        .rejects.toThrow('A rule with the name "Duplicate" already exists.');
    });

    it("should allow updating a rule with its own name", async () => {
      vi.mocked(ProductRuleDb.findByName).mockResolvedValue({ id: "same-id", name: "My Rule" } as any);
      vi.mocked(ProductRuleDb.upsert).mockResolvedValue({ id: "same-id" } as any);

      await ProductRuleService.upsertRule(shop, { id: "same-id", name: "My Rule", productIds: ["p1"] });

      expect(ProductRuleDb.upsert).toHaveBeenCalled();
    });
  });
});
