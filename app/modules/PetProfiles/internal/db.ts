import db from "../../../db.server";
import type { PetProfile, CreatePetProfileInput, UpdatePetProfileInput, PetSettings } from "../core/types";
import { encrypt, decrypt } from "../../Core/encryption";

export const PetProfileDb = {
  async findById(shop: string, id: string): Promise<PetProfile | null> {
    const profile = await db.petProfile.findUnique({
      where: { id, shop },
    });
    if (!profile) return null;
    return {
      ...profile,
      name: decrypt(profile.name),
      attributes: JSON.parse(decrypt(profile.attributes)),
    } as PetProfile;
  },

  async findByCustomer(shop: string, shopifyId: string): Promise<PetProfile[]> {
    const profiles = await db.petProfile.findMany({
      where: { shop, shopifyId },
    });
    return profiles.map((p) => ({
      ...p,
      name: decrypt(p.name),
      attributes: JSON.parse(decrypt(p.attributes)),
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
        name: decrypt(p.name),
        attributes: JSON.parse(decrypt(p.attributes)),
      })) as PetProfile[],
      totalCount
    };
  },

  async create(shop: string, data: CreatePetProfileInput): Promise<PetProfile> {
    const profile = await db.petProfile.create({
      data: {
        ...data,
        shop,
        name: encrypt(data.name),
        attributes: encrypt(JSON.stringify(data.attributes || {})),
      },
    });
    return {
      ...profile,
      name: decrypt(profile.name),
      attributes: JSON.parse(decrypt(profile.attributes)),
    } as PetProfile;
  },

  async update(shop: string, id: string, data: UpdatePetProfileInput): Promise<PetProfile> {
    const updateData: any = { ...data };
    if (data.name) {
      updateData.name = encrypt(data.name);
    }
    if (data.attributes) {
      updateData.attributes = encrypt(JSON.stringify(data.attributes));
    }

    const profile = await db.petProfile.update({
      where: { id, shop },
      data: updateData,
    });
    return {
      ...profile,
      name: decrypt(profile.name),
      attributes: JSON.parse(decrypt(profile.attributes)),
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
    return settings.config as unknown as PetSettings;
  },

  async upsertSettings(shop: string, settings: PetSettings): Promise<PetSettings> {
    const result = await db.petProfileSettings.upsert({
      where: { shop },
      create: {
        shop,
        config: settings as any
      },
      update: {
        config: settings as any
      }
    });
    return result.config as unknown as PetSettings;
  },

  // Consent
  async getConsent(shop: string, shopifyId: string): Promise<boolean> {
    const consent = await db.customerConsent.findUnique({
      where: { shop_shopifyId: { shop, shopifyId } }
    });
    return consent?.isAgreed ?? false;
  },

  async setConsent(shop: string, shopifyId: string, isAgreed: boolean): Promise<void> {
    await db.customerConsent.upsert({
      where: { shop_shopifyId: { shop, shopifyId } },
      create: { shop, shopifyId, isAgreed },
      update: { isAgreed }
    });
  },

  async purgeInactive(years: number): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setFullYear(cutoffDate.getFullYear() - years);

    const { count } = await db.petProfile.deleteMany({
      where: {
        updatedAt: { lt: cutoffDate }
      }
    });

    return count;
  }
};
