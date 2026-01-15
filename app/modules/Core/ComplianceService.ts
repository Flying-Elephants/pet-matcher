import { ComplianceDb } from "./internal/db";
import { AuditLogInput } from "./core/types";

export const ComplianceService = {
  /**
   * Records an audit entry for staff accessing customer data.
   */
  async logAccess(data: AuditLogInput) {
    return ComplianceDb.logAccess(data);
  },

  /**
   * Retrieves security settings for a shop.
   */
  async getSettings(shop: string) {
    return ComplianceDb.getSecuritySettings(shop);
  },

  /**
   * Updates security settings for a shop.
   */
  async updateSettings(shop: string, limitCollaboratorAccess: boolean) {
    return ComplianceDb.updateSecuritySettings(shop, limitCollaboratorAccess);
  },

  /**
   * Purges old audit logs.
   */
  async purgeLogs(days: number = 365) {
    return ComplianceDb.purgeLogs(days);
  }
};
