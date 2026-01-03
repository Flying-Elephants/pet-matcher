import { describe, it, expect, vi } from "vitest";
import { PetProfileService } from "../../app/modules/PetProfiles";
import { PetProfileDb } from "../../app/modules/PetProfiles/internal/db";

vi.mock("../../app/modules/PetProfiles/internal/db", () => ({
  PetProfileDb: {
    findMany: vi.fn(),
  },
}));

describe("PetProfileService", () => {
  it("should get profiles for a shop", async () => {
    const mockProfiles = [{ id: "1", name: "Buddy" }];
    vi.mocked(PetProfileDb.findMany).mockResolvedValue(mockProfiles as any);

    const result = await PetProfileService.getProfiles("test.myshopify.com");
    expect(result).toEqual(mockProfiles);
    expect(PetProfileDb.findMany).toHaveBeenCalledWith("test.myshopify.com");
  });
});
