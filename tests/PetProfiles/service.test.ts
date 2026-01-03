import { describe, it, expect, vi } from "vitest";
import { PetProfileService } from "../../app/modules/PetProfiles";
import { PetProfileDb } from "../../app/modules/PetProfiles/internal/db";

vi.mock("../../app/modules/PetProfiles/internal/db", () => ({
  PetProfileDb: {
    findMany: vi.fn(),
    findById: vi.fn(),
    findByCustomer: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

const MOCK_SHOP = "test.myshopify.com";
const MOCK_CUSTOMER_ID = "12345";
const MOCK_PROFILE_ID = "profile-uuid";
const MOCK_PROFILE = { 
  id: MOCK_PROFILE_ID, 
  shop: MOCK_SHOP, 
  shopifyId: MOCK_CUSTOMER_ID, 
  name: "Buddy", 
  breed: "Golden Retriever",
  attributes: {},
};
const MOCK_CREATE_INPUT = {
  shop: MOCK_SHOP, 
  shopifyId: MOCK_CUSTOMER_ID, 
  name: "New Pet", 
  breed: "Poodle",
  attributes: {},
};
const MOCK_UPDATE_INPUT = { name: "Updated Name" };


describe("PetProfileService", () => {
  it("should get profiles by customer ID", async () => {
    const mockProfiles = [MOCK_PROFILE];
    vi.mocked(PetProfileDb.findByCustomer).mockResolvedValue(mockProfiles as any);

    const result = await PetProfileService.getProfilesByCustomer(MOCK_SHOP, MOCK_CUSTOMER_ID);
    expect(result).toEqual(mockProfiles);
    expect(PetProfileDb.findByCustomer).toHaveBeenCalledWith(MOCK_SHOP, MOCK_CUSTOMER_ID);
  });
  
  it("should get a single profile by ID", async () => {
    vi.mocked(PetProfileDb.findById).mockResolvedValue(MOCK_PROFILE as any);

    const result = await PetProfileService.getProfile(MOCK_SHOP, MOCK_PROFILE_ID);
    expect(result).toEqual(MOCK_PROFILE);
    expect(PetProfileDb.findById).toHaveBeenCalledWith(MOCK_SHOP, MOCK_PROFILE_ID);
  });

  it("should create a new profile", async () => {
    const createdProfile = { ...MOCK_CREATE_INPUT, id: "new-id" };
    vi.mocked(PetProfileDb.create).mockResolvedValue(createdProfile as any);

    const result = await PetProfileService.createProfile(MOCK_SHOP, MOCK_CREATE_INPUT);
    expect(result).toEqual(createdProfile);
    expect(PetProfileDb.create).toHaveBeenCalledWith(MOCK_SHOP, MOCK_CREATE_INPUT);
  });

  it("should update an existing profile", async () => {
    const updatedProfile = { ...MOCK_PROFILE, name: MOCK_UPDATE_INPUT.name };
    vi.mocked(PetProfileDb.update).mockResolvedValue(updatedProfile as any);

    const result = await PetProfileService.updateProfile(MOCK_SHOP, MOCK_PROFILE_ID, MOCK_UPDATE_INPUT);
    expect(result).toEqual(updatedProfile);
    expect(PetProfileDb.update).toHaveBeenCalledWith(MOCK_SHOP, MOCK_PROFILE_ID, MOCK_UPDATE_INPUT);
  });

  it("should delete a profile by ID", async () => {
    vi.mocked(PetProfileDb.delete).mockResolvedValue(undefined);

    await PetProfileService.deleteProfile(MOCK_SHOP, MOCK_PROFILE_ID);
    expect(PetProfileDb.delete).toHaveBeenCalledWith(MOCK_SHOP, MOCK_PROFILE_ID);
  });
});
