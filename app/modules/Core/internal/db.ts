import prisma from "../../../db.server";
import { AuditLogInput } from "../core/types";

export const ComplianceDb = {
  async logAccess(data: AuditLogInput) {
    return prisma.auditLog.create({
      data,
    });
  },

  async getSecuritySettings(shop: string) {
    return prisma.securitySettings.upsert({
      where: { shop },
      update: {},
      create: {
        shop,
        limitCollaboratorAccess: false,
      },
    });
  },

  async updateSecuritySettings(shop: string, limitCollaboratorAccess: boolean) {
    return prisma.securitySettings.update({
      where: { shop },
      data: { limitCollaboratorAccess },
    });
  },

  async purgeLogs(days: number) {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return prisma.auditLog.deleteMany({
      where: {
        createdAt: { lt: date },
      },
    });
  },
};
