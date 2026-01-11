import db from "../../../db.server";
import type { SubscriptionPlan } from "../core/types";

export const BillingDb = {
  async getSession(shop: string) {
    return db.session.findUnique({
      where: { shop },
    });
  },

  async updateSubscription(shop: string, plan: SubscriptionPlan) {
    return db.session.update({
      where: { shop },
      data: { plan },
    });
  },

  async incrementMatchCount(shop: string) {
    return db.session.update({
      where: { shop },
      data: {
        matchCount: {
          increment: 1,
        },
      },
    });
  },

  async resetMatchCount(shop: string) {
    return db.session.update({
      where: { shop },
      data: {
        matchCount: 0,
      },
    });
  },
};
