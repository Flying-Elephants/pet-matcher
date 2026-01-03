import type { ActionFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import { ProductRuleService } from "../modules/ProductRules";
import { PetProfileService } from "../modules/PetProfiles";
import { SessionService } from "../modules/Core/SessionService";

export const action = async ({ request }: ActionFunctionArgs) => {
  const { topic, shop, payload, admin } = await authenticate.webhook(request);

  console.log(`Received webhook ${topic} for ${shop}`);

  switch (topic) {
    case "PRODUCTS_CREATE":
    case "PRODUCTS_UPDATE":
        const productId = (payload as any).admin_graphql_api_id || `gid://shopify/Product/${(payload as any).id}`;
        console.log(`Syncing single product on ${topic}: ${productId}`);
        if (admin) {
            await ProductRuleService.syncSingleProduct(admin, productId, shop);
        }
        break;
    case "PRODUCTS_DELETE":
        const deletedId = (payload as any).admin_graphql_api_id || `gid://shopify/Product/${(payload as any).id}`;
        console.log(`Product deleted: ${deletedId}. Cleaning up local record.`);
        await ProductRuleService.removeProduct(deletedId);
        break;
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
      // Typically returns 200 and processes out-of-band if needed
      break;
  }

  return new Response();
};
