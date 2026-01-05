import { useRouteError, isRouteErrorResponse, Link } from "react-router";
import { Page, Layout, Card, Text, BlockStack, Link as PolarisLink } from "@shopify/polaris";

export function ErrorBoundary() {
  const error = useRouteError();
  let errorMessage = "An unexpected error occurred.";

  if (isRouteErrorResponse(error)) {
    errorMessage = `${error.status} ${error.statusText}`;
  } else if (error instanceof Error) {
    errorMessage = error.message;
  }

  return (
    <Page title="Error">
      <Layout>
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text variant="headingMd" as="h2" tone="critical">
                Something went wrong
              </Text>
              <Text as="p">{errorMessage}</Text>
              <Link to="/app">Return to Dashboard</Link>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
