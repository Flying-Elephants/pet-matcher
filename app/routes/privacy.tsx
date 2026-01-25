import { Page, Layout, Card, Text, BlockStack, Box, Divider, List, Link } from "@shopify/polaris";
import polarisStyles from "@shopify/polaris/build/esm/styles.css?url";
import type { Route } from "./+types/privacy";

export const links: Route.LinksFunction = () => [
  { rel: "stylesheet", href: polarisStyles },
];

export default function PrivacyPolicy() {
  const effectiveDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <Page title="Privacy Policy">
      <Layout>
        <Layout.Section>
          <Card>
            <BlockStack gap="500">
              <BlockStack gap="200">
                <Text variant="headingLg" as="h1">Privacy Policy</Text>
                <Text variant="bodyMd" as="p" tone="subdued">
                  Effective Date: {effectiveDate}
                </Text>
              </BlockStack>

              <Text variant="bodyMd" as="p">
                At <strong>Pet Matcher</strong> ("we", "us", "our"), we are committed to protecting your privacy and ensuring the security of your personal information. This Privacy Policy explains how we collect, use, and share information about you when you use our application through the Shopify platform.
              </Text>

              <Divider />

              <BlockStack gap="300">
                <Text variant="headingMd" as="h2">1. Information We Collect</Text>
                <Text variant="bodyMd" as="p">
                  We collect information to provide our services, improve our app, and comply with legal requirements.
                </Text>
                
                <Box paddingInlineStart="400">
                  <BlockStack gap="400">
                    <Box>
                      <Text variant="bodyMd" as="h3" fontWeight="bold">Merchant Information</Text>
                      <List>
                        <List.Item>Store Name, URL, and Contact Email.</List.Item>
                        <List.Item>Staff account information (for app access/billing).</List.Item>
                      </List>
                    </Box>
                    <Box>
                      <Text variant="bodyMd" as="h3" fontWeight="bold">Customer Information (Processed on behalf of Merchant)</Text>
                      <List>
                        <List.Item>Name and Email (to associate Pet Profiles).</List.Item>
                        <List.Item>Pet Data: Name, Breed, Weight, Age, and other attributes defined in Pet Profiles.</List.Item>
                        <List.Item>Order history (used for product matching recommendations).</List.Item>
                      </List>
                    </Box>
                    <Box>
                      <Text variant="bodyMd" as="h3" fontWeight="bold">Device Information</Text>
                      <List>
                        <List.Item>IP address, browser type, and time zone setting.</List.Item>
                        <List.Item>Cookies and similar tracking technologies (strictly necessary for app functionality).</List.Item>
                      </List>
                    </Box>
                  </BlockStack>
                </Box>
              </BlockStack>

              <Divider />

              <BlockStack gap="300">
                <Text variant="headingMd" as="h2">2. How We Use Your Information</Text>
                <Text variant="bodyMd" as="p">We use the collected information for the following purposes:</Text>
                <Box paddingInlineStart="400">
                  <List>
                    <List.Item>To provide and maintain the Pet Matcher service (e.g., matching pets to products).</List.Item>
                    <List.Item>To improve and optimize our application.</List.Item>
                    <List.Item>To communicate with merchants regarding updates, billing, or support.</List.Item>
                    <List.Item>To comply with applicable laws and regulations.</List.Item>
                  </List>
                </Box>
              </BlockStack>

              <Divider />

              <BlockStack gap="300">
                <Text variant="headingMd" as="h2">3. Sharing Your Information</Text>
                <Text variant="bodyMd" as="p">We do not sell your personal data. We may share information with:</Text>
                <Box paddingInlineStart="400">
                  <List>
                    <List.Item><strong>Shopify:</strong> To function within the Shopify ecosystem.</List.Item>
                    <List.Item><strong>Service Providers:</strong> Third-party vendors who assist with hosting (e.g., Google Cloud), database management, and support.</List.Item>
                    <List.Item><strong>Legal Obligations:</strong> If required by law, court order, or government regulation.</List.Item>
                  </List>
                </Box>
              </BlockStack>

              <Divider />

              <BlockStack gap="300">
                <Text variant="headingMd" as="h2">4. Your Rights (GDPR & CCPA)</Text>
                <BlockStack gap="200">
                  <Text variant="bodyMd" as="p">
                    If you are a resident of the European Economic Area (EEA) or California, you have specific rights regarding your data.
                  </Text>
                  <Box paddingInlineStart="400">
                    <List>
                      <List.Item><strong>Access & Correction:</strong> You have the right to request access to and correction of your personal data.</List.Item>
                      <List.Item><strong>Deletion:</strong> You may request the deletion of your personal data ("Right to be Forgotten").</List.Item>
                      <List.Item><strong>Data Portability:</strong> You may request a copy of your data in a structured format.</List.Item>
                    </List>
                  </Box>
                  <Text variant="bodyMd" as="p" tone="subdued">
                    <strong>Note to Customers:</strong> As we process data on behalf of Merchants, please direct your privacy requests to the Merchant (Store Owner) directly. We assist Merchants in fulfilling these requests via Shopify's privacy webhooks.
                  </Text>
                </BlockStack>
              </BlockStack>

              <Divider />

              <BlockStack gap="300">
                <Text variant="headingMd" as="h2">5. Data Retention</Text>
                <Text variant="bodyMd" as="p">
                  We retain your personal information only as long as necessary to provide the Service or as required by law.
                </Text>
                <Box paddingInlineStart="400">
                  <List>
                    <List.Item>Upon app uninstallation, we receive a "Shop Redact" webhook from Shopify.</List.Item>
                    <List.Item>All store-related data is scheduled for deletion within 48 hours of uninstallation.</List.Item>
                  </List>
                </Box>
              </BlockStack>

              <Divider />

              <BlockStack gap="300">
                <Text variant="headingMd" as="h2">6. Security</Text>
                <Text variant="bodyMd" as="p">
                  We implement industry-standard security measures, including encryption in transit (HTTPS) and at rest, to protect your data. However, no method of transmission over the Internet is 100% secure.
                </Text>
              </BlockStack>

              <Divider />

              <BlockStack gap="300">
                <Text variant="headingMd" as="h2">7. Contact Us</Text>
                <Text variant="bodyMd" as="p">
                  If you have questions about this Privacy Policy, please contact us via the Shopify Partner Dashboard or email us at abdullah@pawsforgood.net.
                </Text>
              </BlockStack>

            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
