import db from "../../../db.server";
import type { PetProfile } from "../index";

export const PetProfileDb = {
  async findMany(shop: string): Promise<PetProfile[]> {
    const profiles = await db.petProfile.findMany({
      where: { shop },
    });
    return profiles.map((p: any) => ({
      ...p,
      attributes: JSON.parse(p.attributes),
    }));
  },

  async create(shop: string, data: Omit<PetProfile, "id">): Promise<PetProfile> {
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
    };
  },

  async delete(shop: string, id: string): Promise<void> {
    await db.petProfile.delete({
      where: { id, shop },
    });
  },
};
