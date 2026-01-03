import type { LoaderFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import { SessionService } from "../modules/Core/SessionService";

export const loader = async ({ request }: LoaderFunctionArgs) => {
    const { session } = await authenticate.admin(request);

    if (session) {
        // payload is only available in webhook-specific authentication contexts
        // for now we trust session.scope or use any to access payload if cast
        const ctx = await authenticate.admin(request) as any;
        if (ctx.payload) {
          await SessionService.updateSession(session.id, {
              scope: ctx.payload.access_scope,
          });
        }
    }

    return new Response();
};
