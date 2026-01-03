import { describe, it, expect, vi } from "vitest";
import { PetProfileService } from "../index";
import { PetProfileDb } from "../internal/db";
import type { PetProfile } from "../index";

vi.mock("../internal/db", () => ({
  PetProfileDb: {
    findMany: vi.fn(),
  },
}));

describe("PetProfileService", () => {
  it("should return profiles for a shop", async () => {
    const mockProfiles: PetProfile[] = [
      { 
        id: "1", 
        shop: "test.myshopify.com", 
        shopifyId: "gid://shopify/Customer/123",
        name: "Buddy", 
        breed: "Labrador", 
        attributes: {},
        birthday: null
      },
    ];
    vi.mocked(PetProfileDb.findMany).mockResolvedValue(mockProfiles);

    const result = await PetProfileService.getProfiles("test.myshopify.com");
    expect(result).toEqual(mockProfiles);
    expect(PetProfileDb.findMany).toHaveBeenCalledWith("test.myshopify.com");
  });
});
