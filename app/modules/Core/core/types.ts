import { z } from "zod";

export const AuditLogSchema = z.object({
  shop: z.string(),
  userId: z.bigint().optional(),
  userName: z.string().optional(),
  action: z.string(),
  resourceId: z.string().optional(),
});

export type AuditLogInput = z.infer<typeof AuditLogSchema>;

export interface SecuritySettings {
  limitCollaboratorAccess: boolean;
  updatedAt: Date;
}
