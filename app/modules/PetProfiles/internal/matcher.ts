import type { PetProfile } from "../index";
import type { ProductRule } from "../../ProductRules";

export const MatcherService = {
  async match(profile: PetProfile, rules: ProductRule[]): Promise<string[]> {
    const matchedProductIds = new Set<string>();

    // Sort rules by priority (higher number = higher priority)
    const sortedRules = [...rules].sort((a, b) => b.priority - a.priority);

    for (const rule of sortedRules) {
      if (!rule.isActive) continue;

      if (this.evaluateConditions(profile, rule.conditions)) {
        rule.productIds.forEach(id => matchedProductIds.add(id));
      }
    }

    return Array.from(matchedProductIds);
  },

  evaluateConditions(profile: PetProfile, conditions: any): boolean {
    // Smart Matcher v2.0 Logic
    // Example condition: { breed: ["Labrador"], age_min: 2 }
    
    if (!conditions || Object.keys(conditions).length === 0) return true;

    for (const [key, value] of Object.entries(conditions)) {
      if (key === "breed") {
        const allowedBreeds = value as string[];
        if (!allowedBreeds.includes(profile.breed)) return false;
      }
      
      // Breed-specific logic (Golden Retriever implies High Energy)
      if (profile.breed === "Golden Retriever" && key === "energy_level") {
          if (value !== "High") return false;
      }

      // Add more smart matching logic here
    }

    return true;
  }
};
