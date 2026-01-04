import db from "../../../db.server";
import type { PetProfile, CreatePetProfileInput, UpdatePetProfileInput } from "../core/types";

export const PetProfileDb = {
  async findById(shop: string, id: string): Promise<PetProfile | null> {
    const profile = await db.petProfile.findUnique({
      where: { id, shop },
    });
    if (!profile) return null;
    return {
      ...profile,
      attributes: JSON.parse(profile.attributes),
    } as PetProfile;
  },

  async findByCustomer(shop: string, shopifyId: string): Promise<PetProfile[]> {
    const profiles = await db.petProfile.findMany({
      where: { shop, shopifyId },
    });
    return profiles.map((p) => ({
      ...p,
      attributes: JSON.parse(p.attributes),
    })) as PetProfile[];
  },

  async create(shop: string, data: CreatePetProfileInput): Promise<PetProfile> {
    const profile = await db.petProfile.create({
      data: {
        ...data,
        shop,
        attributes: JSON.stringify(data.attributes || {}),
      },
    });
    return {
      ...profile,
      attributes: JSON.parse(profile.attributes),
    } as PetProfile;
  },

  async update(shop: string, id: string, data: UpdatePetProfileInput): Promise<PetProfile> {
    const updateData: any = { ...data };
    if (data.attributes) {
      updateData.attributes = JSON.stringify(data.attributes);
    }

    const profile = await db.petProfile.update({
      where: { id, shop },
      data: updateData,
    });
    return {
      ...profile,
      attributes: JSON.parse(profile.attributes),
    } as PetProfile;
  },

  async resetActiveProfile(shop: string, customerId: string): Promise<void> {
    await db.petProfile.updateMany({
      where: { shop, shopifyId: customerId },
      data: { isSelected: false },
    });
  },

  async setActiveProfile(shop: string, id: string): Promise<void> {
    await db.petProfile.update({
      where: { id, shop },
      data: { isSelected: true },
    });
  },

  async delete(shop: string, id: string): Promise<void> {
    await db.petProfile.delete({
      where: { id, shop },
    });
  },

  async deleteByCustomer(shop: string, customerId: string): Promise<void> {
    await db.petProfile.deleteMany({
      where: { shop, shopifyId: customerId },
    });
  },

  async deleteByShop(shop: string): Promise<void> {
    await db.petProfile.deleteMany({
      where: { shop },
    });
  },
};
