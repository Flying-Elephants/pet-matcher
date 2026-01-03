import db from "../../db.server";

export const SessionService = {
  async deleteSessions(shop: string) {
    return db.session.deleteMany({
      where: { shop },
    });
  },

  async updateSession(id: string, data: any) {
    return db.session.update({
      where: { id },
      data,
    });
  },

  async getSessionByShop(shop: string) {
    if (!shop) return null;
    return db.session.findUnique({
      where: { shop },
    });
  },

  async incrementMatchCount(shop: string) {
    if (!shop) return;
    return db.session.update({
      where: { shop },
      data: {
        matchCount: { increment: 1 }
      }
    });
  }
};
