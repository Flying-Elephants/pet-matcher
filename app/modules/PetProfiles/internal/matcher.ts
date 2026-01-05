import type { PetProfile } from "../index";
import type { ProductRule } from "../../ProductRules";
import { AnalyticsService } from "../../Analytics";
import { SessionService } from "../../Core/SessionService";

export const MatcherService = {
  async match(profile: PetProfile, rules: ProductRule[]): Promise<string[]> {
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

  async isProductMatched(profile: PetProfile, rules: ProductRule[], productId: string): Promise<boolean> {
    // Check if the product is targeted by ANY active rule
    const activeRules = rules.filter(r => r.isActive);
    const isTargeted = activeRules.some(r => r.productIds.includes(productId));

    // Fallback: If not targeted by any active rule, it's a match
    if (!isTargeted) return true;

    // Sort rules by priority (higher number = higher priority)
    const sortedRules = [...activeRules].sort((a, b) => b.priority - a.priority);

    for (const rule of sortedRules) {
      if (this.evaluateConditions(profile, rule.conditions)) {
        if (rule.productIds.includes(productId)) {
          // Side Effects: Record Analytics & Increment Billing Usage
          AnalyticsService.recordMatch(profile.shop, profile.id, rule.id).catch(console.error);
          SessionService.incrementMatchCount(profile.shop).catch(console.error);
          return true;
        }
      }
    }

    return false;
  },

  evaluateConditions(profile: PetProfile, conditions: any): boolean {
    // Smart Matcher v2.0 Logic
    // Example condition: { breed: ["Labrador"], age_min: 2 }
    
    if (!conditions || Object.keys(conditions).length === 0) return true;

    for (const [key, value] of Object.entries(conditions)) {
      if (key === "petTypes") {
        const allowedTypes = value as string[];
        if (allowedTypes.length > 0 && !allowedTypes.includes(profile.type)) return false;
      }

      if (key === "breeds" || key === "breed") {
        const allowedBreeds = value as string[];
        if (allowedBreeds.length > 0 && !allowedBreeds.includes(profile.breed)) return false;
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
