import { describe, it, expect } from "vitest";
import { MatcherService } from "../../app/modules/PetProfiles/internal/matcher";

describe("MatcherService", () => {
  const mockRules = [
    {
      id: "rule1",
      priority: 1,
      isActive: true,
      conditions: { breed: ["Golden Retriever"] },
      productIds: ["prod1"],
    },
  ];

  it("should match profile to products", async () => {
    const profile = { breed: "Golden Retriever" };
    const matches = await MatcherService.match(profile as any, mockRules as any);
    expect(matches).toContain("prod1");
  });

  it("should not match if conditions do not meet", async () => {
    const profile = { breed: "Labrador" };
    const matches = await MatcherService.match(profile as any, mockRules as any);
    expect(matches).toHaveLength(0);
  });

  it("should handle multiple rules with priority", async () => {
    const multiRules = [
        { id: "rule1", priority: 1, isActive: true, conditions: { breed: ["Golden Retriever"] }, productIds: ["prod1"] },
        { id: "rule2", priority: 10, isActive: true, conditions: { breed: ["Golden Retriever"] }, productIds: ["prod2"] }
    ];
    const profile = { breed: "Golden Retriever" };
    const matches = await MatcherService.match(profile as any, multiRules as any);
    // Should contain both, but we could check ordering if the implementation cared about order (it uses a Set then Array.from)
    expect(matches).toContain("prod1");
    expect(matches).toContain("prod2");
  });

  it("should ignore inactive rules", async () => {
      const inactiveRule = { id: "rule3", priority: 1, isActive: false, conditions: { breed: ["Golden Retriever"] }, productIds: ["prod3"] };
      const profile = { breed: "Golden Retriever" };
      const matches = await MatcherService.match(profile as any, [inactiveRule] as any);
      expect(matches).toHaveLength(0);
  });

  describe("isProductMatched fallback", () => {
    it("should return true if product has no rules", async () => {
      const profile = { breed: "Labrador" };
      const isMatched = await MatcherService.isProductMatched(profile as any, [] as any, "untargeted-prod");
      expect(isMatched).toBe(true);
    });

    it("should return true if product only has inactive rules", async () => {
      const profile = { breed: "Labrador" };
      const rules = [{ id: "rule1", isActive: false, productIds: ["prod1"], conditions: { breed: ["Golden Retriever"] } }];
      const isMatched = await MatcherService.isProductMatched(profile as any, rules as any, "prod1");
      expect(isMatched).toBe(true);
    });

    it("should return false if product has active rule but profile doesn't match", async () => {
      const profile = { breed: "Labrador" };
      const rules = [{ id: "rule1", isActive: true, productIds: ["prod1"], conditions: { breed: ["Golden Retriever"] } }];
      const isMatched = await MatcherService.isProductMatched(profile as any, rules as any, "prod1");
      expect(isMatched).toBe(false);
    });
  });
});
