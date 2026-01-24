import type { ActionFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import { ProductRuleService } from "../modules/ProductRules";

export const action = async ({ request }: ActionFunctionArgs) => {
  const { topic, shop, payload, admin } = await authenticate.webhook(request);

  console.log(`Received product webhook ${topic} for ${shop}`);

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
  }

  return new Response();
};
