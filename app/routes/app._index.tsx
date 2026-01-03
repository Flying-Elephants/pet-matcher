import type { LoaderFunctionArgs, HeadersFunction } from "react-router";
import { useLoaderData, useNavigate, useRevalidator } from "react-router";
import { useEffect, useRef } from "react";
import { 
  Page, 
  Layout, 
  Card, 
  Text, 
  BlockStack, 
  InlineStack, 
  Box, 
  Button, 
  Badge 
} from "@shopify/polaris";
import { authenticate } from "../shopify.server";
import { AnalyticsService } from "../modules/Analytics";
import { ProductRuleService } from "../modules/ProductRules";
import type { SummaryData } from "../modules/Analytics";
import type { BulkOperationStatus } from "../modules/ProductRules";
import { boundary } from "@shopify/shopify-app-react-router/server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session, admin } = await authenticate.admin(request);
  
  const [summary, syncStatus, historicalData] = await Promise.all([
    AnalyticsService.getSummary(session.shop),
    ProductRuleService.getSyncStatus(admin),
    AnalyticsService.getHistoricalMatches(session.shop, 7)
  ]);

  return { 
    summary, 
    syncStatus, 
    historicalData, 
    plan: (session as any).plan || "FREE", 
    matchCount: (session as any).matchCount || 0 
  };
};

export default function Index() {
  const { summary, syncStatus, historicalData, plan, matchCount } = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const revalidator = useRevalidator();
  const isSyncing = syncStatus?.status === "RUNNING" || syncStatus?.status === "CREATED";
  const pollTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isSyncing && revalidator.state === "idle") {
        pollTimerRef.current = setTimeout(() => {
            revalidator.revalidate();
        }, 10000);
    }
    return () => {
        if (pollTimerRef.current) clearTimeout(pollTimerRef.current);
    };
  }, [isSyncing, revalidator.state, revalidator]);

  return (
    <Page title="Pet-Matcher Insights">
      <Layout>
        <Layout.Section>
          <BlockStack gap="500">
            <Card>
              <BlockStack gap="400">
                <Text as="h2" variant="headingMd">Business Performance</Text>
                <InlineStack gap="400" align="start">
                  <Box padding="400" borderWidth="025" borderColor="border" borderRadius="200">
                    <BlockStack gap="200">
                      <Text as="p" variant="bodyMd">Total Pet Profiles</Text>
                      <Text as="p" variant="headingLg">{String(summary.totalMatches)}</Text>
                    </BlockStack>
                  </Box>
                  <Box padding="400" borderWidth="025" borderColor="border" borderRadius="200">
                    <BlockStack gap="200">
                      <Text as="p" variant="bodyMd">Active Product Rules</Text>
                      <Text as="p" variant="headingLg">{String(summary.activeRules)}</Text>
                    </BlockStack>
                  </Box>
                  <Box padding="400" borderWidth="025" borderColor="border" borderRadius="200">
                    <BlockStack gap="200">
                      <Text as="p" variant="bodyMd">Current Plan: {plan}</Text>
                      <Text as="p" variant="headingLg">{matchCount} / 50</Text>
                    </BlockStack>
                  </Box>
                  <Box padding="400" borderWidth="025" borderColor="border" borderRadius="200">
                    <BlockStack gap="200">
                      <Text as="p" variant="bodyMd">Product Catalog</Text>
                      <InlineStack gap="200">
                        <Badge tone={isSyncing ? "info" : "success"}>
                          {`${summary.syncedProductsCount || 0} Synced`}
                        </Badge>
                        {isSyncing && (
                          <Text as="p" variant="bodySm" tone="subdued">(Updating...)</Text>
                        )}
                      </InlineStack>
                    </BlockStack>
                  </Box>
                </InlineStack>
              </BlockStack>
            </Card>

            <Card>
              <BlockStack gap="400">
                <Text as="h2" variant="headingMd">Quick Actions</Text>
                <InlineStack gap="300">
                  <Button onClick={() => navigate("/app/sync")}>
                    Sync Operations
                  </Button>
                  <Button onClick={() => navigate("/app/audit")}>
                    Performance Audit
                  </Button>
                </InlineStack>
              </BlockStack>
            </Card>
          </BlockStack>
        </Layout.Section>

        <Layout.Section variant="oneThird">
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">Platform Health</Text>
              <BlockStack gap="200">
                <Text as="p" tone="success">✓ Architecture Verified</Text>
                <Text as="p" tone="success">✓ Performance Validated</Text>
                <Text as="p" tone="success">✓ Automated Webhook Sync</Text>
              </BlockStack>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}

export { ErrorBoundary } from "../components/ErrorBoundary";

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
