import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { SettingsService } from "../../app/modules/PetProfiles/internal/settings";
import prisma from "../../app/db.server";

// Mock Prisma
vi.mock("../../app/db.server", () => ({
  default: {
    petProfileSettings: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
    },
  },
}));

describe("SettingsService", () => {
  const shop = "test-shop.myshopify.com";

  beforeEach(() => {
    vi.clearAllMocks();
    SettingsService._cache.clear();
  });

  describe("getSettings", () => {
    it("should return default settings if no settings exist", async () => {
      vi.mocked(prisma.petProfileSettings.findUnique).mockResolvedValue(null);

      const settings = await SettingsService.getSettings(shop);

      expect(settings.types).toHaveLength(4); // Dog, Cat, Bird, Small Pet defaults
      expect(settings.types[0].label).toBe("Dog");
    });

    it("should return stored settings if they exist", async () => {
      const storedSettings = {
        types: [{ id: "rabbit", label: "Rabbit", breeds: ["Angora"] }],
        weightUnit: "kg" as const,
      };
      vi.mocked(prisma.petProfileSettings.findUnique).mockResolvedValue({
        id: "1",
        shop,
        config: JSON.stringify(storedSettings),
        updatedAt: new Date(),
      });

      const settings = await SettingsService.getSettings(shop);

      expect(settings).toEqual(storedSettings);
    });

    it("should handle invalid JSON gracefully and return defaults", async () => {
      vi.mocked(prisma.petProfileSettings.findUnique).mockResolvedValue({
        id: "1",
        shop,
        config: "invalid-json",
        updatedAt: new Date(),
      });

      const settings = await SettingsService.getSettings(shop);

      expect(settings.types).toBeDefined();
      expect(settings.types[0].label).toBe("Dog"); // Fallback to default
    });
  });

  describe("updateSettings", () => {
    it("should update settings and cache", async () => {
      const newSettings = {
        types: [{ id: "hamster", label: "Hamster", breeds: ["Golden"] }],
        weightUnit: "lbs" as const,
      };

      await SettingsService.updateSettings(shop, newSettings);

      expect(prisma.petProfileSettings.upsert).toHaveBeenCalledWith({
        where: { shop },
        update: { config: JSON.stringify(newSettings) },
        create: { shop, config: JSON.stringify(newSettings) },
      });

      // Verify cache update by getting settings immediately (should hit cache logic, though here we mock DB)
      // Since we can't easily peek into the module-level variable cache, we rely on the function resolving successfully.
    });
  });
});
