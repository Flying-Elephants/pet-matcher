import type { LoaderFunctionArgs, ActionFunctionArgs } from "react-router";
import { data, useLoaderData, useFetcher, useRevalidator, useNavigate, useNavigation } from "react-router";
import {
  Page,
  Layout,
  Card,
  Text,
  BlockStack,
  InlineStack,
  IndexTable,
  Box,
  Badge,
  Grid,
  Button,
  Icon,
  ProgressBar,
  Banner,
  Divider,
} from "@shopify/polaris";
import { 
  InfoIcon, 
  ViewIcon, 
  PlusIcon, 
  CashDollarIcon, 
  RefreshIcon, 
  SettingsIcon, 
  ProductIcon,
} from "@shopify/polaris-icons";
import { useState, useMemo, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { authenticate } from "../shopify.server";
import { PageGuide } from "../components/PageGuide";
import { GUIDE_CONTENT } from "../modules/Core/guide-content";
import { AnalyticsService } from "../modules/Analytics";
import { BillingService } from "../modules/Billing";
import { ProductRuleService } from "../modules/ProductRules";
import { useAppBridge } from "@shopify/app-bridge-react";
import { SkeletonLoadingPage } from "../components/SkeletonLoadingPage";
import { FADE_IN_VARIANTS, STAGGER_CONTAINER_VARIANTS, STAGGER_ITEM_VARIANTS } from "../modules/Core/animations";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);

  const [analytics, historicalMatches, billing, syncStatus] = await Promise.all([
    AnalyticsService.getSummary(session.shop),
    AnalyticsService.getHistoricalMatches(session.shop, 30),
    BillingService.getSubscriptionStatus(admin, session.shop),
    ProductRuleService.getSyncStatus(admin),
  ]);

  return data({
    analytics,
    historicalMatches,
    billing,
    syncStatus,
    isGated: billing.plan === "FREE"
  });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);
  const formData = await request.formData();
  const actionType = formData.get("actionType");

  if (actionType === "START_SYNC") {
    try {
      await ProductRuleService.syncProducts(admin);
      return { success: true, type: "START_SYNC", timestamp: Date.now() };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Failed to start sync" };
    }
  }

  if (actionType === "PROCESS_SYNC") {
    const url = formData.get("url") as string;
    if (!url) return { success: false, error: "No URL provided" };
    try {
      const count = await ProductRuleService.processSync(url, session.shop);
      return { success: true, processedCount: count, type: "PROCESS_SYNC", timestamp: Date.now() };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Failed to process sync" };
    }
  }

  return { success: false, error: "Unknown action" };
};

export default function Dashboard() {
  const data = useLoaderData<typeof loader>();
  const navigation = useNavigation();

  if (navigation.state === "loading" && !data) {
    return <SkeletonLoadingPage primaryAction />;
  }

  if (!data) return null;
  const { analytics, historicalMatches, billing, syncStatus, isGated } = data;
  const [guideActive, setGuideActive] = useState(false);
  const fetcher = useFetcher<any>();
  const revalidator = useRevalidator();
  const shopify = useAppBridge();
  const navigate = useNavigate();
  const lastProcessedActionRef = useRef<number | null>(null);

  const isSyncing = syncStatus?.status === "RUNNING" || syncStatus?.status === "CREATED";
  const isCompleted = syncStatus?.status === "COMPLETED";
  const hasProducts = analytics.syncedProductsCount > 0;

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
    if (fetcher.state !== "idle" || isSyncing) return;
    const formData = new FormData();
    formData.append("actionType", "START_SYNC");
    fetcher.submit(formData, { method: "POST" });
  };

  const handleProcessSync = () => {
    if (isCompleted && syncStatus?.url && fetcher.state === "idle") {
      const formData = new FormData();
      formData.append("actionType", "PROCESS_SYNC");
      formData.append("url", syncStatus.url);
      fetcher.submit(formData, { method: "POST" });
    }
  };

  if (isGated) {
    return (
      <Page title="Dashboard">
        <motion.div initial="hidden" animate="visible" variants={FADE_IN_VARIANTS}>
          <Layout>
            <Layout.Section>
              <Banner
                title="Upgrade your plan to unlock the Dashboard"
                action={{ content: 'View Plans', onAction: () => navigate('/app/billing') }}
                tone="warning"
              >
                <p>
                  The Dashboard and Analytics features are available on our <strong>Growth</strong> and <strong>Enterprise</strong> plans. 
                  Upgrade now to track matches, monitor performance, and access quick management tools.
                </p>
              </Banner>
            </Layout.Section>
            <Layout.Section>
              <Box paddingBlockStart="400">
                <Card background="bg-surface-secondary">
                  <BlockStack gap="400" align="center">
                      <Box padding="600">
                        <BlockStack gap="400" align="center">
                          <Icon source={CashDollarIcon} tone="subdued" />
                          <Text as="h2" variant="headingLg" alignment="center">Premium Feature</Text>
                          <Text as="p" variant="bodyMd" tone="subdued" alignment="center">
                            Get deep insights into your pet-matching performance and unlock advanced rule management by upgrading your subscription.
                          </Text>
                          <Button onClick={() => navigate("/app/billing")} variant="primary" size="large">Upgrade to Unlock</Button>
                        </BlockStack>
                      </Box>
                  </BlockStack>
                </Card>
              </Box>
            </Layout.Section>
          </Layout>
        </motion.div>
      </Page>
    );
  }

  // Determine if Setup Guide should be shown
  const showSetupGuide = !hasProducts || analytics.activeRules === 0;

  return (
    <Page 
      title="Dashboard"
      secondaryActions={[
        {
          content: "Page Guide",
          icon: InfoIcon,
          onAction: () => setGuideActive(true),
        }
      ]}
    >
      <PageGuide 
        content={GUIDE_CONTENT.dashboard} 
        active={guideActive} 
        onClose={() => setGuideActive(false)} 
      />
      
      <motion.div 
        initial="hidden" 
        animate="visible" 
        variants={STAGGER_CONTAINER_VARIANTS}
      >
        <BlockStack gap="500">
          {/* Sync Status Banners */}
          <AnimatePresence mode="wait">
            {isSyncing && (
              <motion.div 
                key="syncing-banner"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
              >
                <Banner tone="info">
                  <BlockStack gap="200">
                    <Text as="p">Synchronizing your product catalog from Shopify...</Text>
                    <ProgressBar progress={syncProgress} size="small" />
                  </BlockStack>
                </Banner>
              </motion.div>
            )}

            {isCompleted && !isSyncing && (
              <motion.div 
                key="completed-banner"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
              >
                <Banner 
                  title="Product Sync Ready" 
                  tone="warning"
                  action={{
                    content: "Process Sync",
                    onAction: handleProcessSync,
                    loading: fetcher.state !== "idle" && fetcher.formData?.get("actionType") === "PROCESS_SYNC"
                  }}
                >
                  <p>Your Shopify products have been pulled. Apply the changes to update your matching database.</p>
                </Banner>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Action Bar */}
          <motion.div variants={STAGGER_ITEM_VARIANTS}>
            <Card padding="0">
              <Box padding="300">
                <InlineStack gap="300" align="start" blockAlign="center">
                  <Text as="span" variant="bodyMd" fontWeight="bold">Quick Actions:</Text>
                  <Button url="/app/rules/new" icon={PlusIcon} variant="secondary">New Rule</Button>
                  <Button url="/app/pet-profiles-admin" icon={ViewIcon} variant="secondary">Pet Profiles</Button>
                  <Button url="/app/pet-types" icon={SettingsIcon} variant="secondary">Pet Types</Button>
                  <Button onClick={handleStartSync} icon={RefreshIcon} variant="secondary" loading={fetcher.state !== "idle" && fetcher.formData?.get("actionType") === "START_SYNC"} disabled={isSyncing}>Re-sync Products</Button>
                </InlineStack>
              </Box>
            </Card>
          </motion.div>

          {/* Getting Started / Setup Guide */}
          {showSetupGuide && (
            <motion.div variants={STAGGER_ITEM_VARIANTS}>
              <Card>
                <BlockStack gap="400">
                  <Text as="h2" variant="headingMd">Getting Started: The Perfect Fit</Text>
                  <Grid columns={{ xs: 1, sm: 1, md: 3, lg: 3 }}>
                    <Box padding="300" background="bg-surface-secondary" borderRadius="200">
                      <BlockStack gap="200">
                        <InlineStack align="space-between">
                          <Icon source={ProductIcon} tone="base" />
                          {hasProducts ? <Badge tone="success">Synced</Badge> : <Badge tone="attention">Required</Badge>}
                        </InlineStack>
                        <Text as="h3" variant="headingSm">1. Fit & Forget Sync</Text>
                        <Text as="p" variant="bodySm" tone="subdued">Auto-syncs with your catalog using Bulk Operations.</Text>
                        {!hasProducts && <Button onClick={handleStartSync} size="slim" fullWidth>Start Sync</Button>}
                      </BlockStack>
                    </Box>
                    <Box padding="300" background="bg-surface-secondary" borderRadius="200">
                      <BlockStack gap="200">
                        <InlineStack align="space-between">
                          <Icon source={SettingsIcon} tone="base" />
                          <Badge tone="info">Step 2</Badge>
                        </InlineStack>
                        <Text as="h3" variant="headingSm">2. Breed Logic</Text>
                        <Text as="p" variant="bodySm" tone="subdued">Define attributes for smart recommendations.</Text>
                        <Button onClick={() => navigate("/app/pet-types")} size="slim" fullWidth>Manage Types</Button>
                      </BlockStack>
                    </Box>
                    <Box padding="300" background="bg-surface-secondary" borderRadius="200">
                      <BlockStack gap="200">
                        <InlineStack align="space-between">
                          <Icon source={PlusIcon} tone="base" />
                          {analytics.activeRules > 0 ? <Badge tone="success">Done</Badge> : <Badge tone="attention">Step 3</Badge>}
                        </InlineStack>
                        <Text as="h3" variant="headingSm">3. Retention Engine</Text>
                        <Text as="p" variant="bodySm" tone="subdued">Capture birthdays and link products to breeds.</Text>
                        <Button onClick={() => navigate("/app/rules/new")} size="slim" fullWidth variant="primary">Create Rule</Button>
                      </BlockStack>
                    </Box>
                  </Grid>
                </BlockStack>
              </Card>
            </motion.div>
          )}

          {/* KPI Row */}
          <motion.div variants={STAGGER_ITEM_VARIANTS}>
            <Grid columns={{ xs: 1, sm: 2, md: 4, lg: 4 }}>
              <KPICard title="Total Matches" value={analytics.totalMatches} trend="+12%" trendTone="success" />
              <KPICard title="Active Rules" value={analytics.activeRules} />
              <KPICard title="Pet Profiles" value={analytics.totalPetProfiles} trend="+5%" trendTone="success" />
              <KPICard title="Synced Products" value={analytics.syncedProductsCount} />
            </Grid>
          </motion.div>

          <motion.div variants={STAGGER_ITEM_VARIANTS}>
            <Layout>
              {/* Historical Activity */}
              <Layout.Section>
                <Card>
                  <BlockStack gap="400">
                    <Text as="h2" variant="headingMd">Match Activity (Last 30 Days)</Text>
                    <IndexTable
                      resourceName={{ singular: "event", plural: "events" }}
                      itemCount={historicalMatches.length}
                      headings={[{ title: "Date" }, { title: "Match Count" }]}
                      selectable={false}
                    >
                      {historicalMatches.length === 0 ? (
                        <IndexTable.Row id="empty" position={0}>
                          <IndexTable.Cell colSpan={2}>
                            <Box padding="400">
                              <Text as="p" alignment="center" tone="subdued">No match activity recorded yet.</Text>
                            </Box>
                          </IndexTable.Cell>
                        </IndexTable.Row>
                      ) : (
                        historicalMatches.map((event, index) => (
                          <IndexTable.Row id={event.date} key={event.date} position={index}>
                            <IndexTable.Cell>
                              <Text variant="bodyMd" fontWeight="bold" as="span">{event.date}</Text>
                            </IndexTable.Cell>
                            <IndexTable.Cell>{event.matchCount}</IndexTable.Cell>
                          </IndexTable.Row>
                        ))
                      )}
                    </IndexTable>
                  </BlockStack>
                </Card>
              </Layout.Section>

              {/* Side Panels */}
              <Layout.Section variant="oneThird">
                <BlockStack gap="500">
                  <Card>
                    <BlockStack gap="300">
                      <Text as="h2" variant="headingMd">Plan Usage</Text>
                      <Divider />
                      <BlockStack gap="200">
                        <InlineStack align="space-between">
                          <Badge tone={billing.plan === "FREE" ? "info" : "success"}>{billing.plan}</Badge>
                          <Text as="p" variant="bodySm" tone="subdued">
                            {billing.limits.maxMatches === 0 ? billing.usage : `${billing.usage} / ${billing.limits.maxMatches}`}
                          </Text>
                        </InlineStack>
                        {billing.limits.maxMatches > 0 && (
                          <ProgressBar
                            progress={Math.min((billing.usage / billing.limits.maxMatches) * 100, 100)}
                            tone={billing.usage >= billing.limits.maxMatches ? "critical" : "primary"}
                          />
                        )}
                        <Button url="/app/billing" variant="tertiary" size="slim" icon={CashDollarIcon}>Manage Subscription</Button>
                      </BlockStack>
                    </BlockStack>
                  </Card>

                  <Card>
                    <BlockStack gap="300">
                      <Text as="h2" variant="headingMd">Top Performing Rules</Text>
                      <Divider />
                      {analytics.topPerformingRules.length === 0 ? (
                        <Text as="p" tone="subdued">No rules triggered yet.</Text>
                      ) : (
                        <BlockStack gap="200">
                          {analytics.topPerformingRules.map((rule, i) => (
                            <InlineStack key={i} align="space-between">
                              <Text as="span" variant="bodyMd">{rule.ruleName}</Text>
                              <Badge tone="info">{String(rule.count)}</Badge>
                            </InlineStack>
                          ))}
                        </BlockStack>
                      )}
                    </BlockStack>
                  </Card>

                  <Card>
                    <BlockStack gap="300">
                      <Text as="h2" variant="headingMd">Popular Breeds</Text>
                      <Divider />
                      <Grid columns={{ xs: 2 }}>
                        {analytics.popularBreeds.length === 0 ? (
                          <Text as="p" tone="subdued">No data.</Text>
                        ) : (
                          analytics.popularBreeds.slice(0, 4).map((item, i) => (
                            <Box key={i} padding="200" background="bg-surface-secondary" borderRadius="100">
                              <BlockStack gap="0" align="center">
                                <Text as="p" variant="headingSm">{item.count}</Text>
                                <Text as="p" variant="bodyXs" tone="subdued" truncate>{item.breed}</Text>
                              </BlockStack>
                            </Box>
                          ))
                        )}
                      </Grid>
                    </BlockStack>
                  </Card>
                </BlockStack>
              </Layout.Section>
            </Layout>
          </motion.div>
        </BlockStack>
      </motion.div>
    </Page>
  );
}

function KPICard({ title, value, trend, trendTone }: { title: string, value: string | number, trend?: string, trendTone?: "success" | "critical" }) {
  return (
    <Card>
      <BlockStack gap="100">
        <Text as="h2" variant="headingSm" tone="subdued">{title}</Text>
        <InlineStack align="space-between" blockAlign="center">
          <Text as="p" variant="headingLg" fontWeight="bold">{value}</Text>
          {trend && (
            <Badge tone={trendTone}>{trend}</Badge>
          )}
        </InlineStack>
      </BlockStack>
    </Card>
  );
}
