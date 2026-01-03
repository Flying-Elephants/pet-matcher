import db from "../../../db.server";
import type { ProductRule } from "../index";

export const ProductRuleDb = {
  async findMany(shop: string): Promise<ProductRule[]> {
    const rules = await db.productRule.findMany({
      where: { shop },
    });
    return rules.map((r: any) => ({
      ...r,
      conditions: JSON.parse(r.conditions),
      productIds: JSON.parse(r.productIds),
    }));
  },

  async findOne(shop: string, id: string): Promise<ProductRule | null> {
    const rule = await db.productRule.findUnique({
      where: { id, shop },
    });
    if (!rule) return null;
    return {
      ...rule,
      conditions: JSON.parse(rule.conditions),
      productIds: JSON.parse(rule.productIds),
    };
  },

  async upsert(shop: string, data: Partial<ProductRule>): Promise<ProductRule> {
    const { id, ...rest } = data;
    const rule = await db.productRule.upsert({
      where: { id: id || "", shop },
      update: { 
        ...rest,
        conditions: rest.conditions ? JSON.stringify(rest.conditions) : undefined,
        productIds: rest.productIds ? JSON.stringify(rest.productIds) : undefined,
      },
      create: { 
        name: data.name || "New Rule",
        shop,
        conditions: JSON.stringify(data.conditions || {}),
        productIds: JSON.stringify(data.productIds || []),
        ...rest as any,
        id: undefined 
      },
    });
    return {
      ...rule,
      conditions: JSON.parse(rule.conditions),
      productIds: JSON.parse(rule.productIds),
    };
  },

  async delete(shop: string, id: string): Promise<void> {
    await db.productRule.delete({
      where: { id, shop },
    });
  },
};
