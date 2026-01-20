// app/routes/app.billing.tsx

import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { useActionData, useLoaderData, useNavigation, useSubmit } from "react-router";
import {
  Page,
  Layout,
  Card,
  BlockStack,
  InlineStack,
  Text,
  Button,
  Box,
  ProgressBar,
  Badge,
  Divider,
  Icon,
  Banner,
} from "@shopify/polaris";
import { CheckIcon, StarFilledIcon, InfoIcon } from "@shopify/polaris-icons";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { authenticate } from "../shopify.server";
import { BillingService, type SubscriptionPlan } from "../modules/Billing";
import { PageGuide } from "../components/PageGuide";
import { GUIDE_CONTENT } from "../modules/Core/guide-content";
import { SkeletonLoadingPage } from "../components/SkeletonLoadingPage";
import { STAGGER_CONTAINER_VARIANTS, STAGGER_ITEM_VARIANTS, FADE_IN_VARIANTS } from "../modules/Core/animations";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  // 1. Authenticate immediately to handle Token Exchange
  const { admin, session } = await authenticate.admin(request);
  const shop = session.shop;

  // 2. Sync subscription status with Shopify (Reconcile)
  await BillingService.syncSubscription(admin, shop);
  
  // 3. Get the latest status from our DB
  const status = await BillingService.getSubscriptionStatus(admin, shop);

  return { status };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const url = new URL(request.url);
  if (url.protocol === "http:") {
    url.protocol = "https:";
    request = new Request(url.toString(), request);
  }

  const { admin, session, billing } = await authenticate.admin(request);
  const formData = await request.formData();
  const plan = formData.get("plan") as SubscriptionPlan;
  
  if (!plan || !["FREE", "GROWTH", "ENTERPRISE"].includes(plan)) {
    return { error: "Invalid plan selected" };
  }

  const host = url.host;
  const returnUrl = `https://${host}/app/billing`;
  
  try {
    if (plan === "FREE") {
      await BillingService.cancelSubscription(admin, session.shop);
      return { success: true };
    } else {
      const result = await BillingService.upgrade(admin, billing, plan, returnUrl);

      if (result.confirmationUrl) {
        return { confirmationUrl: result.confirmationUrl };
      }
      
      return { error: "Failed to initiate upgrade." };
    }
  } catch (error: any) {
    if (error instanceof Response) {
      throw error;
    }
    
    console.error("Billing Action Error:", error);
    return { error: error.message || "An unexpected error occurred during billing" };
  }
};

export default function BillingSettings() {
  const data = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();

  // Skeleton loading state
  if (navigation.state === "loading" && !data) {
    return <SkeletonLoadingPage />;
  }

  if (!data) return null;
  
  const { status } = data;
  const [guideActive, setGuideActive] = useState(false);
  const submit = useSubmit();

  // Handle the "Confirmation URL" redirect for OAuth/Billing
  useEffect(() => {
    if (actionData && 'confirmationUrl' in actionData && actionData.confirmationUrl) {
      const url = actionData.confirmationUrl as string;
      const form = document.createElement('form');
      form.method = 'GET';
      form.action = url;
      form.target = '_top'; 
      document.body.appendChild(form);
      form.submit();
    }
  }, [actionData]);

  const handlePlanChange = (plan: string) => {
    submit({ plan }, { method: "POST" });
  };

  const isProcessing = navigation.state !== "idle";

  const usagePercent = status.limits.maxMatches === 0 
    ? 0 
    : Math.min((status.usage / status.limits.maxMatches) * 100, 100);

  return (
    <Page
      title="Plans & Billing"
      secondaryActions={[
        {
          content: "Page Guide",
          icon: InfoIcon,
          onAction: () => setGuideActive(true),
        }
      ]}
    >
      <PageGuide 
        content={GUIDE_CONTENT.billing} 
        active={guideActive} 
        onClose={() => setGuideActive(false)} 
      />

      <motion.div initial="hidden" animate="visible" variants={STAGGER_CONTAINER_VARIANTS}>
        <BlockStack gap="600">
          
          {/* Usage Overview Card */}
          <motion.div variants={STAGGER_ITEM_VARIANTS}>
            <Layout>
              <Layout.Section>
                <Card padding="500">
                  <BlockStack gap="400">
                    <InlineStack align="space-between" blockAlign="center">
                      <BlockStack gap="100">
                        <Text variant="headingMd" as="h2">Usage Overview</Text>
                        <Text variant="bodySm" as="p" tone="subdued">Monitor your monthly match limits</Text>
                      </BlockStack>
                      <Badge tone={status.plan === "FREE" ? "info" : "success"}>
                        {`${status.plan} Plan`}
                      </Badge>
                    </InlineStack>
                    
                    <Divider />

                    <BlockStack gap="200">
                      <InlineStack align="space-between">
                        <Text as="p" variant="bodyMd" fontWeight="bold">Match Tokens Used</Text>
                        <Text as="p" variant="bodyMd" fontWeight="bold">
                          {status.limits.maxMatches === 0 ? "Unlimited" : `${status.usage} / ${status.limits.maxMatches}`}
                        </Text>
                      </InlineStack>
                      <ProgressBar 
                        progress={status.limits.maxMatches === 0 ? 0 : usagePercent} 
                        tone={usagePercent > 90 ? "critical" : "primary"} 
                      />
                      <Text as="p" variant="bodyXs" tone="subdued">
                        {status.plan === "FREE" 
                          ? "Upgrade to increase your monthly match limit and unlock advanced features." 
                          : "Your usage resets at the beginning of each billing cycle."}
                      </Text>
                    </BlockStack>
                  </BlockStack>
                </Card>
              </Layout.Section>
            </Layout>
          </motion.div>

          {/* Pricing Matrix */}
          <motion.div variants={STAGGER_ITEM_VARIANTS}>
            <Layout>
              <Layout.Section variant="oneThird">
                <PricingCard 
                  title="Basic"
                  price="0"
                  features={["50 Matches / mo", "5 Product Rules", "Email Support"]}
                  isCurrent={status.plan === "FREE"}
                  onAction={() => handlePlanChange("FREE")}
                  loading={isProcessing && navigation.formData?.get("plan") === "FREE"}
                  disabled={status.plan === "FREE"}
                  btnText={status.plan === "FREE" ? "Current Plan" : "Downgrade"}
                />
              </Layout.Section>

              <Layout.Section variant="oneThird">
                <PricingCard
                  title="Growth"
                  price="9.99"
                  popular
                  features={["500 Matches / mo", "25 Product Rules", "Klaviyo Sync", "Standard Support"]}
                  isCurrent={status.plan === "GROWTH"}
                  onAction={() => handlePlanChange("GROWTH")}
                  loading={isProcessing && navigation.formData?.get("plan") === "GROWTH"}
                  disabled={status.plan === "GROWTH"}
                  btnText={status.plan === "GROWTH" ? "Current Plan" : "Upgrade"}
                />
              </Layout.Section>

              <Layout.Section variant="oneThird">
                <PricingCard
                  title="Enterprise"
                  price="29.99"
                  features={["Unlimited Matches", "100 Product Rules", "Klaviyo Sync", "Priority Support"]}
                  isCurrent={status.plan === "ENTERPRISE"}
                  onAction={() => handlePlanChange("ENTERPRISE")}
                  loading={isProcessing && navigation.formData?.get("plan") === "ENTERPRISE"}
                  disabled={status.plan === "ENTERPRISE"}
                  btnText={status.plan === "ENTERPRISE" ? "Current Plan" : "Upgrade"}
                />
              </Layout.Section>
            </Layout>
          </motion.div>

          {/* Error Banner */}
          {actionData?.error && (
            <motion.div variants={FADE_IN_VARIANTS}>
              <Layout.Section>
                <Banner tone="critical" title="Billing Error">
                  <p>{actionData.error}</p>
                </Banner>
              </Layout.Section>
            </motion.div>
          )}
        </BlockStack>
      </motion.div>
    </Page>
  );
}

// Sub-component for Cleaner UI Code
function PricingCard({ 
  title, 
  price, 
  features, 
  isCurrent, 
  onAction, 
  loading, 
  disabled,
  popular,
  btnText
}: { 
  title: string, 
  price: string, 
  features: string[], 
  isCurrent: boolean, 
  onAction: () => void, 
  loading: boolean, 
  disabled: boolean,
  popular?: boolean,
  btnText: string
}) {
  return (
    <Card background={popular ? "bg-surface-secondary" : "bg-surface"}>
      <div style={{ minHeight: '440px', display: 'flex', flexDirection: 'column' }}>
        <BlockStack gap="400">
          <InlineStack align="space-between">
            <Text variant="headingMd" as="h3">{title}</Text>
            {popular && <Badge tone="attention" icon={StarFilledIcon}>Popular</Badge>}
          </InlineStack>
          
          <InlineStack gap="100" blockAlign="end">
            <Text variant="headingXl" as="p">${price}</Text>
            <Box paddingBlockEnd="100">
               <Text variant="bodySm" as="p" tone="subdued">/ month</Text>
            </Box>
          </InlineStack>

          <Divider />

          <Box paddingBlock="200">
            <BlockStack gap="300">
              {features.map((f, i) => (
                <InlineStack key={i} gap="300" align="start">
                  <Box width="20px">
                    <Icon source={CheckIcon} tone="success" />
                  </Box>
                  <div style={{ flex: 1 }}>
                    <Text variant="bodyMd" as="span">{f}</Text>
                  </div>
                </InlineStack>
              ))}
            </BlockStack>
          </Box>
        </BlockStack>

        <div style={{ marginTop: 'auto', paddingTop: '24px' }}>
          <Button 
            fullWidth 
            variant={popular ? "primary" : "secondary"}
            onClick={onAction}
            loading={loading}
            disabled={disabled}
            icon={isCurrent ? CheckIcon : undefined}
          >
            {btnText}
          </Button>
        </div>
      </div>
    </Card>
  );
}