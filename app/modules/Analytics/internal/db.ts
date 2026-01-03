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
  },

  async recordMatch(shop: string, profileId: string, ruleId: string): Promise<void> {
    if (!shop || !profileId) return;
    await db.matchEvent.create({
      data: {
        shop,
        profileId,
        ruleId,
      },
    });
  },

  async getHistoricalMatches(shop: string, days: number): Promise<{ date: string; matchCount: number }[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const events = await db.matchEvent.findMany({
      where: {
        shop,
        createdAt: { gte: startDate },
      },
      orderBy: { createdAt: "asc" },
    });

    // Simple grouping by date
    const groups: Record<string, number> = {};
    events.forEach(event => {
      const date = event.createdAt.toISOString().split("T")[0];
      groups[date] = (groups[date] || 0) + 1;
    });

    return Object.entries(groups).map(([date, matchCount]) => ({
      date,
      matchCount,
    }));
  }
};
