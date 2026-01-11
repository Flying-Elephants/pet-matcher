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
import { useState } from "react";
import { authenticate } from "../shopify.server";
import { BillingService, type SubscriptionPlan } from "../modules/Billing";
import { PageGuide } from "../components/PageGuide";
import { GUIDE_CONTENT } from "../modules/Core/guide-content";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);
  const shop = session.shop;

  await BillingService.syncSubscription(admin, shop);
  const status = await BillingService.getSubscriptionStatus(admin, shop);

  return { status };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);
  const formData = await request.formData();
  const plan = formData.get("plan") as SubscriptionPlan;
  
  if (!plan || !["GROWTH", "ENTERPRISE"].includes(plan)) {
    return { error: "Invalid plan selected" };
  }

  const returnUrl = `https://${session.shop}/admin/apps/${process.env.SHOPIFY_APP_NAME}/app/billing`;
  const result = await BillingService.upgrade(admin, plan, returnUrl);

  if (result.confirmationUrl) {
    throw new Response(null, {
      status: 302,
      headers: { Location: result.confirmationUrl },
    });
  }

  return { error: result.userErrors?.[0]?.message || "Failed to initiate upgrade" };
};

export default function BillingSettings() {
  const { status } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const [guideActive, setGuideActive] = useState(false);
  const submit = useSubmit();
  const navigation = useNavigation();

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
      backAction={{ content: "Dashboard", url: "/app/dashboard" }}
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

      <BlockStack gap="600">
        {/* Usage Overview Card */}
        <Layout>
          <Layout.Section>
            <Card>
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

        {/* Pricing Matrix */}
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
              price="19"
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

        {actionData?.error && (
          <Layout.Section>
             <Banner tone="critical" title="Billing Error">
               <p>{actionData.error}</p>
             </Banner>
          </Layout.Section>
        )}
      </BlockStack>
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
