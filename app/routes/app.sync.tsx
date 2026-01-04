import type { LoaderFunctionArgs, ActionFunctionArgs } from "react-router";
import { useLoaderData, useFetcher, useRevalidator, useNavigate } from "react-router";
import { useEffect, useRef } from "react";
import { 
  Page, 
  Layout, 
  Card, 
  Text, 
  BlockStack, 
  InlineStack, 
  Button, 
  Box, 
  EmptyState, 
  Badge,
  Banner,
  ProgressBar
} from "@shopify/polaris";
import { useAppBridge } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";
import { ProductRuleService } from "../modules/ProductRules";
import type { BulkOperationStatus } from "../modules/ProductRules";
import { boundary } from "@shopify/shopify-app-react-router/server";

interface ActionData {
  success: boolean;
  timestamp?: number;
  error?: string;
  result?: any;
}

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin } = await authenticate.admin(request);
  const status = await ProductRuleService.getSyncStatus(admin);
  return { status };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { admin } = await authenticate.admin(request);
  
  const status = await ProductRuleService.getSyncStatus(admin);
  if (status?.status === "RUNNING" || status?.status === "CREATED") {
      return { success: false, error: "Sync already in progress" };
  }

  try {
    const result = await ProductRuleService.syncProducts(admin);
    return { result, success: true, timestamp: Date.now() };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "An unknown error occurred";
    return { error: message, success: false };
  }
};

export default function SyncPage() {
  const { status } = useLoaderData<typeof loader>() as { status: BulkOperationStatus | null };
  const fetcher = useFetcher<ActionData>();
  const revalidator = useRevalidator();
  const shopify = useAppBridge();
  const navigate = useNavigate();
  
  const isSubmitting = fetcher.state !== "idle";
  const isRunning = status?.status === "RUNNING" || status?.status === "CREATED";
  const pollTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastSubmissionRef = useRef<number | null>(null);

  // Handle toast notifications only once per submission
  useEffect(() => {
    const data = fetcher.data;
    if (data?.success && data.timestamp !== undefined && data.timestamp !== lastSubmissionRef.current) {
      lastSubmissionRef.current = data.timestamp;
      shopify.toast.show("Bulk operation initiated successfully");
      revalidator.revalidate();
    } else if (data?.error) {
      shopify.toast.show(`Error: ${data.error}`, { isError: true });
    }
  }, [fetcher.data, shopify, revalidator]);

  useEffect(() => {
    if (isRunning && revalidator.state === "idle") {
        pollTimerRef.current = setTimeout(() => {
            revalidator.revalidate();
        }, 10000);
    }

    return () => {
        if (pollTimerRef.current) {
            clearTimeout(pollTimerRef.current);
        }
    };
  }, [isRunning, revalidator.state, revalidator]);

  const startSync = () => {
    if (isRunning || isSubmitting) return;
    fetcher.submit({}, { method: "POST" });
  };

  return (
    <Page 
      title="Product Sync"
      backAction={{ content: "Dashboard", onAction: () => navigate("/app") }}
    >
      <Layout>
        <Layout.Section>
          {!status ? (
            <Card>
              <EmptyState
                heading="Sync your products to get started"
                action={{
                  content: "Start Bulk Sync",
                  onAction: startSync,
                  loading: isSubmitting,
                  disabled: isSubmitting
                }}
                image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
              >
                <p>Syncing your products allows Pet-Matcher to automatically match them with the right pet profiles based on your rules.</p>
              </EmptyState>
            </Card>
          ) : (
            <BlockStack gap="500">
              {isRunning && (
                <Banner title="Sync in progress" tone="info">
                  <p>Your products are being synchronized. This process may take a few minutes depending on your catalog size.</p>
                </Banner>
              )}
              
              <Card>
                <BlockStack gap="400">
                  <InlineStack align="space-between">
                     <Text as="h2" variant="headingMd">Current Status</Text>
                     <Badge tone={isRunning ? "info" : status.status === "COMPLETED" ? "success" : "critical"}>
                       {status.status}
                     </Badge>
                  </InlineStack>

                  {isRunning && (
                    <Box paddingBlock="200">
                        <ProgressBar progress={80} tone="primary" size="small" />
                        <Box paddingBlockStart="200">
                            <Text as="p" variant="bodySm" tone="subdued" alignment="center">Processing...</Text>
                        </Box>
                    </Box>
                  )}
                  
                  {status.objectCount && (
                    <Box padding="400" background="bg-surface-secondary" borderRadius="200">
                      <BlockStack gap="200">
                        <Text as="p" variant="bodyMd" fontWeight="bold">Statistics</Text>
                        <InlineStack align="space-between">
                           <Text as="p" variant="bodyMd">Objects Processed:</Text>
                           <Text as="span" fontWeight="bold">{String(status.objectCount)}</Text>
                        </InlineStack>
                      </BlockStack>
                    </Box>
                  )}

                  <Box>
                    <Button 
                      disabled={isSubmitting || isRunning} 
                      onClick={startSync}
                      loading={isSubmitting}
                      variant="primary"
                      fullWidth
                    >
                      {isSubmitting ? "Starting Sync..." : isRunning ? "Sync in Progress" : "Start New Bulk Sync"}
                    </Button>
                  </Box>
                </BlockStack>
              </Card>

              {fetcher.data?.result && (
                <Card>
                  <BlockStack gap="400">
                    <Text as="h2" variant="headingMd">Latest Operation Details</Text>
                    <Box padding="400" background="bg-surface-secondary" borderRadius="200">
                      <pre style={{ margin: 0, overflow: "auto" }}>
                        {JSON.stringify(fetcher.data.result, null, 2)}
                      </pre>
                    </Box>
                  </BlockStack>
                </Card>
              )}
            </BlockStack>
          )}
        </Layout.Section>
      </Layout>
    </Page>
  );
}

export { ErrorBoundary } from "../components/ErrorBoundary";
