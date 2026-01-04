import { ProductRuleDb } from "./internal/db";
import { BulkOperationService } from "./internal/bulk";
import type { AdminApiContext } from "@shopify/shopify-app-react-router/server";
import type { ProductRule, RuleConditions } from "./core/types";

export * from "./core/types";

export const ProductRuleService = {
  getRules: async (shop: string): Promise<ProductRule[]> => {
    return ProductRuleDb.findMany(shop);
  },

  getRule: async (shop: string, id: string): Promise<ProductRule | null> => {
    return ProductRuleDb.findOne(shop, id);
  },
  
  upsertRule: async (shop: string, data: Partial<ProductRule>): Promise<ProductRule> => {
    return ProductRuleDb.upsert(shop, data);
  },

  deleteRule: async (shop: string, id: string): Promise<void> => {
    return ProductRuleDb.delete(shop, id);
  },

  /**
   * Logical matching: Matches a pet profile against all active rules.
   * A product is matched if ANY active rule targeting it matches the pet.
   */
  getMatchedProductsForPet: async (shop: string, petProfile: any): Promise<string[]> => {
    const activeRules = await ProductRuleDb.findActive(shop);
    const matchedProductIds = new Set<string>();

    for (const rule of activeRules) {
      if (isRuleMatch(rule.conditions, petProfile)) {
        rule.productIds.forEach(id => matchedProductIds.add(id));
      }
    }

    return Array.from(matchedProductIds);
  },

  syncProducts: async (admin: AdminApiContext) => {
    return BulkOperationService.runProductSync(admin);
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

  // 2. Breed Match (OR logic)
  if (conditions.breeds.length > 0 && !conditions.breeds.includes(pet.breed)) {
    return false;
  }

  return true;
}
