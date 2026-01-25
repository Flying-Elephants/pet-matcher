import type { HeadersFunction, LoaderFunctionArgs } from "react-router";
import { Link, Outlet, useLoaderData, useNavigation } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { AppProvider } from "@shopify/shopify-app-react-router/react";
import { AppProvider as PolarisProvider, ProgressBar } from "@shopify/polaris";
import polarisStyles from "@shopify/polaris/build/esm/styles.css?url";
import enTranslations from "@shopify/polaris/locales/en.json";

import { authenticate } from "../shopify.server";

export const links = () => [{ rel: "stylesheet", href: polarisStyles }];

function PolarisLink({ children, url = "", external, ref, ...rest }: any) {
  if (external || url.startsWith("http")) {
    return (
      <a href={url} ref={ref} {...rest} rel={external ? "noopener noreferrer" : undefined} target={external ? "_blank" : undefined}>
        {children}
      </a>
    );
  }
  return (
    <Link to={url} ref={ref} {...rest}>
      {children}
    </Link>
  );
}

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await authenticate.admin(request);

  // eslint-disable-next-line no-undef
  return { apiKey: process.env.SHOPIFY_API_KEY || "" };
};

export default function App() {
  const { apiKey } = useLoaderData<typeof loader>();
  const navigation = useNavigation();
  const isNavigating = navigation.state !== "idle";

  return (
    <AppProvider embedded apiKey={apiKey}>
      <PolarisProvider i18n={enTranslations} linkComponent={PolarisLink}>
        <ui-nav-menu>
          <a href="/app" rel="home">Home</a>
          <a href="/app/guide">Setup Guide</a>
          <a href="/app/dashboard">Dashboard</a>
          <a href="/app/pet-types">Pet Types</a>
          <a href="/app/pet-profiles-admin">Pet Profiles</a>
          <a href="/app/rules">Matching Rules</a>
          <a href="/app/billing">Billing</a>
          <a href="/app/settings">Settings</a>
          
        </ui-nav-menu>
        {isNavigating && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 999 }}>
            <ProgressBar size="small" />
          </div>
        )}
        <Outlet />
      </PolarisProvider>
    </AppProvider>
  );
}

export { ErrorBoundary } from "../components/ErrorBoundary";

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
