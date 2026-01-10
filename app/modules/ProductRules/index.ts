import { ProductRuleDb } from "./internal/db";
import { BulkOperationService } from "./internal/bulk";
import type { AdminApiContext } from "@shopify/shopify-app-react-router/server";
import type { ProductRule, RuleConditions, RuleSortOptions, RuleListOptions } from "./core/types";

export * from "./core/types";

export const ProductRuleService = {
  getRules: async (shop: string, options?: RuleListOptions): Promise<{ rules: ProductRule[], totalCount: number }> => {
    const { sort, page, limit } = options || {};
    
    let rules: ProductRule[];
    let totalCount: number;

    if (page !== undefined && limit !== undefined) {
      const skip = (page - 1) * limit;
      const take = limit;
      [rules, totalCount] = await Promise.all([
        ProductRuleDb.findMany(shop, { skip, take }),
        ProductRuleDb.count(shop)
      ]);
    } else {
      rules = await ProductRuleDb.findMany(shop);
      totalCount = rules.length;
    }

    if (sort) {
      rules = [...rules].sort((a, b) => {
        let valA: any;
        let valB: any;

        switch (sort.key) {
          case "name":
            valA = a.name.toLowerCase();
            valB = b.name.toLowerCase();
            break;
          case "priority":
            valA = a.priority;
            valB = b.priority;
            break;
          case "isActive":
            valA = a.isActive ? 1 : 0;
            valB = b.isActive ? 1 : 0;
            break;
          case "createdAt":
            valA = a.createdAt.getTime();
            valB = b.createdAt.getTime();
            break;
          case "productCount":
            valA = a.productIds ? a.productIds.length : 0;
            valB = b.productIds ? b.productIds.length : 0;
            break;
          case "petTypeCount":
            valA = a.conditions?.petTypes ? a.conditions.petTypes.length : 0;
            valB = b.conditions?.petTypes ? b.conditions.petTypes.length : 0;
            break;
          case "breedCount":
            valA = a.conditions?.breeds ? a.conditions.breeds.length : 0;
            valB = b.conditions?.breeds ? b.conditions.breeds.length : 0;
            break;
          default:
            return 0;
        }

        if (valA < valB) return sort.direction === "asc" ? -1 : 1;
        if (valA > valB) return sort.direction === "asc" ? 1 : -1;
        return 0;
      });
    }

    return { rules, totalCount };
  },

  getRule: async (shop: string, id: string): Promise<ProductRule | null> => {
    return ProductRuleDb.findOne(shop, id);
  },
  
  upsertRule: async (shop: string, data: Partial<ProductRule>): Promise<ProductRule> => {
    if (!data.name || data.name.trim() === "") {
      throw new Error("Rule name is required.");
    }

    if (!data.productIds || data.productIds.length === 0) {
      throw new Error("At least one product must be selected.");
    }

    if (data.name) {
      const existing = await ProductRuleDb.findByName(shop, data.name);
      if (existing && existing.id !== data.id) {
        throw new Error(`A rule with the name "${data.name}" already exists.`);
      }
    }
    return ProductRuleDb.upsert(shop, data);
  },

  deleteRule: async (shop: string, id: string): Promise<void> => {
    return ProductRuleDb.delete(shop, id);
  },

  deleteManyRules: async (shop: string, ids: string[]): Promise<void> => {
    return ProductRuleDb.deleteMany(shop, ids);
  },

  /**
   * Logical matching: Matches a pet profile against all active rules.
   * A product is matched if:
   * 1. ANY active rule targeting it matches the pet.
   * 2. OR it is not targeted by ANY active rule (fallback match).
   */
  getMatchedProductsForPet: async (shop: string, petProfile: any): Promise<string[]> => {
    const activeRules = await ProductRuleDb.findActive(shop);
    const matchedProductIds = new Set<string>();
    const targetedProductIds = new Set<string>();

    for (const rule of activeRules) {
      rule.productIds.forEach(id => targetedProductIds.add(id));
      if (isRuleMatch(rule.conditions, petProfile)) {
        rule.productIds.forEach(id => matchedProductIds.add(id));
      }
    }

    // Fallback: Products NOT targeted by any active rule match all pets
    // Note: We need to know which products exist in the shop.
    // Assuming BulkOperationService or a similar mechanism provides the full list.
    // For now, we only match products that are either explicitly matched or NOT targeted.
    // However, if we don't have the full product list here, we can't easily return "untargeted" ones
    // unless this method is meant to only filter a provided list.
    
    return Array.from(matchedProductIds);
  },

  syncProducts: async (admin: AdminApiContext) => {
    return BulkOperationService.runProductSync(admin);
  },

  processSync: async (url: string, shop: string) => {
    return BulkOperationService.processSyncResult(url, shop);
  },

  syncSingleProduct: async (admin: AdminApiContext, productId: string, shop: string) => {
    return BulkOperationService.syncSingleProduct(admin, productId, shop);
  },

  removeProduct: async (productId: string) => {
    return BulkOperationService.deleteProduct(productId);
  },

  getSyncStatus: async (admin: AdminApiContext) => {
    return BulkOperationService.getStatus(admin);
  }
};

function isRuleMatch(conditions: RuleConditions, pet: any): boolean {
  // 1. Pet Type Match (OR logic: if conditions.petTypes is empty, it matches all)
  if (conditions.petTypes.length > 0 && !conditions.petTypes.includes(pet.type)) {
    return false;
  }

  // 2. Breed Match (OR logic: if conditions.breeds is empty, it matches all)
  if (conditions.breeds.length > 0 && !conditions.breeds.includes(pet.breed)) {
    return false;
  }

  // 3. Weight Match
  if (conditions.weightRange) {
    const { min, max } = conditions.weightRange;
    const petWeight = pet.weightGram;

    if (petWeight === undefined || petWeight === null) {
      return false; // If rule has weight range, pet must have weight
    }

    if (min !== undefined && min !== null && petWeight < min) {
      return false;
    }

    if (max !== undefined && max !== null && petWeight > max) {
      return false;
    }
  }

  return true;
}
