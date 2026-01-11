import { z } from "zod";

export const RuleConditionsSchema = z.object({
  petTypes: z.array(z.string()).default([]),
  breeds: z.array(z.string()).default([]),
  weightRange: z.object({
    min: z.number().int().nonnegative().nullable().optional(),
    max: z.number().int().nonnegative().nullable().optional(),
  }).optional().refine(data => {
    if (!data) return true;
    const hasMin = data.min !== null && data.min !== undefined;
    const hasMax = data.max !== null && data.max !== undefined;
    
    // If one is entered, both must be entered
    if (hasMin !== hasMax) return false;
    
    // If both entered, max must be >= min
    if (hasMin && hasMax && data.max! < data.min!) return false;
    
    return true;
  }, {
    message: "Both min and max weights are required if either is provided, and max must be greater than or equal to min."
  }),
});

export type RuleConditions = z.infer<typeof RuleConditionsSchema>;

export const ProductRuleUpsertSchema = z.object({
  name: z.string().min(1, "Rule name is required."),
  priority: z.number().int().default(0),
  isActive: z.boolean().default(true),
  conditions: RuleConditionsSchema,
  productIds: z.array(z.string()).min(1, "At least one product must be selected."),
});

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

export type RuleSortKey = "name" | "priority" | "isActive" | "createdAt" | "productCount" | "petTypeCount" | "breedCount";

export interface RuleSortOptions {
  key: RuleSortKey;
  direction: "asc" | "desc";
}

export interface RuleListOptions {
  sort?: RuleSortOptions;
  page?: number;
  limit?: number;
  query?: string;
}
