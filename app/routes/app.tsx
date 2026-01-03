import type { HeadersFunction, LoaderFunctionArgs } from "react-router";
import { Outlet, useLoaderData } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { AppProvider } from "@shopify/shopify-app-react-router/react";

import { authenticate } from "../shopify.server";

declare global {
  namespace JSX {
    interface IntrinsicElements {
      's-app-nav': { children?: React.ReactNode };
      's-link': { children?: React.ReactNode; href?: string; target?: string };
      's-page': { children?: React.ReactNode; heading?: string };
      's-section': { children?: React.ReactNode; heading?: string; slot?: string };
      's-stack': { children?: React.ReactNode; direction?: "block" | "inline"; gap?: string };
      's-box': { children?: React.ReactNode; padding?: string; "border-width"?: string; "border-radius"?: string };
      's-heading': { children?: React.ReactNode };
      's-text': {
        children?: React.ReactNode;
        variant?: "headingLg" | "headingMd" | "bodyMd";
        tone?: "critical" | "success";
      };
    }
  }
}

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await authenticate.admin(request);

  // eslint-disable-next-line no-undef
  return { apiKey: process.env.SHOPIFY_API_KEY || "" };
};

export default function App() {
  const { apiKey } = useLoaderData<typeof loader>();

  return (
    <AppProvider embedded apiKey={apiKey}>
      <s-app-nav>
        <s-link href="/app">Home</s-link>
        <s-link href="/app/sync">Product Sync</s-link>
        <s-link href="/app/additional">Additional page</s-link>
      </s-app-nav>
      <Outlet />
    </AppProvider>
  );
}

export { ErrorBoundary } from "../components/ErrorBoundary";

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
