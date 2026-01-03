import { PetProfileDb } from "./internal/db";
import { MatcherService } from "./internal/matcher";
import type { ProductRule } from "../ProductRules";
import type { PetProfile, CreatePetProfileInput, UpdatePetProfileInput } from "./core/types";

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

  deleteProfile: async (shop: string, id: string): Promise<void> => {
    return PetProfileDb.delete(shop, id);
  },

  getRecommendedProducts: async (profile: PetProfile, rules: ProductRule[]): Promise<string[]> => {
    return MatcherService.match(profile, rules);
  },

  deleteCustomerData: async (shop: string, customerId: string): Promise<void> => {
    return PetProfileDb.deleteByCustomer(shop, customerId);
  },

  deleteShopData: async (shop: string): Promise<void> => {
    return PetProfileDb.deleteByShop(shop);
  }
};
