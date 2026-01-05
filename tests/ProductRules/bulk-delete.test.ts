import { describe, it, expect, vi, beforeEach } from "vitest";
import { ProductRuleService } from "../../app/modules/ProductRules";
import { ProductRuleDb } from "../../app/modules/ProductRules/internal/db";

vi.mock("../../app/modules/ProductRules/internal/db", () => ({
  ProductRuleDb: {
    deleteMany: vi.fn(),
    findMany: vi.fn(),
    count: vi.fn(),
  },
}));

describe("ProductRuleService Bulk Deletion", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should call ProductRuleDb.deleteMany with correct parameters", async () => {
    const shop = "test-shop.myshopify.com";
    const ids = ["1", "2", "3"];

    await ProductRuleService.deleteManyRules(shop, ids);

    expect(ProductRuleDb.deleteMany).toHaveBeenCalledWith(shop, ids);
  });

  it("should support paginated results in getRules", async () => {
    const shop = "test-shop.myshopify.com";
    const mockRules = [{ id: "1", name: "Rule 1" }] as any;
    
    vi.mocked(ProductRuleDb.findMany).mockResolvedValue(mockRules);
    vi.mocked(ProductRuleDb.count).mockResolvedValue(10);

    const result = await ProductRuleService.getRules(shop, { page: 2, limit: 5 });

    expect(ProductRuleDb.findMany).toHaveBeenCalledWith(shop, { skip: 5, take: 5 });
    expect(ProductRuleDb.count).toHaveBeenCalledWith(shop);
    expect(result.rules).toEqual(mockRules);
    expect(result.totalCount).toBe(10);
  });
});
