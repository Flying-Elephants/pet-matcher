import { z } from "zod";

export const RuleConditionsSchema = z.object({
  petTypes: z.array(z.string()).default([]),
  breeds: z.array(z.string()).default([]),
});

export type RuleConditions = z.infer<typeof RuleConditionsSchema>;

export interface BulkOperationStatus {
  id: string;
  status: "CREATED" | "RUNNING" | "COMPLETED" | "CANCELLED" | "FAILED" | "EXPIRED";
  errorCode?: string;
  createdAt: string;
  completedAt?: string;
  objectCount: string;
  url?: string;
}

export interface ProductRule {
  id: string;
  shop: string;
  name: string;
  priority: number;
  conditions: RuleConditions;
  productIds: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
