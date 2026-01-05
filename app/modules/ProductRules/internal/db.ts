import db from "../../../db.server";
import type { ProductRule, RuleConditions } from "../core/types";

export const ProductRuleDb = {
  async findMany(shop: string, options?: { skip?: number; take?: number }): Promise<ProductRule[]> {
    const rules = await db.productRule.findMany({
      where: { shop },
      orderBy: { priority: "desc" },
      skip: options?.skip,
      take: options?.take,
    });
    return rules.map((r) => this.mapToDomain(r));
  },

  async count(shop: string): Promise<number> {
    return db.productRule.count({
      where: { shop },
    });
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
        conditions: rest.conditions ? JSON.stringify(rest.conditions) : undefined,
        productIds: rest.productIds ? JSON.stringify(rest.productIds) : undefined,
      },
      create: {
        id: id || undefined,
        shop,
        name: rest.name || "New Rule",
        priority: rest.priority || 0,
        isActive: rest.isActive ?? true,
        conditions: JSON.stringify(rest.conditions || { petTypes: [], breeds: [] }),
        productIds: JSON.stringify(rest.productIds || []),
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
      conditions: JSON.parse(raw.conditions) as RuleConditions,
      productIds: JSON.parse(raw.productIds) as string[],
    };
  },
};
