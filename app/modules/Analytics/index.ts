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
  }
};
