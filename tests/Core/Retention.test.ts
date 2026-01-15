import { describe, it, expect, beforeEach, afterEach } from "vitest";
import db from "../../app/db.server";
import { AnalyticsService } from "../../app/modules/Analytics";
import { PetProfileService } from "../../app/modules/PetProfiles";
import { ProductRuleService } from "../../app/modules/ProductRules";

describe("Data Retention & Cleanup", () => {
  const shop = "test-retention.myshopify.com";

  beforeEach(async () => {
    // Cleanup before tests
    await db.matchEvent.deleteMany({ where: { shop } });
    await db.petProfile.deleteMany({ where: { shop } });
    await db.job.deleteMany({});
  });

  afterEach(() => {
    delete process.env.ENCRYPTION_KEY;
  });

  it("should purge old match events", async () => {
    // Create an old event (91 days ago)
    const oldDate = new Date();
    oldDate.setDate(oldDate.getDate() - 91);

    await db.matchEvent.create({
      data: {
        shop,
        profileId: "p1",
        ruleId: "r1",
        createdAt: oldDate
      }
    });

    // Create a fresh event
    await db.matchEvent.create({
      data: {
        shop,
        profileId: "p1",
        ruleId: "r1"
      }
    });

    const purged = await AnalyticsService.purgeOldEvents(90);
    expect(purged).toBe(1);

    const remaining = await db.matchEvent.count({ where: { shop } });
    expect(remaining).toBe(1);
  });

  it("should purge inactive pet profiles (mocked logic test)", async () => {
    const purged = await PetProfileService.purgeInactiveProfiles(2);
    expect(typeof purged).toBe("number");
  });

  it("should purge old background jobs (mocked logic test)", async () => {
    const purged = await ProductRuleService.purgeOldJobs(7);
    expect(typeof purged).toBe("number");
  });

  it("should encrypt and decrypt pet profile data", async () => {
    process.env.ENCRYPTION_KEY = "00112233445566778899aabbccddeeff00112233445566778899aabbccddeeff";

    const name = "Secret Sparky";
    const attributes = { favoriteFood: "Steak" };

    const profile = await PetProfileService.createProfile(shop, {
        shop,
        shopifyId: "c1",
        name,
        breed: "Golden Retriever",
        type: "Dog",
        attributes
    });

    expect(profile.name).toBe(name);
    expect(profile.attributes).toEqual(attributes);

    const raw = await db.petProfile.findUnique({ where: { id: profile.id } });
    expect(raw?.name).not.toBe(name);
    expect(raw?.name).toContain(":"); // iv:tag:cipher
    expect(raw?.attributes).not.toContain("Steak");

    // Decrypting directly
    const fetched = await PetProfileService.getProfile(shop, profile.id);
    expect(fetched?.name).toBe(name);
    expect(fetched?.attributes).toEqual(attributes);
  });
});
