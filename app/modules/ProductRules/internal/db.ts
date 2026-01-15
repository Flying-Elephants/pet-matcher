import db from "../../../db.server";
import type { ProductRule, RuleConditions } from "../core/types";

export const ProductRuleDb = {
  async findMany(shop: string, options?: { skip?: number; take?: number; query?: string }): Promise<ProductRule[]> {
    const { skip, take, query } = options || {};
    const where: any = { shop };
    if (query) {
      where.name = { contains: query };
    }

    const rules = await db.productRule.findMany({
      where,
      orderBy: { priority: "desc" },
      skip,
      take,
    });
    return rules.map((r) => this.mapToDomain(r));
  },

  async count(shop: string, options?: { query?: string }): Promise<number> {
    const where: any = { shop };
    if (options?.query) {
      where.name = { contains: options.query };
    }
    return db.productRule.count({ where });
  },

  async findActive(shop: string): Promise<ProductRule[]> {
    const rules = await db.productRule.findMany({
      where: { shop, isActive: true },
      orderBy: { priority: "desc" },
    });
    return rules.map((r) => this.mapToDomain(r));
  },

  async findOne(shop: string, id: string): Promise<ProductRule | null> {
    const rule = await db.productRule.findUnique({
      where: { id, shop },
    });
    if (!rule) return null;
    return this.mapToDomain(rule);
  },

  async findByName(shop: string, name: string): Promise<ProductRule | null> {
    const rule = await db.productRule.findFirst({
      where: { shop, name },
    });
    if (!rule) return null;
    return this.mapToDomain(rule);
  },

  async upsert(shop: string, data: Partial<ProductRule>): Promise<ProductRule> {
    const { id, ...rest } = data;
    const rule = await db.productRule.upsert({
      where: { id: id || "", shop },
      update: {
        name: rest.name,
        priority: rest.priority,
        isActive: rest.isActive,
        conditions: rest.conditions as any, // Native Json
        productIds: rest.productIds as any, // Native Json
      },
      create: {
        id: id || undefined,
        shop,
        name: rest.name || "New Rule",
        priority: rest.priority || 0,
        isActive: rest.isActive ?? true,
        conditions: (rest.conditions || { petTypes: [], breeds: [] }) as any,
        productIds: (rest.productIds || []) as any,
      },
    });
    return this.mapToDomain(rule);
  },

  async delete(shop: string, id: string): Promise<void> {
    await db.productRule.delete({
      where: { id, shop },
    });
  },

  async deleteMany(shop: string, ids: string[]): Promise<void> {
    await db.productRule.deleteMany({
      where: {
        id: { in: ids },
        shop,
      },
    });
  },

  mapToDomain(raw: any): ProductRule {
    return {
      ...raw,
      conditions: raw.conditions as unknown as RuleConditions,
      productIds: raw.productIds as unknown as string[],
    };
  },

  async purgeOldJobs(days: number): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const { count } = await db.job.deleteMany({
      where: {
        createdAt: { lt: cutoffDate }
      }
    });

    return count;
  }
};
