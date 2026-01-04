import { describe, it, expect, beforeEach, vi } from "vitest";
import { ProductRuleService } from "../../app/modules/ProductRules";
import { ProductRuleDb } from "../../app/modules/ProductRules/internal/db";

vi.mock("../../app/modules/ProductRules/internal/db", () => ({
  ProductRuleDb: {
    findMany: vi.fn(),
    findActive: vi.fn(),
    findOne: vi.fn(),
    upsert: vi.fn(),
    delete: vi.fn(),
  },
}));

describe("ProductRuleService", () => {
  const shop = "test-shop.myshopify.com";

  beforeEach(() => {
    vi.clearAllMocks();
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
});
