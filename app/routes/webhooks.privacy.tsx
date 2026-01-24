import type { ActionFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import { PetProfileService } from "../modules/PetProfiles";
import { SessionService } from "../modules/Core/SessionService";

type ShopRedactPayload = {
  shop_id: number;
  shop_domain: string;
};

type CustomerRedactPayload = {
  shop_id: number;
  shop_domain: string;
  customer: {
    id: number;
    email: string;
    phone: string;
  };
  orders_to_redact: number[];
};

type CustomerDataRequestPayload = {
  shop_id: number;
  shop_domain: string;
  orders_requested: number[];
  customer: {
    id: number;
    email: string;
    phone: string;
  };
  data_request: {
    id: number;
  };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { topic, shop, payload } = await authenticate.webhook(request);

  console.log(`Received privacy webhook ${topic} for ${shop}`);

  switch (topic) {
    case "CUSTOMERS_REDACT": {
      const p = payload as unknown as CustomerRedactPayload;
      console.log(`GDPR: Redacting customer data for shop ${shop}, customer ${p.customer.id}`);
      if (p.customer?.id) {
        await PetProfileService.deleteCustomerData(shop, String(p.customer.id));
      }
      break;
    }
    case "SHOP_REDACT": {
      console.log(`GDPR: Redacting shop data for ${shop}`);
      await Promise.all([
        PetProfileService.deleteShopData(shop),
        SessionService.deleteSessions(shop)
      ]);
      break;
    }
    case "CUSTOMERS_DATA_REQUEST": {
      const p = payload as unknown as CustomerDataRequestPayload;
      console.log(`GDPR: Customer data request for shop ${shop}, customer ${p.customer.id}`);
      // Typically returns 200 and processes out-of-band if needed.
      // We log it to acknowledge receipt.
      break;
    }
  }

  return new Response();
};
