import type { LoaderFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import { SessionService } from "../modules/Core/SessionService";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);

  if (session) {
    await SessionService.deleteSessions(session.shop);
  }

  return new Response();
};
