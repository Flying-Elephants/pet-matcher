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
import { authenticate, MONTHLY_PLAN } from "../shopify.server";
import { BillingService, type SubscriptionPlan } from "../modules/Billing";
import { PageGuide } from "../components/PageGuide";
import { GUIDE_CONTENT } from "../modules/Core/guide-content";
import { SkeletonLoadingPage } from "../components/SkeletonLoadingPage";
import { FADE_IN_VARIANTS, STAGGER_CONTAINER_VARIANTS, STAGGER_ITEM_VARIANTS } from "../modules/Core/animations";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);
  const shop = session.shop;

  await BillingService.syncSubscription(admin, shop);
  const status = await BillingService.getSubscriptionStatus(admin, shop);

  return { status };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { admin, session, billing } = await authenticate.admin(request);
  const formData = await request.formData();
  const plan = formData.get("plan") as SubscriptionPlan;
  
  if (!plan || !["GROWTH", "ENTERPRISE"].includes(plan)) {
    return { error: "Invalid plan selected" };
  }

  // Use the shop URL from session
  const url = new URL(request.url);
  const returnUrl = `${url.origin}/app/billing`;
  
  if (plan === "GROWTH") {
    try {
      return await billing.request({
        plan: MONTHLY_PLAN,
        isTest: false,
        returnUrl,
      });
    } catch (error: any) {
      if (error instanceof Response || (error.status && error.status >= 300 && error.status < 400)) {
        throw error;
      }
      console.error("Billing request error:", error);
      return { error: error.message || "Billing initialization failed" };
    }
  }
  
  try {
    const result = await BillingService.upgrade(admin, plan, returnUrl);

    if (result.confirmationUrl) {
      return { confirmationUrl: result.confirmationUrl };
    }

    return { error: result.userErrors?.[0]?.message || "Failed to initiate upgrade" };
  } catch (error: any) {
    if (error instanceof Response || (error.status && error.status >= 300 && error.status < 400)) {
      throw error;
    }
    return { error: error.message || "An unexpected error occurred during billing" };
  }
};

export default function BillingSettings() {
  const data = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();

  if (navigation.state === "loading" && !data) {
    return <SkeletonLoadingPage />;
  }

  if (!data) return null;
  const { status } = data;
  const [guideActive, setGuideActive] = useState(false);
  const submit = useSubmit();

  useEffect(() => {
    if (actionData && 'confirmationUrl' in actionData && actionData.confirmationUrl) {
      const url = actionData.confirmationUrl as string;
      // Use window.parent.location as it's the standard for breaking out of iframes in Shopify when App Bridge hook is limited
      // or if shopify.open is not available in the current version of the library.
      // However, browsers block window.parent.location.assign if origins differ.
      // The recommended way for Shopify iframes is to use the App Bridge Redirect action.
      // Given "shopify.open is not a function", we use a form post to _top as a reliable fallback.
      const form = document.createElement('form');
      form.method = 'GET';
      form.action = url;
      form.target = '_top';
      document.body.appendChild(form);
      form.submit();
    }
  }, [actionData]);

  const handleUpgrade = (plan: string) => {
    submit({ plan }, { method: "POST" });
  };

  const isUpgrading = navigation.state !== "idle";

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
                          {status.limits.maxMatches === 0 ? status.usage : `${status.usage} / ${status.limits.maxMatches}`}
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
                  onAction={() => {}}
                  loading={false}
                  disabled={true}
                />
              </Layout.Section>

              <Layout.Section variant="oneThird">
                <PricingCard
                  title="Growth"
                  price="9.99"
                  popular
                  features={["Unlimited Matches", "25 Product Rules", "Advanced Analytics (Dashboard)", "Standard Support"]}
                  isCurrent={status.plan === "GROWTH"}
                  onAction={() => handleUpgrade("GROWTH")}
                  loading={isUpgrading && navigation.formData?.get("plan") === "GROWTH"}
                  disabled={status.plan === "GROWTH" || status.plan === "ENTERPRISE"}
                />
              </Layout.Section>

              <Layout.Section variant="oneThird">
                <PricingCard
                  title="Enterprise"
                  price="49"
                  features={["Unlimited Matches", "Unlimited Product Rules", "Advanced Analytics (Dashboard)", "Priority Support"]}
                  isCurrent={status.plan === "ENTERPRISE"}
                  onAction={() => handleUpgrade("ENTERPRISE")}
                  loading={isUpgrading && navigation.formData?.get("plan") === "ENTERPRISE"}
                  disabled={status.plan === "ENTERPRISE"}
                />
              </Layout.Section>
            </Layout>
          </motion.div>

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

function PricingCard({ 
  title, 
  price, 
  features, 
  isCurrent, 
  onAction, 
  loading, 
  disabled,
  popular 
}: { 
  title: string, 
  price: string, 
  features: string[], 
  isCurrent: boolean, 
  onAction: () => void, 
  loading: boolean, 
  disabled: boolean,
  popular?: boolean
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
            {isCurrent ? "Current Plan" : title === "Basic" ? "Included" : `Upgrade to ${title}`}
          </Button>
        </div>
      </div>
    </Card>
  );
}
