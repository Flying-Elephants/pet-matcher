import type { PetProfile } from "../index";
import type { ProductRule } from "../../ProductRules";
import { AnalyticsService } from "../../Analytics";
import { SessionService } from "../../Core/SessionService";

export const MatcherService = {
  async match(profile: PetProfile, rules: ProductRule[]): Promise<string[]> {
    // 1. Billing Gate
    const session = await SessionService.getSessionByShop(profile.shop);
    const plan = (session as any)?.plan || "FREE";
    const matchCount = (session as any)?.matchCount || 0;

    if (plan === "FREE" && matchCount >= 50) {
      console.log(`Billing Gate: Shop ${profile.shop} has reached the free limit.`);
      return []; // Or throw a specific error that the frontend can handle
    }

    const matchedProductIds = new Set<string>();
    let matchedRuleId: string | null = null;

    // Sort rules by priority (higher number = higher priority)
    const sortedRules = [...rules].sort((a, b) => b.priority - a.priority);

    for (const rule of sortedRules) {
      if (!rule.isActive) continue;

      if (this.evaluateConditions(profile, rule.conditions)) {
        rule.productIds.forEach(id => matchedProductIds.add(id));
        matchedRuleId = rule.id;
      }
    }

    // Side Effects: Record Analytics & Increment Billing Usage
    if (matchedRuleId) {
      AnalyticsService.recordMatch(profile.shop, profile.id, matchedRuleId).catch(console.error);
      SessionService.incrementMatchCount(profile.shop).catch(console.error);
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

      if (key === "life_stage") {
          const profileBirthday = profile.birthday ? new Date(profile.birthday) : null;
          if (profileBirthday) {
              const ageInYears = (new Date().getTime() - profileBirthday.getTime()) / (1000 * 60 * 60 * 24 * 365);
              if (value === "Puppy" && ageInYears > 1) return false;
              if (value === "Senior" && ageInYears < 7) return false;
          }
      }

      // Add more smart matching logic here
    }

    return true;
  }
};
