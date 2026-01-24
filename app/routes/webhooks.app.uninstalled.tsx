import type { ActionFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import { SessionService } from "../modules/Core/SessionService";

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session } = await authenticate.webhook(request);

  if (session) {
    await SessionService.deleteSessions(session.shop);
  }

  return new Response();
};
