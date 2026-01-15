import { AnalyticsDb } from "./internal/db";

export interface SummaryData {
  totalMatches: number;
  activeRules: number;
  totalPetProfiles: number;
  syncedProductsCount: number;
  topPerformingRules: Array<{ ruleName: string; count: number }>;
  popularBreeds: Array<{ breed: string; count: number }>;
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
  },

  purgeOldEvents: async (days: number = 90): Promise<number> => {
    return AnalyticsDb.purgeEvents(days);
  }
};
