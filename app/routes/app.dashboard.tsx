import type { LoaderFunctionArgs } from "react-router";
import { data, useLoaderData } from "react-router";
import { Link } from "react-router";
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
} from "@shopify/polaris";
import { InfoIcon, ViewIcon, PlusIcon } from "@shopify/polaris-icons";
import { useState } from "react";
import { authenticate } from "../shopify.server";
import { PageGuide } from "../components/PageGuide";
import { GUIDE_CONTENT } from "../modules/Core/guide-content";
import { AnalyticsService } from "../modules/Analytics";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);

  const [analytics, historicalMatches] = await Promise.all([
    AnalyticsService.getSummary(session.shop),
    AnalyticsService.getHistoricalMatches(session.shop, 30)
  ]);

  return data({ analytics, historicalMatches });
};

export default function Dashboard() {
  const { analytics, historicalMatches } = useLoaderData<typeof loader>();
  const [guideActive, setGuideActive] = useState(false);

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
      
      <BlockStack gap="500">
        {/* KPI Row */}
        <Layout>
          <Layout.Section>
            <InlineStack gap="400" align="start">
              <div style={{ flex: 1, minWidth: '200px' }}>
                <Card>
                  <BlockStack gap="100">
                    <Text as="h2" variant="headingSm" tone="subdued">Total Matches</Text>
                    <Text as="p" variant="headingLg" fontWeight="bold">{analytics.totalMatches}</Text>
                  </BlockStack>
                </Card>
              </div>
              <div style={{ flex: 1, minWidth: '200px' }}>
                <Card>
                  <BlockStack gap="100">
                    <Text as="h2" variant="headingSm" tone="subdued">Active Rules</Text>
                    <Text as="p" variant="headingLg" fontWeight="bold">{analytics.activeRules}</Text>
                  </BlockStack>
                </Card>
              </div>
              <div style={{ flex: 1, minWidth: '200px' }}>
                <Card>
                  <BlockStack gap="100">
                    <Text as="h2" variant="headingSm" tone="subdued">Pet Profiles</Text>
                    <Text as="p" variant="headingLg" fontWeight="bold">{analytics.totalPetProfiles}</Text>
                  </BlockStack>
                </Card>
              </div>
              <div style={{ flex: 1, minWidth: '200px' }}>
                <Card>
                  <BlockStack gap="100">
                    <Text as="h2" variant="headingSm" tone="subdued">Synced Products</Text>
                    <Text as="p" variant="headingLg" fontWeight="bold">{analytics.syncedProductsCount}</Text>
                  </BlockStack>
                </Card>
              </div>
            </InlineStack>
          </Layout.Section>
        </Layout>

        <Layout>
          {/* Historical Activity */}
          <Layout.Section>
            <Card>
              <BlockStack gap="400">
                <Text as="h2" variant="headingMd">Match Activity (Last 30 Days)</Text>
                <Box paddingBlockEnd="400">
                  <IndexTable
                    resourceName={{ singular: "event", plural: "events" }}
                    itemCount={historicalMatches.length}
                    headings={[
                      { title: "Date" },
                      { title: "Match Count" },
                    ]}
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
                </Box>
              </BlockStack>
            </Card>
          </Layout.Section>

          {/* Top Rules */}
          <Layout.Section variant="oneThird">
            <BlockStack gap="500">
              <Card>
                <BlockStack gap="300">
                  <Text as="h2" variant="headingMd">Top Performing Rules</Text>
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
                  <Text as="h2" variant="headingMd">Quick Actions</Text>
                  <BlockStack gap="200">
                    <Button 
                      url="/app/rules/new" 
                      icon={PlusIcon}
                      textAlign="start"
                      fullWidth
                    >
                      Create New Rule
                    </Button>
                    <Button 
                      url="/app/pet-profiles" 
                      icon={ViewIcon}
                      textAlign="start"
                      fullWidth
                    >
                      View Pet Profiles
                    </Button>
                  </BlockStack>
                </BlockStack>
              </Card>
            </BlockStack>
          </Layout.Section>
        </Layout>

        {/* Popular Breeds */}
        <Layout>
          <Layout.Section>
            <Card>
              <BlockStack gap="400">
                <Text as="h2" variant="headingMd">Popular Breeds</Text>
                <InlineStack gap="400">
                  {analytics.popularBreeds.length === 0 ? (
                    <Text as="p" tone="subdued">Collect pet profiles to see breed distribution.</Text>
                  ) : (
                    analytics.popularBreeds.map((item, i) => (
                      <Box key={i} padding="300" background="bg-surface-secondary" borderRadius="200">
                        <BlockStack gap="100" align="center">
                          <Text as="p" variant="headingSm">{item.count}</Text>
                          <Text as="p" variant="bodySm" tone="subdued">{item.breed}</Text>
                        </BlockStack>
                      </Box>
                    ))
                  )}
                </InlineStack>
              </BlockStack>
            </Card>
          </Layout.Section>
        </Layout>
      </BlockStack>
    </Page>
  );
}
