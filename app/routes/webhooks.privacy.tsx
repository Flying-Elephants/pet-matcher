import type { ActionFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import { PetProfileService } from "../modules/PetProfiles";
import { SessionService } from "../modules/Core/SessionService";

export const action = async ({ request }: ActionFunctionArgs) => {
  const { topic, shop, payload } = await authenticate.webhook(request);

  console.log(`Received privacy webhook ${topic} for ${shop}`);

  switch (topic) {
    case "CUSTOMERS_REDACT":
      console.log(`GDPR: Redacting customer data for shop ${shop}`);
      const customerId = (payload as any).customer?.id;
      if (customerId) {
        await PetProfileService.deleteCustomerData(shop, String(customerId));
      }
      break;
    case "SHOP_REDACT":
      console.log(`GDPR: Redacting shop data for ${shop}`);
      await Promise.all([
        PetProfileService.deleteShopData(shop),
        SessionService.deleteSessions(shop)
      ]);
      break;
    case "CUSTOMERS_DATA_REQUEST":
      console.log(`GDPR: Customer data request for shop ${shop}`);
      // Typically returns 200 and processes out-of-band if needed.
      // We log it to acknowledge receipt.
      break;
  }

  return new Response();
};
