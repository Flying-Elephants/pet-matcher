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
  }
};
