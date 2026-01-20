import type { ActionFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import { BillingService } from "../modules/Billing";

export const action = async ({ request }: ActionFunctionArgs) => {
  const { topic, shop, admin } = await authenticate.webhook(request);

  if (!admin) {
    // Admin context is required to query Shopify for current subscription status
    return new Response();
  }

  if (topic === "APP_SUBSCRIPTIONS_UPDATE") {
    await BillingService.syncSubscription(admin, shop);
  }

  return new Response();
};
