import { data, type LoaderFunctionArgs, type ActionFunctionArgs } from "react-router";
import {
  Page,
  Layout,
  Card,
  Text,
  BlockStack,
  InlineStack,
  Button,
  Box,
  Icon,
  Banner,
  ProgressBar,
  Badge,
  Divider,
} from "@shopify/polaris";
import { 
  HeartIcon, 
  ProductIcon, 
  SettingsIcon, 
  PlusIcon,
  RefreshIcon,
  CheckIcon,
  ExternalIcon,
  SearchIcon,
  ChartVerticalIcon,
  CreditCardIcon,
  InfoIcon,
  ViewIcon,
} from "@shopify/polaris-icons";
import { useLoaderData, useFetcher, useRevalidator, useNavigate } from "react-router";
import { useEffect, useMemo, useRef } from "react";
import { useAppBridge } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";
import { ProductRuleService } from "../modules/ProductRules";
import { AnalyticsService } from "../modules/Analytics";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);
  
  const [syncStatus, analytics] = await Promise.all([
    ProductRuleService.getSyncStatus(admin),
    AnalyticsService.getSummary(session.shop),
  ]);

  return data({ 
    syncStatus, 
    hasProducts: analytics.syncedProductsCount > 0 
  });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);
  const formData = await request.formData();
  const actionType = formData.get("actionType");

  if (actionType === "START_SYNC") {
    try {
      console.log(`[ACTION:START_SYNC] Shop: ${session.shop}`);
      await ProductRuleService.syncProducts(admin);
      return data({ success: true, type: "START_SYNC", timestamp: Date.now() });
    } catch (error) {
      console.error(`[ACTION:START_SYNC] Error:`, error);
      return { success: false, error: error instanceof Error ? error.message : "Failed to start sync" };
    }
  }

  if (actionType === "PROCESS_SYNC") {
    const url = formData.get("url") as string;
    console.log(`[ACTION:PROCESS_SYNC] Shop: ${session.shop}, URL: ${url}`);
    if (!url) return { success: false, error: "No URL provided" };
    try {
      const count = await ProductRuleService.processSync(url, session.shop);
      console.log(`[ACTION:PROCESS_SYNC] Success: Processed ${count} products`);
      return data({ success: true, processedCount: count, type: "PROCESS_SYNC", timestamp: Date.now() });
    } catch (error) {
      console.error(`[ACTION:PROCESS_SYNC] Error:`, error);
      // Return 401 specifically if that's what's happening to test the ErrorBoundary theory
      if (error instanceof Error && error.message.includes("401")) {
         throw new Response("Unauthorized from action", { status: 401 });
      }
      return { success: false, error: error instanceof Error ? error.message : "Failed to process sync" };
    }
  }

  return { success: false, error: "Unknown action" };
};

export default function Welcome() {
  const { syncStatus, hasProducts } = useLoaderData<typeof loader>();
  const fetcher = useFetcher<any>();
  const revalidator = useRevalidator();
  const shopify = useAppBridge();
  const navigate = useNavigate();
  const lastProcessedActionRef = useRef<number | null>(null);

  const isSyncing = syncStatus?.status === "RUNNING" || syncStatus?.status === "CREATED";
  const isCompleted = syncStatus?.status === "COMPLETED" || syncStatus?.status === "COMPLETED_WITH_ERRORS";

  // Sync Progress Calculation
  const syncProgress = useMemo(() => {
    if (hasProducts && !isSyncing && !isCompleted) return 100;
    if (isSyncing) {
      const count = Number(syncStatus?.objectCount || 0);
      return Math.min(Math.max(5, Math.round((count / 100) * 100)), 95);
    }
    if (isCompleted) return 100;
    return 0;
  }, [hasProducts, isSyncing, isCompleted, syncStatus]);

  // Polling logic for sync
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (isSyncing && revalidator.state === "idle") {
      timer = setTimeout(() => revalidator.revalidate(), 5000);
    }
    return () => { if (timer) clearTimeout(timer); };
  }, [isSyncing, revalidator.state, revalidator.revalidate]);

  // Auto-sync on first load if no products
  useEffect(() => {
    if (!hasProducts && !isSyncing && !isCompleted && fetcher.state === "idle") {
      const formData = new FormData();
      formData.append("actionType", "START_SYNC");
      fetcher.submit(formData, { method: "POST" });
    }
  }, [hasProducts, isSyncing, isCompleted, fetcher]);

  // Handle Fetcher Results
  useEffect(() => {
    if (fetcher.state === "idle" && fetcher.data?.success) {
      const currentTimestamp = fetcher.data.timestamp;
      if (currentTimestamp && currentTimestamp !== lastProcessedActionRef.current) {
        lastProcessedActionRef.current = currentTimestamp;
        if (fetcher.data.type === "PROCESS_SYNC") {
          shopify.toast.show(`Processed ${fetcher.data.processedCount} products`);
        } else if (fetcher.data.type === "START_SYNC") {
          shopify.toast.show("Sync initiated");
        }
        revalidator.revalidate();
      }
    } else if (fetcher.state === "idle" && fetcher.data?.error) {
      shopify.toast.show(fetcher.data.error, { isError: true });
    }
  }, [fetcher.data, fetcher.state, shopify, revalidator]);

  const handleStartSync = () => {
    const formData = new FormData();
    formData.append("actionType", "START_SYNC");
    fetcher.submit(formData, { method: "POST" });
  };

  const handleProcessSync = () => {
    if (isCompleted && syncStatus?.url) {
      const formData = new FormData();
      formData.append("actionType", "PROCESS_SYNC");
      formData.append("url", syncStatus.url);
      fetcher.submit(formData, { method: "POST" });
    }
  };

  const isUpToDate = Boolean(hasProducts && !isSyncing && (!isCompleted || !syncStatus?.url || syncStatus.url === ""));
  const showSyncControls = !isUpToDate;

  return (
    <Page>
      <Layout>
        <Layout.Section>
          <Box paddingBlockEnd="500">
            <BlockStack gap="200" align="center">
              <Box padding="400">
                <img
                  src="/pmlogo.png"
                  alt="Pet Matcher Logo"
                  style={{
                    width: '120px',
                    height: 'auto',
                    display: 'block',
                    margin: '0 auto'
                  }}
                />
              </Box>
              <Text as="h1" variant="heading2xl" alignment="center">
                Pet Matcher: Product & Pet Match
              </Text>
              <Text as="p" variant="bodyLg" tone="subdued" alignment="center">
                The perfect fit for every pet. Turn uncertainty into confidence with personalized product recommendations.
              </Text>
            </BlockStack>
          </Box>
        </Layout.Section>

        {/* Step-by-Step Guide - Fixed cards */}
        <Layout.Section>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(3, 1fr)', 
            gap: 'var(--p-space-400)',
          }}>
            {/* Step 1: Sync */}
            <Card padding="500">
              <div style={{ minHeight: '340px', display: 'flex', flexDirection: 'column' }}>
                <BlockStack gap="400">
                  <InlineStack align="space-between">
                    <Box padding="300" background="bg-surface-secondary" borderRadius="200" width="fit-content">
                      <Icon source={ProductIcon} tone="base" />
                    </Box>
                    {isSyncing && <Text as="span" variant="bodyXs" tone="subdued">Syncing...</Text>}
                    {isUpToDate ? <Badge tone="success" icon={CheckIcon}>Synced</Badge> : null}
                  </InlineStack>
                  <BlockStack gap="200">
                    <Text as="h2" variant="headingMd">1. Fit & Forget Sync</Text>
                    <Text as="p" variant="bodyMd" tone="subdued">
                      Auto-syncs with your catalog using Bulk Operations. No manual updates needed.
                    </Text>
                    {isSyncing && (
                      <Box paddingBlock="200">
                        <ProgressBar progress={syncProgress} size="small" />
                      </Box>
                    )}
                    {isCompleted && !isSyncing && syncStatus?.url && syncStatus.url !== "" && (
                      <Banner
                        tone="warning"
                        action={{
                          content: "Process Sync",
                          onAction: handleProcessSync,
                          loading: fetcher.state !== "idle" && fetcher.formData?.get("actionType") === "PROCESS_SYNC"
                        }}
                      >
                        <p>Sync complete.</p>
                      </Banner>
                    )}
                  </BlockStack>
                </BlockStack>
                {showSyncControls && (
                  <div style={{ marginTop: 'auto', paddingTop: 'var(--p-space-400)' }}>
                    <Button 
                      onClick={handleStartSync} 
                      icon={RefreshIcon} 
                      fullWidth
                      loading={fetcher.state !== "idle" && fetcher.formData?.get("actionType") === "START_SYNC"}
                      disabled={isSyncing}
                    >
                      {hasProducts ? "Refresh Catalog" : "Start Sync"}
                    </Button>
                  </div>
                )}
              </div>
            </Card>

            {/* Step 2: Attributes */}
            <Card padding="500">
              <div style={{ minHeight: '340px', display: 'flex', flexDirection: 'column' }}>
                <BlockStack gap="400">
                  <Box padding="300" background="bg-surface-secondary" borderRadius="200" width="fit-content">
                    <Icon source={SettingsIcon} tone="base" />
                  </Box>
                  <BlockStack gap="200">
                    <Text as="h2" variant="headingMd">2. Breed Logic</Text>
                    <Text as="p" variant="bodyMd" tone="subdued">
                      Smart recommendations for 200+ breeds. The logic engine that knows pets.
                    </Text>
                  </BlockStack>
                </BlockStack>
                <div style={{ marginTop: 'auto', paddingTop: 'var(--p-space-400)' }}>
                  <Button onClick={() => navigate("/app/pet-types")} fullWidth>
                    Setup Pet Types
                  </Button>
                </div>
              </div>
            </Card>

            {/* Step 3: Rules */}
            <Card padding="500">
              <div style={{ minHeight: '340px', display: 'flex', flexDirection: 'column' }}>
                <BlockStack gap="400">
                  <Box padding="300" background="bg-surface-secondary" borderRadius="200" width="fit-content">
                    <Icon source={PlusIcon} tone="base" />
                  </Box>
                  <BlockStack gap="200">
                    <Text as="h2" variant="headingMd">3. Perfect Fit Guarantee</Text>
                    <Text as="p" variant="bodyMd" tone="subdued">
                      Match pets to products based on breed, weight, and age. Reduce returns.
                    </Text>
                  </BlockStack>
                </BlockStack>
                <div style={{ marginTop: 'auto', paddingTop: 'var(--p-space-400)' }}>
                  <Button onClick={() => navigate("/app/rules")} variant="primary" fullWidth>
                    Build First Rule
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </Layout.Section>

        {/* Detailed Application Guide */}
        <Layout.Section>
          <Card>
            <BlockStack gap="500">
              <Box padding="600">
                <BlockStack gap="400">
                  <InlineStack align="space-between" blockAlign="center">
                    <BlockStack gap="100">
                      <Text as="h2" variant="headingLg">Detailed Guide</Text>
                      <Text as="p" variant="bodyMd" tone="subdued">
                        Unlock the power of Personalization with our Retention Engine.
                      </Text>
                    </BlockStack>
                    <div style={{ marginLeft: 'auto' }}>
                      <Icon source={InfoIcon} tone="base" />
                    </div>
                  </InlineStack>
                  
                  <Divider />
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--p-space-800)', paddingTop: 'var(--p-space-400)' }}>
                    <BlockStack gap="400">
                      <InlineStack gap="200">
                        <Box padding="100" background="bg-surface-info" borderRadius="100">
                          <Icon source={ViewIcon} tone="info" />
                        </Box>
                        <Text as="h3" variant="headingMd">Storefront Components</Text>
                      </InlineStack>
                      <BlockStack gap="300">
                        <Box>
                          <Text as="p" fontWeight="bold">Floating Profile Trigger</Text>
                          <Text as="p" variant="bodySm" tone="subdued">A fixed action button that allows customers to create and switch between pet profiles from any page.</Text>
                        </Box>
                        <Box>
                          <Text as="p" fontWeight="bold">Dynamic Product Badges</Text>
                          <Text as="p" variant="bodySm" tone="subdued">Embedded on product pages, these badges show a "Match" or "No Match" status based on the active pet's attributes.</Text>
                        </Box>
                      </BlockStack>
                    </BlockStack>

                    <BlockStack gap="400">
                      <InlineStack gap="200">
                        <Box padding="100" background="bg-surface-success" borderRadius="100">
                          <Icon source={CheckIcon} tone="success" />
                        </Box>
                        <Text as="h3" variant="headingMd">The Matching Engine</Text>
                      </InlineStack>
                      <BlockStack gap="300">
                        <Box>
                          <Text as="p" fontWeight="bold">Personalization Logic</Text>
                          <Text as="p" variant="bodySm" tone="subdued">Our logic engine matches pets based on breed, weight, and age for the 'Perfect Fit'.</Text>
                        </Box>
                        <Box>
                          <Text as="p" fontWeight="bold">Retention Engine</Text>
                          <Text as="p" variant="bodySm" tone="subdued">Capture birthdays and 'Gotcha Days' to power high-conversion marketing emails.</Text>
                        </Box>
                      </BlockStack>
                    </BlockStack>
                  </div>
                </BlockStack>
              </Box>

              {/* Bottom Quick Actions Bar */}
              <Box padding="400" background="bg-surface-secondary">
                <InlineStack align="space-between" blockAlign="center">
                  <InlineStack gap="400">
                    <Button variant="plain" onClick={() => navigate("/app/dashboard")} icon={ChartVerticalIcon}>Analytics</Button>
                    <Button variant="plain" onClick={() => navigate("/app/pet-profiles-admin")} icon={SearchIcon}>Profiles</Button>
                    <Button variant="plain" onClick={() => navigate("/app/billing")} icon={CreditCardIcon}>Billing</Button>
                  </InlineStack>
                  <Button 
                    url="https://help.shopify.com" 
                    external 
                    icon={ExternalIcon}
                    variant="tertiary"
                  >
                    Documentation
                  </Button>
                </InlineStack>
              </Box>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
