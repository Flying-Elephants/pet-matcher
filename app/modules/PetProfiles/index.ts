import { PetProfileDb } from "./internal/db";
import { MatcherService } from "./internal/matcher";
import { SettingsService } from "./internal/settings";
import { ProductRuleService } from "../ProductRules";
import type { PetProfile, CreatePetProfileInput, UpdatePetProfileInput, PetSettings } from "./core/types";

export * from "./core/types";

export const PetProfileService = {
  getProfile: async (shop: string, id: string): Promise<PetProfile | null> => {
    return PetProfileDb.findById(shop, id);
  },

  getProfilesByCustomer: async (shop: string, customerId: string): Promise<PetProfile[]> => {
    return PetProfileDb.findByCustomer(shop, customerId);
  },
  
  createProfile: async (shop: string, data: CreatePetProfileInput): Promise<PetProfile> => {
    return PetProfileDb.create(shop, data);
  },

  updateProfile: async (shop: string, id: string, data: UpdatePetProfileInput): Promise<PetProfile> => {
    return PetProfileDb.update(shop, id, data);
  },
  
  setActiveProfile: async (shop: string, customerId: string, petId: string): Promise<void> => {
    // Unselect all other pets for this customer
    await PetProfileDb.resetActiveProfile(shop, customerId);
    
    // Select the new pet
    await PetProfileDb.setActiveProfile(shop, petId);
  },

  deleteProfile: async (shop: string, id: string): Promise<void> => {
    return PetProfileDb.delete(shop, id);
  },

  getRecommendedProducts: async (profile: PetProfile, rules: any[]): Promise<string[]> => {
    return MatcherService.match(profile, rules);
  },

  getMatchesForProduct: async (shop: string, customerId: string, productId: string) => {
    const [profiles, rules] = await Promise.all([
      PetProfileDb.findByCustomer(shop, customerId),
      ProductRuleService.getRules(shop)
    ]);

    const matches = await Promise.all(
      profiles.map(async (pet) => ({
        petId: pet.id,
        isMatched: await MatcherService.isProductMatched(pet, rules, productId)
      }))
    );

    return { profiles, matches };
  },

  deleteCustomerData: async (shop: string, customerId: string): Promise<void> => {
    return PetProfileDb.deleteByCustomer(shop, customerId);
  },

  deleteShopData: async (shop: string): Promise<void> => {
    return PetProfileDb.deleteByShop(shop);
  },

  // Settings Management
  getSettings: async (shop: string): Promise<PetSettings> => {
    return SettingsService.getSettings(shop);
  },

  updateSettings: async (shop: string, settings: PetSettings): Promise<PetSettings> => {
    return SettingsService.updateSettings(shop, settings);
  }
};
