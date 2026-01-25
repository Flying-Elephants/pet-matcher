import { Page, Layout, Card, Text, BlockStack, List, Banner, Box, Link, InlineStack, Button } from "@shopify/polaris";
import { ExternalIcon } from "@shopify/polaris-icons";
import { useLoaderData } from "react-router";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }: { request: Request }) => {
  const { session } = await authenticate.admin(request);
  return { shop: session.shop };
};

export default function SetupGuide() {
  const { shop } = useLoaderData<typeof loader>();
  const themeEditorUrl = `https://admin.shopify.com/store/${shop.replace(".myshopify.com", "")}/themes/current/editor?context=apps`;

  return (
    <Page title="Setup Guide">
      <Layout>
        <Layout.Section>
          <Banner title="Welcome to Pet Matcher!" tone="success">
            <p>Follow these simple steps to get your pet personalization engine running.</p>
          </Banner>
        </Layout.Section>

        <Layout.Section>
          <BlockStack gap="500">
            
            {/* Step 1: Install App Embed */}
            <Card>
              <BlockStack gap="400">
                <Text variant="headingMd" as="h2">1. Enable the App Embed</Text>
                <Text variant="bodyMd" as="p">
                  To show the "My Pets" button on your storefront, you must enable the App Embed in your theme editor.
                </Text>
                
                <Banner tone="info">
                  <Text variant="bodyMd" as="p" fontWeight="bold">Important Note:</Text>
                  <Text variant="bodyMd" as="p">
                    The "My Pets" button is visible to <strong>all visitors</strong>. However, the form to add/manage pets is <strong>only accessible to logged-in customers</strong>. 
                    Guests will be prompted to log in when they click the button.
                  </Text>
                </Banner>

                <BlockStack gap="200">
                  <Text variant="bodyMd" as="p" fontWeight="bold">Instructions:</Text>
                  <List type="number">
                    <List.Item>Click the button below to open your Theme Editor.</List.Item>
                    <List.Item>In the left sidebar, click the <strong>App Embeds</strong> icon (paintbrush/block icon).</List.Item>
                    <List.Item>Search for <strong>"Pet Profile Form"</strong> and toggle it <strong>ON</strong>.</List.Item>
                    <List.Item>Click <strong>Save</strong> in the top right corner.</List.Item>
                  </List>
                </BlockStack>

                <InlineStack align="start">
                  <Button url={themeEditorUrl} target="_blank" icon={ExternalIcon} variant="primary">
                    Open Theme Editor
                  </Button>
                </InlineStack>
              </BlockStack>
            </Card>

            {/* Step 2: Configure Settings */}
            <Card>
              <BlockStack gap="400">
                <Text variant="headingMd" as="h2">2. Configure Pet Settings</Text>
                <Text variant="bodyMd" as="p">
                  Before customers can add pets, you need to define what kind of pets you support.
                </Text>
                <List type="bullet">
                  <List.Item>
                    Go to <Link url="/app/pet-types">Pet Types & Breeds</Link> to add types (e.g., Dog, Cat) and their breeds.
                  </List.Item>
                  <List.Item>
                    Go to <Link url="/app/settings">Settings</Link> to customize the look and feel of the "My Pets" button (colors, text, icon).
                  </List.Item>
                </List>
              </BlockStack>
            </Card>

            {/* Step 3: Create Rules */}
            <Card>
              <BlockStack gap="400">
                <Text variant="headingMd" as="h2">3. Create Product Rules</Text>
                <Text variant="bodyMd" as="p">
                  Define how products match to pets based on their attributes.
                </Text>
                <List type="bullet">
                  <List.Item>
                    Go to <Link url="/app/rules">Product Rules</Link> to create new matching logic.
                  </List.Item>
                  <List.Item>
                    Example: "If Pet Weight is {">"} 20kg, Match with 'Large Dog Food'".
                  </List.Item>
                </List>
              </BlockStack>
            </Card>

            {/* Step 4: Verify */}
            <Card>
              <BlockStack gap="400">
                <Text variant="headingMd" as="h2">4. Test & Verify</Text>
                <Text variant="bodyMd" as="p">
                  Visit your storefront as a customer to verify everything works.
                </Text>
                <Box paddingInlineStart="400">
                  <List type="number">
                    <List.Item>Open your online store.</List.Item>
                    <List.Item>Verify the "My Pets" floating button appears (bottom right by default).</List.Item>
                    <List.Item>Click it. If you are not logged in, you should see a Login Prompt.</List.Item>
                    <List.Item>Log in with a customer account.</List.Item>
                    <List.Item>Add a pet profile and verify it saves correctly.</List.Item>
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
