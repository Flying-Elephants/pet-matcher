import { z } from "zod";

export const PetProfileSchema = z.object({
  id: z.string().uuid(),
  shop: z.string(),
  shopifyId: z.string(),
  name: z.string().min(1, "Name is required").max(100),
  breed: z.string().min(1, "Breed is required"),
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
