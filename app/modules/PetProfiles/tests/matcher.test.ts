import { describe, it, expect, vi } from "vitest";
import { MatcherService } from "../internal/matcher";
import type { PetProfile } from "../index";
import type { ProductRule } from "../../ProductRules";

describe("MatcherService", () => {
  const mockProfile: PetProfile = {
    id: "1",
    shop: "test.myshopify.com",
    shopifyId: "gid://shopify/Customer/1",
    name: "Buddy",
    breed: "Labrador",
    attributes: { energy_level: "High" },
    birthday: null
  };

  const mockRules: ProductRule[] = [
    {
      id: "rule-1",
      shop: "test.myshopify.com",
      name: "Labrador Rule",
      priority: 10,
      isActive: true,
      conditions: { breed: ["Labrador"] },
      productIds: ["prod-1"]
    },
    {
      id: "rule-2",
      shop: "test.myshopify.com",
      name: "Generic Rule",
      priority: 1,
      isActive: true,
      conditions: {},
      productIds: ["prod-2"]
    }
  ];

  it("should match based on breed", async () => {
    const result = await MatcherService.match(mockProfile, mockRules);
    expect(result).toContain("prod-1");
    expect(result).toContain("prod-2");
  });

  it("should respect rule priority", async () => {
    // Both rules match, results should include both but we verify priority sorts them in evaluation
    const result = await MatcherService.match(mockProfile, mockRules);
    expect(result[0]).toBe("prod-1"); // Higher priority rule first
  });

  it("should ignore inactive rules", async () => {
    const inactiveRules = [{ ...mockRules[0], isActive: false }];
    const result = await MatcherService.match(mockProfile, inactiveRules);
    expect(result).not.toContain("prod-1");
  });

  it("should apply smart logic for breed-specific commercial triggers", async () => {
    const goldenRetriever: PetProfile = {
        ...mockProfile,
        breed: "Golden Retriever"
    };
    
    const energyRule: ProductRule = {
        id: "rule-3",
        shop: "test.myshopify.com",
        name: "High Energy Rule",
        priority: 5,
        isActive: true,
        conditions: { energy_level: "High" },
        productIds: ["prod-3"]
    };

    const result = await MatcherService.match(goldenRetriever, [energyRule]);
    expect(result).toContain("prod-3");
  });
});
