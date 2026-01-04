import { describe, it, expect, vi } from "vitest";
import { action, loader } from "../../app/routes/app.pet-profiles";
import { PetProfileService } from "../../app/modules/PetProfiles";
import {
  createMockContext,
  createMockActionRequest,
  createMockLoaderRequest,
} from "../utils";

// Mock the PetProfileService to control data returned by the domain layer
vi.mock("../../app/modules/PetProfiles", async (importOriginal) => {
  const original: any = await importOriginal();
  return {
    ...original,
    PetProfileService: {
      getProfilesByCustomer: vi.fn(),
      createProfile: vi.fn(),
      updateProfile: vi.fn(),
      deleteProfile: vi.fn(),
      getSettings: vi.fn().mockResolvedValue({ types: [] }), // Mock getSettings
    },
    CreatePetProfileSchema: { parse: (data: any) => data }, // Mock Zod to simply return data
    UpdatePetProfileSchema: { parse: (data: any) => data }, // Mock Zod to simply return data
  };
});

// Mock the Shopify authenticate utility, which is now done in tests/utils.ts
vi.mock("../../app/shopify.server", () => ({
  authenticate: {
    public: {
      appProxy: vi.fn().mockResolvedValue({
        session: { shop: "test-shop.myshopify.com" },
      }),
    },
  },
}));

const MOCK_SHOP = "test-shop.myshopify.com";
const MOCK_CUSTOMER_ID = "8005291409477";
const MOCK_PROFILE_ID = "pet-uuid-123";
const LOADER_URL = `/?logged_in_customer_id=${MOCK_CUSTOMER_ID}`;
const ACTION_URL = LOADER_URL;

describe("App Proxy: proxy.pet-profiles.tsx", () => {
  describe("Loader", () => {
    it("should return profiles for a logged-in customer", async () => {
      const mockProfiles = [{ id: MOCK_PROFILE_ID, name: "Buddy" }];
      vi.mocked(PetProfileService.getProfilesByCustomer).mockResolvedValue(mockProfiles as any);

      const request = createMockLoaderRequest(LOADER_URL);
      const context = createMockContext({ request });
      
      const response = await loader(context as any);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.profiles).toEqual(mockProfiles);
      expect(PetProfileService.getProfilesByCustomer).toHaveBeenCalledWith(
        MOCK_SHOP,
        MOCK_CUSTOMER_ID
      );
    });

    it("should return 403 if customerId is missing", async () => {
      const request = createMockLoaderRequest("/"); // URL without customerId
      const context = createMockContext({ request });
      
      const response = await loader(context as any);
      const body = await response.json();

      expect(response.status).toBe(403);
      expect(body.error).toBe("Customer not logged in");
    });
  });

  describe("Action", () => {
    it("should handle 'create' intent successfully", async () => {
      const mockInput = { name: "New Pet", breed: "Dog", type: "Dog", birthday: null, attributes: {} };
      const createdProfile = { id: "new-id", ...mockInput };
      vi.mocked(PetProfileService.createProfile).mockResolvedValue(createdProfile as any);

      const request = createMockActionRequest(ACTION_URL, {
        intent: "create",
        data: JSON.stringify(mockInput),
      });
      const context = createMockContext({ request });

      const response = await action(context as any);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.profile.name).toBe("New Pet");
      expect(PetProfileService.createProfile).toHaveBeenCalledWith(MOCK_SHOP, {
        ...mockInput,
        shop: MOCK_SHOP,
        shopifyId: MOCK_CUSTOMER_ID,
      });
    });

    it("should handle 'update' intent successfully", async () => {
      const mockInput = { name: "Updated Pet", birthday: "2020-01-01T00:00:00.000Z" };
      const updatedProfile = { id: MOCK_PROFILE_ID, ...mockInput };
      vi.mocked(PetProfileService.updateProfile).mockResolvedValue(updatedProfile as any);

      const request = createMockActionRequest(ACTION_URL, {
        intent: "update",
        id: MOCK_PROFILE_ID,
        data: JSON.stringify(mockInput),
      });
      const context = createMockContext({ request });

      const response = await action(context as any);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.profile.name).toBe("Updated Pet");
      expect(PetProfileService.updateProfile).toHaveBeenCalledWith(
        MOCK_SHOP,
        MOCK_PROFILE_ID,
        mockInput
      );
    });

    it("should handle 'delete' intent successfully", async () => {
      vi.mocked(PetProfileService.deleteProfile).mockResolvedValue(undefined);

      const request = createMockActionRequest(ACTION_URL, {
        intent: "delete",
        id: MOCK_PROFILE_ID,
      });
      const context = createMockContext({ request });

      const response = await action(context as any);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
      expect(PetProfileService.deleteProfile).toHaveBeenCalledWith(
        MOCK_SHOP,
        MOCK_PROFILE_ID
      );
    });

    it("should return 400 for invalid intent", async () => {
      const request = createMockActionRequest(ACTION_URL, { intent: "invalid" });
      const context = createMockContext({ request });

      const response = await action(context as any);
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.error).toBe("Invalid intent");
    });

    it("should return 403 if customerId is missing", async () => {
      const request = createMockActionRequest("/", { intent: "create" }); // URL without customerId
      const context = createMockContext({ request });

      const response = await action(context as any);
      const body = await response.json();

      expect(response.status).toBe(403);
      expect(body.error).toBe("Customer not logged in");
    });
  });
});

