import { describe, it, expect, vi } from "vitest";
import { ProductRuleService } from "../../app/modules/ProductRules";
import { ProductRuleDb } from "../../app/modules/ProductRules/internal/db";

vi.mock("../../app/modules/ProductRules/internal/db", () => ({
  ProductRuleDb: {
    findMany: vi.fn(),
  },
}));

describe("ProductRuleService", () => {
  it("should get rules for a shop", async () => {
    const mockRules = [{ id: "1", name: "Rule 1" }];
    vi.mocked(ProductRuleDb.findMany).mockResolvedValue(mockRules as any);

    const result = await ProductRuleService.getRules("test.myshopify.com");
    expect(result).toEqual(mockRules);
  });
});
