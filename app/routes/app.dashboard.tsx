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
  Badge,
  Grid,
  Icon
} from "@shopify/polaris";
import { 
  ChartVerticalIcon, 
  CheckCircleIcon, 
  ProductIcon,
  CreditCardIcon 
} from "@shopify/polaris-icons";
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

export default function Dashboard() {
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
    <Page 
      title="Dashboard" 
      subtitle="Overview of your pet matching performance"
      primaryAction={{
        content: "Sync Products",
        onAction: () => navigate("/app/sync"),
      }}
    >
      <Layout>
        <Layout.Section>
          <Grid>
            <Grid.Cell columnSpan={{xs: 6, sm: 4, md: 4, lg: 4, xl: 4}}>
              <Card>
                <BlockStack gap="200">
                  <InlineStack align="space-between">
                    <Text as="h3" variant="headingSm">Total Pet Profiles</Text>
                    <Icon source={ChartVerticalIcon} tone="base" />
                  </InlineStack>
                  <Text as="p" variant="heading2xl">{String(summary.totalMatches)}</Text>
                  <Text as="p" variant="bodySm" tone="subdued">All time matches</Text>
                </BlockStack>
              </Card>
            </Grid.Cell>
            <Grid.Cell columnSpan={{xs: 6, sm: 4, md: 4, lg: 4, xl: 4}}>
              <Card>
                <BlockStack gap="200">
                  <InlineStack align="space-between">
                    <Text as="h3" variant="headingSm">Active Rules</Text>
                    <Icon source={CheckCircleIcon} tone="base" />
                  </InlineStack>
                  <Text as="p" variant="heading2xl">{String(summary.activeRules)}</Text>
                  <Text as="p" variant="bodySm" tone="subdued">Matching logic active</Text>
                </BlockStack>
              </Card>
            </Grid.Cell>
            <Grid.Cell columnSpan={{xs: 6, sm: 4, md: 4, lg: 4, xl: 4}}>
              <Card>
                <BlockStack gap="200">
                  <InlineStack align="space-between">
                    <Text as="h3" variant="headingSm">Plan Usage</Text>
                    <Icon source={CreditCardIcon} tone="base" />
                  </InlineStack>
                  <Text as="p" variant="heading2xl">{matchCount} / 50</Text>
                  <Text as="p" variant="bodySm" tone="subdued">Current Plan: {plan}</Text>
                </BlockStack>
              </Card>
            </Grid.Cell>
          </Grid>
        </Layout.Section>

        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">Quick Actions</Text>
              <InlineStack gap="300">
                <Button onClick={() => navigate("/app/sync")}>
                  Manage Sync Operations
                </Button>
                <Button onClick={() => navigate("/app/audit")}>
                  Run Performance Audit
                </Button>
                <Button onClick={() => navigate("/app/pet-types")}>
                  Configure Pet Types
                </Button>
              </InlineStack>
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
