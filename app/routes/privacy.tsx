import { Page, Layout, Card, Text, BlockStack, Box, Divider, List } from "@shopify/polaris";

export default function PrivacyPolicy() {
  return (
    <Page title="Privacy Policy">
      <Layout>
        <Layout.Section>
          <Card>
            <BlockStack gap="500">
              <BlockStack gap="200">
                <Text variant="headingLg" as="h2">Privacy & Data Protection</Text>
                <Text variant="bodyMd" as="p" tone="subdued">
                  Last Updated: January 11, 2026
                </Text>
              </BlockStack>
              
              <Divider />

              <BlockStack gap="300">
                <Text variant="headingMd" as="h3">1. Information We Collect</Text>
                <Text variant="bodyMd" as="p">
                  Pet Matcher collects specific data to provide a personalized shopping experience for your pets:
                </Text>
                <Box paddingInlineStart="400">
                  <List>
                    <List.Item>
                      <Text variant="bodyMd" as="span" fontWeight="bold">Customer Name:</Text> To associate pet profiles with the correct store account.
                    </List.Item>
                    <List.Item>
                      <Text variant="bodyMd" as="span" fontWeight="bold">Pet Details:</Text> Name, breed, type, weight, and birthday to provide accurate product matching.
                    </List.Item>
                    <List.Item>
                      <Text variant="bodyMd" as="span" fontWeight="bold">Merchant Data:</Text> Shop URL and staff contact info for billing and support.
                    </List.Item>
                  </List>
                </Box>
              </BlockStack>

              <BlockStack gap="300">
                <Text variant="headingMd" as="h3">2. How We Use Your Data</Text>
                <Text variant="bodyMd" as="p">
                  We use the collected information strictly for:
                </Text>
                <Box paddingInlineStart="400">
                  <List>
                    <List.Item>Generating "Perfect Fit" product recommendations.</List.Item>
                    <List.Item>Calculating weight-based product dosages or suitability.</List.Item>
                    <List.Item>Maintaining a history of pet profiles for returning customers.</List.Item>
                  </List>
                </Box>
              </BlockStack>

              <BlockStack gap="300">
                <Text variant="headingMd" as="h3">3. Data Protection & GDPR</Text>
                <Text variant="bodyMd" as="p">
                  We comply with Shopify's mandatory privacy webhooks:
                </Text>
                <Box paddingInlineStart="400">
                  <List>
                    <List.Item>
                      <Text variant="bodyMd" as="span" fontWeight="bold">Customer Redaction:</Text> When a customer requests data deletion via Shopify, we automatically purge their pet profiles.
                    </List.Item>
                    <List.Item>
                      <Text variant="bodyMd" as="span" fontWeight="bold">Shop Redaction:</Text> When the app is uninstalled, all store data is flagged for deletion within 48 hours.
                    </List.Item>
                  </List>
                </Box>
              </BlockStack>

              <BlockStack gap="300">
                <Text variant="headingMd" as="h3">4. Merchant Responsibilities</Text>
                <Text variant="bodyMd" as="p">
                  By using Pet Matcher, merchants agree to maintain their own privacy policies that inform customers about the use of third-party apps for personalization.
                </Text>
              </BlockStack>

              <Divider />

              <BlockStack gap="200">
                <Text variant="bodySm" as="p" tone="subdued">
                  For any privacy-related inquiries, please contact support through the Shopify Partners dashboard.
                </Text>
              </BlockStack>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
