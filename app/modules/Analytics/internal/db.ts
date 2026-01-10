import type { SummaryData } from "../index";
import db from "../../../db.server";

export const AnalyticsDb = {
  async getSummary(shop: string): Promise<SummaryData> {
    const [totalMatches, activeRules, syncedProductsCount, totalPetProfiles] = await Promise.all([
      db.matchEvent.count({ where: { shop } }),
      db.productRule.count({ where: { shop, isActive: true } }),
      db.syncedProduct.count({ where: { shop } }),
      db.petProfile.count({ where: { shop } }),
    ]);

    // Top Performing Rules
    const topRulesRaw = await db.matchEvent.groupBy({
      by: ["ruleId"],
      where: { shop },
      _count: { ruleId: true },
      orderBy: { _count: { ruleId: "desc" } },
      take: 5,
    });

    // Fetch rule names
    const ruleIds = topRulesRaw.map(r => r.ruleId);
    const rules = await db.productRule.findMany({
      where: { id: { in: ruleIds } },
      select: { id: true, name: true }
    });

    const topPerformingRules = topRulesRaw.map(raw => ({
      ruleName: rules.find(r => r.id === raw.ruleId)?.name || "Unknown Rule",
      count: raw._count.ruleId
    }));

    // Popular Breeds
    const topBreedsRaw = await db.petProfile.groupBy({
      by: ["breed"],
      where: { shop },
      _count: { breed: true },
      orderBy: { _count: { breed: "desc" } },
      take: 5,
    });

    const popularBreeds = topBreedsRaw.map(raw => ({
      breed: raw.breed,
      count: raw._count.breed
    }));

    return {
      totalMatches,
      activeRules,
      totalPetProfiles,
      syncedProductsCount,
      topPerformingRules,
      popularBreeds
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
