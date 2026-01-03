import { describe, it, expect, vi } from "vitest";
import { ProductRuleService } from "../index";
import { ProductRuleDb } from "../internal/db";

vi.mock("../internal/db", () => ({
  ProductRuleDb: {
    findMany: vi.fn(),
  },
}));

describe("ProductRuleService", () => {
  it("should return rules for a shop", async () => {
    const mockRules = [
      { id: "1", shop: "test.myshopify.com", name: "Puppy Rule", priority: 1, conditions: {}, productIds: [], isActive: true },
    ];
    vi.mocked(ProductRuleDb.findMany).mockResolvedValue(mockRules);

    const result = await ProductRuleService.getRules("test.myshopify.com");
    expect(result).toEqual(mockRules);
    expect(ProductRuleDb.findMany).toHaveBeenCalledWith("test.myshopify.com");
  });
});
