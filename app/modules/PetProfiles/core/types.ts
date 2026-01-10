import { z } from "zod";

export const PetProfileSchema = z.object({
  id: z.string().uuid(),
  shop: z.string(),
  shopifyId: z.string(),
  name: z.string().min(1, "Name is required").max(100),
  type: z.string().default("Dog"),
  breed: z.string().min(1, "Breed is required"),
  weightGram: z.number().int().nonnegative().nullable().optional(),
  birthday: z.coerce.date().nullable().optional(),
  attributes: z.record(z.string(), z.any()).default({}),
  isSelected: z.boolean().default(false),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export type PetProfile = z.infer<typeof PetProfileSchema>;

export const CreatePetProfileSchema = PetProfileSchema.omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true,
  isSelected: true
});

export type CreatePetProfileInput = z.infer<typeof CreatePetProfileSchema>;

export const UpdatePetProfileSchema = CreatePetProfileSchema.partial();

export type UpdatePetProfileInput = z.infer<typeof UpdatePetProfileSchema>;

export const PetTypeConfigSchema = z.object({
  id: z.string(),
  label: z.string().min(1, "Type name is required"),
  breeds: z.array(z.string()).default([]),
});

export type PetTypeConfig = z.infer<typeof PetTypeConfigSchema>;

export const PetSettingsSchema = z.object({
  types: z.array(PetTypeConfigSchema).default([]),
  weightUnit: z.enum(["kg", "lbs"]).default("kg"),
});

export type PetSettings = z.infer<typeof PetSettingsSchema>;

export interface MatchResult {
  petId: string;
  isMatched: boolean;
  warnings: string[];
}

