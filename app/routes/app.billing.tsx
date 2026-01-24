// app/routes/app.billing.tsx

import type { LoaderFunctionArgs } from "react-router";
import { useLoaderData } from "react-router";
import {
  Page,
  Layout,
  Card,
  BlockStack,
  Text,
  Banner,
  Box,
} from "@shopify/polaris";
import { InfoIcon } from "@shopify/polaris-icons";
import { useState } from "react";
import { authenticate } from "../shopify.server";
import { BillingService } from "../modules/Billing";
import { PageGuide } from "../components/PageGuide";
import { GUIDE_CONTENT } from "../modules/Core/guide-content";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  console.log("[BillingDebug] Loader called with URL:", request.url);
  try {
    const { admin, session } = await authenticate.admin(request);
    console.log("[BillingDebug] Authenticated session for shop:", session.shop);
    const shop = session.shop;
    const status = await BillingService.getSubscriptionStatus(admin, shop);
    return { status };
  } catch (error) {
    console.error("[BillingDebug] Authentication failed in billing loader:", error);
    if (error instanceof Response) {
      console.log("[BillingDebug] Error is a response with status:", error.status);
      console.log("[BillingDebug] Location header:", error.headers.get("Location"));
    }
    throw error;
  }
};

export const action = async () => {
  return null;
};

export default function BillingSettings() {
  const { status } = useLoaderData<typeof loader>();
  const [guideActive, setGuideActive] = useState(false);

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

      <BlockStack gap="600">
        <Layout>
          <Layout.Section>
            <Banner tone="info" title="Open Beta Access">
              <p>
                Pet Matcher is currently in <strong>Open Beta</strong>. All features are fully unlocked and free to use.
                Billing plans will be introduced in future updates. Enjoy unlimited access while we refine the platform!
              </p>
              <p style={{ marginTop: '8px' }}>
                <strong>We need your help!</strong> Please report any bugs or share your feedback to help us shape future updates.
              </p>
            </Banner>
          </Layout.Section>

          <Layout.Section>
            <Card padding="500">
              <BlockStack gap="400">
                <Text variant="headingMd" as="h2">Current Status</Text>
                <Box padding="400" background="bg-surface-secondary" borderRadius="200">
                  <BlockStack gap="200">
                    <Text as="p" variant="bodyMd" fontWeight="bold">Plan: Open Beta (Unlimited)</Text>
                    <Text as="p" variant="bodyMd" tone="subdued">
                      You have access to all Enterprise-tier features including unlimited matches, 100+ product rules, and priority support.
                    </Text>
                  </BlockStack>
                </Box>
              </BlockStack>
            </Card>
          </Layout.Section>
        </Layout>
      </BlockStack>
    </Page>
  );
}
