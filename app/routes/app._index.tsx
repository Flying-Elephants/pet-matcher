import type { LoaderFunctionArgs, ActionFunctionArgs, HeadersFunction } from "react-router";
import { useLoaderData, useNavigate, useFetcher, useRevalidator } from "react-router";
import { useEffect, useRef, useMemo, useState, useCallback } from "react";
import { 
  Page, 
  Layout, 
  Card, 
  Text, 
  BlockStack, 
  InlineStack, 
  Button, 
  List,
  Banner,
  Box,
  Icon,
  Badge,
  ProgressBar,
  Modal
} from "@shopify/polaris";
import { 
  ProductIcon, 
  SettingsIcon, 
  HomeIcon,
  ChevronRightIcon,
  CheckIcon,
  RefreshIcon,
  DatabaseIcon
} from "@shopify/polaris-icons";
import { authenticate } from "../shopify.server";
import { AnalyticsService } from "../modules/Analytics";
import { ProductRuleService } from "../modules/ProductRules";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { useAppBridge } from "@shopify/app-bridge-react";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);
  const summary = await AnalyticsService.getSummary(session.shop);
  const syncStatus = await ProductRuleService.getSyncStatus(admin);
  
  return { summary, syncStatus };
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

export default function Index() {
  const navigate = useNavigate();
  const { summary, syncStatus } = useLoaderData<typeof loader>();
  const fetcher = useFetcher<any>();
  const revalidator = useRevalidator();
  const shopify = useAppBridge();
  const lastProcessedActionRef = useRef<number | null>(null);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const toggleModal = useCallback(() => setIsModalOpen((open) => !open), []);

  const isSyncing = syncStatus?.status === "RUNNING" || syncStatus?.status === "CREATED";
  const isCompleted = syncStatus?.status === "COMPLETED";
  const hasProducts = summary.syncedProductsCount > 0;

  // Auto-sync logic: ONLY trigger if NO products AND NO sync operation exists at all
  useEffect(() => {
    const isActuallyIdle = fetcher.state === "idle" && !fetcher.data;
    if (!hasProducts && !syncStatus && isActuallyIdle) {
      const formData = new FormData();
      formData.append("actionType", "START_SYNC");
      fetcher.submit(formData, { method: "POST" });
    }
  }, [hasProducts, syncStatus, fetcher.state, fetcher.data]);

  // Polling logic: Only poll when syncing and revalidator is idle
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (isSyncing && revalidator.state === "idle") {
      timer = setTimeout(() => {
        revalidator.revalidate();
      }, 5000);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [isSyncing, revalidator.state, revalidator.revalidate]);

  // Notifications & Auto-Revalidate
  useEffect(() => {
    if (fetcher.state === "idle" && fetcher.data?.success) {
      const currentTimestamp = fetcher.data.timestamp;
      
      // Only process if this is a new action result
      if (currentTimestamp && currentTimestamp !== lastProcessedActionRef.current) {
        lastProcessedActionRef.current = currentTimestamp;

        if (fetcher.data.type === "PROCESS_SYNC") {
          shopify.toast.show(`Processed ${fetcher.data.processedCount} products`);
          revalidator.revalidate();
        } else if (fetcher.data.type === "START_SYNC") {
          shopify.toast.show("Sync initiated");
          revalidator.revalidate();
        }
      }
    } else if (fetcher.state === "idle" && fetcher.data?.error) {
      shopify.toast.show(fetcher.data.error, { isError: true });
    }
  }, [fetcher.data, fetcher.state, shopify, revalidator]);

  const handleProcessSync = () => {
    if (isCompleted && syncStatus?.url && fetcher.state === "idle") {
      const formData = new FormData();
      formData.append("actionType", "PROCESS_SYNC");
      formData.append("url", syncStatus.url);
      fetcher.submit(formData, { method: "POST" });
    }
  };

  const handleStartSync = () => {
    // Only allow starting if not already syncing or starting
    if (fetcher.state !== "idle" || isSyncing) return;
    const formData = new FormData();
    formData.append("actionType", "START_SYNC");
    fetcher.submit(formData, { method: "POST" });
  };

  const syncProgress = useMemo(() => {
    if (hasProducts && !isSyncing && !isCompleted) return 100;
    if (isSyncing) {
      const count = Number(syncStatus?.objectCount || 0);
      return Math.min(Math.max(5, Math.round((count / 100) * 100)), 95);
    }
    if (isCompleted) return 100;
    return 0;
  }, [hasProducts, isSyncing, isCompleted, syncStatus]);

  const syncStepDescription = useMemo(() => {
    if (hasProducts && !isSyncing && !isCompleted) return "Your product catalog is synced.";
    if (isSyncing) return `Syncing your catalog... (${syncStatus?.objectCount || 0} objects found)`;
    if (isCompleted) return "Sync finished. Processing required to update your catalog.";
    return "Import your product catalog from Shopify.";
  }, [hasProducts, isSyncing, isCompleted, syncStatus]);

  return (
    <Page title="Welcome to Pet-Matcher">
      <Layout>
        <Layout.Section>
          <Banner title="Get Started with Pet-Matcher" onDismiss={() => {}}>
            <p>
              Follow these simple steps to set up your personalized pet product recommendation engine.
            </p>
          </Banner>
        </Layout.Section>

        <Layout.Section>
          <BlockStack gap="500">
            <Card>
              <BlockStack gap="400">
                <InlineStack align="space-between">
                  <Text as="h2" variant="headingMd">Setup Guide</Text>
                  <Button variant="tertiary" icon={RefreshIcon} onClick={toggleModal}>About Syncing</Button>
                </InlineStack>
                
                <BlockStack gap="300">
                  <BoxStep 
                    step="1" 
                    icon={ProductIcon}
                    title="Sync Your Products"
                    description={syncStepDescription}
                    progress={syncProgress}
                    isSyncing={isSyncing}
                    badge={hasProducts ? { text: "Completed", tone: "success" } : isSyncing ? { text: "Syncing", tone: "info" } : isCompleted ? { text: "Ready", tone: "info" } : { text: "Required", tone: "attention" }}
                    actions={
                      <InlineStack gap="200">
                        {isCompleted ? (
                          <>
                            <Button 
                              onClick={handleProcessSync} 
                              variant="primary" 
                              icon={DatabaseIcon} 
                              loading={fetcher.state !== "idle" && fetcher.formData?.get("actionType") === "PROCESS_SYNC"}
                            >
                              Process Sync
                            </Button>
                            <Button 
                              onClick={handleStartSync} 
                              loading={fetcher.state !== "idle" && fetcher.formData?.get("actionType") === "START_SYNC"}
                              icon={RefreshIcon}
                            >
                              Re-sync
                            </Button>
                          </>
                        ) : (
                          <Button 
                            onClick={handleStartSync} 
                            loading={fetcher.state !== "idle" && fetcher.formData?.get("actionType") === "START_SYNC"}
                            icon={RefreshIcon}
                            variant={!hasProducts && !isSyncing ? "primary" : undefined}
                          >
                            {hasProducts ? "Re-sync" : "Start Sync"}
                          </Button>
                        )}
                      </InlineStack>
                    }
                  />
                  
                  <BoxStep 
                    step="2" 
                    icon={SettingsIcon}
                    title="Configure Pet Types"
                    description="Define the types of pets you support and their specific attributes."
                    actions={
                      <Button onClick={() => navigate("/app/pet-types")} icon={ChevronRightIcon}>
                        Manage Pet Types
                      </Button>
                    }
                  />
                  
                  <BoxStep 
                    step="3" 
                    icon={HomeIcon}
                    title="View Dashboard"
                    description="Monitor your app's performance and business insights."
                    actions={
                      <Button onClick={() => navigate("/app/dashboard")} variant="primary" icon={ChevronRightIcon}>
                        Open Dashboard
                      </Button>
                    }
                  />
                </BlockStack>
              </BlockStack>
            </Card>

            <Card>
              <BlockStack gap="400">
                <Text as="h2" variant="headingMd">How it Works</Text>
                <Box padding="400" background="bg-surface-secondary" borderRadius="200">
                  <List type="bullet">
                    <List.Item>Customers visit your store and see a "Find the perfect match" widget.</List.Item>
                    <List.Item>They create a profile for their pet using your custom attributes.</List.Item>
                    <List.Item>Our engine recommends the best products based on your rules.</List.Item>
                    <List.Item>
                      <Text as="span" fontWeight="bold">Automatic Fallback:</Text> Any product without active rules will match all pet profiles by default.
                    </List.Item>
                  </List>
                </Box>
              </BlockStack>
            </Card>
          </BlockStack>
        </Layout.Section>
      </Layout>

      <Modal
        open={isModalOpen}
        onClose={toggleModal}
        title="Automated Product Syncing"
        primaryAction={{
          content: 'Got it',
          onAction: toggleModal,
        }}
      >
        <Modal.Section>
          <BlockStack gap="400">
            <Text as="p">
              Pet-Matcher automatically synchronizes your product catalog from Shopify to ensure your recommendations are always up-to-date.
            </Text>
            <Text as="p">
              When you install the app or trigger a "Re-sync", we pull your latest products. The <strong>Apply to Database</strong> button is used to finalize the sync and update our matching engine with the latest data.
            </Text>
            <Text as="p" tone="subdued">
              This manual step ensures you have control over when large catalog updates are applied to your store's recommendation logic.
            </Text>
          </BlockStack>
        </Modal.Section>
      </Modal>
    </Page>
  );
}

function ProgressRing({ progress, size = 40 }: { progress: number; size?: number }) {
  const radius = size * 0.4;
  const center = size / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle
          cx={center}
          cy={center}
          r={radius}
          stroke="var(--p-color-border-subdued)"
          strokeWidth="3"
          fill="transparent"
        />
        <circle
          cx={center}
          cy={center}
          r={radius}
          stroke="var(--p-color-text-brand)"
          strokeWidth="3"
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.5s ease' }}
        />
      </svg>
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: size,
        height: size,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        {progress === 100 ? (
          <Icon source={CheckIcon} tone="success" />
        ) : (
          <Text as="span" variant="bodyXs" fontWeight="bold">{progress}%</Text>
        )}
      </div>
    </div>
  );
}

function BoxStep({ step, icon, title, description, actions, badge, progress, isSyncing }: { 
  step: string; 
  icon: any;
  title: string; 
  description: string; 
  actions: React.ReactNode;
  badge?: { text: string; tone: "success" | "attention" | "info" };
  progress?: number;
  isSyncing?: boolean;
}) {
  return (
    <Box 
      padding="400" 
      borderWidth="025" 
      borderColor="border" 
      borderRadius="200"
      background="bg-surface"
    >
      <InlineStack gap="400" align="start" blockAlign="center">
        {progress !== undefined ? (
           <ProgressRing progress={progress} />
        ) : (
          <div style={{
            background: 'var(--p-color-bg-surface-secondary)',
            width: '40px',
            height: '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '50%'
          }}>
            <Icon source={icon} tone="base" />
          </div>
        )}
        <div style={{ flex: 1 }}>
          <BlockStack gap="100">
            <InlineStack gap="200" align="start">
               <Badge tone={badge?.tone || "info"} size="small">{badge?.text || ("Step " + step)}</Badge>
               <Text as="h3" variant="headingSm">{title}</Text>
            </InlineStack>
            <Text as="p" variant="bodyMd" tone="subdued">{description}</Text>
            {isSyncing && (
               <Box paddingBlockStart="100">
                 <ProgressBar progress={progress} size="small" tone="primary" />
               </Box>
            )}
          </BlockStack>
        </div>
        {actions}
      </InlineStack>
    </Box>
  );
}

export { ErrorBoundary } from "../components/ErrorBoundary";

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
