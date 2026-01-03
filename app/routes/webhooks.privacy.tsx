import type { ActionFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import { ProductRuleService } from "../modules/ProductRules";

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
      // Handle customer data redaction
      break;
    case "SHOP_REDACT":
      // Handle shop data redaction
      break;
    case "CUSTOMERS_DATA_REQUEST":
      // Handle customer data request
      break;
  }

  return new Response();
};
