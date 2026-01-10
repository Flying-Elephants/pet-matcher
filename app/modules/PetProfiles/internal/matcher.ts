import type { PetProfile, MatchResult } from "../core/types";
import type { ProductRule, RuleConditions } from "../../ProductRules/core/types";
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

  async isProductMatched(profile: PetProfile, rules: ProductRule[], productId: string): Promise<MatchResult> {
    const activeRules = rules.filter(r => r.isActive);
    const rulesForProduct = activeRules.filter(r => r.productIds.includes(productId));

    // Fallback: If not targeted by any active rule, it's a match
    if (rulesForProduct.length === 0) {
      return { petId: profile.id, isMatched: true, warnings: [] };
    }

    const warnings: string[] = [];

    // Check for missing weight warning across all applicable rules for this product
    const hasWeightRule = rulesForProduct.some(r => 
      r.conditions.weightRange && 
      (r.conditions.weightRange.min != null || r.conditions.weightRange.max != null)
    );
    
    if (hasWeightRule && (profile.weightGram === null || profile.weightGram === undefined)) {
      warnings.push("MISSING_WEIGHT");
    }

    // Sort rules by priority (higher number = higher priority)
    const sortedRules = [...rulesForProduct].sort((a, b) => b.priority - a.priority);

    for (const rule of sortedRules) {
      if (this.evaluateConditions(profile, rule.conditions)) {
        // Side Effects: Record Analytics & Increment Billing Usage
        AnalyticsService.recordMatch(profile.shop, profile.id, rule.id).catch(console.error);
        SessionService.incrementMatchCount(profile.shop).catch(console.error);
        return { petId: profile.id, isMatched: true, warnings };
      }
    }

    return { petId: profile.id, isMatched: false, warnings };
  },

  evaluateConditions(profile: PetProfile, conditions: RuleConditions): boolean {
    if (!conditions) return true;

    // Pet Types
    const petTypes = conditions.petTypes;
    if (petTypes && petTypes.length > 0) {
      if (!petTypes.includes(profile.type)) return false;
    }

    // Breeds (support both 'breeds' and 'breed' for backward compatibility in tests)
    const breeds = conditions.breeds || (conditions as any).breed;
    if (breeds && breeds.length > 0) {
      if (!breeds.includes(profile.breed)) return false;
    }

    // Weight Range
    if (conditions.weightRange) {
      const { min, max } = conditions.weightRange;
      if (min != null || max != null) {
        if (profile.weightGram === null || profile.weightGram === undefined) return false;
        if (min != null && profile.weightGram < min) return false;
        if (max != null && profile.weightGram > max) return false;
      }
    }

    return true;
  }
};
