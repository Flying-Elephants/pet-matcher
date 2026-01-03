import { AnalyticsDb } from "./internal/db";

export interface SummaryData {
  totalMatches: number;
  activeRules: number;
  popularBreeds: string[];
  syncedProductsCount: number;
}

export const AnalyticsService = {
  getSummary: async (shop: string): Promise<SummaryData> => {
    return AnalyticsDb.getSummary(shop);
  },

  recordMatch: async (shop: string, profileId: string, ruleId: string): Promise<void> => {
    return AnalyticsDb.recordMatch(shop, profileId, ruleId);
  },

  getHistoricalMatches: async (shop: string, days: number = 30) => {
    return AnalyticsDb.getHistoricalMatches(shop, days);
  }
};
