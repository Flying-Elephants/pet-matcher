import db from "../../../db.server";
import type { PetProfile, CreatePetProfileInput, UpdatePetProfileInput, PetSettings } from "../core/types";

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

  async findAllByShop(shop: string, options?: {
    sortKey?: string,
    sortDirection?: "asc" | "desc",
    query?: string,
    skip?: number,
    take?: number
  }): Promise<{ profiles: PetProfile[], totalCount: number }> {
    const sortKey = options?.sortKey || "createdAt";
    const sortDirection = options?.sortDirection || "desc";
    const { query, skip, take } = options || {};

    const where: any = { shop };
    if (query) {
      where.OR = [
        { name: { contains: query } },
        { breed: { contains: query } },
        { type: { contains: query } },
        { shopifyId: { contains: query } },
      ];
    }

    const [profiles, totalCount] = await Promise.all([
      db.petProfile.findMany({
        where,
        orderBy: { [sortKey]: sortDirection },
        skip,
        take,
      }),
      db.petProfile.count({ where })
    ]);

    return {
      profiles: profiles.map((p) => ({
        ...p,
        attributes: JSON.parse(p.attributes),
      })) as PetProfile[],
      totalCount
    };
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
    await db.petProfileSettings.deleteMany({
      where: { shop },
    });
  },

  // Settings
  async getSettings(shop: string): Promise<PetSettings | null> {
    const settings = await db.petProfileSettings.findUnique({
      where: { shop }
    });
    if (!settings) return null;
    return JSON.parse(settings.config);
  },

  async upsertSettings(shop: string, settings: PetSettings): Promise<PetSettings> {
    const result = await db.petProfileSettings.upsert({
      where: { shop },
      create: {
        shop,
        config: JSON.stringify(settings)
      },
      update: {
        config: JSON.stringify(settings)
      }
    });
    return JSON.parse(result.config);
  }
};
