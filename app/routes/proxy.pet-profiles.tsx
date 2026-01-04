import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import { PetProfileService, CreatePetProfileSchema, UpdatePetProfileSchema } from "../modules/PetProfiles";

// Helper to ensure consistent JSON responses with correct headers
const jsonResponse = (data: any, status = 200) => {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      "Pragma": "no-cache",
      "Expires": "0",
      "Access-Control-Allow-Origin": "*" // Often needed for proxies
    }
  });
};

export const loader = async ({ request }: LoaderFunctionArgs) => {
  try {
    const { session } = await authenticate.public.appProxy(request);
    
    if (!session) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    const url = new URL(request.url);
    const customerId = url.searchParams.get("logged_in_customer_id");

    if (!customerId) {
      return jsonResponse({ error: "Customer not logged in" }, 403);
    }

    const profiles = await PetProfileService.getProfilesByCustomer(session.shop, customerId);
    const settings = await PetProfileService.getSettings(session.shop);
    const activePet = profiles.find(p => p.isSelected);

    return jsonResponse({ 
      profiles, 
      settings: settings || { types: [] }, 
      activePetId: activePet?.id || null 
    });
  } catch (error: any) {
    console.error("Proxy loader error:", error);
    return jsonResponse({ error: "Internal Server Error", details: error.message }, 500);
  }
};

export const action = async ({ request }: ActionFunctionArgs) => {
  try {
    const { session } = await authenticate.public.appProxy(request);

    if (!session) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    const url = new URL(request.url);
    const customerId = url.searchParams.get("logged_in_customer_id");

    if (!customerId) {
      return jsonResponse({ error: "Customer not logged in" }, 403);
    }

    const formData = await request.formData();
    const intent = formData.get("intent");

    switch (intent) {
      case "create": {
        const payload = JSON.parse(formData.get("data") as string);
        const validated = CreatePetProfileSchema.parse({ 
          ...payload, 
          shop: session.shop,
          shopifyId: customerId,
          type: payload.type || "Dog"
        });
        const profile = await PetProfileService.createProfile(session.shop, validated);
        return jsonResponse({ profile });
      }

      case "update": {
        const id = formData.get("id") as string;
        const payload = JSON.parse(formData.get("data") as string);
        const validated = UpdatePetProfileSchema.parse(payload);
        const profile = await PetProfileService.updateProfile(session.shop, id, validated);
        return jsonResponse({ profile });
      }

      case "delete": {
        const id = formData.get("id") as string;
        await PetProfileService.deleteProfile(session.shop, id);
        return jsonResponse({ success: true });
      }

      case "set_active": {
        const petId = formData.get("petId") as string;
        if (!petId) throw new Error("petId is required");

        // Verification: Ensure the pet belongs to the logged-in customer
        const profiles = await PetProfileService.getProfilesByCustomer(session.shop, customerId);
        const ownsPet = profiles.some(p => p.id === petId);

        if (!ownsPet) {
          return jsonResponse({ error: "Pet not found or unauthorized" }, 403);
        }

        await PetProfileService.setActiveProfile(session.shop, customerId, petId);
        
        return jsonResponse({ activePetId: petId });
      }

      default:
        return jsonResponse({ error: "Invalid intent" }, 400);
    }
  } catch (error: any) {
    console.error("Proxy action error:", error);
    return jsonResponse({ error: error.message || "An unexpected error occurred" }, 400);
  }
};
