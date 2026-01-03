import type { SummaryData } from "../index";
import db from "../../../db.server";

export const AnalyticsDb = {
  async getSummary(shop: string): Promise<SummaryData> {
    const [totalMatches, activeRules, syncedProductsCount] = await Promise.all([
      db.petProfile.count({ where: { shop } }),
      db.productRule.count({ where: { shop, isActive: true } }),
      (db as any).syncedProduct?.count({ where: { shop } }) || Promise.resolve(0),
    ]);

    return {
      totalMatches,
      activeRules,
      popularBreeds: [],
      syncedProductsCount
    };
  }
};
