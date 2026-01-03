import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import { PetProfileService, CreatePetProfileSchema, UpdatePetProfileSchema } from "../modules/PetProfiles";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.public.appProxy(request);
  
  if (!session) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  const url = new URL(request.url);
  const customerId = url.searchParams.get("logged_in_customer_id");

  if (!customerId) {
    return new Response(JSON.stringify({ error: "Customer not logged in" }), { status: 403 });
  }

  const profiles = await PetProfileService.getProfilesByCustomer(session.shop, customerId);
  return new Response(JSON.stringify({ profiles }), { 
    headers: { "Content-Type": "application/json" } 
  });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session } = await authenticate.public.appProxy(request);

  if (!session) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  const url = new URL(request.url);
  const customerId = url.searchParams.get("logged_in_customer_id");

  if (!customerId) {
    return new Response(JSON.stringify({ error: "Customer not logged in" }), { status: 403 });
  }

  const formData = await request.formData();
  const intent = formData.get("intent");

  try {
    switch (intent) {
      case "create": {
        const payload = JSON.parse(formData.get("data") as string);
        const validated = CreatePetProfileSchema.parse({ 
          ...payload, 
          shop: session.shop,
          shopifyId: customerId 
        });
        const profile = await PetProfileService.createProfile(session.shop, validated);
        return new Response(JSON.stringify({ profile }), { 
          headers: { "Content-Type": "application/json" } 
        });
      }

      case "update": {
        const id = formData.get("id") as string;
        const payload = JSON.parse(formData.get("data") as string);
        const validated = UpdatePetProfileSchema.parse(payload);
        const profile = await PetProfileService.updateProfile(session.shop, id, validated);
        return new Response(JSON.stringify({ profile }), { 
          headers: { "Content-Type": "application/json" } 
        });
      }

      case "delete": {
        const id = formData.get("id") as string;
        await PetProfileService.deleteProfile(session.shop, id);
        return new Response(JSON.stringify({ success: true }), { 
          headers: { "Content-Type": "application/json" } 
        });
      }

      default:
        return new Response(JSON.stringify({ error: "Invalid intent" }), { status: 400 });
    }
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 400 });
  }
};
