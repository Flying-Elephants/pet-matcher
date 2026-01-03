import { ProductRuleDb } from "./internal/db";
import { BulkOperationService } from "./internal/bulk";
import type { AdminApiContext } from "@shopify/shopify-app-react-router/server";

export interface ProductRule {
  id: string;
  shop: string;
  name: string;
  priority: number;
  conditions: any;
  productIds: string[];
  isActive: boolean;
}

export interface BulkOperationStatus {
  id: string;
  status: "CREATED" | "RUNNING" | "COMPLETED" | "CANCELLED" | "FAILED" | "EXPIRED";
  errorCode?: string;
  createdAt: string;
  completedAt?: string;
  objectCount: string;
  url?: string;
}

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

  syncProducts: async (admin: AdminApiContext) => {
    return BulkOperationService.runProductSync(admin);
  },

  syncSingleProduct: async (admin: AdminApiContext, productId: string, shop: string) => {
    return BulkOperationService.syncSingleProduct(admin, productId, shop);
  },

  removeProduct: async (productId: string) => {
    return BulkOperationService.deleteProduct(productId);
  },

  getSyncStatus: async (admin: AdminApiContext): Promise<BulkOperationStatus | null> => {
    return BulkOperationService.getStatus(admin);
  }
};
