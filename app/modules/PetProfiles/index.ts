import { PetProfileDb } from "./internal/db";
import { MatcherService } from "./internal/matcher";
import type { ProductRule } from "../ProductRules";

export interface PetProfile {
  id: string;
  shop: string;
  shopifyId: string;
  name: string;
  breed: string;
  birthday?: Date | null;
  attributes: Record<string, any>;
}

export const PetProfileService = {
  getProfiles: async (shop: string): Promise<PetProfile[]> => {
    return PetProfileDb.findMany(shop);
  },
  
  createProfile: async (shop: string, data: Omit<PetProfile, "id">): Promise<PetProfile> => {
    return PetProfileDb.create(shop, data);
  },

  deleteProfile: async (shop: string, id: string): Promise<void> => {
    return PetProfileDb.delete(shop, id);
  },

  getRecommendedProducts: async (profile: PetProfile, rules: ProductRule[]): Promise<string[]> => {
    return MatcherService.match(profile, rules);
  }
};
