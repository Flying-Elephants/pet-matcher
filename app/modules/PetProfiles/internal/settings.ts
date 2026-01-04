import prisma from "../../../db.server";
import { PetSettings, PetTypeConfig } from "../core/types";

// Simple in-memory cache
// Map<shop, { settings: PetSettings, timestamp: number }>
const settingsCache = new Map<string, { settings: PetSettings; timestamp: number }>();
const CACHE_TTL = 1000 * 60 * 5; // 5 minutes

const DEFAULT_SETTINGS: PetSettings = {
  types: [
    {
      id: "dog",
      label: "Dog",
      breeds: [
        "Mixed Breed",
        "Golden Retriever",
        "Labrador",
        "French Bulldog",
        "German Shepherd",
        "Poodle",
        "Chihuahua",
        "Beagle",
        "Rottweiler",
        "Dachshund",
      ],
    },
    {
      id: "cat",
      label: "Cat",
      breeds: [
        "Mixed Breed",
        "Domestic Short Hair",
        "Maine Coon",
        "Siamese",
        "Persian",
        "Ragdoll",
        "Bengal",
        "Sphynx",
        "British Shorthair",
      ],
    },
  ],
};

export const SettingsService = {
  // Exposed for testing to clear/inject cache
  _cache: settingsCache, 

  async getSettings(shop: string): Promise<PetSettings> {
    const cached = settingsCache.get(shop);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.settings;
    }

    const record = await prisma.petProfileSettings.findUnique({
      where: { shop },
    });

    let settings: PetSettings;
    if (!record) {
      // Return defaults if no config exists yet
      settings = DEFAULT_SETTINGS;
      // We don't save defaults to DB automatically to save space, 
      // but we could if we wanted to enforce persistence immediately.
    } else {
      try {
        settings = JSON.parse(record.config);
      } catch (e) {
        console.error("Failed to parse pet settings", e);
        settings = DEFAULT_SETTINGS;
      }
    }

    // Update cache
    settingsCache.set(shop, { settings, timestamp: Date.now() });
    return settings;
  },

  async updateSettings(shop: string, settings: PetSettings): Promise<PetSettings> {
    const configString = JSON.stringify(settings);

    await prisma.petProfileSettings.upsert({
      where: { shop },
      update: { config: configString },
      create: { shop, config: configString },
    });

    // Invalidate/Update cache
    settingsCache.set(shop, { settings, timestamp: Date.now() });

    return settings;
  },
};
