import { describe, it, expect, beforeEach } from "vitest";
import { AnalyticsDb } from "../../app/modules/Analytics/internal/db";
import db from "../../app/db.server";

describe("AnalyticsDb Integration", () => {
  const shop = "test-analytics-shop.myshopify.com";

  beforeEach(async () => {
    // Clean up before each test
    await db.petProfile.deleteMany({ where: { shop } });
    await db.productRule.deleteMany({ where: { shop } });
    await db.syncedProduct.deleteMany({ where: { shop } });
    await db.matchEvent.deleteMany({ where: { shop } });
  });

  it("should calculate correct summary counts", async () => {
    // 1. Setup Pet Profiles
    await db.petProfile.createMany({
      data: [
        { id: "p1", shop, shopifyId: "c1", name: "Buddy", breed: "Golden", type: "Dog", attributes: "{}" },
        { id: "p2", shop, shopifyId: "c2", name: "Max", breed: "Beagle", type: "Dog", attributes: "{}" },
      ],
    });

    // 2. Setup Product Rules (1 active, 1 inactive)
    await db.productRule.createMany({
      data: [
        { id: "r1", shop, name: "Rule 1", isActive: true, conditions: "{}", productIds: "[]", priority: 0 },
        { id: "r2", shop, name: "Rule 2", isActive: false, conditions: "{}", productIds: "[]", priority: 0 },
      ],
    });

    // 3. Setup Synced Products
    await db.syncedProduct.createMany({
      data: [
        { id: "prod1", shop, title: "Dog Food" },
        { id: "prod2", shop, title: "Cat Toy" },
        { id: "prod3", shop, title: "Bird Cage" },
      ],
    });

    // 4. Setup Match Events
    await db.matchEvent.createMany({
      data: [
        { id: "m1", shop, profileId: "p1", ruleId: "r1" },
        { id: "m2", shop, profileId: "p2", ruleId: "r1" },
      ]
    });

    // Execute
    const summary = await AnalyticsDb.getSummary(shop);

    // Verify
    expect(summary.totalMatches).toBe(2);
    expect(summary.activeRules).toBe(1);
    expect(summary.syncedProductsCount).toBe(3);
    expect(summary.totalPetProfiles).toBe(2);
  });

  it("should return zeros for a shop with no data", async () => {
    const summary = await AnalyticsDb.getSummary("empty-shop.myshopify.com");
    
    expect(summary.totalMatches).toBe(0);
    expect(summary.activeRules).toBe(0);
    expect(summary.syncedProductsCount).toBe(0);
  });
});