import type { LoaderFunctionArgs, HeadersFunction } from "react-router";
import { useLoaderData, useNavigate } from "react-router";
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
  Badge
} from "@shopify/polaris";
import { 
  ProductIcon, 
  SettingsIcon, 
  HomeIcon,
  ChevronRightIcon
} from "@shopify/polaris-icons";
import { authenticate } from "../shopify.server";
import { AnalyticsService } from "../modules/Analytics";
import { boundary } from "@shopify/shopify-app-react-router/server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const summary = await AnalyticsService.getSummary(session.shop);
  return { summary };
};

export default function Index() {
  const navigate = useNavigate();
  const { summary } = useLoaderData<typeof loader>();

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
                <Text as="h2" variant="headingMd">Setup Guide</Text>
                
                <BlockStack gap="300">
                  <BoxStep 
                    step="1" 
                    icon={ProductIcon}
                    title="Sync Your Products"
                    description="Import your product catalog from Shopify to enable smart matching rules."
                    action={() => navigate("/app/sync")}
                    actionText="Go to Sync"
                    badge={summary.syncedProductsCount > 0 ? { text: "Completed", tone: "success" } : { text: "Required", tone: "attention" }}
                  />
                  
                  <BoxStep 
                    step="2" 
                    icon={SettingsIcon}
                    title="Configure Pet Types"
                    description="Define the types of pets you support and their specific attributes."
                    action={() => navigate("/app/pet-types")}
                    actionText="Manage Pet Types"
                  />
                  
                  <BoxStep 
                    step="3" 
                    icon={HomeIcon}
                    title="View Dashboard"
                    description="Monitor your app's performance and business insights."
                    action={() => navigate("/app/dashboard")}
                    actionText="Open Dashboard"
                    primary
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
                  </List>
                </Box>
              </BlockStack>
            </Card>
          </BlockStack>
        </Layout.Section>
      </Layout>
    </Page>
  );
}

function BoxStep({ step, icon, title, description, action, actionText, primary, badge }: { 
  step: string; 
  icon: any;
  title: string; 
  description: string; 
  action: () => void;
  actionText: string;
  primary?: boolean;
  badge?: { text: string; tone: "success" | "attention" | "info" };
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
        <div style={{ flex: 1 }}>
          <BlockStack gap="100">
            <InlineStack gap="200" align="start">
               <Badge tone={badge?.tone || "info"} size="small">{badge?.text || ("Step " + step)}</Badge>
               <Text as="h3" variant="headingSm">{title}</Text>
            </InlineStack>
            <Text as="p" variant="bodyMd" tone="subdued">{description}</Text>
          </BlockStack>
        </div>
        <Button onClick={action} variant={primary ? "primary" : undefined} icon={ChevronRightIcon}>
          {actionText}
        </Button>
      </InlineStack>
    </Box>
  );
}

export { ErrorBoundary } from "../components/ErrorBoundary";

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
