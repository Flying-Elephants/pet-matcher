import type { ActionFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import { SessionService } from "../modules/Core/SessionService";

export const action = async ({ request }: ActionFunctionArgs) => {
    const { shop } = await authenticate.webhook(request);

    console.log(`Received scopes update webhook for ${shop}`);
    
    // Scopes have changed, which may invalidate the current access token.
    // We delete the session to force re-authentication and token refresh.
    await SessionService.deleteSessions(shop);

    return new Response();
};
